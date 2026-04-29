const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let score = 0;
let combo = 0;
let health = 100;
let gameRunning = false;
let notes = [];
let lastSpawn = 0;

const lanes = [200, 300, 400, 500];           // Posições X das setas
const keyMap = ['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'];

function spawnNote() {
  const lane = Math.floor(Math.random() * 4);
  notes.push({
    x: lanes[lane],
    y: -50,
    lane: lane,
    hit: false
  });
}

function draw() {
  // Fundo escuro
  ctx.fillStyle = '#1a0033';
  ctx.fillRect(0, 0, 800, 600);

  // Linha de julgamento (igual FNF)
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(100, 450);
  ctx.lineTo(700, 450);
  ctx.stroke();

  // Desenhar as notas caindo
  for (let note of notes) {
    if (!note.hit) {
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(note.x - 35, note.y, 70, 40);
      
      // Borda branca para ficar mais bonito
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.strokeRect(note.x - 35, note.y, 70, 40);
    }
  }

  // Desenhar as setas receptoras (embaixo)
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(lanes[i] - 35, 440, 70, 25);
  }

  // HUD
  ctx.fillStyle = 'white';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 30, 50);
  ctx.fillText(`Combo: ${combo}x`, 30, 90);

  // Barra de vida
  ctx.fillStyle = health > 35 ? '#00ff88' : '#ff3333';
  ctx.fillRect(30, 120, health * 5, 25);
}

function update() {
  for (let i = notes.length - 1; i >= 0; i--) {
    notes[i].y += 7;   // Velocidade das notas (ajuste se quiser)

    // Se passou da linha sem acertar = Miss
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

  // Spawn automático de notas
  if (Date.now() - lastSpawn > 220) {
    spawnNote();
    if (Math.random() > 0.4) spawnNote(); // às vezes spawna 2
    lastSpawn = Date.now();
  }

  // Game Over
  if (health <= 0) {
    gameRunning = false;
    alert(`GAME OVER!\n\nPontuação: ${score}\nCombo máximo: ${combo}`);
    document.getElementById('menu').style.display = 'block';
    return;
  }

  requestAnimationFrame(gameLoop);
}

// === CONTROLES ===
document.addEventListener('keydown', (e) => {
  if (!gameRunning) return;

  const index = keyMap.indexOf(e.key);
  if (index === -1) return;

  // Verifica se acertou alguma nota
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

// Iniciar o jogo ao clicar em "JOGAR"
function startGame() {
  document.getElementById('menu').style.display = 'none';   // Esconde o menu

  // Reset das variáveis
  score = 0;
  combo = 0;
  health = 100;
  notes = [];
  gameRunning = true;
  lastSpawn = Date.now();

  gameLoop();
}

// Esconde o menu no início
window.onload = () => {
  document.getElementById('menu').style.display = 'block';
};