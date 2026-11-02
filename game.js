console.log("GAME JS LOADED");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 100, 300);

const camera = new THREE.PerspectiveCamera(
  65, window.innerWidth / window.innerHeight, 0.1, 500
);

camera.position.set(0, 8, 15);
camera.lookAt(0, 0, -15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// LIGHTS
scene.add(new THREE.HemisphereLight(0xffffff, 0x667755, 2));

const sunlight = new THREE.DirectionalLight(0xffffff, 2);
sunlight.position.set(-30, 60, 30);
sunlight.castShadow = true;
scene.add(sunlight);

// GROUND
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 600),
  new THREE.MeshStandardMaterial({ color: 0x398b3b })
);
ground.rotation.x = -Math.PI / 2;
ground.position.z = -180;
ground.receiveShadow = true;
scene.add(ground);

// ROAD
const road = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 600),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
road.rotation.x = -Math.PI / 2;
road.position.set(0, 0.02, -180);
scene.add(road);

// ROAD SIDES
function makeBox(w, h, d, color, x, y, z, parent = scene) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color })
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

makeBox(1, 0.2, 600, 0xcccccc, -9.5, 0.1, -180);
makeBox(1, 0.2, 600, 0xcccccc, 9.5, 0.1, -180);

// WORLD OBJECTS
const world = new THREE.Group();
scene.add(world);

const movingObjects = [];
const traffic = [];
const coins = [];

// ROAD LINES
for (let z = -400; z < 20; z += 12) {
  const line = makeBox(0.25, 0.04, 5, 0xffffff, 0, 0.06, z, world);
  movingObjects.push(line);
}

// BUILDINGS
function createBuilding(x, z) {
  const height = 10 + Math.random() * 28;
  const width = 7 + Math.random() * 7;
  const colors = [0xe0b68c, 0x9bb6c9, 0xd9d1b9, 0xaaaaaa];

  const building = new THREE.Group();

  const body = makeBox(
    width, height, 10,
    colors[Math.floor(Math.random() * colors.length)],
    0, height / 2, 0, building
  );

  // Windows
  for (let y = 2; y < height - 1; y += 3) {
    for (let wx = -width / 2 + 1.5; wx < width / 2; wx += 2.5) {
      makeBox(1, 1.4, 0.12, 0x83d7ef, wx, y, 5.06, building);
    }
  }

  building.position.set(x, 0, z);
  world.add(building);
  movingObjects.push(building);
}

for (let z = -380; z < 10; z += 28) {
  createBuilding(-17 - Math.random() * 8, z);
  createBuilding(17 + Math.random() * 8, z - 12);
}

// TREES
function createTree(x, z) {
  const tree = new THREE.Group();

  makeBox(0.8, 4, 0.8, 0x754321, 0, 2, 0, tree);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(2.5, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0x16852b })
  );
  leaves.position.y = 5;
  tree.add(leaves);

  tree.position.set(x, 0, z);
  world.add(tree);
  movingObjects.push(tree);
}

for (let z = -350; z < 10; z += 35) {
  createTree(-12, z);
  createTree(12, z - 15);
}

// PLAYER CAR
const car = new THREE.Group();
scene.add(car);

makeBox(2.5, 0.8, 4.5, 0xe51b23, 0, 0.9, 0, car);
makeBox(1.8, 0.9, 2, 0x222f46, 0, 1.65, -0.3, car);

// Wheels
for (const x of [-1.25, 1.25]) {
  for (const z of [-1.4, 1.4]) {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.48, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.5, z);
    car.add(wheel);
  }
}

car.position.set(0, 0, 5);

// TRAFFIC CARS
function createTrafficCar(z) {
  const vehicle = new THREE.Group();

  const colors = [0x2196f3, 0xffcc00, 0xffffff, 0x222222];
  const color = colors[Math.floor(Math.random() * colors.length)];

  makeBox(2.2, 0.8, 4, color, 0, 0.8, 0, vehicle);
  makeBox(1.6, 0.8, 1.8, 0x333b4a, 0, 1.5, -0.2, vehicle);

  const lane = [-5, 0, 5][Math.floor(Math.random() * 3)];
  vehicle.position.set(lane, 0, z);

  world.add(vehicle);
  traffic.push(vehicle);
}

