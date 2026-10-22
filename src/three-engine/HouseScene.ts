import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  PULPET_PITCH_DEG,
  type CameraView,
  type MaterialKey,
  type WallSlot,
  type LoftPlacement,
  type LoftCount,
  type LoftStairPosition,
  type LoftStairType,
  type PanelOrientation,
  type RoofCovering
} from '../store/useConfigStore';
import { STUGAN_V4_ROOF_PITCH_DEG } from '../store/stuganV4';
import { panelCountForWall } from '../store/wallSlots';
import {
  normalizeBuildingRoof,
  terraceAdditionLayout,
  terraceBoardLayout,
  type HouseTerrace,
  type TerraceSide
} from '../outside/terrace';
import { addTerraceCabin } from './terraceBuilding';
import { addTerraceHotTub } from './terraceHotTub';
import { computeDoorCanopyLayout, isDoorCoveredByAddition } from '../outside/canopy';
import { headingForFacing, type CompassFacing } from './sunPosition';
import { calculateCompassHeading, createSceneLighting, updateSunPosition } from './lighting';
import { eaveLiftMm, gablePitchDegrees, isGableRoof, wallPlateHeightM, type RoofId } from '../store/roof';
import { inferNoteNormal, noteAxes, noteCameraTransform, noteSheetTransform, noteTiltRadians, stickFacing, NOTE_SURFACE_SCALE } from '../notes/surface';
import { paintBoards } from '../color/paint';
import {
  INTERIOR_FLOOR_TOP,
  LOFT_FLOORBOARD,
  curvedLoftStair,
  loftEndPoint,
  loftEndRotation,
  loftIsGhosted,
  loftJoistTop,
  loftStairOpening,
  loftStairRun,
  loftStairTreads,
  straightLoftStair,
  isLoftRoom,
  loftWallStudsVisible,
  loftDeckBounds,
  loftStairClearRect,
  maximizeLoftBedroom,
  loftRailBlockedSpans,
  subtractRailSpans,
  type LoftBounds
} from './loftLevel';
import { ceilingStations, loftCeilingY, sliceStations, type CeilingStation, type RoofSlope } from './roofClearance';
import { NARROW_TALL, OVERLIGHT, PORTRAIT_PANORAMA, containWindowInPanel, fittedDoorOpening, fittedWindowOpening, narrowTallPane, openingClearOfRoof, overlightHeight, portraitPane, rhythmOpeningsInRun, windowOpeningChanged } from './windowFit';
import { fitRoom, innerHalf, roomFootprint, roomWallRuns, shellSides, SHELL_TOUCH, bedroomBedPlacement, type RoomBox, type ShellSides, type RoomBounds } from './roomWalls';
import {
  CONCRETE_WALL_THICK_M,
  concreteCrownHeightM,
  isConcreteFoundationOnly,
  timberShellOnConcrete
} from '../store/paabyggnad';
import { MEASURE_CURSOR } from '../measure/length';
import {
  applyCladdingRepeat,
  createCornerBoardBumpMap,
  createCornerBoardTexture,
  createPineFloorTexture,
  createRoofSurfaceMaterial,
  createVerticalPlankBumpMap,
  createVerticalPlankTexture,
  writeMetreUvs,
  writeSingleBoardUvs
} from './materials';
import {
  calculateFacingPose,
  captureCameraView,
  easeInOutCubic,
  motionReduced,
  stepCameraFlight,
  type CameraFlight
} from './cameraFlight';
const PULPET_PITCH_RAD = (PULPET_PITCH_DEG * Math.PI) / 180;
const STUGAN_PULPET_PITCH_RAD = (STUGAN_V4_ROOF_PITCH_DEG * Math.PI) / 180;
export { MEASURE_CURSOR };

interface LoftStairPlan {
  edgeX: number;
  openSign: number;
  endSign: number;
  stairZ: number;
  rise: number;
  run: number;
  opening: { width: number; depth: number };
}

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
  loftStairType?: LoftStairType;
  loftStairPosition?: LoftStairPosition;
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
  /** Upright boards on the front door bay while the rest of the facade lies flat. */
  verticalDoorBay?: boolean;
  /** Visible board width, millimetres. 145 is the standard 22×145 board. */
  panelWidthMm: number;
  showDimensions: boolean;
  showInnerWalls?: boolean;
  selectedSlotId: string | null;
  wallSlots: Record<string, WallSlot>;
  isFullscreen?: boolean;
  /** Small roof over each exterior door. */
  doorCanopy?: boolean;
  /** Roof sheet ends at the walls. A metal band covers the edge and the wall top. */
  flushRoof?: boolean;
  /** Decks around the house. At most one on each side. */
  terraces?: HouseTerrace[];
  /** Corner boards color ('same' | 'white' | 'falurod' | 'grey' | 'black' | 'wood' | hex) */
  cornerColor?: string | null;
  /** Window / door casing colour ('same' | 'white' | 'falurod' | 'grey' | 'black' | 'wood' | hex) */
  frameColor?: string | null;
  /** Whether exterior corner boards (knutbrädor) are visible. */
  cornerBoards?: boolean;
  /** Existing concrete footprint; at 10 cm only its foundation curb remains. */
  concreteBase?: boolean;
  /** Concrete house plan, millimetres. Centered inside the timber shell. */
  concreteWidthMm?: number;
  concreteDepthMm?: number;
  /** Concrete wall height, or a 100 mm foundation-only curb. */
  concreteHeightMm?: number;
  /** Extra concrete walls inside the open shell. */
  concreteWalls?: { id: string; axis: 'x' | 'z'; offsetMm: number }[];
  /** Exterior color of the concrete walls (hex code). */
  concreteColor?: string | null;
  /** Isolated structural framing walkthrough mode */
  framingWalkthrough?: boolean;
  /** Current builder walkthrough step (1 to 7) */
  framingStep?: number;
  /**
   * Stugan V4: pulpet falls east→west (along width). High eave on the right (+X)
   * when the south facade faces +Z.
   */
  roofFallAxis?: 'depth' | 'width';
  /** Override mono-pitch degrees (Stugan V4 uses 10°). */
  pulpetPitchDeg?: number;
  /** Per-edge overhangs in metres. Defaults to the usual 0.4 m / flush 0.02 m. */
  roofOverhangs?: { front: number; back: number; left: number; right: number };
}

interface OutsideAnchor {
  px: number;
  pz: number;
  rotY: number;
  doorX: number;
  width: number;
  head: number;
  wall: 'front' | 'back' | 'left' | 'right';
  itemId?: string;
  cornerSide?: 'left' | 'right' | null;
  panelWidth?: number;
}

export interface FramingHoverItem {
  nameSv: string;
  nameEn: string;
  dimension?: string;
  step?: number;
  screenX: number;
  screenY: number;
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
  /** Pieces of a front or back loft go here so the whole deck can turn. */
  private loftBuildParent: THREE.Group | null = null;
  private loftMaterialState = new WeakMap<THREE.Material, {
    transparent: boolean;
    opacity: number;
    depthWrite: boolean;
  }>();
  private loftMeshState = new WeakMap<THREE.Mesh, {
    castShadow: boolean;
    receiveShadow: boolean;
    renderOrder: number;
  }>();
  private foundationGroup: THREE.Group;
  private wallsGroup: THREE.Group;
  private concreteGroup: THREE.Group;
  private framingGroup: THREE.Group;
  private innerWallsGroup: THREE.Group;
  private ceilingDrywallGroup: THREE.Group | null = null;
  private trussesGroup: THREE.Group;
  private dimensionsGroup: THREE.Group;
  private interiorGroup: THREE.Group;
  private activeFramingMat = new THREE.MeshStandardMaterial({
    color: '#f59e0b',
    emissive: '#b45309',
    emissiveIntensity: 0.25,
    roughness: 0.45,
    metalness: 0.05,
    side: THREE.DoubleSide
  });
  private builtFramingMat = new THREE.MeshStandardMaterial({
    color: '#eedec5',
    roughness: 0.65,
    metalness: 0.02,
    side: THREE.DoubleSide
  });
  private drywallMat!: THREE.MeshStandardMaterial;
  private highlightBox: THREE.LineSegments | null = null;
  private contactShadow: THREE.Mesh | null = null;
  private hoverBox: THREE.Object3D | null = null;
  private groundMesh: THREE.Mesh | null = null;
  private gridHelper: THREE.GridHelper | null = null;
  private sunLight!: THREE.DirectionalLight;
  private skyFill!: THREE.DirectionalLight;
  private sunTarget!: THREE.Object3D;
  private sunHour = 12;
  private facingDeg = 180;
  private sunUp = true;
  private compassSent = Number.NaN;
  private defaultView: CameraView | null = null;
  /** True once the opening frame has been placed, so later moves can ease. */
  private cameraReady = false;
  /** The camera is still on the framed pose, so a resize may ease it along. */
  private followFrame = true;
  private ghostShown = 0;
  /** Rebuilds that are not a view change should not fade the loft from scratch. */
  private ghostInstant = true;
  private ghostFlight: { from: number; to: number; started: number; duration: number } | null = null;
  private cameraFlight: CameraFlight | null = null;
  private shellFlight: { from: THREE.Vector3; started: number; duration: number } | null = null;
  private shellNow = new THREE.Vector3(1, 1, 1);

  private interactivePanels: THREE.Mesh[] = [];
  private draggingRoom: {
    roomId: string;
    pointerId: number;
    startW: number;
    startD: number;
    startX: number;
    startZ: number;
    currentX: number;
    currentZ: number;
    startY: number;
    startPt: { x: number; y: number; z: number };
  } | null = null;
  /** A finger press becomes a panel selection only when it ends as a tap. */
  private panelTouchPress: {
    pointerId: number;
    slotId: string;
    x: number;
    y: number;
  } | null = null;
  private roomMovePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private roomMovePoint = new THREE.Vector3();
  private raycaster = new THREE.Raycaster();
  private labelRaycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private animFrameId: number | null = null;
  private currentConfig: SceneConfig;

