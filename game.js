
// CHECK THREE.JS
if (typeof THREE === "undefined") {
  alert("3D library load nahi hui. Internet check karo aur page refresh karo.");
  throw new Error("THREE is not loaded");
}

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 80, 260);

const camera = new THREE.PerspectiveCamera(
  65, window.innerWidth / window.innerHeight, 0.1, 500
);
camera.position.set(0, 8, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// LIGHTS
scene.add(new THREE.HemisphereLight(0xffffff, 0x557744, 2));

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(-20, 40, 20);
scene.add(sun);

// MATERIAL HELPER
function material(color) {
  return new THREE.MeshStandardMaterial({ color });
}

// BOX HELPER
function box(parent, w, h, d, color, x, y, z) {
  const obj = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    material(color)
  );
  obj.position.set(x, y, z);
  parent.add(obj);
  return obj;
}

// GROUND
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 600),
  material(0x388b3b)
);
ground.rotation.x = -Math.PI / 2;
ground.position.z = -180;
scene.add(ground);

// ROAD
const road = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 600),
  material(0x333333)
);
road.rotation.x = -Math.PI / 2;
road.position.set(0, 0.03, -180);
scene.add(road);

// MOVING WORLD
const world = new THREE.Group();
scene.add(world);

const scenery = [];
const traffic = [];
const coins = [];

// ROAD MARKINGS
for (let z = -400; z < 20; z += 12) {
  const line = box(world, 0.2, 0.05, 5, 0xffffff, 0, 0.07, z);
  scenery.push(line);
}

// BUILDINGS
function createBuilding(x, z) {
  const group = new THREE.Group();
  const height = 12 + Math.random() * 22;
  const colors = [0xd9b38c, 0xaabbcc, 0xc9c9b9, 0xaaaaaa];

  const color = colors[Math.floor(Math.random() * colors.length)];

  box(group, 9, height, 10, color, 0, height / 2, 0);

  for (let y = 3; y < height - 1; y += 4) {
    for (let wx = -3; wx <= 3; wx += 3) {
      box(group, 1.2, 1.5, 0.12, 0x83d7ef, wx, y, 5.06);
    }
  }

  group.position.set(x, 0, z);
  world.add(group);
  scenery.push(group);
}

for (let z = -380; z < 10; z += 28) {
  createBuilding(-17, z);
  createBuilding(17, z - 12);
}

// TREES
function createTree(x, z) {
  const tree = new THREE.Group();

  box(tree, 0.8, 4, 0.8, 0x754321, 0, 2, 0);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 12, 10),
    material(0x16852b)
  );
  leaves.position.y = 5;
  tree.add(leaves);

  tree.position.set(x, 0, z);
  world.add(tree);
  scenery.push(tree);
}

for (let z = -350; z < 10; z += 35) {
  createTree(-12, z);
  createTree(12, z - 15);
}

// PLAYER CAR
const car = new THREE.Group();

box(car, 2.5, 0.8, 4.5, 0xe51b23, 0, 0.9, 0);
box(car, 1.8, 0.9, 2, 0x222f46, 0, 1.65, -0.3);

for (const x of [-1.25, 1.25]) {
  for (const z of [-1.4, 1.4]) {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.3, 16),
      material(0x111111)
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.5, z);
    car.add(wheel);
  }
}

car.position.set(0, 0, 5);
scene.add(car);

// TRAFFIC
function createTraffic(z, index) {
  const vehicle = new THREE.Group();
  const colors = [0x2196f3, 0xffcc00, 0xffffff, 0x222222];

  const color = colors[index % colors.length];

  box(vehicle, 2.2, 0.8, 4, color, 0, 0.8, 0);
  box(vehicle, 1.6, 0.8, 1.8, 0x333b4a, 0, 1.5, -0.2);

  vehicle.position.set([-5, 0, 5][index % 3], 0, z);
  world.add(vehicle);
  traffic.push(vehicle);
}

