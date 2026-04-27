/* LOGICA DO JOGO - VERSÃO PRO 
   Funcionalidades: Movimento suave, Pulo, Corrida e Coleta de Madeira
*/

const steve = document.getElementById('steve');
const mundo = document.getElementById('mundo');
const menu = document.getElementById('menu');

// Configurações de Física
let posX = 100;
let posY = 100;
let velX = 0;
let velY = 0;
const gravidade = 0.8;
const forcaPulo = 15;
const atrito = 0.85; // Faz o personagem parar suavemente
let noChao = false;

// Estado das Teclas
let teclas = {};

// Iniciar o Jogo
function iniciar() {
    menu.style.display = 'none';
    mundo.style.display = 'block';
    console.log("Mundo carregado...");
    loop();
}

// Ouvintes de Teclado
document.addEventListener('keydown', (e) => teclas[e.key.toLowerCase()] = true);
document.addEventListener('keyup', (e) => teclas[e.key.toLowerCase()] = false);

function loop() {
    // 1. Determinar Velocidade (Andar vs Correr)
    let aceleracao = teclas['shift'] ? 2.5 : 1.2;

    // 2. Movimentação Horizontal (A e D)
    if (teclas['a'] || teclas['arrowleft']) {
        velX -= aceleracao;
        steve.style.transform = "scaleX(-1)"; // Vira o personagem para a esquerda
    }
    if (teclas['d'] || teclas['arrowright']) {
        velX += aceleracao;
        steve.style.transform = "scaleX(1)"; // Vira o personagem para a direita
    }

    // Aplica Atrito
    velX *= atrito;
    posX += velX;

    // 3. Pulo (Espaço ou W)
    if ((teclas[' '] || teclas['w'] || teclas['arrowup']) && noChao) {
        velY = forcaPulo;
        noChao = false;
    }

    // 4. Aplicar Gravidade
    velY -= gravidade;
    posY += velY;

    // 5. Colisão com o Chão (Limite de 100px)
    if (posY <= 100) {
        posY = 100;
        velY = 0;
        noChao = true;
    }

    // 6. Limites da Tela (Não sair pelas laterais)
    if (posX < 0) posX = 0;
    if (posX > window.innerWidth - 40) posX = window.innerWidth - 40;

    // 7. Atualizar Elemento na Tela
    steve.style.left = posX + 'px';
    steve.style.bottom = posY + 'px';

    // Roda o próximo frame
    requestAnimationFrame(loop);
}

// 8. Sistema de Quebrar Árvore
function quebrar(elemento) {
    // Balança a árvore antes de sumir
    elemento.style.transition = "transform 0.1s";
    elemento.style.transform = "rotate(5deg)";
    
    setTimeout(() => {
        elemento.style.transform = "rotate(-5deg)";
        setTimeout(() => {
            elemento.style.display = "none";
            // Cria um aviso flutuante
            const aviso = document.createElement("div");
            aviso.innerHTML = "+1 Madeira 🪵";
            aviso.style.position = "absolute";
            aviso.style.left = posX + "px";
            aviso.style.bottom = (posY + 80) + "px";
            aviso.style.color = "white";
            aviso.style.fontWeight = "bold";
            mundo.appendChild(aviso);
            
            // Remove o aviso depois de 1 segundo
            setTimeout(() => aviso.remove(), 1000);
        }, 100);
    }, 100);
}