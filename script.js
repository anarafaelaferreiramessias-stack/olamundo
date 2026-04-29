const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let score = 0;
let combo = 0;
let health = 100;
let gameRunning = false;
let notes = [];
let lastSpawn = 0;

const lanes = [200, 300, 400, 500];
const keyMap = ['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'];

// Função para spawnar nota
function spawnNote() {
  const lane = Math.floor(Math.random() * 4);
  notes.push({
    x: lanes[lane],
    y: -50,
    lane: lane,
    hit: false
  });
}

// Desenhar tudo
function draw() {
  ctx.fillStyle = '#1a0033';
  ctx.fillRect(0, 0, 800, 600);

  // Linha de acerto
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(100, 450);
  ctx.lineTo(700, 450);
  ctx.stroke();

  // Notas
  for (let note of notes) {
    if (!note.hit) {
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(note.x - 35, note.y, 70, 40);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.strokeRect(note.x - 35, note.y, 70, 40);
    }
  }

  // Receptores
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(lanes[i] - 35, 440, 70, 25);
  }

  // HUD
  ctx.fillStyle = 'white';
  ctx.font = 'bold 28px Arial';
  ctx.fillText(`Score: ${score}`, 30, 50);
  ctx.fillText(`Combo: ${combo}x`, 30, 90);

  ctx.fillStyle = health > 35 ? '#00ff88' : '#ff3333';
  ctx.fillRect(30, 120, health * 5, 25);
}

// Atualizar jogo
function update() {
  for (let i = notes.length - 1; i >= 0; i--) {
    notes[i].y += 7;

    if (notes[i].y > 520 && !notes[i].hit) {
      health -= 18;
      combo = 0;
      notes.splice(i, 1);
    }
  }
}

function gameLoop() {
  if (!gameRunning) return;

  update();
  draw();

  if (Date.now() - lastSpawn > 220) {
    spawnNote();
    if (Math.random() > 0.5) spawnNote();
    lastSpawn = Date.now();
  }

  if (health <= 0) {
    gameRunning = false;
    alert(`GAME OVER!\nPontuação: ${score}\nCombo máximo: ${combo}`);
    document.getElementById('menu').style.display = 'block';
    return;
  }

  requestAnimationFrame(gameLoop);
}

// Controles do teclado
document.addEventListener('keydown', (e) => {
  if (!gameRunning) return;

  const index = keyMap.indexOf(e.key);
  if (index === -1) return;

  for (let i = notes.length - 1; i >= 0; i--) {
    const note = notes[i];
    if (!note.hit && note.lane === index && Math.abs(note.y - 450) < 50) {
      note.hit = true;
      score += 100 + combo * 15;
      combo++;
      health = Math.min(100, health + 4);
      notes.splice(i, 1);
      return;
    }
  }
});

// === INICIAR O JOGO ===
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

// Configurar o botão de forma segura
document.getElementById('playBtn').addEventListener('click', startGame);

// Iniciar
window.onload = () => {
  document.getElementById('menu').style.display = 'block';
  canvas.style.display = 'block';
};