import * as THREE from 'three';
import { CharacterCustomization, CityNPC, VehicleData, InteractiveZone } from '../types/game';
import { soundManager } from '../audio/soundManager';

export class CityScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;
  private clock: THREE.Clock;

  // Player & Movement
  public playerGroup: THREE.Group;
  private playerBodyParts: {
    head: THREE.Mesh;
    torso: THREE.Mesh;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    hairMesh?: THREE.Mesh;
    hatMesh?: THREE.Mesh;
    accessoryMesh?: THREE.Mesh;
  } = {} as any;

  public playerPos = new THREE.Vector3(0, 0, 0);
  public playerVelocity = new THREE.Vector3();
  public playerHeading = 0;
  public isGrounded = true;
  public isMoving = false;
  public isDancing = false;
  public isSitting = false;
  public isWaving = false;
  public waveTime = 0;

  // Active Vehicle
  public activeVehicle: THREE.Group | null = null;
  public vehicleSpeed = 0;
  public vehicleHeading = 0;
  public vehicleData: VehicleData | null = null;

  // Camera Orbit
  public cameraDistance = 12;
  public cameraPitch = 0.45; // angle above horizon
  public cameraYaw = 0;
  private isPointerDown = false;
  private prevPointerX = 0;
  private prevPointerY = 0;

  // Keys & Virtual Movement Input
  public keys: { [key: string]: boolean } = {};
  public virtualMove = { x: 0, z: 0 };

  // NPCs
  public npcs: { data: CityNPC; group: THREE.Group; targetPos: THREE.Vector3; waitTimer: number }[] = [];

  // Vehicles in World
  public worldVehicles: { data: VehicleData; group: THREE.Group; wheels: THREE.Mesh[] }[] = [];

  // Interactive Zones
  public interactiveZones: InteractiveZone[] = [];
  public nearestZone: InteractiveZone | null = null;

  // Environment elements
  private discoLights: THREE.PointLight[] = [];
  private fountainParticles: THREE.Points | null = null;
  private fireworkParticles: { group: THREE.Group; particles: THREE.Points; life: number; maxLife: number }[] = [];
  private dayNightTime = 0.25; // 0 to 1 (0.25 is afternoon)
  private dirLight!: THREE.DirectionalLight;
  private ambientLight!: THREE.AmbientLight;
  private streetLamps: THREE.PointLight[] = [];

  // Callbacks
  public onNearestZoneChange?: (zone: InteractiveZone | null) => void;
  public onNPCInteract?: (npc: CityNPC) => void;
  public onEnterVehicle?: (vehicle: VehicleData) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.FogExp2(0x9bd4f5, 0.007);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Player Group
    this.playerGroup = new THREE.Group();
    this.scene.add(this.playerGroup);

    // Setup World
    this.setupLighting();
    this.buildCity();
    this.setupPlayerMesh();
    this.setupNPCs();
    this.setupWorldVehicles();
    this.setupFountain();

    // Event listeners
    this.setupEventListeners();

    // Start loop
    this.animate();
  }

  private setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xfff3d6, 1.2);
    this.dirLight.position.set(60, 100, 40);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 300;
    this.dirLight.shadow.camera.left = -90;
    this.dirLight.shadow.camera.right = 90;
    this.dirLight.shadow.camera.top = 90;
    this.dirLight.shadow.camera.bottom = -90;
    this.scene.add(this.dirLight);
  }

  private buildCity() {
    // Ground Grass - Astro Place
    const groundGeo = new THREE.PlaneGeometry(280, 360);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x5da845 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.x = -40;
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Ground Grass - Astro LAX
    const laxGroundGeo = new THREE.PlaneGeometry(180, 360);
    const laxGroundMat = new THREE.MeshLambertMaterial({ color: 0x489635 });
    const laxGround = new THREE.Mesh(laxGroundGeo, laxGroundMat);
    laxGround.position.x = 240;
    laxGround.rotation.x = -Math.PI / 2;
    laxGround.receiveShadow = true;
    this.scene.add(laxGround);

    // Road Grid Layout
    this.createRoads();

    // Astro Place Core Buildings
    this.createPizzaPlace(new THREE.Vector3(-38, 0, -35));
    this.createHospital(new THREE.Vector3(38, 0, -35));
    this.createSupermarketAndCafe(new THREE.Vector3(-38, 0, 35));
    this.createPoliceStation(new THREE.Vector3(38, 0, 35));
    this.createDealership(new THREE.Vector3(60, 0, 0));
    this.createFashionBoutique(new THREE.Vector3(-65, 0, 0));
    this.createPartyVilla(new THREE.Vector3(0, 0, 85));
    this.createPlayerEstates(new THREE.Vector3(0, 0, -85));

    // Astro LAX River, Large Bridge & New City Expansion
    this.createAstroLAXWaterAndBridge();
    this.createChineseRestaurant(new THREE.Vector3(235, 0, -45));
    this.createIndianRestaurant(new THREE.Vector3(235, 0, 45));
    this.createLAXPizzaCafe(new THREE.Vector3(205, 0, -85));
    this.createMegaMansion(new THREE.Vector3(285, 0, 0));
    this.decorateAstroLAX();

    // Central Plaza & Park
    this.createCentralPlaza();

    // Trees, Lamps, Benches throughout city
    this.decorateCity();
  }

  private createRoads() {
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x333538 });
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffe600 });
    const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0xd8dcd6 });

    // Main Avenue (North-South)
    const roadZ = new THREE.Mesh(new THREE.PlaneGeometry(16, 260), roadMat);
    roadZ.rotation.x = -Math.PI / 2;
    roadZ.position.y = 0.02;
    roadZ.receiveShadow = true;
    this.scene.add(roadZ);

    // Main Avenue (East-West)
    const roadX = new THREE.Mesh(new THREE.PlaneGeometry(260, 16), roadMat);
    roadX.rotation.x = -Math.PI / 2;
    roadX.position.y = 0.02;
    roadX.receiveShadow = true;
    this.scene.add(roadX);

    // Inner Ring Sidewalk around Central Plaza
    const plazaPavement = new THREE.Mesh(new THREE.BoxGeometry(48, 0.2, 48), sidewalkMat);
    plazaPavement.position.set(0, 0.1, 0);
    plazaPavement.receiveShadow = true;
    this.scene.add(plazaPavement);

    // Yellow Dashed lines
    for (let z = -120; z <= 120; z += 8) {
      if (Math.abs(z) < 26) continue;
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 4), lineMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(0, 0.03, z);
      this.scene.add(stripe);
    }
    for (let x = -120; x <= 120; x += 8) {
      if (Math.abs(x) < 26) continue;
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.8), lineMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(x, 0.03, 0);
      this.scene.add(stripe);
    }
  }

  private createCentralPlaza() {
    // Grand Water Fountain
    const fountainGroup = new THREE.Group();
    fountainGroup.position.set(0, 0, 0);

    const baseGeo = new THREE.CylinderGeometry(8, 9, 1.2, 16);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0xe0e5eb });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.6;
    base.castShadow = true;
    base.receiveShadow = true;
    fountainGroup.add(base);

    const waterGeo = new THREE.CylinderGeometry(7.6, 7.6, 0.2, 16);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x00bcd4,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.y = 1.1;
    fountainGroup.add(water);

    // Tier 2
    const pillarGeo = new THREE.CylinderGeometry(1.4, 1.6, 3, 12);
    const pillar = new THREE.Mesh(pillarGeo, baseMat);
    pillar.position.y = 2.5;
    pillar.castShadow = true;
    fountainGroup.add(pillar);

    const bowlGeo = new THREE.CylinderGeometry(3.5, 2, 0.8, 12);
    const bowl = new THREE.Mesh(bowlGeo, baseMat);
    bowl.position.y = 3.6;
    bowl.castShadow = true;
    fountainGroup.add(bowl);

    // Golden Astro Star on top of fountain
    const starGeo = new THREE.OctahedronGeometry(1.2, 0);
    const starMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.8 });
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.y = 5.2;
    fountainGroup.add(star);

    this.scene.add(fountainGroup);

    // Park benches and flowerbeds in corners of plaza
    const benchPositions: [number, number, number, number][] = [
      [14, 0, 14, Math.PI / 4],
      [-14, 0, 14, -Math.PI / 4],
      [14, 0, -14, (3 * Math.PI) / 4],
      [-14, 0, -14, -(3 * Math.PI) / 4],
    ];

    benchPositions.forEach(([bx, by, bz, rot]) => {
      this.createBench(new THREE.Vector3(bx, by, bz), rot);
    });

    // Street Food Cart in Plaza
    this.createFoodCart(new THREE.Vector3(12, 0, -4));
  }

  private setupFountain() {
    // Water spray particles
    const particleCount = 120;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = 4.5 + Math.random() * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x90caf9,
      size: 0.25,
      transparent: true,
      opacity: 0.8,
    });

    this.fountainParticles = new THREE.Points(geo, mat);
    this.scene.add(this.fountainParticles);
  }

  // BUILDINGS

  private createPizzaPlace(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Foundation
    const pad = new THREE.Mesh(new THREE.BoxGeometry(26, 0.4, 24), new THREE.MeshLambertMaterial({ color: 0xcccccc }));
    pad.position.y = 0.2;
    group.add(pad);

    // Main Pizza Building
    const walls = new THREE.Mesh(new THREE.BoxGeometry(22, 10, 20), new THREE.MeshLambertMaterial({ color: 0xef5350 }));
    walls.position.y = 5.2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    group.add(walls);

    // Roof Trim
    const roof = new THREE.Mesh(new THREE.BoxGeometry(23.6, 1.2, 21.6), new THREE.MeshLambertMaterial({ color: 0xd32f2f }));
    roof.position.y = 10.6;
    roof.castShadow = true;
    group.add(roof);

    // Big Giant 3D Pizza on the Roof
    const pizzaGeo = new THREE.CylinderGeometry(5, 5, 0.6, 24);
    const pizzaMat = new THREE.MeshLambertMaterial({ color: 0xfbc02d });
    const giantPizza = new THREE.Mesh(pizzaGeo, pizzaMat);
    giantPizza.rotation.x = Math.PI / 4;
    giantPizza.position.set(0, 14.5, 0);
    giantPizza.castShadow = true;
    group.add(giantPizza);

    // Pepperonis on giant pizza
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const pep = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.7, 12), new THREE.MeshLambertMaterial({ color: 0xb71c1c }));
      pep.position.set(Math.cos(angle) * 3, 0.1, Math.sin(angle) * 3);
      giantPizza.add(pep);
    }

    // Signboard
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(14, 2.5, 0.8), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    signBoard.position.set(0, 8.8, 10.4);
    group.add(signBoard);

    // Red awning
    const awning = new THREE.Mesh(new THREE.BoxGeometry(16, 0.4, 3.5), new THREE.MeshLambertMaterial({ color: 0xd32f2f }));
    awning.position.set(0, 6.2, 11);
    awning.rotation.x = 0.2;
    group.add(awning);

    // Glass Entrance Doors
    const door = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 0.2), new THREE.MeshStandardMaterial({
      color: 0x90caf9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.6,
    }));
    door.position.set(0, 2.7, 10.1);
    group.add(door);

    this.scene.add(group);

    // Interactive Zone for Pizza Work
    this.interactiveZones.push({
      id: 'pizza_station',
      name: 'Astro Pizza & Bakery',
      type: 'job_pizza',
      position: new THREE.Vector3(pos.x, 1, pos.z + 10),
      radius: 5,
    });
  }

  private createHospital(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Base
    const pad = new THREE.Mesh(new THREE.BoxGeometry(26, 0.4, 24), new THREE.MeshLambertMaterial({ color: 0xcccccc }));
    pad.position.y = 0.2;
    group.add(pad);

    // Building
    const walls = new THREE.Mesh(new THREE.BoxGeometry(22, 12, 20), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    walls.position.y = 6.2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    group.add(walls);

    // Cyan striping
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(22.2, 1.5, 20.2), new THREE.MeshLambertMaterial({ color: 0x00acc1 }));
    stripe.position.y = 8;
    group.add(stripe);

    // Glowing Red Medical Cross Sign
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5, 0.8), new THREE.MeshBasicMaterial({ color: 0xe53935 }));
    crossV.position.set(0, 14, 10.4);
    group.add(crossV);

    const crossH = new THREE.Mesh(new THREE.BoxGeometry(5, 1.6, 0.8), new THREE.MeshBasicMaterial({ color: 0xe53935 }));
    crossH.position.set(0, 14, 10.4);
    group.add(crossH);

    // Entrance
    const entrance = new THREE.Mesh(new THREE.BoxGeometry(7, 5, 0.2), new THREE.MeshStandardMaterial({
      color: 0x80deea,
      transparent: true,
      opacity: 0.6,
    }));
    entrance.position.set(0, 2.7, 10.1);
    group.add(entrance);

    this.scene.add(group);

    this.interactiveZones.push({
      id: 'hospital_station',
      name: 'Astro City Hospital',
      type: 'job_hospital',
      position: new THREE.Vector3(pos.x, 1, pos.z + 10),
      radius: 5,
    });
  }

  private createSupermarketAndCafe(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Base
    const pad = new THREE.Mesh(new THREE.BoxGeometry(26, 0.4, 24), new THREE.MeshLambertMaterial({ color: 0xcccccc }));
    pad.position.y = 0.2;
    group.add(pad);

    // Warm green cafe walls
    const walls = new THREE.Mesh(new THREE.BoxGeometry(22, 10, 20), new THREE.MeshLambertMaterial({ color: 0x43a047 }));
    walls.position.y = 5.2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    group.add(walls);

    // Giant Coffee Cup on Roof
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 1.8, 3.5, 16), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    cup.position.set(0, 12, 0);
    cup.castShadow = true;
    group.add(cup);

    const coffeeSurface = new THREE.Mesh(new THREE.CircleGeometry(2.2, 16), new THREE.MeshBasicMaterial({ color: 0x4e342e }));
    coffeeSurface.rotation.x = -Math.PI / 2;
    coffeeSurface.position.set(0, 13.7, 0);
    group.add(coffeeSurface);

    // Awning
    const awning = new THREE.Mesh(new THREE.BoxGeometry(16, 0.4, 3.5), new THREE.MeshLambertMaterial({ color: 0xffb300 }));
    awning.position.set(0, 6.2, -11);
    awning.rotation.x = -0.2;
    group.add(awning);

    // Glass Door facing north
    const door = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 0.2), new THREE.MeshStandardMaterial({
      color: 0xbbdefb,
      transparent: true,
      opacity: 0.6,
    }));
    door.position.set(0, 2.7, -10.1);
    group.add(door);

    this.scene.add(group);

    this.interactiveZones.push({
      id: 'cafe_station',
      name: 'Astro Cafe & Market',
      type: 'job_cafe',
      position: new THREE.Vector3(pos.x, 1, pos.z - 10),
      radius: 5,
    });
  }

  private createPoliceStation(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Base
    const pad = new THREE.Mesh(new THREE.BoxGeometry(26, 0.4, 24), new THREE.MeshLambertMaterial({ color: 0xcccccc }));
    pad.position.y = 0.2;
    group.add(pad);

    // Deep blue sturdy building
    const walls = new THREE.Mesh(new THREE.BoxGeometry(22, 10, 20), new THREE.MeshLambertMaterial({ color: 0x1565c0 }));
    walls.position.y = 5.2;
    walls.castShadow = true;
    group.add(walls);

    // Police Beacon Light (Red & Blue flashing)
    const beaconR = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.2, 12), new THREE.MeshBasicMaterial({ color: 0xff1744 }));
    beaconR.position.set(-2, 10.8, -8);
    group.add(beaconR);

    const beaconB = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.2, 12), new THREE.MeshBasicMaterial({ color: 0x2979ff }));
    beaconB.position.set(2, 10.8, -8);
    group.add(beaconB);

    // Door facing north
    const door = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 0.2), new THREE.MeshLambertMaterial({ color: 0x37474f }));
    door.position.set(0, 2.7, -10.1);
    group.add(door);

    this.scene.add(group);

    this.interactiveZones.push({
      id: 'police_station',
      name: 'Astro Police & Dispatch',
      type: 'job_police',
      position: new THREE.Vector3(pos.x, 1, pos.z - 10),
      radius: 5,
    });
  }

  private createDealership(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Showroom pad
    const pad = new THREE.Mesh(new THREE.BoxGeometry(24, 0.4, 30), new THREE.MeshLambertMaterial({ color: 0x37474f }));
    pad.position.y = 0.2;
    group.add(pad);

    // Modern glass showroom
    const glassWalls = new THREE.Mesh(new THREE.BoxGeometry(20, 8, 26), new THREE.MeshStandardMaterial({
      color: 0x90caf9,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.45,
    }));
    glassWalls.position.y = 4.2;
    group.add(glassWalls);

    // Showroom Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(22, 1, 28), new THREE.MeshLambertMaterial({ color: 0xff9800 }));
    roof.position.y = 8.6;
    roof.castShadow = true;
    group.add(roof);

    // Rotating turntable inside showroom
    const turntable = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 0.4, 24), new THREE.MeshLambertMaterial({ color: 0x212121 }));
    turntable.position.y = 0.5;
    group.add(turntable);

    // Supercar model on turntable
    const displayCar = this.createCarMesh('sports', 0xff3d00);
    displayCar.group.position.set(0, 0.8, 0);
    group.add(displayCar.group);

    this.scene.add(group);

    this.interactiveZones.push({
      id: 'dealership',
      name: 'Astro Motors & Garage',
      type: 'dealer',
      position: new THREE.Vector3(pos.x - 10, 1, pos.z),
      radius: 5,
    });
  }

  private createFashionBoutique(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Pad
    const pad = new THREE.Mesh(new THREE.BoxGeometry(24, 0.4, 30), new THREE.MeshLambertMaterial({ color: 0xeeeeee }));
    pad.position.y = 0.2;
    group.add(pad);

    // Chic Magenta Building
    const walls = new THREE.Mesh(new THREE.BoxGeometry(20, 9, 26), new THREE.MeshLambertMaterial({ color: 0xec407a }));
    walls.position.y = 4.7;
    walls.castShadow = true;
    group.add(walls);

    // Gold Trim Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(22, 1, 28), new THREE.MeshLambertMaterial({ color: 0xffd54f }));
    roof.position.y = 9.6;
    group.add(roof);

    // Entrance
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5.5, 7), new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
    }));
    door.position.set(10.1, 2.8, 0);
    group.add(door);

    this.scene.add(group);

    this.interactiveZones.push({
      id: 'boutique',
      name: 'Astro Fashion Boutique',
      type: 'boutique',
      position: new THREE.Vector3(pos.x + 10, 1, pos.z),
      radius: 5,
    });
  }

  private createPartyVilla(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Villa Grounds
    const pad = new THREE.Mesh(new THREE.BoxGeometry(50, 0.4, 40), new THREE.MeshLambertMaterial({ color: 0xfff8e1 }));
    pad.position.y = 0.2;
    group.add(pad);

    // Luxury Mansion Structure
    const mansion = new THREE.Mesh(new THREE.BoxGeometry(34, 10, 18), new THREE.MeshLambertMaterial({ color: 0x5c6bc0 }));
    mansion.position.set(0, 5.2, 8);
    mansion.castShadow = true;
    group.add(mansion);

    // Second story terrace
    const balcony = new THREE.Mesh(new THREE.BoxGeometry(36, 0.8, 10), new THREE.MeshLambertMaterial({ color: 0x3949ab }));
    balcony.position.set(0, 10.4, 8);
    group.add(balcony);

    // Swimming Pool with animated water
    const poolBorder = new THREE.Mesh(new THREE.BoxGeometry(18, 0.6, 12), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    poolBorder.position.set(-10, 0.4, -9);
    group.add(poolBorder);

    const poolWater = new THREE.Mesh(new THREE.PlaneGeometry(16.5, 10.5), new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85,
    }));
    poolWater.rotation.x = -Math.PI / 2;
    poolWater.position.set(-10, 0.65, -9);
    group.add(poolWater);

    // DJ Booth & Dance Stage
    const djStage = new THREE.Mesh(new THREE.BoxGeometry(14, 0.8, 12), new THREE.MeshLambertMaterial({ color: 0x212121 }));
    djStage.position.set(12, 0.5, -9);
    group.add(djStage);

    // DJ Decks & Speakers
    const djTable = new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, 1.5), new THREE.MeshLambertMaterial({ color: 0x00e676 }));
    djTable.position.set(12, 1.5, -12);
    group.add(djTable);

    const speakerL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4, 1.6), new THREE.MeshLambertMaterial({ color: 0x263238 }));
    speakerL.position.set(8, 2.5, -12);
    group.add(speakerL);

    const speakerR = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4, 1.6), new THREE.MeshLambertMaterial({ color: 0x263238 }));
    speakerR.position.set(16, 2.5, -12);
    group.add(speakerR);

    // Neon Disco Dance Floor Tiles
    for (let x = 0; x < 3; x++) {
      for (let z = 0; z < 3; z++) {
        const tile = new THREE.Mesh(
          new THREE.BoxGeometry(2.4, 0.1, 2.4),
          new THREE.MeshBasicMaterial({ color: (x + z) % 2 === 0 ? 0xff007f : 0x00f0ff })
        );
        tile.position.set(9.5 + x * 2.5, 0.95, -10 + z * 2.5);
        group.add(tile);
      }
    }

    // Disco Spotlights
    const discoLight1 = new THREE.PointLight(0xff007f, 2, 20);
    discoLight1.position.set(10, 6, -9);
    group.add(discoLight1);
    this.discoLights.push(discoLight1);

    const discoLight2 = new THREE.PointLight(0x00f0ff, 2, 20);
    discoLight2.position.set(14, 6, -9);
    group.add(discoLight2);
    this.discoLights.push(discoLight2);

    this.scene.add(group);

    this.interactiveZones.push({
      id: 'villa_party',
      name: 'Astro Party Villa & Beach Club',
      type: 'villa_party',
      position: new THREE.Vector3(pos.x, 1, pos.z - 12),
      radius: 9,
    });
  }

  private createPlayerEstates(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Yard & Grass
    const yard = new THREE.Mesh(new THREE.BoxGeometry(45, 0.4, 35), new THREE.MeshLambertMaterial({ color: 0x7cb342 }));
    yard.position.y = 0.2;
    group.add(yard);

    // House Base
    const house = new THREE.Mesh(new THREE.BoxGeometry(26, 9, 20), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    house.position.set(0, 4.7, -4);
    house.castShadow = true;
    group.add(house);

    // Modern Angled Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(18, 5, 4), new THREE.MeshLambertMaterial({ color: 0x37474f }));
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, 11.5, -4);
    roof.castShadow = true;
    group.add(roof);

    // Garage
    const garage = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 12), new THREE.MeshLambertMaterial({ color: 0xb0bec5 }));
    garage.position.set(-16, 3.2, -6);
    garage.castShadow = true;
    group.add(garage);

    // Mailbox & "CLAIMED: Astro Gamer" Sign
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.8), new THREE.MeshLambertMaterial({ color: 0x5d4037 }));
    post.position.set(5, 0.9, 10);
    group.add(post);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 0.3), new THREE.MeshLambertMaterial({ color: 0xffeb3b }));
    signBoard.position.set(5, 1.8, 10);
    group.add(signBoard);

    this.scene.add(group);

    this.interactiveZones.push({
      id: 'player_home',
      name: 'Luxury Astro Estate',
      type: 'player_home',
      position: new THREE.Vector3(pos.x, 1, pos.z + 10),
      radius: 6,
    });
  }

  // ASTRO LAX EXPANSION: WATER, LARGE BRIDGE, RESTAURANTS & MANSION

  private createAstroLAXWaterAndBridge() {
    // 1. Water Channel / River
    const riverGeo = new THREE.PlaneGeometry(90, 380);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x0077be,
      roughness: 0.15,
      metalness: 0.3,
      transparent: true,
      opacity: 0.88,
    });
    const river = new THREE.Mesh(riverGeo, riverMat);
    river.position.set(125, -0.15, 0);
    river.rotation.x = -Math.PI / 2;
    this.scene.add(river);

    // Seawalls / River embankments
    const seawallMat = new THREE.MeshLambertMaterial({ color: 0x546e7a });
    const wallWest = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 380), seawallMat);
    wallWest.position.set(78, 0.4, 0);
    this.scene.add(wallWest);

    const wallEast = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 380), seawallMat);
    wallEast.position.set(172, 0.4, 0);
    this.scene.add(wallEast);

    // 2. Grand Suspension Bridge Deck
    const bridgeGroup = new THREE.Group();

    const roadMat = new THREE.MeshLambertMaterial({ color: 0x263238 });
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
    const steelMat = new THREE.MeshLambertMaterial({ color: 0xd32f2f }); // Golden Gate style vibrant crimson red
    const cableMat = new THREE.MeshLambertMaterial({ color: 0xffd54f });

    // Main horizontal span
    const mainSpan = new THREE.Mesh(new THREE.BoxGeometry(90, 0.8, 15), roadMat);
    mainSpan.position.set(125, 4.2, 0);
    mainSpan.receiveShadow = true;
    bridgeGroup.add(mainSpan);

    // West Approach Ramp (x: 65 to 80, rising from y: 0.2 to 4.2)
    const rampW = new THREE.Mesh(new THREE.BoxGeometry(16, 0.8, 15), roadMat);
    rampW.position.set(72, 2.2, 0);
    rampW.rotation.z = -0.25;
    bridgeGroup.add(rampW);

    // East Approach Ramp (x: 170 to 185, descending from y: 4.2 to 0.2)
    const rampE = new THREE.Mesh(new THREE.BoxGeometry(16, 0.8, 15), roadMat);
    rampE.position.set(178, 2.2, 0);
    rampE.rotation.z = 0.25;
    bridgeGroup.add(rampE);

    // Road Divider Stripes along bridge
    for (let x = 68; x <= 182; x += 5) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.6), lineMat);
      stripe.rotation.x = -Math.PI / 2;
      let sy = 4.62;
      if (x < 80) sy = 0.2 + ((x - 65) / 15) * 4.0 + 0.42;
      else if (x > 170) sy = 4.2 - ((x - 170) / 15) * 4.0 + 0.42;
      stripe.position.set(x, sy, 0);
      bridgeGroup.add(stripe);
    }

    // Safety Guardrails on bridge sides
    const railMat = new THREE.MeshLambertMaterial({ color: 0xb0bec5 });
    const railNorth = new THREE.Mesh(new THREE.BoxGeometry(118, 1.2, 0.4), railMat);
    railNorth.position.set(125, 4.8, 7.3);
    bridgeGroup.add(railNorth);

    const railSouth = new THREE.Mesh(new THREE.BoxGeometry(118, 1.2, 0.4), railMat);
    railSouth.position.set(125, 4.8, -7.3);
    bridgeGroup.add(railSouth);

    // 3. Two Grand 32-Meter Suspension Towers
    [98, 152].forEach((tx) => {
      const tower = new THREE.Group();
      tower.position.set(tx, 0, 0);

      // 2 Main Vertical Columns
      [-7.5, 7.5].forEach((tz) => {
        const column = new THREE.Mesh(new THREE.BoxGeometry(2.4, 32, 2.4), steelMat);
        column.position.set(0, 16, tz);
        column.castShadow = true;
        tower.add(column);

        // Top Spire
        const spire = new THREE.Mesh(new THREE.ConeGeometry(0.8, 4, 8), cableMat);
        spire.position.set(0, 34, tz);
        tower.add(spire);
      });

      // Upper Crossbeam
      const crossTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2, 17), steelMat);
      crossTop.position.set(0, 27, 0);
      tower.add(crossTop);

      // Mid Crossbeam (above roadway clearance)
      const crossMid = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 17), steelMat);
      crossMid.position.set(0, 14, 0);
      tower.add(crossMid);

      bridgeGroup.add(tower);
    });

    // 4. Suspension Cables
    [-7.5, 7.5].forEach((cz) => {
      // Main catenary approximation cables
      const cable1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 60), cableMat);
      cable1.position.set(125, 20, cz);
      cable1.rotation.z = Math.PI / 2;
      bridgeGroup.add(cable1);

      // Vertical hanger wires
      for (let hx = 90; hx <= 160; hx += 8) {
        const hangerHeight = 15;
        const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, hangerHeight), cableMat);
        hanger.position.set(hx, 11, cz);
        bridgeGroup.add(hanger);
      }
    });

    // 5. Giant Glowing Welcome Arch at Bridge Entrance
    const archGroup = new THREE.Group();
    archGroup.position.set(70, 0, 0);

    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(2, 9, 2), steelMat);
    pillarL.position.set(0, 4.5, -8.5);
    archGroup.add(pillarL);

    const pillarR = new THREE.Mesh(new THREE.BoxGeometry(2, 9, 2), steelMat);
    pillarR.position.set(0, 4.5, 8.5);
    archGroup.add(pillarR);

    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 19), new THREE.MeshLambertMaterial({ color: 0x111111 }));
    archBeam.position.set(0, 9.5, 0);
    archGroup.add(archBeam);

    // Glowing Signboard
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 1.6, 16),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff })
    );
    signBoard.position.set(-1.1, 9.5, 0);
    archGroup.add(signBoard);

    bridgeGroup.add(archGroup);

    // Streetlamps on Bridge
    for (let lx = 88; lx <= 162; lx += 24) {
      const lampL = new THREE.PointLight(0xfff59d, 1.2, 16);
      lampL.position.set(lx, 8, -7.5);
      bridgeGroup.add(lampL);

      const lampR = new THREE.PointLight(0xfff59d, 1.2, 16);
      lampR.position.set(lx, 8, 7.5);
      bridgeGroup.add(lampR);
    }

    this.scene.add(bridgeGroup);

    this.interactiveZones.push({
      id: 'bridge_zone',
      name: 'Astro LAX Grand Suspension Bridge',
      type: 'dealer',
      position: new THREE.Vector3(125, 4.2, 0),
      radius: 8,
    });
  }

  // 2. CHINESE RESTAURANT: GOLDEN DRAGON DYNASTY
  private createChineseRestaurant(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Granite foundation terrace
    const base = new THREE.Mesh(new THREE.BoxGeometry(26, 0.8, 24), new THREE.MeshLambertMaterial({ color: 0x37474f }));
    base.position.y = 0.4;
    group.add(base);

    // Red lacquered lower pavilion
    const walls = new THREE.Mesh(new THREE.BoxGeometry(20, 8, 18), new THREE.MeshLambertMaterial({ color: 0xb71c1c }));
    walls.position.y = 4.4;
    walls.castShadow = true;
    group.add(walls);

    // Lower Pagoda Roof with flared upturned eaves
    const roof1 = new THREE.Mesh(new THREE.ConeGeometry(17, 3, 4), new THREE.MeshLambertMaterial({ color: 0x2e7d32 }));
    roof1.rotation.y = Math.PI / 4;
    roof1.position.y = 9.5;
    roof1.castShadow = true;
    group.add(roof1);

    // Upper Pavilion Tier
    const tier2 = new THREE.Mesh(new THREE.BoxGeometry(12, 5, 12), new THREE.MeshLambertMaterial({ color: 0xc62828 }));
    tier2.position.y = 12.5;
    tier2.castShadow = true;
    group.add(tier2);

    // Top Pagoda Roof
    const roof2 = new THREE.Mesh(new THREE.ConeGeometry(11, 2.5, 4), new THREE.MeshLambertMaterial({ color: 0x1b5e20 }));
    roof2.rotation.y = Math.PI / 4;
    roof2.position.y = 15.5;
    roof2.castShadow = true;
    group.add(roof2);

    // Golden Dragon Crest on Roof Peak
    const dragonFinial = new THREE.Mesh(new THREE.OctahedronGeometry(1.2, 0), new THREE.MeshBasicMaterial({ color: 0xffd700 }));
    dragonFinial.position.y = 17.5;
    group.add(dragonFinial);

    // Hanging Red Chinese Lanterns
    [-7, 7].forEach((lx) => {
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 12), new THREE.MeshBasicMaterial({ color: 0xff1744 }));
      lantern.position.set(lx, 7.5, 9.5);
      group.add(lantern);

      const lanternLight = new THREE.PointLight(0xff1744, 1.5, 12);
      lanternLight.position.set(lx, 7.5, 9.5);
      group.add(lanternLight);
    });

    // Wok Cooking Counter on Terrace
    const wokCounter = new THREE.Mesh(new THREE.BoxGeometry(5, 1.2, 2.5), new THREE.MeshLambertMaterial({ color: 0x4e342e }));
    wokCounter.position.set(-6, 1.2, 10);
    group.add(wokCounter);

    const wok = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.4, 0.6, 16), new THREE.MeshLambertMaterial({ color: 0x212121 }));
    wok.position.set(-6, 2.0, 10);
    group.add(wok);

    // Bamboo planters flanking door
    [-9, 9].forEach((bx) => {
      const planter = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 2), new THREE.MeshLambertMaterial({ color: 0x5d4037 }));
      planter.position.set(bx, 1.2, 10);
      group.add(planter);

      const bamboo = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 4.5, 6), new THREE.MeshLambertMaterial({ color: 0x43a047 }));
      bamboo.position.set(bx, 3.8, 10);
      group.add(bamboo);
    });

    this.scene.add(group);

    this.interactiveZones.push({
      id: 'chinese_restaurant',
      name: 'Golden Dragon Chinese Dynasty',
      type: 'job_chinese',
      position: new THREE.Vector3(pos.x, 1, pos.z + 10),
      radius: 6,
    });
  }

  // 3. INDIAN RESTAURANT: TAJ FLAVORS ROYAL PALACE
  private createIndianRestaurant(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Sandstone terrace base
    const base = new THREE.Mesh(new THREE.BoxGeometry(28, 0.8, 26), new THREE.MeshLambertMaterial({ color: 0xd7ccc8 }));
    base.position.y = 0.4;
    group.add(base);

    // Main Ivory Palace Building
    const walls = new THREE.Mesh(new THREE.BoxGeometry(22, 9, 20), new THREE.MeshLambertMaterial({ color: 0xfff8e1 }));
    walls.position.y = 4.9;
    walls.castShadow = true;
    group.add(walls);

    // Saffron parapet border
    const trim = new THREE.Mesh(new THREE.BoxGeometry(23.2, 1.2, 21.2), new THREE.MeshLambertMaterial({ color: 0xff8f00 }));
    trim.position.y = 9.8;
    group.add(trim);

    // Grand Central Golden Onion Dome
    const domeGeo = new THREE.SphereGeometry(4.8, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.7);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0xffb300, roughness: 0.2, metalness: 0.7 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(0, 10.5, 0);
    dome.castShadow = true;
    group.add(dome);

    const domeFinial = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.5, 8), domeMat);
    domeFinial.position.set(0, 16.5, 0);
    group.add(domeFinial);

    // 4 Corner Chhatri Domes
    const cornerOffsets = [
      [-9, -9], [9, -9], [-9, 9], [9, 9]
    ];
    cornerOffsets.forEach(([cx, cz]) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3, 8), domeMat);
      pillar.position.set(cx, 11, cz);
      group.add(pillar);

      const smallDome = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 12), domeMat);
      smallDome.position.set(cx, 13, cz);
      group.add(smallDome);
    });

    // Scalloped Palace Entrance Arch
    const archPillarL = new THREE.Mesh(new THREE.BoxGeometry(1.5, 6, 1.5), new THREE.MeshLambertMaterial({ color: 0xff8f00 }));
    archPillarL.position.set(-3.5, 3.4, 10.2);
    group.add(archPillarL);

    const archPillarR = new THREE.Mesh(new THREE.BoxGeometry(1.5, 6, 1.5), new THREE.MeshLambertMaterial({ color: 0xff8f00 }));
    archPillarR.position.set(3.5, 3.4, 10.2);
    group.add(archPillarR);

    // Tandoor Clay Oven Station outside
    const tandoorOven = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 2.2, 16), new THREE.MeshLambertMaterial({ color: 0x8d6e63 }));
    tandoorOven.position.set(8, 1.6, 10);
    group.add(tandoorOven);

    const tandoorFire = new THREE.Mesh(new THREE.CircleGeometry(0.9, 12), new THREE.MeshBasicMaterial({ color: 0xff5722 }));
    tandoorFire.rotation.x = -Math.PI / 2;
    tandoorFire.position.set(8, 2.75, 10);
    group.add(tandoorFire);

    this.scene.add(group);

    this.interactiveZones.push({
      id: 'indian_restaurant',
      name: 'Taj Flavors Royal Indian Palace',
      type: 'job_indian',
      position: new THREE.Vector3(pos.x, 1, pos.z + 10),
      radius: 6,
    });
  }

  // 4. COASTAL PIZZA CAFE & GELATO EMPORIUM
  private createLAXPizzaCafe(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Base terrace with terracotta tiles
    const base = new THREE.Mesh(new THREE.BoxGeometry(26, 0.8, 24), new THREE.MeshLambertMaterial({ color: 0xbcaaa4 }));
    base.position.y = 0.4;
    group.add(base);

    // White coastal cafe building
    const walls = new THREE.Mesh(new THREE.BoxGeometry(20, 8, 18), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    walls.position.y = 4.4;
    walls.castShadow = true;
    group.add(walls);

    // Terracotta roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(21.5, 1.2, 19.5), new THREE.MeshLambertMaterial({ color: 0xbf360c }));
    roof.position.y = 8.8;
    group.add(roof);

    // Italian Flag Striping on Awning
    const awning = new THREE.Mesh(new THREE.BoxGeometry(16, 0.4, 4), new THREE.MeshLambertMaterial({ color: 0x2e7d32 }));
    awning.position.set(0, 5.8, 10.5);
    awning.rotation.x = 0.2;
    group.add(awning);

    // Wood-fire Pizza Oven with Chimney
    const oven = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.4, 2.5, 16), new THREE.MeshLambertMaterial({ color: 0x5d4037 }));
    oven.position.set(-6, 1.8, 10.5);
    group.add(oven);

    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4, 0.8), new THREE.MeshLambertMaterial({ color: 0x3e2723 }));
    chimney.position.set(-6, 4.5, 10.5);
    group.add(chimney);

    // Gelato Display Counter with colorful scoops
    const gelatoCounter = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.4, 2), new THREE.MeshLambertMaterial({ color: 0x00bcd4 }));
    gelatoCounter.position.set(5.5, 1.3, 10.5);
    group.add(gelatoCounter);

    // Gelato Flavors
    const flavors = [0x81c784, 0xff80ab, 0xffeb3b, 0x795548];
    flavors.forEach((color, idx) => {
      const scoop = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), new THREE.MeshLambertMaterial({ color }));
      scoop.position.set(3.8 + idx * 1.1, 2.2, 10.5);
      group.add(scoop);
    });

    this.scene.add(group);

    this.interactiveZones.push({
      id: 'lax_pizza_cafe',
      name: 'Astro LAX Pizza Cafe & Gelato',
      type: 'job_lax_pizza',
      position: new THREE.Vector3(pos.x, 1, pos.z + 10),
      radius: 6,
    });
  }

  // 5. ASTRO LAX ROYAL GRAND MEGA MANSION
  private createMegaMansion(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Immense Estate Grounds
    const estateGround = new THREE.Mesh(new THREE.BoxGeometry(55, 0.6, 50), new THREE.MeshLambertMaterial({ color: 0x33691e }));
    estateGround.position.y = 0.3;
    group.add(estateGround);

    // Circular driveway with Fountain
    const driveway = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 0.2, 24), new THREE.MeshLambertMaterial({ color: 0x37474f }));
    driveway.position.set(0, 0.65, 14);
    group.add(driveway);

    const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4, 1, 16), new THREE.MeshLambertMaterial({ color: 0xe0e0e0 }));
    fountainBase.position.set(0, 1.2, 14);
    group.add(fountainBase);

    const fountainWater = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.2, 16), new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
    fountainWater.position.set(0, 1.7, 14);
    group.add(fountainWater);

    // 3-Story Modern Billionaire Mansion Structure
    const level1 = new THREE.Mesh(new THREE.BoxGeometry(36, 6, 24), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    level1.position.set(0, 3.5, -4);
    level1.castShadow = true;
    group.add(level1);

    const level2 = new THREE.Mesh(new THREE.BoxGeometry(30, 5, 20), new THREE.MeshLambertMaterial({ color: 0x263238 }));
    level2.position.set(0, 9.0, -4);
    level2.castShadow = true;
    group.add(level2);

    const level3 = new THREE.Mesh(new THREE.BoxGeometry(22, 4.5, 16), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    level3.position.set(0, 13.8, -4);
    level3.castShadow = true;
    group.add(level3);

    // Rooftop Helipad
    const helipad = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 14), new THREE.MeshLambertMaterial({ color: 0x212121 }));
    helipad.position.set(0, 16.3, -4);
    group.add(helipad);

    // Yellow "H" Marking
    const hBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 6), new THREE.MeshBasicMaterial({ color: 0xffeb3b }));
    hBar1.position.set(-2, 16.55, -4);
    group.add(hBar1);

    const hBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 6), new THREE.MeshBasicMaterial({ color: 0xffeb3b }));
    hBar2.position.set(2, 16.55, -4);
    group.add(hBar2);

    const hCross = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.1, 0.8), new THREE.MeshBasicMaterial({ color: 0xffeb3b }));
    hCross.position.set(0, 16.55, -4);
    group.add(hCross);

    // Infinity Swimming Pool
    const poolBorder = new THREE.Mesh(new THREE.BoxGeometry(16, 0.8, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    poolBorder.position.set(-16, 0.8, -12);
    group.add(poolBorder);

    const poolWater = new THREE.Mesh(new THREE.PlaneGeometry(14.5, 6.5), new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85,
    }));
    poolWater.rotation.x = -Math.PI / 2;
    poolWater.position.set(-16, 1.25, -12);
    group.add(poolWater);

    // Golden Security Front Gates
    [-6, 6].forEach((gx) => {
      const gatePost = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5, 1.2), new THREE.MeshLambertMaterial({ color: 0xffd700 }));
      gatePost.position.set(gx, 2.5, 23);
      group.add(gatePost);
    });

    const gateDoor = new THREE.Mesh(new THREE.BoxGeometry(10.5, 3.5, 0.2), new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.3,
      metalness: 0.8,
    }));
    gateDoor.position.set(0, 2.0, 23);
    group.add(gateDoor);

    this.scene.add(group);

    this.interactiveZones.push({
      id: 'mega_mansion',
      name: 'Astro LAX Royal Grand Mansion',
      type: 'lax_mansion',
      position: new THREE.Vector3(pos.x, 1, pos.z + 14),
      radius: 8,
    });
  }

  // 6. ASTRO LAX ROADS & PALM TREES DECORATION
  private decorateAstroLAX() {
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x263238 });
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffe600 });

    // Main East Avenue running through Astro LAX to the Mega Mansion
    const laxBoulevard = new THREE.Mesh(new THREE.PlaneGeometry(120, 16), roadMat);
    laxBoulevard.rotation.x = -Math.PI / 2;
    laxBoulevard.position.set(235, 0.02, 0);
    laxBoulevard.receiveShadow = true;
    this.scene.add(laxBoulevard);

    // North-South Avenue connecting Chinese & Indian restaurants
    const laxCrossRoad = new THREE.Mesh(new THREE.PlaneGeometry(16, 160), roadMat);
    laxCrossRoad.rotation.x = -Math.PI / 2;
    laxCrossRoad.position.set(235, 0.025, 0);
    laxCrossRoad.receiveShadow = true;
    this.scene.add(laxCrossRoad);

    // Yellow center lines
    for (let x = 185; x <= 295; x += 8) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.8), lineMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(x, 0.03, 0);
      this.scene.add(stripe);
    }

    for (let z = -70; z <= 70; z += 8) {
      if (Math.abs(z) < 12) continue;
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 4), lineMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(235, 0.035, z);
      this.scene.add(stripe);
    }

    // Tropical Palm Trees in Astro LAX
    const palmPositions = [
      [195, -20], [195, 20], [215, -20], [215, 20],
      [255, -20], [255, 20], [275, -20], [275, 20],
      [220, -65], [250, -65], [220, 65], [250, 65],
    ];

    palmPositions.forEach(([px, pz]) => {
      this.createPalmTree(new THREE.Vector3(px, 0, pz));
    });

    // Neon Cyan & Gold Streetlamps in Astro LAX
    const laxLamps = [
      [195, -10], [195, 10], [220, -10], [220, 10],
      [250, -10], [250, 10], [235, -30], [235, 30],
    ];

    laxLamps.forEach(([lx, lz]) => {
      this.createNeonLamp(new THREE.Vector3(lx, 0, lz));
    });
  }

  private createPalmTree(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Slender curved trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.55, 7, 8),
      new THREE.MeshLambertMaterial({ color: 0x6d4c41 })
    );
    trunk.position.set(0, 3.5, 0);
    trunk.rotation.z = 0.08;
    trunk.castShadow = true;
    group.add(trunk);

    // Fronds (large radiating green leaves)
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const frond = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.2, 1.2), leafMat);
      frond.position.set(Math.cos(angle) * 1.8, 7.2, Math.sin(angle) * 1.8);
      frond.rotation.y = angle;
      frond.rotation.z = -0.35;
      frond.castShadow = true;
      group.add(frond);
    }

    this.scene.add(group);
  }

  private createNeonLamp(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 6, 8), new THREE.MeshLambertMaterial({ color: 0x263238 }));
    pole.position.y = 3;
    group.add(pole);

    const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.6), new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
    head.position.y = 6.2;
    group.add(head);

    const light = new THREE.PointLight(0x00e5ff, 1.2, 16);
    light.position.y = 6;
    group.add(light);
    this.streetLamps.push(light);

    this.scene.add(group);
  }

  // Bridge elevation calculation
  public getGroundHeightAt(x: number, z: number): number {
    // Check if on Astro LAX bridge (spanning x: 65 to 185, width z: -8 to 8)
    if (x >= 64 && x <= 186 && Math.abs(z) <= 8.5) {
      if (x < 82) {
        return ((x - 64) / 18) * 4.2;
      }
      if (x > 168) {
        return ((186 - x) / 18) * 4.2;
      }
      return 4.2;
    }
    return 0;
  }

  private createBench(pos: THREE.Vector3, rotY: number = 0) {
    const group = new THREE.Group();
    group.position.copy(pos);
    group.rotation.y = rotY;

    const seat = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 1), new THREE.MeshLambertMaterial({ color: 0x8d6e63 }));
    seat.position.y = 0.8;
    group.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(3, 0.9, 0.2), new THREE.MeshLambertMaterial({ color: 0x8d6e63 }));
    back.position.set(0, 1.3, -0.4);
    group.add(back);

    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 1), new THREE.MeshLambertMaterial({ color: 0x3e2723 }));
    legL.position.set(-1.2, 0.4, 0);
    group.add(legL);

    const legR = legL.clone();
    legR.position.x = 1.2;
    group.add(legR);

    this.scene.add(group);
  }

  private createFoodCart(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    const cart = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.8, 1.8), new THREE.MeshLambertMaterial({ color: 0xf44336 }));
    cart.position.y = 1.2;
    group.add(cart);

    const umbrellaPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.5), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    umbrellaPole.position.set(0, 2.5, 0);
    group.add(umbrellaPole);

    const umbrella = new THREE.Mesh(new THREE.ConeGeometry(2.5, 1, 12), new THREE.MeshLambertMaterial({ color: 0xffeb3b }));
    umbrella.position.set(0, 4.2, 0);
    group.add(umbrella);

    this.scene.add(group);
  }

  private decorateCity() {
    // Trees along avenues
    const treePositions = [
      [-18, 0, -60], [-18, 0, -40], [-18, 0, 40], [-18, 0, 60],
      [18, 0, -60], [18, 0, -40], [18, 0, 40], [18, 0, 60],
      [-60, 0, -18], [-40, 0, -18], [40, 0, -18], [60, 0, -18],
      [-60, 0, 18], [-40, 0, 18], [40, 0, 18], [60, 0, 18],
    ];

    treePositions.forEach(([x, y, z]) => {
      this.createTree(new THREE.Vector3(x, y, z));
    });

    // Street Lamps with soft glow
    const lampPositions = [
      [-14, 0, -26], [14, 0, -26], [-14, 0, 26], [14, 0, 26],
      [-26, 0, -14], [-26, 0, 14], [26, 0, -14], [26, 0, 14],
    ];

    lampPositions.forEach(([x, y, z]) => {
      this.createStreetLamp(new THREE.Vector3(x, y, z));
    });
  }

  private createTree(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.7, 3.5, 8),
      new THREE.MeshLambertMaterial({ color: 0x5d4037 })
    );
    trunk.position.y = 1.75;
    trunk.castShadow = true;
    group.add(trunk);

    // Stylized Blocky/Poly Foliage
    const f1 = new THREE.Mesh(
      new THREE.DodecahedronGeometry(2.4, 0),
      new THREE.MeshLambertMaterial({ color: 0x43a047 })
    );
    f1.position.y = 4.2;
    f1.castShadow = true;
    group.add(f1);

    const f2 = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.8, 0),
      new THREE.MeshLambertMaterial({ color: 0x66bb6a })
    );
    f2.position.set(0.3, 5.8, 0);
    f2.castShadow = true;
    group.add(f2);

    this.scene.add(group);
  }

  private createStreetLamp(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.2, 5, 8),
      new THREE.MeshLambertMaterial({ color: 0x263238 })
    );
    pole.position.y = 2.5;
    group.add(pole);

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.8, 0.8),
      new THREE.MeshBasicMaterial({ color: 0xfff9c4 })
    );
    top.position.y = 5.2;
    group.add(top);

    const light = new THREE.PointLight(0xfff59d, 1.2, 18);
    light.position.y = 5;
    group.add(light);
    this.streetLamps.push(light);

    this.scene.add(group);
  }

  // PLAYER AVATAR CREATION

  private setupPlayerMesh() {
    // Stylized blocky Roblox-inspired character
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    const shirtMat = new THREE.MeshLambertMaterial({ color: 0x1e88e5 });
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x212121 });

    // Head
    const headGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 3.4;
    head.castShadow = true;
    this.playerGroup.add(head);
    this.playerBodyParts.head = head;

    // Face features (cute stylized eyes and smile)
    const eyeGeo = new THREE.BoxGeometry(0.18, 0.25, 0.05);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.3, 0.05, 0.61);
    head.add(eyeL);

    const eyeR = eyeL.clone();
    eyeR.position.x = 0.3;
    head.add(eyeR);

    // Torso
    const torsoGeo = new THREE.BoxGeometry(1.6, 1.8, 1.0);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 2.0;
    torso.castShadow = true;
    this.playerGroup.add(torso);
    this.playerBodyParts.torso = torso;

    // Left Arm (pivot at shoulder)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-1.25, 2.7, 0);
    const armGeo = new THREE.BoxGeometry(0.7, 1.7, 0.7);
    const leftArmMesh = new THREE.Mesh(armGeo, shirtMat);
    leftArmMesh.position.y = -0.7;
    leftArmMesh.castShadow = true;
    leftArmGroup.add(leftArmMesh);
    this.playerGroup.add(leftArmGroup);
    this.playerBodyParts.leftArm = leftArmGroup;

    // Right Arm
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(1.25, 2.7, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, shirtMat);
    rightArmMesh.position.y = -0.7;
    rightArmMesh.castShadow = true;
    rightArmGroup.add(rightArmMesh);
    this.playerGroup.add(rightArmGroup);
    this.playerBodyParts.rightArm = rightArmGroup;

    // Left Leg (pivot at hip)
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.45, 1.2, 0);
    const legGeo = new THREE.BoxGeometry(0.7, 1.4, 0.7);
    const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
    leftLegMesh.position.y = -0.6;
    leftLegMesh.castShadow = true;
    leftLegGroup.add(leftLegMesh);
    this.playerGroup.add(leftLegGroup);
    this.playerBodyParts.leftLeg = leftLegGroup;

    // Right Leg
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.45, 1.2, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
    rightLegMesh.position.y = -0.6;
    rightLegMesh.castShadow = true;
    rightLegGroup.add(rightLegMesh);
    this.playerGroup.add(rightLegGroup);
    this.playerBodyParts.rightLeg = rightLegGroup;

    // Initial Hair
    this.applyCustomization({
      skinColor: '#ffdbac',
      shirtColor: '#1e88e5',
      pantsColor: '#212121',
      hairStyle: 'spiky',
      hairColor: '#3e2723',
      hat: 'cap',
      accessory: 'backpack',
    });
  }

  public applyCustomization(c: CharacterCustomization) {
    if (!this.playerBodyParts.head) return;

    (this.playerBodyParts.head.material as THREE.MeshLambertMaterial).color.set(c.skinColor);
    (this.playerBodyParts.torso.material as THREE.MeshLambertMaterial).color.set(c.shirtColor);

    // Left arm & right arm shirts
    const leftArmMesh = this.playerBodyParts.leftArm.children[0] as THREE.Mesh;
    if (leftArmMesh) (leftArmMesh.material as THREE.MeshLambertMaterial).color.set(c.shirtColor);
    const rightArmMesh = this.playerBodyParts.rightArm.children[0] as THREE.Mesh;
    if (rightArmMesh) (rightArmMesh.material as THREE.MeshLambertMaterial).color.set(c.shirtColor);

    // Pants
    const leftLegMesh = this.playerBodyParts.leftLeg.children[0] as THREE.Mesh;
    if (leftLegMesh) (leftLegMesh.material as THREE.MeshLambertMaterial).color.set(c.pantsColor);
    const rightLegMesh = this.playerBodyParts.rightLeg.children[0] as THREE.Mesh;
    if (rightLegMesh) (rightLegMesh.material as THREE.MeshLambertMaterial).color.set(c.pantsColor);

    // Remove existing hair/hat/accessory
    if (this.playerBodyParts.hairMesh) {
      this.playerBodyParts.head.remove(this.playerBodyParts.hairMesh);
      this.playerBodyParts.hairMesh = undefined;
    }
    if (this.playerBodyParts.hatMesh) {
      this.playerBodyParts.head.remove(this.playerBodyParts.hatMesh);
      this.playerBodyParts.hatMesh = undefined;
    }
    if (this.playerBodyParts.accessoryMesh) {
      this.playerBodyParts.torso.remove(this.playerBodyParts.accessoryMesh);
      this.playerBodyParts.accessoryMesh = undefined;
    }

    // Hair
    const hairMat = new THREE.MeshLambertMaterial({ color: c.hairColor });
    const hairGroup = new THREE.Group();

    if (c.hairStyle === 'spiky') {
      const h1 = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.9, 5), hairMat);
      h1.position.set(0, 0.9, 0.1);
      hairGroup.add(h1);
      const h2 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.7, 5), hairMat);
      h2.position.set(-0.4, 0.8, -0.2);
      hairGroup.add(h2);
    } else if (c.hairStyle === 'curly') {
      for (let i = 0; i < 5; i++) {
        const curl = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), hairMat);
        curl.position.set((Math.random() - 0.5) * 0.9, 0.7, (Math.random() - 0.5) * 0.9);
        hairGroup.add(curl);
      }
    } else {
      // messy / standard
      const h = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 1.3), hairMat);
      h.position.y = 0.65;
      hairGroup.add(h);
    }
    this.playerBodyParts.head.add(hairGroup);
    this.playerBodyParts.hairMesh = hairGroup as any;

    // Hats
    if (c.hat === 'chef') {
      const chefHat = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.6, 1.4, 16), new THREE.MeshLambertMaterial({ color: 0xffffff }));
      chefHat.position.y = 1.2;
      this.playerBodyParts.head.add(chefHat);
      this.playerBodyParts.hatMesh = chefHat;
    } else if (c.hat === 'police') {
      const policeHat = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.65, 0.5, 16), new THREE.MeshLambertMaterial({ color: 0x1565c0 }));
      policeHat.position.y = 0.85;
      const brim = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.6), new THREE.MeshLambertMaterial({ color: 0x212121 }));
      brim.position.set(0, -0.2, 0.45);
      policeHat.add(brim);
      this.playerBodyParts.head.add(policeHat);
      this.playerBodyParts.hatMesh = policeHat;
    } else if (c.hat === 'party_crown') {
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.6, 0.6, 5), new THREE.MeshLambertMaterial({ color: 0xffd700 }));
      crown.position.y = 0.95;
      this.playerBodyParts.head.add(crown);
      this.playerBodyParts.hatMesh = crown;
    } else if (c.hat === 'cap') {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.68, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xd32f2f }));
      cap.position.y = 0.55;
      const brim = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.6), new THREE.MeshLambertMaterial({ color: 0xd32f2f }));
      brim.position.set(0, 0, 0.65);
      cap.add(brim);
      this.playerBodyParts.head.add(cap);
      this.playerBodyParts.hatMesh = cap;
    }

    // Accessories
    if (c.accessory === 'backpack') {
      const bag = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.3, 0.6), new THREE.MeshLambertMaterial({ color: 0xff7043 }));
      bag.position.set(0, 0, -0.7);
      this.playerBodyParts.torso.add(bag);
      this.playerBodyParts.accessoryMesh = bag;
    } else if (c.accessory === 'wings') {
      const wingGroup = new THREE.Group();
      const wingMat = new THREE.MeshLambertMaterial({ color: 0x00e5ff });
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 0.1), wingMat);
      wingL.position.set(-1.1, 0.4, -0.6);
      wingL.rotation.y = -0.4;
      wingGroup.add(wingL);
      const wingR = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 0.1), wingMat);
      wingR.position.set(1.1, 0.4, -0.6);
      wingR.rotation.y = 0.4;
      wingGroup.add(wingR);
      this.playerBodyParts.torso.add(wingGroup);
      this.playerBodyParts.accessoryMesh = wingGroup as any;
    }
  }

  // NPCS SETUP

  private setupNPCs() {
    const npcDefs: CityNPC[] = [
      {
        id: 'marco',
        name: 'Chef Marco',
        role: 'Master Pizza Baker',
        dialogue: [
          'Welcome to Astro Pizza & Bakery! The oven is blazing hot!',
          'Rolling dough and baking fresh pies is an art. Want to work a shift?',
          'Our Special Paneer & Pepperoni combo is the city favorite today!',
        ],
        position: [-38, 0, -25],
        skinColor: '#ffd1a4',
        shirtColor: '#d32f2f',
        pantsColor: '#ffffff',
        hairColor: '#3e2723',
        hat: 'chef',
      },
      {
        id: 'raj',
        name: 'Officer Raj',
        role: 'City Patrol Officer',
        dialogue: [
          'Good day, citizen! Astro Place is safe and peaceful today.',
          'Remember to obey the speed limit near Central Plaza!',
          'If you need a police cruiser, head over to Astro Police Dept.',
        ],
        position: [6, 0, 16],
        skinColor: '#d7a16b',
        shirtColor: '#1565c0',
        pantsColor: '#263238',
        hairColor: '#212121',
        hat: 'police',
      },
      {
        id: 'priya',
        name: 'Barista Priya',
        role: 'Coffee Maestro',
        dialogue: [
          'Namaste! Welcome to Astro Cafe & Market.',
          'One cup of hot Masala Chai or iced Caramel Macchiato?',
          'Working as a barista earns great tips from all the tourists!',
        ],
        position: [-38, 0, 25],
        skinColor: '#caa078',
        shirtColor: '#43a047',
        pantsColor: '#37474f',
        hairColor: '#212121',
      },
      {
        id: 'ananya',
        name: 'Dr. Ananya',
        role: 'Chief Medical Doctor',
        dialogue: [
          'Hello! Staying healthy and active in Astro Place?',
          'Our clinic is fully equipped with digital health scanners.',
          'Drink plenty of water before dancing at the Villa!',
        ],
        position: [38, 0, -25],
        skinColor: '#e0bb95',
        shirtColor: '#ffffff',
        pantsColor: '#00838f',
        hairColor: '#4e342e',
      },
      {
        id: 'dj_astro',
        name: 'DJ Astro',
        role: 'Resident Party DJ',
        dialogue: [
          'Yoo! Welcome to Astro Party Villa & Beach Club!',
          'The bass is dropping and the fireworks are ready to launch!',
          'Host a party from your phone to invite the whole city!',
        ],
        position: [12, 0, 75],
        skinColor: '#ffdbac',
        shirtColor: '#e91e63',
        pantsColor: '#212121',
        hairColor: '#00e5ff',
        hat: 'party_crown',
      },
      {
        id: 'rohan',
        name: 'Rohan',
        role: 'City Cruiser',
        dialogue: [
          'Hey! Just admiring the fountain in Central Plaza.',
          'Have you tried driving the Neon Sports Car yet? It is lightning fast!',
          'My Astro Number is 777-99-8899. Save it in your phone!',
        ],
        position: [-10, 0, -8],
        skinColor: '#c68642',
        shirtColor: '#ff9800',
        pantsColor: '#1e88e5',
        hairColor: '#111111',
      },
      {
        id: 'sneha',
        name: 'Sneha',
        role: 'Fashion Designer',
        dialogue: [
          'Oh hi! That outfit looks great, but wait until you see the Boutique!',
          'You can customize your hair, wings, hats, and colors anytime.',
          'Looking fabulous is the best part of roleplaying in Astro Place.',
        ],
        position: [-55, 0, 4],
        skinColor: '#f1c27d',
        shirtColor: '#ab47bc',
        pantsColor: '#f8bbd0',
        hairColor: '#8e24aa',
      },
      {
        id: 'chen',
        name: 'Master Chen',
        role: 'Golden Dragon Wok Master',
        dialogue: [
          'Welcome to Golden Dragon Dynasty in Astro LAX!',
          'The woks are blazing with fiery Cantonese flavors. Want to work a shift?',
          'Our Dim Sum dumplings and Peking Duck are legendary across the bridge!',
        ],
        position: [235, 0, -35],
        skinColor: '#ffd1a4',
        shirtColor: '#b71c1c',
        pantsColor: '#212121',
        hairColor: '#111111',
        hat: 'chef',
      },
      {
        id: 'vikram',
        name: 'Chef Vikram',
        role: 'Royal Tandoor Maestro',
        dialogue: [
          'Namaste! Welcome to Taj Flavors Royal Indian Palace here in Astro LAX.',
          'Our clay tandoor oven reaches 450 degrees! Fresh Butter Naan and Biryani are ready.',
          'A true chef infuses saffron, cardamom, and love into every handi.',
        ],
        position: [235, 0, 35],
        skinColor: '#c68642',
        shirtColor: '#ff8f00',
        pantsColor: '#ffffff',
        hairColor: '#212121',
        hat: 'party_crown',
      },
      {
        id: 'sterling',
        name: 'Lord Sterling',
        role: 'Astro LAX Estate Magnate',
        dialogue: [
          'Welcome to my Royal Grand Mansion in Astro LAX, old chap!',
          'Magnificent view across the suspension bridge, isn\'t it?',
          'Feel free to take the Aero GT hypercar parked outside for a spin!',
        ],
        position: [280, 0, 10],
        skinColor: '#e0bb95',
        shirtColor: '#263238',
        pantsColor: '#37474f',
        hairColor: '#bdbdbd',
      },
      {
        id: 'bella',
        name: 'Bella',
        role: 'Artisan Gelato & Pizza Chef',
        dialogue: [
          'Ciao! Welcome to Astro LAX Coastal Pizzeria & Gelateria!',
          'Would you like a scoop of Pistachio Stracciatella or a slice of fresh Margherita?',
          'Eating gelato while watching yachts pass under the bridge is pure bliss.',
        ],
        position: [205, 0, -75],
        skinColor: '#ffdbac',
        shirtColor: '#00bcd4',
        pantsColor: '#ffffff',
        hairColor: '#795548',
      },
    ];

    npcDefs.forEach((data) => {
      const group = new THREE.Group();
      group.position.set(...data.position);

      // Simple blocky mesh for NPC
      const skinMat = new THREE.MeshLambertMaterial({ color: data.skinColor });
      const shirtMat = new THREE.MeshLambertMaterial({ color: data.shirtColor });
      const pantsMat = new THREE.MeshLambertMaterial({ color: data.pantsColor });

      const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), skinMat);
      head.position.y = 3.4;
      group.add(head);

      // Eyes
      const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.05), new THREE.MeshBasicMaterial({ color: 0x111111 }));
      eyeL.position.set(-0.3, 0.05, 0.61);
      head.add(eyeL);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.3;
      head.add(eyeR);

      // Hat if applicable
      if (data.hat === 'chef') {
        const chefHat = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.6, 1.2, 12), new THREE.MeshLambertMaterial({ color: 0xffffff }));
        chefHat.position.y = 1.1;
        head.add(chefHat);
      } else if (data.hat === 'police') {
        const polHat = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.65, 0.45, 12), new THREE.MeshLambertMaterial({ color: 0x1565c0 }));
        polHat.position.y = 0.85;
        head.add(polHat);
      } else if (data.hat === 'party_crown') {
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.6, 0.5, 5), new THREE.MeshLambertMaterial({ color: 0xffd700 }));
        crown.position.y = 0.95;
        head.add(crown);
      }

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 1.0), shirtMat);
      torso.position.y = 2.0;
      group.add(torso);

      // Legs
      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.7), pantsMat);
      legL.position.set(-0.45, 0.7, 0);
      group.add(legL);

      const legR = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.7), pantsMat);
      legR.position.set(0.45, 0.7, 0);
      group.add(legR);

      // Speech bubble placeholder (floating name tag)
      this.scene.add(group);

      this.npcs.push({
        data,
        group,
        targetPos: new THREE.Vector3(...data.position),
        waitTimer: Math.random() * 3,
      });

      this.interactiveZones.push({
        id: `npc_${data.id}`,
        name: `Talk to ${data.name}`,
        type: 'npc',
        position: group.position,
        radius: 3.5,
        data,
      });
    });
  }

  // VEHICLES IN WORLD

  private setupWorldVehicles() {
    const initialVehicles: { data: VehicleData; pos: [number, number, number]; rot: number }[] = [
      {
        data: {
          id: 'v_sports',
          name: 'Neon Apex GT',
          speed: 48,
          color: '#ff1744',
          type: 'sports',
          price: 25000,
          owned: true,
        },
        pos: [14, 0, -18],
        rot: 0,
      },
      {
        data: {
          id: 'v_scooter',
          name: 'Astro Pizza Scooter',
          speed: 36,
          color: '#ffc107',
          type: 'scooter',
          price: 8000,
          owned: true,
        },
        pos: [-30, 0, -22],
        rot: Math.PI / 2,
      },
      {
        data: {
          id: 'v_cruiser',
          name: 'Astro City Cruiser',
          speed: 40,
          color: '#00e5ff',
          type: 'cruiser',
          price: 15000,
          owned: true,
        },
        pos: [-14, 0, 18],
        rot: Math.PI,
      },
      {
        data: {
          id: 'v_police',
          name: 'Police Enforcer Cruiser',
          speed: 45,
          color: '#1565c0',
          type: 'police',
          price: 32000,
          owned: true,
        },
        pos: [30, 0, 22],
        rot: -Math.PI / 2,
      },
      {
        data: {
          id: 'v_aerogt',
          name: 'Astro LAX Aero GT',
          speed: 56,
          color: '#ffd700',
          type: 'sports',
          price: 65000,
          owned: true,
        },
        pos: [275, 0, 14],
        rot: -Math.PI / 2,
      },
    ];

    initialVehicles.forEach(({ data, pos, rot }) => {
      this.spawnVehicleInWorld(data, new THREE.Vector3(...pos), rot);
    });
  }

  public spawnVehicleInWorld(data: VehicleData, pos: THREE.Vector3, rot = 0) {
    // Remove if already exists with same id
    const existingIdx = this.worldVehicles.findIndex((v) => v.data.id === data.id);
    if (existingIdx !== -1) {
      this.scene.remove(this.worldVehicles[existingIdx].group);
      this.worldVehicles.splice(existingIdx, 1);
    }

    const { group, wheels } = this.createCarMesh(data.type, parseInt(data.color.replace('#', '0x'), 16));
    group.position.copy(pos);
    group.rotation.y = rot;
    this.scene.add(group);

    this.worldVehicles.push({ data, group, wheels });

    // Interactive zone
    this.interactiveZones.push({
      id: `drive_${data.id}`,
      name: `Drive ${data.name}`,
      type: 'vehicle',
      position: group.position,
      radius: 4,
      data,
    });
  }

  private createCarMesh(type: string, colorHex: number): { group: THREE.Group; wheels: THREE.Mesh[] } {
    const group = new THREE.Group();
    const wheels: THREE.Mesh[] = [];

    const bodyMat = new THREE.MeshLambertMaterial({ color: colorHex });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x81d4fa, transparent: true, opacity: 0.6 });
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x212121 });

    if (type === 'scooter') {
      // Sleek Delivery Scooter
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 3), bodyMat);
      frame.position.y = 0.8;
      group.add(frame);

      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8), darkMat);
      handle.position.set(0, 1.6, 1.0);
      group.add(handle);

      const pizzaBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), new THREE.MeshLambertMaterial({ color: 0xd32f2f }));
      pizzaBox.position.set(0, 1.4, -1.0);
      group.add(pizzaBox);

      // 2 wheels
      [-1.1, 1.1].forEach((wz) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 16), wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(0, 0.45, wz);
        group.add(wheel);
        wheels.push(wheel);
      });
    } else {
      // Car / Van / Sports / Police
      const bodyWidth = 3.2;
      const bodyLength = 6.2;
      const bodyHeight = 1.3;

      const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyLength), bodyMat);
      lowerBody.position.y = 1.0;
      lowerBody.castShadow = true;
      group.add(lowerBody);

      // Cabin / Roof
      const cabinHeight = type === 'van' ? 1.8 : 1.1;
      const cabinLength = type === 'van' ? 4.2 : 3.2;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth * 0.85, cabinHeight, cabinLength), glassMat);
      cabin.position.set(0, 1.0 + bodyHeight / 2 + cabinHeight / 2, type === 'van' ? -0.4 : -0.2);
      group.add(cabin);

      // Roof cover
      const roof = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth * 0.86, 0.2, cabinLength), bodyMat);
      roof.position.set(0, cabin.position.y + cabinHeight / 2 + 0.1, cabin.position.z);
      group.add(roof);

      // Headlights
      const lightGeo = new THREE.BoxGeometry(0.6, 0.3, 0.1);
      const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffea });
      const hlL = new THREE.Mesh(lightGeo, lightMat);
      hlL.position.set(-1.1, 1.0, bodyLength / 2 + 0.05);
      group.add(hlL);
      const hlR = hlL.clone();
      hlR.position.x = 1.1;
      group.add(hlR);

      // Taillights
      const tailMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
      const tlL = new THREE.Mesh(lightGeo, tailMat);
      tlL.position.set(-1.1, 1.0, -bodyLength / 2 - 0.05);
      group.add(tlL);
      const tlR = tlL.clone();
      tlR.position.x = 1.1;
      group.add(tlR);

      // Police Sirens on roof
      if (type === 'police') {
        const sirenR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.6), new THREE.MeshBasicMaterial({ color: 0xff1744 }));
        sirenR.position.set(-0.6, roof.position.y + 0.3, roof.position.z);
        group.add(sirenR);
        const sirenB = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.6), new THREE.MeshBasicMaterial({ color: 0x2979ff }));
        sirenB.position.set(0.6, roof.position.y + 0.3, roof.position.z);
        group.add(sirenB);
      }

      // 4 Wheels
      const wheelOffsets = [
        [-bodyWidth / 2 - 0.15, 0.55, bodyLength / 3],
        [bodyWidth / 2 + 0.15, 0.55, bodyLength / 3],
        [-bodyWidth / 2 - 0.15, 0.55, -bodyLength / 3],
        [bodyWidth / 2 + 0.15, 0.55, -bodyLength / 3],
      ];

      wheelOffsets.forEach(([wx, wy, wz]) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 16), wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, wy, wz);
        wheel.castShadow = true;
        group.add(wheel);
        wheels.push(wheel);
      });
    }

    return { group, wheels };
  }

  // EVENT LISTENERS & INPUT

  private setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code] = true;

      // Key E to interact or drive
      if (e.key.toLowerCase() === 'e') {
        this.triggerInteraction();
      }
      // Space to jump
      if (e.code === 'Space' && !this.activeVehicle && this.isGrounded) {
        this.playerVelocity.y = 9;
        this.isGrounded = false;
        soundManager.playJump();
      }
      // H for Car Horn
      if (e.key.toLowerCase() === 'h' && this.activeVehicle) {
        soundManager.playHorn();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.code] = false;
    });

    // Pointer controls for camera orbit
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', (e) => {
      this.isPointerDown = true;
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isPointerDown) return;
      const dx = e.clientX - this.prevPointerX;
      const dy = e.clientY - this.prevPointerY;
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;

      this.cameraYaw -= dx * 0.007;
      this.cameraPitch = Math.max(0.1, Math.min(1.2, this.cameraPitch + dy * 0.007));
    });

    window.addEventListener('pointerup', () => {
      this.isPointerDown = false;
    });

    dom.addEventListener(
      'wheel',
      (e) => {
        this.cameraDistance = Math.max(5, Math.min(28, this.cameraDistance + e.deltaY * 0.02));
      },
      { passive: true }
    );

    // Resize
    window.addEventListener('resize', this.onWindowResize);
  }

  private onWindowResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  // INTERACTION HANDLING

  public triggerInteraction() {
    if (this.activeVehicle) {
      // Exit vehicle
      this.exitCurrentVehicle();
      return;
    }

    if (!this.nearestZone) return;

    if (this.nearestZone.type === 'vehicle' && this.nearestZone.data) {
      this.enterVehicle(this.nearestZone.data);
    } else if (this.nearestZone.type === 'npc' && this.nearestZone.data) {
      if (this.onNPCInteract) this.onNPCInteract(this.nearestZone.data);
    } else {
      if (this.onNearestZoneChange) {
        // Broadcast custom action if needed
      }
    }
  }

  public enterVehicle(vehicle: VehicleData) {
    const found = this.worldVehicles.find((v) => v.data.id === vehicle.id);
    if (!found) return;

    this.activeVehicle = found.group;
    this.vehicleData = vehicle;
    this.vehicleSpeed = 0;
    this.vehicleHeading = found.group.rotation.y;

    // Hide player legs/arms or position inside vehicle
    this.playerGroup.visible = false;
    soundManager.playHorn();

    if (this.onEnterVehicle) {
      this.onEnterVehicle(vehicle);
    }
  }

  public exitCurrentVehicle() {
    if (!this.activeVehicle) return;

    // Place player beside vehicle
    this.playerPos.copy(this.activeVehicle.position);
    this.playerPos.x += 3 * Math.cos(this.vehicleHeading);
    this.playerPos.z += 3 * Math.sin(this.vehicleHeading);
    this.playerPos.y = 0;
    this.playerGroup.position.copy(this.playerPos);
    this.playerGroup.visible = true;

    this.activeVehicle = null;
    this.vehicleData = null;
    this.vehicleSpeed = 0;
  }

  public launchFireworks() {
    soundManager.playFirework();

    const group = new THREE.Group();
    group.position.set(this.playerPos.x, 15 + Math.random() * 8, this.playerPos.z);

    const count = 90;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    const colors = [0xff0055, 0x00ffcc, 0xffea00, 0x9d00ff, 0x00e5ff];
    const pickedColor = colors[Math.floor(Math.random() * colors.length)];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = 4 + Math.random() * 8;

      vel[i * 3] = speed * Math.sin(phi) * Math.cos(theta);
      vel[i * 3 + 1] = speed * Math.sin(phi) * Math.sin(theta);
      vel[i * 3 + 2] = speed * Math.cos(phi);
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: pickedColor,
      size: 0.6,
      transparent: true,
      opacity: 1.0,
    });

    const particles = new THREE.Points(geo, mat);
    group.add(particles);
    this.scene.add(group);

    this.fireworkParticles.push({
      group,
      particles,
      life: 0,
      maxLife: 2.2,
    });
  }

  // UPDATE & ANIMATION LOOP

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.updatePlayer(delta);
    this.updateVehicle(delta);
    this.updateCamera(delta);
    this.updateNPCs(delta);
    this.updateEnvironment(delta);
    this.checkInteractiveZones();

    this.renderer.render(this.scene, this.camera);
  };

  private updatePlayer(delta: number) {
    if (this.activeVehicle) return;

    // Movement Vector from Keys and Virtual Move Controls
    let moveX = this.virtualMove.x;
    let moveZ = this.virtualMove.z;

    if (this.keys['w'] || this.keys['arrowup']) moveZ -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveZ += 1;
    if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveX += 1;

    // Clamp / Normalize
    const inputLen = Math.hypot(moveX, moveZ);
    if (inputLen > 1) {
      moveX /= inputLen;
      moveZ /= inputLen;
    }

    const isInputActive = Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05;

    if (isInputActive) {
      this.isDancing = false;
      this.isSitting = false;

      // Transform movement relative to camera yaw
      const forward = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
      const right = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));

      const dir = forward.multiplyScalar(-moveZ).add(right.multiplyScalar(moveX)).normalize();
      const speed = 14;

      this.playerPos.x += dir.x * speed * delta;
      this.playerPos.z += dir.z * speed * delta;

      // Rotate player smoothly towards movement direction
      this.playerHeading = Math.atan2(dir.x, dir.z);
      this.playerGroup.rotation.y = this.playerHeading;

      this.isMoving = true;

      // Walk cycle animation
      const walkFreq = 10;
      const walkTime = this.clock.getElapsedTime() * walkFreq;
      const legAngle = Math.sin(walkTime) * 0.6;
      const armAngle = Math.sin(walkTime) * 0.6;

      this.playerBodyParts.leftLeg.rotation.x = legAngle;
      this.playerBodyParts.rightLeg.rotation.x = -legAngle;
      this.playerBodyParts.leftArm.rotation.x = -armAngle;
      this.playerBodyParts.rightArm.rotation.x = armAngle;

      // Subtle vertical bob
      this.playerGroup.position.y = this.playerPos.y + Math.abs(Math.sin(walkTime * 2)) * 0.15;

      // Footstep sound
      if (Math.sin(walkTime) > 0.95) {
        soundManager.playFootstep();
      }
    } else {
      this.isMoving = false;

      if (this.isDancing) {
        const danceTime = this.clock.getElapsedTime() * 8;
        this.playerBodyParts.leftArm.rotation.x = Math.sin(danceTime) * 1.2;
        this.playerBodyParts.rightArm.rotation.x = -Math.sin(danceTime) * 1.2;
        this.playerBodyParts.leftArm.rotation.z = Math.sin(danceTime) * 0.5;
        this.playerBodyParts.rightArm.rotation.z = -Math.sin(danceTime) * 0.5;
        this.playerGroup.rotation.y += delta * 3;
        this.playerGroup.position.y = this.playerPos.y + Math.abs(Math.sin(danceTime * 2)) * 0.3;
      } else if (this.isWaving) {
        this.waveTime += delta * 6;
        this.playerBodyParts.rightArm.rotation.x = 2.4;
        this.playerBodyParts.rightArm.rotation.z = Math.sin(this.waveTime) * 0.6;
      } else {
        // Idle pose
        this.playerBodyParts.leftLeg.rotation.x = 0;
        this.playerBodyParts.rightLeg.rotation.x = 0;
        this.playerBodyParts.leftArm.rotation.x = 0;
        this.playerBodyParts.leftArm.rotation.z = 0;
        this.playerBodyParts.rightArm.rotation.x = 0;
        this.playerBodyParts.rightArm.rotation.z = 0;
        this.playerGroup.position.y = this.playerPos.y;
      }
    }

    // Gravity and Bridge Height
    const groundY = this.getGroundHeightAt(this.playerPos.x, this.playerPos.z);
    if (!this.isGrounded) {
      this.playerVelocity.y -= 24 * delta;
      this.playerPos.y += this.playerVelocity.y * delta;
      if (this.playerPos.y <= groundY) {
        this.playerPos.y = groundY;
        this.playerVelocity.y = 0;
        this.isGrounded = true;
      }
    } else {
      this.playerPos.y = groundY;
    }

    // Bounds limit (extended to Astro LAX)
    this.playerPos.x = Math.max(-135, Math.min(325, this.playerPos.x));
    this.playerPos.z = Math.max(-135, Math.min(135, this.playerPos.z));

    this.playerGroup.position.x = this.playerPos.x;
    this.playerGroup.position.z = this.playerPos.z;
  }

  private updateVehicle(delta: number) {
    if (!this.activeVehicle || !this.vehicleData) return;

    let accel = -this.virtualMove.z;
    let turn = -this.virtualMove.x;

    if (this.keys['w'] || this.keys['arrowup']) accel += 1;
    if (this.keys['s'] || this.keys['arrowdown']) accel -= 0.6;
    if (this.keys['a'] || this.keys['arrowleft']) turn += 1;
    if (this.keys['d'] || this.keys['arrowright']) turn -= 1;

    const maxSpeed = this.vehicleData.speed;
    const accelRate = 35;
    const drag = 15;

    if (accel !== 0) {
      this.vehicleSpeed += accel * accelRate * delta;
      this.vehicleSpeed = Math.max(-maxSpeed * 0.4, Math.min(maxSpeed, this.vehicleSpeed));
    } else {
      if (this.vehicleSpeed > 0) {
        this.vehicleSpeed = Math.max(0, this.vehicleSpeed - drag * delta);
      } else if (this.vehicleSpeed < 0) {
        this.vehicleSpeed = Math.min(0, this.vehicleSpeed + drag * delta);
      }
    }

    // Steering proportional to speed
    if (Math.abs(this.vehicleSpeed) > 0.5) {
      const turnSpeed = (this.vehicleSpeed / maxSpeed) * 2.8;
      this.vehicleHeading += turn * turnSpeed * delta;
      this.activeVehicle.rotation.y = this.vehicleHeading;
    }

    // Advance vehicle position
    const forwardX = Math.sin(this.vehicleHeading);
    const forwardZ = Math.cos(this.vehicleHeading);

    this.activeVehicle.position.x += forwardX * this.vehicleSpeed * delta;
    this.activeVehicle.position.z += forwardZ * this.vehicleSpeed * delta;

    // Follow bridge height slope
    const vehGroundY = this.getGroundHeightAt(this.activeVehicle.position.x, this.activeVehicle.position.z);
    this.activeVehicle.position.y = vehGroundY;

    // Bounds (extended to Astro LAX)
    this.activeVehicle.position.x = Math.max(-135, Math.min(325, this.activeVehicle.position.x));
    this.activeVehicle.position.z = Math.max(-135, Math.min(135, this.activeVehicle.position.z));

    // Follow vehicle position with player reference
    this.playerPos.copy(this.activeVehicle.position);
  }

  private updateCamera(delta: number) {
    const target = this.activeVehicle ? this.activeVehicle.position : this.playerPos;

    const offsetX = Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;
    const offsetY = Math.sin(this.cameraPitch) * this.cameraDistance + 2.5;
    const offsetZ = Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;

    const desiredCamPos = new THREE.Vector3(
      target.x + offsetX,
      target.y + offsetY,
      target.z + offsetZ
    );

    this.camera.position.lerp(desiredCamPos, 0.12);
    this.camera.lookAt(target.x, target.y + 2.2, target.z);
  }

  private updateNPCs(delta: number) {
    const time = this.clock.getElapsedTime();

    this.npcs.forEach((npc, idx) => {
      // NPC subtle idle breathing / bob
      npc.group.position.y = Math.sin(time * 3 + idx) * 0.08;

      // Look towards player if close
      const dist = npc.group.position.distanceTo(this.playerPos);
      if (dist < 8) {
        const lookAngle = Math.atan2(
          this.playerPos.x - npc.group.position.x,
          this.playerPos.z - npc.group.position.z
        );
        npc.group.rotation.y = THREE.MathUtils.lerp(npc.group.rotation.y, lookAngle, 0.1);
      }
    });
  }

  private updateEnvironment(delta: number) {
    const time = this.clock.getElapsedTime();

    // Pulse disco lights at Party Villa
    this.discoLights.forEach((light, idx) => {
      light.intensity = 1.5 + Math.sin(time * 8 + idx * Math.PI) * 1.2;
    });

    // Animate fountain particles
    if (this.fountainParticles) {
      const posAttr = this.fountainParticles.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3 + 1] -= delta * 3.5;
        if (arr[i * 3 + 1] < 1.2) {
          arr[i * 3 + 1] = 4.8 + Math.random() * 1.5;
          arr[i * 3] = (Math.random() - 0.5) * 2;
          arr[i * 3 + 2] = (Math.random() - 0.5) * 2;
        }
      }
      posAttr.needsUpdate = true;
    }

    // Update fireworks
    for (let i = this.fireworkParticles.length - 1; i >= 0; i--) {
      const fw = this.fireworkParticles[i];
      fw.life += delta;
      const posAttr = fw.particles.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let j = 0; j < arr.length / 3; j++) {
        arr[j * 3] += (Math.random() - 0.5) * delta * 12;
        arr[j * 3 + 1] += (Math.random() - 0.6) * delta * 12;
        arr[j * 3 + 2] += (Math.random() - 0.5) * delta * 12;
      }
      posAttr.needsUpdate = true;
      (fw.particles.material as THREE.PointsMaterial).opacity = 1 - fw.life / fw.maxLife;

      if (fw.life >= fw.maxLife) {
        this.scene.remove(fw.group);
        this.fireworkParticles.splice(i, 1);
      }
    }
  }

  private checkInteractiveZones() {
    let closestZone: InteractiveZone | null = null;
    let minDist = Infinity;

    const checkPos = this.activeVehicle ? this.activeVehicle.position : this.playerPos;

    for (const zone of this.interactiveZones) {
      const dist = checkPos.distanceTo(zone.position);
      if (dist <= zone.radius && dist < minDist) {
        minDist = dist;
        closestZone = zone;
      }
    }

    if (this.nearestZone !== closestZone) {
      this.nearestZone = closestZone;
      if (this.onNearestZoneChange) {
        this.onNearestZoneChange(closestZone);
      }
    }
  }

  public teleportTo(x: number, z: number) {
    if (this.activeVehicle) {
      this.activeVehicle.position.set(x, 0, z);
    }
    this.playerPos.set(x, 0, z);
    this.playerGroup.position.set(x, 0, z);
  }

  public setDance(dancing: boolean) {
    this.isDancing = dancing;
  }

  public triggerWave() {
    this.isWaving = true;
    this.waveTime = 0;
    setTimeout(() => {
      this.isWaving = false;
    }, 2000);
  }

  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