for (let i = 0; i < 6; i++) {
  createTraffic(-50 - i * 55, i);
}

// COINS
function createCoin(z, index) {
  const coin = new THREE.Mesh(
    new THREE.TorusGeometry(0.8, 0.2, 10, 20),
    new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.6,
      roughness: 0.25
    })
  );

  coin.position.set([-5, 0, 5][index % 3], 1.5, z);
  world.add(coin);
  coins.push(coin);
}

for (let i = 0; i < 6; i++) {
  createCoin(-80 - i * 65, i);
}

// GAME VARIABLES
let running = false;
let score = 0;
let speed = 22;
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
  const button = document.getElementById(id);

  button.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    keys[key] = true;
  });

  ["pointerup", "pointerleave", "pointercancel"].forEach(event => {
    button.addEventListener(event, () => keys[key] = false);
  });
}

holdButton("leftBtn", "arrowleft");
holdButton("rightBtn", "arrowright");

// RESET
function resetGame() {
  score = 0;
  speed = 22;
  playerX = 0;
  car.position.x = 0;

  traffic.forEach((vehicle, i) => {
    vehicle.position.z = -50 - i * 55;
    vehicle.position.x = [-5, 0, 5][i % 3];
  });

  coins.forEach((coin, i) => {
    coin.position.z = -80 - i * 65;
    coin.position.x = [-5, 0, 5][i % 3];
    coin.visible = true;
  });

  document.getElementById("score").textContent = "0";
  document.getElementById("speed").textContent = "0";
}

// START GAME
function startGame() {
  resetGame();

  document.getElementById("menu").classList.add("hidden");
  document.getElementById("gameOver").classList.add("hidden");
  document.getElementById("hud").classList.remove("hidden");
  document.getElementById("controls").classList.remove("hidden");

  running = true;
}

// GAME OVER
function endGame() {
  if (!running) return;

  running = false;

  document.getElementById("finalScore").textContent = score;
  document.getElementById("gameOver").classList.remove("hidden");
}

// BUTTON EVENTS
document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("restartBtn").addEventListener("click", startGame);

// GAME LOOP
let previousTime = 0;

function animate(time) {
  requestAnimationFrame(animate);

  const dt = Math.min((time - previousTime) / 1000 || 0, 0.05);
  previousTime = time;

  if (running) {
    // CAR MOVEMENT
    if (keys["arrowleft"] || keys["a"]) playerX -= 12 * dt;
    if (keys["arrowright"] || keys["d"]) playerX += 12 * dt;

    playerX = THREE.MathUtils.clamp(playerX, -6.5, 6.5);
    car.position.x = THREE.MathUtils.lerp(car.position.x, playerX, 0.2);

    // CITY AND ROAD MOVEMENT
    scenery.forEach((obj) => {
      obj.position.z += speed * dt;

      if (obj.position.z > 20) {
        obj.position.z -= 420;
      }
    });

    // TRAFFIC MOVEMENT
    traffic.forEach((vehicle) => {
      vehicle.position.z += speed * dt * 0.8;

      if (vehicle.position.z > 18) {
        vehicle.position.z = -280 - Math.random() * 80;
        vehicle.position.x = [-5, 0, 5][Math.floor(Math.random() * 3)];
      }

      const hitZ = Math.abs(vehicle.position.z - car.position.z) < 3.2;
      const hitX = Math.abs(vehicle.position.x - car.position.x) < 2.1;

      if (hitZ && hitX) endGame();
    });

    // COIN COLLECTION
    coins.forEach((coin) => {
      coin.position.z += speed * dt;
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

    speed = Math.min(speed + dt * 0.25, 45);

    document.getElementById("score").textContent = score;
    document.getElementById("speed").textContent = Math.round(speed * 3.6);

    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x, car.position.x * 0.35, 0.05
    );

    camera.lookAt(car.position.x * 0.2, 0, -15);
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

// WINDOW RESIZE
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
