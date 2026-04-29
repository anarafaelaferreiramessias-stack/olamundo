const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const TILE = 48;
const worldWidth = 40;
const worldHeight = 20;

let world = [];
let camera = { x: 0, y: 0 };
let player = {
  x: 5 * TILE,
  y: 5 * TILE,
  speed: 6,
  size: 32,
  selectedBlock: 'grass'
};

function generateWorld() {
  world = [];
  for (let y = 0; y < worldHeight; y++) {
    let row = [];
    for (let x = 0; x < worldWidth; x++) {
      if (y > 8) row.push('dirt');
      else if (y === 8) row.push('grass');
      else row.push('air');
    }
    world.push(row);
  }
}

function getBlockColor(type) {
  if (type === 'grass') return '#4CAF50';
  if (type === 'dirt') return '#8B5A2B';
  if (type === 'stone') return '#777';
  return null;
}

function drawWorld() {
  for (let y = 0; y < worldHeight; y++) {
    for (let x = 0; x < worldWidth; x++) {
      const block = world[y][x];
      if (block !== 'air') {
        ctx.fillStyle = getBlockColor(block);
        ctx.fillRect(
          x * TILE - camera.x,
          y * TILE - camera.y,
          TILE,
          TILE
        );
        ctx.strokeRect(
          x * TILE - camera.x,
          y * TILE - camera.y,
          TILE,
          TILE
        );
      }
    }
  }
}

function drawPlayerHand() {
  ctx.fillStyle = '#c68642';
  ctx.fillRect(canvas.width - 180, canvas.height - 140, 100, 100);
}

function drawCrosshair() {
  ctx.fillStyle = 'white';
  ctx.fillRect(canvas.width / 2 - 2, canvas.height / 2 - 10, 4, 20);
  ctx.fillRect(canvas.width / 2 - 10, canvas.height / 2 - 2, 20, 4);
}

function drawHotbar() {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(canvas.width / 2 - 120, canvas.height - 70, 240, 50);
}

function updateCamera() {
  camera.x = player.x - canvas.width / 2;
  camera.y = player.y - canvas.height / 2;
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  updateCamera();
  drawWorld();
  drawCrosshair();
  drawHotbar();
  drawPlayerHand();

  requestAnimationFrame(gameLoop);
}

function startGame() {
  document.getElementById('menu').style.display = 'none';
  canvas.style.display = 'block';
  generateWorld();
  gameLoop();
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'w') player.y -= player.speed;
  if (e.key === 's') player.y += player.speed;
  if (e.key === 'a') player.x -= player.speed;
  if (e.key === 'd') player.x += player.speed;
});

canvas.addEventListener('click', () => {
  let gridX = Math.floor((player.x + TILE) / TILE);
  let gridY = Math.floor(player.y / TILE);

  if (world[gridY] && world[gridY][gridX]) {
    world[gridY][gridX] = world[gridY][gridX] === 'air' ? 'grass' : 'air';
  }
});