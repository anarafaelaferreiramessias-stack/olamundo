// === VARIÁVEIS DO JOGO ===
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let score = 0;
let combo = 0;
let health = 100;
let gameRunning = false;
let notes = [];
let lastSpawn = 0;

const lanes = [200, 300, 400, 500];
const keys = ["ArrowLeft", "ArrowDown", "ArrowUp", "ArrowRight"];

// Criar uma nota
function spawnNote() {
  const lane = Math.floor(Math.random() * 4);
  notes.push({ x: lanes[lane], y: -50, lane: lane, hit: false });
}

// Desenhar na tela
function draw() {
  ctx.fillStyle = "#1a0033";
  ctx.fillRect(0, 0, 800, 600);

  // Linha de acerto
  ctx.strokeStyle = "#00ffff";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(100, 450);
  ctx.lineTo(700, 450);
  ctx.stroke();

  // Desenhar notas
  for (let i = 0; i < notes.length; i++) {
    let n = notes[i];
    if (!n.hit) {
      ctx.fillStyle = "#ff00ff";
      ctx.fillRect(n.x - 35, n.y, 70, 45);
    }
  }

  // Receptores (setas fixas)
  ctx.fillStyle = "#00ffff";
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(lanes[i] - 35, 440, 70, 30);
  }

  // Texto
  ctx.fillStyle = "white";
  ctx.font = "28px Arial";
  ctx.fillText("Score: " + score, 40, 60);
  ctx.fillText("Combo: " + combo + "x", 40, 100);

  // Vida
  ctx.fillStyle = health > 40 ? "#00ff88" : "#ff0000";
  ctx.fillRect(40, 130, health * 5, 30);
}

// Atualizar posição das notas
function update() {
  for (let i = notes.length - 1; i >= 0; i--) {
    notes[i].y += 8;

    if (notes[i].y > 530 && !notes[i].hit) {
      health -= 20;
      combo = 0;
      notes.splice(i, 1);
    }
  }
}

// Loop do jogo
function gameLoop() {
  if (!gameRunning) return;

  update();
  draw();

  if (Date.now() - lastSpawn > 200) {
    spawnNote();
    lastSpawn = Date.now();
  }

  if (health <= 0) {
    gameRunning = false;
    alert("GAME OVER!\nSua pontuação: " + score);
    document.getElementById("menu").style.display = "block";
    return;
  }

  requestAnimationFrame(gameLoop);
}

// Controles do teclado
document.addEventListener("keydown", function(e) {
  if (!gameRunning) return;

  let index = keys.indexOf(e.key);
  if (index === -1) return;

  for (let i = notes.length - 1; i >= 0; i--) {
    let note = notes[i];
    if (!note.hit && note.lane === index && Math.abs(note.y - 450) < 55) {
      note.hit = true;
      score += 100 + combo * 10;
      combo++;
      health = Math.min(100, health + 5);
      notes.splice(i, 1);
      break;
    }
  }
});

// Função para iniciar o jogo
function startGame() {
  document.getElementById("menu").style.display = "none";

  score = 0;
  combo = 0;
  health = 100;
  notes = [];
  gameRunning = true;
  lastSpawn = Date.now();

  gameLoop();
}

// Conectar o botão ao iniciar o jogo
document.getElementById("playButton").addEventListener("click", startGame);

// Início
window.onload = function() {
  document.getElementById("menu").style.display = "block";
};