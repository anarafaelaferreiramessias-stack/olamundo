const container = document.getElementById('game-container');
const scoreElement = document.getElementById('score');
const keys = ['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'];
const symbols = ['⬅️', '⬇️', '⬆️', '➡️'];

let score = 0;

// 1. Função para criar uma nota subindo
function createNote() {
    const lane = Math.floor(Math.random() * 4);
    const note = document.createElement('div');
    
    note.classList.add('note');
    note.innerText = symbols[lane];
    note.style.left = (lane * 100 + 25) + "px";
    note.dataset.lane = lane;
    
    container.appendChild(note);

    let pos = 0;
    const speed = 4; // Velocidade da nota

    const moveInterval = setInterval(() => {
        pos += speed;
        note.style.bottom = pos + "px";

        // Se a nota passar do topo sem ser clicada
        if (pos > 600) {
            clearInterval(moveInterval);
            note.remove();
        }
    }, 16);
}

// 2. Sistema de Input (Teclado)
window.addEventListener('keydown', (e) => {
    const lane = keys.indexOf(e.key);
    if (lane === -1) return;

    // Feedback visual no receptor
    const receptor = document.getElementById(`key-${lane}`);
    receptor.classList.add('active');
    setTimeout(() => receptor.classList.remove('active'), 100);

    // Verificar colisão com as notas
    const notes = document.querySelectorAll('.note');
    notes.forEach(note => {
        const notePos = parseInt(note.style.bottom);
        const noteLane = parseInt(note.dataset.lane);

        // Se a nota estiver na "zona de acerto" (topo da tela)
        if (noteLane === lane && notePos > 500 && notePos < 560) {
            score += 100;
            scoreElement.innerText = `Pontos: ${score}`;
            note.remove(); // Remove a nota ao acertar
            
            // Pequena animação no jogador
            document.getElementById('player').style.transform = "scale(1.2)";
            setTimeout(() => document.getElementById('player').style.transform = "scale(1)", 100);
        }
    });
});

// 3. Loop do Jogo: Gera uma nota a cada 1 segundo
setInterval(createNote, 1000);