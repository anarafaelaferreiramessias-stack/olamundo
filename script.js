const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let score = 0;
let combo = 0;
let health = 100;
let gameRunning = false;
let notes = [];
let lastSpawn = 0;

const lanes = [180, 280, 380, 480]; // posições X
const keyMap = ['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'];

function spawnNote() {
  const lane = Math.floor(Math.random() * 4);
  notes.push({
    x: lanes[lane],
    y: -40,
    lane: lane,
    hit: false
  });
}

function draw() {
  ctx.fillStyle = '#0a001f';
  ctx.fillRect(0, 0, 800, 600);

  // Linha de acerto
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(100, 480);
  ctx.lineTo(700, 480);
  ctx.stroke();

  // Desenhar notas
  ctx.fillStyle = '#ff00ff';
  for (let note of notes) {
    if (!note.hit) {
      ctx.fillRect(note.x - 30, note.y, 60, 35);
    }
  }

  // Desenhar receptores
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(lanes[i] - 30, 470, 60, 20);
  }

  // HUD
  ctx.fillStyle = 'white';
  ctx.font = 'bold 28px Arial';
  ctx.fillText(`Score: ${score}`, 40, 60);
  ctx.fillText(`Combo: ${combo}x`, 40, 100);

  // Vida
  ctx.fillStyle = health > 40 ? '#00ff88' : '#ff4444';
  ctx.fillRect(40, 140, health * 4, 25);
}

function update() {
  for (let i = notes.length - 1; i >= 0; i--) {
    notes[i].y += 6;   // velocidade das notas

    if (notes[i].y > 550 && !notes[i].hit) {
      health -= 15;
      combo = 0;
      notes.splice(i, 1);
    }
  }
}

function gameLoop() {
  if (!gameRunning) return;

  update();
  draw();

  // Spawn de notas
  if (Date.now() - lastSpawn > 280) {
    if (Math.random() > 0.25) spawnNote();
    lastSpawn = Date.now();
  }

  if (health <= 0) {
    gameRunning = false;
    alert(`Game Over!\n\nPontuação final: ${score}\nMaior Combo: ${combo}`);
    document.getElementById('menu').style.display = 'block';
    return;
  }

  requestAnimationFrame(gameLoop);
}

// Controles
document.addEventListener('keydown', (e) => {
  if (!gameRunning) return;

  const index = keyMap.indexOf(e.key);
  if (index === -1) return;

  // Efeito visual (opcional)
  for (let i = notes.length - 1; i >= 0; i--) {
    const note = notes[i];
    if (!note.hit && note.lane === index && Math.abs(note.y - 480) < 45) {
      note.hit = true;
      score += 100 + Math.floor(combo * 8);
      combo++;
      health = Math.min(100, health + 3);
      notes.splice(i, 1);
      return;
    }
  }
});

function startGame() {
  document.getElementById('menu').style.display = 'none';
  
  score = 0;
  combo = 0;
  health = 100;
  notes = [];
  gameRunning = true;
  lastSpawn = Date.now();

  gameLoop();
}

// Inicia escondendo o canvas até clicar em Jogar
window.onload = () => {
  canvas.style.display = 'block';
};