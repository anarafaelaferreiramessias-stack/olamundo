const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game');

let player = {
  x: 400,
  y: 300,
  width: 30,
  height: 50,
  speed: 5,
  jump: -15,
  velocityY: 0,
  onGround: false
};

let cameraX = 0;
let gravity = 0.8;
let keys = {};

const TILE_SIZE = 40;
let world = [];
const WORLD_WIDTH = 50;
const WORLD_HEIGHT = 30;

const colors = {
  0: '#87CEEB', // ar / céu
  1: '#228B22', // grama
  2: '#8B4513', // terra
  3: '#555555'  // pedra
};

let inventory = [1, 2, 3];
let selectedSlot = 0;

// Gerar mundo
function generateWorld() {
  for (let y = 0; y < WORLD_HEIGHT; y++) {
    world[y] = [];
    for (let x = 0; x < WORLD_WIDTH; x++) {
      if (y > 18) world[y][x] = 3;
      else if (y > 15) world[y][x] = 2;
      else if (y === 15) world[y][x] = 1;
      else world[y][x] = 0;
    }
  }
}

function drawWorld() {
  for (let y = 0; y < WORLD_HEIGHT; y++) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const block = world[y][x];
      if (block !== 0) {
        ctx.fillStyle = colors[block];
        ctx.fillRect(x * TILE_SIZE - cameraX, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}

function drawPlayer() {
  ctx.fillStyle = '#FF4500';
  ctx.fillRect(player.x - cameraX, player.y, player.width, player.height);
  
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(player.x - cameraX + 8, player.y + 12, 14, 14);
}

function update() {
  if (keys['a'] || keys['A']) player.x -= player.speed;
  if (keys['d'] || keys['D']) player.x += player.speed;

  player.velocityY += gravity;
  player.y += player.velocityY;

  if (player.y + player.height > 15 * TILE_SIZE) {
    player.y = 15 * TILE_SIZE - player.height;
    player.velocityY = 0;
    player.onGround = true;
  }

  cameraX = player.x - canvas.width / 2;
  if (cameraX < 0) cameraX = 0;
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawWorld();
  drawPlayer();
  update();

  requestAnimationFrame(gameLoop);
}

// Controles
window.addEventListener('keydown', e => {
  keys[e.key] = true;

  if (e.key === ' ' && player.onGround) {
    player.velocityY = player.jump;
    player.onGround = false;
  }

  if (e.key >= '1' && e.key <= '3') {
    selectedSlot = parseInt(e.key) - 1;
    document.getElementById('selected-block').textContent = 
      ['Grama', 'Terra', 'Pedra'][selectedSlot];
  }
});

window.addEventListener('keyup', e => keys[e.key] = false);

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left + cameraX;
  const mouseY = e.clientY - rect.top;

  const blockX = Math.floor(mouseX / TILE_SIZE);
  const blockY = Math.floor(mouseY / TILE_SIZE);

  if (blockX < 0 || blockX >= WORLD_WIDTH || blockY < 0 || blockY >= WORLD_HEIGHT) return;

  if (e.button === 0) { // esquerdo = quebrar
    world[blockY][blockX] = 0;
  }
});

canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left + cameraX;
  const mouseY = e.clientY - rect.top;

  const blockX = Math.floor(mouseX / TILE_SIZE);
  const blockY = Math.floor(mouseY / TILE_SIZE);

  if (blockX >= 0 && blockX < WORLD_WIDTH && blockY >= 0 && blockY < WORLD_HEIGHT) {
    if (world[blockY][blockX] === 0) {
      world[blockY][blockX] = inventory[selectedSlot];
    }
  }
});

function startGame() {
  startScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  generateWorld();
  gameLoop();
}