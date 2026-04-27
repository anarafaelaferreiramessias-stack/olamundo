const steve = document.getElementById('steve');
const mundo = document.getElementById('mundo');
const menu = document.getElementById('menu');

let posX = 50;
let posY = 100; // Altura do chão
let vY = 0; // Velocidade vertical (pulo/gravidade)
let noChao = true;
let teclas = {};

function iniciar() {
    menu.style.display = 'none';
    mundo.style.display = 'block';
    loop();
}

// Monitora teclas pressionadas
document.addEventListener('keydown', (e) => teclas[e.key.toLowerCase()] = true);
document.addEventListener('keyup', (e) => teclas[e.key.toLowerCase()] = false);

function loop() {
    // 1. CORRER (Shift)
    let velAtual = teclas['shift'] ? 10 : 5;

    // 2. ANDAR (A e D)
    if (teclas['a']) posX -= velAtual;
    if (teclas['d']) posX += velAtual;

    // 3. PULAR (Espaço ou W)
    if ((teclas[' '] || teclas['w']) && noChao) {
        vY = 15; // Força do pulo
        noChao = false;
    }

    // 4. GRAVIDADE
    if (!noChao) {
        vY -= 0.8; // Força da gravidade puxando pra baixo
        posY += vY;
    }

    // 5. COLISÃO COM O CHÃO
    if (posY <= 100) {
        posY = 100;
        vY = 0;
        noChao = true;
    }

    // Atualiza visual
    steve.style.left = posX + 'px';
    steve.style.bottom = posY + 'px';

    requestAnimationFrame(loop);
}

// 6. QUEBRAR ÁRVORE
function quebrar(elemento) {
    // Simula o tempo de quebra
    elemento.style.opacity = "0.5";
    setTimeout(() => {
        elemento.style.display = "none";
        alert("Você coletou madeira!");
    }, 500);
}