  // Callbacks for 3D interactions
  public onPanelClick?: (slotId: string, screenX: number, screenY: number) => void;
  public onPanelHover?: (slotId: string | null, screenX: number, screenY: number) => void;
  public onFramingItemHover?: (item: FramingHoverItem | null) => void;
  private framingHoverBox: THREE.LineSegments | null = null;
  public onSlotMove?: (fromSlotId: string, toSlotId: string) => boolean;
  public onDragStateChange?: (isDragging: boolean) => void;
  public onSlotScreenPositionUpdate?: (pos: { x: number; y: number; visible: boolean; slotId: string }) => void;
  /** Bays whose window still sticks out of the wall until the user fits it. */
  public onWindowFitOffers?: (slotIds: string[]) => void;
  private windowFitOfferIds: string[] = [];
  public onDimensionLabels?: (labels: Record<string, { x: number; y: number; visible: boolean }>) => void;
  public onNoteAnchors?: (anchors: Record<string, { x: number; y: number; visible: boolean }>) => void;
  public onNotePlanes?: (camera: string, planes: Record<string, { transform: string; visible: boolean }>) => void;
  /** Screen compass. Degrees clockwise from the top of the view to world north. */
  public onCompassDial?: (degrees: number) => void;
  public onMeasurePick?: (point: { x: number; y: number; z: number }) => void;
  public onMeasureCursor?: (point: { x: number; y: number; z: number } | null) => void;
  public onMeasureScreen?: (screen: {
    start: { x: number; y: number; visible: boolean };
    end: { x: number; y: number; visible: boolean };
  } | null) => void;
  public onRoomPlaced?: (id: string, type: string, w: number, d: number, x: number, y: number, z: number) => void;
  public onRoomResize?: (id: string, w: number, d: number, x: number, y: number, z: number) => void;
  public onRoomSelect?: (id: string) => void;
  private selectedRoomId: string | null = null;
  public onInteractionComplete?: () => void;
  private draggingSlot: {
    slotId: string;
    pointerId: number;
    startX: number;
    startY: number;
    hasMoved: boolean;
    hitMesh: THREE.Mesh;
  } | null = null;
  private dragTargetBox: THREE.Object3D | null = null;
  private hoveredTargetSlotId: string | null = null;
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
      loftStairType: initialConfig?.loftStairType ?? 'straight',
      loftStairPosition: initialConfig?.loftStairPosition ?? 'front',
      loftCount: initialConfig?.loftCount ?? 'ett',
      viewMode: initialConfig?.viewMode ?? 'utsida',
      loftView: initialConfig?.loftView ?? false,
      interiorView: initialConfig?.interiorView ?? false,
      roofView: initialConfig?.roofView ?? false,
      material: initialConfig?.material ?? 'wood',
      customHex: initialConfig?.customHex ?? null,
      panelOrientation: initialConfig?.panelOrientation ?? 'staende',
      verticalDoorBay: initialConfig?.verticalDoorBay ?? false,
      panelWidthMm: initialConfig?.panelWidthMm ?? 145,
      showDimensions: initialConfig?.showDimensions ?? false,
      showInnerWalls: initialConfig?.showInnerWalls ?? true,
      selectedSlotId: initialConfig?.selectedSlotId ?? null,
      wallSlots: initialConfig?.wallSlots ?? {},
      doorCanopy: initialConfig?.doorCanopy ?? false,
      flushRoof: initialConfig?.flushRoof ?? false,
      terraces: initialConfig?.terraces ?? [],
      cornerColor: initialConfig?.cornerColor ?? 'same',
      frameColor: initialConfig?.frameColor ?? 'white',
      cornerBoards: initialConfig?.cornerBoards ?? true,
      concreteBase: initialConfig?.concreteBase ?? false,
      concreteWidthMm: initialConfig?.concreteWidthMm ?? 5200,
      concreteDepthMm: initialConfig?.concreteDepthMm ?? 5200,
      concreteHeightMm: initialConfig?.concreteHeightMm ?? 2500,
      concreteWalls: initialConfig?.concreteWalls ?? [],
      concreteColor: initialConfig?.concreteColor ?? '#b7b3ac'
    };

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#f3f5f7');

    this.camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      1000
    );
    const narrowStart = container.clientWidth < 1180;
    this.camera.position.set(0, narrowStart ? 6.5 : 3.2, narrowStart ? 26 : 13.5);

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
    this.controls.target.set(0, narrowStart ? 0.4 : 2.2, 0);
    this.controls.addEventListener('start', this.onControlStart);

    this.setupLighting();

    this.houseGroup = new THREE.Group();
    this.foundationGroup = new THREE.Group();
    this.concreteGroup = new THREE.Group();
    this.wallsGroup = new THREE.Group();
    this.framingGroup = new THREE.Group();
    this.innerWallsGroup = new THREE.Group();
    this.trussesGroup = new THREE.Group();
    this.roofGroup = new THREE.Group();
    this.loftGroup = new THREE.Group();
    this.dimensionsGroup = new THREE.Group();
    this.interiorGroup = new THREE.Group();
    this.drywallMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.88,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    this.houseGroup.add(this.foundationGroup);
    this.houseGroup.add(this.wallsGroup);
    this.houseGroup.add(this.framingGroup);
    this.houseGroup.add(this.innerWallsGroup);
    this.houseGroup.add(this.trussesGroup);
    this.houseGroup.add(this.roofGroup);
    this.houseGroup.add(this.loftGroup);
    this.houseGroup.add(this.interiorGroup);
    this.scene.add(this.houseGroup);
    this.scene.add(this.concreteGroup);
    this.scene.add(this.dimensionsGroup);

    this.setupRaycasting();
    this.rebuildScene();
    this.cameraReady = true;
    this.animate();

    window.addEventListener('resize', this.onResize);
  }

  // --- Procedural Canvas Textures for Authentic Scandinavian Timber ---
  private createVerticalPlankTexture(
    materialKey: MaterialKey,
    upright = false,
    overrideColor?: string | null
  ): THREE.CanvasTexture {
    return createVerticalPlankTexture(
      {
        material: materialKey,
        customHex: this.currentConfig.customHex,
        panelOrientation: this.currentConfig.panelOrientation,
        panelWidthMm: this.currentConfig.panelWidthMm
      },
      upright,
      overrideColor
    );
  }

  /** Four boards per tile. Repeat so each board is the chosen width. */
  private applyCladdingRepeat(texture: THREE.Texture, upright = false) {
    applyCladdingRepeat(
      texture,
      {
        panelOrientation: this.currentConfig.panelOrientation,
        panelWidthMm: this.currentConfig.panelWidthMm
      },
      upright
    );
  }

  /** Store UV axes in metres so the shared repeat matches the board size on every face. */
  private writeMetreUvs(geo: THREE.BufferGeometry, yShift: number) {
    writeMetreUvs(geo, yShift);
  }

  /** Single solid vertical corner board (knutbräda) texture without internal tiling seams or gaplines. */
  private createCornerBoardTexture(
    materialKey: MaterialKey,
    overrideColor?: string | null
  ): THREE.CanvasTexture {
    return createCornerBoardTexture(materialKey, this.currentConfig.customHex, overrideColor);
  }

  private createCornerBoardBumpMap(): THREE.CanvasTexture {
    return createCornerBoardBumpMap();
  }

  /** Map UVs across a single solid board without internal tiling seams or gaplines. */
  private writeSingleBoardUvs(geo: THREE.BufferGeometry, yShift: number) {
    writeSingleBoardUvs(geo, yShift);
  }

  private roofSurfaceMaterial(): THREE.MeshStandardMaterial {
    return createRoofSurfaceMaterial(this.currentConfig.roofCovering);
  }

  private createVerticalPlankBumpMap(upright = false): THREE.CanvasTexture {
    return createVerticalPlankBumpMap(
      {
        panelOrientation: this.currentConfig.panelOrientation,
        panelWidthMm: this.currentConfig.panelWidthMm
      },
      upright
    );
  }

  private createPineFloorTexture(): THREE.CanvasTexture {
    return createPineFloorTexture();
  }


  private setupLighting() {
    const { sunLight, skyFill, sunTarget, groundMesh } = createSceneLighting(this.scene);
    this.sunLight = sunLight;
    this.skyFill = skyFill;
    this.sunTarget = sunTarget;
    this.groundMesh = groundMesh;
    this.placeSun();
  }

  /** Move the sun and its shadow. The house mesh stays put; the compass carries the bearing. */
  public setDaylight(
    hour: number,
    facing: CompassFacing,
    _labels?: { north: string; east: string; south: string; west: string }
  ) {
    this.sunHour = hour;
    this.facingDeg = headingForFacing(facing);
    this.placeSun();
    this.compassSent = Number.NaN;
  }

  public setDefaultView(view: CameraView | null) {
    this.defaultView = view
      ? { x: view.x, y: view.y, z: view.z, tx: view.tx, ty: view.ty, tz: view.tz }
      : null;
  }

  public captureView(): CameraView {
    return captureCameraView(this.camera, this.controls);
  }

  private placeSun() {
    this.sunUp = updateSunPosition(
      this.sunLight,
      this.skyFill,
      this.sunTarget,
      this.sunHour,
      this.facingDeg
    );
  }

  /** Keep the corner compass pointing at world north as the camera orbits. */
  private publishCompassDial() {
    if (!this.onCompassDial || this.currentConfig.viewMode !== 'utsida') return;
    const degrees = calculateCompassHeading(this.camera, this.facingDeg);
    if (degrees === this.compassSent) return;
    this.compassSent = degrees;
    this.onCompassDial(degrees);
  }

  private roomPreviewGroup: THREE.Object3D | null = null;

  private shellLimits() {
    return innerHalf(this.currentConfig.widthMm / 1000, this.currentConfig.depthMm / 1000);
  }

  private loftLimits(): LoftBounds | null {
    if (!this.currentConfig.hasLoft) return null;
    return loftDeckBounds(
      this.currentConfig.widthMm / 1000,
      this.currentConfig.depthMm / 1000,
      this.currentConfig.loftAreaSqMeters ?? 10.95,
      this.currentConfig.loftPlacement ?? 'vanster',
      this.currentConfig.loftCount === 'tva',
      Boolean(this.currentConfig.concreteBase)
    );
  }

  /** Stair floor opening in house-local coords (null when the loft has no stair). */
  private loftStairClearInHouse() {
    if (!this.currentConfig.hasLoft || !this.currentConfig.hasLoftStair) return null;
    const shell = this.timberShell();
    const w = shell.widthM;
    const d = shell.depthM;
    const wt = 0.18;
    const placement = this.currentConfig.loftPlacement ?? 'vanster';
    const isTwoLofts = this.currentConfig.loftCount === 'tva';
    const endOn = !isTwoLofts && (placement === 'fram' || placement === 'bak');
    const planW = endOn ? d : w;
    const planD = endOn ? w : d;
    const loftArea = this.currentConfig.loftAreaSqMeters ?? 10.95;
    const isConcrete = Boolean(this.currentConfig.concreteBase && !this.concreteFoundationOnly());
    const houseAreaRef = isConcrete
      ? (this.currentConfig.widthMm / 1000) * (this.currentConfig.depthMm / 1000)
      : (this.currentConfig.widthMm === 4800 ? 13.7
        : this.currentConfig.widthMm === 5800 ? 22.8
        : this.currentConfig.widthMm === 8000 ? 36.5
        : 27.38);
    const areaFraction = Math.min(1.0, Math.max(0.25, loftArea / houseAreaRef));
    const loftElev = isConcrete
      ? this.concreteCrownM() + 0.195
      : loftJoistTop(this.wallTopM());
    const side: LoftPlacement = endOn ? 'vanster' : placement;
    const plan = this.loftStairPlan(planW, planD, wt, loftElev, side, isTwoLofts, areaFraction);
    const clear = loftStairClearRect({
      edgeX: plan.edgeX,
      openSign: plan.openSign as 1 | -1,
      stairZ: plan.stairZ,
      opening: plan.opening
    });
    if (!endOn) return clear;
    // Front/back deck is built in a rotated host; map the opening back to house axes.
    const corners = [
      { x: clear.minX, z: clear.minZ },
      { x: clear.minX, z: clear.maxZ },
      { x: clear.maxX, z: clear.minZ },
      { x: clear.maxX, z: clear.maxZ }
    ].map((p) => loftEndPoint(placement, p.x, p.z));
    return {
      minX: Math.min(...corners.map((c) => c.x)),
      maxX: Math.max(...corners.map((c) => c.x)),
      minZ: Math.min(...corners.map((c) => c.z)),
      maxZ: Math.max(...corners.map((c) => c.z))
    };
  }

  private roomLimits(y?: number): { hx: number; hz: number; bounds?: RoomBounds } {
    const shell = this.shellLimits();
    const loft = y !== undefined && isLoftRoom(y) ? this.loftLimits() : null;
    return {
      hx: shell.hx,
      hz: shell.hz,
      bounds: loft ? { minX: loft.minX, maxX: loft.maxX, minZ: loft.minZ, maxZ: loft.maxZ } : undefined
    };
  }

  private getRoomShellSides(box: RoomBox, hx: number, hz: number, y = 0.3): ShellSides {
    const sides = shellSides(box, hx, hz);
    if (this.currentConfig.concreteBase && !isLoftRoom(y)) {
      const cw = (this.currentConfig.concreteWidthMm ?? 5200) / 1000;
      const cd = (this.currentConfig.concreteDepthMm ?? 5200) / 1000;
      const thick = CONCRETE_WALL_THICK_M;
      const shell = this.timberShell();
      const concreteLeft = -(cw / 2 - thick);
      const concreteRight = cw / 2 - thick;
      const concreteBack = -(cd / 2 - thick) - shell.z;
      if (box.x - box.w / 2 <= concreteLeft + SHELL_TOUCH) sides.left = true;
      if (box.x + box.w / 2 >= concreteRight - SHELL_TOUCH) sides.right = true;
      if (box.z - box.d / 2 <= concreteBack + SHELL_TOUCH) sides.back = true;
    }
    return sides;
  }

  /** Plan size stored on the room. The drag handles must not inflate it. */
  private roomPlan(group: THREE.Object3D) {
    const w = Number(group.userData.w);
    const d = Number(group.userData.d);
    if (Number.isFinite(w) && Number.isFinite(d) && w > 0 && d > 0) return { w, d };
    const box = new THREE.Box3().setFromObject(group);
    return { w: box.max.x - box.min.x, d: box.max.z - box.min.z };
  }

  /** Release geometries and materials owned by a room or its preview. */
  private disposeObject(object: THREE.Object3D) {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    object.traverse((child) => {
      const { geometry, material } = child as THREE.Mesh;
      if (geometry) geometries.add(geometry);
      if (!material) return;
      if (Array.isArray(material)) material.forEach((entry) => materials.add(entry));
      else materials.add(material);
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
  }

  private clearRoomPreview() {
    const preview = this.roomPreviewGroup;
    if (!preview) return;
    if (preview.parent) preview.parent.remove(preview);
    else this.scene.remove(preview);
    this.disposeObject(preview);
    this.roomPreviewGroup = null;
    this.syncLoftPresentation();
  }

  private updateRoomPreview(roomType: string | null, pt?: { x: number, y: number, z: number }) {
    if (!roomType || !pt) {
      this.clearRoomPreview();
      return;
    }

    const footprint = roomFootprint(roomType);
    const shell = this.timberShell();
    const localX = pt.x - shell.x;
    const localZ = pt.z - shell.z;
    const { hx, hz, bounds } = this.roomLimits(pt.y);
    let fitted = fitRoom({ x: localX, z: localZ, w: footprint.w, d: footprint.d }, hx, hz, bounds);
    const onLoft = isLoftRoom(pt.y);
    if (onLoft && roomType === 'bedroom' && bounds) {
      const loft = this.loftLimits();
      if (loft) {
        fitted = fitRoom(
          maximizeLoftBedroom({
            x: fitted.x,
            z: fitted.z,
            loft,
            stair: this.loftStairClearInHouse()
          }),
          hx,
          hz,
          bounds
        );
      }
    }

    if (onLoft) {
      this.clearRoomPreview();
      const group = this.createRoomGroup(
        roomType,
        fitted.w,
        fitted.d,
        this.getRoomShellSides(fitted, hx, hz, pt.y),
        { x: fitted.x, y: pt.y, z: fitted.z }
      );
      group.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const { material } = child;
        if (!(material instanceof THREE.MeshStandardMaterial)) return;
        material.color.set(0x3b82f6);
        material.transparent = true;
        material.opacity = 0.45;
        material.depthWrite = false;
      });
      group.position.set(fitted.x, pt.y, fitted.z);
      group.userData.onLoft = true;
      this.roomPreviewGroup = group;
      this.houseGroup.add(group);
      this.syncLoftPresentation();
      return;
    }

    if (!(this.roomPreviewGroup instanceof THREE.Mesh) || this.roomPreviewGroup.userData.roomType !== roomType) {
      this.clearRoomPreview();
      const geo = new THREE.BoxGeometry(footprint.w, 2.4, footprint.d);
      const mat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.5 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData.roomType = roomType;
      this.roomPreviewGroup = mesh;
      this.houseGroup.add(mesh);
    }

    const preview = this.roomPreviewGroup;
    preview.visible = true;
    preview.scale.set(
      footprint.w > 0 ? fitted.w / footprint.w : 1,
      1,
      footprint.d > 0 ? fitted.d / footprint.d : 1
    );
    preview.position.set(fitted.x, 1.2, fitted.z);
  }

  private isGlobalListening = false;

  private attachGlobalDragListeners() {
    if (this.isGlobalListening || typeof window === 'undefined') return;
    this.isGlobalListening = true;
    window.addEventListener('pointermove', this.onGlobalPointerMove, { passive: true });
    window.addEventListener('pointerup', this.onGlobalPointerUp);
    window.addEventListener('keydown', this.onGlobalKeyDown);
  }

  private detachGlobalDragListeners() {
    if (!this.isGlobalListening || typeof window === 'undefined') return;
    this.isGlobalListening = false;
    window.removeEventListener('pointermove', this.onGlobalPointerMove);
    window.removeEventListener('pointerup', this.onGlobalPointerUp);
    window.removeEventListener('keydown', this.onGlobalKeyDown);
  }

  private onGlobalPointerMove = (e: PointerEvent) => {
    if (this.draggingSlot || this.draggingRoom) {
      this.handlePointerMove(e);
    }
  };

  private onGlobalPointerUp = (e: PointerEvent) => {
    if (this.draggingSlot || this.draggingRoom) {
      this.handlePointerUp(e);
    }
  };

  private onGlobalKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && (this.draggingSlot || this.draggingRoom)) {
      this.cancelActiveDrag();
    }
  };

  private handlePointerMove(e: PointerEvent) {
    if (
      this.panelTouchPress?.pointerId === e.pointerId
      && Math.hypot(e.clientX - this.panelTouchPress.x, e.clientY - this.panelTouchPress.y) > 12
    ) {
      this.panelTouchPress = null;
    }

    if (this.measuring) {
      this.onMeasureCursor?.(this.housePointAt(e.clientX, e.clientY));
      this.container.style.cursor = MEASURE_CURSOR;
      if (this.renderer?.domElement) {
        this.renderer.domElement.style.cursor = MEASURE_CURSOR;
      }
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
      if (this.outsideShell()) {
        this.updateRoomPreview(null);
        return;
      }
      const pt = this.housePointAt(e.clientX, e.clientY);
      if (pt) {
        const roomType = this.currentConfig.interactionMode.split('_').pop()!;
        this.updateRoomPreview(roomType, pt);
      } else {
        this.updateRoomPreview(null);
      }
      return;
    } else {
      this.updateRoomPreview(null);
    }
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (this.draggingRoom && !this.outsideShell()) {
      const pt = this.roomPointAt(e.clientX, e.clientY, this.draggingRoom.startY);
      if (pt) {
        const dx = pt.x - this.draggingRoom.startPt.x;
        const dz = pt.z - this.draggingRoom.startPt.z;
        const newX = Math.round((this.draggingRoom.startX + dx) * 20) / 20;
        const newZ = Math.round((this.draggingRoom.startZ + dz) * 20) / 20;
        const { hx, hz, bounds } = this.roomLimits(this.draggingRoom.startY);
        const fitted = fitRoom({
          x: newX,
          z: newZ,
          w: this.draggingRoom.startW,
          d: this.draggingRoom.startD
        }, hx, hz, bounds);
        const room = this.interiorGroup.children.find((child) => child.userData.roomId === this.draggingRoom?.roomId);
        if (room) room.position.set(fitted.x, this.draggingRoom.startY, fitted.z);
        this.draggingRoom.currentX = fitted.x;
        this.draggingRoom.currentZ = fitted.z;
      }
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (this.currentConfig.interactionMode === 'default' && !this.outsideShell() && this.interiorGroup.children.length > 0) {
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

    if (this.draggingSlot) {
      const dx = e.clientX - this.draggingSlot.startX;
      const dy = e.clientY - this.draggingSlot.startY;
      if (!this.draggingSlot.hasMoved && Math.hypot(dx, dy) > 8) {
        this.draggingSlot.hasMoved = true;
        this.container.style.cursor = 'grabbing';
        this.updateHoverBox(null);
        this.onPanelHover?.(null, 0, 0);
        this.onDragStateChange?.(true);
      }
      if (this.draggingSlot.hasMoved) {
        this.updateHoverBox(null);
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const hits = this.outsideShell()
          ? this.raycaster.intersectObjects(this.interactivePanels, false)
          : [];
        if (hits.length > 0) {
          const targetHit = hits[0].object as THREE.Mesh;
          const targetSlotId = targetHit.userData.slotId as string;
          const sourceSlot = this.currentConfig.wallSlots[this.draggingSlot.slotId];
          const targetSlot = this.currentConfig.wallSlots[targetSlotId];
          const isDoor = sourceSlot?.type === 'door' || sourceSlot?.type === 'gate';
          const isInvalidUpper = isDoor && targetSlot?.canAcceptDoor === false;
          const isValid = targetSlotId !== this.draggingSlot.slotId && !isInvalidUpper;
          this.hoveredTargetSlotId = targetSlotId;
          const hasCanopy = sourceSlot?.type === 'door' && Boolean(this.currentConfig.doorCanopy);
          this.updateDragTargetBox(targetHit, isValid, hasCanopy);
        } else {
          this.hoveredTargetSlotId = null;
          this.updateDragTargetBox(null, false);
        }
        return;
      }
    }

    if (this.currentConfig.framingWalkthrough) {
      this.updateHoverBox(null);
      this.onPanelHover?.(null, 0, 0);

      const candidates: THREE.Mesh[] = [];
      const collectVisibleMeshes = (group: THREE.Group | undefined) => {
        if (!group || !group.visible) return;
        group.traverse((obj) => {
          if (obj instanceof THREE.Mesh && obj.visible) {
            candidates.push(obj);
          }
        });
      };

      collectVisibleMeshes(this.framingGroup);
      collectVisibleMeshes(this.trussesGroup);
      collectVisibleMeshes(this.concreteGroup);
      collectVisibleMeshes(this.foundationGroup);

      const hits = this.raycaster.intersectObjects(candidates, false);
      if (hits.length > 0) {
        const hitMesh = hits[0].object as THREE.Mesh;
        let targetObj: THREE.Object3D | null = hitMesh;
        while (
          targetObj &&
          !targetObj.userData?.framingNameSv &&
          targetObj !== this.framingGroup &&
          targetObj !== this.trussesGroup &&
          targetObj !== this.concreteGroup &&
          targetObj.parent
        ) {
          targetObj = targetObj.parent;
        }
        if (!targetObj || !targetObj.userData?.framingNameSv) {
          targetObj = hitMesh;
        }

        const nameSv = (targetObj.userData?.framingNameSv as string) || (targetObj.userData?.concrete ? 'Befintlig betongkonstruktion' : 'Byggkomponent');
        const nameEn = (targetObj.userData?.framingNameEn as string) || (targetObj.userData?.concrete ? 'Existing Concrete Structure' : 'Framing Component');
        const dimension = targetObj.userData?.dimension as string | undefined;
        const step = typeof targetObj.userData?.framingStep === 'number' ? targetObj.userData.framingStep : undefined;

        this.container.style.cursor = 'help';
        this.updateFramingHoverBox(targetObj);
        this.onFramingItemHover?.({
          nameSv,
          nameEn,
          dimension,
          step,
          screenX: e.clientX,
          screenY: e.clientY
        });
        return;
      } else {
        this.container.style.cursor = 'default';
        this.updateFramingHoverBox(null);
        this.onFramingItemHover?.(null);
        return;
      }
    }

    const intersects = this.outsideShell()
      ? this.raycaster.intersectObjects(this.interactivePanels, false)
      : [];

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      const slotId = hit.userData.slotId as string;
      if (slotId) {
        const slot = this.currentConfig.wallSlots[slotId];
        const hasItem = slot && slot.type !== 'empty';
        this.container.style.cursor = hasItem ? 'grab' : 'pointer';
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
    this.updateFramingHoverBox(null);
    this.onFramingItemHover?.(null);
  }

  private handlePointerUp = (e: PointerEvent) => {
    if (this.draggingRoom) {
      this.finishRoomDrag(true);
      this.draggingRoom = null;
      this.controls.enabled = true;
      this.container.style.cursor = 'default';
      this.detachGlobalDragListeners();
      this.onDragStateChange?.(false);
      return;
    }
    if (this.draggingSlot) {
      const drag = this.draggingSlot;
      this.draggingSlot = null;
      this.controls.enabled = true;
      this.updateDragTargetBox(null, false);
      this.container.style.cursor = 'default';
      this.detachGlobalDragListeners();
      this.onDragStateChange?.(false);

      if (drag.hasMoved) {
        let targetId = this.hoveredTargetSlotId;
        if (!targetId && this.outsideShell()) {
          const rect = this.container.getBoundingClientRect();
          this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          this.raycaster.setFromCamera(this.mouse, this.camera);
          const hits = this.raycaster.intersectObjects(this.interactivePanels, false);
          if (hits.length > 0) {
            targetId = hits[0].object.userData.slotId as string;
          }
        }
        if (targetId && targetId !== drag.slotId) {
          this.onSlotMove?.(drag.slotId, targetId);
        }
        this.hoveredTargetSlotId = null;
        return;
      } else {
        this.selectPanel(drag.slotId, drag.hitMesh, e.clientX, e.clientY);
        return;
      }
    }
    if (this.panelTouchPress?.pointerId === e.pointerId) {
      const press = this.panelTouchPress;
      this.panelTouchPress = null;
      const moved = Math.hypot(e.clientX - press.x, e.clientY - press.y);
      if (moved <= 12) {
        const hit = this.interactivePanels.find((panel) => panel.userData.slotId === press.slotId);
        if (hit) this.selectPanel(press.slotId, hit, e.clientX, e.clientY);
      }
      return;
    }
    if (!this.measuring || e.button !== 0 || !this.measureDown) return;
    const moved = Math.hypot(e.clientX - this.measureDown.x, e.clientY - this.measureDown.y);
    this.measureDown = null;
    if (moved > 6) return;
    const point = this.housePointAt(e.clientX, e.clientY);
    if (point) this.onMeasurePick?.(point);
  };

  private cancelActiveDrag = () => {
    if (this.draggingRoom) {
      this.finishRoomDrag(false);
      this.draggingRoom = null;
      this.controls.enabled = true;
      this.container.style.cursor = 'default';
    }
    if (this.draggingSlot) {
      this.draggingSlot = null;
      this.controls.enabled = true;
      this.updateDragTargetBox(null, false);
      this.hoveredTargetSlotId = null;
      this.container.style.cursor = 'default';
    }
    if (this.panelTouchPress) {
      this.panelTouchPress = null;
    }
    this.measureDown = null;
    this.detachGlobalDragListeners();
    this.onDragStateChange?.(false);
  };

  private handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (this.measuring) {
      this.measureDown = e.button === 0 ? { x: e.clientX, y: e.clientY } : null;
      return;
    }
    if (this.currentConfig.isFullscreen) return;

    if (!this.outsideShell() && this.currentConfig.interactionMode === 'draw_wall') {
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

    if (!this.outsideShell() && this.currentConfig.interactionMode === 'place_utility') {
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

    if (!this.outsideShell() && this.currentConfig.interactionMode.startsWith('place_room_')) {
      const pt = this.housePointAt(e.clientX, e.clientY);
      if (pt) {
        const shell = this.timberShell();
        const localX = pt.x - shell.x;
        const localZ = pt.z - shell.z;
        const roomType = this.currentConfig.interactionMode.split('_').pop()!;
        const vecPt = new THREE.Vector3(
          Math.round(localX * 10) / 10,
          0,
          Math.round(localZ * 10) / 10
        );

        const footprint = roomFootprint(roomType);
        const baseY = isLoftRoom(pt.y) ? pt.y : 0.3;
        const { hx, hz, bounds } = this.roomLimits(baseY);
        let fitted = fitRoom({ x: vecPt.x, z: vecPt.z, w: footprint.w, d: footprint.d }, hx, hz, bounds);
        // Loft bedrooms with walls fill the deck zone and leave the stair clear.
        if (roomType === 'bedroom' && isLoftRoom(baseY) && bounds) {
          const loft = this.loftLimits();
          if (loft) {
            const maximized = maximizeLoftBedroom({
              x: fitted.x,
              z: fitted.z,
              loft,
              stair: this.loftStairClearInHouse()
            });
            fitted = fitRoom(maximized, hx, hz, bounds);
          }
        }
        const roomGroup = this.createRoomGroup(
          roomType,
          fitted.w,
          fitted.d,
          this.getRoomShellSides(fitted, hx, hz, baseY),
          { x: fitted.x, y: baseY, z: fitted.z },
          true
        );
        roomGroup.position.set(fitted.x, baseY, fitted.z);

        let existingCount = 1;
        let roomId = `${roomType}_${existingCount}`;
        while (this.interiorGroup.children.some(c => c.userData.roomId === roomId)) {
          existingCount++;
          roomId = `${roomType}_${existingCount}`;
        }
        roomGroup.userData.roomId = roomId;
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

    // A room surface always means move. Resizing lives in the placed-room list.
    if (!this.outsideShell() && this.currentConfig.interactionMode === 'default' && this.interiorGroup.children.length > 0) {
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
          this.onRoomSelect?.(roomId);
          const plan = this.roomPlan(roomGroup);

          const pt = this.roomPointAt(e.clientX, e.clientY, roomGroup.position.y);
          if (pt) {
            this.draggingRoom = {
              roomId,
              pointerId: e.pointerId,
              startW: plan.w,
              startD: plan.d,
              startX: roomGroup.position.x,
              startZ: roomGroup.position.z,
              currentX: roomGroup.position.x,
              currentZ: roomGroup.position.z,
              startY: roomGroup.position.y,
              startPt: pt
            };
            this.container.style.cursor = 'grabbing';
            this.controls.enabled = false;
            this.syncLoftPresentation();
            this.attachGlobalDragListeners();
            this.onDragStateChange?.(true);
            e.stopPropagation();
            return;
          }
        }
      }
    }

    if (this.currentConfig.framingWalkthrough) {
      return;
    }

    const intersects = this.outsideShell()
      ? this.raycaster.intersectObjects(this.interactivePanels, false)
      : [];

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      const slotId = hit.userData.slotId as string;
      if (slotId) {
        const slot = this.currentConfig.wallSlots[slotId];
        const hasItem = slot && slot.type !== 'empty';
        if (hasItem) {
          this.draggingSlot = {
            slotId,
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            hasMoved: false,
            hitMesh: hit
          };
          this.controls.enabled = false;
          this.attachGlobalDragListeners();
          e.stopPropagation();
          return;
        } else if (e.pointerType === 'touch') {
          this.panelTouchPress = {
            pointerId: e.pointerId,
            slotId,
            x: e.clientX,
            y: e.clientY
          };
        } else {
          this.selectPanel(slotId, hit, e.clientX, e.clientY);
        }
      }
    }
  };

  private setupRaycasting() {
    this.container.addEventListener('pointermove', (e) => {
      this.handlePointerMove(e);
    });

    this.container.addEventListener('pointerleave', () => {
      if (this.measuring) return;
      if (!this.draggingSlot?.hasMoved && !this.draggingRoom) {
        this.container.style.cursor = 'default';
        if (this.renderer?.domElement) {
          this.renderer.domElement.style.cursor = 'default';
        }
      }
      this.updateHoverBox(null);
      this.onPanelHover?.(null, 0, 0);
      this.updateFramingHoverBox(null);
      this.onFramingItemHover?.(null);
      this.updateRoomPreview(null);
    });

    this.container.addEventListener('pointerdown', this.handlePointerDown, { capture: true });
    this.container.addEventListener('pointerup', this.handlePointerUp);
  }

  /** Rhythm-covered bays select their host so the count control stays available. */
  private resolveSlotSelection(slotId: string): string {
    const slot = this.currentConfig.wallSlots[slotId];
    if (!slot?.coveredBy) return slotId;
    const host = this.currentConfig.wallSlots[slot.coveredBy];
    return host?.windowRhythm ? slot.coveredBy : slotId;
  }

  private selectPanel(slotId: string, hit: THREE.Mesh, screenX: number, screenY: number) {
    const id = this.resolveSlotSelection(slotId);
    this.currentConfig.selectedSlotId = id;
    this.updateHoverBox(null);
    this.updateHighlightBox(this.boundsOf(hit));
    this.onPanelClick?.(id, screenX, screenY);
  }

  public rebuildScene() {
    this.updateFramingHoverBox(null);
    this.onFramingItemHover?.(null);
    // Clear groups
    while (this.foundationGroup.children.length > 0) {
      this.foundationGroup.remove(this.foundationGroup.children[0]);
    }
    while (this.wallsGroup.children.length > 0) {
      this.wallsGroup.remove(this.wallsGroup.children[0]);
    }
    while (this.concreteGroup.children.length > 0) {
      this.concreteGroup.remove(this.concreteGroup.children[0]);
    }
    while (this.framingGroup.children.length > 0) {
      this.framingGroup.remove(this.framingGroup.children[0]);
    }
    while (this.innerWallsGroup.children.length > 0) {
      this.innerWallsGroup.remove(this.innerWallsGroup.children[0]);
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
    const shell = this.timberShell();
    const w = shell.widthM;
    const d = shell.depthM;
    this.houseGroup.position.set(shell.x, 0, shell.z);
    this.dimensionsGroup.position.set(shell.x, 0, shell.z);
    const h = this.wallTopM();
    const wallThick = 0.18; // standard 180mm modular wall (145mm stud + 22mm cladding + air gap)

    // Materials - Authentic Scandinavian timber with tactile bump map
    const wallTexture = this.createVerticalPlankTexture(this.currentConfig.material);
    const wallBumpMap = this.createVerticalPlankBumpMap();
    const floorTexture = this.createPineFloorTexture();

    const exteriorMat = new THREE.MeshStandardMaterial({
      map: wallTexture,
      bumpMap: wallBumpMap,
      bumpScale: 0.07,
      roughness: 0.72,
      metalness: 0.02,
      side: THREE.DoubleSide
    });
    const doorBayMat = exteriorMat.clone();
    if (this.currentConfig.verticalDoorBay && this.currentConfig.panelOrientation === 'liggande') {
      doorBayMat.map = this.createVerticalPlankTexture(this.currentConfig.material, true);
      doorBayMat.bumpMap = this.createVerticalPlankBumpMap(true);
    }

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
      color: this.houseCasingHex(),
      roughness: 0.58,
      metalness: 0.02
    });

    const foundationMat = new THREE.MeshStandardMaterial({
      color: '#94a3b8',
      roughness: 0.95
    });
    const concreteColor = this.currentConfig.concreteColor ?? '#b7b3ac';
    const concreteWallMat = new THREE.MeshStandardMaterial({
      color: concreteColor,
      roughness: 0.94,
      metalness: 0
    });
    const whiteConcreteMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.88,
      metalness: 0.02
    });

    // 1. Concrete slab foundation
    const slabGeo = new THREE.BoxGeometry(w + 0.35, 0.25, d + 0.35);
    const slab = new THREE.Mesh(slabGeo, foundationMat);
    slab.position.set(0, 0.125, 0);
    slab.receiveShadow = true;
    slab.castShadow = true;
    slab.userData.framingNameSv = 'Gjuten betongplatta';
    slab.userData.framingNameEn = 'Concrete Foundation Slab';
    slab.userData.dimension = 'Isolerad platta på mark';
    this.foundationGroup.add(slab);

    // 2. Interior Floor
    const floorGeo = new THREE.BoxGeometry(w - 0.28, 0.05, d - 0.28);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, 0.275, 0);
    floor.receiveShadow = true;
    this.foundationGroup.add(floor);

    // 3. Modular Exterior Walls Construction (outer wood siding, inside left open for beams)
    this.windowFitOfferIds = [];
    const frontCount = this.panelCountForWall('front', w, d);
    const backCount = this.panelCountForWall('back', w, d);
    const leftCount = this.panelCountForWall('left', w, d);
    const rightCount = this.panelCountForWall('right', w, d);
    this.buildModularWall('front', frontCount, w, d, h, wallThick, exteriorMat, doorBayMat, trimMat, casingMat, concreteWallMat);
    this.buildModularWall('back', backCount, w, d, h, wallThick, exteriorMat, doorBayMat, trimMat, casingMat, concreteWallMat);
    this.buildModularWall('left', leftCount, w, d, h, wallThick, exteriorMat, doorBayMat, trimMat, casingMat, concreteWallMat);
    this.buildModularWall('right', rightCount, w, d, h, wallThick, exteriorMat, doorBayMat, trimMat, casingMat, concreteWallMat);
    this.publishWindowFitOffers();
    this.addConcreteWalls(concreteWallMat, whiteConcreteMat);
    this.buildOutsideAdditions(w, d, h);
    if (!this.interiorCut() && this.currentConfig.panelOrientation !== 'liggande') {
      this.addBeltFlashing(w, d, h);
    }
    if (!this.interiorCut() && this.currentConfig.cornerBoards !== false) {
      const isPulpet = this.currentConfig.roofType === 'pulpettak';
      const isFlackt = this.currentConfig.roofType === 'flackt';
      const flacktDrop = isFlackt ? (d / 2) * Math.tan((2 * Math.PI) / 180) : 0;
      const widthFall = this.roofFallsAlongWidth();
      // Width-fall flush eaves: keep corner boards tight under the fascia (no mid-gap).
      const roofTrimDrop = widthFall ? 0.02 : (isPulpet ? 0.08 : (isFlackt ? 0.13 : 0.06));
      const pitch = this.pulpetPitchRad();
      const highTop = (isFlackt ? h + flacktDrop : h) - roofTrimDrop;
      const lowTop = (isPulpet
        ? Math.max(h - Math.tan(pitch) * (widthFall ? w : d), 2.4)
        : (isFlackt ? h - flacktDrop : h)) - roofTrimDrop;
      // Depth-fall: high south / low north. Width-fall (Stugan): high east / low west.
      const frontTop = highTop;
      const rearTop = widthFall ? highTop : lowTop;
      const westTop = widthFall ? lowTop : undefined;
      const eastTop = widthFall ? highTop : undefined;
      const cornerColor = this.currentConfig.cornerColor ?? 'same';
      const cornerMat = new THREE.MeshStandardMaterial({
        roughness: 0.64,
        metalness: 0.02,
        map: this.createCornerBoardTexture(this.currentConfig.material, cornerColor),
        bumpMap: this.createCornerBoardBumpMap(),
        bumpScale: 0.03
      });
      this.addCornerBoards(w, d, frontTop, rearTop, 0.25, cornerMat, westTop, eastTop);
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

    // 6b. Drywall Ceiling & Interior Gable Wall Drywall (Gipstak och invändig gips)
    this.ceilingDrywallGroup = this.buildDrywallCeiling(w, d, h);
    this.innerWallsGroup.add(this.ceilingDrywallGroup);

    // 7. Loft Construction
    if (this.currentConfig.hasLoft) {
      this.buildLoft(w, d, h, wallThick);
    }

    // 8. 3D Architectural Dimensions
    this.buildDimensionLines(w, d, h);
    this.buildContactShadow(w, d);
    this.refreshLoftRooms();

    // View mode visibility
    this.applyViewMode();
  }

  /**
   * Rebuild loft deck, stair, and rails from current loft rooms (e.g. after bedroom walls toggle).
   * Interior rooms are preserved.
   */
  public rebuildLoftStructure() {
    while (this.loftGroup.children.length > 0) {
      const child = this.loftGroup.children[0];
      this.loftGroup.remove(child);
      this.disposeObject(child);
    }
    if (!this.currentConfig.hasLoft) {
      this.syncLoftStuds();
      this.syncLoftPresentation(true);
      return;
    }
    const shell = this.timberShell();
    this.buildLoft(shell.widthM, shell.depthM, this.wallTopM(), 0.18);
    this.syncLoftPresentation(true);
  }

  /** Wall plate calculated so that the highest point on top of the roof equals heightMm. */
  private wallTopM() {
    return wallPlateHeightM(
      this.currentConfig.roofType,
      this.currentConfig.depthMm / 1000,
      this.currentConfig.heightMm / 1000,
      this.currentConfig.flushRoof
    );
  }

  private gablePitchRad() {
    return (gablePitchDegrees(this.currentConfig.roofType) * Math.PI) / 180;
  }

  /** The Outside tab. Facade panels are interactive; rooms stay visible for peek-in. */
  private outsideShell() {
    return this.currentConfig.viewMode === 'utsida' && !this.currentConfig.framingWalkthrough;
  }

  /** Empty decks stay outside the interior view. A sauna or shed stays, with its yard wall opened. */
  private syncOutsideAdditions() {
    const inside = this.currentConfig.viewMode === 'insida';
    this.wallsGroup.traverse((object) => {
      if (!object.userData.outsideAddition) return;
      object.visible = !inside || object.userData.keepInInterior === true;
    });
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

  private panelCountForWall(
    wallSide: 'front' | 'back' | 'left' | 'right',
    wM: number,
    dM: number
  ): number {
    return panelCountForWall(wallSide, Math.round(wM * 1000), Math.round(dM * 1000));
  }

  private buildModularWall(
    wallSide: 'front' | 'back' | 'left' | 'right',
    panelCount: number,
    w: number,
    d: number,
    h: number,
    wallThick: number,
    exteriorMat: THREE.Material,
    doorBayMat: THREE.Material,
    trimMat: THREE.Material,
    casingMat: THREE.Material,
    concreteWallMat: THREE.Material
  ) {
    const isPulpettak = this.currentConfig.roofType === 'pulpettak';
    const angleRad = this.pulpetPitchRad();
    const widthFall = this.roofFallsAlongWidth();
    const isFlackt = this.currentConfig.roofType === 'flackt';
    const flacktDrop = isFlackt ? (d / 2) * Math.tan((2 * Math.PI) / 180) : 0;
    // Default pulpet: high front, low back. Stugan V4: high right (east), low left (west).
    const highH = isFlackt ? h + flacktDrop : h;
    const lowH = isPulpettak
      ? Math.max(h - Math.tan(angleRad) * (widthFall ? w : d), 2.4)
      : (isFlackt ? h - flacktDrop : h);
    const frontH = widthFall ? (highH + lowH) / 2 : highH;
    const rearH = widthFall ? (highH + lowH) / 2 : lowH;
    const yMid = (highH + lowH) / 2;
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
      let panelWallH = frontH - baseElev;

      if (wallSide === 'front') {
        px = -w / 2 + panelWidth / 2 + i * panelWidth;
        pz = d / 2 - claddingThick / 2;
        rotY = 0;
        // In insida view, cut front wall to waist height (1.35m) matching Reference Image 4 & 5
        // so interior floor, loft, stairs, and framing are completely visible without obstruction
        if (this.interiorCut()) panelWallH = 1.35;
        // High east (+X): plate Y = yMid + px * tan.
        else if (widthFall) panelWallH = this.sidePanelHeight(w, h, lowH, yMid, angleRad, px, baseElev);
        else panelWallH = frontH - baseElev;
      } else if (wallSide === 'back') {
        px = w / 2 - panelWidth / 2 - i * panelWidth;
        pz = -d / 2 + claddingThick / 2;
        rotY = Math.PI;
        panelWallH = widthFall
          ? this.sidePanelHeight(w, h, lowH, yMid, angleRad, px, baseElev)
          : rearH - baseElev;
      } else if (wallSide === 'left') {
        px = -w / 2 + claddingThick / 2;
        pz = d / 2 - endInset - panelWidth / 2 - i * panelWidth;
        rotY = -Math.PI / 2;
        panelWallH = widthFall
          ? lowH - baseElev
          : this.sidePanelHeight(d, h, rearH, yMid, angleRad, pz, baseElev);
      } else {
        px = w / 2 - claddingThick / 2;
        pz = -d / 2 + endInset + panelWidth / 2 + i * panelWidth;
        rotY = Math.PI / 2;
        panelWallH = widthFall
          ? highH - baseElev
          : this.sidePanelHeight(d, h, rearH, yMid, angleRad, pz, baseElev);
      }

      if (!this.interiorCut()) panelWallH += 0.04;

      const belt = this.beltRise(h);
      const upperId = `${wallSide}-${i}u`;
      const upperSlot = this.currentConfig.wallSlots[upperId];
      // Two selectable levels (lower + upper) whenever an upper bay exists and the wall is tall enough.
      const split = Boolean(upperSlot) && panelWallH > belt + 0.4;
      const bands = split
        ? [
            { slotId, height: belt, base: baseElev, upper: false, reachesRoof: false },
            { slotId: upperId, height: panelWallH - belt, base: baseElev + belt, upper: true, reachesRoof: true }
          ]
        : [{ slotId, height: panelWallH, base: baseElev, upper: false, reachesRoof: true }];

      const slope = this.alongWallSlope(wallSide);
      for (const band of bands) {
        const bay = this.currentConfig.wallSlots[band.slotId];
        const uprightDoor = Boolean(
          this.currentConfig.verticalDoorBay
          && !band.upper
          && wallSide === 'front'
          && bay?.type === 'door'
          && bay.itemId !== 'SKJUTDORR'
          && bay.itemId !== 'SKJUTDORR3'
        );
        const faceMat = uprightDoor ? doorBayMat : exteriorMat;
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
          panelCount,
          slope,
          faceMat,
          casingMat,
          concreteWallMat
        );
      }
    }

    // Depth-fall pulpet/flackt: a metal band on the wall top. Width-fall (Stugan) already
    // has fascia/barge on the roof assembly — this band would sit at mid-height and look
    // like a white mid-rail on horizontal cladding, or float above the low eave.
    if (this.roofFallsAlongWidth()) {
      // no wall-top eaves trim
    } else if (!this.currentConfig.flushRoof && (wallSide === 'left' || wallSide === 'right')) {
      const roof = this.currentConfig.roofType;
      if (!this.interiorCut() && (roof === 'pulpettak' || roof === 'flackt')) {
        const pitch = this.alongWallSlope('left');
        const rise = Math.abs(pitch) * d;
        const slopeLen = Math.hypot(d + 0.08, rise);
        const slopeAngle = Math.atan2(rise, d);
        const eavesTrim = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, slopeLen), trimMat);
        const trimX = wallSide === 'left' ? -w / 2 - 0.004 : w / 2 + 0.004;
        eavesTrim.position.set(trimX, yMid - 0.02, 0);
        eavesTrim.rotation.x = -slopeAngle;
        eavesTrim.castShadow = true;
        this.wallsGroup.add(eavesTrim);
      }
    } else if (!this.currentConfig.flushRoof && wallSide === 'front') {
      if (!this.interiorCut()) {
        const frontTrimGeo = new THREE.BoxGeometry(w + 0.06, 0.14, 0.035);
        const frontTrim = new THREE.Mesh(frontTrimGeo, trimMat);
        frontTrim.position.set(0, frontH - 0.01, d / 2 + 0.012);
        frontTrim.castShadow = true;
        this.wallsGroup.add(frontTrim);
      }
    } else if (!this.currentConfig.flushRoof && wallSide === 'back') {
      const backTrimGeo = new THREE.BoxGeometry(w + 0.05, 0.12, 0.03);
      const backTrim = new THREE.Mesh(backTrimGeo, trimMat);
      backTrim.position.set(0, rearH - 0.02, -d / 2 - 0.01);
      backTrim.castShadow = true;
      this.wallsGroup.add(backTrim);
    }
  }

  /**
   * Lower cladding height, measured from the wall base.
   * On a facade about 5 m high the rail sits 2.7 m above the ground,
   * with the floor between the two storeys (the allowed band is 2.4–3.0 m).
   * Shorter houses keep the lower rail.
   * On the concrete house the rail is the top of the concrete walls, so the
   * timber storey starts where that wall ends.
   */
  private concreteFoundationOnly() {
    return Boolean(
      this.currentConfig.concreteBase
      && isConcreteFoundationOnly(this.currentConfig.concreteHeightMm ?? 2500)
    );
  }

  private concreteCrownM() {
    return concreteCrownHeightM(this.currentConfig.concreteHeightMm ?? 2500);
  }

  private beltRise(wallTop: number) {
    const wallBase = 0.25;
    if (this.currentConfig.concreteBase && !this.concreteFoundationOnly()) {
      return Math.max(0.4, this.concreteCrownM() - wallBase);
    }
    if (wallTop >= 4.5) return 2.7 - wallBase;
    return 2.15;
  }

  /**
   * Timber walls sit on the concrete outer faces. Extra floor area grows to
   * the right and the front, so the left and back facades stay in line.
   */
  private timberShell() {
    const widthM = this.currentConfig.widthMm / 1000;
    const depthM = this.currentConfig.depthMm / 1000;
    if (!this.currentConfig.concreteBase) return { widthM, depthM, x: 0, z: 0 };
    return timberShellOnConcrete(
      widthM,
      depthM,
      (this.currentConfig.concreteWidthMm ?? 5200) / 1000,
      (this.currentConfig.concreteDepthMm ?? 5200) / 1000
    );
  }

  /**
   * Local X interval of a panel that sits on the concrete outer wall.
   * The rest of a longer timber wall is the extension and stays full height.
   */
  private concreteSpanLocal(
    wallSide: 'front' | 'back' | 'left' | 'right',
    px: number,
    pz: number,
    panelWidth: number
  ) {
    const shell = this.timberShell();
    const half = panelWidth / 2;
    const cw = (this.currentConfig.concreteWidthMm ?? 5200) / 1000;
    const cd = (this.currentConfig.concreteDepthMm ?? 5200) / 1000;
    let from = -half;
    let to = half;
    if (wallSide === 'front' || wallSide === 'back') {
      const sign = wallSide === 'front' ? 1 : -1;
      const center = shell.x + px;
      const a = sign * (-cw / 2 - center);
      const b = sign * (cw / 2 - center);
      from = Math.max(-half, Math.min(a, b));
      to = Math.min(half, Math.max(a, b));
    } else {
      const sign = wallSide === 'left' ? 1 : -1;
      const center = shell.z + pz;
      const a = sign * (-cd / 2 - center);
      const b = sign * (cd / 2 - center);
      from = Math.max(-half, Math.min(a, b));
      to = Math.min(half, Math.max(a, b));
    }
    if (to - from < 0.02) return null;
    return { from, to };
  }

  /** This timber face is the concrete outer facade, so the wood above continues it. */
  private concreteFacade(wallSide: 'front' | 'back' | 'left' | 'right') {
    if (!this.currentConfig.concreteBase || this.concreteFoundationOnly()) return false;
    // Front wall of concrete house is removed to open up the whole house
    if (wallSide === 'front') return false;
    const shell = this.timberShell();
    const cw = (this.currentConfig.concreteWidthMm ?? 5200) / 1000;
    if (wallSide === 'left' || wallSide === 'back') return true;
    if (wallSide === 'right') return shell.widthM - cw < 0.02;
    return true;
  }

  /**
   * The old concrete house: three walls (left, right, back) and an open front.
   * Outer walls use concreteWidthMm, concreteDepthMm, concreteHeightMm.
   * Openings for doors and windows in the concrete walls are cut out cleanly.
   */
  private addConcreteWalls(material: THREE.Material, whiteInsideMat: THREE.Material) {
    if (!this.currentConfig.concreteBase) return;
    const cw = (this.currentConfig.concreteWidthMm ?? 5200) / 1000;
    const cd = (this.currentConfig.concreteDepthMm ?? 5200) / 1000;
    const base = 0.25;
    const foundationOnly = this.concreteFoundationOnly();
    const top = this.concreteCrownM();
    const height = Math.max(0.01, top - base);
    const thick = CONCRETE_WALL_THICK_M;
    const y = base + height / 2;

    const shell = this.timberShell();
    const w = shell.widthM;
    const d = shell.depthM;
    const h = this.wallTopM();
    const baseElevation = 0.25;

    const allBackOpenings = this.wallOpenings('back', w, d, h, baseElevation);
    const allLeftOpenings = this.wallOpenings('left', w, d, h, baseElevation);
    const allRightOpenings = this.wallOpenings('right', w, d, h, baseElevation);

    const isLower = (o: { sill: number; head: number }) => o.sill < top - 0.05;

    // 1. Back wall (width cw, along X at z = -(cd / 2 - thick / 2))
    const backOps = allBackOpenings
      .filter(isLower)
      .map((o) => ({ center: shell.x + o.x, winW: o.winW, winH: o.winH, sill: o.sill, head: o.head }));
    this.addConcreteBackWall(cw, height, thick, y, -(cd / 2 - thick / 2), base, top, material, whiteInsideMat, backOps);

    // 2. Left wall (length cd, along Z at x = -(cw / 2 - thick / 2))
    const leftOps = allLeftOpenings
      .filter(isLower)
      .map((o) => ({ center: shell.z + o.x, winW: o.winW, winH: o.winH, sill: o.sill, head: o.head }));
    this.addConcreteSideWall(-(cw / 2 - thick / 2), cd, height, thick, y, base, top, material, whiteInsideMat, leftOps);

    // 3. Right wall (length cd, along Z at x = cw / 2 - thick / 2)
    const rightOps = allRightOpenings
      .filter(isLower)
      .map((o) => ({ center: shell.z + o.x, winW: o.winW, winH: o.winH, sill: o.sill, head: o.head }));
    this.addConcreteSideWall(cw / 2 - thick / 2, cd, height, thick, y, base, top, material, whiteInsideMat, rightOps);

    // Foundation-only mode keeps the perimeter curb but removes every partition wall.
    if (foundationOnly) return;

    // 4. Interior concrete walls (white inside)
    const add = (size: [number, number, number], pos: [number, number, number]) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), whiteInsideMat);
      mesh.position.set(...pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.concrete = true;
      mesh.userData.outsideAddition = true;
      mesh.userData.framingNameSv = 'Befintlig betongmellanvägg';
      mesh.userData.framingNameEn = 'Existing Concrete Partition Wall';
      mesh.userData.dimension = `${this.currentConfig.concreteHeightMm ?? 2500} mm · Massiv betong`;
      this.concreteGroup.add(mesh);
    };
    for (const wall of this.currentConfig.concreteWalls ?? []) {
      const offset = wall.offsetMm / 1000;
      if (wall.axis === 'z') add([thick, height, Math.max(0.4, cd - thick)], [offset, y, thick / 2]);
      else add([Math.max(0.4, cw - thick * 2), height, thick], [0, y, offset]);
    }
  }

  private addConcreteBackWall(
    cw: number,
    height: number,
    thick: number,
    y: number,
    zPos: number,
    base: number,
    top: number,
    material: THREE.Material,
    whiteInsideMat: THREE.Material,
    openings: { center: number; winW: number; winH: number; sill: number; head: number }[]
  ) {
    const halfW = cw / 2;
    const minLeft = -halfW + thick;
    const maxRight = halfW - thick;
    // BoxGeometry material array: [right(+X), left(-X), top(+Y), bottom(-Y), front(+Z, inside), back(-Z, outside)]
    const backMaterials = [material, material, material, material, whiteInsideMat, material];
    const add = (w: number, h: number, x: number, py: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, thick), backMaterials);
      mesh.position.set(x, py, zPos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.concrete = true;
      mesh.userData.outsideAddition = true;
      mesh.userData.framingNameSv = 'Befintlig bakre betongvägg';
      mesh.userData.framingNameEn = 'Existing Concrete Rear Wall';
      mesh.userData.dimension = '500 mm massiv gjuten betong';
      this.concreteGroup.add(mesh);
    };

    const valid = openings
      .filter((o) => Math.min(maxRight, o.center + o.winW / 2) - Math.max(minLeft, o.center - o.winW / 2) > 0.05)
      .sort((a, b) => a.center - b.center);

    if (valid.length === 0) {
      add(cw, height, 0, y);
      return;
    }

    let cursor = -halfW;
    for (const op of valid) {
      const left = Math.max(minLeft, op.center - op.winW / 2);
      const right = Math.min(maxRight, op.center + op.winW / 2);
      const sillTop = Math.max(base, Math.min(top, op.sill));
      const lintelBottom = Math.max(base, Math.min(top, op.head));

      const leftW = left - cursor;
      if (leftW > 0.01) {
        add(leftW, height, cursor + leftW / 2, y);
      }

      const sillH = sillTop - base;
      const spanW = right - left;
      if (sillH > 0.01 && spanW > 0.01) {
        add(spanW, sillH, (left + right) / 2, base + sillH / 2);
      }

      const lintelH = top - lintelBottom;
      if (lintelH > 0.01 && spanW > 0.01) {
        add(spanW, lintelH, (left + right) / 2, lintelBottom + lintelH / 2);
      }

      cursor = right;
    }

    const endW = halfW - cursor;
    if (endW > 0.01) {
      add(endW, height, cursor + endW / 2, y);
    }
  }

  private addConcreteSideWall(
    xPos: number,
    cd: number,
    height: number,
    thick: number,
    y: number,
    base: number,
    top: number,
    material: THREE.Material,
    whiteInsideMat: THREE.Material,
    openings: { center: number; winW: number; winH: number; sill: number; head: number }[]
  ) {
    const halfD = cd / 2;
    const zStart = -halfD + thick;
    const zEnd = halfD;
    const isLeft = xPos < 0;
    // For left wall (xPos < 0): +X (inside) is whiteInsideMat, -X (outside) is material
    // For right wall (xPos > 0): -X (inside) is whiteInsideMat, +X (outside) is material
    const sideMaterials = isLeft
      ? [whiteInsideMat, material, material, material, material, material]
      : [material, whiteInsideMat, material, material, material, material];
    const add = (d: number, h: number, py: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(thick, h, d), sideMaterials);
      mesh.position.set(xPos, py, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.concrete = true;
      mesh.userData.outsideAddition = true;
      mesh.userData.framingNameSv = isLeft ? 'Befintlig vänster betongvägg' : 'Befintlig höger betongvägg';
      mesh.userData.framingNameEn = isLeft ? 'Existing Concrete Left Wall' : 'Existing Concrete Right Wall';
      mesh.userData.dimension = '500 mm massiv gjuten betong';
      this.concreteGroup.add(mesh);
    };

    const valid = openings
      .filter((o) => Math.min(zEnd, o.center + o.winW / 2) - Math.max(zStart, o.center - o.winW / 2) > 0.05)
      .sort((a, b) => a.center - b.center);

    if (valid.length === 0) {
      add(zEnd - zStart, height, y, (zStart + zEnd) / 2);
      return;
    }

    let cursor = zStart;
    for (const op of valid) {
      const left = Math.max(zStart, op.center - op.winW / 2);
      const right = Math.min(zEnd, op.center + op.winW / 2);
      const sillTop = Math.max(base, Math.min(top, op.sill));
      const lintelBottom = Math.max(base, Math.min(top, op.head));

      const leftW = left - cursor;
      if (leftW > 0.01) {
        add(leftW, height, y, cursor + leftW / 2);
      }

      const sillH = sillTop - base;
      const spanW = right - left;
      if (sillH > 0.01 && spanW > 0.01) {
        add(spanW, sillH, base + sillH / 2, (left + right) / 2);
      }

      const lintelH = top - lintelBottom;
      if (lintelH > 0.01 && spanW > 0.01) {
        add(spanW, lintelH, lintelBottom + lintelH / 2, (left + right) / 2);
      }

      cursor = right;
    }

    const endW = zEnd - cursor;
    if (endW > 0.01) {
      add(endW, height, y, cursor + endW / 2);
    }
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
   * Omitted when panel orientation is liggande (horizontal).
   */
  private addBeltFlashing(w: number, d: number, wallTop: number) {
    if (this.currentConfig.panelOrientation === 'liggande') return;
    const faceH = 0.11;
    const rise = this.beltRise(wallTop);
    // The plate hangs from the concrete crown and laps the wall end.
    // Other houses keep the rail centred on the storey line.
    const y = this.currentConfig.concreteBase && !this.concreteFoundationOnly()
      ? 0.25 + rise - faceH / 2
      : 0.25 + rise;
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

    const place = (
      length: number,
      axis: 'x' | 'z',
      sign: number,
      claddingOuter: number,
      gaps: { center: number; half: number }[]
    ) => {
      const center = claddingOuter + sign * (standOff + proj / 2);
      const lip = center + sign * (proj / 2 + 0.006);
      const shade = claddingOuter + sign * 0.004;
      const start = -length / 2;
      const end = length / 2;
      const cuts = gaps
        .map((gap) => [Math.max(start, gap.center - gap.half), Math.min(end, gap.center + gap.half)] as [number, number])
        .filter(([from, to]) => to > from + 0.02)
        .sort((a, b) => a[0] - b[0]);
      const runs: [number, number][] = [];
      let cursor = start;
      for (const [from, to] of cuts) {
        if (from > cursor + 0.05) runs.push([cursor, from]);
        cursor = Math.max(cursor, to);
      }
      if (end > cursor + 0.05) runs.push([cursor, end]);

      for (const [from, to] of runs) {
        const seg = to - from;
        const mid = (from + to) / 2;
        if (axis === 'z') {
          add([seg, faceH, proj], [mid, y, center], faceMat);
          add([seg, 0.01, proj + 0.012], [mid, y + faceH / 2 - 0.004, center + sign * 0.006], lipMat);
          add([seg, 0.016, 0.018], [mid, y - faceH / 2 + 0.006, lip], lipMat);
          add([seg, 0.03, 0.004], [mid, y - faceH / 2 - 0.012, shade], shadeMat);
        } else {
          add([proj, faceH, seg], [center, y, mid], faceMat);
          add([proj + 0.012, 0.01, seg], [center + sign * 0.006, y + faceH / 2 - 0.004, 0], lipMat);
          add([0.018, 0.016, seg], [lip, y - faceH / 2 + 0.006, mid], lipMat);
          add([0.004, 0.03, seg], [shade, y - faceH / 2 - 0.012, mid], shadeMat);
        }
      }
    };

    place(w - inset * 2, 'z', 1, d / 2, []);
    place(w - inset * 2, 'z', -1, -d / 2, []);
    place(d - face * 2, 'x', -1, -w / 2, []);
    place(d - face * 2, 'x', 1, w / 2, []);
  }

  /** Timber left beside a concrete facade. Upper bays and full-timber panels have none. */
  private woodSpanBeside(
    panelWidth: number,
    facadeSpan: { from: number; to: number } | null,
    upper: boolean
  ) {
    if (!facadeSpan || upper) return null;
    const half = panelWidth / 2;
    if (facadeSpan.from > -half + 0.08) return { from: -half, to: facadeSpan.from };
    if (facadeSpan.to < half - 0.08) return { from: facadeSpan.to, to: half };
    return null;
  }

  /**
   * A window marked to fit the wall is moved and resized into the bay.
   * One that still sticks out is offered a fit button instead of being changed in place.
   */
  private resolveWindowOpening<T extends { winW: number; winH: number; winY: number; x?: number; sill?: number; head?: number; casingSide?: number }>(
    opening: T,
    slot: WallSlot | undefined,
    panelWidth: number,
    panelHeight: number,
    cornerSide: 'left' | 'right' | null | undefined,
    facadeSpan: { from: number; to: number } | null,
    upper: boolean,
    slope: number,
    recordOffer: boolean
  ): T {
    if (slot?.type !== 'window') return opening;
    const seated = containWindowInPanel(
      opening,
      panelWidth,
      panelHeight,
      cornerSide ?? null,
      this.woodSpanBeside(panelWidth, facadeSpan, upper),
      slope
    );
    if (recordOffer && !slot.fitToWall && windowOpeningChanged(opening, seated)) {
      this.windowFitOfferIds.push(slot.id);
    }
    return slot.fitToWall ? seated : opening;
  }

  publishWindowFitOffers() {
    this.onWindowFitOffers?.(this.windowFitOfferIds);
  }

  private pulpetPitchRad() {
    const deg = this.currentConfig.pulpetPitchDeg;
    if (typeof deg === 'number' && Number.isFinite(deg)) {
      return (deg * Math.PI) / 180;
    }
    return this.currentConfig.roofFallAxis === 'width' ? STUGAN_PULPET_PITCH_RAD : PULPET_PITCH_RAD;
  }

  private roofFallsAlongWidth() {
    return this.currentConfig.roofFallAxis === 'width' && this.currentConfig.roofType === 'pulpettak';
  }

  private roofEdgeOverhangs(w: number, d: number) {
    const custom = this.currentConfig.roofOverhangs;
    if (custom) return custom;
    const o = this.currentConfig.flushRoof ? 0.02 : 0.4;
    return { front: o, back: o, left: o, right: o };
  }

  /** Rise of the roof along a side wall, in metres of height per metre of local panel X. */
  private alongWallSlope(wallSide: 'front' | 'back' | 'left' | 'right') {
    if (this.interiorCut()) return 0;
    const roof = this.currentConfig.roofType;
    if (roof !== 'pulpettak' && roof !== 'flackt') return 0;
    const degrees =
      roof === 'pulpettak'
        ? (this.currentConfig.pulpetPitchDeg ?? (this.roofFallsAlongWidth() ? STUGAN_V4_ROOF_PITCH_DEG : PULPET_PITCH_DEG))
        : 2;
    const tan = Math.tan((degrees * Math.PI) / 180);
    if (this.roofFallsAlongWidth()) {
      // High at east (+X / right when facing south). Front/back panels drop toward −X (left).
      if (wallSide === 'front') return tan;
      if (wallSide === 'back') return -tan;
      return 0;
    }
    if (wallSide !== 'left' && wallSide !== 'right') return 0;
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
    panelCount: number,
    slope: number,
    exteriorMat: THREE.Material,
    casingMat: THREE.Material,
    concreteWallMat?: THREE.Material
  ) {
    const slot = this.currentConfig.wallSlots[band.slotId];
    const slotType = slot?.type ?? 'empty';
    const panelGroup = new THREE.Group();
    panelGroup.position.set(px, band.base + band.height / 2, pz);
    panelGroup.rotation.y = rotY;
    panelGroup.userData = { slotId: band.slotId, wall: wallSide, index };

    const rhythm = band.upper
      ? null
      : this.windowRhythmOpeningForPanel(wallSide, index, panelWidth, band.height, band.base, panelCount);
    const wide = band.upper || rhythm
      ? null
      : this.wideOpeningForPanel(wallSide, index, panelWidth, band.height, band.base);
    const lowerBay = this.currentConfig.wallSlots[`${wallSide}-${index}`];
    const aboveDoor = Boolean(
      band.upper
      && (slot?.itemId === 'standard-single' || slot?.itemId === OVERLIGHT)
      && lowerBay?.type === 'door'
      && lowerBay.itemId !== 'SKJUTDORR'
      && lowerBay.itemId !== 'SKJUTDORR3'
    );
    const cornerSide = this.cornerSideForPanel(
      wallSide,
      index,
      panelCount
    );
    const facadeTop = this.concreteFacade(wallSide)
      ? (this.currentConfig.concreteHeightMm ?? 2500) / 1000
      : null;
    const facadeSpan = facadeTop == null ? null : this.concreteSpanLocal(wallSide, px, pz, panelWidth);
    const isConcreteLower = Boolean(facadeTop && facadeSpan && !band.upper);

    const fitted: { winW: number; winH: number; winY: number; x?: number; sill?: number; head?: number; casingSide?: number } | null = rhythm
      ? rhythm.opening
      : wide
        ?? ((slotType === 'window' || slotType === 'door')
          ? this.fittedOpening(slotType, slot?.itemId, band.upper, panelWidth, band.height, band.base, aboveDoor, cornerSide, facadeSpan)
          : null);
    const preferred = fitted && band.reachesRoof
      ? openingClearOfRoof(fitted, band.height, slope, {
          pinSill: Boolean(wide) || slotType === 'door',
          minHeight: wide || slotType === 'door' ? 0.9 : 0.28
        })
      : fitted;
    const opening = preferred && !rhythm
      ? this.resolveWindowOpening(preferred, slot, panelWidth, band.height, cornerSide, facadeSpan, band.upper, slope, true)
      : preferred;
    const selectId = rhythm?.hostId ?? band.slotId;
    const userData = {
      slotId: selectId,
      wall: wallSide,
      index,
      panelGroup
    };

    const sloped = band.reachesRoof && Math.abs(slope) > 0.0001;

    if (sloped) {
      this.addSlopedCladding(panelGroup, panelWidth, band.height, slope, claddingThick, exteriorMat, userData, opening, facadeTop);
    } else if (opening) {
      this.addCladdingAroundOpening(panelGroup, panelWidth, band.height, claddingThick, exteriorMat, opening, userData, facadeTop, facadeSpan);
    } else {
      this.addSolidCladding(panelGroup, panelWidth, band.height, claddingThick, exteriorMat, userData, facadeTop, facadeSpan);
    }

    const ownsOpening = Boolean(rhythm)
      || (wide ? wide.drawDoor : (slotType === 'door' || slotType === 'window'));
    if (ownsOpening && opening && (rhythm || wide || slotType === 'door' || slotType === 'window')) {
      // Sliding doors span two bays — clamp casing to the full opening, not the host panel alone.
      const casingSpan = wide?.drawDoor
        ? Math.max(panelWidth, Math.abs(opening.x ?? 0) * 2 + opening.winW + 0.28)
        : panelWidth;
      this.addOpeningCasing(
        panelGroup,
        opening,
        wide || slotType === 'door' ? 'door' : 'window',
        casingMat,
        wide?.drawDoor ? null : cornerSide,
        casingSpan,
        wide?.drawDoor ? null : facadeSpan
      );
    }
    if (ownsOpening && opening && (wide || slotType === 'door') && !rhythm) {
      this.addDoorFeature(panelGroup, opening, slot?.itemId, userData);
    } else if ((rhythm || slotType === 'window') && opening) {
      this.addWindowFeature(panelGroup, opening, rhythm?.itemId ?? slot?.itemId, userData);
    } else if (slotType === 'gate') {
      this.addGateFeature(panelGroup, panelWidth, band.height, wallThick, slot?.itemId, userData);
    }

    if (!isConcreteLower) {
      this.buildDrywallBand(
        band,
        px,
        pz,
        rotY,
        panelWidth,
        slope,
        opening,
        ownsOpening && (Boolean(wide) || slotType === 'door') && !rhythm,
        slotType === 'gate'
      );
    }

    this.wallsGroup.add(panelGroup);
    if (band.slotId === this.currentConfig.selectedSlotId) {
      this.updateHighlightBox(panelGroup);
    }
  }

  private addOpeningFrame(
    alongPos: number,
    fixed: number,
    opening: { winW: number; sill: number; head: number },
    studThick: number,
    studDepth: number,
    mat: THREE.Material,
    along: 'x' | 'z' = 'x'
  ) {
    const place = (
      sizeAlong: number,
      height: number,
      at: number,
      y: number,
      nameSv: string,
      nameEn: string,
      dimension: string
    ) => {
      const mesh = new THREE.Mesh(
        along === 'x'
          ? new THREE.BoxGeometry(sizeAlong, height, studDepth)
          : new THREE.BoxGeometry(studDepth, height, sizeAlong),
        mat
      );
      mesh.position.set(along === 'x' ? at : fixed, y, along === 'z' ? at : fixed);
      mesh.castShadow = true;
      mesh.userData.framingStep = 4;
      mesh.userData.framingNameSv = nameSv;
      mesh.userData.framingNameEn = nameEn;
      mesh.userData.dimension = dimension;
      this.framingGroup.add(mesh);
    };
    const bottom = opening.sill < 0.4 ? opening.sill + studThick : opening.sill;
    const trimmerH = opening.head - bottom;
    if (trimmerH > 0.05) {
      for (const side of [-1, 1]) {
        place(
          studThick,
          trimmerH,
          alongPos + side * (opening.winW / 2 + studThick / 2),
          bottom + trimmerH / 2,
          'Avväxlingsstolpe vid öppning',
          'Opening Jack Stud / Trimmer',
          '45×145 mm C24'
        );
      }
    }
    if (opening.sill > 0.4) {
      place(
        opening.winW + studThick * 2,
        studThick,
        alongPos,
        opening.sill - studThick / 2,
        'Bröstningsregel (fönster)',
        'Window Sill Plate / Cripple',
        '45×145 mm C24'
      );
    }
    place(
      opening.winW + studThick * 2,
      studThick * 2,
      alongPos,
      opening.head + studThick,
      'Överstycke / bärbalk (öppning)',
      'Opening Header / Lintel',
      '45×145 mm C24 dubbelregel'
    );
  }

  // --- Proper Architectural Timber Framing (Regelstomme 45x145 mm) ---
  private buildTimberFraming(w: number, d: number, h: number, wallThick: number, framingMat: THREE.Material) {
    const studThick = 0.045; // 45 mm
    const studDepth = 0.145; // 145 mm
    const baseElevation = 0.25; // on top of slab foundation
    const isPulpettak = this.currentConfig.roofType === 'pulpettak';
    const isFlackt = this.currentConfig.roofType === 'flackt';
    const flacktDrop = isFlackt ? (d / 2) * Math.tan((2 * Math.PI) / 180) : 0;
    const frontH = isFlackt ? h + flacktDrop : h;
    const rearH = isPulpettak
      ? Math.max(h - Math.tan(PULPET_PITCH_RAD) * d, 2.4)
      : (isFlackt ? h - flacktDrop : h);

    const isConcrete = Boolean(this.currentConfig.concreteBase && !this.concreteFoundationOnly());
    const concreteH = isConcrete ? this.concreteCrownM() : baseElevation;

    const framingFrontZ = d / 2 - 0.025 - studDepth / 2;
    const framingBackZ = -d / 2 + 0.025 + studDepth / 2;
    const framingLeftX = -w / 2 + 0.025 + studDepth / 2;
    const framingRightX = w / 2 - 0.025 - studDepth / 2;

    // 1. Bottom Sill Plates (Syll 45x145 mm)
    // For concrete house additions, sills follow existing concrete walls (2.5m) and ground slab extension
    const shell = this.timberShell();
    const cd = (this.currentConfig.concreteDepthMm ?? 5200) / 1000;
    const cw = (this.currentConfig.concreteWidthMm ?? 5200) / 1000;
    const concreteFrontZ = cd - d / 2; // front edge of concrete walls in houseGroup local coords
    const hasExtension = isConcrete && (d - cd > 0.05);

    if (isConcrete) {
      // --- CONCRETE WALL CROWN SILLS (Elevation: 2.5m atop solid 50cm concrete walls) ---
      // Back sill resting on back concrete wall
      const backSyll = new THREE.Mesh(new THREE.BoxGeometry(w - 0.05, studThick, studDepth), framingMat);
      backSyll.position.set(0, concreteH + studThick / 2, framingBackZ);
      backSyll.castShadow = true;
      backSyll.userData.framingStep = 1;
      backSyll.userData.framingNameSv = 'Syll på murkrön (bakvägg)';
      backSyll.userData.framingNameEn = 'Crown Sill Plate (Rear)';
      backSyll.userData.dimension = '45×145 mm C24 · EPDM-tätning';
      this.framingGroup.add(backSyll);

      // Left sill strictly on concrete left wall (from back wall to concreteFrontZ)
      const concreteWallSpanZ = Math.max(0.1, concreteFrontZ - (framingBackZ + studDepth / 2));
      const concreteSideSillZ = (framingBackZ + studDepth / 2) + concreteWallSpanZ / 2;
      const leftSyll = new THREE.Mesh(new THREE.BoxGeometry(studDepth, studThick, concreteWallSpanZ), framingMat);
      leftSyll.position.set(framingLeftX, concreteH + studThick / 2, concreteSideSillZ);
      leftSyll.castShadow = true;
      leftSyll.userData.framingStep = 1;
      leftSyll.userData.framingNameSv = 'Syll på murkrön (vänstervägg)';
      leftSyll.userData.framingNameEn = 'Crown Sill Plate (Left)';
      leftSyll.userData.dimension = '45×145 mm C24 · EPDM-tätning';
      this.framingGroup.add(leftSyll);

      // Right sill on concrete right wall
      if (this.concreteFacade('right')) {
        const rightSyll = new THREE.Mesh(new THREE.BoxGeometry(studDepth, studThick, concreteWallSpanZ), framingMat);
        rightSyll.position.set(framingRightX, concreteH + studThick / 2, concreteSideSillZ);
        rightSyll.castShadow = true;
        rightSyll.userData.framingStep = 1;
        rightSyll.userData.framingNameSv = 'Syll på murkrön (högervägg)';
        rightSyll.userData.framingNameEn = 'Crown Sill Plate (Right)';
        rightSyll.userData.dimension = '45×145 mm C24 · EPDM-tätning';
        this.framingGroup.add(rightSyll);
      }

      // --- VERTICAL SILL PLATES ON CONCRETE WALL ENDS (Elevation: concreteH down to baseElevation) ---
      // Follows vertically on the concrete walls ends down to the foundation slab (NO horizontal sill across the open air!)
      const wallEndH = (concreteH + studThick) - baseElevation;
      const wallEndY = baseElevation + wallEndH / 2;
      const wallEndZ = concreteFrontZ + studThick / 2;

      const leftWallEndSyll = new THREE.Mesh(new THREE.BoxGeometry(studDepth, wallEndH, studThick), framingMat);
      leftWallEndSyll.position.set(framingLeftX, wallEndY, wallEndZ);
      leftWallEndSyll.castShadow = true;
      leftWallEndSyll.userData.framingStep = 1;
      leftWallEndSyll.userData.framingNameSv = 'Vertikal syll på murände (vänster)';
      leftWallEndSyll.userData.framingNameEn = 'Vertical Wall-End Sill Plate (Left)';
      leftWallEndSyll.userData.dimension = '45×145 mm C24 · Svällbandstätning';
      this.framingGroup.add(leftWallEndSyll);

      if (this.concreteFacade('right')) {
        const rightWallEndSyll = new THREE.Mesh(new THREE.BoxGeometry(studDepth, wallEndH, studThick), framingMat);
        rightWallEndSyll.position.set(framingRightX, wallEndY, wallEndZ);
        rightWallEndSyll.castShadow = true;
        rightWallEndSyll.userData.framingStep = 1;
        rightWallEndSyll.userData.framingNameSv = 'Vertikal syll på murände (höger)';
        rightWallEndSyll.userData.framingNameEn = 'Vertical Wall-End Sill Plate (Right)';
        rightWallEndSyll.userData.dimension = '45×145 mm C24 · Svällbandstätning';
        this.framingGroup.add(rightWallEndSyll);
      }

      // --- GROUND SLAB SILLS FOR EXTENSION (at baseElevation on ground) ---
      if (hasExtension) {
        // Front sill on ground slab
        const frontSyll = new THREE.Mesh(new THREE.BoxGeometry(w - 0.05, studThick, studDepth), framingMat);
        frontSyll.position.set(0, baseElevation + studThick / 2, framingFrontZ);
        frontSyll.castShadow = true;
        frontSyll.userData.framingStep = 1;
        frontSyll.userData.framingNameSv = 'Syll på tillbyggnadsplatta (framvägg)';
        frontSyll.userData.framingNameEn = 'Extension Slab Sill Plate (Front)';
        frontSyll.userData.dimension = '45×145 mm C24 · Syllisolering';
        this.framingGroup.add(frontSyll);

        // Left extension sill on ground slab (from concreteFrontZ + studThick to front sill)
        const extSpanZ = Math.max(0.05, (framingFrontZ - studDepth / 2) - (concreteFrontZ + studThick));
        const extSideSillZ = (concreteFrontZ + studThick) + extSpanZ / 2;

        const leftExtSyll = new THREE.Mesh(new THREE.BoxGeometry(studDepth, studThick, extSpanZ), framingMat);
        leftExtSyll.position.set(framingLeftX, baseElevation + studThick / 2, extSideSillZ);
        leftExtSyll.castShadow = true;
        leftExtSyll.userData.framingStep = 1;
        leftExtSyll.userData.framingNameSv = 'Syll på tillbyggnadsplatta (vänster)';
        leftExtSyll.userData.framingNameEn = 'Extension Slab Sill Plate (Left)';
        leftExtSyll.userData.dimension = '45×145 mm C24 · Syllisolering';
        this.framingGroup.add(leftExtSyll);

        const rightExtSyll = new THREE.Mesh(new THREE.BoxGeometry(studDepth, studThick, extSpanZ), framingMat);
        rightExtSyll.position.set(framingRightX, baseElevation + studThick / 2, extSideSillZ);
        rightExtSyll.castShadow = true;
        rightExtSyll.userData.framingStep = 1;
        rightExtSyll.userData.framingNameSv = 'Syll på tillbyggnadsplatta (höger)';
        rightExtSyll.userData.framingNameEn = 'Extension Slab Sill Plate (Right)';
        rightExtSyll.userData.dimension = '45×145 mm C24 · Syllisolering';
        this.framingGroup.add(rightExtSyll);
      } else {
        const frontSyll = new THREE.Mesh(new THREE.BoxGeometry(w - 0.05, studThick, studDepth), framingMat);
        frontSyll.position.set(0, baseElevation + studThick / 2, concreteFrontZ + studThick + studDepth / 2);
        frontSyll.castShadow = true;
        frontSyll.userData.framingStep = 1;
        frontSyll.userData.framingNameSv = 'Syll på betongplatta';
        frontSyll.userData.framingNameEn = 'Concrete Slab Sill Plate';
        frontSyll.userData.dimension = '45×145 mm C24 · Syllisolering';
        this.framingGroup.add(frontSyll);
      }

      // --- CROWN FASTENERS (Kemankare M12 gängstång cc 800 mm) ---
      // Steel square washers (45x45 mm) and M12 hex nuts spaced cc 800 mm along sills
      const fastenerMat = new THREE.MeshStandardMaterial({
        color: '#cbd5e1',
        roughness: 0.25,
        metalness: 0.88
      });
      const washerGeo = new THREE.BoxGeometry(0.045, 0.005, 0.045);
      const nutGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.012, 6);

      const addCrownFastener = (x: number, y: number, z: number) => {
        const washer = new THREE.Mesh(washerGeo, fastenerMat);
        washer.position.set(x, y + 0.0025, z);
        washer.castShadow = true;
        washer.userData.framingStep = 1;
        washer.userData.ownMaterial = fastenerMat;
        washer.userData.isFastener = true;
        washer.userData.framingNameSv = 'Fyrkantsbricka för kemankare';
        washer.userData.framingNameEn = 'Square Washer for Chemical Anchor';
        washer.userData.dimension = '45×45×4 mm DIN 440 FZV';
        this.framingGroup.add(washer);

        const nut = new THREE.Mesh(nutGeo, fastenerMat);
        nut.position.set(x, y + 0.005 + 0.006, z);
        nut.castShadow = true;
        nut.userData.framingStep = 1;
        nut.userData.ownMaterial = fastenerMat;
        nut.userData.isFastener = true;
        nut.userData.framingNameSv = 'Kemankare M12 & sexkantsmutter';
        nut.userData.framingNameEn = 'M12 Chemical Anchor & Hex Nut';
        nut.userData.dimension = 'M12 syrafast/FZV cc 800 mm';
        this.framingGroup.add(nut);
      };

      // Fasteners along back crown sill (cc 800 mm)
      const backFastenerSpan = (framingRightX - 0.15) - (framingLeftX + 0.15);
      const backFastenerCount = Math.max(2, Math.round(backFastenerSpan / 0.8));
      const backFastenerSpacing = backFastenerSpan / backFastenerCount;
      for (let i = 0; i <= backFastenerCount; i++) {
        const bx = (framingLeftX + 0.15) + i * backFastenerSpacing;
        addCrownFastener(bx, concreteH + studThick, framingBackZ);
      }

      // Fasteners along left crown sill (cc 800 mm)
      const leftFastenerSpan = (concreteFrontZ - 0.15) - (framingBackZ + 0.15);
      const leftFastenerCount = Math.max(2, Math.round(leftFastenerSpan / 0.8));
      const leftFastenerSpacing = leftFastenerSpan / leftFastenerCount;
      for (let i = 0; i <= leftFastenerCount; i++) {
        const bz = (framingBackZ + 0.15) + i * leftFastenerSpacing;
        addCrownFastener(framingLeftX, concreteH + studThick, bz);
      }

      // Fasteners along right crown sill (cc 800 mm)
      if (this.concreteFacade('right')) {
        for (let i = 0; i <= leftFastenerCount; i++) {
          const bz = (framingBackZ + 0.15) + i * leftFastenerSpacing;
          addCrownFastener(framingRightX, concreteH + studThick, bz);
        }
      }

      // Fasteners along vertical concrete wall ends (screws facing forward at cc 600 mm)
      const vertSpan = (concreteH - 0.15) - (baseElevation + 0.25);
      const vertCount = Math.max(2, Math.round(vertSpan / 0.6));
      const vertSpacing = vertSpan / vertCount;
      for (let i = 0; i <= vertCount; i++) {
        const vy = (baseElevation + 0.25) + i * vertSpacing;
        const addVertFastener = (vx: number) => {
          const vWasher = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.004), fastenerMat);
          vWasher.position.set(vx, vy, concreteFrontZ + studThick + 0.002);
          vWasher.castShadow = true;
          vWasher.userData.framingStep = 1;
          vWasher.userData.ownMaterial = fastenerMat;
          vWasher.userData.isFastener = true;
          vWasher.userData.framingNameSv = 'Bricka för murändesinfästning';
          vWasher.userData.framingNameEn = 'Washer for Wall-End Fastener';
          vWasher.userData.dimension = '40×40 mm FZV';
          this.framingGroup.add(vWasher);

          const vScrew = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.01, 6), fastenerMat);
          vScrew.position.set(vx, vy, concreteFrontZ + studThick + 0.009);
          vScrew.rotation.x = Math.PI / 2;
          vScrew.castShadow = true;
          vScrew.userData.framingStep = 1;
          vScrew.userData.ownMaterial = fastenerMat;
          vScrew.userData.isFastener = true;
          vScrew.userData.framingNameSv = 'Murändesinfästning / betongskruv';
          vScrew.userData.framingNameEn = 'Wall-End Fastener / Concrete Screw';
          vScrew.userData.dimension = 'cc 600 mm i betonggavel';
          this.framingGroup.add(vScrew);
        };
        addVertFastener(framingLeftX);
        if (this.concreteFacade('right')) addVertFastener(framingRightX);
      }

      // Fasteners along ground extension sills (cc 800 mm)
      if (hasExtension) {
        const extFastenerSpan = (framingFrontZ - 0.15) - (concreteFrontZ + studThick + 0.15);
        if (extFastenerSpan > 0.3) {
          const extCount = Math.max(1, Math.round(extFastenerSpan / 0.8));
          const extSpacing = extFastenerSpan / extCount;
          for (let i = 0; i <= extCount; i++) {
            const ez = (concreteFrontZ + studThick + 0.15) + i * extSpacing;
            addCrownFastener(framingLeftX, baseElevation + studThick, ez);
            addCrownFastener(framingRightX, baseElevation + studThick, ez);
          }
        }
        for (let i = 0; i <= backFastenerCount; i++) {
          const fx = (framingLeftX + 0.15) + i * backFastenerSpacing;
          addCrownFastener(fx, baseElevation + studThick, framingFrontZ);
        }
      }
    } else {
      // Standard house (all sills on ground foundation)
      const frontSyllGeo = new THREE.BoxGeometry(w - 0.05, studThick, studDepth);
      const frontSyll = new THREE.Mesh(frontSyllGeo, framingMat);
      frontSyll.position.set(0, baseElevation + studThick / 2, framingFrontZ);
      frontSyll.castShadow = true;
      frontSyll.userData.framingStep = 1;
      frontSyll.userData.framingNameSv = 'Undersyll (framvägg)';
      frontSyll.userData.framingNameEn = 'Bottom Sill Plate (Front)';
      frontSyll.userData.dimension = '45×145 mm C24 · Syllisolering';
      this.framingGroup.add(frontSyll);

      const backSyll = new THREE.Mesh(frontSyllGeo, framingMat);
      backSyll.position.set(0, baseElevation + studThick / 2, framingBackZ);
      backSyll.castShadow = true;
      backSyll.userData.framingStep = 1;
      backSyll.userData.framingNameSv = 'Undersyll (bakvägg)';
      backSyll.userData.framingNameEn = 'Bottom Sill Plate (Rear)';
      backSyll.userData.dimension = '45×145 mm C24 · Syllisolering';
      this.framingGroup.add(backSyll);

      const sideSyllGeo = new THREE.BoxGeometry(studDepth, studThick, d - 0.05 - studDepth * 2);
      const leftSyll = new THREE.Mesh(sideSyllGeo, framingMat);
      leftSyll.position.set(framingLeftX, baseElevation + studThick / 2, 0);
      leftSyll.castShadow = true;
      leftSyll.userData.framingStep = 1;
      leftSyll.userData.framingNameSv = 'Undersyll (vänstervägg)';
      leftSyll.userData.framingNameEn = 'Bottom Sill Plate (Left)';
      leftSyll.userData.dimension = '45×145 mm C24 · Syllisolering';
      this.framingGroup.add(leftSyll);

      const rightSyll = new THREE.Mesh(sideSyllGeo, framingMat);
      rightSyll.position.set(framingRightX, baseElevation + studThick / 2, 0);
      rightSyll.castShadow = true;
      rightSyll.userData.framingStep = 1;
      rightSyll.userData.framingNameSv = 'Undersyll (högervägg)';
      rightSyll.userData.framingNameEn = 'Bottom Sill Plate (Right)';
      rightSyll.userData.dimension = '45×145 mm C24 · Syllisolering';
      this.framingGroup.add(rightSyll);
    }

    // 2. Top Header Plates (Hammarband / Toppsyll 45x145 mm)
    // Front header
    const frontHeaderGeo = new THREE.BoxGeometry(w - 0.05, studThick, studDepth);
    const frontHeader = new THREE.Mesh(frontHeaderGeo, framingMat);
    frontHeader.position.set(0, frontH - studThick / 2, framingFrontZ);
    frontHeader.castShadow = true;
    frontHeader.userData.framingStep = 5;
    frontHeader.userData.framingNameSv = 'Hammarband (framvägg)';
    frontHeader.userData.framingNameEn = 'Top Header Plate (Front)';
    frontHeader.userData.dimension = '45×145 mm C24';
    this.framingGroup.add(frontHeader);

    // Back header (at rear slope height)
    const backHeader = new THREE.Mesh(frontHeaderGeo, framingMat);
    backHeader.position.set(0, rearH - studThick / 2, framingBackZ);
    backHeader.castShadow = true;
    backHeader.userData.framingStep = 5;
    backHeader.userData.framingNameSv = 'Hammarband (bakvägg)';
    backHeader.userData.framingNameEn = 'Top Header Plate (Rear)';
    backHeader.userData.dimension = '45×145 mm C24';
    this.framingGroup.add(backHeader);

    // Sloping side headers on left and right connecting front to rear
    const slopeLen = Math.sqrt(Math.pow(d - 0.05 - studDepth * 2, 2) + Math.pow(frontH - rearH, 2));
    const slopeAngle = Math.atan2(frontH - rearH, d - 0.05 - studDepth * 2);
    const sideHeaderGeo = new THREE.BoxGeometry(studDepth, studThick, slopeLen);

    const leftHeader = new THREE.Mesh(sideHeaderGeo, framingMat);
    leftHeader.position.set(framingLeftX, (frontH + rearH) / 2 - studThick / 2, 0);
    leftHeader.rotation.x = -slopeAngle;
    leftHeader.castShadow = true;
    leftHeader.userData.framingStep = 5;
    leftHeader.userData.framingNameSv = 'Lutande hammarband (vänster)';
    leftHeader.userData.framingNameEn = 'Sloping Top Header (Left)';
    leftHeader.userData.dimension = '45×145 mm C24';
    this.framingGroup.add(leftHeader);

    const rightHeader = new THREE.Mesh(sideHeaderGeo, framingMat);
    rightHeader.position.set(framingRightX, (frontH + rearH) / 2 - studThick / 2, 0);
    rightHeader.rotation.x = -slopeAngle;
    rightHeader.castShadow = true;
    rightHeader.userData.framingStep = 5;
    rightHeader.userData.framingNameSv = 'Lutande hammarband (höger)';
    rightHeader.userData.framingNameEn = 'Sloping Top Header (Right)';
    rightHeader.userData.dimension = '45×145 mm C24';
    this.framingGroup.add(rightHeader);

    // 3. Vertical Wall Studs (Väggreglar cc 600 mm)
    // Corner Studs (dubbla hörnreglar)
    const cornerPositions = [
      { x: framingLeftX, z: framingFrontZ, height: frontH, base: baseElevation, isJunction: false },
      { x: framingRightX, z: framingFrontZ, height: frontH, base: baseElevation, isJunction: false },
      { x: framingLeftX, z: framingBackZ, height: rearH, base: isConcrete ? concreteH : baseElevation, isJunction: false },
      { x: framingRightX, z: framingBackZ, height: rearH, base: (isConcrete && this.concreteFacade('right')) ? concreteH : baseElevation, isJunction: false }
    ];

    // When concrete addition extends forward, add interface junction posts where timber meets concrete facade
    if (isConcrete && hasExtension) {
      const progress = (d / 2 - concreteFrontZ) / d;
      const junctionH = frontH - progress * (frontH - rearH);
      cornerPositions.push(
        { x: framingLeftX, z: concreteFrontZ + studThick / 2, height: junctionH, base: concreteH + studThick, isJunction: true },
        { x: framingRightX, z: concreteFrontZ + studThick / 2, height: junctionH, base: concreteH + studThick, isJunction: true }
      );
    }

    cornerPositions.forEach((cp) => {
      const studH = cp.height - cp.base - studThick * 2;
      if (studH > 0.05) {
        const cGeo = new THREE.BoxGeometry(studThick, studH, studDepth);
        const cMesh = new THREE.Mesh(cGeo, framingMat);
        cMesh.position.set(cp.x, cp.base + studThick + studH / 2, cp.z);
        cMesh.castShadow = true;
        cMesh.userData.framingStep = 2;
        cMesh.userData.framingNameSv = cp.isJunction ? 'Anslutningsstolpe vid mur' : 'Dubbel hörnregel';
        cMesh.userData.framingNameEn = cp.isJunction ? 'Concrete Interface Post' : 'Double Corner Post';
        cMesh.userData.dimension = cp.isJunction ? '45×145 mm C24' : '2 st 45×145 mm C24';
        this.framingGroup.add(cMesh);
      }
    });

    // Front Wall Studs with framing around door and window openings
    const frontStudCount = Math.floor((w - 0.1) / 0.6);
    const frontSpacing = (w - 0.1) / frontStudCount;
    const frontStudBase = baseElevation;
    const frontStudH = frontH - frontStudBase - studThick * 2;
    const frontOpenings = this.frontOpenings(w, frontH, baseElevation);

    if (frontStudH > 0.05) {
      for (let s = 1; s < frontStudCount; s++) {
        const sx = -w / 2 + 0.05 + s * frontSpacing;
        const blocked = frontOpenings.filter((opening) => Math.abs(sx - opening.x) < opening.winW / 2 - 0.02);
        if (blocked.length > 0) {
          this.fillStudGaps(sx, framingFrontZ, frontStudBase, frontH, blocked, studThick, studDepth, framingMat);
          continue;
        }

        const studMesh = new THREE.Mesh(new THREE.BoxGeometry(studThick, frontStudH, studDepth), framingMat);
        studMesh.position.set(sx, frontStudBase + studThick + frontStudH / 2, framingFrontZ);
        studMesh.castShadow = true;
        studMesh.userData.framingStep = 3;
        studMesh.userData.framingNameSv = 'Väggregel cc 600 mm (framvägg)';
        studMesh.userData.framingNameEn = 'Wall Stud cc 600 mm (Front Wall)';
        studMesh.userData.dimension = '45×145 mm C24';
        this.framingGroup.add(studMesh);
      }

      for (const opening of frontOpenings) {
        this.addOpeningFrame(opening.x, framingFrontZ, opening, studThick, studDepth, framingMat);
      }
    }

    // Rear, left, and right studs stop at doors and windows, the same way the front does.
    const allBackOpenings = this.wallOpenings('back', w, d, h, baseElevation);
    const allLeftOpenings = this.wallOpenings('left', w, d, h, baseElevation);
    const allRightOpenings = this.wallOpenings('right', w, d, h, baseElevation);
    const backOpenings = isConcrete
      ? allBackOpenings.filter((o) => o.sill >= concreteH - 0.1)
      : allBackOpenings;
    const leftOpenings = isConcrete
      ? allLeftOpenings.filter((o) => {
          const wz = shell.z + o.x;
          const overConcrete = wz >= -cd / 2 - 0.05 && wz <= cd / 2 + 0.05;
          return !overConcrete || o.sill >= concreteH - 0.1;
        })
      : allLeftOpenings;
    const rightOpenings = isConcrete
      ? allRightOpenings.filter((o) => {
          const wz = shell.z + o.x;
          const overConcrete = this.concreteFacade('right') && wz >= -cd / 2 - 0.05 && wz <= cd / 2 + 0.05;
          return !overConcrete || o.sill >= concreteH - 0.1;
        })
      : allRightOpenings;

    const rearStudH = rearH - concreteH - studThick * 2;
    if (rearStudH > 0.05) {
      for (let s = 1; s < frontStudCount; s++) {
        const sx = -w / 2 + 0.05 + s * frontSpacing;
        const blocked = backOpenings.filter((opening) => Math.abs(sx - opening.x) < opening.winW / 2 - 0.02);
        if (blocked.length > 0) {
          this.fillStudGaps(sx, framingBackZ, concreteH, rearH, blocked, studThick, studDepth, framingMat);
          continue;
        }
        const studMesh = new THREE.Mesh(new THREE.BoxGeometry(studThick, rearStudH, studDepth), framingMat);
        studMesh.position.set(sx, concreteH + studThick + rearStudH / 2, framingBackZ);
        studMesh.castShadow = true;
        studMesh.userData.framingStep = 3;
        studMesh.userData.framingNameSv = 'Väggregel cc 600 mm (bakvägg)';
        studMesh.userData.framingNameEn = 'Wall Stud cc 600 mm (Rear Wall)';
        studMesh.userData.dimension = '45×145 mm C24';
        this.framingGroup.add(studMesh);
      }
      for (const opening of backOpenings) {
        this.addOpeningFrame(opening.x, framingBackZ, opening, studThick, studDepth, framingMat);
      }
    }

    // Left and Right Wall Studs (interpolating height along roof slope)
    const sideStudCount = Math.floor((d - 0.05 - studDepth * 2) / 0.6);
    const sideSpacing = (d - 0.05 - studDepth * 2) / sideStudCount;

    for (let s = 1; s < sideStudCount; s++) {
      const sz = d / 2 - 0.025 - studDepth - s * sideSpacing;
      const progress = (d / 2 - sz) / d; // 0 at front, 1 at back
      const curH = frontH - progress * (frontH - rearH);
      const wz = shell.z + sz;
      const overConcrete = isConcrete && wz >= -cd / 2 - 0.05 && wz <= cd / 2 + 0.05;

      const leftBase = overConcrete ? concreteH : baseElevation;
      const leftStudH = curH - leftBase - studThick * 2;
      if (leftStudH > 0.05) {
        const leftBlocked = leftOpenings.filter((opening) => Math.abs(sz - opening.x) < opening.winW / 2 - 0.02);
        if (leftBlocked.length > 0) {
          this.fillStudGaps(sz, framingLeftX, leftBase, curH, leftBlocked, studThick, studDepth, framingMat, 'z');
        } else {
          const leftStud = new THREE.Mesh(new THREE.BoxGeometry(studDepth, leftStudH, studThick), framingMat);
          leftStud.position.set(framingLeftX, leftBase + studThick + leftStudH / 2, sz);
          leftStud.castShadow = true;
          leftStud.userData.framingStep = 3;
          leftStud.userData.framingNameSv = 'Väggregel cc 600 mm (vänstervägg)';
          leftStud.userData.framingNameEn = 'Wall Stud cc 600 mm (Left Wall)';
          leftStud.userData.dimension = '45×145 mm C24';
          this.framingGroup.add(leftStud);
        }
      }

      const rightBase = (overConcrete && this.concreteFacade('right')) ? concreteH : baseElevation;
      const rightStudH = curH - rightBase - studThick * 2;
      if (rightStudH > 0.05) {
        const rightBlocked = rightOpenings.filter((opening) => Math.abs(sz - opening.x) < opening.winW / 2 - 0.02);
        if (rightBlocked.length > 0) {
          this.fillStudGaps(sz, framingRightX, rightBase, curH, rightBlocked, studThick, studDepth, framingMat, 'z');
        } else {
          const rightStud = new THREE.Mesh(new THREE.BoxGeometry(studDepth, rightStudH, studThick), framingMat);
          rightStud.position.set(framingRightX, rightBase + studThick + rightStudH / 2, sz);
          rightStud.castShadow = true;
          rightStud.userData.framingStep = 3;
          rightStud.userData.framingNameSv = 'Väggregel cc 600 mm (högervägg)';
          rightStud.userData.framingNameEn = 'Wall Stud cc 600 mm (Right Wall)';
          rightStud.userData.dimension = '45×145 mm C24';
          this.framingGroup.add(rightStud);
        }
      }
    }
    for (const opening of leftOpenings) {
      this.addOpeningFrame(opening.x, framingLeftX, opening, studThick, studDepth, framingMat, 'z');
    }
    for (const opening of rightOpenings) {
      this.addOpeningFrame(opening.x, framingRightX, opening, studThick, studDepth, framingMat, 'z');
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
    this.addNoggings(this.gapsBetween(backSolids), 'x', framingBackZ, concreteH, studThick, studDepth, framingMat, backOpenings);
    this.addNoggings(this.gapsBetween(sideSolids), 'z', framingLeftX, concreteH, studThick, studDepth, framingMat, leftOpenings);
    this.addNoggings(this.gapsBetween(sideSolids), 'z', framingRightX, concreteH, studThick, studDepth, framingMat, rightOpenings);

    if (isConcrete) {
      // Step 4: Heavy Glulam Transfer Beam & Front Loft Carrier Beam (90x220 mm GL28c)
      // Carries the big loft at 2.5m elevation: rear beam seats with min 100 mm direct bearing
      // on solid 50 cm concrete side walls at concreteFrontZ; front beam spans front posts under 500 cm roof.
      const transferBeamH = 0.22;
      const transferBeamW = 0.09;
      const transferBeam = new THREE.Mesh(
        new THREE.BoxGeometry(w - 0.05, transferBeamH, transferBeamW),
        framingMat
      );
      transferBeam.position.set(0, concreteH - transferBeamH / 2, concreteFrontZ - transferBeamW / 2);
      transferBeam.castShadow = true;
      transferBeam.userData.framingStep = 4;
      transferBeam.userData.framingNameSv = 'Bärande limträbalk (avväxling mot betong)';
      transferBeam.userData.framingNameEn = 'Glulam Transfer Beam (Concrete Bearing)';
      transferBeam.userData.dimension = '90×220 mm GL28c · 100 mm upplag på betong';
      this.framingGroup.add(transferBeam);

      // Främre bärlina för loftet under 500 cm tak (Front Carrier Beam at 2.5m elevation)
      const frontLoftBeam = new THREE.Mesh(
        new THREE.BoxGeometry(w - 0.05 - studDepth * 2, transferBeamH, transferBeamW),
        framingMat
      );
      frontLoftBeam.position.set(0, concreteH - transferBeamH / 2, framingFrontZ - studDepth / 2 - transferBeamW / 2);
      frontLoftBeam.castShadow = true;
      frontLoftBeam.userData.framingStep = 4;
      frontLoftBeam.userData.framingNameSv = 'Främre bärlina för loft under 500 cm tak';
      frontLoftBeam.userData.framingNameEn = 'Front Loft Carrier Beam under 500 cm Roof';
      frontLoftBeam.userData.dimension = '90×220 mm GL28c · Bär loftets framkant';
      this.framingGroup.add(frontLoftBeam);

      // Step 5: Big Loft Floor Joists (Stort loftbjälklag 45x220 mm cc 600 mm)
      // Placed at the HIGHEST point of the house under the 500 cm roofing (NOT at the low rear).
      // Spans atop the carrier beams and extends back onto the old 50 cm concrete walls for solid added support.
      const loftFrontZ = framingFrontZ - studDepth / 2;
      const loftRearZ = Math.max(framingBackZ + 1.2, concreteFrontZ - 1.5);
      const loftSpanZ = Math.max(0.6, loftFrontZ - loftRearZ);
      const joistCount = Math.max(3, Math.floor(loftSpanZ / 0.6) + 1);
      const joistSpacing = loftSpanZ / (joistCount - 1);
      const joistH = 0.22;
      const joistW = 0.045;
      const joistLenX = w - 0.05 - studDepth * 2;
      const joistGeo = new THREE.BoxGeometry(joistLenX, joistH, joistW);

      for (let j = 0; j < joistCount; j++) {
        const jz = loftFrontZ - j * joistSpacing;
        const joistMesh = new THREE.Mesh(joistGeo, framingMat);
        joistMesh.position.set(0, concreteH + studThick + joistH / 2, jz);
        joistMesh.castShadow = true;
        joistMesh.userData.framingStep = 5;
        const overConcrete = jz <= concreteFrontZ + 0.05;
        joistMesh.userData.framingNameSv = overConcrete
          ? 'Loftbjälke med stöd på betongvägg & bärbalk'
          : 'Loftbjälke under 500 cm tak cc 600 mm';
        joistMesh.userData.framingNameEn = overConcrete
          ? 'Loft Joist supported by Concrete Wall & Transfer Beam'
          : 'Loft Joist under 500 cm Roof cc 600 mm';
        joistMesh.userData.dimension = '45×220 mm C24 · Delvis upplag på betongstomme';
        this.framingGroup.add(joistMesh);
      }

      // Structural subfloor deck for the big loft under 500 cm roof (skivverkan)
      const deckThick = 0.022; // 22 mm tongue & groove floor panels
      const deckMat = new THREE.MeshStandardMaterial({
        color: '#dfcaa6',
        roughness: 0.6,
        metalness: 0.02
      });
      const deckMesh = new THREE.Mesh(
        new THREE.BoxGeometry(joistLenX, deckThick, loftSpanZ),
        deckMat
      );
      deckMesh.position.set(0, concreteH + studThick + joistH + deckThick / 2, (loftFrontZ + loftRearZ) / 2);
      deckMesh.castShadow = true;
      deckMesh.userData.framingStep = 5;
      deckMesh.userData.ownMaterial = deckMat;
      deckMesh.userData.framingNameSv = 'Loftgolv under 500 cm tak (skivverkan)';
      deckMesh.userData.framingNameEn = 'Loft Floor Deck under 500 cm Roof (Diaphragm)';
      deckMesh.userData.dimension = '22 mm golvspånskiva · Delvis stöd på betongvägg';
      this.framingGroup.add(deckMesh);

      // Step 6: Wind Uplift Tie-Down Straps (Dragband förankrade i betong)
      // Steel tension straps running vertically from rafters/studs anchored deep into concrete walls
      const strapMat = new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        roughness: 0.35,
        metalness: 0.85
      });
      const strapGeo = new THREE.BoxGeometry(0.005, 0.45, 0.04);
      const strapPositions = [
        { x: framingLeftX - 0.005, z: framingBackZ + 0.3 },
        { x: framingLeftX - 0.005, z: concreteFrontZ - 0.3 },
        { x: framingRightX + 0.005, z: framingBackZ + 0.3 },
        { x: framingRightX + 0.005, z: concreteFrontZ - 0.3 }
      ];
      for (const sp of strapPositions) {
        const strap = new THREE.Mesh(strapGeo, strapMat);
        strap.position.set(sp.x, concreteH, sp.z);
        strap.castShadow = true;
        strap.userData.framingStep = 6;
        strap.userData.ownMaterial = strapMat;
        strap.userData.framingNameSv = 'Vinddragband i stål';
        strap.userData.framingNameEn = 'Steel Wind Uplift Strap';
        strap.userData.dimension = 'Förzinkat stål 2.0 mm förankrat i betong';
        this.framingGroup.add(strap);
      }

      // Step 7: Metal Base Flashing / Drip Edge (Sockelbleck)
      // Continuous sheet metal flashing shedding rainwater away from the concrete junction
      const flashMat = new THREE.MeshStandardMaterial({
        color: '#475569',
        roughness: 0.4,
        metalness: 0.7
      });
      const flashThick = 0.015;
      const flashBack = new THREE.Mesh(new THREE.BoxGeometry(w, flashThick, 0.05), flashMat);
      flashBack.position.set(0, concreteH, framingBackZ - 0.02);
      flashBack.userData.framingStep = 7;
      flashBack.userData.ownMaterial = flashMat;
      flashBack.userData.framingNameSv = 'Sockelbleck vid betongkrön';
      flashBack.userData.framingNameEn = 'Base Drip Edge Flashing';
      flashBack.userData.dimension = 'Pulverlackad stålplåt';
      this.framingGroup.add(flashBack);

      const concreteSideWallSpanZ = Math.max(0.1, concreteFrontZ - framingBackZ);
      const flashLeft = new THREE.Mesh(new THREE.BoxGeometry(0.05, flashThick, concreteSideWallSpanZ), flashMat);
      flashLeft.position.set(framingLeftX - 0.02, concreteH, (framingBackZ + concreteFrontZ) / 2);
      flashLeft.userData.framingStep = 7;
      flashLeft.userData.ownMaterial = flashMat;
      flashLeft.userData.framingNameSv = 'Sockelbleck vid betongkrön';
      flashLeft.userData.framingNameEn = 'Base Drip Edge Flashing';
      flashLeft.userData.dimension = 'Pulverlackad stålplåt';
      this.framingGroup.add(flashLeft);

      if (this.concreteFacade('right')) {
        const flashRight = new THREE.Mesh(new THREE.BoxGeometry(0.05, flashThick, concreteSideWallSpanZ), flashMat);
        flashRight.position.set(framingRightX + 0.02, concreteH, (framingBackZ + concreteFrontZ) / 2);
        flashRight.userData.framingStep = 7;
        flashRight.userData.ownMaterial = flashMat;
        flashRight.userData.framingNameSv = 'Sockelbleck vid betongkrön';
        flashRight.userData.framingNameEn = 'Base Drip Edge Flashing';
        flashRight.userData.dimension = 'Pulverlackad stålplåt';
        this.framingGroup.add(flashRight);
      }
    }
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
    const isConcrete = Boolean(this.currentConfig.concreteBase && !this.concreteFoundationOnly());
    const concreteH = isConcrete ? this.concreteCrownM() : baseElevation;
    const cd = (this.currentConfig.concreteDepthMm ?? 5200) / 1000;
    const shell = this.timberShell();

    gaps.forEach((gap, bay) => {
      const length = gap.to - gap.from - 0.004;
      if (length < 0.08) return;
      let floor = baseElevation + studThick;
      if (axis === 'z' && isConcrete) {
        const midZ = (gap.from + gap.to) / 2;
        const wz = shell.z + midZ;
        const overConcrete = wz >= -cd / 2 - 0.05 && wz <= cd / 2 + 0.05;
        floor = (overConcrete ? concreteH : baseElevation) + studThick;
      }
      let row = 0;
      for (let y = floor + rowPitch; y + studThick / 2 < gap.top - 0.01; y += rowPitch, row += 1) {
        const stagger = (bay + row) % 2 === 1 ? studThick : 0;
        let centerY = y + stagger;
        if (centerY + studThick / 2 > gap.top - 0.008) centerY = y;
        if (centerY - studThick / 2 < floor + 0.02) continue;
        if (this.noggingHitsOpening(gap.from, gap.to, centerY, studThick, openings)) continue;
        const mesh = new THREE.Mesh(
          axis === 'x'
            ? new THREE.BoxGeometry(length, studThick, studDepth)
            : new THREE.BoxGeometry(studDepth, studThick, length),
          mat
        );
        const mid = (gap.from + gap.to) / 2;
        mesh.position.set(axis === 'x' ? mid : fixed, centerY, axis === 'z' ? mid : fixed);
        mesh.castShadow = true;
        mesh.userData.framingStep = 5;
        mesh.userData.framingNameSv = 'Kortling (väggsträva)';
        mesh.userData.framingNameEn = 'Mid-Wall Nogging / Blocking';
        mesh.userData.dimension = '45×145 mm C24';
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

    // Check collision with staircase. A front or back flight sits inside a turned group.
    let hitsStair = false;
    this.loftGroup.traverse((child) => {
      if (hitsStair || child.userData.type !== 'staircase') return;
      const stairBox = new THREE.Box3().setFromObject(child);
      if (box.intersectsBox(stairBox)) hitsStair = true;
    });
    if (hitsStair) return false;

    return true;
  }

  /**
   * Evenly spaced lower windows hosted on one slot and covering sibling bays.
   * Returns the opening that belongs on this panel index, or null.
   */
  private windowRhythmOpeningForPanel(
    wall: 'front' | 'back' | 'left' | 'right',
    index: number,
    panelWidth: number,
    panelHeight: number,
    panelBase: number,
    panelCount: number
  ): {
    hostId: string;
    itemId: string | undefined;
    opening: { winW: number; winH: number; winY: number; x: number; sill: number; head: number; casingSide?: number };
  } | null {
    const slots = this.currentConfig.wallSlots;
    const slot = slots[`${wall}-${index}`];
    if (!slot || slot.isUpper) return null;
    let hostId: string | null = null;
    if (slot.windowRhythm) hostId = slot.id;
    else if (slot.coveredBy && slots[slot.coveredBy]?.windowRhythm) hostId = slot.coveredBy;
    if (!hostId) return null;
    const host = slots[hostId];
    if (!host?.windowRhythm) return null;

    const run: number[] = [];
    for (let i = 0; i < panelCount; i += 1) {
      const s = slots[`${wall}-${i}`];
      if (s && (s.id === hostId || s.coveredBy === hostId)) run.push(i);
    }
    if (run.length < 2) return null;

    const runStart = run[0];
    const runLength = run.length;
    const cornerSide = this.cornerSideForPanel(wall, index, panelCount);
    const fitted = this.fittedOpening(
      'window',
      host.itemId,
      false,
      panelWidth,
      panelHeight,
      panelBase,
      false,
      cornerSide,
      null
    );
    const placed = rhythmOpeningsInRun(
      runStart,
      runLength,
      host.windowRhythm,
      panelWidth,
      fitted.winW
    );
    const mine = placed.find((p) => p.panelIndex === index);
    if (!mine) return null;
    return {
      hostId,
      itemId: host.itemId,
      opening: {
        winW: mine.winW,
        winH: fitted.winH,
        winY: fitted.winY,
        x: mine.x,
        sill: fitted.sill,
        head: fitted.head,
        casingSide: fitted.casingSide
      }
    };
  }

  /**
   * A sliding door occupies two bays. The host panel draws the leaves;
   * the neighbour only cuts the cladding where the opening crosses the joint.
   */
  private wideOpeningForPanel(
    wall: 'front' | 'back' | 'left' | 'right',
    index: number,
    panelWidth: number,
    panelHeight: number,
    panelBase: number
  ) {
    const count = this.panelCountForWall(
      wall,
      this.currentConfig.widthMm / 1000,
      this.currentConfig.depthMm / 1000
    );
    const slots = this.currentConfig.wallSlots;
    const slot = slots[`${wall}-${index}`];
    let host = index;
    let partner: number | null = null;
    const clear = panelWidth - 0.09 * 2 - 0.045 * 2;
    const reachesNeighbour = (itemId: string | undefined) =>
      itemId === 'SKJUTDORR3' ? clear < 2.4 : itemId === 'SKJUTDORR' && clear < 1.65;
    const partnerOf = (hostIndex: number) =>
      hostIndex + 1 < count ? hostIndex + 1 : hostIndex > 0 ? hostIndex - 1 : null;
    if (reachesNeighbour(slot?.itemId)) {
      partner = partnerOf(index);
    } else if (slot?.coveredBy) {
      const hostSlot = slots[slot.coveredBy];
      if ((hostSlot?.itemId === 'SKJUTDORR' || hostSlot?.itemId === 'SKJUTDORR3') && hostSlot.wall === wall) {
        host = hostSlot.index;
        partner = index;
      }
    } else {
      for (const candidate of [index - 1, index + 1]) {
        if (candidate < 0 || candidate >= count) continue;
        const hostSlot = slots[`${wall}-${candidate}`];
        if (!reachesNeighbour(hostSlot?.itemId) || partnerOf(candidate) !== index) continue;
        host = candidate;
        partner = index;
        break;
      }
    }
    if (partner == null) return null;

    const sign = wall === 'left' || wall === 'right' ? -1 : 1;
    const towardPartner = Math.sign(partner - host) * sign * panelWidth / 2;
    const panelFromHost = (index - host) * sign * panelWidth;
    const side = 0.09;
    const edge = 0.045;
    const headBoard = 0.085;
    const hostSlot = slots[`${wall}-${host}`];
    const leafSpan = hostSlot?.itemId === 'SKJUTDORR' ? 2 : 3;
    const doorW = Math.min(leafSpan, panelWidth * 2 - side * 2 - edge * 2);
    const doorH = Math.min(2.1, Math.max(1.7, panelHeight - headBoard - 0.06));
    const sill = panelBase;
    const head = sill + doorH;
    const centerY = panelBase + panelHeight / 2;
    return {
      winW: doorW,
      winH: doorH,
      winY: (sill + head) / 2 - centerY,
      x: towardPartner - panelFromHost,
      sill,
      head,
      drawDoor: index === host
    };
  }

  /**
   * Opening size follows the panel it sits in.
   * An upper panel is a wide, low bay, so its window is a landscape rectangle.
   * A lower window fills the bay under the rail. A door stands on the floor.
   * Catalog type changes glass and mullions; it does not override the fit.
   */
  /** Returns which local side ('left' | 'right') of this panel touches an exterior corner, or null if interior. */
  private cornerSideForPanel(
    wallSide: 'front' | 'back' | 'left' | 'right',
    index: number,
    panelCount: number
  ): 'left' | 'right' | null {
    if (index !== 0 && index !== panelCount - 1) return null;
    if (wallSide === 'front' || wallSide === 'back') {
      return index === 0 ? 'left' : 'right';
    }
    return index === 0 ? 'right' : 'left';
  }

  /**
   * Sizing windows and doors to fit inside modular wall panels.
   * A lower window fills the bay under the rail. A door stands on the floor.
   * Catalog type changes glass and mullions; it does not override the fit.
   */
  private fittedOpening(
    kind: 'door' | 'window',
    itemId: string | undefined,
    isUpper: boolean,
    panelWidth: number,
    panelHeight: number,
    panelBase: number,
    aboveDoor = false,
    cornerSide?: 'left' | 'right' | null,
    facadeSpan?: { from: number; to: number } | null
  ) {
    const half = panelWidth / 2;

    // Detect if this lower panel has a wooden extension overhang alongside a concrete facade
    let woodSpan: { from: number; to: number } | null = null;
    if (facadeSpan && !isUpper) {
      if (facadeSpan.from > -half + 0.08) {
        woodSpan = { from: -half, to: facadeSpan.from };
      } else if (facadeSpan.to < half - 0.08) {
        woodSpan = { from: facadeSpan.to, to: half };
      }
    }

    if (kind === 'door') {
      const headBoard = 0.085;
      const fitted = fittedDoorOpening(itemId, panelWidth, cornerSide);
      const doorH = Math.min(2.1, Math.max(1.7, panelHeight - headBoard - 0.06));
      const sill = panelBase;
      const head = sill + doorH;
      const centerY = panelBase + panelHeight / 2;
      return { winW: fitted.width, winH: doorH, winY: (sill + head) / 2 - centerY, sill, head, x: fitted.shift };
    }

    return fittedWindowOpening(
      itemId,
      panelWidth,
      panelHeight,
      panelBase,
      isUpper,
      aboveDoor,
      cornerSide,
      woodSpan
    );
  }

  /** Each wall group is rotated so its local +Z already points away from the house. */
  private outwardSign(wall: OutsideAnchor['wall']) {
    const facingOut: Record<OutsideAnchor['wall'], number> = {
      front: 1,
      back: 1,
      left: 1,
      right: 1
    };
    return facingOut[wall];
  }

  /** Exterior doors, one per opening. A wide slider is listed once, on its host bay. */
  private outsideAnchors(w: number, d: number, h: number): OutsideAnchor[] {
    const base = 0.25;
    const cladding = 0.025;
    const endInset = cladding - 0.008;
    const anchors: OutsideAnchor[] = [];
    const walls = ['front', 'back', 'left', 'right'] as const;
    for (const wall of walls) {
      const count = this.panelCountForWall(wall, w, d);
      const wallLength = wall === 'front' || wall === 'back' ? w : d - endInset * 2;
      const panelWidth = wallLength / count;
      const panelH = Math.max(1.8, h - base);
      for (let i = 0; i < count; i++) {
        const slot = this.currentConfig.wallSlots[`${wall}-${i}`];
        if (!slot || slot.type !== 'door') continue;
        const wide = slot.itemId === 'SKJUTDORR' || slot.itemId === 'SKJUTDORR3' || slot.coveredBy
          ? this.wideOpeningForPanel(wall, i, panelWidth, panelH, base)
          : null;
        if (wide && !wide.drawDoor) continue;
        if (slot.coveredBy && !wide) continue;
        const cornerSide = this.cornerSideForPanel(wall, i, count);
        const opening = wide ?? this.fittedOpening('door', slot.itemId, false, panelWidth, panelH, base, false, cornerSide);
        let px = 0;
        let pz = 0;
        let rotY = 0;
        if (wall === 'front') {
          px = -w / 2 + (i + 0.5) * panelWidth;
          pz = d / 2 - cladding / 2;
          rotY = 0;
        } else if (wall === 'back') {
          px = w / 2 - (i + 0.5) * panelWidth;
          pz = -d / 2 + cladding / 2;
          rotY = Math.PI;
        } else if (wall === 'left') {
          px = -w / 2 + cladding / 2;
          pz = d / 2 - endInset - (i + 0.5) * panelWidth;
          rotY = -Math.PI / 2;
        } else {
          px = w / 2 - cladding / 2;
          pz = -d / 2 + endInset + (i + 0.5) * panelWidth;
          rotY = Math.PI / 2;
        }
        anchors.push({
          px,
          pz,
          rotY,
          doorX: wide?.x ?? opening.x ?? 0,
          width: opening.winW,
          head: opening.head,
          wall,
          itemId: slot.itemId,
          cornerSide,
          panelWidth
        });
      }
    }
    return anchors;
  }

  private fallbackDoor(d: number): OutsideAnchor {
    return {
      px: 0,
      pz: d / 2 - 0.0125,
      rotY: 0,
      doorX: 0,
      width: 1,
      head: 2.35,
      wall: 'front'
    };
  }

  /** Keep a deck centred on its door from running past the wall ends. */
  private terraceShift(door: OutsideAnchor, width: number, w: number, d: number) {
    const half = width / 2;
    if (door.wall === 'front' || door.wall === 'back') {
      const world = door.wall === 'front' ? door.px + door.doorX : door.px - door.doorX;
      const clamped = Math.max(-w / 2 + half, Math.min(w / 2 - half, world));
      return door.wall === 'front' ? clamped - door.px : door.px - clamped;
    }
    const worldZ = door.wall === 'left' ? door.pz - door.doorX : door.pz + door.doorX;
    const clamped = Math.max(-d / 2 + half, Math.min(d / 2 - half, worldZ));
    return door.wall === 'left' ? door.pz - clamped : clamped - door.pz;
  }

  private addDoorCanopy(door: OutsideAnchor, timber: THREE.Material, roofMat: THREE.Material) {
    const outward = this.outwardSign(door.wall);
    const projection = 0.92;
    const layout = computeDoorCanopyLayout({
      doorX: door.doorX,
      doorWidth: door.width,
      panelWidth: door.panelWidth,
      cornerSide: door.cornerSide
    });

    const pitch = (8 * Math.PI) / 180;
    const group = new THREE.Group();
    group.position.set(door.px, 0, door.pz);
    group.rotation.y = door.rotY;

    const y = door.head + 0.18;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(layout.width, 0.04, projection), roofMat);
    roof.position.set(layout.canopyX, y, outward * (projection / 2 + 0.02));
    roof.rotation.x = outward * pitch;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);

    const fascia = new THREE.Mesh(new THREE.BoxGeometry(layout.fasciaWidth, 0.09, 0.022), timber);
    fascia.position.set(layout.canopyX, y - 0.06, outward * (projection + 0.03));
    fascia.castShadow = true;
    group.add(fascia);

    for (const bx of [layout.leftBracketX, layout.rightBracketX]) {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, projection * 0.78), timber);
      bracket.position.set(
        bx,
        y - 0.07,
        outward * (projection * 0.42)
      );
      bracket.castShadow = true;
      group.add(bracket);
    }

    group.userData.skipNote = true;
    group.userData.outsideAddition = true;
    this.wallsGroup.add(group);
  }

  /** Rafters, a wall plate, and separate roof boards, so the timber reads up close. */
  private addTerraceRoof(
    group: THREE.Group,
    door: OutsideAnchor,
    timber: THREE.Material,
    roofMat: THREE.Material,
    along: number,
    width: number,
    depth: number,
    deckTop: number,
    outward: number
  ) {
    const pitch = (6 * Math.PI) / 180;
    const wallY = door.head + 0.28;
    const drop = Math.sin(pitch) * depth;
    const outerY = wallY - drop;
    const midY = (wallY + outerY) / 2;
    const midZ = outward * (depth / 2 + 0.04);
    const axisY = -Math.sin(pitch) * outward;
    const axisZ = Math.cos(pitch) * outward;
    const upY = Math.cos(pitch);
    const upZ = Math.sin(pitch) * outward;
    const roofW = width + 0.08;
    const span = depth - 0.06;

    const plate = new THREE.Mesh(new THREE.BoxGeometry(roofW, 0.095, 0.07), timber);
    plate.position.set(along, wallY - 0.02, outward * 0.06);
    plate.castShadow = true;
    group.add(plate);

    const rafterCount = Math.max(2, Math.ceil(width / 0.6) + 1);
    const rafterLen = depth + 0.12;
    for (let i = 0; i < rafterCount; i++) {
      const x = rafterCount === 1
        ? 0
        : -width / 2 + 0.06 + (i * (width - 0.12)) / (rafterCount - 1);
      const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.145, rafterLen), timber);
      rafter.position.set(along + x, midY, midZ);
      rafter.rotation.x = outward * pitch;
      rafter.castShadow = true;
      group.add(rafter);
    }

    // Roof boards start tight against the wall and extend to the outer eave
    const slopeTotal = (depth + 0.06) / Math.cos(pitch);
    const boardCount = Math.max(6, Math.round(slopeTotal / 0.13));
    const boardStep = slopeTotal / boardCount;
    for (let i = 0; i < boardCount; i++) {
      const distAlong = boardStep * (i + 0.5);
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(roofW - 0.02, 0.022, Math.max(0.04, boardStep - 0.006)),
        roofMat
      );
      board.position.set(
        along,
        wallY + upY * 0.086 - Math.sin(pitch) * distAlong,
        outward * (Math.cos(pitch) * distAlong) + upZ * 0.086
      );
      board.rotation.x = outward * pitch;
      board.castShadow = true;
      board.receiveShadow = true;
      group.add(board);
    }

    // Wall apron flashing (vägganslutningsplåt) seals the junction between wall and terrace roof
    const flashingMat = new THREE.MeshStandardMaterial({
      color: '#2a3036',
      roughness: 0.42,
      metalness: 0.65
    });
    const flashing = new THREE.Mesh(
      new THREE.BoxGeometry(roofW + 0.02, 0.12, 0.22),
      flashingMat
    );
    flashing.position.set(along, wallY + 0.04, outward * 0.09);
    flashing.rotation.x = outward * pitch;
    flashing.castShadow = true;
    group.add(flashing);

    const outerZ = outward * (depth - 0.02);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.4, width - 0.16), 0.095, 0.095), timber);
    beam.position.set(along, outerY - 0.04, outerZ);
    beam.castShadow = true;
    group.add(beam);

    const fascia = new THREE.Mesh(new THREE.BoxGeometry(roofW + 0.02, 0.14, 0.022), timber);
    fascia.position.set(along, outerY + 0.02, outward * (depth + 0.06));
    fascia.castShadow = true;
    group.add(fascia);

    const postH = Math.max(1.2, outerY - 0.06 - deckTop);
    const postCount = Math.max(2, Math.ceil(width / 2.4) + 1);
    for (let i = 0; i < postCount; i++) {
      const x = -width / 2 + 0.1 + (i * (width - 0.2)) / (postCount - 1);
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, postH, 0.09), timber);
      post.position.set(along + x, deckTop + postH / 2, outerZ);
      post.castShadow = true;
      group.add(post);
    }
  }

  private houseExteriorHex(): string {
    if (this.currentConfig.customHex) return this.currentConfig.customHex;
    switch (this.currentConfig.material) {
      case 'falurod':
        return '#892622';
      case 'grey':
        return '#64748b';
      case 'white':
        return '#f8fafc';
      case 'black':
        return '#1a1c1b';
      default:
        return '#f6ead8';
    }
  }

  private houseCornerHex(): string {
    return this.resolveTrimHex(this.currentConfig.cornerColor, () => this.houseExteriorHex());
  }

  private resolveTrimHex(key: string | null | undefined, fallback: () => string): string {
    if (key && key !== 'same') {
      if (key === 'white') return '#f8fafc';
      if (key === 'falurod') return '#892622';
      if (key === 'grey') return '#64748b';
      if (key === 'black') return '#1a1c1b';
      if (key === 'wood') return '#f6ead8';
      if (key.startsWith('#')) return key;
    }
    return fallback();
  }

  private houseCasingHex(): string {
    return this.resolveTrimHex(this.currentConfig.frameColor, () => this.casingColor());
  }

  private addTerrace(
    door: OutsideAnchor,
    deckMat: THREE.Material,
    deckAlt: THREE.Material,
    timber: THREE.Material,
    roofMat: THREE.Material,
    terrace: HouseTerrace,
    w: number,
    d: number,
    openLeft = true,
    openRight = true
  ) {
    const outward = this.outwardSign(door.wall);
    const { depth, span } = terrace;
    const full = span === 'full';
    const wallSpan = door.wall === 'front' || door.wall === 'back' ? w : d;
    const width = full
      ? wallSpan
      : Math.min(Math.max(door.width + 1.5, 2.4), Math.max(1.6, wallSpan - 0.3));
    const along = full ? 0 : this.terraceShift(door, width, w, d);
    const deckTop = 0.28;
    const boardT = 0.028;
    const rimH = deckTop - boardT;
    const group = new THREE.Group();
    group.position.set(door.px, 0, door.pz);
    group.rotation.y = door.rotY;

    const boardLayout = terraceBoardLayout(depth);
    // Skirting ledger plate against the wall face seals any gap between the wall base and deck
    const skirtingH = Math.max(0.03, deckTop - 0.25);
    const skirting = new THREE.Mesh(
      new THREE.BoxGeometry(width, skirtingH, 0.045),
      timber
    );
    skirting.position.set(along, 0.25 + skirtingH / 2, outward * 0.022);
    skirting.castShadow = true;
    skirting.receiveShadow = true;
    group.add(skirting);

    for (let i = 0; i < boardLayout.count; i++) {
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(width, boardT, boardLayout.depth),
        i % 2 === 0 ? deckMat : deckAlt
      );
      board.position.set(along, deckTop - boardT / 2, outward * boardLayout.centers[i]);
      board.castShadow = true;
      board.receiveShadow = true;
      group.add(board);
    }

    const joistCount = Math.max(3, Math.round(width / 0.55));
    const joistStart = 0.22;
    const joistLen = Math.max(0.4, depth - joistStart - 0.02);
    const joistH = Math.min(0.12, rimH);
    for (let i = 0; i < joistCount; i++) {
      const joist = new THREE.Mesh(new THREE.BoxGeometry(0.045, joistH, joistLen), timber);
      const x = -width / 2 + 0.08 + (i * (width - 0.16)) / Math.max(1, joistCount - 1);
      joist.position.set(along + x, deckTop - boardT - joistH / 2, outward * (joistStart + joistLen / 2));
      joist.castShadow = true;
      group.add(joist);
    }

    // Front rim extends from ground y = 0 up to the underside of the deck boards
    const rim = new THREE.Mesh(new THREE.BoxGeometry(width, rimH, 0.028), timber);
    rim.position.set(along, rimH / 2, outward * (depth - 0.014));
    rim.castShadow = true;
    group.add(rim);

    // Side rims extend from ground y = 0 up to deck boards on exposed outer ends
    if (openLeft) {
      const leftRim = new THREE.Mesh(new THREE.BoxGeometry(0.028, rimH, depth), timber);
      leftRim.position.set(along - width / 2 + 0.014, rimH / 2, outward * (depth / 2));
      leftRim.castShadow = true;
      group.add(leftRim);
    }
    if (openRight) {
      const rightRim = new THREE.Mesh(new THREE.BoxGeometry(0.028, rimH, depth), timber);
      rightRim.position.set(along + width / 2 - 0.014, rimH / 2, outward * (depth / 2));
      rightRim.castShadow = true;
      group.add(rightRim);
    }

    const layout = terraceAdditionLayout({
      along,
      width,
      depth,
      building: terrace.building,
      buildingSize: terrace.buildingSize,
      buildingPlacement: terrace.buildingPlacement,
      hotTub: terrace.hotTub
    });
    const { hasAddition } = layout;
    let cabinSlot = layout.cabin;
    let houseDoorSpec: { along: number; width?: number; head?: number } | null = null;

    if (cabinSlot && terrace.building === 'sauna') {
      const h = this.wallTopM();
      const wallDoors = this.outsideAnchors(w, d, h).filter((a) => a.wall === door.wall);
      const cosR = Math.cos(-door.rotY);
      const sinR = Math.sin(-door.rotY);
      const doorsWithLocal = wallDoors.map((a) => {
        const dx = a.px + (a.doorX ?? 0) - door.px;
        const dz = a.pz - door.pz;
        const localAlong = dx * cosR - dz * sinR;
        return { anchor: a, localAlong };
      });
      if (doorsWithLocal.length > 0) {
        const initialBX = cabinSlot.bX;
        const matchingDoor = doorsWithLocal.reduce((closest, item) => {
          if (!closest) return item;
          return Math.abs(item.localAlong - initialBX) < Math.abs(closest.localAlong - initialBX)
            ? item
            : closest;
        }, null as { anchor: OutsideAnchor; localAlong: number } | null);

        if (matchingDoor && Math.abs(matchingDoor.localAlong - initialBX) <= width * 0.6) {
          const minBX = along - width / 2 + cabinSlot.bW / 2;
          const maxBX = along + width / 2 - cabinSlot.bW / 2;
          const bX = Math.min(maxBX, Math.max(minBX, matchingDoor.localAlong));
          cabinSlot = { ...cabinSlot, bX };
          houseDoorSpec = {
            along: matchingDoor.localAlong,
            width: matchingDoor.anchor.width,
            head: matchingDoor.anchor.head
          };
        }
      }
    }

    // Recalculate open roof strip after sauna may have nudged along the wall.
    let roofW = layout.roofW;
    let roofAlong = layout.roofAlong;
    if (cabinSlot || layout.hotTub) {
      const leftRight = cabinSlot?.isLeft ? cabinSlot : layout.hotTub?.isLeft ? layout.hotTub : null;
      const rightSlot = cabinSlot && !cabinSlot.isLeft ? cabinSlot : layout.hotTub && !layout.hotTub.isLeft ? layout.hotTub : null;
      const freeLeft = leftRight ? leftRight.bX + leftRight.bW / 2 : along - width / 2;
      const freeRight = rightSlot ? rightSlot.bX - rightSlot.bW / 2 : along + width / 2;
      roofW = Math.max(0, freeRight - freeLeft);
      roofAlong = (freeLeft + freeRight) / 2;
    }

    if (terrace.roof && roofW >= 0.8) {
      this.addTerraceRoof(group, door, timber, roofMat, roofAlong, roofW, depth, deckTop, outward);
    }

    if (cabinSlot && (terrace.building === 'sauna' || terrace.building === 'shed')) {
      addTerraceCabin(group, {
        bX: cabinSlot.bX,
        bW: cabinSlot.bW,
        bD: cabinSlot.bD,
        deckTop,
        outward,
        type: terrace.building,
        isLeft: cabinSlot.isLeft,
        turn: terrace.building === 'sauna' ? terrace.buildingTurn ?? 0 : 0,
        roof: normalizeBuildingRoof(terrace.buildingRoof),
        roofMat,
        openFront: this.interiorCut(),
        houseDoor: houseDoorSpec,
        doorId: terrace.buildingDoor,
        windowId: terrace.buildingWindow,
        windowPlacement: terrace.buildingWindowPlacement,
        windowSize: terrace.buildingWindowSize,
        colorId: terrace.buildingColor,
        houseColorHex: this.houseExteriorHex(),
        houseCornerHex: this.houseCornerHex(),
        houseCasingHex: this.houseCasingHex()
      });
    }

    if (layout.hotTub) {
      addTerraceHotTub(group, {
        bX: layout.hotTub.bX,
        bW: layout.hotTub.bW,
        bD: layout.hotTub.bD,
        deckTop,
        outward,
        isLeft: layout.hotTub.isLeft
      });
    }

    group.userData.skipNote = true;
    group.userData.outsideAddition = true;
    group.userData.keepInInterior = hasAddition;
    this.wallsGroup.add(group);
  }

  /** Fill the square outside a corner where two full-side decks meet. */
  private addTerraceCorners(
    terraces: HouseTerrace[],
    deckMat: THREE.Material,
    deckAlt: THREE.Material,
    timber: THREE.Material,
    w: number,
    d: number
  ) {
    const bySide = new Map(terraces.filter((item) => item.span === 'full').map((item) => [item.side, item]));
    const corners: { x: TerraceSide; z: TerraceSide; signX: 1 | -1; signZ: 1 | -1 }[] = [
      { x: 'right', z: 'front', signX: 1, signZ: 1 },
      { x: 'left', z: 'front', signX: -1, signZ: 1 },
      { x: 'right', z: 'back', signX: 1, signZ: -1 },
      { x: 'left', z: 'back', signX: -1, signZ: -1 }
    ];
    for (const corner of corners) {
      const alongX = bySide.get(corner.x);
      const alongZ = bySide.get(corner.z);
      if (!alongX || !alongZ) continue;
      this.addCornerDeck(corner.signX, corner.signZ, alongX.depth, alongZ.depth, w, d, deckMat, deckAlt, timber);
    }
  }

  private addCornerDeck(
    signX: 1 | -1,
    signZ: 1 | -1,
    depthX: number,
    depthZ: number,
    w: number,
    d: number,
    deckMat: THREE.Material,
    deckAlt: THREE.Material,
    timber: THREE.Material
  ) {
    const deckTop = 0.28;
    const boardT = 0.028;
    const rimH = deckTop - boardT;
    // Full terraces start at the middle of the 25 mm cladding. Subtracting
    // that half-thickness here makes the corner finish on their exact outer
    // edges while beginning flush at the building corner.
    const facadeAnchorInset = 0.025 / 2;
    const spanX = Math.max(0.3, depthX - facadeAnchorInset);
    const spanZ = Math.max(0.3, depthZ - facadeAnchorInset);
    const group = new THREE.Group();
    group.position.set(signX * (w / 2), 0, signZ * (d / 2));

    const boardLayout = terraceBoardLayout(spanZ);
    for (let i = 0; i < boardLayout.count; i += 1) {
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(spanX, boardT, boardLayout.depth),
        i % 2 === 0 ? deckMat : deckAlt
      );
      board.position.set(
        signX * (spanX / 2),
        deckTop - boardT / 2,
        signZ * boardLayout.centers[i]
      );
      board.castShadow = true;
      board.receiveShadow = true;
      group.add(board);
    }

    // Outer rims extend from ground y = 0 up to deck boards so the deck is never floating
    const rimX = new THREE.Mesh(new THREE.BoxGeometry(0.028, rimH, spanZ), timber);
    rimX.position.set(signX * (spanX - 0.014), rimH / 2, signZ * (spanZ / 2));
    rimX.castShadow = true;
    group.add(rimX);
    const rimZ = new THREE.Mesh(new THREE.BoxGeometry(spanX, rimH, 0.028), timber);
    rimZ.position.set(signX * (spanX / 2), rimH / 2, signZ * (spanZ - 0.014));
    rimZ.castShadow = true;
    group.add(rimZ);

    group.userData.skipNote = true;
    group.userData.outsideAddition = true;
    this.wallsGroup.add(group);
  }

  private sideAnchor(
    wall: OutsideAnchor['wall'],
    w: number,
    d: number,
    h: number
  ): OutsideAnchor {
    const cladding = 0.025;
    const head = this.outsideAnchors(w, d, h)
      .filter((door) => door.wall === wall)
      .reduce((max, door) => Math.max(max, door.head), 2.2);
    const span = wall === 'front' || wall === 'back' ? w : d;
    if (wall === 'front') {
      return { px: 0, pz: d / 2 - cladding / 2, rotY: 0, doorX: 0, width: span, head, wall };
    }
    if (wall === 'back') {
      return { px: 0, pz: -d / 2 + cladding / 2, rotY: Math.PI, doorX: 0, width: span, head, wall };
    }
    if (wall === 'left') {
      return { px: -w / 2 + cladding / 2, pz: 0, rotY: -Math.PI / 2, doorX: 0, width: span, head, wall };
    }
    return { px: w / 2 - cladding / 2, pz: 0, rotY: Math.PI / 2, doorX: 0, width: span, head, wall };
  }

  /** Full terraces use the wall centre; smaller terraces follow their door. */
  private terraceAnchor(terrace: HouseTerrace, w: number, d: number, h: number): OutsideAnchor {
    const { side } = terrace;
    if (terrace.span === 'full') return this.sideAnchor(side, w, d, h);
    const door = this.outsideAnchors(w, d, h).find((item) => item.wall === side);
    if (door) return door;
    return { ...this.sideAnchor(side, w, d, h), width: 1 };
  }

  private buildOutsideAdditions(w: number, d: number, h: number) {
    const canopyOn = Boolean(this.currentConfig.doorCanopy);
    const terraces = this.currentConfig.terraces ?? [];
    if (!canopyOn && !terraces.length) return;

    const found = this.outsideAnchors(w, d, h);
    const doors = found.length ? found : [this.fallbackDoor(d)];
    const timber = new THREE.MeshStandardMaterial({ color: '#e7d3b0', roughness: 0.62, metalness: 0.02 });
    const roofMat = this.roofSurfaceMaterial();
    const deckMat = new THREE.MeshStandardMaterial({ color: '#b7b2a8', roughness: 0.78, metalness: 0.02 });
    const deckAlt = new THREE.MeshStandardMaterial({ color: '#a39e94', roughness: 0.82, metalness: 0.02 });
    if (canopyOn) {
      for (const door of doors) {
        if (door.itemId === 'SKJUTDORR' || door.itemId === 'SKJUTDORR3') continue;
        const wallAnchor = this.sideAnchor(door.wall, w, d, h);
        const cosR = Math.cos(-wallAnchor.rotY);
        const sinR = Math.sin(-wallAnchor.rotY);
        const dx = door.px + (door.doorX ?? 0) - wallAnchor.px;
        const dz = door.pz - wallAnchor.pz;
        const doorAlong = dx * cosR - dz * sinR;
        const wallSpan = door.wall === 'front' || door.wall === 'back' ? w : d;
        const wallDoorsAlong = doors
          .filter((dItem) => dItem.wall === door.wall)
          .map((dItem) => {
            const dX = dItem.px + (dItem.doorX ?? 0) - wallAnchor.px;
            const dZ = dItem.pz - wallAnchor.pz;
            return dX * cosR - dZ * sinR;
          });

        if (
          isDoorCoveredByAddition({
            doorWall: door.wall,
            doorAlong,
            doorWidth: door.width,
            wallSpan,
            terraces,
            wallDoorsAlong
          })
        ) {
          continue;
        }

        this.addDoorCanopy(door, timber, roofMat);
      }
    }
    const fullSides = new Set(terraces.filter((item) => item.span === 'full').map((item) => item.side));

    for (const terrace of terraces) {
      let openLeft = true;
      let openRight = true;
      if (terrace.span === 'full') {
        if (terrace.side === 'front') {
          openLeft = !fullSides.has('left');
          openRight = !fullSides.has('right');
        } else if (terrace.side === 'back') {
          openLeft = !fullSides.has('right');
          openRight = !fullSides.has('left');
        } else if (terrace.side === 'left') {
          openLeft = !fullSides.has('back');
          openRight = !fullSides.has('front');
        } else if (terrace.side === 'right') {
          openLeft = !fullSides.has('front');
          openRight = !fullSides.has('back');
        }
      }
      this.addTerrace(
        this.terraceAnchor(terrace, w, d, h),
        deckMat,
        deckAlt,
        timber,
        roofMat,
        terrace,
        w,
        d,
        openLeft,
        openRight
      );
    }
    this.addTerraceCorners(terraces, deckMat, deckAlt, timber, w, d);
  }

  private frontOpenings(w: number, h: number, base: number) {
    return this.wallOpenings('front', w, this.currentConfig.depthMm / 1000, h, base);
  }

  /** Openings along a wall. `x` is the position along that wall: world X on the front and back, world Z on the sides. */
  private wallOpenings(
    wall: 'front' | 'back' | 'left' | 'right',
    w: number,
    d: number,
    h: number,
    base: number
  ) {
    const isFrontBack = wall === 'front' || wall === 'back';
    const count = this.panelCountForWall(wall, w, d);
    const endInset = 0.025 - 0.008;
    const length = isFrontBack ? w : d - endInset * 2;
    const panelW = length / count;
    const isPulpet = this.currentConfig.roofType === 'pulpettak';
    const isFlackt = this.currentConfig.roofType === 'flackt';
    const flacktDrop = isFlackt ? (d / 2) * Math.tan((2 * Math.PI) / 180) : 0;
    const frontH = isFlackt ? h + flacktDrop : h;
    const rearH = isPulpet
      ? Math.max(h - Math.tan(PULPET_PITCH_RAD) * d, 2.4)
      : (isFlackt ? h - flacktDrop : h);
    const yMid = (frontH + rearH) / 2;
    const openings: { x: number; winW: number; winH: number; winY: number; sill: number; head: number }[] = [];
    for (let p = 0; p < count; p++) {
      let center = 0;
      let panelWallH = frontH - base;
      if (wall === 'front') {
        center = -w / 2 + (p + 0.5) * panelW;
      } else if (wall === 'back') {
        center = w / 2 - (p + 0.5) * panelW;
        panelWallH = rearH - base;
      } else if (wall === 'left') {
        center = d / 2 - endInset - (p + 0.5) * panelW;
        panelWallH = this.sidePanelHeight(d, h, rearH, yMid, PULPET_PITCH_RAD, center, base);
      } else {
        center = -d / 2 + endInset + (p + 0.5) * panelW;
        panelWallH = this.sidePanelHeight(d, h, rearH, yMid, PULPET_PITCH_RAD, center, base);
      }
      const belt = this.beltRise(h);
      const lowerH = Math.min(belt, panelWallH);
      const split = Boolean(this.currentConfig.wallSlots[`${wall}-${p}u`]) && panelWallH > belt + 0.4 && !this.interiorCut();
      const bands = split
        ? [
            { id: `${wall}-${p}`, upper: false, panelH: lowerH, panelBase: base },
            { id: `${wall}-${p}u`, upper: true, panelH: panelWallH - lowerH, panelBase: base + lowerH }
          ]
        : [{ id: `${wall}-${p}`, upper: false, panelH: panelWallH, panelBase: base }];
      for (const band of bands) {
        const slot = this.currentConfig.wallSlots[band.id];
        if (!band.upper) {
          const rhythm = this.windowRhythmOpeningForPanel(wall, p, panelW, band.panelH, band.panelBase, count);
          if (rhythm) {
            const slope = this.alongWallSlope(wall);
            const fit = openingClearOfRoof(rhythm.opening, band.panelH, slope, {
              pinSill: false,
              minHeight: 0.28
            });
            const local = fit.x ?? 0;
            const x = wall === 'front' || wall === 'left' ? center + local : center - local;
            openings.push({
              x,
              winW: fit.winW,
              winH: fit.winH,
              winY: fit.winY,
              sill: fit.sill,
              head: fit.head
            });
            continue;
          }
          if (slot?.coveredBy && this.currentConfig.wallSlots[slot.coveredBy]?.windowRhythm) {
            continue;
          }
        }
        if (!slot || (slot.type !== 'door' && slot.type !== 'window')) continue;
        const wide = band.upper
          ? null
          : this.wideOpeningForPanel(wall, p, panelW, band.panelH, band.panelBase);
        if (wide) {
          if (wide.drawDoor) {
            const slope = this.alongWallSlope(wall);
            const fit = openingClearOfRoof(wide, band.panelH, slope, { pinSill: true, minHeight: 0.9 });
            const local = fit.x ?? 0;
            const x = wall === 'front' || wall === 'left' ? center + local : center - local;
            openings.push({ x, winW: fit.winW, winH: fit.winH, winY: fit.winY, sill: fit.sill, head: fit.head });
          }
          continue;
        }
        // Rhythm host alone would otherwise place a single centred pane — skip; rhythm branch above owns it.
        if (slot.windowRhythm && !band.upper) continue;
        const lower = this.currentConfig.wallSlots[`${wall}-${p}`];
        const aboveDoor = Boolean(
          band.upper
          && (slot.itemId === 'standard-single' || slot.itemId === OVERLIGHT)
          && lower?.type === 'door'
          && lower.itemId !== 'SKJUTDORR'
          && lower.itemId !== 'SKJUTDORR3'
        );
        const cornerSide = this.cornerSideForPanel(wall, p, count);
        const facadeTop = this.concreteFacade(wall)
          ? (this.currentConfig.concreteHeightMm ?? 2500) / 1000
          : null;
        const px = (wall === 'front' || wall === 'back') ? center : 0;
        const pz = (wall === 'left' || wall === 'right') ? center : 0;
        const facadeSpan = facadeTop == null ? null : this.concreteSpanLocal(wall, px, pz, panelW);
        const fitted = this.fittedOpening(slot.type, slot.itemId, band.upper, panelW, band.panelH, band.panelBase, aboveDoor, cornerSide, facadeSpan);
        const slope = band.upper || !split ? this.alongWallSlope(wall) : 0;
        const cleared = openingClearOfRoof(fitted, band.panelH, slope, {
          pinSill: slot.type === 'door',
          minHeight: slot.type === 'door' ? 0.9 : 0.28
        });
        const fit = this.resolveWindowOpening(cleared, slot, panelW, band.panelH, cornerSide, facadeSpan, band.upper, slope, false);
        const ox = fit.x ?? 0;
        const worldX = (wall === 'front' || wall === 'left') ? center + ox : center - ox;
        openings.push({
          winW: fit.winW,
          winH: fit.winH,
          winY: fit.winY,
          sill: fit.sill,
          head: fit.head,
          x: worldX
        });
      }
    }
    return openings;
  }

  private fillStudGaps(
    alongPos: number,
    fixed: number,
    base: number,
    wallTop: number,
    blocked: { sill: number; head: number }[],
    studThick: number,
    studDepth: number,
    mat: THREE.Material,
    along: 'x' | 'z' = 'x'
  ) {
    const place = (height: number, y: number) => {
      const stud = new THREE.Mesh(
        along === 'x'
          ? new THREE.BoxGeometry(studThick, height, studDepth)
          : new THREE.BoxGeometry(studDepth, height, studThick),
        mat
      );
      stud.position.set(along === 'x' ? alongPos : fixed, y, along === 'z' ? alongPos : fixed);
      stud.castShadow = true;
      stud.userData.framingStep = 4;
      stud.userData.framingNameSv = 'Kortregel / passregel';
      stud.userData.framingNameEn = 'Cripple Stud / Blocking';
      stud.userData.dimension = `${Math.round(studThick * 1000)}×${Math.round(studDepth * 1000)} mm C24`;
      this.framingGroup.add(stud);
    };
    const spans = [...blocked].sort((a, b) => a.sill - b.sill);
    let cursor = base + studThick;
    const top = wallTop - studThick;
    for (const span of spans) {
      const gap = Math.min(span.sill, top) - cursor;
      if (gap > 0.05) place(gap, cursor + gap / 2);
      cursor = Math.max(cursor, span.head);
    }
    const tail = top - cursor;
    if (tail > 0.05) place(tail, cursor + tail / 2);
  }

  private addOpeningCasing(
    parent: THREE.Group,
    opening: { winW: number; winH: number; winY: number; x?: number; casingSide?: number },
    kind: 'door' | 'window',
    material: THREE.Material,
    cornerSide?: 'left' | 'right' | null,
    panelWidth?: number,
    facadeSpan?: { from: number; to: number } | null
  ) {
    const { winW, winH, winY } = opening;
    const shift = opening.x ?? 0;
    const customSide = opening.casingSide;
    const side = customSide ?? (kind === 'door' ? 0.1 : 0.09);
    const headH = kind === 'door' ? 0.1 : 0.085;
    const sillH = kind === 'door' ? 0 : 0.065;
    const sillEar = customSide ? 0.01 : 0.02;
    const depth = 0.038;
    const z = 0.032;
    const sideTop = winY + winH / 2;
    const sideBottom = winY - winH / 2 - sillH;
    const sideH = sideTop - sideBottom;
    const sideY = (sideTop + sideBottom) / 2;
    const boards: { x: number; y: number; w: number; h: number; d: number; z: number }[] = [
      { x: shift - (winW / 2 + side / 2), y: sideY, w: side, h: sideH, d: depth, z },
      { x: shift + winW / 2 + side / 2, y: sideY, w: side, h: sideH, d: depth, z },
      { x: shift, y: winY + winH / 2 + headH / 2, w: winW + side * 2, h: headH, d: depth, z }
    ];
    if (kind === 'window') {
      boards.push({
        x: shift,
        y: winY - winH / 2 - sillH / 2,
        w: winW + side * 2 + sillEar * 2,
        h: sillH,
        d: depth + 0.01,
        z: z + 0.004
      });
    }

    const pw = panelWidth ?? (winW + side * 2 + 0.1);
    const cornerClearance = 0.165;
    let minX = cornerSide === 'left' ? -pw / 2 + cornerClearance : -pw / 2 + 0.02;
    let maxX = cornerSide === 'right' ? pw / 2 - cornerClearance : pw / 2 - 0.02;

    if (facadeSpan) {
      const half = pw / 2;
      if (facadeSpan.from > -half + 0.08) {
        maxX = Math.min(maxX, facadeSpan.from - 0.01);
      } else if (facadeSpan.to < half - 0.08) {
        minX = Math.max(minX, facadeSpan.to + 0.01);
      }
    }

    for (const board of boards) {
      let bLeft = board.x - board.w / 2;
      let bRight = board.x + board.w / 2;
      if (bLeft < minX) bLeft = minX;
      if (bRight > maxX) bRight = maxX;
      const w = Math.max(0.02, bRight - bLeft);
      const x = (bLeft + bRight) / 2;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, board.h, board.d), material);
      mesh.position.set(x, board.y, board.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { ...parent.userData, panelGroup: parent };
      parent.add(mesh);
      this.interactivePanels.push(mesh);
    }
  }

  private cornerTrimSize() {
    return { face: 0.145, thick: 0.042 };
  }

  /** Vertical wood boards covering each outside corner. The belt stops against them. */
  private addCornerBoards(
    w: number,
    d: number,
    frontH: number,
    rearH: number,
    baseElev: number,
    material: THREE.Material,
    westH?: number,
    eastH?: number
  ) {
    const { face, thick } = this.cornerTrimSize();
    const sideFace = Math.max(0.05, face - thick);
    const west = westH ?? null;
    const east = eastH ?? null;
    const corners = [
      { x: -1, z: 1, top: west ?? frontH },
      { x: 1, z: 1, top: east ?? frontH },
      { x: -1, z: -1, top: west ?? rearH },
      { x: 1, z: -1, top: east ?? rearH }
    ];
    for (const corner of corners) {
      const { top, x, z } = corner;
      const foot = baseElev;
      const height = top - foot;
      if (height < 0.05) continue;
      const y = foot + height / 2;
      const alongFront = new THREE.Mesh(new THREE.BoxGeometry(face, height, thick), material);
      alongFront.position.set(x * (w / 2 + thick - face / 2), y, z * (d / 2 + thick / 2));
      const alongSide = new THREE.Mesh(new THREE.BoxGeometry(thick, height, sideFace), material);
      alongSide.position.set(x * (w / 2 + thick / 2), y, z * (d / 2 - sideFace / 2));
      for (const board of [alongFront, alongSide]) {
        this.writeSingleBoardUvs(board.geometry, y);
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
    opening: { winW: number; winH: number; winY: number; x?: number } | null,
    facadeTop: number | null = null
  ) {
    const halfW = panelWidth / 2;
    const halfH = panelHeight / 2;
    const cut = facadeTop == null ? -halfH : facadeTop - parent.position.y;
    const bottomY = Math.max(-halfH, cut);
    if (halfH - bottomY < 0.01) return null;
    const topAt = (x: number) => halfH + x * slope;
    const shape = new THREE.Shape();
    shape.moveTo(-halfW, bottomY);
    shape.lineTo(halfW, bottomY);
    shape.lineTo(halfW, topAt(halfW));
    shape.lineTo(-halfW, topAt(-halfW));
    shape.closePath();
    if (opening) {
      const cx = opening.x ?? 0;
      const left = Math.max(-halfW, cx - opening.winW / 2);
      const right = Math.min(halfW, cx + opening.winW / 2);
      if (right - left > 0.02) {
        const hole = new THREE.Path();
        const bottom = Math.max(bottomY, opening.winY - opening.winH / 2);
        const top = opening.winY + opening.winH / 2;
        if (top - bottom > 0.02) {
          hole.moveTo(left, bottom);
          hole.lineTo(left, top);
          hole.lineTo(right, top);
          hole.lineTo(right, bottom);
          hole.closePath();
          shape.holes.push(hole);
        }
      }
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
    userData: Record<string, unknown>,
    facadeTop: number | null = null,
    facadeSpan: { from: number; to: number } | null = null
  ) {
    const halfW = panelWidth / 2;
    const halfH = panelHeight / 2;
    const cut = facadeTop == null || facadeSpan == null ? -halfH : facadeTop - parent.position.y;
    const pieces = this.facadeCladdingPieces(halfW, halfH, cut, facadeSpan);
    let first: THREE.Mesh | null = null;
    if (pieces.length === 0) {
      const hitGeo = new THREE.PlaneGeometry(panelWidth, panelHeight);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.set(0, 0, claddingThick / 2);
      hitMesh.userData = userData;
      parent.add(hitMesh);
      this.interactivePanels.push(hitMesh);
      return hitMesh;
    }
    for (const piece of pieces) {
      const panelGeo = new THREE.BoxGeometry(piece.w, piece.h, claddingThick);
      this.writeMetreUvs(panelGeo, parent.position.y + piece.y);
      const panelMesh = new THREE.Mesh(panelGeo, material);
      panelMesh.position.set(piece.x, piece.y, 0);
      panelMesh.castShadow = true;
      panelMesh.receiveShadow = true;
      panelMesh.userData = userData;
      parent.add(panelMesh);
      this.interactivePanels.push(panelMesh);
      first ??= panelMesh;
    }
    return first;
  }

  /** Cladding rectangles. On the concrete span, boards start at the concrete top. */
  private facadeCladdingPieces(
    halfW: number,
    halfH: number,
    cut: number,
    span: { from: number; to: number } | null
  ) {
    const along = span
      ? [
          { from: -halfW, to: span.from, clip: false },
          { from: span.from, to: span.to, clip: true },
          { from: span.to, to: halfW, clip: false }
        ]
      : [{ from: -halfW, to: halfW, clip: cut > -halfH }];
    const pieces: { x: number; y: number; w: number; h: number }[] = [];
    for (const part of along) {
      if (part.to - part.from < 0.01) continue;
      const bottom = part.clip ? Math.max(-halfH, cut) : -halfH;
      if (halfH - bottom < 0.01) continue;
      pieces.push({
        x: (part.from + part.to) / 2,
        y: (halfH + bottom) / 2,
        w: part.to - part.from,
        h: halfH - bottom
      });
    }
    return pieces;
  }

  private addCladdingAroundOpening(
    parent: THREE.Group,
    panelWidth: number,
    panelHeight: number,
    claddingThick: number,
    material: THREE.Material,
    opening: { winW: number; winH: number; winY: number; x?: number },
    userData: Record<string, unknown>,
    facadeTop: number | null = null,
    facadeSpan: { from: number; to: number } | null = null
  ) {
    const { winW, winH, winY } = opening;
    const half = panelWidth / 2;
    const halfH = panelHeight / 2;
    const cx = opening.x ?? 0;
    const left = Math.max(-half, cx - winW / 2);
    const right = Math.min(half, cx + winW / 2);
    const boards: { x: number; y: number; w: number; h: number }[] = [];
    const leftW = left + half;
    if (leftW > 0.01) boards.push({ x: -half + leftW / 2, y: 0, w: leftW, h: panelHeight });
    const rightW = half - right;
    if (rightW > 0.01) boards.push({ x: right + rightW / 2, y: 0, w: rightW, h: panelHeight });
    const span = right - left;
    const bottom = winY - winH / 2;
    const top = winY + winH / 2;
    if (span > 0.01) {
      const bottomH = bottom + halfH;
      if (bottomH > 0.01) {
        boards.push({ x: (left + right) / 2, y: -halfH + bottomH / 2, w: span, h: bottomH });
      }
      const topH = halfH - top;
      if (topH > 0.01) {
        boards.push({ x: (left + right) / 2, y: top + topH / 2, w: span, h: topH });
      }
    }

    const cut = facadeTop == null || facadeSpan == null ? null : facadeTop - parent.position.y;
    const visible = cut == null || facadeSpan == null ? boards : boards.flatMap((board) => {
      const top = board.y + board.h / 2;
      const boardLeft = board.x - board.w / 2;
      const boardRight = board.x + board.w / 2;
      const span = facadeSpan ?? { from: boardLeft, to: boardRight };
      const slices = [
        { from: boardLeft, to: Math.min(boardRight, span.from), clip: false },
        { from: Math.max(boardLeft, span.from), to: Math.min(boardRight, span.to), clip: true },
        { from: Math.max(boardLeft, span.to), to: boardRight, clip: false }
      ];
      return slices.flatMap((slice) => {
        if (slice.to - slice.from < 0.01) return [];
        const kept = slice.clip ? Math.max(board.y - board.h / 2, cut) : board.y - board.h / 2;
        if (top - kept < 0.01) return [];
        return [{ x: (slice.from + slice.to) / 2, y: (top + kept) / 2, w: slice.to - slice.from, h: top - kept }];
      });
    });

    let first: THREE.Mesh | null = null;
    if (visible.length === 0) {
      const hitGeo = new THREE.PlaneGeometry(panelWidth, panelHeight);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.set(0, 0, claddingThick / 2);
      hitMesh.userData = userData;
      parent.add(hitMesh);
      this.interactivePanels.push(hitMesh);
      return hitMesh;
    }
    for (const board of visible) {
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

  private buildDrywallBand(
    band: { slotId: string; height: number; base: number; upper: boolean; reachesRoof: boolean },
    px: number,
    pz: number,
    rotY: number,
    panelWidth: number,
    slope: number,
    opening: { winW: number; winH: number; winY: number; x?: number } | null,
    isDoor: boolean,
    isGate = false
  ) {
    const drywallGroup = new THREE.Group();
    drywallGroup.position.set(px, band.base + band.height / 2, pz);
    drywallGroup.rotation.y = rotY;

    const claddingThick = 0.025;
    const studDepth = 0.145;
    const drywallThick = 0.013;
    // Finished drywall face sits on the inside face of the 145mm timber studs
    const dz = -(claddingThick / 2 + studDepth + drywallThick / 2);

    const gateOpening = isGate
      ? { winW: panelWidth * 0.9, winH: band.height * 0.85, winY: -band.height / 2 + (band.height * 0.85) / 2 }
      : null;
    const effectiveOpening = opening ?? gateOpening;
    const effectiveDoor = isDoor || isGate;

    const sloped = band.reachesRoof && Math.abs(slope) > 0.0001;
    if (sloped) {
      this.addSlopedDrywall(drywallGroup, panelWidth, band.height, slope, drywallThick, dz, this.drywallMat, effectiveOpening, effectiveDoor);
    } else if (effectiveOpening) {
      this.addDrywallAroundOpening(drywallGroup, panelWidth, band.height, drywallThick, dz, this.drywallMat, effectiveOpening, effectiveDoor);
    } else {
      this.addSolidDrywall(drywallGroup, panelWidth, band.height, drywallThick, dz, this.drywallMat);
    }

    this.innerWallsGroup.add(drywallGroup);
  }

  private addSolidDrywall(
    parent: THREE.Group,
    panelWidth: number,
    panelHeight: number,
    drywallThick: number,
    dz: number,
    material: THREE.Material
  ) {
    const geo = new THREE.BoxGeometry(panelWidth, panelHeight, drywallThick);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(0, 0, dz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  private addDrywallAroundOpening(
    parent: THREE.Group,
    panelWidth: number,
    panelHeight: number,
    drywallThick: number,
    dz: number,
    material: THREE.Material,
    opening: { winW: number; winH: number; winY: number; x?: number },
    isDoor: boolean
  ) {
    const { winW, winH, winY } = opening;
    const half = panelWidth / 2;
    const halfH = panelHeight / 2;
    const cx = opening.x ?? 0;
    const left = Math.max(-half, cx - winW / 2);
    const right = Math.min(half, cx + winW / 2);
    const boards: { x: number; y: number; w: number; h: number }[] = [];

    const leftW = left + half;
    if (leftW > 0.005) {
      boards.push({ x: -half + leftW / 2, y: 0, w: leftW, h: panelHeight });
    }
    const rightW = half - right;
    if (rightW > 0.005) {
      boards.push({ x: right + rightW / 2, y: 0, w: rightW, h: panelHeight });
    }
    const span = right - left;
    const bottom = winY - winH / 2;
    const top = winY + winH / 2;
    if (span > 0.005) {
      const bottomH = bottom + halfH;
      if (bottomH > 0.005) {
        boards.push({ x: (left + right) / 2, y: -halfH + bottomH / 2, w: span, h: bottomH });
      }
      const topH = halfH - top;
      if (topH > 0.005) {
        boards.push({ x: (left + right) / 2, y: top + topH / 2, w: span, h: topH });
      }
    }

    for (const board of boards) {
      const piece = new THREE.BoxGeometry(board.w, board.h, drywallThick);
      const mesh = new THREE.Mesh(piece, material);
      mesh.position.set(board.x, board.y, dz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
    }

    if (span > 0.005) {
      this.addOpeningReveals(parent, opening, left, right, half, dz, drywallThick, material, isDoor);
    }
  }

  private addOpeningReveals(
    parent: THREE.Group,
    opening: { winW: number; winH: number; winY: number; x?: number },
    left: number,
    right: number,
    half: number,
    dz: number,
    drywallThick: number,
    material: THREE.Material,
    isDoor: boolean
  ) {
    const { winH, winY } = opening;
    const cx = opening.x ?? 0;
    const boardThick = 0.012;
    const revealDepth = Math.abs(dz) + drywallThick / 2;
    const revealZ = dz / 2;
    const span = right - left;

    if (Math.abs(left - (cx - opening.winW / 2)) < 0.01 && left >= -half - 0.005) {
      const leftGeo = new THREE.BoxGeometry(boardThick, winH, revealDepth);
      const leftMesh = new THREE.Mesh(leftGeo, material);
      leftMesh.position.set(left + boardThick / 2, winY, revealZ);
      leftMesh.castShadow = true;
      leftMesh.receiveShadow = true;
      parent.add(leftMesh);
    }

    if (Math.abs(right - (cx + opening.winW / 2)) < 0.01 && right <= half + 0.005) {
      const rightGeo = new THREE.BoxGeometry(boardThick, winH, revealDepth);
      const rightMesh = new THREE.Mesh(rightGeo, material);
      rightMesh.position.set(right - boardThick / 2, winY, revealZ);
      rightMesh.castShadow = true;
      rightMesh.receiveShadow = true;
      parent.add(rightMesh);
    }

    const topGeo = new THREE.BoxGeometry(span, boardThick, revealDepth);
    const topMesh = new THREE.Mesh(topGeo, material);
    topMesh.position.set((left + right) / 2, winY + winH / 2 - boardThick / 2, revealZ);
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    parent.add(topMesh);

    if (!isDoor) {
      const botMesh = new THREE.Mesh(topGeo, material);
      botMesh.position.set((left + right) / 2, winY - winH / 2 + boardThick / 2, revealZ);
      botMesh.castShadow = true;
      botMesh.receiveShadow = true;
      parent.add(botMesh);
    }
  }

  private addSlopedDrywall(
    parent: THREE.Group,
    panelWidth: number,
    panelHeight: number,
    slope: number,
    drywallThick: number,
    dz: number,
    material: THREE.Material,
    opening: { winW: number; winH: number; winY: number; x?: number } | null,
    isDoor: boolean
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

    let left = -halfW;
    let right = halfW;
    if (opening) {
      const cx = opening.x ?? 0;
      left = Math.max(-halfW, cx - opening.winW / 2);
      right = Math.min(halfW, cx + opening.winW / 2);
      if (right - left > 0.02) {
        const hole = new THREE.Path();
        const bottom = opening.winY - opening.winH / 2;
        const top = opening.winY + opening.winH / 2;
        hole.moveTo(left, bottom);
        hole.lineTo(left, top);
        hole.lineTo(right, top);
        hole.lineTo(right, bottom);
        hole.closePath();
        shape.holes.push(hole);
      }
    }

    const geo = new THREE.ExtrudeGeometry(shape, { depth: drywallThick, bevelEnabled: false });
    geo.translate(0, 0, dz - drywallThick / 2);
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);

    if (opening && right - left > 0.02) {
      this.addOpeningReveals(parent, opening, left, right, halfW, dz, drywallThick, material, isDoor);
    }
    return mesh;
  }

  private buildDrywallCeiling(w: number, d: number, h: number): THREE.Group {
    const isPulpettak = this.currentConfig.roofType === 'pulpettak';
    const isFlackt = this.currentConfig.roofType === 'flackt';
    const drywallThick = 0.013;
    // Clear interior width with slight lap into the side wall stud cavity so there are no seams
    const ceilingW = w - 0.34;

    const ceilingGroup = new THREE.Group();

    if (isPulpettak && this.roofFallsAlongWidth()) {
      const angleRad = this.pulpetPitchRad();
      const lowH = Math.max(h - Math.tan(angleRad) * w, 2.4);
      const slopeAngle = Math.atan2(h - lowH, w);
      const depth = 0.1;
      const midY = (h + lowH) / 2 - depth / 2 - 0.016;
      const ceilingSlopeLen = (w - 0.34) / Math.cos(slopeAngle);
      const ceilingD = d - 0.34;

      const slopeGroup = new THREE.Group();
      slopeGroup.position.set(0, midY, 0);
      slopeGroup.rotation.z = slopeAngle;

      const ceilingMesh = new THREE.Mesh(
        new THREE.BoxGeometry(ceilingSlopeLen, drywallThick, ceilingD),
        this.drywallMat
      );
      ceilingMesh.position.set(0, -(depth / 2 + drywallThick / 2 + 0.002), 0);
      ceilingMesh.castShadow = true;
      ceilingMesh.receiveShadow = true;
      slopeGroup.add(ceilingMesh);
      ceilingGroup.add(slopeGroup);
    } else if (isPulpettak) {
      const angleRad = this.pulpetPitchRad();
      const rearH = Math.max(h - Math.tan(angleRad) * d, 2.4);
      const slopeAngle = Math.atan2(h - rearH, d);
      const depth = 0.1; // Matches rafter depth in buildRafters
      const midY = (h + rearH) / 2 - depth / 2 - 0.016;
      const ceilingSlopeLen = (d - 0.34) / Math.cos(slopeAngle);

      const slopeGroup = new THREE.Group();
      slopeGroup.position.set(0, midY, 0);
      slopeGroup.rotation.x = -slopeAngle;

      const ceilingMesh = new THREE.Mesh(
        new THREE.BoxGeometry(ceilingW, drywallThick, ceilingSlopeLen),
        this.drywallMat
      );
      ceilingMesh.position.set(0, -(depth / 2 + drywallThick / 2 + 0.002), 0);
      ceilingMesh.castShadow = true;
      ceilingMesh.receiveShadow = true;
      slopeGroup.add(ceilingMesh);
      ceilingGroup.add(slopeGroup);
    } else if (isFlackt) {
      const shallowAngle = (2 * Math.PI) / 180;
      const depth = 0.12; // Matches rafter depth in buildRafters
      const ceilingSlopeLen = (d - 0.34) / Math.cos(shallowAngle);

      const slopeGroup = new THREE.Group();
      slopeGroup.position.set(0, h - 0.12, 0);
      slopeGroup.rotation.x = -shallowAngle;

      const ceilingMesh = new THREE.Mesh(
        new THREE.BoxGeometry(ceilingW, drywallThick, ceilingSlopeLen),
        this.drywallMat
      );
      ceilingMesh.position.set(0, -(depth / 2 + drywallThick / 2 + 0.002), 0);
      ceilingMesh.castShadow = true;
      ceilingMesh.receiveShadow = true;
      slopeGroup.add(ceilingMesh);
      ceilingGroup.add(slopeGroup);
    } else {
      // Gable roofs (sadeltak, sadeltak14)
      const gableAngle = this.gablePitchRad();
      const rise = Math.tan(gableAngle) * (d / 2);
      const rafterH = 0.195;
      const y = h + rise / 2 - rafterH / 2 - 0.02;

      const slopeLen = (d / 2 - 0.17) / Math.cos(gableAngle);
      const centerZ = 0.085 / Math.cos(gableAngle);

      // Front slope ceiling (starts at ridge z = 0, reaches front wall)
      const frontSlope = new THREE.Group();
      frontSlope.position.set(0, y, d / 4);
      frontSlope.rotation.x = gableAngle;
      const frontMesh = new THREE.Mesh(
        new THREE.BoxGeometry(ceilingW, drywallThick, slopeLen),
        this.drywallMat
      );
      frontMesh.position.set(0, -(rafterH / 2 + drywallThick / 2 + 0.002), -centerZ);
      frontMesh.castShadow = true;
      frontMesh.receiveShadow = true;
      frontSlope.add(frontMesh);
      ceilingGroup.add(frontSlope);

      // Rear slope ceiling (starts at rear wall, reaches ridge z = 0)
      const rearSlope = new THREE.Group();
      rearSlope.position.set(0, y, -d / 4);
      rearSlope.rotation.x = -gableAngle;
      const rearMesh = new THREE.Mesh(
        new THREE.BoxGeometry(ceilingW, drywallThick, slopeLen),
        this.drywallMat
      );
      rearMesh.position.set(0, -(rafterH / 2 + drywallThick / 2 + 0.002), centerZ);
      rearMesh.castShadow = true;
      rearMesh.receiveShadow = true;
      rearSlope.add(rearMesh);
      ceilingGroup.add(rearSlope);

      // Interior triangular gable wall drywall on left and right walls above wall height h
      const halfD = d / 2 - 0.17;
      const peakH = rise * (halfD / (d / 2)) - 0.02;
      const gableShape = new THREE.Shape();
      gableShape.moveTo(-halfD, -0.02);
      gableShape.lineTo(0, peakH);
      gableShape.lineTo(halfD, -0.02);
      gableShape.closePath();
      const gableGeo = new THREE.ExtrudeGeometry(gableShape, {
        depth: drywallThick,
        bevelEnabled: false
      });
      gableGeo.translate(0, 0, -drywallThick / 2);

      for (const sign of [-1, 1] as const) {
        const gableDrywall = new THREE.Mesh(gableGeo, this.drywallMat);
        gableDrywall.rotation.y = sign > 0 ? -Math.PI / 2 : Math.PI / 2;
        gableDrywall.position.set(sign * (w / 2 - 0.1765), h, 0);
        gableDrywall.castShadow = true;
        gableDrywall.receiveShadow = true;
        ceilingGroup.add(gableDrywall);
      }
    }

    return ceilingGroup;
  }

  private addWindowFeature(
    parent: THREE.Group,
    opening: { winW: number; winH: number; winY: number; x?: number },
    windowId: string | undefined,
    userData: Record<string, unknown>
  ) {
    const { winW, winH, winY } = opening;
    const ox = opening.x ?? 0;
    const frameT = 0.032;
    const frameD = 0.026;
    const frameMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.35 });
    const members: { x: number; y: number; w: number; h: number }[] = [
      { x: ox - (winW / 2 - frameT / 2), y: winY, w: frameT, h: winH },
      { x: ox + winW / 2 - frameT / 2, y: winY, w: frameT, h: winH },
      { x: ox, y: winY + winH / 2 - frameT / 2, w: winW - frameT * 2, h: frameT },
      { x: ox, y: winY - winH / 2 + frameT / 2, w: winW - frameT * 2, h: frameT }
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
        color: frosted ? '#f1f5f9' : '#c5d4e2',
        transparent: true,
        opacity: frosted ? 0.55 : 0.16,
        roughness: frosted ? 0.55 : 0.08,
        metalness: 0.06,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    glass.position.set(ox, winY, 0.012);
    glass.renderOrder = 2;
    parent.add(glass);
    this.markSelectable(glass, userData);

    if (windowId === PORTRAIT_PANORAMA && glassW > 0.7) {
      const mullionMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.35 });
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.028, glassH, 0.03), mullionMat);
      mullion.position.set(ox, winY, 0.02);
      parent.add(mullion);
      this.markSelectable(mullion, userData);
    }

    if (windowId === 'sprojat') {
      const mullionMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.35 });
      if (glassW >= 0.35) {
        const vertMullion = new THREE.Mesh(new THREE.BoxGeometry(0.028, glassH, 0.03), mullionMat);
        vertMullion.position.set(ox, winY, 0.02);
        parent.add(vertMullion);
        this.markSelectable(vertMullion, userData);
      }
      const horizMullion = new THREE.Mesh(new THREE.BoxGeometry(glassW, 0.028, 0.03), mullionMat);
      horizMullion.position.set(ox, winY, 0.02);
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
    opening: { winW: number; winH: number; winY: number; x?: number },
    doorId: string | undefined,
    userData: Record<string, unknown>
  ) {
    const doorW = opening.winW - 0.02;
    const doorH = opening.winH - 0.012;
    const doorY = opening.winY - 0.004;

    if (doorId === 'SKJUTDORR' || doorId === 'SKJUTDORR3') {
      const holder = new THREE.Group();
      holder.position.x = opening.x ?? 0;
      parent.add(holder);
      this.addSlidingDoor(holder, doorW, doorH, doorY, userData, doorId === 'SKJUTDORR3' ? 3 : 2);
      return;
    }

    if (doorId === 'BASTUDORR') {
      const ox = opening.x ?? 0;
      const leafZ = 0.02;
      const leafD = 0.045;
      const frameThick = 0.055;
      const glassW = Math.max(0.2, doorW - frameThick * 2);
      const glassH = Math.max(0.4, doorH - frameThick * 2);
      const woodMat = new THREE.MeshStandardMaterial({
        color: '#c99b6d',
        roughness: 0.65,
        metalness: 0.02
      });

      const frameParts: { x: number; y: number; w: number; h: number }[] = [
        { x: ox, y: doorY + doorH / 2 - frameThick / 2, w: doorW, h: frameThick },
        { x: ox, y: doorY - doorH / 2 + frameThick / 2, w: doorW, h: frameThick },
        { x: ox - doorW / 2 + frameThick / 2, y: doorY, w: frameThick, h: doorH - frameThick * 2 },
        { x: ox + doorW / 2 - frameThick / 2, y: doorY, w: frameThick, h: doorH - frameThick * 2 }
      ];

      for (const part of frameParts) {
        if (part.w <= 0.01 || part.h <= 0.01) continue;
        const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(part.w, part.h, leafD), woodMat);
        frameMesh.position.set(part.x, part.y, leafZ);
        frameMesh.castShadow = true;
        parent.add(frameMesh);
        this.markSelectable(frameMesh, userData);
      }

      const glassMat = new THREE.MeshStandardMaterial({
        color: '#c9b08a',
        transparent: true,
        opacity: 0.18,
        roughness: 0.08,
        metalness: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(glassW, glassH), glassMat);
      glass.position.set(ox, doorY, leafZ + leafD / 2 + 0.004);
      glass.renderOrder = 2;
      parent.add(glass);
      this.markSelectable(glass, userData);

      const handleH = Math.min(0.46, doorH * 0.24);
      const handleGeo = new THREE.CylinderGeometry(0.014, 0.014, handleH, 12);
      const handleMat = new THREE.MeshStandardMaterial({ color: '#af7e4f', roughness: 0.55, metalness: 0.02 });
      const handle = new THREE.Mesh(handleGeo, handleMat);
      handle.position.set(ox + doorW / 2 - 0.10, doorY, leafZ + leafD / 2 + 0.032);
      parent.add(handle);
      this.markSelectable(handle, userData);

      for (const dy of [-handleH * 0.36, handleH * 0.36]) {
        const standGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.026, 8);
        const stand = new THREE.Mesh(standGeo, handleMat);
        stand.rotation.x = Math.PI / 2;
        stand.position.set(ox + doorW / 2 - 0.10, doorY + dy, leafZ + leafD / 2 + 0.016);
        parent.add(stand);
        this.markSelectable(stand, userData);
      }
      return;
    }

    // Door leaf, with a real opening behind the glass so the room shows through.
    const leafZ = 0.02;
    const leafD = 0.045;
    const liteW = doorId === 'SVANSHALL' ? doorW * 0.72 : Math.min(0.16, doorW * 0.22);
    const liteH = doorId === 'SVANSHALL' ? doorH * 0.72 : Math.min(0.9, doorH * 0.46);
    const liteY = doorY + doorH * 0.08;
    const leafMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.35 });
    const ox = opening.x ?? 0;
    const leafParts: { x: number; y: number; w: number; h: number }[] = [
      { x: ox, y: (liteY + liteH / 2 + doorY + doorH / 2) / 2, w: doorW, h: doorY + doorH / 2 - (liteY + liteH / 2) },
      { x: ox, y: (doorY - doorH / 2 + liteY - liteH / 2) / 2, w: doorW, h: liteY - liteH / 2 - (doorY - doorH / 2) },
      { x: ox - (doorW + liteW) / 4, y: liteY, w: (doorW - liteW) / 2, h: liteH },
      { x: ox + (doorW + liteW) / 4, y: liteY, w: (doorW - liteW) / 2, h: liteH }
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
    glass.position.set(ox, liteY, leafZ + leafD / 2 + 0.004);
    glass.renderOrder = 2;
    parent.add(glass);
    this.markSelectable(glass, userData);

    // Handle
    const handleGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.12);
    const handleMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.8, roughness: 0.2 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(ox + doorW / 2 - 0.12, doorY, leafZ + leafD / 2 + 0.02);
    parent.add(handle);
    this.markSelectable(handle, userData);
  }

  /** Fully glazed aluminium slider. Two panes, or three with the centre sash in front. */
  private addSlidingDoor(
    parent: THREE.Group,
    doorW: number,
    doorH: number,
    doorY: number,
    userData: Record<string, unknown>,
    panes: 2 | 3
  ) {
    const aluminium = new THREE.MeshStandardMaterial({ color: '#b7bcc3', metalness: 0.74, roughness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: '#b8cce0',
      transparent: true,
      opacity: 0.14,
      roughness: 0.04,
      metalness: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const place = (w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      parent.add(mesh);
      this.markSelectable(mesh, userData);
    };

    const jamb = 0.04;
    const frameD = 0.05;
    const frameZ = 0.034;
    place(jamb, doorH, frameD, -doorW / 2 + jamb / 2, doorY, frameZ, aluminium);
    place(jamb, doorH, frameD, doorW / 2 - jamb / 2, doorY, frameZ, aluminium);
    place(doorW, jamb, frameD, 0, doorY + doorH / 2 - jamb / 2, frameZ, aluminium);
    place(doorW, 0.03, frameD, 0, doorY - doorH / 2 + 0.015, frameZ, aluminium);

    const innerW = doorW - jamb * 2;
    const sill = 0.03;
    const innerH = doorH - jamb - sill;
    const innerY = doorY + (sill - jamb) / 2;
    const leafW = innerW / 2 + 0.046;
    const stile = 0.034;
    const rail = 0.042;
    const sashD = 0.02;

    const addSash = (centerX: number, z: number, width: number) => {
      const top = innerY + innerH / 2;
      const bottom = innerY - innerH / 2;
      place(stile, innerH, sashD, centerX - width / 2 + stile / 2, innerY, z, aluminium);
      place(stile, innerH, sashD, centerX + width / 2 - stile / 2, innerY, z, aluminium);
      place(width, rail, sashD, centerX, top - rail / 2, z, aluminium);
      place(width, rail, sashD, centerX, bottom + rail / 2, z, aluminium);
      const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(Math.max(0.12, width - stile * 2), Math.max(0.2, innerH - rail * 2)),
        glassMat
      );
      glass.position.set(centerX, innerY, z);
      glass.renderOrder = 2;
      parent.add(glass);
      this.markSelectable(glass, userData);
    };

    const pullMat = new THREE.MeshStandardMaterial({ color: '#3a4148', metalness: 0.72, roughness: 0.24 });
    const pull = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.32, 0.02), pullMat);
    if (panes === 3) {
      const overlap = 0.04;
      const wideLeaf = (innerW + overlap * 2) / 3;
      const step = wideLeaf - overlap;
      const left = -innerW / 2 + wideLeaf / 2;
      const centre = left + step;
      addSash(left, frameZ - 0.012, wideLeaf);
      addSash(centre, frameZ + 0.016, wideLeaf);
      addSash(centre + step, frameZ - 0.012, wideLeaf);
      pull.position.set(centre, doorY - 0.08, frameZ + 0.016 + sashD / 2 + 0.012);
    } else {
      addSash(-innerW / 4, frameZ - 0.012, leafW);
      addSash(innerW / 4, frameZ + 0.016, leafW);
      const meetingX = innerW / 4 - leafW / 2 + stile + 0.01;
      pull.position.set(meetingX, doorY - 0.08, frameZ + 0.016 + sashD / 2 + 0.012);
    }
    parent.add(pull);
    this.markSelectable(pull, userData);
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
    const edges = this.roofEdgeOverhangs(w, d);
    const overhang = Math.max(edges.front, edges.back, edges.left, edges.right);
    const roofMat = this.roofSurfaceMaterial();

    const whiteTrimMat = new THREE.MeshStandardMaterial({
      color: '#f4f1ea',
      roughness: 0.55
    });

    if (isGableRoof(roofType)) {
      this.addGableRoof(w, d, h, overhang, roofMat, whiteTrimMat);
    } else if (roofType === 'flackt') {
      const frameMat = this.currentConfig.flushRoof
        ? new THREE.MeshStandardMaterial({ color: '#d5d8dc', roughness: 0.32, metalness: 0.72 })
        : whiteTrimMat;
      this.addShallowRoof(w, d, h, overhang, 2, roofMat, frameMat);
    } else if (this.roofFallsAlongWidth()) {
      // Stugan V4: 10° fall east→west. High right (+X), low left (−X), long south overhang.
      const angleRad = this.pulpetPitchRad();
      const tan = Math.tan(angleRad);
      const lowH = Math.max(h - tan * w, 1.8);
      const yMid = (h + lowH) / 2;
      const roofThick = 0.1;
      const slopeLen = (w + edges.left + edges.right) / Math.cos(angleRad);
      const roofDepth = d + edges.front + edges.back;
      const roofCenterY = yMid + (roofThick / 2) / Math.cos(angleRad);
      const zShift = (edges.front - edges.back) / 2;

      const assembly = new THREE.Group();
      assembly.position.set(0, roofCenterY, zShift);
      // Positive Z rotation lifts +X (east) and drops toward −X (west).
      assembly.rotation.z = angleRad;

      const roofMesh = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, roofThick, roofDepth), roofMat);
      roofMesh.castShadow = true;
      roofMesh.receiveShadow = true;
      assembly.add(roofMesh);

      const fasciaT = 0.022;
      const eavesDrop = 0.08;
      const fasciaBottom = -roofThick / 2 - eavesDrop;
      const fasciaTop = roofThick / 2 + 0.008;
      const fasciaH = fasciaTop - fasciaBottom;
      const fasciaY = (fasciaBottom + fasciaTop) / 2;
      const bargeT = 0.032;
      // Flush side eaves: keep end fascias under the roof sheet so they meet the corner boards cleanly.
      const sideFlush = edges.left < 0.05 && edges.right < 0.05;
      const endFasciaOut = sideFlush ? -fasciaT / 2 : fasciaT / 2;

      const bargeGeo = new THREE.BoxGeometry(slopeLen + (sideFlush ? 0 : fasciaT * 2), fasciaH, bargeT);
      const frontBarge = new THREE.Mesh(bargeGeo, whiteTrimMat);
      frontBarge.position.set(0, fasciaY, roofDepth / 2 + bargeT / 2);
      frontBarge.castShadow = true;
      assembly.add(frontBarge);
      const backBarge = new THREE.Mesh(bargeGeo, whiteTrimMat);
      backBarge.position.set(0, fasciaY, -(roofDepth / 2 + bargeT / 2));
      backBarge.castShadow = true;
      assembly.add(backBarge);

      const fasciaGeo = new THREE.BoxGeometry(fasciaT, fasciaH, roofDepth + bargeT * 2);
      const westFascia = new THREE.Mesh(fasciaGeo, whiteTrimMat);
      westFascia.position.set(-(slopeLen / 2) + endFasciaOut, fasciaY, 0);
      westFascia.castShadow = true;
      assembly.add(westFascia);
      const eastFascia = new THREE.Mesh(fasciaGeo, whiteTrimMat);
      eastFascia.position.set(slopeLen / 2 - endFasciaOut, fasciaY, 0);
      eastFascia.castShadow = true;
      assembly.add(eastFascia);

      // South canopy soffit — closes the underside so posts meet a finished roof plane.
      if (edges.front > 0.05) {
        const soffitT = 0.018;
        const soffitMat = new THREE.MeshStandardMaterial({
          color: '#f4f1ea',
          roughness: 0.7,
          emissive: '#efebe4',
          emissiveIntensity: 0.35
        });
        const localWallFrontZ = d / 2 - zShift;
        const frontSoffitLen = Math.max(0.05, roofDepth / 2 - (localWallFrontZ - 0.02));
        const soffitY = -roofThick / 2 - soffitT / 2;
        const frontSoffit = new THREE.Mesh(
          new THREE.BoxGeometry(slopeLen - 0.02, soffitT, frontSoffitLen),
          soffitMat
        );
        frontSoffit.position.set(0, soffitY, roofDepth / 2 - frontSoffitLen / 2);
        frontSoffit.receiveShadow = true;
        assembly.add(frontSoffit);
      }

      this.roofGroup.add(assembly);

      // South canopy timber: posts seat under a sloping eave beam that follows the roof fall.
      if (edges.front >= 1.5) {
        const timber = new THREE.MeshStandardMaterial({
          color: '#c4a574',
          roughness: 0.72,
          metalness: 0.05
        });
        const postSize = 0.14;
        const beamH = 0.16;
        const beamD = 0.14;
        const postInset = 0.22;
        const postZ = d / 2 + edges.front - postInset;
        const wallLedgerZ = d / 2 + 0.06;
        const deckTop = 0.32;
        // Underside of roof sheet at world X (width-fall): yMid + x·tan(θ)
        const plateY = (x: number) => yMid + x * Math.tan(angleRad);
        // Beam centre: rotate around (0, yMid − seat) so it tracks the soffit at every X.
        const beamSeat = 0.018 + beamH / 2;
        const beamCentreY = yMid - beamSeat;
        const postXs = [-w / 4, w / 4] as const;
        const worldSpan = Math.abs(postXs[1] - postXs[0]) + postSize;
        const beamLen = worldSpan / Math.cos(angleRad);

        const eaveBeam = new THREE.Mesh(new THREE.BoxGeometry(beamLen, beamH, beamD), timber);
        eaveBeam.position.set(0, beamCentreY, postZ);
        eaveBeam.rotation.z = angleRad;
        eaveBeam.castShadow = true;
        eaveBeam.receiveShadow = true;
        eaveBeam.userData.outsideAddition = true;
        this.roofGroup.add(eaveBeam);

        // Wall ledger under the soffit start — ties the canopy back to the facade.
        const ledgerLen = (w - 0.2) / Math.cos(angleRad);
        const ledger = new THREE.Mesh(new THREE.BoxGeometry(ledgerLen, beamH * 0.85, beamD * 0.7), timber);
        ledger.position.set(0, beamCentreY, wallLedgerZ);
        ledger.rotation.z = angleRad;
        ledger.castShadow = true;
        ledger.userData.outsideAddition = true;
        this.roofGroup.add(ledger);

        for (const x of postXs) {
          // Post head seats on the beam underside at this X.
          const underBeam = plateY(x) - beamSeat - beamH / 2;
          const postH = Math.max(1.2, underBeam - deckTop);
          const post = new THREE.Mesh(new THREE.BoxGeometry(postSize, postH, postSize), timber);
          post.position.set(x, deckTop + postH / 2, postZ);
          post.castShadow = true;
          post.receiveShadow = true;
          post.userData.outsideAddition = true;
          this.roofGroup.add(post);

          // Joist from eave beam back to the wall ledger (same pitch height at this X).
          const strutLen = Math.max(0.4, postZ - wallLedgerZ - 0.06);
          const strut = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, strutLen), timber);
          strut.position.set(x, plateY(x) - beamSeat - 0.02, (postZ + wallLedgerZ) / 2);
          strut.castShadow = true;
          strut.userData.outsideAddition = true;
          this.roofGroup.add(strut);
        }
      }
    } else {
      // Pulpettak. The slab, barge boards, and fascia share one rotated assembly
      // so each board meets the next at an edge instead of occupying the same face.
      const angleRad = this.pulpetPitchRad();
      const rearH = Math.max(h - Math.tan(angleRad) * d, 1.8);
      const yMid = (h + rearH) / 2;
      const roofThick = 0.1;
      const slopeLen = (d + edges.front + edges.back) / Math.cos(angleRad);
      const roofW = w + edges.left + edges.right;
      const roofCenterY = yMid + (roofThick / 2) / Math.cos(angleRad);

      const assembly = new THREE.Group();
      assembly.position.set(0, roofCenterY, 0);
      assembly.rotation.x = -angleRad;

      const roofMesh = new THREE.Mesh(new THREE.BoxGeometry(roofW, roofThick, slopeLen), roofMat);
      roofMesh.castShadow = true;
      roofMesh.receiveShadow = true;
      assembly.add(roofMesh);

      const fasciaT = 0.022;
      const soffitT = 0.016;
      const eavesDrop = 0.08;
      const fasciaBottom = -roofThick / 2 - eavesDrop;
      const fasciaTop = roofThick / 2 + 0.008;
      const fasciaH = fasciaTop - fasciaBottom;
      const fasciaY = (fasciaBottom + fasciaTop) / 2;
      const bargeT = 0.032;

      const bargeGeo = new THREE.BoxGeometry(bargeT, fasciaH, slopeLen + fasciaT * 2);
      const leftBarge = new THREE.Mesh(bargeGeo, whiteTrimMat);
      leftBarge.position.set(-(roofW / 2 + bargeT / 2), fasciaY, 0);
      leftBarge.castShadow = true;
      assembly.add(leftBarge);
      const rightBarge = new THREE.Mesh(bargeGeo, whiteTrimMat);
      rightBarge.position.set(roofW / 2 + bargeT / 2, fasciaY, 0);
      rightBarge.castShadow = true;
      assembly.add(rightBarge);

      const fasciaGeo = new THREE.BoxGeometry(roofW + bargeT * 2, fasciaH, fasciaT);
      const frontFascia = new THREE.Mesh(fasciaGeo, whiteTrimMat);
      frontFascia.position.set(0, fasciaY, slopeLen / 2 + fasciaT / 2);
      frontFascia.castShadow = true;
      assembly.add(frontFascia);
      const rearFascia = new THREE.Mesh(fasciaGeo, whiteTrimMat);
      rearFascia.position.set(0, fasciaY, -(slopeLen / 2 + fasciaT / 2));
      rearFascia.castShadow = true;
      assembly.add(rearFascia);

      // Continuous soffits close the underside of all overhangs so no interior framing or gaps are exposed
      const soffitMat = new THREE.MeshStandardMaterial({
        color: '#f7f5f1',
        roughness: 0.72,
        emissive: '#f3f0ea',
        emissiveIntensity: 0.45
      });
      const soffitY = fasciaBottom + soffitT / 2;
      const zWallFront = (d / 2) / Math.cos(angleRad);
      const zWallRear = -(d / 2) / Math.cos(angleRad);

      const frontSoffitLen = Math.max(0.05, slopeLen / 2 - (zWallFront - 0.03));
      const frontSoffit = new THREE.Mesh(
        new THREE.BoxGeometry(roofW, soffitT, frontSoffitLen),
        soffitMat
      );
      frontSoffit.position.set(0, soffitY, slopeLen / 2 - frontSoffitLen / 2);
      frontSoffit.receiveShadow = true;
      assembly.add(frontSoffit);

      const rearSoffitLen = Math.max(0.05, (zWallRear + 0.03) - (-slopeLen / 2));
      const rearSoffit = new THREE.Mesh(
        new THREE.BoxGeometry(roofW, soffitT, rearSoffitLen),
        soffitMat
      );
      rearSoffit.position.set(0, soffitY, -slopeLen / 2 + rearSoffitLen / 2);
      rearSoffit.receiveShadow = true;
      assembly.add(rearSoffit);

      const sideReach = Math.max(edges.left, edges.right);
      if (sideReach > 0.03) {
        const sideSoffitGeo = new THREE.BoxGeometry(sideReach, soffitT, slopeLen);
        for (const sign of [-1, 1]) {
          const sideSoffit = new THREE.Mesh(sideSoffitGeo, soffitMat);
          sideSoffit.position.set(sign * (w / 2 + sideReach / 2), soffitY, 0);
          sideSoffit.receiveShadow = true;
          assembly.add(sideSoffit);
        }
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
    const yMid = h;
    const roofCenterY = yMid + (roofThick / 2) / Math.cos(angleRad);

    const assembly = new THREE.Group();
    assembly.position.set(0, roofCenterY, 0);
    assembly.rotation.x = -angleRad;

    const roofMesh = new THREE.Mesh(new THREE.BoxGeometry(roofW, roofThick, slopeLen), roofMat);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    assembly.add(roofMesh);

    const fasciaT = 0.028;
    const soffitT = 0.016;
    const drop = 0.14;
    const frameH = roofThick + drop;
    const frameY = -drop / 2 + 0.01;
    const band = (width: number, height: number, depth: number, x: number, z: number) => {
      const piece = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), trimMat);
      piece.position.set(x, frameY, z);
      piece.castShadow = true;
      assembly.add(piece);
    };

    band(roofW + fasciaT * 2, frameH, fasciaT, 0, slopeLen / 2 + fasciaT / 2);
    band(roofW + fasciaT * 2, frameH, fasciaT, 0, -(slopeLen / 2 + fasciaT / 2));
    band(fasciaT, frameH, slopeLen + fasciaT * 2, -(roofW / 2 + fasciaT / 2), 0);
    band(fasciaT, frameH, slopeLen + fasciaT * 2, roofW / 2 + fasciaT / 2, 0);

    // Perimeter coping capping strips (krönplåt / krönbeslag) seal the parapet top,
    // capping the fascia band and overlapping the roof surface by 6 cm to prevent any visible gap or exposed framing.
    const copingH = 0.014;
    const copingOverhang = 0.06;
    const copingY = frameY + frameH / 2 + copingH / 2;

    const frontCoping = new THREE.Mesh(
      new THREE.BoxGeometry(roofW + fasciaT * 2 + 0.008, copingH, fasciaT + copingOverhang),
      trimMat
    );
    frontCoping.position.set(0, copingY, slopeLen / 2 + fasciaT / 2 - copingOverhang / 2);
    frontCoping.castShadow = true;
    assembly.add(frontCoping);

    const rearCoping = new THREE.Mesh(
      new THREE.BoxGeometry(roofW + fasciaT * 2 + 0.008, copingH, fasciaT + copingOverhang),
      trimMat
    );
    rearCoping.position.set(0, copingY, -(slopeLen / 2 + fasciaT / 2 - copingOverhang / 2));
    rearCoping.castShadow = true;
    assembly.add(rearCoping);

    const sideCopingGeo = new THREE.BoxGeometry(fasciaT + copingOverhang, copingH, slopeLen + fasciaT * 2 + 0.008);
    const leftCoping = new THREE.Mesh(sideCopingGeo, trimMat);
    leftCoping.position.set(-(roofW / 2 + fasciaT / 2 - copingOverhang / 2), copingY, 0);
    leftCoping.castShadow = true;
    assembly.add(leftCoping);

    const rightCoping = new THREE.Mesh(sideCopingGeo, trimMat);
    rightCoping.position.set(roofW / 2 + fasciaT / 2 - copingOverhang / 2, copingY, 0);
    rightCoping.castShadow = true;
    assembly.add(rightCoping);

    if (overhang > 0.04) {
      const soffitMat = new THREE.MeshStandardMaterial({
        color: '#f7f5f1',
        roughness: 0.72,
        emissive: '#f3f0ea',
        emissiveIntensity: 0.45
      });
      const soffitY = frameY - frameH / 2 + soffitT / 2;
      const zWallFront = (d / 2) / Math.cos(angleRad);
      const zWallRear = -(d / 2) / Math.cos(angleRad);

      const frontSoffitLen = Math.max(0.04, slopeLen / 2 - (zWallFront - 0.02));
      const frontSoffit = new THREE.Mesh(new THREE.BoxGeometry(roofW, soffitT, frontSoffitLen), soffitMat);
      frontSoffit.position.set(0, soffitY, slopeLen / 2 - frontSoffitLen / 2);
      assembly.add(frontSoffit);

      const rearSoffitLen = Math.max(0.04, (zWallRear + 0.02) - (-slopeLen / 2));
      const rearSoffit = new THREE.Mesh(new THREE.BoxGeometry(roofW, soffitT, rearSoffitLen), soffitMat);
      rearSoffit.position.set(0, soffitY, -slopeLen / 2 + rearSoffitLen / 2);
      assembly.add(rearSoffit);

      const sideReach = overhang;
      const sideSoffitGeo = new THREE.BoxGeometry(sideReach, soffitT, slopeLen);
      for (const sign of [-1, 1]) {
        const sideSoffit = new THREE.Mesh(sideSoffitGeo, soffitMat);
        sideSoffit.position.set(sign * (w / 2 + sideReach / 2), soffitY, 0);
        assembly.add(sideSoffit);
      }
    } else {
      const closureT = 0.02;
      const closureY = frameY - frameH / 2 + closureT / 2;
      const bandClosureFront = new THREE.Mesh(new THREE.BoxGeometry(roofW, closureT, 0.04), trimMat);
      bandClosureFront.position.set(0, closureY, slopeLen / 2 - 0.02);
      assembly.add(bandClosureFront);
      const bandClosureRear = new THREE.Mesh(new THREE.BoxGeometry(roofW, closureT, 0.04), trimMat);
      bandClosureRear.position.set(0, closureY, -slopeLen / 2 + 0.02);
      assembly.add(bandClosureRear);
      const sideClosureGeo = new THREE.BoxGeometry(0.04, closureT, slopeLen);
      for (const sign of [-1, 1]) {
        const sideClosure = new THREE.Mesh(sideClosureGeo, trimMat);
        sideClosure.position.set(sign * (roofW / 2 - 0.02), closureY, 0);
        assembly.add(sideClosure);
      }
    }

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
      const fasciaH = roofThick + 0.06;
      const fascia = new THREE.Mesh(
        new THREE.BoxGeometry(roofW + 0.02, fasciaH, fasciaT),
        trimMat
      );
      fascia.position.set(0, roofThick / 2 - 0.02, sign * (slopeLen - fasciaT / 2));
      fascia.castShadow = true;
      slope.add(fascia);

      // Close eave overhang underside with soffit meeting the wall plate
      if (overhang > 0.04) {
        const soffitMat = new THREE.MeshStandardMaterial({
          color: '#f7f5f1',
          roughness: 0.72,
          emissive: '#f3f0ea',
          emissiveIntensity: 0.45
        });
        const eaveSoffitLen = (overhang / Math.cos(angleRad)) + 0.05;
        const eaveSoffit = new THREE.Mesh(
          new THREE.BoxGeometry(roofW, 0.016, eaveSoffitLen),
          soffitMat
        );
        eaveSoffit.position.set(0, -0.01, sign * (slopeLen - eaveSoffitLen / 2));
        slope.add(eaveSoffit);
      }

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
    // Keep outer roof rafters strictly inside the exterior envelope/cladding on both sides
    const rafterInset = 0.09;
    const spanW = w - rafterInset * 2;
    const count = Math.max(2, Math.floor(spanW / 0.6) + 1); // cc 600 mm
    const spacing = spanW / (count - 1);

    if (isPulpettak && this.roofFallsAlongWidth()) {
      // Stugan: rafters run east–west with the 10° fall (high east → low west).
      const angleRad = this.pulpetPitchRad();
      const lowH = Math.max(h - Math.tan(angleRad) * w, 2.4);
      const slopeAngle = Math.atan2(h - lowH, w);
      const span = Math.hypot(w, h - lowH);
      const edges = this.roofEdgeOverhangs(w, d);
      const southTail = ghost ? Math.max(0.2, edges.front) : 0;
      const depth = ghost ? 0.145 : 0.1;
      const slopeLen = span - (ghost ? 0 : 0.1);
      const midY = (h + lowH) / 2 - depth / 2 - (ghost ? 0 : 0.016);
      const zSpan = d - rafterInset * 2 + southTail;
      const zCount = Math.max(2, Math.floor(zSpan / 0.6) + 1);
      const zSpacing = zSpan / (zCount - 1);
      const z0 = -d / 2 + rafterInset;
      const rafterGeo = new THREE.BoxGeometry(slopeLen, depth, rafterW);

      for (let i = 0; i < zCount; i++) {
        const rz = z0 + i * zSpacing;
        const rafter = new THREE.Mesh(rafterGeo, rafterMat);
        rafter.position.set(0, midY, rz);
        // Lift +X (east) to match the width-fall roof plate.
        rafter.rotation.z = slopeAngle;
        rafter.castShadow = !ghost;
        rafter.userData.framingStep = 6;
        rafter.userData.framingNameSv = 'Takstol / takbalk (pulpettak öst→väst)';
        rafter.userData.framingNameEn = 'Rafter / Roof Beam (Mono-pitch east→west)';
        rafter.userData.dimension = `${Math.round(rafterW * 1000)}×${Math.round(depth * 1000)} mm C24 cc 600 mm`;
        beamParent.add(rafter);
      }
    } else if (isPulpettak) {
      const slopeAngle = Math.atan2(h - rearH, d);
      const span = Math.hypot(d, h - rearH);
      // In ghost/cutaway mode rafter tails project for framing inspection. In exterior envelope mode they stay inside.
      const tail = ghost ? 0.45 : 0;
      const depth = ghost ? 0.145 : 0.1;
      const slopeLen = span + tail - (ghost ? 0 : 0.10);
      const rafterGeo = new THREE.BoxGeometry(rafterW, depth, slopeLen);
      const shift = tail / 2;
      const midY = (h + rearH) / 2 - depth / 2 - (ghost ? 0 : 0.016);

      for (let i = 0; i < count; i++) {
        const rx = -w / 2 + rafterInset + i * spacing;
        const rafter = new THREE.Mesh(rafterGeo, rafterMat);
        rafter.position.set(
          rx,
          midY + Math.sin(slopeAngle) * shift,
          Math.cos(slopeAngle) * shift
        );
        rafter.rotation.x = -slopeAngle;
        rafter.castShadow = !ghost;
        rafter.userData.framingStep = 6;
        rafter.userData.framingNameSv = 'Takstol / takbalk (pulpettak)';
        rafter.userData.framingNameEn = 'Rafter / Roof Beam (Mono-pitch)';
        rafter.userData.dimension = `${Math.round(rafterW * 1000)}×${Math.round(depth * 1000)} mm C24 cc 600 mm`;
        beamParent.add(rafter);
      }
    } else if (this.currentConfig.roofType === 'flackt') {
      const shallowAngle = (2 * Math.PI) / 180;
      const len = ghost ? d + 0.7 : d - 0.12;
      const depth = ghost ? rafterH : 0.12;
      const rafterGeo = new THREE.BoxGeometry(rafterW, depth, len);
      for (let i = 0; i < count; i++) {
        const rx = -w / 2 + rafterInset + i * spacing;
        const rafter = new THREE.Mesh(rafterGeo, rafterMat);
        rafter.position.set(rx, h - (ghost ? rafterH / 2 - 0.04 : 0.12), 0);
        rafter.rotation.x = -shallowAngle;
        rafter.castShadow = !ghost;
        rafter.userData.framingStep = 6;
        rafter.userData.framingNameSv = 'Flack takbjälke';
        rafter.userData.framingNameEn = 'Flat Roof Joist';
        rafter.userData.dimension = `${Math.round(rafterW * 1000)}×${Math.round(depth * 1000)} mm C24 cc 600 mm`;
        beamParent.add(rafter);
      }
    } else {
      const gableAngle = this.gablePitchRad();
      const rise = Math.tan(gableAngle) * (d / 2);
      const slopeLen = (d / 2) / Math.cos(gableAngle) + (ghost ? 0.25 : -0.05);
      const rafterGeo = new THREE.BoxGeometry(rafterW, rafterH, slopeLen);
      const y = h + rise / 2 - rafterH / 2 + (ghost ? 0.04 : -0.02);

      for (let i = 0; i < count; i++) {
        const rx = -w / 2 + rafterInset + i * spacing;
        const frontRafter = new THREE.Mesh(rafterGeo, rafterMat);
        frontRafter.position.set(rx, y, d / 4);
        frontRafter.rotation.x = gableAngle;
        frontRafter.castShadow = !ghost;
        frontRafter.userData.framingStep = 6;
        frontRafter.userData.framingNameSv = 'Takstol / taksparre (fram)';
        frontRafter.userData.framingNameEn = 'Rafter / Truss Member (Front)';
        frontRafter.userData.dimension = `${Math.round(rafterW * 1000)}×${Math.round(rafterH * 1000)} mm C24 cc 600 mm`;
        beamParent.add(frontRafter);

        const rearRafter = new THREE.Mesh(rafterGeo, rafterMat);
        rearRafter.position.set(rx, y, -d / 4);
        rearRafter.rotation.x = -gableAngle;
        rearRafter.castShadow = !ghost;
        rearRafter.userData.framingStep = 6;
        rearRafter.userData.framingNameSv = 'Takstol / taksparre (bak)';
        rearRafter.userData.framingNameEn = 'Rafter / Truss Member (Rear)';
        rearRafter.userData.dimension = `${Math.round(rafterW * 1000)}×${Math.round(rafterH * 1000)} mm C24 cc 600 mm`;
        beamParent.add(rearRafter);
      }
    }
  }

  private addLoftPiece(object: THREE.Object3D) {
    (this.loftBuildParent ?? this.loftGroup).add(object);
  }

  /** Whether architectural wall framing / studs should be shown. */
  private framingVisible(): boolean {
    return loftWallStudsVisible(
      this.currentConfig.showInnerWalls ?? true,
      this.currentConfig.viewMode,
      this.loftCutaway()
    );
  }

  /** Uprights along the loft railing. They share the inner-wall switch. */
  private loftStudGroup() {
    const group = new THREE.Group();
    group.userData.loftStuds = true;
    group.visible = this.currentConfig.showInnerWalls !== false;
    return group;
  }

  /** Loft framing studs inside the exterior walls. Only shown when viewing studs. */
  private loftWallStudGroup() {
    const group = new THREE.Group();
    group.userData.loftWallStuds = true;
    group.visible = this.framingVisible();
    return group;
  }

  private syncLoftStuds() {
    const showRailing = this.currentConfig.showInnerWalls !== false;
    const showWallStuds = this.framingVisible();
    this.loftGroup.traverse((object) => {
      if (object.userData.loftStuds) object.visible = showRailing;
      if (object.userData.loftWallStuds) object.visible = showWallStuds;
    });
  }

  // --- Loft Construction with side or end placement, area sizes and a 3D stair ---
  private buildLoft(width: number, depth: number, h: number, wt: number) {
    const loftArea = this.currentConfig.loftAreaSqMeters ?? 10.95;
    const placement = this.currentConfig.loftPlacement ?? 'vanster';
    const isTwoLofts = this.currentConfig.loftCount === 'tva';
    const endOn = !isTwoLofts && (placement === 'fram' || placement === 'bak');
    // A front or back deck is the left-hand loft, built with the axes swapped, then turned.
    const w = endOn ? depth : width;
    const d = endOn ? width : depth;
    const side: LoftPlacement = endOn ? 'vanster' : placement;
    this.loftBuildParent = this.loftGroup;
    if (endOn) {
      const host = new THREE.Group();
      host.rotation.y = loftEndRotation(placement);
      this.loftGroup.add(host);
      this.loftBuildParent = host;
    }

    const isConcrete = Boolean(this.currentConfig.concreteBase && !this.concreteFoundationOnly());
    const concreteH = isConcrete ? this.concreteCrownM() : 0.25;

    // Total house footprint reference for size-30 is 27.38 m2; for concrete base use actual plan area
    const houseAreaRef = isConcrete
      ? (this.currentConfig.widthMm / 1000) * (this.currentConfig.depthMm / 1000)
      : (this.currentConfig.widthMm === 4800 ? 13.7
        : this.currentConfig.widthMm === 5800 ? 22.8
        : this.currentConfig.widthMm === 8000 ? 36.5
        : 27.38);

    const areaFraction = Math.min(1.0, Math.max(0.25, loftArea / houseAreaRef));
    const interiorW = w - wt * 2;
    const interiorD = d - wt * 2;

    const loftD = interiorD;
    // A full concrete storey carries the deck; foundation-only mode uses the normal timber loft level.
    const joistH = 0.195; // 195 mm floor joists (45x195 mm bjälklag)
    const joistW = 0.045; // 45 mm joist thickness
    const floorboardThick = 0.028; // 28 mm massive granplank
    const loftElev = isConcrete ? concreteH + joistH : loftJoistTop(h);

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

    const walledLoftRooms = this.interiorGroup.children
      .filter((child) => child.userData.type === 'room_zone' && isLoftRoom(child.position.y))
      .map((child) => ({
        x: child.position.x,
        z: child.position.z,
        w: Number(child.userData.w) || 1,
        d: Number(child.userData.d) || 1,
        wallsVisible: child.userData.wallsVisible !== false
      }));
    const { hx: railHx, hz: railHz } = innerHalf(width, depth);
    const railBlockedHouse = (() => {
      if (isTwoLofts) {
        const eachW = Math.min(interiorW * 0.42, (interiorW * areaFraction) / 2);
        const leftDeck: LoftBounds = {
          minX: -railHx,
          maxX: -railHx + eachW,
          minZ: -railHz,
          maxZ: railHz,
          loftDepth: eachW
        };
        const rightDeck: LoftBounds = {
          minX: railHx - eachW,
          maxX: railHx,
          minZ: -railHz,
          maxZ: railHz,
          loftDepth: eachW
        };
        return [
          ...loftRailBlockedSpans(walledLoftRooms, leftDeck, 'vanster'),
          ...loftRailBlockedSpans(walledLoftRooms, rightDeck, 'hoger')
        ];
      }
      const deck = loftDeckBounds(width, depth, loftArea, placement, false, isConcrete);
      return loftRailBlockedSpans(walledLoftRooms, deck, placement);
    })();
    // Section-local Z along the open edge. Side lofts share house Z; front/back decks are rotated.
    const railBlockedAlong = (() => {
      if (!endOn) return railBlockedHouse;
      if (placement === 'fram') {
        return railBlockedHouse.map((s) => ({ min: -s.max, max: -s.min }));
      }
      return railBlockedHouse;
    })();

    const buildSingleLoftSection = (
      sectionW: number,
      startX: number,
      isLeftSection: boolean,
      stairAttached: boolean
    ) => {
      const sectionGroup = new THREE.Group();
      const edgeX = isLeftSection ? startX + sectionW : startX;
      const stairType = this.currentConfig.loftStairType ?? 'straight';
      const stairPos = this.currentConfig.loftStairPosition ?? 'front';
      const stairMiddle = stairPos === 'middle';
      const stairEndSign = stairPos === 'back' ? -1 : 1;
      const opening = stairAttached && this.currentConfig.hasLoftStair
        ? loftStairOpening(stairType, sectionW, loftD)
        : null;
      const openingInnerX = opening
        ? (isLeftSection ? edgeX - opening.width : edgeX + opening.width)
        : edgeX;

      // 1. Floor Joists (Loftbjälklag 45x195 mm cc 600 mm) - visible from below matching Image 4
      const joistCount = Math.max(3, Math.floor(sectionW / 0.6) + 1);
      const joistSpacing = sectionW / (joistCount - 1);

      for (let j = 0; j < joistCount; j++) {
        const jx = startX + j * joistSpacing;
        const crossesOpening = opening && (isLeftSection ? jx > openingInnerX : jx < openingInnerX);
        if (crossesOpening && stairMiddle && opening) {
          const halfRemain = (loftD - opening.depth) / 2;
          for (const sign of [-1, 1] as const) {
            const joistMesh = new THREE.Mesh(
              new THREE.BoxGeometry(joistW, joistH, halfRemain),
              timberMat
            );
            joistMesh.position.set(
              jx,
              loftElev - joistH / 2,
              sign * (opening.depth / 2 + halfRemain / 2)
            );
            joistMesh.castShadow = true;
            sectionGroup.add(joistMesh);
          }
          continue;
        }
        const joistDepth = crossesOpening ? loftD - opening!.depth : loftD;
        const joistGeo = new THREE.BoxGeometry(joistW, joistH, joistDepth);
        const joistMesh = new THREE.Mesh(joistGeo, timberMat);
        joistMesh.position.set(
          jx,
          loftElev - joistH / 2,
          crossesOpening ? -stairEndSign * opening!.depth / 2 : 0
        );
        joistMesh.castShadow = true;
        sectionGroup.add(joistMesh);
      }

      // Outer Edge Carrier Beam (Bärlina / Kantbjälke 45x195 mm) along the open room edge
      if (opening && stairMiddle) {
        const halfRemain = (loftD - opening.depth) / 2;
        for (const sign of [-1, 1] as const) {
          const rimBeam = new THREE.Mesh(
            new THREE.BoxGeometry(joistW * 1.5, joistH, halfRemain),
            timberMat
          );
          rimBeam.position.set(
            edgeX,
            loftElev - joistH / 2,
            sign * (opening.depth / 2 + halfRemain / 2)
          );
          rimBeam.castShadow = true;
          sectionGroup.add(rimBeam);
        }
      } else {
        const rimDepth = opening ? loftD - opening.depth : loftD;
        const rimBeamGeo = new THREE.BoxGeometry(joistW * 1.5, joistH, rimDepth);
        const rimBeam = new THREE.Mesh(rimBeamGeo, timberMat);
        rimBeam.position.set(
          edgeX,
          loftElev - joistH / 2,
          opening ? -stairEndSign * opening.depth / 2 : 0
        );
        rimBeam.castShadow = true;
        sectionGroup.add(rimBeam);
      }

      // 2. Top Floorboard Surface (Granplank 28x120 mm) matching Image 5
      const addFloorPanel = (panelW: number, panelD: number, x: number, z: number) => {
        if (panelW <= 0.01 || panelD <= 0.01) return;
        const floorMesh = new THREE.Mesh(
          new THREE.BoxGeometry(panelW, floorboardThick, panelD),
          floorMat
        );
        floorMesh.position.set(x, loftElev + floorboardThick / 2, z);
        floorMesh.receiveShadow = true;
        floorMesh.castShadow = true;
        sectionGroup.add(floorMesh);
      };

      if (opening && stairMiddle) {
        const halfRemain = (loftD - opening.depth) / 2;
        for (const sign of [-1, 1] as const) {
          addFloorPanel(
            sectionW,
            halfRemain,
            startX + sectionW / 2,
            sign * (opening.depth / 2 + halfRemain / 2)
          );
        }
        const sideWidth = sectionW - opening.width;
        const sideX = isLeftSection
          ? startX + sideWidth / 2
          : startX + opening.width + sideWidth / 2;
        addFloorPanel(sideWidth, opening.depth, sideX, 0);
        for (const sign of [-1, 1] as const) {
          const header = new THREE.Mesh(
            new THREE.BoxGeometry(opening.width, joistH, joistW * 1.5),
            timberMat
          );
          header.position.set(
            (edgeX + openingInnerX) / 2,
            loftElev - joistH / 2,
            sign * (opening.depth / 2)
          );
          header.castShadow = true;
          sectionGroup.add(header);
        }
      } else if (opening) {
        const remainingDepth = loftD - opening.depth;
        addFloorPanel(
          sectionW,
          remainingDepth,
          startX + sectionW / 2,
          -stairEndSign * opening.depth / 2
        );

        const sideWidth = sectionW - opening.width;
        const sideX = isLeftSection
          ? startX + sideWidth / 2
          : startX + opening.width + sideWidth / 2;
        addFloorPanel(
          sideWidth,
          opening.depth,
          sideX,
          stairEndSign * (loftD / 2 - opening.depth / 2)
        );

        // Header beam closes the cut joists at the back edge of the stairwell.
        const header = new THREE.Mesh(
          new THREE.BoxGeometry(opening.width, joistH, joistW * 1.5),
          timberMat
        );
        header.position.set(
          (edgeX + openingInnerX) / 2,
          loftElev - joistH / 2,
          stairEndSign * (loftD / 2 - opening.depth)
        );
        header.castShadow = true;
        sectionGroup.add(header);
      } else {
        addFloorPanel(sectionW, loftD, startX + sectionW / 2, 0);
      }

      // 3. Safety Railing (Skyddsräcke 850 mm) along the open inner edge.
      // Walled loft bedrooms replace the rail on their open-edge side; the stair gap stays open.
      if (sectionW < interiorW * 0.95) {
        const railH = 0.85;
        const stairGap = opening?.depth ?? 0;
        const studs = this.loftStudGroup();
        const addRail = (railLength: number, railCenterZ: number) => {
          if (railLength <= 0.05) return;
          const handrail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, railLength), timberMat);
          handrail.position.set(edgeX, loftElev + railH, railCenterZ);
          studs.add(handrail);
          const balusterCount = Math.max(1, Math.floor(railLength / 0.12));
          for (let b = 0; b <= balusterCount; b++) {
            const bz = railCenterZ - railLength / 2 + (railLength / balusterCount) * b;
            const baluster = new THREE.Mesh(new THREE.BoxGeometry(0.025, railH, 0.025), timberMat);
            baluster.position.set(edgeX, loftElev + railH / 2, bz);
            studs.add(baluster);
          }
        };
        const addRailSegment = (segMin: number, segMax: number) => {
          const len = segMax - segMin;
          if (len <= 0.05) return;
          addRail(len, (segMin + segMax) / 2);
        };
        const railBlocked = railBlockedAlong;
        const rawSegments: { min: number; max: number }[] = [];
        if (stairMiddle && stairGap > 0) {
          const half = (loftD - stairGap) / 2;
          rawSegments.push(
            { min: -(stairGap / 2 + half), max: -stairGap / 2 },
            { min: stairGap / 2, max: stairGap / 2 + half }
          );
        } else {
          const center = -stairEndSign * stairGap / 2;
          const len = loftD - stairGap;
          rawSegments.push({ min: center - len / 2, max: center + len / 2 });
        }
        for (const seg of rawSegments) {
          for (const kept of subtractRailSpans(seg.min, seg.max, railBlocked)) {
            addRailSegment(kept.min, kept.max);
          }
        }
        sectionGroup.add(studs);
      }

      // 4. Structural Support Framing for Concrete / Timber Combo:
      // When loft is placed partially on concrete walls and partially over the open front extension
      if (isConcrete && endOn) {
        const shell = this.timberShell();
        const cd = (this.currentConfig.concreteDepthMm ?? 5200) / 1000;
        // In world coordinates, front of concrete house is at cd / 2.
        // In houseGroup coordinates: z_hg = cd / 2 - shell.z.
        // In host coordinates (rotated by +PI/2, where z_hg = -x_host):
        const xConcreteFront = -(cd / 2 - shell.z);
        const slabBase = 0.25;

        // Post and stud dimensions
        const postW = 0.115; // 115x115 mm limträpelare
        const postD = 0.115;
        const studW = 0.045; // 45x145 mm reglar
        const studD = 0.145;

        // A. Carrier beam (Bärlina 90x195 mm) at the concrete front line
        // Spans the full width of the house from left to right concrete wall
        const carrierH = joistH;
        const carrierW = 0.09;
        const frontCarrier = new THREE.Mesh(
          new THREE.BoxGeometry(carrierW, carrierH, loftD),
          timberMat
        );
        frontCarrier.position.set(xConcreteFront, concreteH - carrierH / 2, 0);
        frontCarrier.castShadow = true;
        sectionGroup.add(frontCarrier);

        // B. Intermediate support columns under the front carrier beam (dividing into 3 bays)
        const frontPostH = (concreteH - carrierH) - slabBase;
        if (frontPostH > 0.1) {
          const postY = slabBase + frontPostH / 2;
          const leftCol = new THREE.Mesh(new THREE.BoxGeometry(postW, frontPostH, postD), timberMat);
          leftCol.position.set(xConcreteFront, postY, -loftD / 4);
          leftCol.castShadow = true;
          sectionGroup.add(leftCol);

          const rightCol = new THREE.Mesh(new THREE.BoxGeometry(postW, frontPostH, postD), timberMat);
          rightCol.position.set(xConcreteFront, postY, loftD / 4);
          rightCol.castShadow = true;
          sectionGroup.add(rightCol);
        }

        // C. Columns on top of the concrete front corners
        // Resting directly on the concrete wall ends at concreteH (2.5m)
        const wallStuds = this.loftWallStudGroup();
        const cornerStudH = (loftElev + 0.85) - concreteH;
        const leftCornerPost = new THREE.Mesh(new THREE.BoxGeometry(studD, cornerStudH, studW * 2), timberMat);
        leftCornerPost.position.set(xConcreteFront, concreteH + cornerStudH / 2, -loftD / 2 + studW);
        leftCornerPost.castShadow = true;
        wallStuds.add(leftCornerPost);

        const rightCornerPost = new THREE.Mesh(new THREE.BoxGeometry(studD, cornerStudH, studW * 2), timberMat);
        rightCornerPost.position.set(xConcreteFront, concreteH + cornerStudH / 2, loftD / 2 - studW);
        rightCornerPost.castShadow = true;
        wallStuds.add(rightCornerPost);

        // D. Supports under the inner rim beam (edgeX) inside the concrete room
        // Midpoint column down to the slab (pelare under carrier beam to prevent bounce/sag)
        const midColH = concreteH - slabBase;
        if (midColH > 0.1) {
          const midCol = new THREE.Mesh(new THREE.BoxGeometry(postW, midColH, postD), timberMat);
          midCol.position.set(edgeX, slabBase + midColH / 2, 0);
          midCol.castShadow = true;
          sectionGroup.add(midCol);
        }

        // Left and right bearing studs sitting on top of the concrete walls at edgeX
        const bearingStudH = joistH + 0.85;
        const leftBearingStud = new THREE.Mesh(new THREE.BoxGeometry(studD, bearingStudH, studW), timberMat);
        leftBearingStud.position.set(edgeX, concreteH + bearingStudH / 2, -loftD / 2 + studW / 2);
        leftBearingStud.castShadow = true;
        wallStuds.add(leftBearingStud);

        const rightBearingStud = new THREE.Mesh(new THREE.BoxGeometry(studD, bearingStudH, studW), timberMat);
        rightBearingStud.position.set(edgeX, concreteH + bearingStudH / 2, loftD / 2 - studW / 2);
        rightBearingStud.castShadow = true;
        wallStuds.add(rightBearingStud);

        // E. Wall studs along the side walls:
        // 1) Over the concrete walls (between xConcreteFront and edgeX):
        // Studs sit ON TOP OF the concrete walls at y = concreteH (2.5m)
        const concSpan = edgeX - xConcreteFront;
        if (concSpan > 0.2) {
          const nConc = Math.max(1, Math.round(concSpan / 0.6));
          const stepConc = concSpan / nConc;
          const studH = 0.85 + joistH;
          for (let i = 1; i < nConc; i++) {
            const sx = xConcreteFront + i * stepConc;
            const sGeo = new THREE.BoxGeometry(studW, studH, studD);
            const leftStud = new THREE.Mesh(sGeo, timberMat);
            leftStud.position.set(sx, concreteH + studH / 2, -loftD / 2 + studD / 2);
            leftStud.castShadow = true;
            wallStuds.add(leftStud);

            const rightStud = new THREE.Mesh(sGeo, timberMat);
            rightStud.position.set(sx, concreteH + studH / 2, loftD / 2 - studD / 2);
            rightStud.castShadow = true;
            wallStuds.add(rightStud);
          }
          // Horizontal sill plate on top of the concrete walls
          const sillGeo = new THREE.BoxGeometry(concSpan, 0.045, studD);
          const leftSill = new THREE.Mesh(sillGeo, timberMat);
          leftSill.position.set(xConcreteFront + concSpan / 2, concreteH + 0.045 / 2, -loftD / 2 + studD / 2);
          wallStuds.add(leftSill);

          const rightSill = new THREE.Mesh(sillGeo, timberMat);
          rightSill.position.set(xConcreteFront + concSpan / 2, concreteH + 0.045 / 2, loftD / 2 - studD / 2);
          wallStuds.add(rightSill);
        }

        // 2) Over the front timber extension (between startX and xConcreteFront):
        // Studs sit ON THE SLAB (y = 0.25m) and support the loft ledger beam
        const extSpan = xConcreteFront - startX;
        if (extSpan > 0.2) {
          const nExt = Math.max(1, Math.round(extSpan / 0.6));
          const stepExt = extSpan / nExt;
          const extStudH = concreteH - slabBase;
          for (let i = 0; i <= nExt; i++) {
            const sx = startX + i * stepExt;
            const sGeo = new THREE.BoxGeometry(studW, extStudH, studD);
            const leftStud = new THREE.Mesh(sGeo, timberMat);
            leftStud.position.set(sx, slabBase + extStudH / 2, -loftD / 2 + studD / 2);
            leftStud.castShadow = true;
            wallStuds.add(leftStud);

            const rightStud = new THREE.Mesh(sGeo, timberMat);
            rightStud.position.set(sx, slabBase + extStudH / 2, loftD / 2 - studD / 2);
            rightStud.castShadow = true;
            wallStuds.add(rightStud);
          }
          // Horizontal ledger beam carrying the joists in the extension
          const ledgerGeo = new THREE.BoxGeometry(extSpan, 0.145, 0.045);
          const leftLedger = new THREE.Mesh(ledgerGeo, timberMat);
          leftLedger.position.set(startX + extSpan / 2, concreteH - 0.145 / 2, -loftD / 2 + 0.045 / 2);
          wallStuds.add(leftLedger);

          const rightLedger = new THREE.Mesh(ledgerGeo, timberMat);
          rightLedger.position.set(startX + extSpan / 2, concreteH - 0.145 / 2, loftD / 2 - 0.045 / 2);
          wallStuds.add(rightLedger);
        }
        sectionGroup.add(wallStuds);
      }

      this.addLoftPiece(sectionGroup);
    };

    if (isTwoLofts) {
      // Two lofts: one left, one right, open center
      const eachW = Math.min((interiorW * 0.42), (interiorW * areaFraction) / 2);
      buildSingleLoftSection(eachW, -w / 2 + wt, true, true);
      buildSingleLoftSection(eachW, w / 2 - wt - eachW, false, false);
    } else {
      // Single loft: left, right, or a turned deck against the front or back
      const loftW = interiorW * areaFraction;
      if (side === 'vanster') {
        buildSingleLoftSection(loftW, -w / 2 + wt, true, true);
      } else {
        buildSingleLoftSection(loftW, w / 2 - wt - loftW, false, true);
      }
    }

    // 4. Loft Stair (Lofttrappa i massiv furu) in 3D
    if (this.currentConfig.hasLoftStair) {
      this.buildLoftStair(w, d, h, wt, loftElev, side, isTwoLofts, areaFraction);
    }
    this.syncLoftStuds();
    this.loftBuildParent = null;
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
    const plan = this.loftStairPlan(w, d, wt, loftElev, placement, isTwoLofts, areaFraction);
    if (this.currentConfig.loftStairType === 'curved') {
      this.buildCurvedLoftStair(plan);
      return;
    }

    const pineMat = new THREE.MeshStandardMaterial({
      color: '#dfcaa6',
      roughness: 0.55,
      metalness: 0.02
    });
    const flight = straightLoftStair({
      edgeX: plan.edgeX,
      openSign: plan.openSign,
      stairZ: plan.stairZ,
      opening: plan.opening,
      run: plan.run,
      rise: plan.rise
    });
    const stairGroup = new THREE.Group();
    const stringerThick = 0.04;
    const stringerWidth = 0.16;
    const rise = flight.yTop - flight.yBottom;
    const run = Math.abs(flight.xBottom - flight.xTop);
    const stringerLen = Math.hypot(rise, run);
    const stairAngle = Math.atan2(rise, flight.xTop - flight.xBottom);
    const midX = (flight.xBottom + flight.xTop) / 2;
    const midY = (flight.yBottom + flight.yTop) / 2;

    const stringerGeo = new THREE.BoxGeometry(stringerLen, stringerWidth, stringerThick);
    for (const side of [-1, 1]) {
      const stringer = new THREE.Mesh(stringerGeo, pineMat);
      stringer.position.set(midX, midY, flight.z + side * flight.width / 2);
      stringer.rotation.z = stairAngle;
      stringer.castShadow = true;
      stairGroup.add(stringer);
    }

    const risers = loftStairTreads(rise) + 1;
    const treadW = flight.width - stringerThick * 2;
    for (let step = 1; step <= risers; step++) {
      const fraction = step / risers;
      const landing = step === risers;
      const tread = new THREE.Mesh(
        new THREE.BoxGeometry(landing ? 0.28 : 0.22, LOFT_FLOORBOARD, treadW),
        pineMat
      );
      tread.position.set(
        flight.xBottom + (flight.xTop - flight.xBottom) * fraction
          - (landing ? plan.openSign * 0.15 : 0),
        flight.yBottom + rise * fraction - LOFT_FLOORBOARD / 2,
        flight.z
      );
      tread.castShadow = true;
      stairGroup.add(tread);
    }

    const railZ = flight.z - plan.endSign * (flight.width / 2 + 0.03);
    const handrail = new THREE.Mesh(new THREE.BoxGeometry(stringerLen, 0.04, 0.04), pineMat);
    handrail.position.set(midX, midY + 0.9, railZ);
    handrail.rotation.z = stairAngle;
    stairGroup.add(handrail);

    const postGeo = new THREE.BoxGeometry(0.03, 0.9, 0.03);
    for (const end of [0, 1]) {
      const post = new THREE.Mesh(postGeo, pineMat);
      const x = flight.xBottom + (flight.xTop - flight.xBottom) * end;
      const y = flight.yBottom + rise * end;
      post.position.set(x, y + 0.45, railZ);
      stairGroup.add(post);
    }

    stairGroup.userData.type = 'staircase';
    stairGroup.userData.position = this.currentConfig.loftStairPosition ?? 'front';
    this.addLoftPiece(stairGroup);
  }

  private loftStairPlan(
    w: number,
    d: number,
    wt: number,
    loftElev: number,
    placement: LoftPlacement,
    isTwoLofts: boolean,
    areaFraction: number
  ): LoftStairPlan {
    const interiorW = w - wt * 2;
    const interiorD = d - wt * 2;
    const left = isTwoLofts || placement === 'vanster';
    const sectionW = isTwoLofts
      ? Math.min(interiorW * 0.42, (interiorW * areaFraction) / 2)
      : interiorW * areaFraction;
    const edgeX = left ? -w / 2 + wt + sectionW : w / 2 - wt - sectionW;
    const rise = loftElev + LOFT_FLOORBOARD - INTERIOR_FLOOR_TOP;
    const openWidth = isTwoLofts ? interiorW - sectionW * 2 : interiorW - sectionW;
    const run = loftStairRun(rise, openWidth);
    const type = this.currentConfig.loftStairType === 'curved' ? 'curved' : 'straight';
    const position = this.currentConfig.loftStairPosition ?? 'front';
    const endSign = position === 'back' ? -1 : 1;
    const opening = loftStairOpening(type, sectionW, interiorD);
    const stairZ =
      position === 'middle' ? 0 : endSign * (interiorD / 2 - opening.depth / 2);
    return {
      edgeX,
      openSign: left ? 1 : -1,
      endSign,
      stairZ,
      rise,
      run,
      opening
    };
  }

  /** Spiral inside the selected end of the loft opening. */
  private buildCurvedLoftStair(plan: LoftStairPlan) {
    const pineMat = new THREE.MeshStandardMaterial({
      color: '#dfcaa6',
      roughness: 0.55,
      metalness: 0.02
    });
    const darkPineMat = new THREE.MeshStandardMaterial({
      color: '#b49368',
      roughness: 0.62,
      metalness: 0.01
    });
    const spiral = curvedLoftStair({
      edgeX: plan.edgeX,
      openSign: plan.openSign,
      stairZ: plan.stairZ,
      opening: plan.opening,
      rise: plan.rise
    });
    const innerRadius = 0.12;
    const treadRadius = (innerRadius + spiral.radius) / 2;
    const treadLength = spiral.radius - innerRadius;
    const stepCount = Math.max(12, loftStairTreads(plan.rise));
    const stairGroup = new THREE.Group();

    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.06, plan.rise, 16),
      darkPineMat
    );
    column.position.set(spiral.centerX, spiral.yBottom + plan.rise / 2, spiral.centerZ);
    column.castShadow = true;
    stairGroup.add(column);

    const railPoints: THREE.Vector3[] = [];
    for (let step = 0; step < stepCount; step++) {
      const fraction = (step + 1) / stepCount;
      const angle = spiral.topAngle - spiral.direction * spiral.sweep * (1 - fraction);
      const y = spiral.yBottom + plan.rise * fraction;
      const x = spiral.centerX + Math.cos(angle) * treadRadius;
      const z = spiral.centerZ + Math.sin(angle) * treadRadius;
      const arcWidth = Math.max(0.18, (spiral.radius * spiral.sweep * 0.72) / stepCount);
      const tread = new THREE.Mesh(
        new THREE.BoxGeometry(treadLength, LOFT_FLOORBOARD, arcWidth),
        pineMat
      );
      tread.position.set(x, y - LOFT_FLOORBOARD / 2, z);
      tread.rotation.y = -angle;
      tread.castShadow = true;
      stairGroup.add(tread);

      const outerX = spiral.centerX + Math.cos(angle) * (spiral.radius + 0.03);
      const outerZ = spiral.centerZ + Math.sin(angle) * (spiral.radius + 0.03);
      railPoints.push(new THREE.Vector3(outerX, y + 0.9, outerZ));

      if (step % 3 === 0 || step === stepCount - 1) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.9, 0.03), pineMat);
        post.position.set(outerX, y + 0.45, outerZ);
        post.castShadow = true;
        stairGroup.add(post);
      }
    }

    if (railPoints.length > 1) {
      const railCurve = new THREE.CatmullRomCurve3(railPoints);
      const handrail = new THREE.Mesh(
        new THREE.TubeGeometry(railCurve, stepCount * 3, 0.022, 8, false),
        pineMat
      );
      handrail.castShadow = true;
      stairGroup.add(handrail);
    }

    stairGroup.userData.type = 'staircase';
    stairGroup.userData.position = this.currentConfig.loftStairPosition ?? 'front';
    this.addLoftPiece(stairGroup);
  }

  // --- Dimension Lines with 3D/Screen Coordinate Projection ---
  private buildDimensionLines(w: number, d: number, h: number) {
    const dimMat = new THREE.LineBasicMaterial({ color: '#1e293b', linewidth: 1.5 });
    const offset = 0.65;
    const totalH = this.currentConfig.heightMm / 1000;
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

    const xRight = w / 2 + offset;
    const xLeft = -w / 2 - offset;

    if (isGableRoof(this.currentConfig.roofType)) {
      // 2. Ridge Height / Total Height Dimension Line (at z = 0, ground to highest roof point)
      const rightRidgeGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xRight, 0, 0),
        new THREE.Vector3(xRight, totalH, 0)
      ]);
      this.dimensionsGroup.add(new THREE.Line(rightRidgeGeo, dimMat));
      this.dimensionAnchors.set('ridgeHeightRight', new THREE.Vector3(xRight, totalH / 2, 0));

      this.dimensionsGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(w / 2 + 0.1, 0, 0),
            new THREE.Vector3(xRight + 0.15, 0, 0)
          ]),
          dimMat
        )
      );
      this.dimensionsGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(w / 2 + 0.1, totalH, 0),
            new THREE.Vector3(xRight + 0.15, totalH, 0)
          ]),
          dimMat
        )
      );

      const leftRidgeGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xLeft, 0, 0),
        new THREE.Vector3(xLeft, totalH, 0)
      ]);
      this.dimensionsGroup.add(new THREE.Line(leftRidgeGeo, dimMat));
      this.dimensionAnchors.set('ridgeHeightLeft', new THREE.Vector3(xLeft, totalH / 2, 0));

      this.dimensionsGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-w / 2 - 0.1, 0, 0),
            new THREE.Vector3(xLeft - 0.15, 0, 0)
          ]),
          dimMat
        )
      );
      this.dimensionsGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-w / 2 - 0.1, totalH, 0),
            new THREE.Vector3(xLeft - 0.15, totalH, 0)
          ]),
          dimMat
        )
      );

      // 3. Eave Height Dimension Line (at zRight = d / 2, ground to eave plate)
      const zRight = d / 2;
      const rightHeightGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xRight, 0, zRight),
        new THREE.Vector3(xRight, h, zRight)
      ]);
      this.dimensionsGroup.add(new THREE.Line(rightHeightGeo, dimMat));
      this.dimensionAnchors.set('frontHeightRight', new THREE.Vector3(xRight, h / 2, zRight));

      this.dimensionsGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(w / 2 + 0.1, 0, zRight),
            new THREE.Vector3(xRight + 0.15, 0, zRight)
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

      const leftHeightGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xLeft, 0, zRight),
        new THREE.Vector3(xLeft, h, zRight)
      ]);
      this.dimensionsGroup.add(new THREE.Line(leftHeightGeo, dimMat));
      this.dimensionAnchors.set('frontHeightLeft', new THREE.Vector3(xLeft, h / 2, zRight));

      this.dimensionsGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-w / 2 - 0.1, 0, zRight),
            new THREE.Vector3(xLeft - 0.15, 0, zRight)
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
    } else if (this.currentConfig.roofType === 'pulpettak') {
      // 2. High End / Total Height Dimension Line (at zRight = d / 2, ground to highest roof point)
      const zRight = d / 2;
      const rightHeightGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xRight, 0, zRight),
        new THREE.Vector3(xRight, totalH, zRight)
      ]);
      this.dimensionsGroup.add(new THREE.Line(rightHeightGeo, dimMat));
      this.dimensionAnchors.set('frontHeightRight', new THREE.Vector3(xRight, totalH / 2, zRight));

      this.dimensionsGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(w / 2 + 0.1, 0, zRight),
            new THREE.Vector3(xRight + 0.15, 0, zRight)
          ]),
          dimMat
        )
      );
      this.dimensionsGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(w / 2 + 0.1, totalH, zRight),
            new THREE.Vector3(xRight + 0.15, totalH, zRight)
          ]),
          dimMat
        )
      );

      const leftHeightGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xLeft, 0, zRight),
        new THREE.Vector3(xLeft, totalH, zRight)
      ]);
      this.dimensionsGroup.add(new THREE.Line(leftHeightGeo, dimMat));
      this.dimensionAnchors.set('frontHeightLeft', new THREE.Vector3(xLeft, totalH / 2, zRight));

      this.dimensionsGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-w / 2 - 0.1, 0, zRight),
            new THREE.Vector3(xLeft - 0.15, 0, zRight)
          ]),
          dimMat
        )
      );
      this.dimensionsGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-w / 2 - 0.1, totalH, zRight),
            new THREE.Vector3(xLeft - 0.15, totalH, zRight)
          ]),
          dimMat
        )
      );

      // Rear Height Dimension Line (at zRear = -d / 2)
      const angleRad = PULPET_PITCH_RAD;
      const drop = Math.tan(angleRad) * d;
      const rearH = Math.max(h - drop, 1.8);
      const zRear = -d / 2;
      const rearHeightGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xLeft, 0, zRear),
        new THREE.Vector3(xLeft, rearH, zRear)
      ]);
      this.dimensionsGroup.add(new THREE.Line(rearHeightGeo, dimMat));
      this.dimensionAnchors.set(
        'rearHeightLeft',
        new THREE.Vector3(xLeft, rearH / 2, zRear)
      );

      const rearRightGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xRight, 0, zRear),
        new THREE.Vector3(xRight, rearH, zRear)
      ]);
      this.dimensionsGroup.add(new THREE.Line(rearRightGeo, dimMat));
      this.dimensionAnchors.set(
        'rearHeightRight',
        new THREE.Vector3(xRight, rearH / 2, zRear)
      );
      this.dimensionsGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(w / 2 + 0.1, 0, zRear),
            new THREE.Vector3(xRight + 0.15, 0, zRear)
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
            new THREE.Vector3(-w / 2 - 0.1, 0, zRear),
            new THREE.Vector3(xLeft - 0.15, 0, zRear)
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

      // Roof pitch angle indicator lines
      const midY = (h + rearH) / 2;
      const roofAngleLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xLeft, midY + 0.35, 0.4),
        new THREE.Vector3(xLeft, midY + 0.35 - Math.tan(angleRad) * 0.8, -0.4)
      ]);
      const angleMat = new THREE.LineBasicMaterial({ color: '#0f172a', linewidth: 2 });
      this.dimensionsGroup.add(new THREE.Line(roofAngleLineGeo, angleMat));

      const baseAngleLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xLeft, midY + 0.35 - Math.tan(angleRad) * 0.8, 0.4),
        new THREE.Vector3(xLeft, midY + 0.35 - Math.tan(angleRad) * 0.8, -0.4)
      ]);
      this.dimensionsGroup.add(new THREE.Line(baseAngleLineGeo, dimMat));

      const pitchA = new THREE.Vector3(xLeft, midY + 0.35, 0.4);
      const pitchB = new THREE.Vector3(xLeft, midY + 0.35 - Math.tan(angleRad) * 0.8, -0.4);
      this.dimensionAnchors.set('pitchLeft', pitchA.clone().lerp(pitchB, 0.5));

      const rightPitchGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xRight, midY + 0.35, 0.4),
        new THREE.Vector3(xRight, midY + 0.35 - Math.tan(angleRad) * 0.8, -0.4)
      ]);
      this.dimensionsGroup.add(new THREE.Line(rightPitchGeo, angleMat));
      const rightBaseGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xRight, midY + 0.35 - Math.tan(angleRad) * 0.8, 0.4),
        new THREE.Vector3(xRight, midY + 0.35 - Math.tan(angleRad) * 0.8, -0.4)
      ]);
      this.dimensionsGroup.add(new THREE.Line(rightBaseGeo, dimMat));
      const pitchC = new THREE.Vector3(xRight, midY + 0.35, 0.4);
      const pitchD = new THREE.Vector3(xRight, midY + 0.35 - Math.tan(angleRad) * 0.8, -0.4);
      this.dimensionAnchors.set('pitchRight', pitchC.clone().lerp(pitchD, 0.5));
    } else {
      // Shallow / flackt: Total Height Dimension Line
      const zRight = d / 2;
      const rightHeightGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xRight, 0, zRight),
        new THREE.Vector3(xRight, totalH, zRight)
      ]);
      this.dimensionsGroup.add(new THREE.Line(rightHeightGeo, dimMat));
      this.dimensionAnchors.set('frontHeightRight', new THREE.Vector3(xRight, totalH / 2, zRight));

      this.dimensionsGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(w / 2 + 0.1, 0, zRight),
            new THREE.Vector3(xRight + 0.15, 0, zRight)
          ]),
          dimMat
        )
      );
      this.dimensionsGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(w / 2 + 0.1, totalH, zRight),
            new THREE.Vector3(xRight + 0.15, totalH, zRight)
          ]),
          dimMat
        )
      );

      const leftHeightGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xLeft, 0, zRight),
        new THREE.Vector3(xLeft, totalH, zRight)
      ]);
      this.dimensionsGroup.add(new THREE.Line(leftHeightGeo, dimMat));
      this.dimensionAnchors.set('frontHeightLeft', new THREE.Vector3(xLeft, totalH / 2, zRight));

      this.dimensionsGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-w / 2 - 0.1, 0, zRight),
            new THREE.Vector3(xLeft - 0.15, 0, zRight)
          ]),
          dimMat
        )
      );
      this.dimensionsGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-w / 2 - 0.1, totalH, zRight),
            new THREE.Vector3(xLeft - 0.15, totalH, zRight)
          ]),
          dimMat
        )
      );
    }

    const ceilingY = 2.2 + eaveLiftMm(this.currentConfig.roofType) / 1000;
    this.dimensionAnchors.set('ceiling', new THREE.Vector3(0, ceilingY, 0));
    this.dimensionsGroup.visible = this.currentConfig.showDimensions;
  }

  private projectAnchor(point: THREE.Vector3, occlude = true) {
    const placed = this.shellNow.x === 1 && this.shellNow.y === 1 && this.shellNow.z === 1
      ? point
      : point.clone().multiply(this.shellNow);
    const proj = placed.clone().project(this.camera);
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const x = ((proj.x + 1) * width) / 2;
    const y = ((-proj.y + 1) * height) / 2;
    let visible = proj.z < 1 && x > -60 && x < width + 60 && y > -30 && y < height + 30;

    if (visible && occlude) {
      const direction = placed.clone().sub(this.camera.position);
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
    const hidden = { x: 0, y: 0, visible: false };
    if (!this.currentConfig.showDimensions || !this.outsideShell()) {
      const ceilingPoint = this.dimensionAnchors.get('ceiling');
      this.onDimensionLabels({
        width: hidden,
        frontHeight: hidden,
        rearHeight: hidden,
        pitch: hidden,
        ceiling:
          this.currentConfig.showDimensions && this.currentConfig.viewMode === 'insida' && ceilingPoint
            ? this.projectAnchor(ceilingPoint, false)
            : hidden
      });
      return;
    }

    const widthPoint = this.dimensionAnchors.get('width');
    const front = this.bestVisibleAnchor(['frontHeightLeft', 'frontHeightRight']);
    const rear =
      this.currentConfig.roofType === 'pulpettak'
        ? this.bestVisibleAnchor(['rearHeightLeft', 'rearHeightRight'])
        : isGableRoof(this.currentConfig.roofType)
          ? this.bestVisibleAnchor(['ridgeHeightLeft', 'ridgeHeightRight'])
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

  private updateFramingHoverBox(target: THREE.Object3D | null) {
    if (this.framingHoverBox) {
      this.scene.remove(this.framingHoverBox);
      this.framingHoverBox = null;
    }
    if (!target) return;

    const bbox = new THREE.Box3().setFromObject(target);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bbox.getSize(size);
    bbox.getCenter(center);

    const pad = 0.01;
    const boxGeo = new THREE.BoxGeometry(
      Math.max(0.02, size.x + pad),
      Math.max(0.02, size.y + pad),
      Math.max(0.02, size.z + pad)
    );
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({
      color: '#f59e0b',
      linewidth: 2,
      depthTest: false
    });
    const lineSegs = new THREE.LineSegments(edges, lineMat);
    lineSegs.renderOrder = 999;
    lineSegs.position.copy(center);
    this.framingHoverBox = lineSegs;
    this.scene.add(this.framingHoverBox);
  }

  private updateDragTargetBox(target: THREE.Object3D | null, valid: boolean, isDoorWithCanopy = false) {
    if (this.dragTargetBox) {
      this.scene.remove(this.dragTargetBox);
      this.dragTargetBox = null;
    }
    if (!target) return;

    const bbox = new THREE.Box3().setFromObject(target);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bbox.getSize(size);
    bbox.getCenter(center);

    const group = new THREE.Group();
    const color = valid ? '#10b981' : '#f43f5e';

    const boxGeo = new THREE.BoxGeometry(size.x + 0.05, size.y + 0.05, size.z + 0.05);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({
      color,
      linewidth: 3
    });
    group.add(new THREE.LineSegments(edges, lineMat));

    const glowMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: valid ? 0.22 : 0.32,
      depthWrite: false
    });
    group.add(new THREE.Mesh(boxGeo, glowMat));

    // If dragging a door and door roof is enabled, preview the door roof over the target bay
    if (isDoorWithCanopy && valid) {
      const pw = Math.max(size.x, size.z);
      const isXMajor = size.x > size.z;
      const wall = target.userData?.wall as 'front' | 'back' | 'left' | 'right' | undefined;
      const index = target.userData?.index as number | undefined;
      const count = wall
        ? this.panelCountForWall(wall, this.currentConfig.widthMm / 1000, this.currentConfig.depthMm / 1000)
        : 3;
      const cornerSide = (wall && typeof index === 'number')
        ? this.cornerSideForPanel(wall, index, count)
        : null;

      const layout = computeDoorCanopyLayout({
        doorX: 0,
        doorWidth: Math.min(1.0, pw - 0.2),
        panelWidth: pw,
        cornerSide
      });

      const canopyGeo = new THREE.BoxGeometry(
        isXMajor ? layout.width : 0.92,
        0.06,
        isXMajor ? 0.92 : layout.width
      );
      const canopyEdges = new THREE.EdgesGeometry(canopyGeo);
      const canopyWire = new THREE.LineSegments(canopyEdges, lineMat);
      const posX = isXMajor ? layout.canopyX : 0;
      const posZ = isXMajor ? 0 : layout.canopyX;
      canopyWire.position.set(posX, size.y / 2 + 0.22, posZ);
      group.add(canopyWire);

      const canopyMesh = new THREE.Mesh(canopyGeo, glowMat);
      canopyMesh.position.set(posX, size.y / 2 + 0.22, posZ);
      group.add(canopyMesh);
    }

    group.position.copy(center);
    this.dragTargetBox = group;
    this.scene.add(this.dragTargetBox);
  }

  public updateConfig(config: Partial<SceneConfig>) {
    const viewChanged =
      (config.viewMode !== undefined && config.viewMode !== this.currentConfig.viewMode) ||
      (config.loftView !== undefined && config.loftView !== this.currentConfig.loftView) ||
      (config.interiorView !== undefined && config.interiorView !== this.currentConfig.interiorView) ||
      (config.roofView !== undefined && config.roofView !== this.currentConfig.roofView);
    const heldPosition = this.camera.position.clone();
    const heldTarget = this.controls.target.clone();
    const keepOrbit = !viewChanged && !this.followFrame;
    const visualScale = this.houseGroup.scale.clone();
    const prevW = this.currentConfig.widthMm;
    const prevD = this.currentConfig.depthMm;
    const prevH = this.currentConfig.heightMm;
    this.ghostInstant = !viewChanged;
    const interactionChanged = config.interactionMode !== undefined && config.interactionMode !== this.currentConfig.interactionMode;
    if (
      (config.framingWalkthrough !== undefined || config.framingStep !== undefined) &&
      config.widthMm === undefined &&
      config.depthMm === undefined &&
      config.heightMm === undefined &&
      config.roofType === undefined &&
      config.wallSlots === undefined
    ) {
      Object.assign(this.currentConfig, config);
      this.applyViewMode();
      return;
    }
    if (config.showInnerWalls !== undefined && Object.keys(config).length === 1) {
      this.currentConfig.showInnerWalls = config.showInnerWalls;
      this.innerWallsGroup.visible = this.currentConfig.viewMode === 'blueprint'
        ? false
        : Boolean(config.showInnerWalls);
      if (this.currentConfig.viewMode === 'insida' || this.loftCutaway()) {
        this.framingGroup.visible = !config.showInnerWalls;
      } else {
        this.framingGroup.visible = false;
      }
      this.syncLoftStuds();
      return;
    }
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
    if (keepOrbit) {
      if (this.cameraFlight) {
        this.controls.minDistance = this.cameraFlight.restoreMin;
        this.camera.near = this.cameraFlight.restoreNear;
        this.camera.updateProjectionMatrix();
        this.cameraFlight = null;
      }
      this.camera.position.copy(heldPosition);
      this.controls.target.copy(heldTarget);
      this.controls.update();
    } else if (viewChanged) {
      this.followFrame = true;
    }
    this.easeShell(visualScale, prevW, prevD, prevH);
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

  /** The slope the loft room ceiling has to follow. */
  private roofSlope(): RoofSlope {
    const roof = this.currentConfig.roofType;
    if (roof === 'pulpettak') {
      const deg = this.currentConfig.pulpetPitchDeg ?? PULPET_PITCH_DEG;
      return { kind: 'shed', degrees: deg, anchor: 'front', minRear: 2.4 };
    }
    if (roof === 'flackt') return { kind: 'shed', degrees: 2, anchor: 'centre' };
    return { kind: 'gable', degrees: gablePitchDegrees(roof) };
  }

  /** Plate height for width-fall pulpet (high at +X / east). */
  private widthFallPlateY(worldX: number) {
    const w = this.currentConfig.widthMm / 1000;
    const h = this.wallTopM();
    const tan = Math.tan(this.pulpetPitchRad());
    const lowH = Math.max(h - tan * w, 1.8);
    const yMid = (h + lowH) / 2;
    return yMid + worldX * tan;
  }

  /**
   * Ceiling height in room-local Y above a loft floor.
   * Depth-fall roofs vary with Z; width-fall (Stugan) uses the lowest plate over the room's X span
   * so partition walls never pierce the mono-pitch.
   */
  private loftCeiling(roomZ: number, baseY: number, roomX = 0, roomW = 0) {
    const wallTop = this.wallTopM();
    if (this.roofFallsAlongWidth()) {
      const half = Math.max(roomW / 2, 0.01);
      const minX = roomX - half;
      const clear = this.widthFallPlateY(minX) - 0.16 - baseY;
      const capped = Math.max(0.6, Math.min(2.4, clear));
      return (_localZ: number) => capped;
    }
    const depth = this.currentConfig.depthMm / 1000;
    const slope = this.roofSlope();
    return (localZ: number) => loftCeilingY(slope, depth, wallTop, roomZ + localZ) - baseY;
  }

  private ceilingProfile(roomZ: number, z0: number, z1: number, ceiling: (localZ: number) => number): CeilingStation[] {
    return ceilingStations(this.roofSlope(), z0, z1, roomZ).map((at) => ({
      at,
      top: ceiling(at)
    }));
  }

  /** A wall whose top follows the roof. The profile runs along Z and the thickness is along X. */
  private addProfileWall(
    group: THREE.Group,
    stations: CeilingStation[],
    base: number,
    thick: number,
    x: number,
    side: string,
    wallMat: THREE.Material,
    edgeMat: THREE.Material
  ) {
    if (stations.length < 2) return;
    if (!stations.some((station) => station.top - base > 0.02)) return;
    const shape = new THREE.Shape();
    shape.moveTo(stations[0].at, base);
    shape.lineTo(stations[stations.length - 1].at, base);
    for (let i = stations.length - 1; i >= 0; i--) {
      shape.lineTo(stations[i].at, Math.max(stations[i].top, base));
    }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false });
    geo.translate(0, 0, -thick / 2);
    geo.rotateY(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, wallMat);
    mesh.position.x = x;
    mesh.userData.partition = side;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
    group.add(mesh);
  }

  private addLoftSide(
    group: THREE.Group,
    side: 'left' | 'right',
    x: number,
    z0: number,
    z1: number,
    roomZ: number,
    ceiling: (localZ: number) => number,
    withDoor: boolean,
    wallThick: number,
    wallBase: number,
    wallMat: THREE.Material,
    edgeMat: THREE.Material
  ) {
    if (z1 - z0 < 0.02) return;
    const stations = this.ceilingProfile(roomZ, z0, z1, ceiling);
    const minTop = Math.min(...stations.map((station) => station.top));
    const doorW = 0.8;
    const doorClear = minTop - wallBase;
    if (!withDoor || z1 - z0 < doorW + 0.24 || doorClear < 1.35) {
      this.addProfileWall(group, stations, wallBase, wallThick, x, side, wallMat, edgeMat);
      return;
    }
    const head = wallBase + Math.min(2.0, doorClear - 0.05);
    const mid = (z0 + z1) / 2;
    this.addProfileWall(group, sliceStations(stations, z0, mid - doorW / 2), wallBase, wallThick, x, side, wallMat, edgeMat);
    this.addProfileWall(group, sliceStations(stations, mid + doorW / 2, z1), wallBase, wallThick, x, side, wallMat, edgeMat);
    this.addProfileWall(
      group,
      sliceStations(stations, mid - doorW / 2, mid + doorW / 2),
      head,
      wallThick,
      x,
      side,
      wallMat,
      edgeMat
    );
  }

  private addLoftCeiling(
    group: THREE.Group,
    w: number,
    roomZ: number,
    ceiling: (localZ: number) => number,
    wallMat: THREE.Material,
    edgeMat: THREE.Material
  ) {
    const half = Number(group.userData.d) / 2;
    const stations = this.ceilingProfile(roomZ, -half, half, ceiling);
    for (let i = 0; i < stations.length - 1; i++) {
      const from = stations[i];
      const to = stations[i + 1];
      const length = to.at - from.at;
      if (length < 0.02) continue;
      const rise = to.top - from.top;
      const geo = new THREE.BoxGeometry(w, 0.02, Math.hypot(length, rise));
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(0, (from.top + to.top) / 2 - 0.01, (from.at + to.at) / 2);
      mesh.rotation.x = -Math.atan2(rise, length);
      mesh.userData.part = 'ceiling';
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
      group.add(mesh);
    }
  }

  /** Loft rooms keep their plan when the house is rebuilt, and take the new roof. */
  private refreshLoftRooms() {
    const rooms = this.interiorGroup.children
      .filter((child) => child.userData.type === 'room_zone' && isLoftRoom(child.position.y))
      .map((child) => ({
        id: child.userData.roomId as string,
        type: child.userData.roomType as string,
        w: Number(child.userData.w),
        d: Number(child.userData.d),
        x: child.position.x,
        y: child.position.y,
        z: child.position.z,
        wallsVisible: child.userData.wallsVisible !== false
      }));
    for (const room of rooms) {
      if (!Number.isFinite(room.w) || !Number.isFinite(room.d)) continue;
      this.updateRoomSize(room.id, room.type, room.w, room.d, room.x, room.y, room.z, room.wallsVisible);
    }
  }

  private createRoomGroup(
    roomType: string,
    w: number,
    d: number,
    open: ShellSides,
    place?: { x?: number; y: number; z: number },
    wallsVisible = true
  ): THREE.Group {
    const group = new THREE.Group();
    group.userData.type = 'room_zone';
    group.userData.roomType = roomType;
    group.userData.w = w;
    group.userData.d = d;
    group.userData.wallsVisible = wallsVisible;
    const loft = place && isLoftRoom(place.y) ? place : null;
    const ceiling = loft ? this.loftCeiling(loft.z, loft.y, loft.x ?? 0, w) : null;
    const widthFallLoft = Boolean(loft && this.roofFallsAlongWidth());

    const wallThick = 0.1;
    const wallH = 2.4;
    const wallBase = 0;
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x64748b });
    const wallRuns = roomWallRuns(w, d, open, wallThick);

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
      withDoor: boolean,
      height: number
    ) => {
      const doorW = 0.8;
      const headerH = Math.min(0.3, Math.max(0.12, height * 0.2));
      if (!withDoor || span < doorW + 0.24 || height < headerH + 0.4) {
        addPartition(side, span, height, center, wallBase + height / 2, fixed, axis);
        return;
      }
      const jamb = (span - doorW) / 2;
      addPartition(side, jamb, height, center - (doorW + jamb) / 2, wallBase + height / 2, fixed, axis);
      addPartition(side, jamb, height, center + (doorW + jamb) / 2, wallBase + height / 2, fixed, axis);
      addPartition(side, doorW, headerH, center, wallBase + height - headerH / 2, fixed, axis);
    };

    const doorOrder = (ceiling ? ['front', 'back', 'right', 'left'] : ['front', 'right', 'back', 'left']) as readonly (keyof ShellSides)[];
    const doorSide = doorOrder.find((side) => !open[side]);
    const edgeHeight = (localZ: number) => (ceiling ? ceiling(localZ) - wallBase : wallH);
    if (wallsVisible && !open.back) {
      const { size, center } = wallRuns.back;
      const z = -d / 2 + wallThick / 2;
      const height = edgeHeight(z);
      if (height > 0.02) addRun('back', size, center, z, 'x', doorSide === 'back' && height >= 1.35, height);
    }
    if (wallsVisible && !open.front) {
      const { size, center } = wallRuns.front;
      const z = d / 2 - wallThick / 2;
      const height = edgeHeight(z);
      if (height > 0.02) addRun('front', size, center, z, 'x', doorSide === 'front' && height >= 1.35, height);
    }
    if (wallsVisible && !open.left) {
      if (ceiling && loft && !widthFallLoft) {
        this.addLoftSide(
          group, 'left', -w / 2 + wallThick / 2,
          wallRuns.left.center - wallRuns.left.size / 2, wallRuns.left.center + wallRuns.left.size / 2,
          loft.z, ceiling, doorSide === 'left', wallThick, wallBase, wallMat, edgeMat
        );
      } else {
        const { size, center } = wallRuns.left;
        const hLeft = ceiling ? Math.min(wallH, Math.max(0.6, ceiling(0))) : wallH;
        addRun('left', size, center, -w / 2 + wallThick / 2, 'z', doorSide === 'left', hLeft);
      }
    }
    if (wallsVisible && !open.right) {
      if (ceiling && loft && !widthFallLoft) {
        this.addLoftSide(
          group, 'right', w / 2 - wallThick / 2,
          wallRuns.right.center - wallRuns.right.size / 2, wallRuns.right.center + wallRuns.right.size / 2,
          loft.z, ceiling, doorSide === 'right', wallThick, wallBase, wallMat, edgeMat
        );
      } else {
        const { size, center } = wallRuns.right;
        const hRight = ceiling ? Math.min(wallH, Math.max(0.6, ceiling(0))) : wallH;
        addRun('right', size, center, w / 2 - wallThick / 2, 'z', doorSide === 'right', hRight);
      }
    }
    if (wallsVisible && ceiling && loft) this.addLoftCeiling(group, w, loft.z, ceiling, wallMat, edgeMat);

    const edge = (againstShell: boolean) => (againstShell ? 0.08 : wallThick);
    const fitUp = (height: number, bottom: number, currentY: number) => {
      if (!ceiling) return { h: height, y: currentY };
      const limit = Math.min(ceiling(-d / 2), ceiling(0), ceiling(d / 2)) - 0.06;
      const h = Math.min(height, Math.max(0.05, limit - bottom));
      return { h, y: bottom + h / 2 };
    };
    if (roomType === 'bathroom') {
      const hasBackDoor = this.currentConfig.wallSlots?.['back-2']?.type === 'door' ||
        Object.values(this.currentConfig.wallSlots ?? {}).some((s) => s.wall === 'back' && s.type === 'door');
      const showerW = hasBackDoor ? 0.8 : 0.9;
      const showerD = hasBackDoor ? 0.85 : 0.9;
      const showerGeo = new THREE.BoxGeometry(showerW, 0.1, showerD);
      const showerMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1 });
      const shower = new THREE.Mesh(showerGeo, showerMat);
      const showerX = -w / 2 + showerW / 2 + edge(open.left);
      const showerZ = hasBackDoor ? 0 : -d / 2 + 0.45 + edge(open.back);
      shower.position.set(showerX, 0.05, showerZ);
      group.add(shower);
      const glassFit = fitUp(2.0, 0.1, 1.0);
      const glassGeo = hasBackDoor
        ? new THREE.BoxGeometry(0.02, glassFit.h, showerD)
        : new THREE.BoxGeometry(0.9, glassFit.h, 0.02);
      const glassMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.4 });
      const glass = new THREE.Mesh(glassGeo, glassMat);
      const glassX = hasBackDoor ? showerX + showerW / 2 : showerX;
      const glassZ = hasBackDoor ? 0 : -d / 2 + 0.9 + edge(open.back);
      glass.position.set(glassX, glassFit.y, glassZ);
      group.add(glass);

      const wcFit = fitUp(0.45, 0, 0.225);
      const wcGeo = new THREE.BoxGeometry(0.4, wcFit.h, 0.5);
      const wcMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const wc = new THREE.Mesh(wcGeo, wcMat);
      wc.position.set(w / 2 - 0.4 - edge(open.right), wcFit.y, -d / 2 + 0.25 + edge(open.back));
      group.add(wc);

      const sinkFit = fitUp(0.15, 0.775, 0.85);
      const sinkGeo = new THREE.BoxGeometry(0.6, sinkFit.h, 0.4);
      const sink = new THREE.Mesh(sinkGeo, wcMat);
      sink.position.set(w / 2 - 0.3 - edge(open.right), sinkFit.y, 0);
      group.add(sink);
    } else if (roomType === 'kitchen') {
      const counterFit = fitUp(0.9, 0, 0.45);
      const counterGeo = new THREE.BoxGeometry(Math.max(0.6, w - edge(open.left) - edge(open.right)), counterFit.h, 0.6);
      const counterMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
      const counter = new THREE.Mesh(counterGeo, counterMat);
      counter.position.set((edge(open.left) - edge(open.right)) / 2, counterFit.y, -d / 2 + 0.3 + edge(open.back));
      group.add(counter);
    } else if (roomType === 'bedroom') {
      const bedFit = fitUp(0.5, 0, 0.25);
      const { bedW, bedD, bedX, bedZ } = bedroomBedPlacement(
        w,
        d,
        open,
        place,
        this.shellLimits()
      );
      const bedGeo = new THREE.BoxGeometry(bedW, bedFit.h, bedD);
      const bedMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
      const bed = new THREE.Mesh(bedGeo, bedMat);
      bed.position.set(bedX, bedFit.y, bedZ);
      group.add(bed);
    }

    return group;
  }

  public updateRoomSize(roomId: string, expectedRoomType: string, w: number, d: number, x?: number, y?: number, z?: number, wallsVisible?: boolean) {
    const existing = this.interiorGroup.children.find(c => c.userData.type === 'room_zone' && c.userData.roomId === roomId);
    let currentX = x ?? 0;
    let currentY = y ?? 0.3;
    let currentZ = z ?? 0;
    let roomType = expectedRoomType;
    let showWalls = wallsVisible ?? true;

    if (existing) {
      currentX = existing.position.x;
      currentY = existing.position.y;
      currentZ = existing.position.z;
      roomType = existing.userData.roomType;
      showWalls = wallsVisible ?? existing.userData.wallsVisible !== false;
      this.disposeObject(existing);
      this.interiorGroup.remove(existing);
    }

    const nextY = y ?? currentY;
    const { hx, hz, bounds } = this.roomLimits(nextY);
    const fitted = fitRoom({ x: x ?? currentX, z: z ?? currentZ, w, d }, hx, hz, bounds);
    const newRoom = this.createRoomGroup(
      roomType,
      fitted.w,
      fitted.d,
      this.getRoomShellSides(fitted, hx, hz, nextY),
      { x: fitted.x, y: nextY, z: fitted.z },
      showWalls
    );
    newRoom.userData.roomId = roomId;
    newRoom.position.set(fitted.x, nextY, fitted.z);

    this.interiorGroup.add(newRoom);
    this.paintRoomSelection();
    this.syncLoftPresentation();
  }

  public removeRoom(roomId: string) {
    const existing = this.interiorGroup.children.find(c => c.userData.type === 'room_zone' && c.userData.roomId === roomId);
    if (existing) {
      this.disposeObject(existing);
      this.interiorGroup.remove(existing);
    }
    if (this.draggingRoom?.roomId === roomId) {
      this.cancelActiveDrag();
    }
    if (this.selectedRoomId === roomId) this.selectedRoomId = null;
    this.paintRoomSelection();
  }

  public pruneRooms(ids: string[]) {
    const keep = new Set(ids);
    const stale = this.interiorGroup.children
      .filter(child => child.userData.type === 'room_zone' && !keep.has(child.userData.roomId))
      .map(child => child.userData.roomId as string);
    for (const id of stale) this.removeRoom(id);
  }

  public setSelectedRoom(roomId: string | null) {
    this.selectedRoomId = roomId;
    this.paintRoomSelection();
  }

  private paintRoomSelection() {
    for (const group of this.interiorGroup.children) {
      if (group.userData.type !== 'room_zone') continue;
      const selected = group.userData.roomId === this.selectedRoomId;
      const seen = new Set<THREE.Material>();
      group.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        if (child.userData.partition == null && child.userData.part !== 'ceiling') return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          if (!(material instanceof THREE.MeshStandardMaterial) || seen.has(material)) return;
          seen.add(material);
          material.color.set(selected ? 0xd6def8 : 0xf8fafc);
          material.emissive.set(selected ? 0x1e293b : 0x000000);
          material.emissiveIntensity = selected ? 0.18 : 0;
        });
      });
    }
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
    if (active) {
      this.container.style.cursor = MEASURE_CURSOR;
      if (this.renderer?.domElement) {
        this.renderer.domElement.style.cursor = MEASURE_CURSOR;
      }
    } else {
      this.measureDown = null;
      this.container.style.cursor = 'default';
      if (this.renderer?.domElement) {
        this.renderer.domElement.style.cursor = 'default';
      }
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

  private rayFromScreen(clientX: number, clientY: number) {
    const rect = this.container.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return false;
    this.pickMouse.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(this.pickMouse, this.camera);
    return true;
  }

  /** Stable horizontal drag plane, independent of walls and furniture under the pointer. */
  private roomPointAt(clientX: number, clientY: number, y: number) {
    if (!this.rayFromScreen(clientX, clientY)) return null;
    this.roomMovePlane.constant = -y;
    const point = this.raycaster.ray.intersectPlane(this.roomMovePlane, this.roomMovePoint);
    return point ? { x: point.x, y, z: point.z } : null;
  }

  private finishRoomDrag(commit: boolean) {
    const drag = this.draggingRoom;
    if (!drag) return;
    const room = this.interiorGroup.children.find((child) => child.userData.roomId === drag.roomId);
    if (commit) {
      this.onRoomResize?.(
        drag.roomId,
        drag.startW,
        drag.startD,
        drag.currentX,
        drag.startY || 0.3,
        drag.currentZ
      );
    } else if (room) {
      room.position.set(drag.startX, drag.startY, drag.startZ);
    }
    this.draggingRoom = null;
    this.controls.enabled = true;
    this.container.style.cursor = 'default';
    this.syncLoftPresentation();
  }

  /** Keep the ground floor readable until a loft room needs the deck as context. */
  private syncLoftPresentation(instant = false) {
    const editingLoftRoom = this.roomPreviewGroup?.userData.onLoft === true
      || isLoftRoom(this.draggingRoom?.startY ?? 0);
    const goal = loftIsGhosted(this.currentConfig.viewMode, editingLoftRoom, this.loftCutaway()) ? 1 : 0;
    const arriving = this.ghostFlight?.to ?? this.ghostShown;
    if (instant || motionReduced()) {
      this.ghostShown = goal;
      this.ghostFlight = null;
    } else if (Math.abs(arriving - goal) > 0.001) {
      this.ghostFlight = {
        from: this.ghostShown,
        to: goal,
        started: performance.now(),
        duration: 760
      };
    }
    this.paintGhost();
  }

  private paintGhost() {
    this.presentGhost(this.loftGroup);
    this.interiorGroup.children.forEach((child) => {
      if (child.userData.type === 'room_zone' && isLoftRoom(child.position.y)) {
        this.presentGhost(child);
      }
    });
  }

  /** The same see-through treatment the loft deck uses in the interior overview. */
  private presentGhost(root: THREE.Object3D) {
    const blend = this.ghostShown;
    root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const meshState = this.loftMeshState.get(object) ?? {
          castShadow: object.castShadow,
          receiveShadow: object.receiveShadow,
          renderOrder: object.renderOrder
        };
        if (!this.loftMeshState.has(object)) this.loftMeshState.set(object, meshState);
        object.castShadow = blend > 0.5 ? false : meshState.castShadow;
        object.receiveShadow = blend > 0.5 ? false : meshState.receiveShadow;
        object.renderOrder = blend > 0.5 ? 1 : meshState.renderOrder;
      }
      if (
        !(object instanceof THREE.Mesh)
        && !(object instanceof THREE.Line)
        && !(object instanceof THREE.Points)
      ) return;

      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        const materialState = this.loftMaterialState.get(material) ?? {
          transparent: material.transparent,
          opacity: material.opacity,
          depthWrite: material.depthWrite
        };
        if (!this.loftMaterialState.has(material)) this.loftMaterialState.set(material, materialState);
        material.transparent = blend > 0.02 ? true : materialState.transparent;
        material.opacity = THREE.MathUtils.lerp(
          materialState.opacity,
          Math.min(materialState.opacity, 0.14),
          blend
        );
        material.depthWrite = blend > 0.02 ? false : materialState.depthWrite;
        material.needsUpdate = true;
      });
    });
  }

  private hitIsVisible(item: THREE.Intersection) {
    let object: THREE.Object3D | null = item.object;
    while (object) {
      if (!object.visible) return false;
      object = object.parent;
    }
    return true;
  }

  /** Terrace, porch roof, and door canopy are not part of the house shell. */
  private skipsNotes(object: THREE.Object3D) {
    let current: THREE.Object3D | null = object;
    while (current) {
      if (current.userData.skipNote) return true;
      current = current.parent;
    }
    return false;
  }

  private facingOf(hit: THREE.Intersection) {
    const facing = { x: 0, y: 0, z: 1 };
    if (!hit.face) return facing;
    this.notePoint.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
    if (this.notePoint.dot(this.raycaster.ray.direction) > 0) this.notePoint.negate();
    facing.x = this.notePoint.x;
    facing.y = this.notePoint.y;
    facing.z = this.notePoint.z;
    return facing;
  }

  private pointFromHit(hit: THREE.Intersection, snapFacing: boolean) {
    const point = hit.point.clone();
    const isGround = hit.object === this.groundMesh || Boolean(hit.object.userData?.isGround);
    if (isGround) {
      point.y = 0;
    }
    const raw = isGround ? { x: 0, y: 1, z: 0 } : this.facingOf(hit);
    const facing = snapFacing ? stickFacing(raw) : raw;
    return {
      x: Math.round(point.x * 1000) / 1000,
      y: Math.round(point.y * 1000) / 1000,
      z: Math.round(point.z * 1000) / 1000,
      nx: Math.round(facing.x * 1000) / 1000,
      ny: Math.round(facing.y * 1000) / 1000,
      nz: Math.round(facing.z * 1000) / 1000
    };
  }

  /** The house surface under a screen point, or nothing when the point is on the empty canvas. */
  public housePointAt(clientX: number, clientY: number) {
    if (!this.rayFromScreen(clientX, clientY)) return null;
    const targets: THREE.Object3D[] = [this.houseGroup];
    if (this.concreteGroup) targets.push(this.concreteGroup);
    if (this.groundMesh) targets.push(this.groundMesh);
    const hit = this.raycaster.intersectObjects(targets, true).find((item) => this.hitIsVisible(item));
    if (!hit) return null;
    return this.pointFromHit(hit, false);
  }

  /**
   * Where a post-it may stick. Porch decks, posts, and canopies are skipped
   * so the sheet lands on the wall or roof behind them.
   */
  public notePointAt(clientX: number, clientY: number) {
    if (!this.rayFromScreen(clientX, clientY)) return null;
    const hit = this.raycaster.intersectObjects([this.houseGroup], true).find((item) => {
      return this.hitIsVisible(item) && !this.skipsNotes(item.object);
    });
    if (!hit) return null;
    return {
      ...this.pointFromHit(hit, true),
      scope: this.outsideShell() ? 'outside' as const : 'inside' as const
    };
  }

  private anchorFor(id: string) {
    const shell = this.timberShell();
    const w = shell.widthM;
    const d = shell.depthM;
    const h = this.wallTopM();
    const mid = Math.max((h - 0.25) * 0.45, 0.8);
    if (id === 'roof') return this.notePoint.set(shell.x, (this.currentConfig.heightMm / 1000) + 0.1, shell.z);
    if (id === 'floor') return this.notePoint.set(shell.x, 0.4, shell.z);
    if (id === 'loft') {
      if (!this.currentConfig.hasLoft) return null;
      return this.notePoint.set(shell.x, h * 0.72, shell.z);
    }
    if (id === 'wall-front') return this.notePoint.set(shell.x, mid, shell.z + d / 2);
    if (id === 'wall-back') return this.notePoint.set(shell.x, mid, shell.z - d / 2);
    if (id === 'wall-left') return this.notePoint.set(shell.x - w / 2, mid, shell.z);
    if (id === 'wall-right') return this.notePoint.set(shell.x + w / 2, mid, shell.z);
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

  /** A porch post is too thin to hide a whole sheet. The deck and roof still do. */
  private noteOccluder(object: THREE.Object3D) {
    let porch = false;
    let current: THREE.Object3D | null = object;
    while (current) {
      if (current.userData.skipNote) porch = true;
      current = current.parent;
    }
    if (!porch) return true;
    const { geometry } = object as THREE.Mesh;
    if (!geometry) return true;
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    if (!box) return true;
    const size = [box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z];
    const thin = size.filter((item) => item < 0.2).length >= 2;
    return !thin;
  }

  private noteBlocked(point: THREE.Vector3) {
    const direction = point.clone().sub(this.camera.position);
    const distance = direction.length();
    if (distance < 0.2) return false;
    direction.normalize();
    this.labelRaycaster.set(this.camera.position, direction);
    this.labelRaycaster.far = Math.max(distance - 0.15, 0.01);
    return this.labelRaycaster.intersectObjects([this.wallsGroup, this.roofGroup], true)
      .some((hit) => this.noteOccluder(hit.object));
  }

  /** Move the green outline without rebuilding the house or moving the camera. */
  public setSelectedSlot(slotId: string | null) {
    this.currentConfig.selectedSlotId = slotId;
    if (!slotId || !this.outsideShell()) {
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

  private syncFramingWalkthrough() {
    this.updateFramingHoverBox(null);
    this.onFramingItemHover?.(null);
    const isWalkthrough = Boolean(this.currentConfig.framingWalkthrough);
    const step = Math.max(1, Math.min(7, this.currentConfig.framingStep ?? 1));

    const processGroup = (group: THREE.Group) => {
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.userData && typeof obj.userData.framingStep === 'number') {
          const meshStep = obj.userData.framingStep;
          const ownMat = (obj.userData.ownMaterial as THREE.Material | undefined) ?? this.builtFramingMat;
          if (!isWalkthrough) {
            obj.visible = true;
            obj.material = ownMat;
          } else if (meshStep > step) {
            obj.visible = false;
          } else {
            obj.visible = true;
            if (step === 7) {
              obj.material = ownMat;
            } else if (meshStep === step) {
              obj.material = this.activeFramingMat;
            } else {
              obj.material = ownMat;
            }
          }
        }
      });
    };

    processGroup(this.framingGroup);
    processGroup(this.trussesGroup);
  }

  private applyViewMode() {
    if (this.contactShadow) this.contactShadow.visible = true;

    if (this.currentConfig.framingWalkthrough) {
      this.wallsGroup.visible = false;
      this.roofGroup.visible = false;
      this.innerWallsGroup.visible = false;
      this.loftGroup.visible = false;
      this.dimensionsGroup.visible = false;
      this.interiorGroup.visible = false;
      this.framingGroup.visible = true;
      this.trussesGroup.visible = true;
      if (this.gridHelper) this.gridHelper.visible = false;
      this.syncFramingWalkthrough();
      return;
    }

    this.wallsGroup.visible = true;
    this.syncFramingWalkthrough();

    const showInner = this.currentConfig.showInnerWalls ?? true;
    if (this.ceilingDrywallGroup) {
      this.ceilingDrywallGroup.visible = !this.interiorCut() && !this.loftCutaway();
    }
    if (this.currentConfig.viewMode === 'blueprint') {
      this.roofGroup.visible = false;
      this.trussesGroup.visible = false;
      this.framingGroup.visible = false;
      this.innerWallsGroup.visible = false;
      this.loftGroup.visible = this.currentConfig.hasLoft;
      this.dimensionsGroup.visible = false;
      this.frameCamera(0, 14, 0, 0, 0, 0);

      if (!this.gridHelper) {
        this.gridHelper = new THREE.GridHelper(20, 40, 0x94a3b8, 0xe2e8f0);
        this.gridHelper.position.y = 0.01; // Slightly above floor
        this.scene.add(this.gridHelper);
      }
      this.gridHelper.visible = true;
    } else if (this.loftCutaway()) {
      this.roofGroup.visible = false;
      this.trussesGroup.visible = true;
      this.framingGroup.visible = !showInner;
      this.innerWallsGroup.visible = showInner;
      this.loftGroup.visible = true;
      this.dimensionsGroup.visible = false;
      this.frameCamera(3.4, 10.2, 6.4, 0, 1.55, -0.2);
      if (this.gridHelper) this.gridHelper.visible = false;
    } else if (this.currentConfig.viewMode === 'insida') {
      this.roofGroup.visible = false;
      this.trussesGroup.visible = false;
      this.framingGroup.visible = !showInner;
      this.innerWallsGroup.visible = showInner;
      this.loftGroup.visible = true;
      this.dimensionsGroup.visible = false;

      if (this.currentConfig.interiorView) this.frameInterior();
      else this.frameCamera(0, 7.5, 4.0, 0, 1.2, 0);
      if (this.gridHelper) this.gridHelper.visible = false;
    } else {
      this.roofGroup.visible = true;
      this.trussesGroup.visible = false;
      this.framingGroup.visible = false;
      this.innerWallsGroup.visible = showInner;
      this.loftGroup.visible = true;
      this.dimensionsGroup.visible = this.currentConfig.showDimensions;

      if (this.currentConfig.roofView) this.frameCamera(0, 10, 8, 0, 2.5, 0);
      else this.frameOutsideStart();

      if (this.gridHelper) this.gridHelper.visible = false;
    }
    // Keep rooms/furniture visible in outside mode so openings read as a lived-in house.
    this.interiorGroup.visible = true;
    this.syncOutsideAdditions();
    this.syncLoftPresentation(this.ghostInstant);
    this.syncLoftStuds();
    if (this.outsideShell()) {
      this.finishRoomDrag(false);
      this.clearRoomPreview();
      const slotId = this.currentConfig.selectedSlotId;
      if (slotId) {
        const mesh = this.interactivePanels.find((item) => item.userData.slotId === slotId);
        this.updateHighlightBox(mesh ? this.boundsOf(mesh) : null);
      }
    } else {
      this.updateHoverBox(null);
      this.updateHighlightBox(null);
      this.onPanelHover?.(null, 0, 0);
    }
  }

  /** The first outside view. A phone needs the whole house above the bottom sheet. */
  private frameOutsideStart() {
    const narrow = this.container.clientWidth < 1180;
    if (narrow) this.frameCamera(0, 6.5, 26, 0, 0.4, 0);
    else this.frameCamera(0, 3.2, 13.5, 0, 2.2, 0);
  }

  /** Ease the camera onto a framed pose. The first frame, and reduced motion, land at once. */
  private frameCamera(x: number, y: number, z: number, tx: number, ty: number, tz: number) {
    const inside = this.currentConfig.viewMode === 'insida';
    this.flyCamera(
      new THREE.Vector3(x, y, z),
      new THREE.Vector3(tx, ty, tz),
      inside ? 0.4 : 3.5,
      inside ? 0.05 : 0.1
    );
  }

  private flyCamera(position: THREE.Vector3, target: THREE.Vector3, minDistance: number, near: number) {
    const restoreMin = this.controls.minDistance;
    const restoreNear = this.camera.near;
    const travel = this.camera.position.distanceTo(position) + this.controls.target.distanceTo(target);
    if (!this.cameraReady || motionReduced() || travel < 0.05) {
      this.cameraFlight = null;
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.controls.minDistance = minDistance;
      this.camera.near = near;
      this.camera.updateProjectionMatrix();
      this.controls.update();
      return;
    }
    this.controls.minDistance = Math.min(restoreMin, minDistance);
    this.camera.near = Math.min(restoreNear, near);
    this.camera.updateProjectionMatrix();
    const distance = this.camera.position.distanceTo(position);
    this.cameraFlight = {
      fromPos: this.camera.position.clone(),
      toPos: position.clone(),
      fromTarget: this.controls.target.clone(),
      toTarget: target.clone(),
      started: performance.now(),
      duration: Math.round(Math.min(1040, Math.max(520, 480 + distance * 48))),
      minDistance,
      near,
      restoreMin,
      restoreNear
    };
  }

  private onControlStart = () => {
    if (this.cameraFlight) {
      this.controls.minDistance = this.cameraFlight.minDistance;
      this.camera.near = this.cameraFlight.near;
      this.camera.updateProjectionMatrix();
      this.cameraFlight = null;
    }
    this.followFrame = false;
  };

  private stepCameraFlight() {
    if (!this.cameraFlight) return;
    const running = stepCameraFlight(this.cameraFlight, this.camera, this.controls);
    if (!running) this.cameraFlight = null;
  }

  private stepGhost() {
    const flight = this.ghostFlight;
    if (!flight) return;
    const t = Math.min(1, (performance.now() - flight.started) / flight.duration);
    this.ghostShown = flight.from + (flight.to - flight.from) * easeInOutCubic(t);
    this.paintGhost();
    if (t >= 1) {
      this.ghostShown = flight.to;
      this.ghostFlight = null;
    }
  }

  /** Grow or shrink the shell from the size it just had, instead of popping. */
  private easeShell(visual: THREE.Vector3, prevW: number, prevD: number, prevH: number) {
    const w = this.currentConfig.widthMm || 1;
    const d = this.currentConfig.depthMm || 1;
    const h = this.currentConfig.heightMm || 1;
    const from = new THREE.Vector3(
      visual.x * prevW / w,
      visual.y * prevH / h,
      visual.z * prevD / d
    );
    const settled = Math.abs(from.x - 1) < 0.004
      && Math.abs(from.y - 1) < 0.004
      && Math.abs(from.z - 1) < 0.004;
    if (settled || motionReduced()) {
      this.shellFlight = null;
      this.applyShellScale(1, 1, 1);
      return;
    }
    this.applyShellScale(from.x, from.y, from.z);
    this.shellFlight = { from, started: performance.now(), duration: 720 };
  }

  private applyShellScale(x: number, y: number, z: number) {
    this.shellNow.set(x, y, z);
    this.houseGroup.scale.copy(this.shellNow);
    this.dimensionsGroup.scale.copy(this.shellNow);
    if (this.contactShadow) this.contactShadow.scale.set(x, z, 1);
  }

  private stepShell() {
    const flight = this.shellFlight;
    if (!flight) return;
    const t = Math.min(1, (performance.now() - flight.started) / flight.duration);
    const eased = easeInOutCubic(t);
    this.shellNow.copy(flight.from).lerp(new THREE.Vector3(1, 1, 1), eased);
    this.applyShellScale(this.shellNow.x, this.shellNow.y, this.shellNow.z);
    if (t < 1) return;
    this.applyShellScale(1, 1, 1);
    this.shellFlight = null;
  }

  /** Top view of the interior floor plan, used when Interior is open. */
  private frameInterior() {
    const span = Math.max(this.currentConfig.widthMm || 5000, this.currentConfig.depthMm || 4000) / 1000;
    const height = Math.max(span * 1.6, 14);
    this.frameCamera(0, height, 0.001, 0, 0, 0);
  }

  public reframeInterior() {
    this.followFrame = true;
    this.frameInterior();
  }

  /** Return the camera to the marked outside view, or the starting frame of this view. */
  public resetView() {
    if (this.currentConfig.framingWalkthrough) {
      this.frameFramingStep(this.currentConfig.framingStep ?? 1);
      return;
    }
    this.followFrame = true;
    const marked = this.defaultView;
    const outside = this.currentConfig.viewMode === 'utsida'
      && !this.currentConfig.roofView
      && !this.loftCutaway();
    if (marked && outside) {
      this.flyCamera(
        new THREE.Vector3(marked.x, marked.y, marked.z),
        new THREE.Vector3(marked.tx, marked.ty, marked.tz),
        3.5,
        0.1
      );
      return;
    }
    this.applyViewMode();
  }

  public zoomIn() {
    this.nudgeZoom(1.5);
  }

  public zoomOut() {
    this.nudgeZoom(-1.5);
  }

  private nudgeZoom(distance: number) {
    this.followFrame = false;
    if (this.cameraFlight) {
      this.controls.minDistance = this.cameraFlight.minDistance;
      this.camera.near = this.cameraFlight.near;
      this.camera.updateProjectionMatrix();
    }
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    this.flyCamera(
      this.camera.position.clone().addScaledVector(dir, distance),
      this.controls.target.clone(),
      this.controls.minDistance,
      this.camera.near
    );
  }

  /** Smoothly glide camera and focus on the current timber framing construction step */
  public frameFramingStep(step: number) {
    const clamped = Math.max(1, Math.min(7, Math.round(step || 1)));
    const shell = this.timberShell();
    const w = shell.widthM;
    const d = shell.depthM;
    const h = this.wallTopM();
    const cx = shell.x;
    const cz = shell.z;

    const isConcrete = Boolean(this.currentConfig.concreteBase && !this.concreteFoundationOnly());
    const cd = (this.currentConfig.concreteDepthMm ?? 5200) / 1000;
    const concreteFrontZ = cd - d / 2;
    const concreteH = isConcrete ? this.concreteCrownM() : 0.25;

    let target = new THREE.Vector3(cx, h * 0.45, cz);
    let pos = new THREE.Vector3(cx + w * 1.15, h * 1.15, cz + d * 1.35);

    if (isConcrete) {
      if (clamped === 1) {
        // Step 1: Concrete wall crown sill and slab extension transition
        target = new THREE.Vector3(cx - w * 0.15, concreteH * 0.7, cz);
        pos = new THREE.Vector3(cx - w * 1.25, concreteH + 2.2, cz + d * 1.1);
      } else if (clamped === 2) {
        // Step 2: Corner posts on concrete crown + interface studs with svällband
        target = new THREE.Vector3(cx - w / 2, concreteH * 0.8, cz + concreteFrontZ);
        pos = new THREE.Vector3(cx - w / 2 - 2.8, concreteH + 1.2, cz + concreteFrontZ + 2.4);
      } else if (clamped === 3) {
        // Step 3: Full-height front wall studs (up to 500 cm roof) & side transition
        target = new THREE.Vector3(cx, h * 0.5, cz + d * 0.35);
        pos = new THREE.Vector3(cx - w * 0.85, h * 0.65, cz + d * 0.95);
      } else if (clamped === 4) {
        // Step 4: Carrier beams across concrete wall crowns and front loft opening
        const midBeamZ = (concreteFrontZ + (d / 2 - 0.05)) / 2;
        target = new THREE.Vector3(cx, concreteH + 0.2, cz + midBeamZ);
        pos = new THREE.Vector3(cx + w * 0.8, concreteH + 1.8, cz + d * 0.85);
      } else if (clamped === 5) {
        // Step 5: Big loft floor joists and deck under 500 cm roof with partial concrete support
        const loftMidZ = (d / 2 - 0.05 + Math.max(-d / 2 + 1.2, concreteFrontZ - 1.5)) / 2;
        target = new THREE.Vector3(cx, concreteH + 0.6, cz + loftMidZ);
        pos = new THREE.Vector3(cx - w * 0.85, concreteH + 2.5, cz + d * 0.8);
      } else if (clamped === 6) {
        // Step 6: Mono-pitch rafters up to 500 cm over the loft, anchored into concrete
        target = new THREE.Vector3(cx, h * 0.75, cz + d * 0.15);
        pos = new THREE.Vector3(cx - w * 0.95, h * 1.25, cz + d * 0.85);
      } else {
        // Step 7: Complete frame audit with exterior drip flashing
        target = new THREE.Vector3(cx, h * 0.45, cz);
        pos = new THREE.Vector3(cx + w * 1.15, h * 1.15, cz + d * 1.35);
      }
    } else if (clamped === 1) {
      // Step 1: Sill detail looking down at front-left corner anchored to slab
      target = new THREE.Vector3(cx - w / 2 + 0.45, 0.35, cz + d / 2 - 0.45);
      pos = new THREE.Vector3(cx - w / 2 - 1.8, 1.45, cz + d / 2 + 2.0);
    } else if (clamped === 2) {
      // Step 2: Corner stud vertical plumb alignment
      target = new THREE.Vector3(cx - w / 2 + 0.1, h * 0.48, cz + d / 2 - 0.1);
      pos = new THREE.Vector3(cx - w / 2 - 2.2, h * 0.6, cz + d / 2 + 2.6);
    } else if (clamped === 3) {
      // Step 3: Regular wall studs cc 600 along front facade
      target = new THREE.Vector3(cx, h * 0.45, cz + d / 2);
      pos = new THREE.Vector3(cx - w * 0.45, h * 0.7, cz + d / 2 + 3.2);
    } else if (clamped === 4) {
      // Step 4: Window / door opening headers & trimmer jack studs
      const openings = this.frontOpenings(w, h, 0.25);
      const focusX = openings.length > 0 ? cx + openings[0].x : cx;
      target = new THREE.Vector3(focusX, 1.45, cz + d / 2);
      pos = new THREE.Vector3(focusX, 1.6, cz + d / 2 + 2.4);
    } else if (clamped === 5) {
      // Step 5: Hammarband (top plates) & staggered noggings
      target = new THREE.Vector3(cx, h * 0.75, cz + d * 0.1);
      pos = new THREE.Vector3(cx - w * 0.48, h * 1.35, cz + d / 2 + 3.2);
    } else if (clamped === 6) {
      // Step 6: Roof trusses and structural rafters
      target = new THREE.Vector3(cx, h + 0.3, cz);
      pos = new THREE.Vector3(cx - w * 0.65, h * 1.55, cz + d * 0.95);
    } else {
      // Step 7: Complete timber skeleton audit
      target = new THREE.Vector3(cx, h * 0.42, cz);
      pos = new THREE.Vector3(cx + w * 1.15, h * 1.15, cz + d * 1.35);
    }

    this.flyCamera(pos, target, 0.6, 0.05);
  }

  public getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  /**
   * Point the camera at one exterior face and return a function that puts the
   * user's view back. The capture reads the canvas before that restore runs.
   */
  public prepareFacingCapture(facing: 'front' | 'back' | 'left' | 'right') {
    const position = this.camera.position.clone();
    const target = this.controls.target.clone();
    const { near } = this.camera;
    const { minDistance } = this.controls;
    const flight = this.cameraFlight;
    const roof = this.roofGroup.visible;
    const trusses = this.trussesGroup.visible;
    const framing = this.framingGroup.visible;
    this.cameraFlight = null;
    this.roofGroup.visible = true;
    this.trussesGroup.visible = false;
    this.framingGroup.visible = false;

    const { cameraPosition, targetY } = calculateFacingPose(
      facing,
      this.currentConfig.widthMm,
      this.currentConfig.depthMm,
      this.currentConfig.heightMm
    );
    this.controls.minDistance = 0.1;
    this.camera.near = 0.1;
    this.camera.position.set(...cameraPosition);
    this.controls.target.set(0, targetY, 0);
    this.camera.lookAt(0, targetY, 0);
    this.camera.updateProjectionMatrix();

    return () => {
      this.roofGroup.visible = roof;
      this.trussesGroup.visible = trusses;
      this.framingGroup.visible = framing;
      this.camera.near = near;
      this.controls.minDistance = minDistance;
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.camera.updateProjectionMatrix();
      this.cameraFlight = flight;
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
  }

  /** Draw the current frame before a thumbnail read. The animation loop may not have painted yet. */
  public renderStill() {
    this.renderer.render(this.scene, this.camera);
  }

  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.stepCameraFlight();
    this.stepGhost();
    this.stepShell();
    this.renderer.render(this.scene, this.camera);
    this.publishDimensionLabels();
    this.publishNoteAnchors();
    this.publishNotePlanes();
    this.publishMeasure();
    this.publishCompassDial();

    // Update screen coordinates of selected panel for dynamic overlay tracking
    if (this.outsideShell() && this.currentConfig.selectedSlotId && this.onSlotScreenPositionUpdate) {
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
    this.cancelActiveDrag();
    window.removeEventListener('resize', this.onResize);
    this.controls.removeEventListener('start', this.onControlStart);
    if (this.dragTargetBox) {
      this.scene.remove(this.dragTargetBox);
      this.dragTargetBox = null;
    }
    this.updateFramingHoverBox(null);
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.groundMesh = null;
    this.renderer.dispose();
  }
}
