// Referências dos elementos
const telaMenu = document.getElementById('tela-inicial');
const telaJogo = document.getElementById('jogo');
const steve = document.getElementById('steve');

// Posição do personagem
let x = window.innerWidth / 2;
let y = window.innerHeight / 2;
const velocidade = 10;

// Função para mudar da tela inicial para o jogo
function jogar() {
    telaMenu.style.display = 'none';
    telaJogo.style.display = 'block';
    console.log("Jogo iniciado!");
}

// Controle de teclas
document.addEventListener('keydown', (e) => {
    // Só move se o jogo estiver visível
    if (telaJogo.style.display === 'block') {
        const tecla = e.key.toLowerCase();

        if (tecla === 'w') y -= velocidade;
        if (tecla === 's') y += velocidade;
        if (tecla === 'a') x -= velocidade;
        if (tecla === 'd') x += velocidade;

        // Aplica o movimento na tela
        steve.style.top = y + 'px';
        steve.style.left = x + 'px';
    }
});