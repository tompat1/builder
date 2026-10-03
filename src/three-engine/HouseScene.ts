import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface SceneConfig {
  widthMm: number;
  depthMm: number;
  heightMm: number;
  roofType: 'pulpettak' | 'sadeltak' | 'flackt';
  hasLoft: boolean;
  viewMode: 'utsida' | 'insida';
}

export class HouseScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private houseGroup: THREE.Group;
  private roofGroup: THREE.Group;
  private loftGroup: THREE.Group;
  private animFrameId: number | null = null;
  private currentConfig: SceneConfig;

  // Materials
  private wallMaterial: THREE.MeshStandardMaterial;
  private interiorWallMaterial: THREE.MeshStandardMaterial;
  private floorMaterial: THREE.MeshStandardMaterial;
  private roofMaterial: THREE.MeshStandardMaterial;
  private loftWoodMaterial: THREE.MeshStandardMaterial;
  private foundationMaterial: THREE.MeshStandardMaterial;

  constructor(container: HTMLElement, initialConfig?: Partial<SceneConfig>) {
    this.currentConfig = {
      widthMm: initialConfig?.widthMm ?? 6040,
      depthMm: initialConfig?.depthMm ?? 3503,
      heightMm: initialConfig?.heightMm ?? 3100,
      roofType: initialConfig?.roofType ?? 'pulpettak',
      hasLoft: initialConfig?.hasLoft ?? false,
      viewMode: initialConfig?.viewMode ?? 'utsida'
    };

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#f8fafc');

    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      1000
    );
    this.camera.position.set(11, 7, 13);

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
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent underground clipping
    this.controls.minDistance = 4;
    this.controls.maxDistance = 35;
    this.controls.target.set(0, 1.5, 0);

    // Initialize materials
    this.wallMaterial = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.65,
      metalness: 0.05
    });

    this.interiorWallMaterial = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.8
    });

    this.floorMaterial = new THREE.MeshStandardMaterial({
      color: '#d6c5ad',
      roughness: 0.55
    });

    this.roofMaterial = new THREE.MeshStandardMaterial({
      color: '#1f2937',
      roughness: 0.35,
      metalness: 0.25
    });

    this.loftWoodMaterial = new THREE.MeshStandardMaterial({
      color: '#c4a47c',
      roughness: 0.5
    });

    this.foundationMaterial = new THREE.MeshStandardMaterial({
      color: '#94a3b8',
      roughness: 0.9
    });

    this.setupEnvironment();

    this.houseGroup = new THREE.Group();
    this.roofGroup = new THREE.Group();
    this.loftGroup = new THREE.Group();

    this.houseGroup.add(this.roofGroup);
    this.houseGroup.add(this.loftGroup);
    this.scene.add(this.houseGroup);

    this.rebuildScene();
    this.animate();

    window.addEventListener('resize', () => this.onResize(container));
  }

  private setupEnvironment() {
    // Ambient soft daylight
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    // Sun key light
    const sunLight = new THREE.DirectionalLight(0xfff8ee, 1.0);
    sunLight.position.set(16, 22, 12);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 60;
    sunLight.shadow.camera.left = -15;
    sunLight.shadow.camera.right = 15;
    sunLight.shadow.camera.top = 15;
    sunLight.shadow.camera.bottom = -15;
    sunLight.shadow.bias = -0.0003;
    this.scene.add(sunLight);

    // Sky bounce fill
    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.45);
    fillLight.position.set(-12, 14, -10);
    this.scene.add(fillLight);

    // Ground platform grid
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
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

  public rebuildScene() {
    // Clear dynamic groups
    while (this.houseGroup.children.length > 0) {
      this.houseGroup.remove(this.houseGroup.children[0]);
    }
    while (this.roofGroup.children.length > 0) {
      this.roofGroup.remove(this.roofGroup.children[0]);
    }
    while (this.loftGroup.children.length > 0) {
      this.loftGroup.remove(this.loftGroup.children[0]);
    }

    this.houseGroup.add(this.roofGroup);
    this.houseGroup.add(this.loftGroup);

    const w = this.currentConfig.widthMm / 1000;
    const d = this.currentConfig.depthMm / 1000;
    const h = this.currentConfig.heightMm / 1000;
    const wallThick = 0.2;

    // 1. Concrete foundation slab
    const slabGeo = new THREE.BoxGeometry(w + 0.3, 0.25, d + 0.3);
    const slab = new THREE.Mesh(slabGeo, this.foundationMaterial);
    slab.position.set(0, 0.125, 0);
    slab.receiveShadow = true;
    slab.castShadow = true;
    this.houseGroup.add(slab);

    // 2. Interior Floor
    const floorGeo = new THREE.BoxGeometry(w - wallThick * 2, 0.05, d - wallThick * 2);
    const floor = new THREE.Mesh(floorGeo, this.floorMaterial);
    floor.position.set(0, 0.275, 0);
    floor.receiveShadow = true;
    this.houseGroup.add(floor);

    // 3. Walls
    const wallHeight = h - 0.25;
    const wallY = 0.25 + wallHeight / 2;

    // Back wall
    const backGeo = new THREE.BoxGeometry(w, wallHeight, wallThick);
    const backWall = new THREE.Mesh(backGeo, this.wallMaterial);
    backWall.position.set(0, wallY, -d / 2 + wallThick / 2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.houseGroup.add(backWall);

    // Left wall
    const sideGeo = new THREE.BoxGeometry(wallThick, wallHeight, d - wallThick * 2);
    const leftWall = new THREE.Mesh(sideGeo, this.wallMaterial);
    leftWall.position.set(-w / 2 + wallThick / 2, wallY, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.houseGroup.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(sideGeo, this.wallMaterial);
    rightWall.position.set(w / 2 - wallThick / 2, wallY, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.houseGroup.add(rightWall);

    // Front wall with entryway cutout
    const frontWidthLeft = (w - 1.4) / 2;
    const frontGeoSide = new THREE.BoxGeometry(frontWidthLeft, wallHeight, wallThick);

    const frontLeft = new THREE.Mesh(frontGeoSide, this.wallMaterial);
    frontLeft.position.set(-w / 2 + frontWidthLeft / 2, wallY, d / 2 - wallThick / 2);
    frontLeft.castShadow = true;
    frontLeft.receiveShadow = true;
    this.houseGroup.add(frontLeft);

    const frontRight = new THREE.Mesh(frontGeoSide, this.wallMaterial);
    frontRight.position.set(w / 2 - frontWidthLeft / 2, wallY, d / 2 - wallThick / 2);
    frontRight.castShadow = true;
    frontRight.receiveShadow = true;
    this.houseGroup.add(frontRight);

    // Header over door
    const lintelHeight = wallHeight - 2.1;
    if (lintelHeight > 0.1) {
      const lintelGeo = new THREE.BoxGeometry(1.4, lintelHeight, wallThick);
      const lintel = new THREE.Mesh(lintelGeo, this.wallMaterial);
      lintel.position.set(0, 0.25 + 2.1 + lintelHeight / 2, d / 2 - wallThick / 2);
      lintel.castShadow = true;
      this.houseGroup.add(lintel);
    }

    // Door panel simulation
    const doorGeo = new THREE.BoxGeometry(1.0, 2.05, 0.08);
    const doorMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.4 });
    const doorMesh = new THREE.Mesh(doorGeo, doorMat);
    doorMesh.position.set(0, 0.25 + 1.025, d / 2 - wallThick / 2);
    doorMesh.castShadow = true;
    this.houseGroup.add(doorMesh);

    // 4. Roof Construction
    this.buildRoof(w, d, h);

    // 5. Loft Construction
    if (this.currentConfig.hasLoft) {
      this.buildLoft(w, d, h, wallThick);
    }

    // Update view mode visibility
    this.applyViewMode();
  }

  private buildRoof(w: number, d: number, h: number) {
    const roofType = this.currentConfig.roofType;
    const overhang = 0.35;

    if (roofType === 'sadeltak') {
      // Gabled Roof
      const ridgeHeight = 1.1;
      const roofLen = d + overhang * 2;
      const roofHalfW = (w / 2 + overhang) * 1.08;

      // Left slope
      const slopeGeo = new THREE.BoxGeometry(roofHalfW, 0.16, roofLen);
      const leftSlope = new THREE.Mesh(slopeGeo, this.roofMaterial);
      leftSlope.position.set(-roofHalfW / 2 + 0.1, h + ridgeHeight / 2, 0);
      leftSlope.rotation.z = 0.38;
      leftSlope.castShadow = true;
      this.roofGroup.add(leftSlope);

      // Right slope
      const rightSlope = new THREE.Mesh(slopeGeo, this.roofMaterial);
      rightSlope.position.set(roofHalfW / 2 - 0.1, h + ridgeHeight / 2, 0);
      rightSlope.rotation.z = -0.38;
      rightSlope.castShadow = true;
      this.roofGroup.add(rightSlope);
    } else if (roofType === 'flackt') {
      // Flat Parapet Modern Roof
      const flatGeo = new THREE.BoxGeometry(w + 0.2, 0.22, d + 0.2);
      const flatMesh = new THREE.Mesh(flatGeo, this.roofMaterial);
      flatMesh.position.set(0, h + 0.11, 0);
      flatMesh.castShadow = true;
      this.roofGroup.add(flatMesh);
    } else {
      // Pulpettak (Monopitch shed roof)
      const roofGeo = new THREE.BoxGeometry(w + overhang * 2, 0.18, d + overhang * 2);
      const roofMesh = new THREE.Mesh(roofGeo, this.roofMaterial);
      roofMesh.position.set(0, h + 0.2, 0);
      roofMesh.rotation.x = 0.08;
      roofMesh.castShadow = true;
      this.roofGroup.add(roofMesh);
    }
  }

  private buildLoft(w: number, d: number, h: number, wallThick: number) {
    const loftW = w * 0.45;
    const loftD = d - wallThick * 2 - 0.1;
    const loftH = 0.12;
    const loftElevation = h * 0.58;

    // Loft floor slab
    const loftFloorGeo = new THREE.BoxGeometry(loftW, loftH, loftD);
    const loftFloor = new THREE.Mesh(loftFloorGeo, this.loftWoodMaterial);
    loftFloor.position.set(-w / 2 + wallThick + loftW / 2, loftElevation, 0);
    loftFloor.castShadow = true;
    loftFloor.receiveShadow = true;
    this.loftGroup.add(loftFloor);

    // Loft railing
    const railPostGeo = new THREE.BoxGeometry(0.04, 0.7, 0.04);
    const railX = -w / 2 + wallThick + loftW;
    const postCount = 4;
    for (let i = 0; i < postCount; i++) {
      const pz = -loftD / 2 + (loftD / (postCount - 1)) * i;
      const post = new THREE.Mesh(railPostGeo, this.loftWoodMaterial);
      post.position.set(railX, loftElevation + 0.35, pz);
      this.loftGroup.add(post);
    }

    const handrailGeo = new THREE.BoxGeometry(0.05, 0.04, loftD);
    const handrail = new THREE.Mesh(handrailGeo, this.loftWoodMaterial);
    handrail.position.set(railX, loftElevation + 0.7, 0);
    this.loftGroup.add(handrail);
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
      this.camera.position.set(0, 4.2, 5.5);
      this.controls.target.set(0, 1.4, 0);
    } else {
      this.roofGroup.visible = true;
      this.camera.position.set(11, 7, 13);
      this.controls.target.set(0, 1.5, 0);
    }
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

  private onResize(container: HTMLElement) {
    if (!container) return;
    this.camera.aspect = container.clientWidth / Math.max(container.clientHeight, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  public destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.renderer.dispose();
  }
}
