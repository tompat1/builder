import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PULPET_PITCH_DEG, type MaterialKey, type WallSlot, type LoftPlacement, type LoftCount, type PanelOrientation, type RoofCovering } from '../store/useConfigStore';
import { eaveLiftMm, gablePitchDegrees, isGableRoof, type RoofId } from '../store/roof';
import { inferNoteNormal, noteAxes, noteCameraTransform, noteSheetTransform, noteTiltRadians, NOTE_SURFACE_SCALE } from '../notes/surface';
import { paintBoards } from '../color/paint';
import { loftJoistTop, loftStairRun, loftStairTreads } from './loftLevel';
import { fitRoom, innerHalf, roomFootprint, shellSides, type ShellSides } from './roomWalls';

const PULPET_PITCH_RAD = (PULPET_PITCH_DEG * Math.PI) / 180;

export interface SceneConfig {
  widthMm: number;
  depthMm: number;
  heightMm: number;
  roofType: RoofId;
  roofCovering: RoofCovering;
  hasLoft: boolean;
  loftPlacement?: LoftPlacement;
  loftAreaSqMeters?: number;
  hasLoftStair?: boolean;
  loftCount?: LoftCount;
  interactionMode: 'default' | 'draw_wall' | 'place_utility' | 'place_room_bathroom' | 'place_room_bedroom' | 'place_room_kitchen' | 'place_room_storage';
  viewMode: 'utsida' | 'insida' | 'blueprint';
  /** Overhead cutaway used while the Loft category is open. */
  loftView: boolean;
  /** True when the Interior category is open. */
  interiorView: boolean;
  roofView: boolean;
  material: MaterialKey;
  /** Painted facade. When set, the boards use this colour instead of a catalog stain. */
  customHex: string | null;
  panelOrientation: PanelOrientation;
  /** Visible board width, millimetres. 145 is the standard 22×145 board. */
  panelWidthMm: number;
  showDimensions: boolean;
  selectedSlotId: string | null;
  wallSlots: Record<string, WallSlot>;
  isFullscreen?: boolean;
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
  private trussesGroup: THREE.Group;
  private dimensionsGroup: THREE.Group;
  private interiorGroup: THREE.Group;
  private highlightBox: THREE.LineSegments | null = null;
  private contactShadow: THREE.Mesh | null = null;
  private hoverBox: THREE.Object3D | null = null;
  private gridHelper: THREE.GridHelper | null = null;

  private interactivePanels: THREE.Mesh[] = [];
  private roomDragHandles: THREE.Mesh[] = [];
  private draggingRoom: {
    roomId: string;
    side: 'left' | 'right' | 'front' | 'back' | 'center';
    startW: number;
    startD: number;
    startX: number;
    startZ: number;
    startY: number;
    roomType: string;
    startPt: { x: number; y: number; z: number };
  } | null = null;
  private raycaster = new THREE.Raycaster();
  private labelRaycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private animFrameId: number | null = null;
  private currentConfig: SceneConfig;

  // Callbacks for 3D interactions
  public onPanelClick?: (slotId: string, screenX: number, screenY: number) => void;
  public onPanelHover?: (slotId: string | null, screenX: number, screenY: number) => void;
  public onSlotScreenPositionUpdate?: (pos: { x: number; y: number; visible: boolean; slotId: string }) => void;
  public onDimensionLabels?: (labels: Record<string, { x: number; y: number; visible: boolean }>) => void;
  public onNoteAnchors?: (anchors: Record<string, { x: number; y: number; visible: boolean }>) => void;
  public onNotePlanes?: (camera: string, planes: Record<string, { transform: string; visible: boolean }>) => void;
  public onMeasurePick?: (point: { x: number; y: number; z: number }) => void;
  public onMeasureCursor?: (point: { x: number; y: number; z: number } | null) => void;
  public onMeasureScreen?: (screen: {
    start: { x: number; y: number; visible: boolean };
    end: { x: number; y: number; visible: boolean };
  } | null) => void;
  public onRoomPlaced?: (id: string, type: string, w: number, d: number, x: number, y: number, z: number) => void;
  public onRoomResize?: (id: string, w: number, d: number, x: number, y: number, z: number) => void;
  public onInteractionComplete?: () => void;
  private measuring = false;
  private measureDown: { x: number; y: number } | null = null;
  private measureFrom: THREE.Vector3 | null = null;
  private measureTo: THREE.Vector3 | null = null;
  private measureFromPoint = new THREE.Vector3();
  private measureToPoint = new THREE.Vector3();
  private dimensionAnchors = new Map<string, THREE.Vector3>();
  private noteTargets: string[] = [];
  private notePins: { id: string; x: number; y: number; z: number; nx?: number; ny?: number; nz?: number }[] = [];
  private notePose = new THREE.Object3D();
  private noteBasis = new THREE.Matrix4();
  private notePoint = new THREE.Vector3();
  private noteBox = new THREE.Box3();
  private pickMouse = new THREE.Vector2();
  private drawingWallPoints: THREE.Vector3[] = [];
  private drawingWallMesh: THREE.Mesh | null = null;

  constructor(container: HTMLElement, initialConfig?: Partial<SceneConfig>) {
    this.container = container;
    this.currentConfig = {
      interactionMode: initialConfig?.interactionMode ?? 'default',
      widthMm: initialConfig?.widthMm ?? 6040,
      depthMm: initialConfig?.depthMm ?? 3503,
      heightMm: initialConfig?.heightMm ?? 5000,
      roofType: initialConfig?.roofType ?? 'pulpettak',
      roofCovering: initialConfig?.roofCovering ?? 'felt',
      hasLoft: initialConfig?.hasLoft ?? false,
      loftPlacement: initialConfig?.loftPlacement ?? 'vanster',
      loftAreaSqMeters: initialConfig?.loftAreaSqMeters ?? 10.95,
      hasLoftStair: initialConfig?.hasLoftStair ?? true,
      loftCount: initialConfig?.loftCount ?? 'ett',
      viewMode: initialConfig?.viewMode ?? 'utsida',
      loftView: initialConfig?.loftView ?? false,
      interiorView: initialConfig?.interiorView ?? false,
      roofView: initialConfig?.roofView ?? false,
      material: initialConfig?.material ?? 'wood',
      customHex: initialConfig?.customHex ?? null,
      panelOrientation: initialConfig?.panelOrientation ?? 'staende',
      panelWidthMm: initialConfig?.panelWidthMm ?? 145,
      showDimensions: initialConfig?.showDimensions ?? true,
      selectedSlotId: initialConfig?.selectedSlotId ?? null,
      wallSlots: initialConfig?.wallSlots ?? {}
    };

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#f3f5f7');

    this.camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      1000
    );
    this.camera.position.set(0, 3.2, 13.5);

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
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.minDistance = 3.5;
    this.controls.maxDistance = 35;
    this.controls.target.set(0, 2.2, 0);

    this.setupLighting();

    this.houseGroup = new THREE.Group();
    this.wallsGroup = new THREE.Group();
    this.framingGroup = new THREE.Group();
    this.trussesGroup = new THREE.Group();
    this.roofGroup = new THREE.Group();
    this.loftGroup = new THREE.Group();
    this.dimensionsGroup = new THREE.Group();
    this.interiorGroup = new THREE.Group();

    this.houseGroup.add(this.wallsGroup);
    this.houseGroup.add(this.framingGroup);
    this.houseGroup.add(this.trussesGroup);
    this.houseGroup.add(this.roofGroup);
    this.houseGroup.add(this.loftGroup);
    this.houseGroup.add(this.interiorGroup);
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

    const isNaturalWood = materialKey === 'wood' && !this.currentConfig.customHex;
    // Four boards per tile, so neighbouring boards can differ and the width stays readable.
    const plankCount = 4;
    const plankW = 1024 / plankCount;

    // Close pale spruce tones. Neighbouring boards stay in the same family.
    const spruceTones = [
      { base: '#f6ead8', grain: '#e4d2b4', darkGrain: '#cbb892' },
      { base: '#f4e7d4', grain: '#e2d0b2', darkGrain: '#c9b690' },
      { base: '#f7ebda', grain: '#e6d4b6', darkGrain: '#cdba94' },
      { base: '#f3e5d2', grain: '#e0ceb0', darkGrain: '#c7b48e' },
      { base: '#f5e9d6', grain: '#e3d1b3', darkGrain: '#cab791' },
      { base: '#f8ecdb', grain: '#e7d5b7', darkGrain: '#cebb95' }
    ];

