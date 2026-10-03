import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { MaterialKey, WallSlot } from '../store/useConfigStore';

export interface SceneConfig {
  widthMm: number;
  depthMm: number;
  heightMm: number;
  roofType: 'pulpettak' | 'sadeltak' | 'flackt';
  hasLoft: boolean;
  viewMode: 'utsida' | 'insida';
  material: MaterialKey;
  showDimensions: boolean;
  selectedSlotId: string | null;
  wallSlots: Record<string, WallSlot>;
}

export class HouseScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;

  // Groups
  private houseGroup: THREE.Group;
  private roofGroup: THREE.Group;
  private loftGroup: THREE.Group;
  private wallsGroup: THREE.Group;
  private framingGroup: THREE.Group;
  private dimensionsGroup: THREE.Group;
  private highlightBox: THREE.LineSegments | null = null;
  private hoverBox: THREE.Object3D | null = null;

  private interactivePanels: THREE.Mesh[] = [];
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private animFrameId: number | null = null;
  private currentConfig: SceneConfig;

  // Callbacks for 3D interactions
  public onPanelClick?: (slotId: string, screenX: number, screenY: number) => void;
  public onPanelHover?: (slotId: string | null, screenX: number, screenY: number) => void;
  public onSlotScreenPositionUpdate?: (pos: { x: number; y: number; visible: boolean; slotId: string }) => void;

  constructor(container: HTMLElement, initialConfig?: Partial<SceneConfig>) {
    this.container = container;
    this.currentConfig = {
      widthMm: initialConfig?.widthMm ?? 6040,
      depthMm: initialConfig?.depthMm ?? 3503,
      heightMm: initialConfig?.heightMm ?? 3503,
      roofType: initialConfig?.roofType ?? 'pulpettak',
      hasLoft: initialConfig?.hasLoft ?? false,
      viewMode: initialConfig?.viewMode ?? 'utsida',
      material: initialConfig?.material ?? 'wood',
      showDimensions: initialConfig?.showDimensions ?? true,
      selectedSlotId: initialConfig?.selectedSlotId ?? 'front-1',
      wallSlots: initialConfig?.wallSlots ?? {}
    };

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#f8fafc');

    this.camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      1000
    );
    this.camera.position.set(11, 7.5, 14);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.minDistance = 3.5;
    this.controls.maxDistance = 35;
    this.controls.target.set(0, 1.5, 0);

    this.setupLighting();

    this.houseGroup = new THREE.Group();
    this.wallsGroup = new THREE.Group();
    this.framingGroup = new THREE.Group();
    this.roofGroup = new THREE.Group();
    this.loftGroup = new THREE.Group();
    this.dimensionsGroup = new THREE.Group();

    this.houseGroup.add(this.wallsGroup);
    this.houseGroup.add(this.framingGroup);
    this.houseGroup.add(this.roofGroup);
    this.houseGroup.add(this.loftGroup);
    this.scene.add(this.houseGroup);
    this.scene.add(this.dimensionsGroup);

    this.setupRaycasting();
    this.rebuildScene();
    this.animate();

    window.addEventListener('resize', this.onResize);
  }

  // --- Procedural Canvas Textures for Authentic Scandinavian Timber ---
  private createVerticalPlankTexture(materialKey: MaterialKey): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    const isNaturalWood = materialKey === 'wood';
    const plankW = 64; // ~16 individual timber boards across 1024px
    const plankCount = 1024 / plankW;

    // Authentic Scandinavian Spruce/Pine tone palettes ("Obehandlad Gran")
    const spruceTones = [
      { base: '#f4e7d1', grain: '#dbc5a2', darkGrain: '#be9e71' },
      { base: '#ebdcc2', grain: '#d2bb95', darkGrain: '#b59363' },
      { base: '#f8ecdc', grain: '#e2cfb0', darkGrain: '#c7a77d' },
      { base: '#e6d3b4', grain: '#cdb387', darkGrain: '#af8a55' },
      { base: '#eedfca', grain: '#d7c19f', darkGrain: '#bd9e72' },
      { base: '#e4d0b1', grain: '#cbb085', darkGrain: '#ac8652' },
      { base: '#f2e4cf', grain: '#dbc7a7', darkGrain: '#bfa075' },
      { base: '#ece0cb', grain: '#d5c2a1', darkGrain: '#b99a6f' },
    ];

    let colorPalette: { base: string; grain: string; darkGrain: string };
    if (materialKey === 'falurod') {
      colorPalette = { base: '#892622', grain: '#731c19', darkGrain: '#591310' };
    } else if (materialKey === 'grey') {
      colorPalette = { base: '#64748b', grain: '#475569', darkGrain: '#334155' };
    } else if (materialKey === 'white') {
      colorPalette = { base: '#f8fafc', grain: '#e2e8f0', darkGrain: '#cbd5e1' };
    } else if (materialKey === 'black') {
      colorPalette = { base: '#1e293b', grain: '#0f172a', darkGrain: '#020617' };
    } else {
      colorPalette = spruceTones[0];
    }

    let seed = 42;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // 1. Draw each board with authentic grain & natural knot variations
    for (let p = 0; p < plankCount; p++) {
      const px = p * plankW;
      const tone = isNaturalWood ? spruceTones[p % spruceTones.length] : colorPalette;

      // Base board tone
      ctx.fillStyle = tone.base;
      ctx.fillRect(px, 0, plankW, 1024);

      // Fine longitudinal wood grain fibers
      const fiberCount = 40;
      for (let f = 0; f < fiberCount; f++) {
        const fx = px + rnd() * plankW;
        const wavePeriod = 70 + rnd() * 110;
        const waveAmp = 1.0 + rnd() * 2.0;
        const isDark = rnd() > 0.6;

        ctx.strokeStyle = isDark ? tone.darkGrain : tone.grain;
        ctx.globalAlpha = isDark ? 0.25 : 0.16;
        ctx.lineWidth = 0.8 + rnd() * 0.8;

        ctx.beginPath();
        for (let y = 0; y <= 1024; y += 16) {
          const ox = Math.sin(y / wavePeriod) * waveAmp;
          if (y === 0) ctx.moveTo(fx + ox, y);
          else ctx.lineTo(fx + ox, y);
        }
        ctx.stroke();
      }

      // Earlywood / latewood growth ring bands
      const bandCount = 4 + Math.floor(rnd() * 3);
      for (let b = 0; b < bandCount; b++) {
        const bx = px + rnd() * plankW;
        ctx.fillStyle = tone.grain;
        ctx.globalAlpha = 0.07 + rnd() * 0.05;
        ctx.fillRect(bx - 3, 0, 6, 1024);
      }

      // Natural wood knots (kvistar) on spruce boards
      if (isNaturalWood && rnd() > 0.38) {
        const knotY = 140 + rnd() * 740;
        const knotX = px + 14 + rnd() * (plankW - 28);
        const knotR = 3.5 + rnd() * 6;
        const knotAspect = 1.3 + rnd() * 0.7;

        // Concentric growth deflection rings
        for (let r = knotR * 2.4; r >= knotR; r -= 1.6) {
          ctx.strokeStyle = tone.darkGrain;
          ctx.globalAlpha = 0.22;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(knotX, knotY, r, r * knotAspect, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Dark amber knot center core
        const knotGrad = ctx.createRadialGradient(knotX, knotY, 1, knotX, knotY, knotR);
        knotGrad.addColorStop(0, '#5a381e');
        knotGrad.addColorStop(0.7, '#784a28');
        knotGrad.addColorStop(1, '#a66e3b');
        ctx.fillStyle = knotGrad;
        ctx.globalAlpha = 0.92;
        ctx.beginPath();
        ctx.ellipse(knotX, knotY, knotR, knotR * knotAspect, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dark perimeter ring
        ctx.strokeStyle = '#3b2210';
        ctx.globalAlpha = 0.95;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // 2. Seam shadow groove between planks
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = isNaturalWood ? 'rgba(60, 38, 18, 0.45)' : 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(px + plankW - 2, 0, 2, 1024);

      // Edge bevel highlight
      ctx.fillStyle = isNaturalWood ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(px, 0, 1.2, 1024);

      // 3. Batten (Lockläkt) running vertically along the center of each seam
      const battenW = 14;
      const battenX = px + plankW - battenW / 2;

      // Drop shadow cast by batten to the right
      ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
      ctx.fillRect(battenX + battenW, 0, 3, 1024);

      // Batten face
      ctx.fillStyle = isNaturalWood ? tone.base : colorPalette.base;
      ctx.fillRect(battenX, 0, battenW, 1024);

      // Batten longitudinal grain line
      ctx.strokeStyle = tone.grain;
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(battenX + battenW / 2, 0);
      ctx.lineTo(battenX + battenW / 2, 1024);
      ctx.stroke();

      // Batten highlight on left edge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
      ctx.fillRect(battenX, 0, 1, 1024);

      // Batten shadow on right edge
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.fillRect(battenX + battenW - 1, 0, 1, 1024);
    }

    ctx.globalAlpha = 1.0;
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 2);
    return texture;
  }

  private createVerticalPlankBumpMap(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Midtone neutral base height
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 1024, 1024);

    const plankW = 64;
    const plankCount = 1024 / plankW;

    for (let p = 0; p < plankCount; p++) {
      const px = p * plankW;

      // Slight curvature / bevel on plank board (center elevated)
      const grad = ctx.createLinearGradient(px, 0, px + plankW, 0);
      grad.addColorStop(0, '#757575');
      grad.addColorStop(0.5, '#8c8c8c');
      grad.addColorStop(1, '#707070');
      ctx.fillStyle = grad;
      ctx.fillRect(px, 0, plankW, 1024);

      // Deep groove between planks
      ctx.fillStyle = '#202020';
      ctx.fillRect(px + plankW - 2, 0, 3, 1024);

      // Batten (lockläkt) raised high
      const battenW = 14;
      const battenX = px + plankW - battenW / 2;
      ctx.fillStyle = '#dcdcdc'; // elevated height
      ctx.fillRect(battenX, 0, battenW, 1024);

      // Batten left bevel highlight
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(battenX, 0, 1, 1024);

      // Batten right groove
      ctx.fillStyle = '#404040';
      ctx.fillRect(battenX + battenW, 0, 2, 1024);
    }

    const bumpTexture = new THREE.CanvasTexture(canvas);
    bumpTexture.wrapS = THREE.RepeatWrapping;
    bumpTexture.wrapT = THREE.RepeatWrapping;
    bumpTexture.repeat.set(3, 2);
    return bumpTexture;
  }

  private createPineFloorTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#eaddcf';
    ctx.fillRect(0, 0, 512, 512);

    // Horizontal floorboards
    const boardH = 32;
    for (let y = 0; y < 512; y += boardH) {
      ctx.fillStyle = '#d1c0ae';
      ctx.fillRect(0, y, 512, 1.5);

      // Staggered butt joints
      const jointX = (y % 64 === 0 ? 160 : 340) + ((y * 13) % 80);
      ctx.fillRect(jointX, y, 1.5, boardH);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.72);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff8ee, 1.05);
    sunLight.position.set(16, 24, 14);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 70;
    sunLight.shadow.camera.left = -16;
    sunLight.shadow.camera.right = 16;
    sunLight.shadow.camera.top = 16;
    sunLight.shadow.camera.bottom = -16;
    sunLight.shadow.bias = -0.0003;
    this.scene.add(sunLight);

    const skyFill = new THREE.DirectionalLight(0xe0f2fe, 0.4);
    skyFill.position.set(-14, 16, -10);
    this.scene.add(skyFill);

    // Ground platform
    const groundGeo = new THREE.PlaneGeometry(70, 70);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#f1f5f9',
      roughness: 0.95
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const grid = new THREE.GridHelper(40, 40, '#cbd5e1', '#e2e8f0');
    grid.position.y = 0;
    this.scene.add(grid);
  }

  private setupRaycasting() {
    this.container.addEventListener('pointermove', (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactivePanels, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const slotId = hit.userData.slotId as string;
        if (slotId) {
          this.container.style.cursor = 'pointer';
          this.updateHoverBox(hit);

          const center = new THREE.Vector3();
          new THREE.Box3().setFromObject(hit).getCenter(center);
          const proj = center.clone().project(this.camera);
          const w = this.container.clientWidth;
          const h = this.container.clientHeight;
          const screenX = ((proj.x + 1) * w) / 2;
          const screenY = ((-proj.y + 1) * h) / 2;

          this.onPanelHover?.(slotId, screenX, screenY);
          return;
        }
      }

      this.container.style.cursor = 'default';
      this.updateHoverBox(null);
      this.onPanelHover?.(null, 0, 0);
    });

    this.container.addEventListener('pointerleave', () => {
      this.container.style.cursor = 'default';
      this.updateHoverBox(null);
      this.onPanelHover?.(null, 0, 0);
    });

    this.container.addEventListener('pointerdown', (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactivePanels, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const slotId = hit.userData.slotId as string;
        if (slotId) {
          this.currentConfig.selectedSlotId = slotId;
          this.updateHoverBox(null);
          this.updateHighlightBox(hit);
          this.onPanelClick?.(slotId, e.clientX, e.clientY);
        }
      }
    });
  }

  public rebuildScene() {
    // Clear groups
    while (this.wallsGroup.children.length > 0) {
      this.wallsGroup.remove(this.wallsGroup.children[0]);
    }
    while (this.framingGroup.children.length > 0) {
      this.framingGroup.remove(this.framingGroup.children[0]);
    }
    while (this.roofGroup.children.length > 0) {
      this.roofGroup.remove(this.roofGroup.children[0]);
    }
    while (this.loftGroup.children.length > 0) {
      this.loftGroup.remove(this.loftGroup.children[0]);
    }
    while (this.dimensionsGroup.children.length > 0) {
      this.dimensionsGroup.remove(this.dimensionsGroup.children[0]);
    }
    if (this.highlightBox) {
      this.scene.remove(this.highlightBox);
      this.highlightBox = null;
    }
    this.interactivePanels = [];

    const w = this.currentConfig.widthMm / 1000;
    const d = this.currentConfig.depthMm / 1000;
    const h = this.currentConfig.heightMm / 1000;
    const wallThick = 0.18; // standard 180mm modular wall (145mm stud + 22mm cladding + air gap)

    // Materials - Authentic Scandinavian timber with tactile bump map
    const wallTexture = this.createVerticalPlankTexture(this.currentConfig.material);
    const wallBumpMap = this.createVerticalPlankBumpMap();
    const floorTexture = this.createPineFloorTexture();

    const exteriorMat = new THREE.MeshStandardMaterial({
      map: wallTexture,
      bumpMap: wallBumpMap,
      bumpScale: 0.04,
      roughness: 0.72,
      metalness: 0.02
    });

    const framingMat = new THREE.MeshStandardMaterial({
      color: '#eedec5',
      roughness: 0.65,
      metalness: 0.02
    });

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.55
    });

    const trimMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.4
    });

    const foundationMat = new THREE.MeshStandardMaterial({
      color: '#94a3b8',
      roughness: 0.95
    });

    // 1. Concrete slab foundation
    const slabGeo = new THREE.BoxGeometry(w + 0.35, 0.25, d + 0.35);
    const slab = new THREE.Mesh(slabGeo, foundationMat);
    slab.position.set(0, 0.125, 0);
    slab.receiveShadow = true;
    slab.castShadow = true;
    this.wallsGroup.add(slab);

    // 2. Interior Floor
    const floorGeo = new THREE.BoxGeometry(w - 0.28, 0.05, d - 0.28);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, 0.275, 0);
    floor.receiveShadow = true;
    this.wallsGroup.add(floor);

    // 3. Modular Exterior Walls Construction (outer wood siding, inside left open for beams)
    this.buildModularWall('front', 4, w, d, h, wallThick, exteriorMat, trimMat);
    this.buildModularWall('back', 4, w, d, h, wallThick, exteriorMat, trimMat);
    this.buildModularWall('left', 3, w, d, h, wallThick, exteriorMat, trimMat);
    this.buildModularWall('right', 3, w, d, h, wallThick, exteriorMat, trimMat);

    // 4. Proper Architectural Timber Framing (Syll, Hammarband, Reglar cc 600, Avväxlingar)
    this.buildTimberFraming(w, d, h, wallThick, framingMat);

    // 5. Roof Construction
    this.buildRoof(w, d, h);

    // 6. Exposed Roof Rafters (Taksparrar cc 600)
    this.buildRafters(w, d, h, wallThick);

    // 7. Loft Construction
    if (this.currentConfig.hasLoft) {
      this.buildLoft(w, d, h, wallThick);
    }

    // 8. 3D Architectural Dimensions
    this.buildDimensionLines(w, d, h);

    // View mode visibility
    this.applyViewMode();
  }

  private buildModularWall(
    wallSide: 'front' | 'back' | 'left' | 'right',
    panelCount: number,
    w: number,
    d: number,
    h: number,
    wallThick: number,
    exteriorMat: THREE.Material,
    trimMat: THREE.Material
  ) {
    const isFrontOrBack = wallSide === 'front' || wallSide === 'back';
    const wallLength = isFrontOrBack ? w : d - wallThick * 2;
    const panelWidth = wallLength / panelCount;
    const wallHeight = h - 0.25;
    const wallY = 0.25 + wallHeight / 2;

    for (let i = 0; i < panelCount; i++) {
      const slotId = `${wallSide}-${i}`;
      const slot = this.currentConfig.wallSlots[slotId];
      const slotType = slot?.type ?? 'empty';

      // Panel center coordinates
      let px = 0;
      let pz = 0;
      let rotY = 0;

      if (wallSide === 'front') {
        px = -w / 2 + panelWidth / 2 + i * panelWidth;
        pz = d / 2 - wallThick / 2;
        rotY = 0;
      } else if (wallSide === 'back') {
        px = w / 2 - panelWidth / 2 - i * panelWidth;
        pz = -d / 2 + wallThick / 2;
        rotY = Math.PI;
      } else if (wallSide === 'left') {
        px = -w / 2 + wallThick / 2;
        pz = d / 2 - wallThick - panelWidth / 2 - i * panelWidth;
        rotY = -Math.PI / 2;
      } else {
        px = w / 2 - wallThick / 2;
        pz = -d / 2 + wallThick + panelWidth / 2 + i * panelWidth;
        rotY = Math.PI / 2;
      }

      // Panel Group
      const panelGroup = new THREE.Group();
      panelGroup.position.set(px, wallY, pz);
      panelGroup.rotation.y = rotY;

      // Base wall mesh - Exterior Cladding Layer (25 mm real timber boards on outside face)
      // The interior side remains open, exposing the timber framing beams (no inner panels yet!)
      let activeMesh: THREE.Mesh;
      const claddingThick = 0.025;
      const claddingZ = wallThick / 2 - claddingThick / 2;

      if (slot?.isUpper) {
        // Upper section mesh (for window placement, matching Image 1)
        const upperH = wallHeight * 0.46;
        const upperGeo = new THREE.BoxGeometry(panelWidth, upperH, claddingThick);
        const upperMesh = new THREE.Mesh(upperGeo, exteriorMat);
        upperMesh.position.set(0, wallHeight / 2 - upperH / 2, claddingZ);
        upperMesh.castShadow = true;
        upperMesh.receiveShadow = true;
        upperMesh.userData = { slotId, wall: wallSide, index: i, isUpper: true };
        panelGroup.add(upperMesh);
        this.interactivePanels.push(upperMesh);
        activeMesh = upperMesh;

        // Lower solid section
        const lowerH = wallHeight - upperH;
        const lowerGeo = new THREE.BoxGeometry(panelWidth, lowerH, claddingThick);
        const lowerMesh = new THREE.Mesh(lowerGeo, exteriorMat);
        lowerMesh.position.set(0, -wallHeight / 2 + lowerH / 2, claddingZ);
        lowerMesh.castShadow = true;
        lowerMesh.receiveShadow = true;
        panelGroup.add(lowerMesh);
      } else {
        const panelGeo = new THREE.BoxGeometry(panelWidth, wallHeight, claddingThick);
        const panelMesh = new THREE.Mesh(panelGeo, exteriorMat);
        panelMesh.position.set(0, 0, claddingZ);
        panelMesh.castShadow = true;
        panelMesh.receiveShadow = true;
        panelMesh.userData = { slotId, wall: wallSide, index: i, isUpper: false };
        panelGroup.add(panelMesh);
        this.interactivePanels.push(panelMesh);
        activeMesh = panelMesh;
      }

      // Subtle modular joint vertical trim line between panels for clear visual segmentation
      const jointGeo = new THREE.BoxGeometry(0.012, wallHeight + 0.02, 0.035);
      const jointMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.8 });
      const jointMesh = new THREE.Mesh(jointGeo, jointMat);
      jointMesh.position.set(panelWidth / 2, 0, claddingZ + 0.01);
      panelGroup.add(jointMesh);

      // Horizontal mid-trim line (white mid-rib matching Skånska Byggvaror)
      const midRibGeo = new THREE.BoxGeometry(panelWidth, 0.06, 0.04);
      const midRib = new THREE.Mesh(midRibGeo, trimMat);
      midRib.position.set(0, 0.05, claddingZ + 0.02);
      midRib.castShadow = true;
      panelGroup.add(midRib);

      // Decorate panel based on assigned slot item
      if (slotType === 'door') {
        this.addDoorFeature(panelGroup, panelWidth, wallHeight, wallThick, slot?.itemId);
      } else if (slotType === 'window') {
        this.addWindowFeature(panelGroup, panelWidth, wallHeight, wallThick, slot?.itemId);
      } else if (slotType === 'gate') {
        this.addGateFeature(panelGroup, panelWidth, wallHeight, wallThick, slot?.itemId);
      }

      this.wallsGroup.add(panelGroup);

      // Check if this slot is selected to place the green highlight outline
      if (slotId === this.currentConfig.selectedSlotId) {
        this.updateHighlightBox(activeMesh);
      }
    }
  }

  // --- Proper Architectural Timber Framing (Regelstomme 45x145 mm) ---
  private buildTimberFraming(w: number, d: number, h: number, wallThick: number, framingMat: THREE.Material) {
    const studThick = 0.045; // 45 mm
    const studDepth = 0.145; // 145 mm
    const baseElevation = 0.25; // on top of slab foundation
    const rearH = this.currentConfig.roofType === 'pulpettak'
      ? Math.max(h - Math.tan((8 * Math.PI) / 180) * d, 2.4)
      : h;

    // 1. Bottom Sill Plates (Syll 45x145 mm)
    // Front sill
    const frontSyllGeo = new THREE.BoxGeometry(w, studThick, studDepth);
    const frontSyll = new THREE.Mesh(frontSyllGeo, framingMat);
    frontSyll.position.set(0, baseElevation + studThick / 2, d / 2 - studDepth / 2);
    frontSyll.castShadow = true;
    this.framingGroup.add(frontSyll);

    // Back sill
    const backSyll = new THREE.Mesh(frontSyllGeo, framingMat);
    backSyll.position.set(0, baseElevation + studThick / 2, -d / 2 + studDepth / 2);
    backSyll.castShadow = true;
    this.framingGroup.add(backSyll);

    // Left sill
    const sideSyllGeo = new THREE.BoxGeometry(studDepth, studThick, d - studDepth * 2);
    const leftSyll = new THREE.Mesh(sideSyllGeo, framingMat);
    leftSyll.position.set(-w / 2 + studDepth / 2, baseElevation + studThick / 2, 0);
    leftSyll.castShadow = true;
    this.framingGroup.add(leftSyll);

    // Right sill
    const rightSyll = new THREE.Mesh(sideSyllGeo, framingMat);
    rightSyll.position.set(w / 2 - studDepth / 2, baseElevation + studThick / 2, 0);
    rightSyll.castShadow = true;
    this.framingGroup.add(rightSyll);

    // 2. Top Header Plates (Hammarband / Toppsyll 45x145 mm)
    // Front header
    const frontHeaderGeo = new THREE.BoxGeometry(w, studThick, studDepth);
    const frontHeader = new THREE.Mesh(frontHeaderGeo, framingMat);
    frontHeader.position.set(0, h - studThick / 2, d / 2 - studDepth / 2);
    frontHeader.castShadow = true;
    this.framingGroup.add(frontHeader);

    // Back header (at rear slope height)
    const backHeader = new THREE.Mesh(frontHeaderGeo, framingMat);
    backHeader.position.set(0, rearH - studThick / 2, -d / 2 + studDepth / 2);
    backHeader.castShadow = true;
    this.framingGroup.add(backHeader);

    // Sloping side headers on left and right connecting front to rear
    const slopeLen = Math.sqrt(Math.pow(d - studDepth * 2, 2) + Math.pow(h - rearH, 2));
    const slopeAngle = Math.atan2(h - rearH, d - studDepth * 2);
    const sideHeaderGeo = new THREE.BoxGeometry(studDepth, studThick, slopeLen);

    const leftHeader = new THREE.Mesh(sideHeaderGeo, framingMat);
    leftHeader.position.set(-w / 2 + studDepth / 2, (h + rearH) / 2 - studThick / 2, 0);
    leftHeader.rotation.x = slopeAngle;
    leftHeader.castShadow = true;
    this.framingGroup.add(leftHeader);

    const rightHeader = new THREE.Mesh(sideHeaderGeo, framingMat);
    rightHeader.position.set(w / 2 - studDepth / 2, (h + rearH) / 2 - studThick / 2, 0);
    rightHeader.rotation.x = slopeAngle;
    rightHeader.castShadow = true;
    this.framingGroup.add(rightHeader);

    // 3. Vertical Wall Studs (Väggreglar cc 600 mm)
    // Corner Studs (dubbla hörnreglar)
    const cornerPositions = [
      { x: -w / 2 + studDepth / 2, z: d / 2 - studDepth / 2, height: h },
      { x: w / 2 - studDepth / 2, z: d / 2 - studDepth / 2, height: h },
      { x: -w / 2 + studDepth / 2, z: -d / 2 + studDepth / 2, height: rearH },
      { x: w / 2 - studDepth / 2, z: -d / 2 + studDepth / 2, height: rearH }
    ];
    cornerPositions.forEach((cp) => {
      const studH = cp.height - baseElevation - studThick * 2;
      const cGeo = new THREE.BoxGeometry(studThick, studH, studDepth);
      const cMesh = new THREE.Mesh(cGeo, framingMat);
      cMesh.position.set(cp.x, baseElevation + studThick + studH / 2, cp.z);
      cMesh.castShadow = true;
      this.framingGroup.add(cMesh);
    });

    // Front Wall Studs with framing around door and window openings
    const frontStudCount = Math.floor(w / 0.6);
    const frontSpacing = w / frontStudCount;
    const frontStudH = h - baseElevation - studThick * 2;

    for (let s = 1; s < frontStudCount; s++) {
      const sx = -w / 2 + s * frontSpacing;

      // Check slot status at this position
      const panelIndex = Math.min(Math.floor(((sx + w / 2) / w) * 4), 3);
      const slot = this.currentConfig.wallSlots[`front-${panelIndex}`];
      const panelCenter = -w / 2 + (panelIndex + 0.5) * (w / 4);

      // If this stud falls within a door opening (~1.0m width)
      if (slot?.type === 'door' && Math.abs(sx - panelCenter) < 0.45) {
        // Cripple stud above door lintel
        const lintelTop = baseElevation + 2.15;
        const crippleH = h - studThick - lintelTop;
        if (crippleH > 0.05) {
          const cripple = new THREE.Mesh(new THREE.BoxGeometry(studThick, crippleH, studDepth), framingMat);
          cripple.position.set(sx, lintelTop + crippleH / 2, d / 2 - studDepth / 2);
          cripple.castShadow = true;
          this.framingGroup.add(cripple);
        }
        continue;
      }

      // If this stud falls within a window opening
      if (slot?.type === 'window' && Math.abs(sx - panelCenter) < 0.45) {
        const sillY = baseElevation + 0.9;
        const lintelY = baseElevation + 2.1;

        // Cripple stud below window sill
        const bottomCrippleH = sillY - (baseElevation + studThick);
        if (bottomCrippleH > 0.05) {
          const bCripple = new THREE.Mesh(new THREE.BoxGeometry(studThick, bottomCrippleH, studDepth), framingMat);
          bCripple.position.set(sx, baseElevation + studThick + bottomCrippleH / 2, d / 2 - studDepth / 2);
          bCripple.castShadow = true;
          this.framingGroup.add(bCripple);
        }

        // Cripple stud above window lintel
        const topCrippleH = h - studThick - lintelY;
        if (topCrippleH > 0.05) {
          const tCripple = new THREE.Mesh(new THREE.BoxGeometry(studThick, topCrippleH, studDepth), framingMat);
          tCripple.position.set(sx, lintelY + topCrippleH / 2, d / 2 - studDepth / 2);
          tCripple.castShadow = true;
          this.framingGroup.add(tCripple);
        }
        continue;
      }

      // Standard vertical wall stud
      const studMesh = new THREE.Mesh(new THREE.BoxGeometry(studThick, frontStudH, studDepth), framingMat);
      studMesh.position.set(sx, baseElevation + studThick + frontStudH / 2, d / 2 - studDepth / 2);
      studMesh.castShadow = true;
      this.framingGroup.add(studMesh);
    }

    // Door and Window Trimmer Studs and Lintel Beams (Avväxlingar) on front wall
    for (let p = 0; p < 4; p++) {
      const slot = this.currentConfig.wallSlots[`front-${p}`];
      const pc = -w / 2 + (p + 0.5) * (w / 4);

      if (slot?.type === 'door') {
        const doorW = 1.0;
        const doorH = 2.1;
        // Trimmer studs (smygreglar) left and right of door
        [-doorW / 2 - studThick / 2, doorW / 2 + studThick / 2].forEach((tx) => {
          const trimmer = new THREE.Mesh(new THREE.BoxGeometry(studThick, doorH, studDepth), framingMat);
          trimmer.position.set(pc + tx, baseElevation + studThick + doorH / 2, d / 2 - studDepth / 2);
          trimmer.castShadow = true;
          this.framingGroup.add(trimmer);
        });

        // Horizontal Lintel Beam (Bärande avväxlingsbalk 45x145 mm)
        const lintelGeo = new THREE.BoxGeometry(doorW + studThick * 2, studThick * 2, studDepth);
        const lintel = new THREE.Mesh(lintelGeo, framingMat);
        lintel.position.set(pc, baseElevation + studThick + doorH + studThick, d / 2 - studDepth / 2);
        lintel.castShadow = true;
        this.framingGroup.add(lintel);
      } else if (slot?.type === 'window') {
        const winW = 1.0;
        const winH = 1.2;
        const sillY = baseElevation + 0.9;
        const lintelY = sillY + winH;

        // Trimmer studs left and right of window
        [-winW / 2 - studThick / 2, winW / 2 + studThick / 2].forEach((tx) => {
          const trimmer = new THREE.Mesh(new THREE.BoxGeometry(studThick, winH, studDepth), framingMat);
          trimmer.position.set(pc + tx, sillY + winH / 2, d / 2 - studDepth / 2);
          trimmer.castShadow = true;
          this.framingGroup.add(trimmer);
        });

        // Sill beam (fönsterbänk / underregel)
        const sillGeo = new THREE.BoxGeometry(winW + studThick * 2, studThick, studDepth);
        const sill = new THREE.Mesh(sillGeo, framingMat);
        sill.position.set(pc, sillY - studThick / 2, d / 2 - studDepth / 2);
        sill.castShadow = true;
        this.framingGroup.add(sill);

        // Lintel beam (avväxlingsbalk)
        const lintelGeo = new THREE.BoxGeometry(winW + studThick * 2, studThick * 2, studDepth);
        const lintel = new THREE.Mesh(lintelGeo, framingMat);
        lintel.position.set(pc, lintelY + studThick, d / 2 - studDepth / 2);
        lintel.castShadow = true;
        this.framingGroup.add(lintel);
      }
    }

    // Rear Wall Studs cc 600 mm
    const rearStudH = rearH - baseElevation - studThick * 2;
    for (let s = 1; s < frontStudCount; s++) {
      const sx = -w / 2 + s * frontSpacing;
      const studMesh = new THREE.Mesh(new THREE.BoxGeometry(studThick, rearStudH, studDepth), framingMat);
      studMesh.position.set(sx, baseElevation + studThick + rearStudH / 2, -d / 2 + studDepth / 2);
      studMesh.castShadow = true;
      this.framingGroup.add(studMesh);
    }

    // Left and Right Wall Studs (interpolating height along roof slope)
    const sideStudCount = Math.floor((d - studDepth * 2) / 0.6);
    const sideSpacing = (d - studDepth * 2) / sideStudCount;

    for (let s = 1; s < sideStudCount; s++) {
      const sz = d / 2 - studDepth - s * sideSpacing;
      const progress = (d / 2 - sz) / d; // 0 at front, 1 at back
      const curH = h - progress * (h - rearH);
      const curStudH = curH - baseElevation - studThick * 2;

      // Left stud
      const leftStud = new THREE.Mesh(new THREE.BoxGeometry(studDepth, curStudH, studThick), framingMat);
      leftStud.position.set(-w / 2 + studDepth / 2, baseElevation + studThick + curStudH / 2, sz);
      leftStud.castShadow = true;
      this.framingGroup.add(leftStud);

      // Right stud
      const rightStud = new THREE.Mesh(new THREE.BoxGeometry(studDepth, curStudH, studThick), framingMat);
      rightStud.position.set(w / 2 - studDepth / 2, baseElevation + studThick + curStudH / 2, sz);
      rightStud.castShadow = true;
      this.framingGroup.add(rightStud);
    }
  }


  private addDoorFeature(parent: THREE.Group, pw: number, ph: number, wt: number, doorId?: string) {
    // Cutout opening simulation
    const doorW = 1.0;
    const doorH = 2.1;
    const doorY = -ph / 2 + doorH / 2;

    // Door Frame
    const frameGeo = new THREE.BoxGeometry(doorW + 0.08, doorH + 0.04, wt + 0.06);
    const frameMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, doorY, 0);
    parent.add(frame);

    // Door Leaf
    const leafGeo = new THREE.BoxGeometry(doorW, doorH, 0.08);
    const leafMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.35 });
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(0, doorY, wt / 2 + 0.02);
    leaf.castShadow = true;
    parent.add(leaf);

    // Glass insert
    const glassGeo = new THREE.BoxGeometry(doorId === 'SVANSHALL' ? 0.35 : 0.16, doorId === 'SVANSHALL' ? 1.6 : 0.9, 0.02);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#e0f2fe',
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      transmission: 0.9
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, doorY + 0.25, wt / 2 + 0.07);
    parent.add(glass);

    // Handle
    const handleGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.12);
    const handleMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.8, roughness: 0.2 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0.38, doorY, wt / 2 + 0.09);
    parent.add(handle);
  }

  private addWindowFeature(parent: THREE.Group, pw: number, ph: number, wt: number, windowId?: string) {
    const winW = 1.0;
    const winH = 1.2;
    const winY = 0.1;

    // Window Frame
    const frameGeo = new THREE.BoxGeometry(winW + 0.08, winH + 0.08, wt + 0.06);
    const frameMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, winY, 0);
    parent.add(frame);

    // Glass Pane
    const glassGeo = new THREE.BoxGeometry(winW, winH, 0.02);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#dbeafe',
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      transmission: 0.95
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, winY, wt / 2 + 0.02);
    parent.add(glass);

    // Mullions (spröjs)
    if (windowId === 'sprojat') {
      const mullionMat = new THREE.MeshStandardMaterial({ color: '#ffffff' });
      const vertMullion = new THREE.Mesh(new THREE.BoxGeometry(0.03, winH, 0.04), mullionMat);
      vertMullion.position.set(0, winY, wt / 2 + 0.03);
      parent.add(vertMullion);

      const horizMullion = new THREE.Mesh(new THREE.BoxGeometry(winW, 0.03, 0.04), mullionMat);
      horizMullion.position.set(0, winY, wt / 2 + 0.03);
      parent.add(horizMullion);
    }
  }

  private addGateFeature(parent: THREE.Group, pw: number, ph: number, wt: number, gateId?: string) {
    const gateW = pw * 0.9;
    const gateH = ph * 0.85;
    const gateY = -ph / 2 + gateH / 2;

    const gateGeo = new THREE.BoxGeometry(gateW, gateH, wt + 0.05);
    const isDark = gateId === 'overhead';
    const gateMat = new THREE.MeshStandardMaterial({
      color: isDark ? '#334155' : '#f8fafc',
      roughness: 0.4
    });
    const gateMesh = new THREE.Mesh(gateGeo, gateMat);
    gateMesh.position.set(0, gateY, 0);
    parent.add(gateMesh);

    // Sectional horizontal ribs
    for (let r = -gateH / 2 + 0.4; r < gateH / 2; r += 0.45) {
      const ribGeo = new THREE.BoxGeometry(gateW, 0.02, wt + 0.07);
      const ribMat = new THREE.MeshStandardMaterial({ color: '#0f172a' });
      const rib = new THREE.Mesh(ribGeo, ribMat);
      rib.position.set(0, gateY + r, 0);
      parent.add(rib);
    }
  }

  private buildRoof(w: number, d: number, h: number) {
    const roofType = this.currentConfig.roofType;
    const overhang = 0.4;
    const roofMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      roughness: 0.35,
      metalness: 0.25
    });

    if (roofType === 'sadeltak') {
      const ridgeHeight = 1.25;
      const roofLen = d + overhang * 2;
      const halfW = (w / 2 + overhang) * 1.08;

      const slopeGeo = new THREE.BoxGeometry(halfW, 0.16, roofLen);

      const leftSlope = new THREE.Mesh(slopeGeo, roofMat);
      leftSlope.position.set(-halfW / 2 + 0.1, h + ridgeHeight / 2, 0);
      leftSlope.rotation.z = 0.38;
      leftSlope.castShadow = true;
      this.roofGroup.add(leftSlope);

      const rightSlope = new THREE.Mesh(slopeGeo, roofMat);
      rightSlope.position.set(halfW / 2 - 0.1, h + ridgeHeight / 2, 0);
      rightSlope.rotation.z = -0.38;
      rightSlope.castShadow = true;
      this.roofGroup.add(rightSlope);
    } else if (roofType === 'flackt') {
      const flatGeo = new THREE.BoxGeometry(w + 0.3, 0.22, d + 0.3);
      const flatMesh = new THREE.Mesh(flatGeo, roofMat);
      flatMesh.position.set(0, h + 0.11, 0);
      flatMesh.castShadow = true;
      this.roofGroup.add(flatMesh);
    } else {
      // Pulpettak 8° (matching Skånska Byggvaror configurator)
      const angleRad = (8 * Math.PI) / 180;
      const roofGeo = new THREE.BoxGeometry(w + overhang * 2, 0.18, d + overhang * 2);
      const roofMesh = new THREE.Mesh(roofGeo, roofMat);
      roofMesh.position.set(0, h + 0.22, 0);
      roofMesh.rotation.x = angleRad;
      roofMesh.castShadow = true;
      this.roofGroup.add(roofMesh);
    }
  }

  private buildRafters(w: number, d: number, h: number, _wt: number) {
    const rafterMat = new THREE.MeshStandardMaterial({
      color: '#eedec5',
      roughness: 0.65,
      metalness: 0.02
    });

    const isPulpettak = this.currentConfig.roofType === 'pulpettak';
    const rearH = isPulpettak
      ? Math.max(h - Math.tan((8 * Math.PI) / 180) * d, 2.4)
      : h;

    // Rafter dimensions: 45 x 195 mm structural Scandinavian timber
    const rafterW = 0.045;
    const rafterH = 0.195;
    const count = Math.floor(w / 0.6) + 1; // cc 600 mm
    const spacing = w / (count - 1);

    if (isPulpettak) {
      const slopeAngle = Math.atan2(h - rearH, d);
      const slopeLen = Math.sqrt(Math.pow(d, 2) + Math.pow(h - rearH, 2)) + 0.35;
      const rafterGeo = new THREE.BoxGeometry(rafterW, rafterH, slopeLen);

      for (let i = 0; i < count; i++) {
        const rx = -w / 2 + i * spacing;
        const rafter = new THREE.Mesh(rafterGeo, rafterMat);
        rafter.position.set(rx, (h + rearH) / 2 + 0.08, 0);
        rafter.rotation.x = slopeAngle;
        rafter.castShadow = true;
        this.framingGroup.add(rafter);
      }
    } else {
      // Gable roof (sadeltak) rafters meeting at ridge
      const slopeLen = Math.sqrt(Math.pow(d / 2, 2) + Math.pow(0.9, 2)) + 0.25;
      const slopeAngle = Math.atan2(0.9, d / 2);
      const rafterGeo = new THREE.BoxGeometry(rafterW, rafterH, slopeLen);

      for (let i = 0; i < count; i++) {
        const rx = -w / 2 + i * spacing;
        // Front slope rafter
        const frontRafter = new THREE.Mesh(rafterGeo, rafterMat);
        frontRafter.position.set(rx, h + 0.45, d / 4);
        frontRafter.rotation.x = slopeAngle;
        frontRafter.castShadow = true;
        this.framingGroup.add(frontRafter);

        // Rear slope rafter
        const rearRafter = new THREE.Mesh(rafterGeo, rafterMat);
        rearRafter.position.set(rx, h + 0.45, -d / 4);
        rearRafter.rotation.x = -slopeAngle;
        rearRafter.castShadow = true;
        this.framingGroup.add(rearRafter);
      }
    }
  }

  private buildLoft(w: number, d: number, h: number, wt: number) {
    const loftW = w * 0.45;
    const loftD = d - wt * 2 - 0.1;
    const loftH = 0.12;
    const loftElev = h * 0.58;

    const pineMat = new THREE.MeshStandardMaterial({ color: '#d9bf98', roughness: 0.5 });

    // Loft floor slab
    const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(loftW, loftH, loftD), pineMat);
    floorMesh.position.set(-w / 2 + wt + loftW / 2, loftElev, 0);
    floorMesh.receiveShadow = true;
    floorMesh.castShadow = true;
    this.loftGroup.add(floorMesh);

    // Safety Rail
    const railX = -w / 2 + wt + loftW;
    const postCount = 4;
    for (let i = 0; i < postCount; i++) {
      const pz = -loftD / 2 + (loftD / (postCount - 1)) * i;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.7, 0.04), pineMat);
      post.position.set(railX, loftElev + 0.35, pz);
      this.loftGroup.add(post);
    }

    const handrail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, loftD), pineMat);
    handrail.position.set(railX, loftElev + 0.7, 0);
    this.loftGroup.add(handrail);
  }

  // --- Dimension Lines with 3D/Screen Coordinate Projection ---
  private buildDimensionLines(w: number, d: number, h: number) {
    const dimMat = new THREE.LineBasicMaterial({ color: '#1e293b', linewidth: 1.5 });
    const offset = 0.65;

    // 1. Front Width Dimension Line (bottom)
    const yFront = 0.05;
    const zFront = d / 2 + offset;
    const frontLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-w / 2, yFront, zFront),
      new THREE.Vector3(w / 2, yFront, zFront)
    ]);
    this.dimensionsGroup.add(new THREE.Line(frontLineGeo, dimMat));

    // Width Extension lines
    this.dimensionsGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-w / 2, yFront, d / 2 + 0.1),
          new THREE.Vector3(-w / 2, yFront, zFront + 0.15)
        ]),
        dimMat
      )
    );
    this.dimensionsGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(w / 2, yFront, d / 2 + 0.1),
          new THREE.Vector3(w / 2, yFront, zFront + 0.15)
        ]),
        dimMat
      )
    );

    // 2. Right Front Height Dimension Line
    const xRight = w / 2 + offset;
    const zRight = d / 2;
    const rightHeightGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(xRight, 0.2, zRight),
      new THREE.Vector3(xRight, h, zRight)
    ]);
    this.dimensionsGroup.add(new THREE.Line(rightHeightGeo, dimMat));

    this.dimensionsGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(w / 2 + 0.1, 0.2, zRight),
          new THREE.Vector3(xRight + 0.15, 0.2, zRight)
        ]),
        dimMat
      )
    );
    this.dimensionsGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(w / 2 + 0.1, h, zRight),
          new THREE.Vector3(xRight + 0.15, h, zRight)
        ]),
        dimMat
      )
    );

    // 3. Left Front Height Dimension Line (matching Image 3)
    const xLeft = -w / 2 - offset;
    const leftHeightGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(xLeft, 0.2, zRight),
      new THREE.Vector3(xLeft, h, zRight)
    ]);
    this.dimensionsGroup.add(new THREE.Line(leftHeightGeo, dimMat));

    this.dimensionsGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-w / 2 - 0.1, 0.2, zRight),
          new THREE.Vector3(xLeft - 0.15, 0.2, zRight)
        ]),
        dimMat
      )
    );
    this.dimensionsGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-w / 2 - 0.1, h, zRight),
          new THREE.Vector3(xLeft - 0.15, h, zRight)
        ]),
        dimMat
      )
    );

    // 4. Rear Height Dimension Line (for Pulpettak, matching Image 4)
    if (this.currentConfig.roofType === 'pulpettak') {
      const angleRad = (8 * Math.PI) / 180;
      const drop = Math.tan(angleRad) * d;
      const rearH = Math.max(h - drop, 2.4);
      const zRear = -d / 2;
      const rearHeightGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xLeft, 0.2, zRear),
        new THREE.Vector3(xLeft, rearH, zRear)
      ]);
      this.dimensionsGroup.add(new THREE.Line(rearHeightGeo, dimMat));

      this.dimensionsGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-w / 2 - 0.1, 0.2, zRear),
            new THREE.Vector3(xLeft - 0.15, 0.2, zRear)
          ]),
          dimMat
        )
      );
      this.dimensionsGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-w / 2 - 0.1, rearH, zRear),
            new THREE.Vector3(xLeft - 0.15, rearH, zRear)
          ]),
          dimMat
        )
      );

      // 5. Roof pitch angle indicator lines (matching Image 4)
      const roofAngleLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xLeft, h + 0.35, 0.4),
        new THREE.Vector3(xLeft, h + 0.35 - Math.tan(angleRad) * 0.8, -0.4)
      ]);
      const angleMat = new THREE.LineBasicMaterial({ color: '#0f172a', linewidth: 2 });
      this.dimensionsGroup.add(new THREE.Line(roofAngleLineGeo, angleMat));

      const baseAngleLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xLeft, h + 0.35 - Math.tan(angleRad) * 0.8, 0.4),
        new THREE.Vector3(xLeft, h + 0.35 - Math.tan(angleRad) * 0.8, -0.4)
      ]);
      this.dimensionsGroup.add(new THREE.Line(baseAngleLineGeo, dimMat));
    }

    this.dimensionsGroup.visible = this.currentConfig.showDimensions;
  }

  private updateHighlightBox(targetMesh: THREE.Mesh | null) {
    if (this.highlightBox) {
      this.scene.remove(this.highlightBox);
      this.highlightBox = null;
    }
    if (!targetMesh) return;

    const bbox = new THREE.Box3().setFromObject(targetMesh);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bbox.getSize(size);
    bbox.getCenter(center);

    // Green outline wireframe matching Skånska Byggvaror (#16a34a)
    const boxGeo = new THREE.BoxGeometry(size.x + 0.04, size.y + 0.04, size.z + 0.04);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: '#16a34a', linewidth: 3.5 });

    this.highlightBox = new THREE.LineSegments(edges, lineMat);
    this.highlightBox.position.copy(center);
    this.scene.add(this.highlightBox);
  }

  private updateHoverBox(targetMesh: THREE.Mesh | null) {
    if (this.hoverBox) {
      this.scene.remove(this.hoverBox);
      this.hoverBox = null;
    }
    if (!targetMesh) return;
    if (targetMesh.userData.slotId === this.currentConfig.selectedSlotId) return;

    const bbox = new THREE.Box3().setFromObject(targetMesh);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bbox.getSize(size);
    bbox.getCenter(center);

    const group = new THREE.Group();

    // Vibrant emerald outline for hover to make panel selection unmistakably obvious
    const boxGeo = new THREE.BoxGeometry(size.x + 0.04, size.y + 0.04, size.z + 0.04);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({
      color: '#10b981',
      linewidth: 3
    });
    group.add(new THREE.LineSegments(edges, lineMat));

    // Luminous emerald translucent face glow
    const glowMat = new THREE.MeshBasicMaterial({
      color: '#10b981',
      transparent: true,
      opacity: 0.18,
      depthWrite: false
    });
    const faceMesh = new THREE.Mesh(boxGeo, glowMat);
    group.add(faceMesh);

    group.position.copy(center);
    this.hoverBox = group;
    this.scene.add(this.hoverBox);
  }

  public updateConfig(config: Partial<SceneConfig>) {
    Object.assign(this.currentConfig, config);
    this.rebuildScene();
  }

  public setViewMode(mode: 'utsida' | 'insida') {
    this.currentConfig.viewMode = mode;
    this.applyViewMode();
  }

  private applyViewMode() {
    if (this.currentConfig.viewMode === 'insida') {
      this.roofGroup.visible = false;
      this.camera.position.set(2.5, 7.2, 5.8);
      this.controls.target.set(0, 1.0, 0);
    } else {
      this.roofGroup.visible = true;
      this.camera.position.set(11, 7.5, 14);
      this.controls.target.set(0, 1.5, 0);
    }
    this.controls.update();
  }

  public zoomIn() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    this.camera.position.addScaledVector(dir, 1.5);
    this.controls.update();
  }

  public zoomOut() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    this.camera.position.addScaledVector(dir, -1.5);
    this.controls.update();
  }

  public getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    // Update screen coordinates of selected panel for dynamic overlay tracking
    if (this.currentConfig.selectedSlotId && this.onSlotScreenPositionUpdate) {
      const mesh = this.interactivePanels.find(
        (m) => m.userData.slotId === this.currentConfig.selectedSlotId
      );
      if (mesh) {
        const center = new THREE.Vector3();
        new THREE.Box3().setFromObject(mesh).getCenter(center);
        const proj = center.clone().project(this.camera);
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        const x = ((proj.x + 1) * w) / 2;
        const y = ((-proj.y + 1) * h) / 2;
        const visible = proj.z < 1;

        this.onSlotScreenPositionUpdate({
          x,
          y,
          visible,
          slotId: this.currentConfig.selectedSlotId
        });
      }
    }
  };

  private onResize = () => {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / Math.max(this.container.clientHeight, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  public destroy() {
    window.removeEventListener('resize', this.onResize);
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.renderer.dispose();
  }
}
