
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

let running = false;
let score = 0;
let coinCount = 0;
let lane = 1;
let obstacles = [];
let coins = [];
let spawnTimer = 0;
let coinTimer = 0;
let lastTime = 0;
let gameSpeed = 0.48;

let jumpTime = 0;
let slideTime = 0;

const player = {
  x: 450,
  y: 490
};

// LANE POSITION
function laneX(laneNumber, depth) {
  return W / 2 + (laneNumber - 1) * (45 + depth * 115);
}

// START GAME
function startGame() {
  score = 0;
  coinCount = 0;
  lane = 1;
  obstacles = [];
  coins = [];
  spawnTimer = 0;
  coinTimer = 0;
  gameSpeed = 0.48;
  jumpTime = 0;
  slideTime = 0;

  player.x = 450;

  document.getElementById("menu").classList.add("hidden");
  document.getElementById("gameOver").classList.add("hidden");
  document.getElementById("hud").classList.remove("hidden");

  running = true;
  lastTime = performance.now();
}

// GAME OVER
function endGame() {
  if (!running) return;

  running = false;

  document.getElementById("finalScore").textContent =
    Math.floor(score);

  document.getElementById("finalCoins").textContent =
    coinCount;

  document.getElementById("gameOver").classList.remove("hidden");
}

// CONTROLS
function moveLeft() {
  if (running) lane = Math.max(0, lane - 1);
}

function moveRight() {
  if (running) lane = Math.min(2, lane + 1);
}

function jump() {
  if (running && jumpTime <= 0 && slideTime <= 0) {
    jumpTime = 0.75;
  }
}

function slide() {
  if (running && slideTime <= 0 && jumpTime <= 0) {
    slideTime = 0.65;
  }
}

window.addEventListener("keydown", (e) => {
  if (e.repeat) return;

  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
    moveLeft();
  }

  if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
    moveRight();
  }

  if (e.key === "ArrowUp" || e.key.toLowerCase() === "w" ||
      e.key === " ") {
    jump();
  }

  if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
    slide();
  }
});

// MOBILE BUTTONS
document.getElementById("leftBtn").addEventListener("pointerdown", moveLeft);
document.getElementById("rightBtn").addEventListener("pointerdown", moveRight);
document.getElementById("jumpBtn").addEventListener("pointerdown", jump);
document.getElementById("slideBtn").addEventListener("pointerdown", slide);

// RANDOM OBSTACLE
function spawnObstacle() {
  const types = ["block", "hurdle", "overhead"];
  const type = types[Math.floor(Math.random() * types.length)];

  obstacles.push({
    lane: Math.floor(Math.random() * 3),
    depth: 0,
    type: type
  });
}

// COIN ROW
function spawnCoins() {
  const selectedLane = Math.floor(Math.random() * 3);

  for (let i = 0; i < 5; i++) {
    coins.push({
      lane: selectedLane,
      depth: -i * 0.09,
      collected: false
    });
  }
}

// BACKGROUND
function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#4bb5e8");
  sky.addColorStop(1, "#e0f6ff");

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Sun
  ctx.fillStyle = "#fff5a0";
  ctx.beginPath();
  ctx.arc(760, 85, 42, 0, Math.PI * 2);
  ctx.fill();

  // City buildings
  for (let i = 0; i < 12; i++) {
    const x = i * 85 - 20;
    const height = 70 + (i % 4) * 35;

    ctx.fillStyle = i % 2 ? "#7895a9" : "#647f91";
    ctx.fillRect(x, 220 - height, 65, height);

    ctx.fillStyle = "#d7f2ff";

    for (let y = 235 - height; y < 215; y += 22) {
      for (let wx = x + 10; wx < x + 60; wx += 22) {
        ctx.fillRect(wx, y, 10, 12);
      }
    }
  }
}

// ROAD
function drawRoad() {
  ctx.fillStyle = "#318044";
  ctx.fillRect(0, 220, W, H - 220);

  // Main road
  ctx.fillStyle = "#383838";
  ctx.beginPath();
  ctx.moveTo(410, 170);
  ctx.lineTo(490, 170);
  ctx.lineTo(850, 600);
  ctx.lineTo(50, 600);
  ctx.closePath();
  ctx.fill();

  // Road edges
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(410, 170);
  ctx.lineTo(50, 600);
  ctx.moveTo(490, 170);
  ctx.lineTo(850, 600);
  ctx.stroke();

  // Lane dividers
  ctx.strokeStyle = "#eeeeee";
  ctx.lineWidth = 3;
  ctx.setLineDash([25, 22]);

  for (const x of [436, 464]) {
    ctx.beginPath();
    ctx.moveTo(x, 175);
    ctx.lineTo(W / 2 + (x - W / 2) * 9, 600);
    ctx.stroke();
  }

  ctx.setLineDash([]);
}