for (let i = 0; i < 7; i++) {
  createTrafficCar(-40 - i * 45);
}

// COINS
function createCoin(z) {
  const coin = new THREE.Mesh(
    new THREE.TorusGeometry(0.8, 0.2, 10, 20),
    new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.7,
      roughness: 0.2
    })
  );

  coin.position.set([-5, 0, 5][Math.floor(Math.random() * 3)], 1.5, z);
  world.add(coin);
  coins.push(coin);
}

for (let i = 0; i < 6; i++) {
  createCoin(-70 - i * 65);
}

// GAME STATE
let running = false;
let gameSpeed = 22;
let score = 0;
let playerX = 0;

const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

// MOBILE BUTTONS
function holdButton(id, key) {
  const btn = document.getElementById(id);

  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    keys[key] = true;
  });

  btn.addEventListener("pointerup", () => keys[key] = false);
  btn.addEventListener("pointerleave", () => keys[key] = false);
  btn.addEventListener("pointercancel", () => keys[key] = false);
}

holdButton("leftBtn", "arrowleft");
holdButton("rightBtn", "arrowright");

// START / RESTART
console.log("START BUTTON FOUND:", document.getElementById("startBtn"));
function startGame() {
  score = 0;
  gameSpeed = 22;
  playerX = 0;
  car.position.x = 0;

  traffic.forEach((vehicle, i) => {
    vehicle.position.z = -40 - i * 45;
  });

  coins.forEach((coin, i) => {
    coin.position.z = -70 - i * 65;
    coin.visible = true;
  });

  document.getElementById("score").textContent = score;
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("gameOver").classList.add("hidden");

  running = true;
}

function endGame() {
  running = false;
  document.getElementById("finalScore").textContent = score;
  document.getElementById("gameOver").classList.remove("hidden");
}

document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("restartBtn").addEventListener("click", startGame);

// ANIMATION
let lastTime = 0;

function animate(time) {
  requestAnimationFrame(animate);

  const dt = Math.min((time - lastTime) / 1000 || 0, 0.05);
  lastTime = time;

  if (running) {
    // Steering
    if (keys["arrowleft"] || keys["a"]) playerX -= 12 * dt;
    if (keys["arrowright"] || keys["d"]) playerX += 12 * dt;

    playerX = THREE.MathUtils.clamp(playerX, -6.5, 6.5);
    car.position.x = THREE.MathUtils.lerp(car.position.x, playerX, 0.2);

    // Move road markings and city
    movingObjects.forEach((obj) => {
      obj.position.z += gameSpeed * dt;

      if (obj.position.z > 20) {
        obj.position.z -= 420;
      }
    });

    // Traffic movement and collision
    traffic.forEach((vehicle) => {
      vehicle.position.z += gameSpeed * dt * 0.8;

      if (vehicle.position.z > 18) {
        vehicle.position.z = -250 - Math.random() * 100;
        vehicle.position.x = [-5, 0, 5][Math.floor(Math.random() * 3)];
      }

      const closeZ = Math.abs(vehicle.position.z - car.position.z) < 3.2;
      const closeX = Math.abs(vehicle.position.x - car.position.x) < 2.1;

      if (closeZ && closeX) endGame();
    });

    // Collect coins
    coins.forEach((coin) => {
      coin.position.z += gameSpeed * dt;
      coin.rotation.y += 3 * dt;

      if (
        coin.visible &&
        Math.abs(coin.position.z - car.position.z) < 3 &&
        Math.abs(coin.position.x - car.position.x) < 2
      ) {
        coin.visible = false;
        score += 10;
      }

      if (coin.position.z > 15) {
        coin.position.z = -300 - Math.random() * 100;
        coin.position.x = [-5, 0, 5][Math.floor(Math.random() * 3)];
        coin.visible = true;
      }
    });

    gameSpeed = Math.min(gameSpeed + dt * 0.25, 45);

    document.getElementById("score").textContent = score;
    document.getElementById("speed").textContent =
      Math.round(gameSpeed * 3.6);

    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x, car.position.x * 0.35, 0.05
    );
    camera.lookAt(car.position.x * 0.2, 0, -15);
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

// RESIZE
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
