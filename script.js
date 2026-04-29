const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let blocks = [];
let player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  speed: 5,
  width: 20,
  height: 40
};

function generateWorld() {
  for (let x = 0; x < canvas.width; x += 50) {
    for (let y = canvas.height / 2; y < canvas.height; y += 50) {
      blocks.push({
        x,
        y,
        size: 50,
        type: Math.random() > 0.5 ? 'grass' : 'dirt'
      });
    }
  }
}

function drawBlock(block) {
  if (block.type === 'grass') {
    ctx.fillStyle = '#2ecc71';
  } else {
    ctx.fillStyle = '#8e5a2b';
  }

  ctx.fillRect(block.x, block.y, block.size, block.size);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(block.x, block.y, block.size, block.size);
}

function drawPlayer() {
  ctx.fillStyle = 'red';
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function updateGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  blocks.forEach(drawBlock);
  drawPlayer();

  requestAnimationFrame(updateGame);
}

function startGame() {
  document.getElementById('menu').style.display = 'none';
  canvas.style.display = 'block';
  document.getElementById('hand').style.display = 'block';

  generateWorld();
  updateGame();
}

window.addEventListener('keydown', (e) => {
  switch (e.key.toLowerCase()) {
    case 'w':
      player.y -= player.speed;
      break;
    case 's':
      player.y += player.speed;
      break;
    case 'a':
      player.x -= player.speed;
      break;
    case 'd':
      player.x += player.speed;
      break;
  }
});

canvas.addEventListener('click', (e) => {
  blocks.push({
    x: e.clientX - 25,
    y: e.clientY - 25,
    size: 50,
    type: 'grass'
  });
});