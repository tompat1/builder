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
  private dimensionsGroup: THREE.Group;
  private highlightBox: THREE.LineSegments | null = null;

  private interactivePanels: THREE.Mesh[] = [];
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private animFrameId: number | null = null;
  private currentConfig: SceneConfig;

  // Callback when a wall panel is clicked
  public onPanelClick?: (slotId: string, screenX: number, screenY: number) => void;

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
    this.roofGroup = new THREE.Group();
    this.loftGroup = new THREE.Group();
    this.dimensionsGroup = new THREE.Group();

    this.houseGroup.add(this.wallsGroup);
    this.houseGroup.add(this.roofGroup);
    this.houseGroup.add(this.loftGroup);
    this.scene.add(this.houseGroup);
    this.scene.add(this.dimensionsGroup);

    this.setupRaycasting();
    this.rebuildScene();
    this.animate();

    window.addEventListener('resize', this.onResize);
  }

  // --- Procedural Canvas Textures for Authentic Materials ---
  private createVerticalPlankTexture(materialKey: MaterialKey): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base color tones
    let baseColor = '#e8d8be';
    let grainColor = '#d9c7a7';
    let battenColor = '#f2e4cc';

    if (materialKey === 'falurod') {
      baseColor = '#8b2522';
      grainColor = '#771e1b';
      battenColor = '#9c2f2c';
    } else if (materialKey === 'grey') {
      baseColor = '#64748b';
      grainColor = '#475569';
      battenColor = '#7588a3';
    } else if (materialKey === 'white') {
      baseColor = '#f8fafc';
      grainColor = '#e2e8f0';
      battenColor = '#ffffff';
    } else if (materialKey === 'black') {
      baseColor = '#1e293b';
      grainColor = '#0f172a';
      battenColor = '#334155';
    }

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);

    // Draw vertical planks with battens (lockläkt)
    const plankWidth = 32;
    for (let x = 0; x < 512; x += plankWidth) {
      // Wood grain lines
      ctx.fillStyle = grainColor;
      ctx.fillRect(x, 0, 1.5, 512);

      // Batten (lockläkt) down the center of each plank
      ctx.fillStyle = battenColor;
      ctx.fillRect(x + plankWidth / 2 - 2, 0, 4, 512);

      // Shadow next to batten
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(x + plankWidth / 2 + 2, 0, 1.5, 512);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  private createInteriorStudsTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Yellow mineral wool insulation background
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(0, 0, 256, 256);

    // Insulation fiber speckled pattern
    ctx.fillStyle = '#facc15';
    for (let i = 0; i < 600; i++) {
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 1.5);
    }

    // Vertical timber studs (regelstomme 45x145)
    ctx.fillStyle = '#d6b78d';
    ctx.fillRect(0, 0, 18, 256);
    ctx.fillRect(128, 0, 18, 256);

    // Stud wood grain & edge shadows
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(18, 0, 2, 256);
    ctx.fillRect(146, 0, 2, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 1);
    return texture;
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
    const wallThick = 0.2;

    // Materials
    const wallTexture = this.createVerticalPlankTexture(this.currentConfig.material);
    const interiorTexture = this.createInteriorStudsTexture();
    const floorTexture = this.createPineFloorTexture();

    const exteriorMat = new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.7,
      metalness: 0.05
    });

    const interiorMat = new THREE.MeshStandardMaterial({
      map: interiorTexture,
      roughness: 0.8
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
    const floorGeo = new THREE.BoxGeometry(w - wallThick * 2, 0.05, d - wallThick * 2);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, 0.275, 0);
    floor.receiveShadow = true;
    this.wallsGroup.add(floor);

    // 3. Modular Walls Construction
    this.buildModularWall('front', 4, w, d, h, wallThick, exteriorMat, interiorMat, trimMat);
    this.buildModularWall('back', 4, w, d, h, wallThick, exteriorMat, interiorMat, trimMat);
    this.buildModularWall('left', 3, w, d, h, wallThick, exteriorMat, interiorMat, trimMat);
    this.buildModularWall('right', 3, w, d, h, wallThick, exteriorMat, interiorMat, trimMat);

    // 4. Roof Construction
    this.buildRoof(w, d, h);

    // 5. Interior Ceiling Joists / Rafters (sparrar)
    this.buildRafters(w, d, h, wallThick);

    // 6. Loft Construction
    if (this.currentConfig.hasLoft) {
      this.buildLoft(w, d, h, wallThick);
    }

    // 7. 3D Architectural Dimensions
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
    interiorMat: THREE.Material,
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

      // Base wall mesh
      const panelGeo = new THREE.BoxGeometry(panelWidth, wallHeight, wallThick);
      const isInside = this.currentConfig.viewMode === 'insida';
      const panelMesh = new THREE.Mesh(panelGeo, isInside ? interiorMat : exteriorMat);
      panelMesh.castShadow = true;
      panelMesh.receiveShadow = true;
      panelMesh.userData = { slotId, wall: wallSide, index: i };
      panelGroup.add(panelMesh);
      this.interactivePanels.push(panelMesh);

      // Horizontal mid-trim line (like the white mid-rib in Skånska Byggvaror)
      const midRibGeo = new THREE.BoxGeometry(panelWidth, 0.06, 0.04);
      const midRib = new THREE.Mesh(midRibGeo, trimMat);
      midRib.position.set(0, 0.05, wallThick / 2 + 0.02);
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
        this.updateHighlightBox(panelMesh);
      }
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
      // Pulpettak
      const roofGeo = new THREE.BoxGeometry(w + overhang * 2, 0.18, d + overhang * 2);
      const roofMesh = new THREE.Mesh(roofGeo, roofMat);
      roofMesh.position.set(0, h + 0.22, 0);
      roofMesh.rotation.x = 0.08;
      roofMesh.castShadow = true;
      this.roofGroup.add(roofMesh);
    }
  }

  private buildRafters(w: number, d: number, h: number, wt: number) {
    const rafterMat = new THREE.MeshStandardMaterial({ color: '#f3e8d2', roughness: 0.6 });
    const count = 7;
    const spacing = (d - wt * 2) / (count - 1);

    for (let i = 0; i < count; i++) {
      const rz = -d / 2 + wt + i * spacing;
      const rafterGeo = new THREE.BoxGeometry(w - wt * 2 + 0.1, 0.18, 0.06);
      const rafter = new THREE.Mesh(rafterGeo, rafterMat);
      rafter.position.set(0, h - 0.1, rz);
      rafter.castShadow = true;
      this.roofGroup.add(rafter);
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

    // 1. Front Width Dimension Line (6040 mm / 29.9 m²)
    const yFront = 0.05;
    const zFront = d / 2 + offset;
    const frontLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-w / 2, yFront, zFront),
      new THREE.Vector3(w / 2, yFront, zFront)
    ]);
    this.dimensionsGroup.add(new THREE.Line(frontLineGeo, dimMat));

    // Extension lines
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

    // 2. Right Height Dimension Line (3503 mm)
    const xRight = w / 2 + offset;
    const zRight = d / 2;
    const heightLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(xRight, 0.2, zRight),
      new THREE.Vector3(xRight, h, zRight)
    ]);
    this.dimensionsGroup.add(new THREE.Line(heightLineGeo, dimMat));

    // Height Extension lines
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
  }

  private updateHighlightBox(targetMesh: THREE.Mesh) {
    if (this.highlightBox) {
      this.scene.remove(this.highlightBox);
      this.highlightBox = null;
    }

    const bbox = new THREE.Box3().setFromObject(targetMesh);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bbox.getSize(size);
    bbox.getCenter(center);

    // Green outline wireframe matching Skånska Byggvaror (#15803d)
    const boxGeo = new THREE.BoxGeometry(size.x + 0.04, size.y + 0.04, size.z + 0.04);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: '#16a34a', linewidth: 3 });

    this.highlightBox = new THREE.LineSegments(edges, lineMat);
    this.highlightBox.position.copy(center);
    this.scene.add(this.highlightBox);
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
      this.camera.position.set(0, 4.6, 6.2);
      this.controls.target.set(0, 1.4, 0);
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