// PLAYER
function drawPlayer() {
  const x = laneX(lane, 1);

  const jumpHeight = jumpTime > 0
    ? Math.sin((0.75 - jumpTime) / 0.75 * Math.PI) * 115
    : 0;

  const y = player.y - jumpHeight;

  ctx.save();
  ctx.translate(x, y);

  // Shadow
  ctx.fillStyle = "#0006";
  ctx.beginPath();
  ctx.ellipse(0, 5 + jumpHeight, 38, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Slide pose
  if (slideTime > 0) {
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(-32, -40, 65, 30);

    ctx.fillStyle = "#e8b18a";
    ctx.beginPath();
    ctx.arc(32, -43, 17, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    return;
  }

  // Legs
  ctx.strokeStyle = "#172c50";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(-10, -15);
  ctx.lineTo(-18, 15);
  ctx.moveTo(10, -15);
  ctx.lineTo(18, 15);
  ctx.stroke();

  // Shoes
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-30, 10, 20, 9);
  ctx.fillRect(12, 10, 20, 9);

  // Body
  ctx.fillStyle = "#ffcc00";
  ctx.fillRect(-22, -75, 44, 58);

  // Arms
  ctx.strokeStyle = "#e8b18a";
  ctx.lineWidth = 10;

  ctx.beginPath();
  ctx.moveTo(-20, -65);
  ctx.lineTo(-35, -35);
  ctx.moveTo(20, -65);
  ctx.lineTo(35, -35);
  ctx.stroke();

  // Head
  ctx.fillStyle = "#e8b18a";
  ctx.beginPath();
  ctx.arc(0, -94, 22, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = "#252525";
  ctx.beginPath();
  ctx.arc(0, -105, 20, Math.PI, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = "#222";
  ctx.fillRect(-8, -96, 4, 4);
  ctx.fillRect(5, -96, 4, 4);

  ctx.restore();
}

// OBSTACLES
function drawObstacle(obstacle) {
  const z = obstacle.depth;
  const x = laneX(obstacle.lane, z);
  const y = 170 + z * 420;
  const size = 10 + z * 42;

  if (obstacle.type === "block") {
    ctx.fillStyle = "#b65d24";
    ctx.fillRect(x - size, y - size, size * 2, size * 2);

    ctx.strokeStyle = "#693411";
    ctx.lineWidth = 4;
    ctx.strokeRect(x - size, y - size, size * 2, size * 2);
  }

  if (obstacle.type === "hurdle") {
    ctx.fillStyle = "#e53935";
    ctx.fillRect(x - size * 1.4, y, size * 2.8, size * 0.65);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x - size, y + size * 0.2, size * 0.4, size * 0.2);
  }

  if (obstacle.type === "overhead") {
    ctx.fillStyle = "#444";
    ctx.fillRect(x - size * 1.5, y - size * 1.7, size * 3, size * 0.5);

    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(x - size * 1.5, y - size * 1.7, size * 0.35, size * 0.5);
  }
}

// COINS
function drawCoin(coin) {
  if (coin.collected) return;

  const z = coin.depth;
  const x = laneX(coin.lane, z);
  const y = 170 + z * 420;
  const radius = 4 + z * 15;

  ctx.fillStyle = "#ffd700";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#fff4a0";
  ctx.lineWidth = 3;
  ctx.stroke();
}

// UPDATE GAME
function update(dt) {
  score += dt * 10;
  gameSpeed = Math.min(gameSpeed + dt * 0.006, 0.9);

  player.x += (laneX(lane, 1) - player.x) * 0.2;

  if (jumpTime > 0) jumpTime -= dt;
  if (slideTime > 0) slideTime -= dt;

  // Spawn obstacles
  spawnTimer += dt;

  if (spawnTimer > 1.05) {
    spawnObstacle();
    spawnTimer = 0;
  }

  // Spawn coins
  coinTimer += dt;

  if (coinTimer > 2.1) {
    spawnCoins();
    coinTimer = 0;
  }

  obstacles.forEach(obstacle => {
    obstacle.depth += gameSpeed * dt;
  });

  coins.forEach(coin => {
    coin.depth += gameSpeed * dt;
  });

  // Collision detection
  obstacles.forEach(obstacle => {
    if (obstacle.depth >= 0.88 && obstacle.depth <= 0.98 &&
        obstacle.lane === lane) {

      let hit = false;

      if (obstacle.type === "block") {
        hit = jumpTime <= 0;
      } else if (obstacle.type === "hurdle") {
        hit = jumpTime <= 0;
      } else if (obstacle.type === "overhead") {
        hit = slideTime <= 0;
      }

      if (hit) endGame();
    }
  });

  // Collect coins
  coins.forEach(coin => {
    if (!coin.collected &&
        coin.depth >= 0.88 && coin.depth <= 1.02 &&
        coin.lane === lane) {
      coin.collected = true;
      coinCount++;
      score += 20;
    }
  });

  obstacles = obstacles.filter(o => o.depth < 1.15);
  coins = coins.filter(c => c.depth < 1.15 && !c.collected);

  document.getElementById("score").textContent =
    Math.floor(score);

  document.getElementById("coins").textContent = coinCount;
}

// DRAW
function draw() {
  drawBackground();
  drawRoad();

  // Far objects first
  [...obstacles].sort((a, b) => a.depth - b.depth)
    .forEach(drawObstacle);

  [...coins].sort((a, b) => a.depth - b.depth)
    .forEach(drawCoin);

  drawPlayer();
}

// MAIN LOOP
function gameLoop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  if (running) {
    update(dt);
  }

  draw();
  requestAnimationFrame(gameLoop);
}

// BUTTONS
document.getElementById("startBtn").addEventListener("click", () => {
  startGame();
});

document.getElementById("restartBtn").addEventListener("click", () => {
  startGame();
});

// INITIAL SCREEN
draw();
requestAnimationFrame((time) => {
  lastTime = time;
  gameLoop(time);
});
