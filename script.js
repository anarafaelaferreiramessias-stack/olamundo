const playerLanes = document.getElementById('player-lanes');
const receptors = document.querySelectorAll('.receptor');
const healthBar = document.getElementById('health-bar');
const scoreText = document.getElementById('score');

let score = 0;
let health = 50;
const keys = ['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'];

// 1. Criar Nota
function spawnNote() {
    const lane = Math.floor(Math.random() * 4);
    const note = document.createElement('div');
    const colors = ['left', 'down', 'up', 'right'];
    
    note.className = `note ${colors[lane]}`;
    note.style.left = receptors[lane].offsetLeft + "px";
    note.style.top = "100vh"; // Começa embaixo
    
    playerLanes.appendChild(note);

    let pos = window.innerHeight;
    function move() {
        pos -= 8; // Velocidade da nota
        note.style.top = pos + "px";

        if (pos < -100) {
            note.remove();
            updateHealth(-8); // Errou, perde vida
        } else {
            requestAnimationFrame(move);
        }
    }
    requestAnimationFrame(move);
}

// 2. Sistema de Input e Colisão
window.addEventListener('keydown', (e) => {
    const laneIndex = keys.indexOf(e.key);
    if (laneIndex === -1) return;

    // Brilho da seta receptora
    receptors[laneIndex].classList.add('active');
    
    // Animação do personagem (pulo)
    document.getElementById('player').style.transform = "translateY(-20px) scale(1.1)";

    // Checar se acertou a nota
    const notes = document.querySelectorAll(`.note`);
    notes.forEach(note => {
        const noteTop = note.offsetTop;
        const targetTop = receptors[laneIndex].offsetTop + 50; // Onde deve acertar

        if (note.classList.contains(getClassNameByLane(laneIndex))) {
            // Se estiver perto do receptor
            if (Math.abs(noteTop - targetTop) < 60) {
                note.remove();
                score += 150;
                updateHealth(5);
                scoreText.innerText = `Score: ${score} | Status: SICK!`;
            }
        }
    });
});

window.addEventListener('keyup', (e) => {
    const laneIndex = keys.indexOf(e.key);
    if (laneIndex !== -1) {
        receptors[laneIndex].classList.remove('active');
        document.getElementById('player').style.transform = "translateY(0) scale(1)";
    }
});

function getClassNameByLane(index) {
    return ['left', 'down', 'up', 'right'][index];
}

function updateHealth(val) {
    health = Math.min(Math.max(health + val, 0), 100);
    healthBar.style.width = health + "%";
    if(health <= 0) alert("GAME OVER! F na música.");
}

// Iniciar música e notas
setInterval(spawnNote, 600);