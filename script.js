const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Configuração do mundo
const TILE = 32;
const WORLD_WIDTH = 80;
const WORLD_HEIGHT = 40;
const GRAVITY = 0.5;
const JUMP_FORCE = -10;

let gameStarted = false;
let cameraX = 0;
let cameraY = 0;

// Texturas (cores simulando Minecraft)
const textures = {
  grass: '#4CAF50',
  dirt: '#8B5A2B',
  stone: '#7f7f7f',
  wood: '#9C6B30',
  leaves: '#2E8B57'
};

// Mundo procedural
const world = [];
for (let y = 0; y < WORLD_HEIGHT; y++) {
  world[y] = [];
  for (let x = 0; x < WORLD_WIDTH; x++) {
    if (y > 20) world[y][x] = 'stone';
    else if (y > 15) world[y][x] = 'dirt';
    else if (y === 15) world[y][x] = 'grass';
    else world[y][x] = null;
  }
}

// Árvores automáticas
for (let i = 5; i < WORLD_WIDTH; i += 12) {
  for (let h = 0; h < 4; h++) {
    world[14 - h][i] = 'wood';
  }
  world[10][i] = 'leaves';
  world[10][i-1] = 'leaves';
  world[10][i+1] = 'leaves';
}

// Jogador estilo Steve
const player = {
  x: 200,
  y: 100,
  width: 28,
  height: 48,
  velX: 0,
  velY: 0,
  speed: 4,
  jumping: false
};

const keys = {};

document.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Colocar/quebrar bloco
canvas.addEventListener('click', (e) => {
  const x = Math.floor((e.clientX + cameraX) / TILE);
  const y = Math.floor((e.clientY + cameraY) / TILE);

  if (world[y] && world[y][x]) {
    world[y][x] = null;
  } else if (world[y]) {
    world[y][x] = 'wood';
  }
});

function drawBlock(type, x, y) {
  if (!type) return;
  ctx.fillStyle = textures[type];
  ctx.fillRect(x - cameraX, y - cameraY, TILE, TILE);
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.strokeRect(x - cameraX, y - cameraY, TILE, TILE);
}

function drawWorld() {
  for (let y = 0; y < WORLD_HEIGHT; y++) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
      drawBlock(world[y][x], x * TILE, y * TILE);
    }
  }
}

function drawPlayer() {
  // Corpo
  ctx.fillStyle = '#2196F3';
  ctx.fillRect(player.x - cameraX, player.y - cameraY, player.width, player.height);

  // Cabeça
  ctx.fillStyle = '#f1c27d';
  ctx.fillRect(player.x - cameraX + 4, player.y - cameraY - 20, 20, 20);

  // Braço
  ctx.fillRect(player.x - cameraX + 24, player.y - cameraY + 12, 8, 16);

  // Perna
  ctx.fillStyle = '#3f51b5';
  ctx.fillRect(player.x - cameraX + 5, player.y - cameraY + 35, 8, 15);
  ctx.fillRect(player.x - cameraX + 15, player.y - cameraY + 35, 8, 15);
}

function updatePlayer() {
  player.velX = 0;

  if (keys['a']) player.velX = -player.speed;
  if (keys['d']) player.velX = player.speed;

  if (keys[' '] && !player.jumping) {
    player.velY = JUMP_FORCE;
    player.jumping = true;
  }

  player.velY += GRAVITY;

  player.x += player.velX;
  player.y += player.velY;

  // chão
  if (player.y > 400) {
    player.y = 400;
    player.velY = 0;
    player.jumping = false;
  }

  // câmera segue jogador
  cameraX = player.x - canvas.width / 2;
  cameraY = player.y - canvas.height / 2;
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0,0,0,canvas.height);
  gradient.addColorStop(0,'#87CEEB');
  gradient.addColorStop(1,'#dff6ff');
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,canvas.width,canvas.height);
}

function gameLoop() {
  if (!gameStarted) return;

  drawSky();
  drawWorld();
  updatePlayer();
  drawPlayer();

  requestAnimationFrame(gameLoop);
}

function startGame() {
  gameStarted = true;
  document.getElementById('menu').style.display = 'none';
  gameLoop();
}

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});