    let colorPalette: { base: string; grain: string; darkGrain: string };
    const painted = this.currentConfig.customHex ? paintBoards(this.currentConfig.customHex) : null;
    if (painted) {
      colorPalette = painted;
    } else if (materialKey === 'falurod') {
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

      // Thin joint, the same on every board.
      const seam = Math.max(3, Math.round(plankW * 0.045));
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = isNaturalWood ? 'rgba(90, 68, 42, 0.55)' : 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(px + plankW - seam, 0, seam, 1024);

      ctx.fillStyle = isNaturalWood ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.22)';
      ctx.fillRect(px, 0, Math.max(1, seam * 0.35), 1024);
    }

    ctx.globalAlpha = 1.0;
    const texture = new THREE.CanvasTexture(this.orientBoards(canvas));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.applyCladdingRepeat(texture);
    return texture;
  }

  /** Turn vertical boards onto their side for liggande cladding. */
  private orientBoards(source: HTMLCanvasElement) {
    if (this.currentConfig.panelOrientation !== 'liggande') return source;
    const turned = document.createElement('canvas');
    turned.width = source.width;
    turned.height = source.height;
    const ctx = turned.getContext('2d')!;
    ctx.translate(source.width, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(source, 0, 0);
    return turned;
  }

  /** Four boards per tile. Repeat so each board is the chosen width. */
  private applyCladdingRepeat(texture: THREE.Texture) {
    const cover = Math.max(0.07, this.currentConfig.panelWidthMm / 1000);
    const moduleM = 4 * cover;
    const along = 2.4;
    if (this.currentConfig.panelOrientation === 'liggande') {
      texture.repeat.set(1 / along, 1 / moduleM);
    } else {
      texture.repeat.set(1 / moduleM, 1 / along);
    }
  }

  /** Store UV axes in metres so the shared repeat matches the board size on every face. */
  private writeMetreUvs(geo: THREE.BufferGeometry, yShift: number) {
    const pos = geo.getAttribute('position');
    const uv = geo.getAttribute('uv');
    const norm = geo.getAttribute('normal');
    if (!pos || !uv || !norm) return;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i) + yShift;
      const z = pos.getZ(i);
      const nx = Math.abs(norm.getX(i));
      const ny = Math.abs(norm.getY(i));
      const u = ny > 0.5 || nx > 0.5 ? (nx > 0.5 ? z : x) : x;
      const v = ny > 0.5 ? z : y;
      uv.setXY(i, u, v);
    }
    uv.needsUpdate = true;
  }

  private createRoofFeltTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#2a313c';
    ctx.fillRect(0, 0, 256, 256);
    let seed = 17;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 1800; i++) {
      const shade = rnd() > 0.5 ? 58 : 28;
      ctx.fillStyle = `rgba(${shade}, ${shade + 4}, ${shade + 8}, 0.35)`;
      ctx.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 1.5, 1 + rnd());
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 3);
    texture.anisotropy = 8;
    return texture;
  }

  private createRoofMetalTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#7d8b99';
    ctx.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 32) {
      ctx.fillStyle = '#c5d0da';
      ctx.fillRect(x, 0, 2, 256);
      ctx.fillStyle = '#4e5c6a';
      ctx.fillRect(x + 2, 0, 3, 256);
      ctx.fillStyle = '#9aabba';
      ctx.fillRect(x + 5, 0, 24, 256);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 2);
    texture.anisotropy = 8;
    return texture;
  }

  private createRoofTileTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#6a655f';
    ctx.fillRect(0, 0, 256, 256);
    const tileW = 32;
    const tileH = 22;
    for (let row = 0; row < 14; row++) {
      const offset = row % 2 === 0 ? 0 : tileW / 2;
      for (let col = -1; col < 10; col++) {
        const x = col * tileW + offset;
        const y = row * (tileH - 6);
        ctx.fillStyle = '#514c47';
        ctx.fillRect(x, y + tileH - 8, tileW - 2, 8);
        ctx.fillStyle = row % 2 === 0 ? '#7a756e' : '#6e6962';
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 2, tileW - 4, tileH - 6, 3);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.stroke();
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 3);
    texture.anisotropy = 8;
    return texture;
  }

  /** Overlapping asphalt tabs. Square cuts and a dark course shadow, so they do not read as concrete tiles. */
  private createRoofShingleTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#2c2824';
    ctx.fillRect(0, 0, 256, 256);

    const tabW = 64;
    const course = 48;
    const rows = Math.ceil(256 / course) + 1;
    for (let row = 0; row < rows; row++) {
      const offset = row % 2 === 0 ? 0 : tabW / 2;
      const y = row * course;
      for (let col = -1; col < 6; col++) {
        const x = col * tabW + offset;
        const tone = (row + col) % 3 === 0 ? '#5a4b3e' : (row + col) % 3 === 1 ? '#4d4036' : '#43382f';
        ctx.fillStyle = tone;
        ctx.fillRect(x + 2, y + 2, tabW - 4, course - 4);
        ctx.fillStyle = 'rgba(255, 236, 210, 0.08)';
        ctx.fillRect(x + 2, y + 2, tabW - 4, 3);
        ctx.fillStyle = '#1c1815';
        ctx.fillRect(x, y + course - 10, tabW, 10);
        ctx.fillRect(x + tabW - 2, y, 2, course);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 4);
    texture.anisotropy = 8;
    return texture;
  }

  private roofSurfaceMaterial(): THREE.MeshStandardMaterial {
    const covering = this.currentConfig.roofCovering;
    if (covering === 'metal') {
      return new THREE.MeshStandardMaterial({
        map: this.createRoofMetalTexture(),
        roughness: 0.34,
        metalness: 0.72
      });
    }
    if (covering === 'tiles') {
      return new THREE.MeshStandardMaterial({
        map: this.createRoofTileTexture(),
        roughness: 0.86,
        metalness: 0.04
      });
    }
    if (covering === 'shingles') {
      return new THREE.MeshStandardMaterial({
        map: this.createRoofShingleTexture(),
        roughness: 0.9,
        metalness: 0.02
      });
    }
    return new THREE.MeshStandardMaterial({
      map: this.createRoofFeltTexture(),
      color: '#3a4250',
      roughness: 0.92,
      metalness: 0.02
    });
  }

  private createVerticalPlankBumpMap(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Midtone neutral base height
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 1024, 1024);

    const plankCount = 4;
    const plankW = 1024 / plankCount;

    for (let p = 0; p < plankCount; p++) {
      const px = p * plankW;

      // Slight curvature / bevel on plank board (center elevated)
      const grad = ctx.createLinearGradient(px, 0, px + plankW, 0);
      grad.addColorStop(0, '#757575');
      grad.addColorStop(0.5, '#8c8c8c');
      grad.addColorStop(1, '#707070');
      ctx.fillStyle = grad;
      ctx.fillRect(px, 0, plankW, 1024);

      const seam = Math.max(3, Math.round(plankW * 0.045));
      ctx.fillStyle = '#5a5a5a';
      ctx.fillRect(px + plankW - seam, 0, seam, 1024);
      ctx.fillStyle = '#9a9a9a';
      ctx.fillRect(px, 0, Math.max(1, Math.round(seam * 0.35)), 1024);
    }

    const bumpTexture = new THREE.CanvasTexture(this.orientBoards(canvas));
    bumpTexture.wrapS = THREE.RepeatWrapping;
    bumpTexture.wrapT = THREE.RepeatWrapping;
    this.applyCladdingRepeat(bumpTexture);
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
    const hemisphere = new THREE.HemisphereLight(0xf7f4ee, 0xd5dde6, 0.62);
    this.scene.add(hemisphere);

    const ambientLight = new THREE.AmbientLight(0xfffaf3, 0.28);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff3e4, 1.55);
    sunLight.position.set(12, 22, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 60;
    sunLight.shadow.camera.left = -14;
    sunLight.shadow.camera.right = 14;
    sunLight.shadow.camera.top = 14;
    sunLight.shadow.camera.bottom = -14;
    sunLight.shadow.bias = -0.0002;
    sunLight.shadow.normalBias = 0.025;
    sunLight.shadow.radius = 5;
    this.scene.add(sunLight);

    const interiorFill = new THREE.PointLight(0xfff6ea, 0.55, 14, 2);
    interiorFill.position.set(0, 1.7, 0);
    this.scene.add(interiorFill);

    const skyFill = new THREE.DirectionalLight(0xdbeafe, 0.28);
    skyFill.position.set(-10, 12, -8);
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

  private roomPreviewGroup: THREE.Mesh | null = null;

  private shellLimits() {
    return innerHalf(this.currentConfig.widthMm / 1000, this.currentConfig.depthMm / 1000);
  }

  /** Plan size stored on the room. The drag handles must not inflate it. */
  private roomPlan(group: THREE.Object3D) {
    const w = Number(group.userData.w);
    const d = Number(group.userData.d);
    if (Number.isFinite(w) && Number.isFinite(d) && w > 0 && d > 0) return { w, d };
    const box = new THREE.Box3().setFromObject(group);
    return { w: box.max.x - box.min.x, d: box.max.z - box.min.z };
  }

  private updateRoomPreview(roomType: string | null, pt?: { x: number, y: number, z: number }) {
    if (!roomType || !pt) {
      if (this.roomPreviewGroup) {
        this.roomPreviewGroup.visible = false;
      }
      return;
    }

    const footprint = roomFootprint(roomType);

    if (!this.roomPreviewGroup || this.roomPreviewGroup.userData.roomType !== roomType) {
      if (this.roomPreviewGroup) {
        this.scene.remove(this.roomPreviewGroup);
      }
      const geo = new THREE.BoxGeometry(footprint.w, 2.4, footprint.d);
      const mat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.5 });
      this.roomPreviewGroup = new THREE.Mesh(geo, mat);
      this.roomPreviewGroup.userData.roomType = roomType;
      this.scene.add(this.roomPreviewGroup);
    }

    const { hx, hz } = this.shellLimits();
    const fitted = fitRoom({ x: pt.x, z: pt.z, w: footprint.w, d: footprint.d }, hx, hz);
    this.roomPreviewGroup.visible = true;
    this.roomPreviewGroup.scale.set(
      footprint.w > 0 ? fitted.w / footprint.w : 1,
      1,
      footprint.d > 0 ? fitted.d / footprint.d : 1
    );
    this.roomPreviewGroup.position.set(fitted.x, 1.2, fitted.z);
  }

  private setupRaycasting() {
    this.container.addEventListener('pointermove', (e) => {
      if (this.measuring) {
        this.onMeasureCursor?.(this.housePointAt(e.clientX, e.clientY));
        this.container.style.cursor = 'crosshair';
        this.updateHoverBox(null);
        this.onPanelHover?.(null, 0, 0);
        this.updateRoomPreview(null);
        return;
      }
      if (this.currentConfig.isFullscreen) {
        this.container.style.cursor = 'default';
        this.updateHoverBox(null);
        this.onPanelHover?.(null, 0, 0);
        this.updateRoomPreview(null);
        return;
      }

      if (this.currentConfig.interactionMode.startsWith('place_room_')) {
        const pt = this.housePointAt(e.clientX, e.clientY);
        if (pt) {
          const roomType = this.currentConfig.interactionMode.split('_').pop()!;
          this.updateRoomPreview(roomType, pt);
        } else {
          this.updateRoomPreview(null);
        }
        // Still allow hover? Or just preview? Let's just return to avoid other hovers
        return;
      } else {
        this.updateRoomPreview(null);
      }
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (this.draggingRoom) {
        const pt = this.housePointAt(e.clientX, e.clientY);
        if (pt) {
          const dx = pt.x - this.draggingRoom.startPt.x;
          const dz = pt.z - this.draggingRoom.startPt.z;

          let newW = this.draggingRoom.startW;
          let newD = this.draggingRoom.startD;
          let newX = this.draggingRoom.startX;
          let newZ = this.draggingRoom.startZ;

          if (this.draggingRoom.side === 'right') {
            newW = Math.max(1.0, this.draggingRoom.startW + dx);
            newX = this.draggingRoom.startX + (newW - this.draggingRoom.startW) / 2;
          } else if (this.draggingRoom.side === 'left') {
            newW = Math.max(1.0, this.draggingRoom.startW - dx);
            newX = this.draggingRoom.startX - (newW - this.draggingRoom.startW) / 2;
          } else if (this.draggingRoom.side === 'front') {
            newD = Math.max(1.0, this.draggingRoom.startD + dz);
            newZ = this.draggingRoom.startZ + (newD - this.draggingRoom.startD) / 2;
          } else if (this.draggingRoom.side === 'back') {
            newD = Math.max(1.0, this.draggingRoom.startD - dz);
            newZ = this.draggingRoom.startZ - (newD - this.draggingRoom.startD) / 2;
          } else if (this.draggingRoom.side === 'center') {
            newX = this.draggingRoom.startX + dx;
            newZ = this.draggingRoom.startZ + dz;
          }

          newW = Math.round(newW * 10) / 10;
          newD = Math.round(newD * 10) / 10;
          newX = Math.round(newX * 10) / 10;
          newZ = Math.round(newZ * 10) / 10;

          const { hx, hz } = this.shellLimits();
          const fitted = fitRoom({ x: newX, z: newZ, w: newW, d: newD }, hx, hz);
          this.updateRoomSize(this.draggingRoom.roomId, this.draggingRoom.roomType, fitted.w, fitted.d, fitted.x, undefined, fitted.z);
          this.onRoomResize?.(this.draggingRoom.roomId, fitted.w, fitted.d, fitted.x, this.draggingRoom.startY || 0.3, fitted.z);
        }
        return;
      }

      this.raycaster.setFromCamera(this.mouse, this.camera);

      // Check room handles for hover
      if (this.currentConfig.interactionMode === 'default') {
        let hoveringHandle = false;
        if (this.roomDragHandles.length > 0) {
          const dragIntersects = this.raycaster.intersectObjects(this.roomDragHandles, false);
          if (dragIntersects.length > 0) {
            hoveringHandle = true;
            const side = dragIntersects[0].object.userData.side;
            if (side === 'left' || side === 'right') {
              this.container.style.cursor = 'ew-resize';
            } else {
              this.container.style.cursor = 'ns-resize';
            }
          }
        }

        if (!hoveringHandle && this.interiorGroup.children.length > 0) {
          // Check if hovering over room floor to move it
          const roomMeshes: THREE.Mesh[] = [];
          this.interiorGroup.children.forEach(group => {
            if (group.userData.type === 'room_zone') {
              roomMeshes.push(...(group.children.filter(c => c instanceof THREE.Mesh) as THREE.Mesh[]));
            }
          });
          const roomIntersects = this.raycaster.intersectObjects(roomMeshes, false);
          if (roomIntersects.length > 0) {
            this.container.style.cursor = 'move';
            return;
          }
        }

        if (hoveringHandle) return;
      }

      const intersects = this.raycaster.intersectObjects(this.interactivePanels, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const slotId = hit.userData.slotId as string;
        if (slotId) {
          this.container.style.cursor = 'pointer';
          const bounds = this.boundsOf(hit);
          this.updateHoverBox(bounds);

          const center = new THREE.Vector3();
          new THREE.Box3().setFromObject(bounds).getCenter(center);
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
      this.updateRoomPreview(null);
    });

    this.container.addEventListener('pointerdown', (e) => {
      if (this.measuring) {
        this.measureDown = e.button === 0 ? { x: e.clientX, y: e.clientY } : null;
        return;
      }
      if (this.currentConfig.isFullscreen) return;

      if (this.currentConfig.interactionMode === 'draw_wall') {
        const pt = this.housePointAt(e.clientX, e.clientY);
        if (pt) {
          const { hx, hz } = this.shellLimits();
          const vecPt = new THREE.Vector3(
            Math.min(hx - 0.05, Math.max(-hx + 0.05, pt.x)),
            0,
            Math.min(hz - 0.05, Math.max(-hz + 0.05, pt.z))
          );
          this.drawingWallPoints.push(vecPt);

          // Render a simple pillar at the click point
          const geo = new THREE.CylinderGeometry(0.05, 0.05, 2.4, 16);
          const mat = new THREE.MeshStandardMaterial({ color: 0x10b981, transparent: true, opacity: 0.8 });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.copy(vecPt);
          mesh.position.y = 1.2;
          this.interiorGroup.add(mesh);

          if (this.drawingWallPoints.length >= 2) {
            // Draw a wall segment between the last two points
            const p1 = this.drawingWallPoints[this.drawingWallPoints.length - 2];
            const p2 = this.drawingWallPoints[this.drawingWallPoints.length - 1];
            const dist = p1.distanceTo(p2);
            const wallGeo = new THREE.BoxGeometry(0.1, 2.4, dist);
            const wallMesh = new THREE.Mesh(wallGeo, mat);
            wallMesh.position.copy(p1).lerp(p2, 0.5);
            wallMesh.position.y = 1.2;
            wallMesh.lookAt(p2.x, 1.2, p2.z);
            this.interiorGroup.add(wallMesh);
          }
        }
        return;
      }

      if (this.currentConfig.interactionMode === 'place_utility') {
        const pt = this.housePointAt(e.clientX, e.clientY);
        if (pt) {
          const vecPt = new THREE.Vector3(pt.x, 0, pt.z);

          const coreGeo = new THREE.BoxGeometry(0.6, 2.4, 0.6);
          const coreMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 }); // Blue for HVAC/water
          const coreMesh = new THREE.Mesh(coreGeo, coreMat);
          coreMesh.position.copy(vecPt);
          coreMesh.position.y = 1.2;
          coreMesh.userData.type = 'utility_core';

          if (this.isValidInteriorPlacement(coreMesh)) {
            // Clear any existing utility core (for MVP, allow only one)
            const existing = this.interiorGroup.children.find(c => c.userData.type === 'utility_core');
            if (existing) this.interiorGroup.remove(existing);
            this.interiorGroup.add(coreMesh);
          }
        }
        return;
      }

      if (this.currentConfig.interactionMode.startsWith('place_room_')) {
        const pt = this.housePointAt(e.clientX, e.clientY);
        if (pt) {
          const roomType = this.currentConfig.interactionMode.split('_').pop()!;
          const vecPt = new THREE.Vector3(
            Math.round(pt.x * 10) / 10,
            0,
            Math.round(pt.z * 10) / 10
          );

          const footprint = roomFootprint(roomType);
          const { hx, hz } = this.shellLimits();
          const fitted = fitRoom({ x: vecPt.x, z: vecPt.z, w: footprint.w, d: footprint.d }, hx, hz);
          const roomGroup = this.createRoomGroup(roomType, fitted.w, fitted.d, shellSides(fitted, hx, hz));

          let baseY = 0.3;
          if (pt.y > 1.0) {
            baseY = Math.max(0.3, pt.y);
          }
          roomGroup.position.set(fitted.x, baseY, fitted.z);

          let existingCount = 1;
          let roomId = `${roomType}_${existingCount}`;
          while (this.interiorGroup.children.some(c => c.userData.roomId === roomId)) {
            existingCount++;
            roomId = `${roomType}_${existingCount}`;
          }
          roomGroup.userData.roomId = roomId;
          roomGroup.children.forEach(child => {
            if (child.userData.type === 'room_drag') child.userData.roomId = roomId;
          });

          this.interiorGroup.add(roomGroup);
          this.onRoomPlaced?.(roomId, roomType, fitted.w, fitted.d, fitted.x, baseY, fitted.z);
          this.updateRoomPreview(null);
          this.onInteractionComplete?.();
        }
        return;
      }

      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);

      // Check for room drag handles first if we are in default mode
      if (this.currentConfig.interactionMode === 'default' && this.roomDragHandles.length > 0) {
        const dragIntersects = this.raycaster.intersectObjects(this.roomDragHandles, false);
        if (dragIntersects.length > 0) {
          const hit = dragIntersects[0].object as THREE.Mesh;
          const { roomId, side } = hit.userData;
          const roomGroup = this.interiorGroup.children.find(c => c.userData.type === 'room_zone' && c.userData.roomId === roomId);
          if (roomGroup) {
            // Find current bounds
            const plan = this.roomPlan(roomGroup);

            const pt = this.housePointAt(e.clientX, e.clientY);
            if (pt) {
              this.draggingRoom = {
                roomId,
                side,
                startW: plan.w,
                startD: plan.d,
                startX: roomGroup.position.x,
                startZ: roomGroup.position.z,
                startY: roomGroup.position.y,
                roomType: roomGroup.userData.roomType,
                startPt: pt
              };
              this.controls.enabled = false; // Disable orbit controls while dragging
              return;
            }
          }
        }
      }

      // Check if clicking on the room itself to move it
      if (this.currentConfig.interactionMode === 'default' && this.interiorGroup.children.length > 0) {
        const roomMeshes: THREE.Mesh[] = [];
        this.interiorGroup.children.forEach(group => {
          if (group.userData.type === 'room_zone') {
            roomMeshes.push(...(group.children.filter(c => c instanceof THREE.Mesh) as THREE.Mesh[]));
          }
        });
        const roomIntersects = this.raycaster.intersectObjects(roomMeshes, false);
        if (roomIntersects.length > 0) {
          const hit = roomIntersects[0].object as THREE.Mesh;
          const roomGroup = hit.parent as THREE.Group;
          if (roomGroup && roomGroup.userData.type === 'room_zone') {
            const { roomId } = roomGroup.userData;
            const plan = this.roomPlan(roomGroup);

            const pt = this.housePointAt(e.clientX, e.clientY);
            if (pt) {
              this.draggingRoom = {
                roomId,
                side: 'center',
                startW: plan.w,
                startD: plan.d,
                startX: roomGroup.position.x,
                startZ: roomGroup.position.z,
                startY: roomGroup.position.y,
                roomType: roomGroup.userData.roomType,
                startPt: pt
              };
              this.controls.enabled = false;
              return;
            }
          }
        }
      }

      const intersects = this.raycaster.intersectObjects(this.interactivePanels, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const slotId = hit.userData.slotId as string;
        if (slotId) {
          this.currentConfig.selectedSlotId = slotId;
          this.updateHoverBox(null);
          this.updateHighlightBox(this.boundsOf(hit));
          this.onPanelClick?.(slotId, e.clientX, e.clientY);
        }
      }
    });

    this.container.addEventListener('pointerup', (e) => {
      if (this.draggingRoom) {
        this.draggingRoom = null;
        this.controls.enabled = true;
        return;
      }
      if (!this.measuring || e.button !== 0 || !this.measureDown) return;
      const moved = Math.hypot(e.clientX - this.measureDown.x, e.clientY - this.measureDown.y);
      this.measureDown = null;
      if (moved > 6) return;
      const point = this.housePointAt(e.clientX, e.clientY);
      if (point) this.onMeasurePick?.(point);
    });

    this.container.addEventListener('pointercancel', () => {
      if (this.draggingRoom) {
        this.draggingRoom = null;
        this.controls.enabled = true;
      }
      this.measureDown = null;
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
    while (this.trussesGroup.children.length > 0) {
      this.trussesGroup.remove(this.trussesGroup.children[0]);
    }
    while (this.roofGroup.children.length > 0) {
      this.roofGroup.remove(this.roofGroup.children[0]);
    }
    while (this.loftGroup.children.length > 0) {
      this.loftGroup.remove(this.loftGroup.children[0]);
    }
    // We preserve interiorGroup so rooms don't disappear when resizing the house or changing materials.
    while (this.dimensionsGroup.children.length > 0) {
      this.dimensionsGroup.remove(this.dimensionsGroup.children[0]);
    }
    if (this.highlightBox) {
      this.scene.remove(this.highlightBox);
      this.highlightBox = null;
    }
    this.interactivePanels = [];
    this.roomDragHandles = [];

    const w = this.currentConfig.widthMm / 1000;
    const d = this.currentConfig.depthMm / 1000;
    const h = this.wallTopM();
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
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    const framingMat = new THREE.MeshStandardMaterial({
      color: '#eedec5',
      roughness: 0.65,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.55
    });

    const trimMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.4
    });
    const casingMat = new THREE.MeshStandardMaterial({
      color: this.casingColor(),
      roughness: 0.58,
      metalness: 0.02
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
    this.buildModularWall('front', 4, w, d, h, wallThick, exteriorMat, trimMat, casingMat);
    this.buildModularWall('back', 4, w, d, h, wallThick, exteriorMat, trimMat, casingMat);
    this.buildModularWall('left', 3, w, d, h, wallThick, exteriorMat, trimMat, casingMat);
    this.buildModularWall('right', 3, w, d, h, wallThick, exteriorMat, trimMat, casingMat);
    if (!this.interiorCut()) this.addBeltFlashing(w, d, h);
    if (!this.interiorCut()) {
      const rearTop = this.currentConfig.roofType === 'pulpettak'
        ? Math.max(h - Math.tan(PULPET_PITCH_RAD) * d, 2.4)
        : h;
      this.addCornerBoards(w, d, h, rearTop, 0.25, exteriorMat);
    }
    if (isGableRoof(this.currentConfig.roofType) && this.currentConfig.viewMode === 'utsida') {
      this.addGableEnds(w, d, h, exteriorMat);
    }

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
    this.buildContactShadow(w, d);

    // View mode visibility
    this.applyViewMode();
  }

  /** Wall plate. The extra-height gable lifts it above the height the user set. */
  private wallTopM() {
    return this.currentConfig.heightMm / 1000 + eaveLiftMm(this.currentConfig.roofType) / 1000;
  }

  private gablePitchRad() {
    return (gablePitchDegrees(this.currentConfig.roofType) * Math.PI) / 180;
  }

  /** Waist-height cut used by the Insida tab. The loft cutaway keeps the shell intact. */
  private interiorCut() {
    return this.currentConfig.viewMode === 'insida' && !this.currentConfig.loftView;
  }

  private loftCutaway() {
    return this.currentConfig.loftView && this.currentConfig.viewMode === 'insida';
  }

  private ghostBeamMaterial() {
    return new THREE.MeshBasicMaterial({
      color: '#fffaf4',
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide
    });
  }

  private sidePanelHeight(
    d: number,
    h: number,
    rearH: number,
    yMid: number,
    angleRad: number,
    pz: number,
    baseElev: number
  ) {
    if (this.interiorCut()) {
      const progress = Math.max(0, Math.min(1, (d / 2 - pz) / d));
      return 1.35 + progress * (rearH - 1.35) - baseElev;
    }
    if (this.currentConfig.roofType === 'pulpettak') {
      return yMid + pz * Math.tan(angleRad) - baseElev;
    }
    if (this.currentConfig.roofType === 'flackt') {
      const shallow = (2 * Math.PI) / 180;
      return h + pz * Math.tan(shallow) - baseElev;
    }
    return h - baseElev;
  }

  private addGableEnds(w: number, d: number, h: number, exteriorMat: THREE.MeshStandardMaterial) {
    const rise = Math.tan(this.gablePitchRad()) * (d / 2);
    const thick = 0.025;
    const shape = new THREE.Shape();
    shape.moveTo(-d / 2, -0.02);
    shape.lineTo(0, rise + 0.04);
    shape.lineTo(d / 2, -0.02);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false });
    geo.translate(0, 0, -thick / 2);
    this.writeMetreUvs(geo, h);

    const gableMat = exteriorMat.clone();
    if (exteriorMat.map) {
      const map = exteriorMat.map.clone();
      this.applyCladdingRepeat(map);
      map.needsUpdate = true;
      gableMat.map = map;
    }
    if (exteriorMat.bumpMap) {
      const bump = exteriorMat.bumpMap.clone();
      this.applyCladdingRepeat(bump);
      bump.needsUpdate = true;
      gableMat.bumpMap = bump;
    }

    for (const sign of [-1, 1] as const) {
      const mesh = new THREE.Mesh(geo, gableMat);
      mesh.rotation.y = sign > 0 ? -Math.PI / 2 : Math.PI / 2;
      mesh.position.set(sign * (w / 2 - thick / 2), h, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.wallsGroup.add(mesh);
    }
  }

  private casingColor() {
    if (this.currentConfig.customHex) return paintBoards(this.currentConfig.customHex).base;
    switch (this.currentConfig.material) {
      case 'falurod':
        return '#9a2d28';
      case 'grey':
        return '#8b98a5';
      case 'white':
        return '#f7f4ee';
      case 'black':
        return '#3f4c5e';
      default:
        return '#f3e6d0';
    }
  }

  private buildModularWall(
    wallSide: 'front' | 'back' | 'left' | 'right',
    panelCount: number,
    w: number,
    d: number,
    h: number,
    wallThick: number,
    exteriorMat: THREE.Material,
    trimMat: THREE.Material,
    casingMat: THREE.Material
  ) {
    const isPulpettak = this.currentConfig.roofType === 'pulpettak';
    const angleRad = PULPET_PITCH_RAD;
    const rearH = isPulpettak ? Math.max(h - Math.tan(angleRad) * d, 2.4) : h;
    const yMid = (h + rearH) / 2;
    const baseElev = 0.25;

    const isFrontOrBack = wallSide === 'front' || wallSide === 'back';
    const claddingThick = 0.025;
    // Side cladding tucks into the front and back sheets so the corner has no hole.
    const endInset = claddingThick - 0.008;
    const wallLength = isFrontOrBack ? w : d - endInset * 2;
    const panelWidth = wallLength / panelCount;

    for (let i = 0; i < panelCount; i++) {
      const slotId = `${wallSide}-${i}`;

      // Panel center coordinates and height
      let px = 0;
      let pz = 0;
      let rotY = 0;
      let panelWallH = h - baseElev;

      if (wallSide === 'front') {
        px = -w / 2 + panelWidth / 2 + i * panelWidth;
        pz = d / 2 - claddingThick / 2;
        rotY = 0;
        // In insida view, cut front wall to waist height (1.35m) matching Reference Image 4 & 5
        // so interior floor, loft, stairs, and framing are completely visible without obstruction
        panelWallH = this.interiorCut() ? 1.35 : (h - baseElev);
      } else if (wallSide === 'back') {
        px = w / 2 - panelWidth / 2 - i * panelWidth;
        pz = -d / 2 + claddingThick / 2;
        rotY = Math.PI;
        panelWallH = rearH - baseElev;
      } else if (wallSide === 'left') {
        px = -w / 2 + claddingThick / 2;
        pz = d / 2 - endInset - panelWidth / 2 - i * panelWidth;
        rotY = -Math.PI / 2;
        panelWallH = this.sidePanelHeight(d, h, rearH, yMid, angleRad, pz, baseElev);
      } else {
        px = w / 2 - claddingThick / 2;
        pz = -d / 2 + endInset + panelWidth / 2 + i * panelWidth;
        rotY = Math.PI / 2;
        panelWallH = this.sidePanelHeight(d, h, rearH, yMid, angleRad, pz, baseElev);
      }

      if (!this.interiorCut()) panelWallH += 0.02;

      const belt = this.beltRise(h);
      const upperId = `${wallSide}-${i}u`;
      const split = Boolean(this.currentConfig.wallSlots[upperId]) && panelWallH > belt + 0.4;
      const bands = split
        ? [
            { slotId, height: belt, base: baseElev, upper: false, reachesRoof: false },
            { slotId: upperId, height: panelWallH - belt, base: baseElev + belt, upper: true, reachesRoof: true }
          ]
        : [{ slotId, height: panelWallH, base: baseElev, upper: false, reachesRoof: true }];

      const slope = this.alongWallSlope(wallSide);
      for (const band of bands) {
        this.buildWallBand(
          band,
          px,
          pz,
          rotY,
          panelWidth,
          claddingThick,
          wallThick,
          wallSide,
          i,
          i > 0 && (wallSide === 'left' || wallSide === 'right') || i < panelCount - 1 && wallSide !== 'left' && wallSide !== 'right',
          slope,
          exteriorMat,
          casingMat
        );
      }
    }

    // Top eave trim and fascia to ensure 100% gapless junction with roof underside
    if (wallSide === 'left' || wallSide === 'right') {
      const roof = this.currentConfig.roofType;
      if (!this.interiorCut() && (roof === 'pulpettak' || roof === 'flackt')) {
        const pitch = this.alongWallSlope('left');
        const rise = Math.abs(pitch) * d;
        const slopeLen = Math.hypot(d + 0.08, rise);
        const slopeAngle = Math.atan2(rise, d);
        const eavesTrim = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, slopeLen), trimMat);
        const trimX = wallSide === 'left' ? -w / 2 - 0.004 : w / 2 + 0.004;
        eavesTrim.position.set(trimX, yMid + 0.01, 0);
        eavesTrim.rotation.x = -slopeAngle;
        eavesTrim.castShadow = true;
        this.wallsGroup.add(eavesTrim);
      }
    } else if (wallSide === 'front') {
      if (!this.interiorCut()) {
        const frontTrimGeo = new THREE.BoxGeometry(w + 0.06, 0.14, 0.035);
        const frontTrim = new THREE.Mesh(frontTrimGeo, trimMat);
        frontTrim.position.set(0, h + 0.04, d / 2 + 0.012);
        frontTrim.castShadow = true;
        this.wallsGroup.add(frontTrim);
      }
    } else if (wallSide === 'back') {
      const backTrimGeo = new THREE.BoxGeometry(w + 0.05, 0.12, 0.03);
      const backTrim = new THREE.Mesh(backTrimGeo, trimMat);
      backTrim.position.set(0, rearH - 0.06, -d / 2 - 0.01);
      backTrim.castShadow = true;
      this.wallsGroup.add(backTrim);
    }
  }

  /**
   * Lower cladding height, measured from the wall base.
   * On a facade about 5 m high the rail sits 2.7 m above the ground,
   * with the floor between the two storeys (the allowed band is 2.4–3.0 m).
   * Shorter houses keep the lower rail.
   */
  private beltRise(wallTop: number) {
    const wallBase = 0.25;
    if (wallTop >= 4.5) return 2.7 - wallBase;
    return 2.15;
  }

  /** Rolled white metal: fine horizontal ribs, a bright top edge, a darker drip. */
  private createBeltMetalTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#f7f8f9';
    ctx.fillRect(0, 0, 256, 64);
    for (let y = 2; y < 60; y += 2) {
      ctx.fillStyle = y % 4 === 0 ? 'rgba(198, 206, 214, 0.45)' : 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(0, y, 256, 1);
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 4);
    ctx.fillStyle = '#d8dee4';
    ctx.fillRect(0, 58, 256, 6);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(10, 1);
    texture.anisotropy = 8;
    return texture;
  }

  /**
   * White metal belt on each wall. It stands off the cladding like the reference
   * flashing: a tall ribbed face, a lit top edge, and a drip that shades the boards.
   * It stops against the vertical corner boards.
   */
  private addBeltFlashing(w: number, d: number, wallTop: number) {
    const y = 0.25 + this.beltRise(wallTop);
    const faceH = 0.11;
    const proj = 0.036;
    const standOff = 0.008;
    const { face, thick } = this.cornerTrimSize();
    const inset = face - thick;
    const faceMat = new THREE.MeshStandardMaterial({
      map: this.createBeltMetalTexture(),
      color: '#ffffff',
      roughness: 0.46,
      metalness: 0.12
    });
    const lipMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.24,
      metalness: 0.2
    });
    const shadeMat = new THREE.MeshStandardMaterial({
      color: '#1c1915',
      transparent: true,
      opacity: 0.22,
      roughness: 1,
      depthWrite: false
    });

    const add = (size: [number, number, number], pos: [number, number, number], material: THREE.Material) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      mesh.position.set(...pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.wallsGroup.add(mesh);
    };

    const place = (length: number, axis: 'x' | 'z', sign: number, claddingOuter: number) => {
      const center = claddingOuter + sign * (standOff + proj / 2);
      const lip = center + sign * (proj / 2 + 0.006);
      const shade = claddingOuter + sign * 0.004;
      if (axis === 'z') {
        add([length, faceH, proj], [0, y, center], faceMat);
        add([length, 0.01, proj + 0.012], [0, y + faceH / 2 - 0.004, center + sign * 0.006], lipMat);
        add([length, 0.016, 0.018], [0, y - faceH / 2 + 0.006, lip], lipMat);
        add([length, 0.03, 0.004], [0, y - faceH / 2 - 0.012, shade], shadeMat);
      } else {
        add([proj, faceH, length], [center, y, 0], faceMat);
        add([proj + 0.012, 0.01, length], [center + sign * 0.006, y + faceH / 2 - 0.004, 0], lipMat);
        add([0.018, 0.016, length], [lip, y - faceH / 2 + 0.006, 0], lipMat);
        add([0.004, 0.03, length], [shade, y - faceH / 2 - 0.012, 0], shadeMat);
      }
    };

    place(w - inset * 2, 'z', 1, d / 2);
    place(w - inset * 2, 'z', -1, -d / 2);
    place(d - face * 2, 'x', -1, -w / 2);
    place(d - face * 2, 'x', 1, w / 2);
  }

  /** Rise of the roof along a side wall, in metres of height per metre of local panel X. */
  private alongWallSlope(wallSide: 'front' | 'back' | 'left' | 'right') {
    if (this.interiorCut() || (wallSide !== 'left' && wallSide !== 'right')) return 0;
    const roof = this.currentConfig.roofType;
    if (roof !== 'pulpettak' && roof !== 'flackt') return 0;
    const degrees = roof === 'pulpettak' ? PULPET_PITCH_DEG : 2;
    const tan = Math.tan((degrees * Math.PI) / 180);
    return wallSide === 'left' ? tan : -tan;
  }

  private buildWallBand(
    band: { slotId: string; height: number; base: number; upper: boolean; reachesRoof: boolean },
    px: number,
    pz: number,
    rotY: number,
    panelWidth: number,
    claddingThick: number,
    wallThick: number,
    wallSide: 'front' | 'back' | 'left' | 'right',
    index: number,
    showEdgeJoint: boolean,
    slope: number,
    exteriorMat: THREE.Material,
    casingMat: THREE.Material
  ) {
    const slot = this.currentConfig.wallSlots[band.slotId];
    const slotType = slot?.type ?? 'empty';
    const panelGroup = new THREE.Group();
    panelGroup.position.set(px, band.base + band.height / 2, pz);
    panelGroup.rotation.y = rotY;
    panelGroup.userData = { slotId: band.slotId, wall: wallSide, index };

    const opening = slotType === 'window' || slotType === 'door'
      ? this.fittedOpening(slotType, slot?.itemId, band.upper, panelWidth, band.height, band.base)
      : null;
    const userData = {
      slotId: band.slotId,
      wall: wallSide,
      index,
      panelGroup
    };

    const sloped = band.reachesRoof && Math.abs(slope) > 0.0001;
    if (sloped) {
      this.addSlopedCladding(panelGroup, panelWidth, band.height, slope, claddingThick, exteriorMat, userData, opening);
    } else if (opening) {
      this.addCladdingAroundOpening(panelGroup, panelWidth, band.height, claddingThick, exteriorMat, opening, userData);
    } else {
      this.addSolidCladding(panelGroup, panelWidth, band.height, claddingThick, exteriorMat, userData);
    }

    if (showEdgeJoint) {
      const edgeRise = sloped ? (panelWidth / 2) * slope : 0;
      const joint = new THREE.Mesh(
        new THREE.BoxGeometry(0.006, band.height + edgeRise, 0.01),
        new THREE.MeshStandardMaterial({ color: '#cbb89a', roughness: 0.8 })
      );
      joint.position.set(panelWidth / 2, edgeRise / 2, 0.014);
      panelGroup.add(joint);
    }

    if ((slotType === 'door' || slotType === 'window') && opening) {
      this.addOpeningCasing(panelGroup, opening, slotType, casingMat);
    }
    if (slotType === 'door' && opening) {
      this.addDoorFeature(panelGroup, opening, slot?.itemId, userData);
    } else if (slotType === 'window' && opening) {
      this.addWindowFeature(panelGroup, opening, slot?.itemId, userData);
    } else if (slotType === 'gate') {
      this.addGateFeature(panelGroup, panelWidth, band.height, wallThick, slot?.itemId, userData);
    }

    this.wallsGroup.add(panelGroup);
    if (band.slotId === this.currentConfig.selectedSlotId) {
      this.updateHighlightBox(panelGroup);
    }
  }

  private addOpeningFrame(
    x: number,
    z: number,
    opening: { winW: number; sill: number; head: number },
    studThick: number,
    studDepth: number,
    mat: THREE.Material
  ) {
    const bottom = opening.sill < 0.4 ? opening.sill + studThick : opening.sill;
    const trimmerH = opening.head - bottom;
    if (trimmerH > 0.05) {
      for (const side of [-1, 1]) {
        const trimmer = new THREE.Mesh(new THREE.BoxGeometry(studThick, trimmerH, studDepth), mat);
        trimmer.position.set(x + side * (opening.winW / 2 + studThick / 2), bottom + trimmerH / 2, z);
        trimmer.castShadow = true;
        this.framingGroup.add(trimmer);
      }
    }
    if (opening.sill > 0.4) {
      const sill = new THREE.Mesh(
        new THREE.BoxGeometry(opening.winW + studThick * 2, studThick, studDepth),
        mat
      );
      sill.position.set(x, opening.sill - studThick / 2, z);
      sill.castShadow = true;
      this.framingGroup.add(sill);
    }
    const header = new THREE.Mesh(
      new THREE.BoxGeometry(opening.winW + studThick * 2, studThick * 2, studDepth),
      mat
    );
    header.position.set(x, opening.head + studThick, z);
    header.castShadow = true;
    this.framingGroup.add(header);
  }

  // --- Proper Architectural Timber Framing (Regelstomme 45x145 mm) ---
  private buildTimberFraming(w: number, d: number, h: number, wallThick: number, framingMat: THREE.Material) {
    const studThick = 0.045; // 45 mm
    const studDepth = 0.145; // 145 mm
    const baseElevation = 0.25; // on top of slab foundation
    const rearH = this.currentConfig.roofType === 'pulpettak'
      ? Math.max(h - Math.tan(PULPET_PITCH_RAD) * d, 2.4)
      : h;

    const framingFrontZ = d / 2 - 0.025 - studDepth / 2;
    const framingBackZ = -d / 2 + 0.025 + studDepth / 2;
    const framingLeftX = -w / 2 + 0.025 + studDepth / 2;
    const framingRightX = w / 2 - 0.025 - studDepth / 2;

    // 1. Bottom Sill Plates (Syll 45x145 mm)
    // Front sill
    const frontSyllGeo = new THREE.BoxGeometry(w - 0.05, studThick, studDepth);
    const frontSyll = new THREE.Mesh(frontSyllGeo, framingMat);
    frontSyll.position.set(0, baseElevation + studThick / 2, framingFrontZ);
    frontSyll.castShadow = true;
    this.framingGroup.add(frontSyll);

    // Back sill
    const backSyll = new THREE.Mesh(frontSyllGeo, framingMat);
    backSyll.position.set(0, baseElevation + studThick / 2, framingBackZ);
    backSyll.castShadow = true;
    this.framingGroup.add(backSyll);

    // Left sill
    const sideSyllGeo = new THREE.BoxGeometry(studDepth, studThick, d - 0.05 - studDepth * 2);
    const leftSyll = new THREE.Mesh(sideSyllGeo, framingMat);
    leftSyll.position.set(framingLeftX, baseElevation + studThick / 2, 0);
    leftSyll.castShadow = true;
    this.framingGroup.add(leftSyll);

    // Right sill
    const rightSyll = new THREE.Mesh(sideSyllGeo, framingMat);
    rightSyll.position.set(framingRightX, baseElevation + studThick / 2, 0);
    rightSyll.castShadow = true;
    this.framingGroup.add(rightSyll);

    // 2. Top Header Plates (Hammarband / Toppsyll 45x145 mm)
    // Front header
    const frontHeaderGeo = new THREE.BoxGeometry(w - 0.05, studThick, studDepth);
    const frontHeader = new THREE.Mesh(frontHeaderGeo, framingMat);
    frontHeader.position.set(0, h - studThick / 2, framingFrontZ);
    frontHeader.castShadow = true;
    this.framingGroup.add(frontHeader);

    // Back header (at rear slope height)
    const backHeader = new THREE.Mesh(frontHeaderGeo, framingMat);
    backHeader.position.set(0, rearH - studThick / 2, framingBackZ);
    backHeader.castShadow = true;
    this.framingGroup.add(backHeader);

    // Sloping side headers on left and right connecting front to rear
    const slopeLen = Math.sqrt(Math.pow(d - 0.05 - studDepth * 2, 2) + Math.pow(h - rearH, 2));
    const slopeAngle = Math.atan2(h - rearH, d - 0.05 - studDepth * 2);
    const sideHeaderGeo = new THREE.BoxGeometry(studDepth, studThick, slopeLen);

    const leftHeader = new THREE.Mesh(sideHeaderGeo, framingMat);
    leftHeader.position.set(framingLeftX, (h + rearH) / 2 - studThick / 2, 0);
    leftHeader.rotation.x = -slopeAngle;
    leftHeader.castShadow = true;
    this.framingGroup.add(leftHeader);

    const rightHeader = new THREE.Mesh(sideHeaderGeo, framingMat);
    rightHeader.position.set(framingRightX, (h + rearH) / 2 - studThick / 2, 0);
    rightHeader.rotation.x = -slopeAngle;
    rightHeader.castShadow = true;
    this.framingGroup.add(rightHeader);

    // 3. Vertical Wall Studs (Väggreglar cc 600 mm)
    // Corner Studs (dubbla hörnreglar)
    const cornerPositions = [
      { x: framingLeftX, z: framingFrontZ, height: h },
      { x: framingRightX, z: framingFrontZ, height: h },
      { x: framingLeftX, z: framingBackZ, height: rearH },
      { x: framingRightX, z: framingBackZ, height: rearH }
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
    const frontStudCount = Math.floor((w - 0.1) / 0.6);
    const frontSpacing = (w - 0.1) / frontStudCount;
    const frontStudH = h - baseElevation - studThick * 2;
    const frontOpenings = this.frontOpenings(w, h, baseElevation);

    for (let s = 1; s < frontStudCount; s++) {
      const sx = -w / 2 + 0.05 + s * frontSpacing;
      const blocked = frontOpenings.filter((opening) => Math.abs(sx - opening.x) < opening.winW / 2 - 0.02);
      if (blocked.length > 0) {
        this.fillStudGaps(sx, framingFrontZ, baseElevation, h, blocked, studThick, studDepth, framingMat);
        continue;
      }

      const studMesh = new THREE.Mesh(new THREE.BoxGeometry(studThick, frontStudH, studDepth), framingMat);
      studMesh.position.set(sx, baseElevation + studThick + frontStudH / 2, framingFrontZ);
      studMesh.castShadow = true;
      this.framingGroup.add(studMesh);
    }

    for (const opening of frontOpenings) {
      this.addOpeningFrame(opening.x, framingFrontZ, opening, studThick, studDepth, framingMat);
    }

    // Rear Wall Studs cc 600 mm
    const rearStudH = rearH - baseElevation - studThick * 2;
    for (let s = 1; s < frontStudCount; s++) {
      const sx = -w / 2 + 0.05 + s * frontSpacing;
      const studMesh = new THREE.Mesh(new THREE.BoxGeometry(studThick, rearStudH, studDepth), framingMat);
      studMesh.position.set(sx, baseElevation + studThick + rearStudH / 2, framingBackZ);
      studMesh.castShadow = true;
      this.framingGroup.add(studMesh);
    }

    // Left and Right Wall Studs (interpolating height along roof slope)
    const sideStudCount = Math.floor((d - 0.05 - studDepth * 2) / 0.6);
    const sideSpacing = (d - 0.05 - studDepth * 2) / sideStudCount;

    for (let s = 1; s < sideStudCount; s++) {
      const sz = d / 2 - 0.025 - studDepth - s * sideSpacing;
      const progress = (d / 2 - sz) / d; // 0 at front, 1 at back
      const curH = h - progress * (h - rearH);
      const curStudH = curH - baseElevation - studThick * 2;

      // Left stud
      const leftStud = new THREE.Mesh(new THREE.BoxGeometry(studDepth, curStudH, studThick), framingMat);
      leftStud.position.set(framingLeftX, baseElevation + studThick + curStudH / 2, sz);
      leftStud.castShadow = true;
      this.framingGroup.add(leftStud);

      // Right stud
      const rightStud = new THREE.Mesh(new THREE.BoxGeometry(studDepth, curStudH, studThick), framingMat);
      rightStud.position.set(framingRightX, baseElevation + studThick + curStudH / 2, sz);
      rightStud.castShadow = true;
      this.framingGroup.add(rightStud);
    }

    // 4. Noggings (kortlingar): 45×145 laid flat between the studs.
    // Alternate bays are staggered by one stud thickness so each end can be nailed through the stud.
    const halfStud = studThick / 2;
    const frontXs = [framingLeftX];
    for (let s = 1; s < frontStudCount; s++) frontXs.push(-w / 2 + 0.05 + s * frontSpacing);
    frontXs.push(framingRightX);
    const frontSolids = frontXs.map((x) => ({ from: x - halfStud, to: x + halfStud, top: h - studThick }));
    const backSolids = frontXs.map((x) => ({ from: x - halfStud, to: x + halfStud, top: rearH - studThick }));
    const sideSolids: { from: number; to: number; top: number }[] = [
      { from: framingFrontZ - studDepth / 2, to: framingFrontZ + studDepth / 2, top: h - studThick }
    ];
    for (let s = 1; s < sideStudCount; s++) {
      const sz = d / 2 - 0.025 - studDepth - s * sideSpacing;
      const progress = (d / 2 - sz) / d;
      const curH = h - progress * (h - rearH);
      sideSolids.push({ from: sz - halfStud, to: sz + halfStud, top: curH - studThick });
    }
    sideSolids.push({
      from: framingBackZ - studDepth / 2,
      to: framingBackZ + studDepth / 2,
      top: rearH - studThick
    });

    this.addNoggings(this.gapsBetween(frontSolids), 'x', framingFrontZ, baseElevation, studThick, studDepth, framingMat, frontOpenings);
    this.addNoggings(this.gapsBetween(backSolids), 'x', framingBackZ, baseElevation, studThick, studDepth, framingMat);
    this.addNoggings(this.gapsBetween(sideSolids), 'z', framingLeftX, baseElevation, studThick, studDepth, framingMat);
    this.addNoggings(this.gapsBetween(sideSolids), 'z', framingRightX, baseElevation, studThick, studDepth, framingMat);
  }

  /** Clear spans between stud faces, limited by the lower of the two studs. */
  private gapsBetween(solids: { from: number; to: number; top: number }[]) {
    const sorted = [...solids].sort((a, b) => a.from - b.from);
    const gaps: { from: number; to: number; top: number }[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const from = sorted[i].to;
      const to = sorted[i + 1].from;
      if (to - from < 0.08) continue;
      gaps.push({ from, to, top: Math.min(sorted[i].top, sorted[i + 1].top) });
    }
    return gaps;
  }

  private addNoggings(
    gaps: { from: number; to: number; top: number }[],
    axis: 'x' | 'z',
    fixed: number,
    baseElevation: number,
    studThick: number,
    studDepth: number,
    mat: THREE.Material,
    openings: { x: number; winW: number; sill: number; head: number }[] = []
  ) {
    const rowPitch = 1.2;
    const floor = baseElevation + studThick;
    gaps.forEach((gap, bay) => {
      const length = gap.to - gap.from - 0.004;
      if (length < 0.08) return;
      let row = 0;
      for (let y = floor + rowPitch; y + studThick / 2 < gap.top - 0.01; y += rowPitch, row += 1) {
        const stagger = (bay + row) % 2 === 1 ? studThick : 0;
        let centerY = y + stagger;
        if (centerY + studThick / 2 > gap.top - 0.008) centerY = y;
        if (centerY - studThick / 2 < floor + 0.02) continue;
        if (axis === 'x' && this.noggingHitsOpening(gap.from, gap.to, centerY, studThick, openings)) continue;
        const mesh = new THREE.Mesh(
          axis === 'x'
            ? new THREE.BoxGeometry(length, studThick, studDepth)
            : new THREE.BoxGeometry(studDepth, studThick, length),
          mat
        );
        const mid = (gap.from + gap.to) / 2;
        mesh.position.set(axis === 'x' ? mid : fixed, centerY, axis === 'z' ? mid : fixed);
        mesh.castShadow = true;
        this.framingGroup.add(mesh);
      }
    });
  }

  private noggingHitsOpening(
    from: number,
    to: number,
    centerY: number,
    studThick: number,
    openings: { x: number; winW: number; sill: number; head: number }[]
  ) {
    const y0 = centerY - studThick / 2;
    const y1 = centerY + studThick / 2;
    return openings.some((opening) => {
      const left = opening.x - opening.winW / 2 - studThick;
      const right = opening.x + opening.winW / 2 + studThick;
      const frameBottom = opening.sill > 0.4 ? opening.sill - studThick : opening.sill;
      const frameTop = opening.head + studThick * 2;
      return to > left && from < right && y1 > frameBottom && y0 < frameTop;
    });
  }


  private boundsOf(hit: THREE.Object3D): THREE.Object3D {
    return (hit.userData.panelGroup as THREE.Object3D | undefined) ?? hit;
  }

  private isValidInteriorPlacement(mesh: THREE.Object3D, ignoredObject?: THREE.Object3D): boolean {
    mesh.updateMatrixWorld();
    const box = new THREE.Box3().setFromObject(mesh);

    const { hx, hz } = this.shellLimits();
    if (box.min.x < -hx - 1e-3 || box.max.x > hx + 1e-3 || box.min.z < -hz - 1e-3 || box.max.z > hz + 1e-3) {
      return false;
    }

    // Check collisions with other interior zones/cores
    for (const child of this.interiorGroup.children) {
      if (child !== mesh && child !== ignoredObject && (child.userData.type === 'room_zone' || child.userData.type === 'utility_core')) {
        const otherBox = new THREE.Box3().setFromObject(child);
        if (box.intersectsBox(otherBox)) {
          return false; // Collision
        }
      }
    }

    // Check collision with staircase
    for (const child of this.loftGroup.children) {
      if (child.userData.type === 'staircase') {
        const stairBox = new THREE.Box3().setFromObject(child);
        if (box.intersectsBox(stairBox)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Opening size follows the panel it sits in.
   * An upper panel is a wide, low bay, so its window is a landscape rectangle.
   * A lower window fills the bay under the rail. A door stands on the floor.
   * Catalog type changes glass and mullions; it does not override the fit.
   */
  private fittedOpening(
    kind: 'door' | 'window',
    itemId: string | undefined,
    isUpper: boolean,
    panelWidth: number,
    panelHeight: number,
    panelBase: number
  ) {
    const side = 0.09;
    const headBoard = 0.085;
    const sillBoard = 0.065;
    const edge = 0.045;
    const winW = Math.max(0.46, panelWidth - side * 2 - edge * 2);
    const centerY = panelBase + panelHeight / 2;

    if (kind === 'door') {
      const wanted = itemId === 'SVANSHALL' ? 1.6 : 1.0;
      const doorW = Math.min(wanted, winW);
      const doorH = Math.min(2.1, Math.max(1.7, panelHeight - headBoard - 0.06));
      const sill = panelBase;
      const head = sill + doorH;
      return { winW: doorW, winH: doorH, winY: (sill + head) / 2 - centerY, sill, head };
    }

    let winH: number;
    let sill: number;
    if (isUpper) {
      // Sit the head just under the fascia, the way the reference row does.
      const gapAbove = 0.16;
      const head = panelBase + panelHeight - gapAbove - headBoard;
      const maxH = Math.max(0.28, head - (panelBase + sillBoard + 0.04));
      winH = Math.min(maxH, winW * 0.42);
      sill = head - winH;
      const minSill = panelBase + sillBoard + 0.02;
      if (sill < minSill) {
        sill = minSill;
        winH = Math.max(0.28, head - sill);
      }
    } else {
      const sillFromBase = Math.min(0.85, panelHeight * 0.34);
      const maxH = Math.max(0.4, panelHeight - headBoard - sillFromBase - 0.22);
      winH = Math.min(maxH, Math.max(winW * 0.92, panelHeight * 0.42));
      sill = panelBase + sillFromBase;
    }
    const head = sill + winH;
    return { winW, winH, winY: (sill + head) / 2 - centerY, sill, head };
  }

  private frontOpenings(w: number, h: number, base: number) {
    const fullH = h - base;
    const belt = this.beltRise(h);
    const lowerH = Math.min(belt, fullH);
    const split = fullH > belt + 0.4 && !this.interiorCut();
    const openings: { x: number; winW: number; winH: number; winY: number; sill: number; head: number }[] = [];
    for (let p = 0; p < 4; p++) {
      const panelW = w / 4;
      const x = -w / 2 + (p + 0.5) * panelW;
      const bands = split
        ? [
            { id: `front-${p}`, upper: false, panelH: lowerH, panelBase: base },
            { id: `front-${p}u`, upper: true, panelH: fullH - lowerH, panelBase: base + lowerH }
          ]
        : [{ id: `front-${p}`, upper: false, panelH: fullH, panelBase: base }];
      for (const band of bands) {
        const slot = this.currentConfig.wallSlots[band.id];
        if (!slot || (slot.type !== 'door' && slot.type !== 'window')) continue;
        openings.push({
          x,
          ...this.fittedOpening(slot.type, slot.itemId, band.upper, panelW, band.panelH, band.panelBase)
        });
      }
    }
    return openings;
  }

  private fillStudGaps(
    x: number,
    z: number,
    base: number,
    wallTop: number,
    blocked: { sill: number; head: number }[],
    studThick: number,
    studDepth: number,
    mat: THREE.Material
  ) {
    const spans = [...blocked].sort((a, b) => a.sill - b.sill);
    let cursor = base + studThick;
    const top = wallTop - studThick;
    for (const span of spans) {
      const gap = Math.min(span.sill, top) - cursor;
      if (gap > 0.05) {
        const stud = new THREE.Mesh(new THREE.BoxGeometry(studThick, gap, studDepth), mat);
        stud.position.set(x, cursor + gap / 2, z);
        stud.castShadow = true;
        this.framingGroup.add(stud);
      }
      cursor = Math.max(cursor, span.head);
    }
    const tail = top - cursor;
    if (tail > 0.05) {
      const stud = new THREE.Mesh(new THREE.BoxGeometry(studThick, tail, studDepth), mat);
      stud.position.set(x, cursor + tail / 2, z);
      stud.castShadow = true;
      this.framingGroup.add(stud);
    }
  }

  private addOpeningCasing(
    parent: THREE.Group,
    opening: { winW: number; winH: number; winY: number },
    kind: 'door' | 'window',
    material: THREE.Material
  ) {
    const { winW, winH, winY } = opening;
    const side = kind === 'door' ? 0.1 : 0.09;
    const headH = kind === 'door' ? 0.1 : 0.085;
    const sillH = kind === 'door' ? 0 : 0.065;
    const depth = 0.038;
    const z = 0.032;
    const sideTop = winY + winH / 2;
    const sideBottom = winY - winH / 2 - sillH;
    const sideH = sideTop - sideBottom;
    const sideY = (sideTop + sideBottom) / 2;
    const boards: { x: number; y: number; w: number; h: number; d: number; z: number }[] = [
      { x: -(winW / 2 + side / 2), y: sideY, w: side, h: sideH, d: depth, z },
      { x: winW / 2 + side / 2, y: sideY, w: side, h: sideH, d: depth, z },
      { x: 0, y: winY + winH / 2 + headH / 2, w: winW + side * 2, h: headH, d: depth, z }
    ];
    if (kind === 'window') {
      boards.push({
        x: 0,
        y: winY - winH / 2 - sillH / 2,
        w: winW + side * 2 + 0.04,
        h: sillH,
        d: depth + 0.01,
        z: z + 0.004
      });
    }
    for (const board of boards) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(board.w, board.h, board.d), material);
      mesh.position.set(board.x, board.y, board.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { ...parent.userData, panelGroup: parent };
      parent.add(mesh);
      this.interactivePanels.push(mesh);
    }
  }

  private cornerTrimSize() {
    return { face: 0.098, thick: 0.028 };
  }

  /** Vertical wood boards covering each outside corner. The belt stops against them. */
  private addCornerBoards(
    w: number,
    d: number,
    h: number,
    rearH: number,
    baseElev: number,
    material: THREE.Material
  ) {
    const { face, thick } = this.cornerTrimSize();
    const corners = [
      { x: -1, z: 1, top: h },
      { x: 1, z: 1, top: h },
      { x: -1, z: -1, top: rearH },
      { x: 1, z: -1, top: rearH }
    ];
    for (const corner of corners) {
      const top = corner.top + 0.03;
      const height = top - baseElev;
      const y = baseElev + height / 2;
      const alongFront = new THREE.Mesh(new THREE.BoxGeometry(face, height, thick), material);
      alongFront.position.set(corner.x * (w / 2 + thick - face / 2), y, corner.z * (d / 2 + thick / 2));
      const alongSide = new THREE.Mesh(new THREE.BoxGeometry(thick, height, face), material);
      alongSide.position.set(corner.x * (w / 2 + thick / 2), y, corner.z * (d / 2 - face / 2));
      for (const board of [alongFront, alongSide]) {
        this.writeMetreUvs(board.geometry, y);
        board.castShadow = true;
        board.receiveShadow = true;
        this.wallsGroup.add(board);
      }
    }
  }

  private addSlopedCladding(
    parent: THREE.Group,
    panelWidth: number,
    panelHeight: number,
    slope: number,
    claddingThick: number,
    material: THREE.Material,
    userData: Record<string, unknown>,
    opening: { winW: number; winH: number; winY: number } | null
  ) {
    const halfW = panelWidth / 2;
    const halfH = panelHeight / 2;
    const topAt = (x: number) => halfH + x * slope;
    const shape = new THREE.Shape();
    shape.moveTo(-halfW, -halfH);
    shape.lineTo(halfW, -halfH);
    shape.lineTo(halfW, topAt(halfW));
    shape.lineTo(-halfW, topAt(-halfW));
    shape.closePath();
    if (opening) {
      const hole = new THREE.Path();
      const left = -opening.winW / 2;
      const right = opening.winW / 2;
      const bottom = opening.winY - opening.winH / 2;
      const top = opening.winY + opening.winH / 2;
      hole.moveTo(left, bottom);
      hole.lineTo(left, top);
      hole.lineTo(right, top);
      hole.lineTo(right, bottom);
      hole.closePath();
      shape.holes.push(hole);
    }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: claddingThick, bevelEnabled: false });
    geo.translate(0, 0, -claddingThick / 2);
    this.writeMetreUvs(geo, parent.position.y);
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = userData;
    parent.add(mesh);
    this.interactivePanels.push(mesh);
    return mesh;
  }

  private addSolidCladding(
    parent: THREE.Group,
    panelWidth: number,
    panelHeight: number,
    claddingThick: number,
    material: THREE.Material,
    userData: Record<string, unknown>
  ) {
    const panelGeo = new THREE.BoxGeometry(panelWidth, panelHeight, claddingThick);
    this.writeMetreUvs(panelGeo, parent.position.y);
    const panelMesh = new THREE.Mesh(panelGeo, material);
    panelMesh.castShadow = true;
    panelMesh.receiveShadow = true;
    panelMesh.userData = userData;
    parent.add(panelMesh);
    this.interactivePanels.push(panelMesh);
    return panelMesh;
  }

  private addCladdingAroundOpening(
    parent: THREE.Group,
    panelWidth: number,
    panelHeight: number,
    claddingThick: number,
    material: THREE.Material,
    opening: { winW: number; winH: number; winY: number },
    userData: Record<string, unknown>
  ) {
    const { winW, winH, winY } = opening;
    const sideW = (panelWidth - winW) / 2;
    const boards: { x: number; y: number; w: number; h: number }[] = [];
    if (sideW > 0.01) {
      boards.push({ x: -(panelWidth + winW) / 4, y: 0, w: sideW, h: panelHeight });
      boards.push({ x: (panelWidth + winW) / 4, y: 0, w: sideW, h: panelHeight });
    }
    const bottomH = winY - winH / 2 + panelHeight / 2;
    if (bottomH > 0.01) {
      boards.push({
        x: 0,
        y: (-panelHeight / 2 + (winY - winH / 2)) / 2,
        w: winW,
        h: bottomH
      });
    }
    const topH = panelHeight / 2 - (winY + winH / 2);
    if (topH > 0.01) {
      boards.push({
        x: 0,
        y: (winY + winH / 2 + panelHeight / 2) / 2,
        w: winW,
        h: topH
      });
    }

    let first: THREE.Mesh | null = null;
    for (const board of boards) {
      const piece = new THREE.BoxGeometry(board.w, board.h, claddingThick);
      this.writeMetreUvs(piece, parent.position.y + board.y);
      const mesh = new THREE.Mesh(piece, material);
      mesh.position.set(board.x, board.y, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = userData;
      parent.add(mesh);
      this.interactivePanels.push(mesh);
      first ??= mesh;
    }
    return first ?? this.addSolidCladding(parent, panelWidth, panelHeight, claddingThick, material, userData);
  }

  private addWindowFeature(
    parent: THREE.Group,
    opening: { winW: number; winH: number; winY: number },
    windowId: string | undefined,
    userData: Record<string, unknown>
  ) {
    const { winW, winH, winY } = opening;
    const frameT = 0.032;
    const frameD = 0.026;
    const frameMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.35 });
    const members: { x: number; y: number; w: number; h: number }[] = [
      { x: -(winW / 2 - frameT / 2), y: winY, w: frameT, h: winH },
      { x: winW / 2 - frameT / 2, y: winY, w: frameT, h: winH },
      { x: 0, y: winY + winH / 2 - frameT / 2, w: winW - frameT * 2, h: frameT },
      { x: 0, y: winY - winH / 2 + frameT / 2, w: winW - frameT * 2, h: frameT }
    ];
    for (const member of members) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(member.w, member.h, frameD), frameMat);
      frame.position.set(member.x, member.y, 0.02);
      frame.castShadow = true;
      parent.add(frame);
      this.markSelectable(frame, userData);
    }

    const frosted = windowId === 'frost';
    const glassW = Math.max(0.2, winW - frameT * 2);
    const glassH = Math.max(0.16, winH - frameT * 2);
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(glassW, glassH),
      new THREE.MeshStandardMaterial({
        color: frosted ? '#f1f5f9' : '#e3ddd4',
        transparent: true,
        opacity: frosted ? 0.62 : 0.58,
        roughness: frosted ? 0.55 : 0.12,
        metalness: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    glass.position.set(0, winY, 0.012);
    glass.renderOrder = 2;
    parent.add(glass);
    this.markSelectable(glass, userData);

    if (windowId === 'sprojat') {
      const mullionMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.35 });
      const vertMullion = new THREE.Mesh(new THREE.BoxGeometry(0.028, glassH, 0.03), mullionMat);
      vertMullion.position.set(0, winY, 0.02);
      parent.add(vertMullion);
      this.markSelectable(vertMullion, userData);
      const horizMullion = new THREE.Mesh(new THREE.BoxGeometry(glassW, 0.028, 0.03), mullionMat);
      horizMullion.position.set(0, winY, 0.02);
      parent.add(horizMullion);
      this.markSelectable(horizMullion, userData);
    }
  }

  private markSelectable(mesh: THREE.Mesh, userData: Record<string, unknown>) {
    mesh.userData = userData;
    this.interactivePanels.push(mesh);
  }

  private addDoorFeature(
    parent: THREE.Group,
    opening: { winW: number; winH: number; winY: number },
    doorId: string | undefined,
    userData: Record<string, unknown>
  ) {
    const doorW = opening.winW - 0.02;
    const doorH = opening.winH - 0.012;
    const doorY = opening.winY - 0.004;

    // Door leaf, with a real opening behind the glass so the room shows through.
    const leafZ = 0.02;
    const leafD = 0.045;
    const liteW = doorId === 'SVANSHALL' ? doorW * 0.72 : Math.min(0.16, doorW * 0.22);
    const liteH = doorId === 'SVANSHALL' ? doorH * 0.72 : Math.min(0.9, doorH * 0.46);
    const liteY = doorY + doorH * 0.08;
    const leafMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.35 });
    const leafParts: { x: number; y: number; w: number; h: number }[] = [
      { x: 0, y: (liteY + liteH / 2 + doorY + doorH / 2) / 2, w: doorW, h: doorY + doorH / 2 - (liteY + liteH / 2) },
      { x: 0, y: (doorY - doorH / 2 + liteY - liteH / 2) / 2, w: doorW, h: liteY - liteH / 2 - (doorY - doorH / 2) },
      { x: -(doorW + liteW) / 4, y: liteY, w: (doorW - liteW) / 2, h: liteH },
      { x: (doorW + liteW) / 4, y: liteY, w: (doorW - liteW) / 2, h: liteH }
    ];
    for (const part of leafParts) {
      if (part.w <= 0.01 || part.h <= 0.01) continue;
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(part.w, part.h, leafD), leafMat);
      leaf.position.set(part.x, part.y, leafZ);
      leaf.castShadow = true;
      parent.add(leaf);
      this.markSelectable(leaf, userData);
    }

    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(liteW, liteH),
      new THREE.MeshStandardMaterial({
        color: '#dbeafe',
        transparent: true,
        opacity: 0.07,
        roughness: 0.04,
        metalness: 0.04,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    glass.position.set(0, liteY, leafZ + leafD / 2 + 0.004);
    glass.renderOrder = 2;
    parent.add(glass);
    this.markSelectable(glass, userData);

    // Handle
    const handleGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.12);
    const handleMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.8, roughness: 0.2 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(doorW / 2 - 0.12, doorY, leafZ + leafD / 2 + 0.02);
    parent.add(handle);
    this.markSelectable(handle, userData);
  }

  private addGateFeature(
    parent: THREE.Group,
    pw: number,
    ph: number,
    wt: number,
    gateId: string | undefined,
    userData: Record<string, unknown>
  ) {
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
    this.markSelectable(gateMesh, userData);

    // Sectional horizontal ribs
    for (let r = -gateH / 2 + 0.4; r < gateH / 2; r += 0.45) {
      const ribGeo = new THREE.BoxGeometry(gateW, 0.02, wt + 0.07);
      const ribMat = new THREE.MeshStandardMaterial({ color: '#0f172a' });
      const rib = new THREE.Mesh(ribGeo, ribMat);
      rib.position.set(0, gateY + r, 0);
      parent.add(rib);
      this.markSelectable(rib, userData);
    }
  }

  private buildRoof(w: number, d: number, h: number) {
    const { roofType } = this.currentConfig;
    const overhang = 0.4;
    const roofMat = this.roofSurfaceMaterial();

    const whiteTrimMat = new THREE.MeshStandardMaterial({
      color: '#f4f1ea',
      roughness: 0.55
    });

    if (isGableRoof(roofType)) {
      this.addGableRoof(w, d, h, overhang, roofMat, whiteTrimMat);
    } else if (roofType === 'flackt') {
      this.addShallowRoof(w, d, h, overhang, 2, roofMat, whiteTrimMat);
    } else {
      // Pulpettak. The slab, barge boards, and fascia share one rotated assembly
      // so each board meets the next at an edge instead of occupying the same face.
      const angleRad = PULPET_PITCH_RAD;
      const rearH = Math.max(h - Math.tan(angleRad) * d, 2.4);
      const yMid = (h + rearH) / 2;
      const roofThick = 0.1;
      const slopeLen = (d + overhang * 2) / Math.cos(angleRad);
      const roofW = w + overhang * 2;
      const roofCenterY = yMid + (roofThick / 2) / Math.cos(angleRad);

      const assembly = new THREE.Group();
      assembly.position.set(0, roofCenterY, 0);
      assembly.rotation.x = -angleRad;

      const roofMesh = new THREE.Mesh(new THREE.BoxGeometry(roofW, roofThick, slopeLen), roofMat);
      roofMesh.castShadow = true;
      roofMesh.receiveShadow = true;
      assembly.add(roofMesh);

      const fasciaT = 0.022;
      const soffitT = 0.014;
      const fasciaBottom = -roofThick / 2 - soffitT - 0.004;
      const fasciaTop = roofThick / 2 - 0.008;
      const fasciaH = fasciaTop - fasciaBottom;
      const fasciaY = (fasciaBottom + fasciaTop) / 2;
      const bargeT = 0.032;
      const bargeH = roofThick - 0.012;

      const bargeGeo = new THREE.BoxGeometry(bargeT, fasciaH, slopeLen);
      const leftBarge = new THREE.Mesh(bargeGeo, whiteTrimMat);
      leftBarge.position.set(-(roofW / 2 + bargeT / 2 + 0.001), fasciaY, 0);
      leftBarge.castShadow = true;
      assembly.add(leftBarge);
      const rightBarge = new THREE.Mesh(bargeGeo, whiteTrimMat);
      rightBarge.position.set(roofW / 2 + bargeT / 2 + 0.001, fasciaY, 0);
      rightBarge.castShadow = true;
      assembly.add(rightBarge);

      const fasciaGeo = new THREE.BoxGeometry(roofW + bargeT * 2 + 0.004, fasciaH, fasciaT);
      const frontFascia = new THREE.Mesh(fasciaGeo, whiteTrimMat);
      frontFascia.position.set(0, fasciaY, slopeLen / 2 + fasciaT / 2 + 0.001);
      frontFascia.castShadow = true;
      assembly.add(frontFascia);
      const rearFasciaGeo = new THREE.BoxGeometry(roofW + bargeT * 2 + 0.004, bargeH, fasciaT);
      const rearFascia = new THREE.Mesh(rearFasciaGeo, whiteTrimMat);
      rearFascia.position.set(0, -0.008, -(slopeLen / 2 + fasciaT / 2 + 0.001));
      rearFascia.castShadow = true;
      assembly.add(rearFascia);

      // White soffit closes the front overhang so the eave reads as the reference fascia.
      const zFront = slopeLen / 2;
      const zWall = (d / 2) / Math.cos(angleRad) - (roofThick / 2) * Math.tan(angleRad);
      const soffitLen = Math.max(0.05, zFront - zWall);
      const soffitMat = new THREE.MeshStandardMaterial({
        color: '#f7f5f1',
        roughness: 0.72,
        emissive: '#f3f0ea',
        emissiveIntensity: 0.45
      });
      const soffit = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.02, soffitT, soffitLen),
        soffitMat
      );
      soffit.position.set(0, -roofThick / 2 - soffitT / 2 - 0.001, (zFront + zWall) / 2);
      soffit.receiveShadow = true;
      assembly.add(soffit);

      const sideReach = (roofW - w) / 2;
      const sideSoffitLen = slopeLen - fasciaT * 2;
      const sideSoffitGeo = new THREE.BoxGeometry(sideReach, soffitT, sideSoffitLen);
      for (const sign of [-1, 1]) {
        const sideSoffit = new THREE.Mesh(sideSoffitGeo, soffitMat);
        sideSoffit.position.set(sign * (w / 2 + sideReach / 2), -roofThick / 2 - soffitT / 2 - 0.001, 0);
        sideSoffit.receiveShadow = true;
        assembly.add(sideSoffit);
      }

      this.roofGroup.add(assembly);
    }
  }

  private addShallowRoof(
    w: number,
    d: number,
    h: number,
    overhang: number,
    pitchDeg: number,
    roofMat: THREE.Material,
    trimMat: THREE.Material
  ) {
    const angleRad = (pitchDeg * Math.PI) / 180;
    const roofThick = 0.07;
    const slopeLen = (d + overhang * 2) / Math.cos(angleRad);
    const roofW = w + overhang * 2;
    const yMid = h + Math.tan(angleRad) * (d / 2) * 0.15;
    const roofCenterY = yMid + (roofThick / 2) / Math.cos(angleRad) + 0.04;

    const assembly = new THREE.Group();
    assembly.position.set(0, roofCenterY, 0);
    assembly.rotation.x = -angleRad;

    const roofMesh = new THREE.Mesh(new THREE.BoxGeometry(roofW, roofThick, slopeLen), roofMat);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    assembly.add(roofMesh);

    const fasciaT = 0.03;
    const fascia = new THREE.Mesh(
      new THREE.BoxGeometry(roofW + 0.02, roofThick + 0.01, fasciaT),
      trimMat
    );
    fascia.position.set(0, -0.004, slopeLen / 2 + fasciaT / 2 + 0.001);
    fascia.castShadow = true;
    assembly.add(fascia);

    this.roofGroup.add(assembly);
  }

  private addGableRoof(
    w: number,
    d: number,
    h: number,
    overhang: number,
    roofMat: THREE.Material,
    trimMat: THREE.Material
  ) {
    const angleRad = this.gablePitchRad();
    const rise = Math.tan(angleRad) * (d / 2);
    const ridgeY = h + rise;
    const roofThick = 0.07;
    const roofW = w + overhang * 2;
    const slopeLen = (d / 2 + overhang) / Math.cos(angleRad) + 0.06;
    const bargeT = 0.028;
    // Inner end is local z = -bargeInset, which lands in the middle of the nockbalk after the slope rotation.
    const bargeLen = slopeLen + 0.12;
    const bargeInset = 0.02;

    const addSlope = (sign: 1 | -1) => {
      const slope = new THREE.Group();
      slope.position.set(0, ridgeY, 0);
      slope.rotation.x = sign * angleRad;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(roofW, roofThick, slopeLen), roofMat);
      mesh.position.set(0, roofThick / 2 + 0.012, sign * (slopeLen / 2 - 0.1));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      slope.add(mesh);

      const bargeGeo = new THREE.BoxGeometry(bargeT, roofThick + 0.02, bargeLen);
      const bargeZ = sign * (bargeLen / 2 - bargeInset);
      const bargeY = roofThick / 2 + 0.008;
      const leftBarge = new THREE.Mesh(bargeGeo, trimMat);
      leftBarge.position.set(-(roofW / 2 + bargeT / 2 + 0.001), bargeY, bargeZ);
      leftBarge.castShadow = true;
      slope.add(leftBarge);
      const rightBarge = new THREE.Mesh(bargeGeo, trimMat);
      rightBarge.position.set(roofW / 2 + bargeT / 2 + 0.001, bargeY, bargeZ);
      rightBarge.castShadow = true;
      slope.add(rightBarge);

      const fasciaT = 0.028;
      const fascia = new THREE.Mesh(
        new THREE.BoxGeometry(roofW + 0.02, roofThick, fasciaT),
        trimMat
      );
      fascia.position.set(0, roofThick / 2 - 0.004, sign * (slopeLen - fasciaT / 2));
      fascia.castShadow = true;
      slope.add(fascia);
      this.roofGroup.add(slope);
    };

    addSlope(1);
    addSlope(-1);

    // Nockbalk. Height matches the barge boards where they meet the beam, so the boards die into it flush.
    const beamH = 0.07;
    const beamD = 0.16;
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(roofW + bargeT * 2 + 0.004, beamH, beamD),
      new THREE.MeshStandardMaterial({ color: '#e4d2b4', roughness: 0.68 })
    );
    beam.position.set(0, ridgeY + 0.02, 0);
    beam.castShadow = true;
    this.roofGroup.add(beam);

    const ridge = new THREE.Mesh(
      new THREE.BoxGeometry(roofW + bargeT * 2 + 0.004, 0.035, beamD + 0.04),
      roofMat
    );
    ridge.position.set(0, ridgeY + 0.02 + beamH / 2 + 0.012, 0);
    ridge.castShadow = true;
    this.roofGroup.add(ridge);
  }

  private buildContactShadow(w: number, d: number) {
    if (this.contactShadow) {
      this.scene.remove(this.contactShadow);
      this.contactShadow.geometry.dispose();
      (this.contactShadow.material as THREE.Material).dispose();
      this.contactShadow = null;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(64, 64, 18, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(30, 41, 59, 0.28)');
    gradient.addColorStop(1, 'rgba(30, 41, 59, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(w + 2.4, d + 2.4),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.015;
    this.contactShadow = shadow;
    this.scene.add(shadow);
  }

  private buildRafters(w: number, d: number, h: number, _wt: number) {
    const ghost = this.loftCutaway();
    const rafterMat = ghost
      ? this.ghostBeamMaterial()
      : new THREE.MeshStandardMaterial({
          color: '#eedec5',
          roughness: 0.65,
          metalness: 0.02
        });

    const isPulpettak = this.currentConfig.roofType === 'pulpettak';
    const angleRad = PULPET_PITCH_RAD;
    const rearH = isPulpettak ? Math.max(h - Math.tan(angleRad) * d, 2.4) : h;
    const beamParent = ghost ? this.trussesGroup : this.framingGroup;

    const rafterW = 0.045;
    const rafterH = ghost ? 0.145 : 0.195;
    const count = Math.floor(w / 0.6) + 1; // cc 600 mm
    const spacing = w / (count - 1);

    if (isPulpettak) {
      const slopeAngle = Math.atan2(h - rearH, d);
      const span = Math.hypot(d, h - rearH);
      // A short tail sticks out above the windows and carries the overhang.
      const tail = ghost ? 0.45 : 0.22;
      const depth = ghost ? 0.145 : 0.1;
      const slopeLen = span + tail;
      const rafterGeo = new THREE.BoxGeometry(rafterW, depth, slopeLen);
      const shift = tail / 2;
      const midY = (h + rearH) / 2 - depth / 2 - (ghost ? 0 : 0.016);

      for (let i = 0; i < count; i++) {
        const rx = -w / 2 + i * spacing;
        const rafter = new THREE.Mesh(rafterGeo, rafterMat);
        rafter.position.set(
          rx,
          midY + Math.sin(slopeAngle) * shift,
          Math.cos(slopeAngle) * shift
        );
        rafter.rotation.x = -slopeAngle;
        rafter.castShadow = !ghost;
        beamParent.add(rafter);
      }
    } else if (this.currentConfig.roofType === 'flackt') {
      const angleRad = (2 * Math.PI) / 180;
      const len = ghost ? d + 0.7 : d - 0.2;
      const rafterGeo = new THREE.BoxGeometry(rafterW, ghost ? rafterH : 0.12, len);
      for (let i = 0; i < count; i++) {
        const rafter = new THREE.Mesh(rafterGeo, rafterMat);
        rafter.position.set(-w / 2 + i * spacing, h - (ghost ? rafterH / 2 - 0.04 : 0.12), 0);
        rafter.rotation.x = -angleRad;
        rafter.castShadow = !ghost;
        beamParent.add(rafter);
      }
    } else {
      const angleRad = this.gablePitchRad();
      const rise = Math.tan(angleRad) * (d / 2);
      const slopeLen = (d / 2) / Math.cos(angleRad) + (ghost ? 0.25 : 0.08);
      const rafterGeo = new THREE.BoxGeometry(rafterW, rafterH, slopeLen);
      const y = h + rise / 2 - rafterH / 2 + (ghost ? 0.04 : -0.02);

      for (let i = 0; i < count; i++) {
        const rx = -w / 2 + i * spacing;
        const frontRafter = new THREE.Mesh(rafterGeo, rafterMat);
        frontRafter.position.set(rx, y, d / 4);
        frontRafter.rotation.x = angleRad;
        frontRafter.castShadow = !ghost;
        beamParent.add(frontRafter);

        const rearRafter = new THREE.Mesh(rafterGeo, rafterMat);
        rearRafter.position.set(rx, y, -d / 4);
        rearRafter.rotation.x = -angleRad;
        rearRafter.castShadow = !ghost;
        beamParent.add(rearRafter);
      }
    }
  }

  // --- Loft Construction with Left/Right Placement, Area Sizes and 3D Stair ---
  private buildLoft(w: number, d: number, h: number, wt: number) {
    const loftArea = this.currentConfig.loftAreaSqMeters ?? 10.95;
    const placement = this.currentConfig.loftPlacement ?? 'vanster';
    const isTwoLofts = this.currentConfig.loftCount === 'tva';

    // Total house footprint reference for size-30 is 27.38 m2
    const houseAreaRef = this.currentConfig.widthMm === 4800 ? 13.7
      : this.currentConfig.widthMm === 5800 ? 22.8
      : this.currentConfig.widthMm === 8000 ? 36.5
      : 27.38;

    const areaFraction = Math.min(1.0, Math.max(0.25, loftArea / houseAreaRef));
    const interiorW = w - wt * 2;
    const interiorD = d - wt * 2;

    const loftD = interiorD;
    // Deck at least 2.5 m above the interior floor, with the joists above the door head.
    const loftElev = loftJoistTop(h);
    const joistH = 0.195; // 195 mm floor joists (45x195 mm bjälklag)
    const joistW = 0.045; // 45 mm joist thickness
    const floorboardThick = 0.028; // 28 mm massive granplank

    const timberMat = new THREE.MeshStandardMaterial({
      color: '#dfcaa6',
      roughness: 0.6,
      metalness: 0.02
    });

    const floorMat = new THREE.MeshStandardMaterial({
      color: '#e7d8c0',
      roughness: 0.45,
      metalness: 0.02
    });

    const buildSingleLoftSection = (sectionW: number, startX: number, isLeftSection: boolean) => {
      const sectionGroup = new THREE.Group();

      // 1. Floor Joists (Loftbjälklag 45x195 mm cc 600 mm) - visible from below matching Image 4
      const joistCount = Math.max(3, Math.floor(sectionW / 0.6) + 1);
      const joistSpacing = sectionW / (joistCount - 1);
      const joistGeo = new THREE.BoxGeometry(joistW, joistH, loftD);

      for (let j = 0; j < joistCount; j++) {
        const jx = startX + j * joistSpacing;
        const joistMesh = new THREE.Mesh(joistGeo, timberMat);
        joistMesh.position.set(jx, loftElev - joistH / 2, 0);
        joistMesh.castShadow = true;
        sectionGroup.add(joistMesh);
      }

      // Outer Edge Carrier Beam (Bärlina / Kantbjälke 45x195 mm) along the open room edge
      const edgeX = isLeftSection ? startX + sectionW : startX;
      const rimBeamGeo = new THREE.BoxGeometry(joistW * 1.5, joistH, loftD);
      const rimBeam = new THREE.Mesh(rimBeamGeo, timberMat);
      rimBeam.position.set(edgeX, loftElev - joistH / 2, 0);
      rimBeam.castShadow = true;
      sectionGroup.add(rimBeam);

      // 2. Top Floorboard Surface (Granplank 28x120 mm) matching Image 5
      const floorGeo = new THREE.BoxGeometry(sectionW, floorboardThick, loftD);
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.position.set(startX + sectionW / 2, loftElev + floorboardThick / 2, 0);
      floorMesh.receiveShadow = true;
      floorMesh.castShadow = true;
      sectionGroup.add(floorMesh);

      // 3. Safety Railing (Skyddsräcke 850 mm) along the open inner edge
      if (sectionW < interiorW * 0.95) {
        const railH = 0.85;
        const stairGap = this.currentConfig.hasLoftStair ? 0.7 : 0;
        const railLength = loftD - stairGap;

        // Top Handrail
        const handrail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, railLength), timberMat);
        handrail.position.set(edgeX, loftElev + railH, -stairGap / 2);
        sectionGroup.add(handrail);

        // Balusters (Spjälor cc 120 mm)
        const balusterCount = Math.floor(railLength / 0.12);
        for (let b = 0; b <= balusterCount; b++) {
          const bz = -loftD / 2 + (railLength / balusterCount) * b;
          const baluster = new THREE.Mesh(new THREE.BoxGeometry(0.025, railH, 0.025), timberMat);
          baluster.position.set(edgeX, loftElev + railH / 2, bz);
          sectionGroup.add(baluster);
        }
      }

      this.loftGroup.add(sectionGroup);
    };

    if (isTwoLofts) {
      // Two lofts: one left, one right, open center
      const eachW = Math.min((interiorW * 0.42), (interiorW * areaFraction) / 2);
      buildSingleLoftSection(eachW, -w / 2 + wt, true);
      buildSingleLoftSection(eachW, w / 2 - wt - eachW, false);
    } else {
      // Single loft: Left or Right placement
      const loftW = interiorW * areaFraction;
      if (placement === 'vanster') {
        buildSingleLoftSection(loftW, -w / 2 + wt, true);
      } else {
        buildSingleLoftSection(loftW, w / 2 - wt - loftW, false);
      }
    }

    // 4. Loft Stair (Lofttrappa i massiv furu) in 3D
    if (this.currentConfig.hasLoftStair) {
      this.buildLoftStair(w, d, h, wt, loftElev, placement, isTwoLofts, areaFraction);
    }
  }

  // --- Solid Pine Loft Staircase / Ladder in 3D ---
  private buildLoftStair(
    w: number,
    d: number,
    _h: number,
    wt: number,
    loftElev: number,
    placement: LoftPlacement,
    isTwoLofts: boolean,
    areaFraction: number
  ) {
    const pineMat = new THREE.MeshStandardMaterial({
      color: '#dfcaa6',
      roughness: 0.55,
      metalness: 0.02
    });

    const stairGroup = new THREE.Group();

    // Stair dimensions
    const stairW = 0.55; // 550 mm width
    const floorY = 0.275; // ground floor elevation
    const deltaY = loftElev - floorY;
    const interiorD = d - wt * 2;
    const runZ = loftStairRun(deltaY, interiorD);

    const stringerThick = 0.04;
    const stringerWidth = 0.16;
    const stringerLen = Math.hypot(deltaY, runZ);
    const stairAngle = Math.atan2(deltaY, runZ);

    // Position stair at the open edge of the loft
    const interiorW = w - wt * 2;
    let stairX = 0;

    if (isTwoLofts || placement === 'vanster') {
      const loftW = interiorW * (isTwoLofts ? 0.42 : areaFraction);
      stairX = -w / 2 + wt + loftW - stairW / 2;
    } else {
      const loftW = interiorW * areaFraction;
      stairX = w / 2 - wt - loftW + stairW / 2;
    }

    // Ground landing at front section of the loft edge
    const zStart = d / 2 - wt - runZ - 0.2;
    const zEnd = zStart + runZ;

    // 1. Left Stringer (Vangstycke)
    const stringerGeo = new THREE.BoxGeometry(stringerThick, stringerWidth, stringerLen);
    const leftStringer = new THREE.Mesh(stringerGeo, pineMat);
    leftStringer.position.set(-stairW / 2, floorY + deltaY / 2, (zStart + zEnd) / 2);
    leftStringer.rotation.x = -stairAngle;
    leftStringer.castShadow = true;
    stairGroup.add(leftStringer);

    // 2. Right Stringer
    const rightStringer = new THREE.Mesh(stringerGeo, pineMat);
    rightStringer.position.set(stairW / 2, floorY + deltaY / 2, (zStart + zEnd) / 2);
    rightStringer.rotation.x = -stairAngle;
    rightStringer.castShadow = true;
    stairGroup.add(rightStringer);

    // 3. Treads (Trappsteg 28x140 mm)
    const stepCount = loftStairTreads(deltaY);
    const treadGeo = new THREE.BoxGeometry(stairW - stringerThick * 2, 0.028, 0.14);

    for (let s = 1; s <= stepCount; s++) {
      const fraction = s / (stepCount + 1);
      const sy = floorY + deltaY * fraction;
      const sz = zStart + runZ * fraction;

      const tread = new THREE.Mesh(treadGeo, pineMat);
      tread.position.set(0, sy, sz);
      tread.castShadow = true;
      stairGroup.add(tread);
    }

    // 4. Safety Handrail on the outer side
    const handrailGeo = new THREE.BoxGeometry(0.04, 0.04, stringerLen);
    const handrail = new THREE.Mesh(handrailGeo, pineMat);
    handrail.position.set(stairW / 2 + 0.03, floorY + deltaY / 2 + 0.45, (zStart + zEnd) / 2);
    handrail.rotation.x = -stairAngle;
    stairGroup.add(handrail);

    // Handrail support posts
    const postGeo = new THREE.BoxGeometry(0.03, 0.45, 0.03);
    const bottomPost = new THREE.Mesh(postGeo, pineMat);
    bottomPost.position.set(stairW / 2 + 0.03, floorY + 0.225, zStart + 0.1);
    stairGroup.add(bottomPost);

    const topPost = new THREE.Mesh(postGeo, pineMat);
    topPost.position.set(stairW / 2 + 0.03, loftElev + 0.225, zEnd - 0.1);
    stairGroup.add(topPost);

    stairGroup.position.set(stairX, 0, 0);
    stairGroup.userData.type = 'staircase';
    this.loftGroup.add(stairGroup);
  }

  // --- Dimension Lines with 3D/Screen Coordinate Projection ---
  private buildDimensionLines(w: number, d: number, h: number) {
    const dimMat = new THREE.LineBasicMaterial({ color: '#1e293b', linewidth: 1.5 });
    const offset = 0.65;
    this.dimensionAnchors.clear();

    // 1. Front Width Dimension Line (bottom)
    const yFront = 0.05;
    const zFront = d / 2 + offset;
    const frontLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-w / 2, yFront, zFront),
      new THREE.Vector3(w / 2, yFront, zFront)
    ]);
    this.dimensionsGroup.add(new THREE.Line(frontLineGeo, dimMat));
    this.dimensionAnchors.set('width', new THREE.Vector3(0, yFront, zFront));

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
    this.dimensionAnchors.set('frontHeightRight', new THREE.Vector3(xRight, (0.2 + h) / 2, zRight));

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
    this.dimensionAnchors.set('frontHeightLeft', new THREE.Vector3(xLeft, (0.2 + h) / 2, zRight));

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
      const angleRad = PULPET_PITCH_RAD;
      const drop = Math.tan(angleRad) * d;
      const rearH = Math.max(h - drop, 2.4);
      const zRear = -d / 2;
      const rearHeightGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xLeft, 0.2, zRear),
        new THREE.Vector3(xLeft, rearH, zRear)
      ]);
      this.dimensionsGroup.add(new THREE.Line(rearHeightGeo, dimMat));
      this.dimensionAnchors.set(
        'rearHeightLeft',
        new THREE.Vector3(xLeft, (0.2 + rearH) / 2, zRear)
      );

      const rearRightGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xRight, 0.2, zRear),
        new THREE.Vector3(xRight, rearH, zRear)
      ]);
      this.dimensionsGroup.add(new THREE.Line(rearRightGeo, dimMat));
      this.dimensionAnchors.set(
        'rearHeightRight',
        new THREE.Vector3(xRight, (0.2 + rearH) / 2, zRear)
      );
      this.dimensionsGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(w / 2 + 0.1, 0.2, zRear),
            new THREE.Vector3(xRight + 0.15, 0.2, zRear)
          ]),
          dimMat
        )
      );
      this.dimensionsGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(w / 2 + 0.1, rearH, zRear),
            new THREE.Vector3(xRight + 0.15, rearH, zRear)
          ]),
          dimMat
        )
      );

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

      const pitchA = new THREE.Vector3(xLeft, h + 0.35, 0.4);
      const pitchB = new THREE.Vector3(xLeft, h + 0.35 - Math.tan(angleRad) * 0.8, -0.4);
      this.dimensionAnchors.set('pitchLeft', pitchA.clone().lerp(pitchB, 0.5));

      const rightPitchGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xRight, h + 0.35, 0.4),
        new THREE.Vector3(xRight, h + 0.35 - Math.tan(angleRad) * 0.8, -0.4)
      ]);
      this.dimensionsGroup.add(new THREE.Line(rightPitchGeo, angleMat));
      const rightBaseGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xRight, h + 0.35 - Math.tan(angleRad) * 0.8, 0.4),
        new THREE.Vector3(xRight, h + 0.35 - Math.tan(angleRad) * 0.8, -0.4)
      ]);
      this.dimensionsGroup.add(new THREE.Line(rightBaseGeo, dimMat));
      const pitchC = new THREE.Vector3(xRight, h + 0.35, 0.4);
      const pitchD = new THREE.Vector3(xRight, h + 0.35 - Math.tan(angleRad) * 0.8, -0.4);
      this.dimensionAnchors.set('pitchRight', pitchC.clone().lerp(pitchD, 0.5));
    }

    const ceilingY = 2.2 + eaveLiftMm(this.currentConfig.roofType) / 1000;
    this.dimensionAnchors.set('ceiling', new THREE.Vector3(0, ceilingY, 0));
    this.dimensionsGroup.visible = this.currentConfig.showDimensions;
  }

  private projectAnchor(point: THREE.Vector3, occlude = true) {
    const proj = point.clone().project(this.camera);
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const x = ((proj.x + 1) * width) / 2;
    const y = ((-proj.y + 1) * height) / 2;
    let visible = proj.z < 1 && x > -60 && x < width + 60 && y > -30 && y < height + 30;

    if (visible && occlude) {
      const direction = point.clone().sub(this.camera.position);
      const distance = direction.length();
      direction.normalize();
      this.labelRaycaster.set(this.camera.position, direction);
      this.labelRaycaster.far = Math.max(distance - 0.2, 0.01);
      const blocked = this.labelRaycaster.intersectObjects(
        [this.wallsGroup, this.roofGroup],
        true
      );
      if (blocked.length > 0) visible = false;
    }

    return { x, y, visible };
  }

  private bestVisibleAnchor(ids: string[]) {
    let best: { x: number; y: number; visible: boolean; id: string } | null = null;
    let bestDist = Infinity;
    for (const id of ids) {
      const point = this.dimensionAnchors.get(id);
      if (!point) continue;
      const projected = this.projectAnchor(point);
      if (!projected.visible) continue;
      const dist = this.camera.position.distanceToSquared(point);
      if (dist < bestDist) {
        bestDist = dist;
        best = { ...projected, id };
      }
    }
    return best ?? { x: 0, y: 0, visible: false, id: '' };
  }

  private publishDimensionLabels() {
    if (!this.onDimensionLabels) return;
    if (!this.currentConfig.showDimensions) {
      this.onDimensionLabels({
        width: { x: 0, y: 0, visible: false },
        frontHeight: { x: 0, y: 0, visible: false },
        rearHeight: { x: 0, y: 0, visible: false },
        pitch: { x: 0, y: 0, visible: false },
        ceiling: { x: 0, y: 0, visible: false }
      });
      return;
    }

    const widthPoint = this.dimensionAnchors.get('width');
    const front = this.bestVisibleAnchor(['frontHeightLeft', 'frontHeightRight']);
    const rear =
      this.currentConfig.roofType === 'pulpettak'
        ? this.bestVisibleAnchor(['rearHeightLeft', 'rearHeightRight'])
        : this.bestVisibleAnchor(
            front.id === 'frontHeightLeft' ? ['frontHeightRight'] : ['frontHeightLeft']
          );
    const pitch = this.bestVisibleAnchor(['pitchLeft', 'pitchRight']);
    const ceilingPoint = this.dimensionAnchors.get('ceiling');

    this.onDimensionLabels({
      width: widthPoint ? this.projectAnchor(widthPoint) : { x: 0, y: 0, visible: false },
      frontHeight: { x: front.x, y: front.y, visible: front.visible },
      rearHeight: { x: rear.x, y: rear.y, visible: rear.visible },
      pitch: { x: pitch.x, y: pitch.y, visible: pitch.visible },
      ceiling:
        this.currentConfig.viewMode === 'insida' && ceilingPoint
          ? this.projectAnchor(ceilingPoint, false)
          : { x: 0, y: 0, visible: false }
    });
  }

  private updateHighlightBox(target: THREE.Object3D | null) {
    if (this.highlightBox) {
      this.scene.remove(this.highlightBox);
      this.highlightBox = null;
    }
    if (!target) return;

    const bbox = new THREE.Box3().setFromObject(target);
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

  private updateHoverBox(target: THREE.Object3D | null) {
    if (this.hoverBox) {
      this.scene.remove(this.hoverBox);
      this.hoverBox = null;
    }
    if (!target) return;
    if (target.userData.slotId === this.currentConfig.selectedSlotId) return;

    const bbox = new THREE.Box3().setFromObject(target);
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
    const viewChanged =
      (config.viewMode !== undefined && config.viewMode !== this.currentConfig.viewMode) ||
      (config.loftView !== undefined && config.loftView !== this.currentConfig.loftView) ||
      (config.interiorView !== undefined && config.interiorView !== this.currentConfig.interiorView) ||
      (config.roofView !== undefined && config.roofView !== this.currentConfig.roofView);
    const cameraPosition = this.camera.position.clone();
    const cameraTarget = this.controls.target.clone();
    const interactionChanged = config.interactionMode !== undefined && config.interactionMode !== this.currentConfig.interactionMode;
    Object.assign(this.currentConfig, config);
    if (interactionChanged) {
      this.drawingWallPoints = [];
      if (this.drawingWallMesh) {
        this.scene.remove(this.drawingWallMesh);
        this.drawingWallMesh = null;
      }
    }
    if (config.isFullscreen) {
      this.currentConfig.selectedSlotId = null;
      this.updateHighlightBox(null);
      this.updateHoverBox(null);
    }
    this.rebuildScene();
    if (!viewChanged) {
      this.camera.position.copy(cameraPosition);
      this.controls.target.copy(cameraTarget);
      this.controls.update();
    }
  }

  public generateStandardElectrical() {
    // Mock the generation of standard electrical outlets
    // We'll just scatter a few boxes along the interior walls
    const outGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const outMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

    for (let i = 0; i < 4; i++) {
      const outlet = new THREE.Mesh(outGeo, outMat);
      outlet.position.set(
        (Math.random() - 0.5) * (this.currentConfig.widthMm / 1000 - 0.5),
        0.3, // 30cm above floor
        (Math.random() - 0.5) * (this.currentConfig.depthMm / 1000 - 0.5)
      );
      outlet.userData.type = 'electrical_outlet';
      this.interiorGroup.add(outlet);
    }
  }

  private createRoomGroup(roomType: string, w: number, d: number, open: ShellSides): THREE.Group {
    const group = new THREE.Group();
    group.userData.type = 'room_zone';
    group.userData.roomType = roomType;
    group.userData.w = w;
    group.userData.d = d;

    const floorGeo = new THREE.BoxGeometry(w, 0.05, d);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = 0.025;
    group.add(floor);

    const wallThick = 0.1;
    const wallH = 2.4;
    const wallBase = 0.05;
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x64748b });
    const trim = (againstShell: boolean) => (againstShell ? 0.01 : wallThick);

    const addPartition = (
      side: keyof ShellSides,
      along: number,
      height: number,
      centerAlong: number,
      y: number,
      fixed: number,
      axis: 'x' | 'z'
    ) => {
      if (along < 0.02 || height < 0.02) return;
      const geo = axis === 'x'
        ? new THREE.BoxGeometry(along, height, wallThick)
        : new THREE.BoxGeometry(wallThick, height, along);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(axis === 'x' ? centerAlong : fixed, y, axis === 'x' ? fixed : centerAlong);
      mesh.userData.partition = side;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
      group.add(mesh);
    };

    const addRun = (
      side: keyof ShellSides,
      span: number,
      center: number,
      fixed: number,
      axis: 'x' | 'z',
      withDoor: boolean
    ) => {
      const doorW = 0.8;
      const headerH = 0.3;
      if (!withDoor || span < doorW + 0.24) {
        addPartition(side, span, wallH, center, wallBase + wallH / 2, fixed, axis);
        return;
      }
      const jamb = (span - doorW) / 2;
      addPartition(side, jamb, wallH, center - (doorW + jamb) / 2, wallBase + wallH / 2, fixed, axis);
      addPartition(side, jamb, wallH, center + (doorW + jamb) / 2, wallBase + wallH / 2, fixed, axis);
      addPartition(side, doorW, headerH, center, wallBase + wallH - headerH / 2, fixed, axis);
    };

    const run = (length: number, trimStart: number, trimEnd: number) => {
      const size = Math.max(length - trimStart - trimEnd, 0.05);
      return { size, center: (trimStart - trimEnd) / 2 };
    };

    const doorSide = (['front', 'right', 'back', 'left'] as const).find((side) => !open[side]);
    if (!open.back) {
      const { size, center } = run(w, trim(open.left), trim(open.right));
      addRun('back', size, center, -d / 2 + wallThick / 2, 'x', doorSide === 'back');
    }
    if (!open.front) {
      const { size, center } = run(w, trim(open.left), trim(open.right));
      addRun('front', size, center, d / 2 - wallThick / 2, 'x', doorSide === 'front');
    }
    if (!open.left) {
      const { size, center } = run(d, trim(open.back), trim(open.front));
      addRun('left', size, center, -w / 2 + wallThick / 2, 'z', doorSide === 'left');
    }
    if (!open.right) {
      const { size, center } = run(d, trim(open.back), trim(open.front));
      addRun('right', size, center, w / 2 - wallThick / 2, 'z', doorSide === 'right');
    }

    const edge = (againstShell: boolean) => (againstShell ? 0.02 : wallThick);
    if (roomType === 'bathroom') {
      const showerGeo = new THREE.BoxGeometry(0.9, 0.1, 0.9);
      const showerMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1 });
      const shower = new THREE.Mesh(showerGeo, showerMat);
      shower.position.set(-w / 2 + 0.45 + edge(open.left), 0.05, -d / 2 + 0.45 + edge(open.back));
      group.add(shower);
      const glassGeo = new THREE.BoxGeometry(0.9, 2.0, 0.02);
      const glassMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.4 });
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.set(-w / 2 + 0.45 + edge(open.left), 1.0, -d / 2 + 0.9 + edge(open.back));
      group.add(glass);

      const wcGeo = new THREE.BoxGeometry(0.4, 0.45, 0.5);
      const wcMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const wc = new THREE.Mesh(wcGeo, wcMat);
      wc.position.set(w / 2 - 0.4 - edge(open.right), 0.225, -d / 2 + 0.25 + edge(open.back));
      group.add(wc);

      const sinkGeo = new THREE.BoxGeometry(0.6, 0.15, 0.4);
      const sink = new THREE.Mesh(sinkGeo, wcMat);
      sink.position.set(w / 2 - 0.3 - edge(open.right), 0.85, 0);
      group.add(sink);
    } else if (roomType === 'kitchen') {
      const counterGeo = new THREE.BoxGeometry(Math.max(0.6, w - edge(open.left) - edge(open.right)), 0.9, 0.6);
      const counterMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
      const counter = new THREE.Mesh(counterGeo, counterMat);
      counter.position.set((edge(open.left) - edge(open.right)) / 2, 0.45, -d / 2 + 0.3 + edge(open.back));
      group.add(counter);
    } else if (roomType === 'bedroom') {
      const bedGeo = new THREE.BoxGeometry(1.6, 0.5, 2.0);
      const bedMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
      const bed = new THREE.Mesh(bedGeo, bedMat);
      bed.position.set(0, 0.25, -d / 2 + 1.0 + edge(open.back));
      group.add(bed);
    }

    const handleMat = new THREE.MeshBasicMaterial({ visible: false });
    const handleThickness = 0.4;
    const handleInset = handleThickness / 2;
    const handles: Array<[keyof ShellSides, number, number, number, number, number]> = [
      ['left', handleThickness, wallH, d, -w / 2 + handleInset, 0],
      ['right', handleThickness, wallH, d, w / 2 - handleInset, 0],
      ['front', w, wallH, handleThickness, 0, d / 2 - handleInset],
      ['back', w, wallH, handleThickness, 0, -d / 2 + handleInset]
    ];
    for (const [side, sx, sy, sz, px, pz] of handles) {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), handleMat);
      handle.position.set(px, wallBase + wallH / 2, pz);
      handle.userData = { type: 'room_drag', side, roomId: null };
      group.add(handle);
      this.roomDragHandles.push(handle);
    }

    return group;
  }

  public updateRoomSize(roomId: string, expectedRoomType: string, w: number, d: number, x?: number, y?: number, z?: number) {
    const existing = this.interiorGroup.children.find(c => c.userData.type === 'room_zone' && c.userData.roomId === roomId);
    let currentX = x ?? 0;
    let currentY = y ?? 0.3;
    let currentZ = z ?? 0;
    let roomType = expectedRoomType;

    if (existing) {
      currentX = existing.position.x;
      currentY = existing.position.y;
      currentZ = existing.position.z;
      roomType = existing.userData.roomType;
      this.interiorGroup.remove(existing);
    }

    this.roomDragHandles = this.roomDragHandles.filter(h => h.userData.roomId !== roomId);

    const { hx, hz } = this.shellLimits();
    const fitted = fitRoom({ x: x ?? currentX, z: z ?? currentZ, w, d }, hx, hz);
    const newRoom = this.createRoomGroup(roomType, fitted.w, fitted.d, shellSides(fitted, hx, hz));
    newRoom.userData.roomId = roomId;
    newRoom.children.forEach(c => {
      if (c.userData.type === 'room_drag') c.userData.roomId = roomId;
    });
    newRoom.position.set(fitted.x, y ?? currentY, fitted.z);

    this.interiorGroup.add(newRoom);
  }

  /** Parts a paper note can follow. Stored without rebuilding the house. */
  public setNoteTargets(ids: string[]) {
    this.noteTargets = ids;
  }

  /** World points a paper note sticks to. */
  public setNotePins(pins: { id: string; x: number; y: number; z: number; nx?: number; ny?: number; nz?: number }[]) {
    this.notePins = pins;
  }

  /** Arm the ruler. Orbit stays available once both ends are chosen. */
  public setMeasureMode(active: boolean, allowOrbit: boolean) {
    this.measuring = active;
    const placing = active && !allowOrbit;
    this.controls.mouseButtons.LEFT = placing ? null : THREE.MOUSE.ROTATE;
    this.controls.touches.ONE = placing ? null : THREE.TOUCH.ROTATE;
    if (!active) {
      this.measureDown = null;
      this.container.style.cursor = 'default';
    }
  }

  /** World ends of the ruler band. The second point can be the pointer while it stretches. */
  public setMeasureLine(
    from: { x: number; y: number; z: number } | null,
    to: { x: number; y: number; z: number } | null
  ) {
    if (!from || !to) {
      this.measureFrom = null;
      this.measureTo = null;
      return;
    }
    this.measureFrom = this.measureFromPoint.set(from.x, from.y, from.z);
    this.measureTo = this.measureToPoint.set(to.x, to.y, to.z);
  }

  private publishMeasure() {
    if (!this.onMeasureScreen) return;
    if (!this.measureFrom || !this.measureTo) {
      this.onMeasureScreen(null);
      return;
    }
    this.onMeasureScreen({
      start: this.projectAnchor(this.measureFrom, false),
      end: this.projectAnchor(this.measureTo, false)
    });
  }

  /** The house surface under a screen point, or nothing when the point is on the empty canvas. */
  public housePointAt(clientX: number, clientY: number) {
    const rect = this.container.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return null;
    this.pickMouse.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(this.pickMouse, this.camera);
    const hit = this.raycaster.intersectObjects([this.houseGroup], true).find((item) => {
      let object: THREE.Object3D | null = item.object;
      while (object) {
        if (!object.visible) return false;
        object = object.parent;
      }
      return true;
    });
    if (!hit) return null;
    const point = hit.point;
    const facing = { x: 0, y: 0, z: 1 };
    if (hit.face) {
      this.notePoint.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
      if (this.notePoint.dot(this.raycaster.ray.direction) > 0) this.notePoint.negate();
      facing.x = Math.round(this.notePoint.x * 1000) / 1000;
      facing.y = Math.round(this.notePoint.y * 1000) / 1000;
      facing.z = Math.round(this.notePoint.z * 1000) / 1000;
    }
    return {
      x: Math.round(point.x * 1000) / 1000,
      y: Math.round(point.y * 1000) / 1000,
      z: Math.round(point.z * 1000) / 1000,
      nx: facing.x,
      ny: facing.y,
      nz: facing.z
    };
  }

  private anchorFor(id: string) {
    const w = this.currentConfig.widthMm / 1000;
    const d = this.currentConfig.depthMm / 1000;
    const h = this.wallTopM();
    const mid = Math.max((h - 0.25) * 0.45, 0.8);
    if (id === 'roof') return this.notePoint.set(0, h + 0.35, 0);
    if (id === 'floor') return this.notePoint.set(0, 0.4, 0);
    if (id === 'loft') {
      if (!this.currentConfig.hasLoft) return null;
      return this.notePoint.set(0, h * 0.72, 0);
    }
    if (id === 'wall-front') return this.notePoint.set(0, mid, d / 2);
    if (id === 'wall-back') return this.notePoint.set(0, mid, -d / 2);
    if (id === 'wall-left') return this.notePoint.set(-w / 2, mid, 0);
    if (id === 'wall-right') return this.notePoint.set(w / 2, mid, 0);
    if (id.startsWith('slot:')) {
      const mesh = this.interactivePanels.find((item) => item.userData.slotId === id.slice(5));
      if (!mesh) return null;
      this.noteBox.setFromObject(mesh);
      if (this.noteBox.isEmpty()) return null;
      return this.noteBox.getCenter(this.notePoint);
    }
    return null;
  }

  private publishNoteAnchors() {
    if (!this.onNoteAnchors) return;
    const anchors: Record<string, { x: number; y: number; visible: boolean }> = {};
    for (const id of this.noteTargets) {
      const point = this.anchorFor(id);
      const occlude = id.startsWith('wall-') || id.startsWith('slot:');
      anchors[id] = point
        ? this.projectAnchor(point, occlude)
        : { x: 0, y: 0, visible: false };
    }
    for (const pin of this.notePins) {
      anchors[pin.id] = this.projectAnchor(this.notePoint.set(pin.x, pin.y, pin.z), true);
    }
    this.onNoteAnchors(anchors);
  }

  /** Lay each stuck note flat on its panel and match the WebGL camera. */
  private publishNotePlanes() {
    if (!this.onNotePlanes) return;
    if (!this.notePins.length) {
      this.onNotePlanes('', {});
      return;
    }
    this.camera.updateMatrixWorld();
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const fov = this.camera.projectionMatrix.elements[5] * (height / 2);
    const camera = noteCameraTransform(this.camera.matrixWorldInverse.elements, fov, width, height);
    const house = {
      widthM: this.currentConfig.widthMm / 1000,
      depthM: this.currentConfig.depthMm / 1000,
      heightM: this.wallTopM()
    };
    const planes: Record<string, { transform: string; visible: boolean }> = {};
    for (const pin of this.notePins) {
      const stored = pin.nx !== undefined && pin.ny !== undefined && pin.nz !== undefined
        ? { x: pin.nx, y: pin.ny, z: pin.nz }
        : inferNoteNormal(pin, house);
      const axes = noteAxes(stored);
      this.noteBasis.makeBasis(
        this.notePoint.set(axes.right.x, axes.right.y, axes.right.z),
        new THREE.Vector3(axes.up.x, axes.up.y, axes.up.z),
        new THREE.Vector3(axes.face.x, axes.face.y, axes.face.z)
      );
      this.notePose.position.set(pin.x, pin.y, pin.z).addScaledVector(
        new THREE.Vector3(axes.face.x, axes.face.y, axes.face.z),
        0.012
      );
      this.notePose.quaternion.setFromRotationMatrix(this.noteBasis);
      this.notePose.scale.setScalar(NOTE_SURFACE_SCALE);
      this.notePose.rotateZ(noteTiltRadians(pin.id));
      this.notePose.updateMatrixWorld(true);
      const towardCamera = this.camera.position.clone().sub(this.notePose.position);
      const facing = towardCamera.dot(new THREE.Vector3(axes.face.x, axes.face.y, axes.face.z)) > 0.15;
      const projected = this.notePose.position.clone().project(this.camera);
      planes[pin.id] = {
        transform: noteSheetTransform(this.notePose.matrixWorld.elements),
        visible: facing && projected.z < 1 && !this.noteBlocked(this.notePose.position)
      };
    }
    this.onNotePlanes(camera, planes);
  }

  private noteBlocked(point: THREE.Vector3) {
    const direction = point.clone().sub(this.camera.position);
    const distance = direction.length();
    if (distance < 0.2) return false;
    direction.normalize();
    this.labelRaycaster.set(this.camera.position, direction);
    this.labelRaycaster.far = Math.max(distance - 0.15, 0.01);
    return this.labelRaycaster.intersectObjects([this.wallsGroup, this.roofGroup], true).length > 0;
  }

  /** Move the green outline without rebuilding the house or moving the camera. */
  public setSelectedSlot(slotId: string | null) {
    this.currentConfig.selectedSlotId = slotId;
    if (!slotId) {
      this.updateHighlightBox(null);
      return;
    }
    const mesh = this.interactivePanels.find((item) => item.userData.slotId === slotId);
    this.updateHighlightBox(mesh ? this.boundsOf(mesh) : null);
  }

  public setViewMode(mode: 'utsida' | 'insida' | 'blueprint') {
    this.currentConfig.viewMode = mode;
    this.applyViewMode();
  }

  private applyViewMode() {
    if (this.currentConfig.viewMode === 'blueprint') {
      this.roofGroup.visible = false;
      this.trussesGroup.visible = false;
      this.framingGroup.visible = false;
      this.loftGroup.visible = this.currentConfig.hasLoft;
      this.dimensionsGroup.visible = false;
      this.camera.position.set(0, 14, 0); // Top-down
      this.controls.target.set(0, 0, 0);

      if (!this.gridHelper) {
        this.gridHelper = new THREE.GridHelper(20, 40, 0x94a3b8, 0xe2e8f0);
        this.gridHelper.position.y = 0.01; // Slightly above floor
        this.scene.add(this.gridHelper);
      }
      this.gridHelper.visible = true;
    } else if (this.loftCutaway()) {
      this.roofGroup.visible = false;
      this.trussesGroup.visible = true;
      this.framingGroup.visible = true;
      this.loftGroup.visible = true;
      this.dimensionsGroup.visible = false;
      this.camera.position.set(3.4, 10.2, 6.4);
      this.controls.target.set(0, 1.55, -0.2);
      if (this.gridHelper) this.gridHelper.visible = false;
    } else if (this.currentConfig.viewMode === 'insida' || this.currentConfig.interiorView) {
      this.roofGroup.visible = false;
      this.trussesGroup.visible = false;
      this.framingGroup.visible = false;
      this.loftGroup.visible = true;
      this.dimensionsGroup.visible = false;

      // If we are just inside 'insida' mode we should place camera inside.
      // If we are in 'utsida' mode but interiorView is true, we could keep the camera where it is or switch it.
      // We'll just set it to 'insida' view camera.
      this.camera.position.set(0, 7.5, 4.0);
      this.controls.target.set(0, 1.2, 0);
      if (this.gridHelper) this.gridHelper.visible = false;
    } else {
      this.roofGroup.visible = true;
      this.trussesGroup.visible = false;
      this.framingGroup.visible = true;
      this.loftGroup.visible = true;
      this.dimensionsGroup.visible = this.currentConfig.showDimensions;

      if (this.currentConfig.roofView) {
        this.camera.position.set(0, 10, 8);
        this.controls.target.set(0, 2.5, 0);
      } else {
        this.camera.position.set(0, 3.2, 13.5);
        this.controls.target.set(0, 2.2, 0);
      }

      if (this.gridHelper) this.gridHelper.visible = false;
    }
    const inside = this.currentConfig.viewMode === 'insida';
    this.controls.minDistance = inside ? 0.4 : 3.5;
    this.camera.near = inside ? 0.05 : 0.1;
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  /** Return the camera to the starting frame for the current view. */
  public resetView() {
    this.applyViewMode();
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

  /** Draw the current frame before a thumbnail read. The animation loop may not have painted yet. */
  public renderStill() {
    this.renderer.render(this.scene, this.camera);
  }

  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.publishDimensionLabels();
    this.publishNoteAnchors();
    this.publishNotePlanes();
    this.publishMeasure();

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
