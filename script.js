let power = 100;
let camOpen = false;
let currentCam = '1A';
let animatronicPos = '1A'; // Onde o inimigo está
let hour = 0;

// Atualização de Energia
const powerInterval = setInterval(() => {
    if (camOpen) {
        power -= 2; // Gasta mais energia com câmera aberta
    } else {
        power -= 0.5;
    }
    
    document.getElementById('power').innerText = `Energia: ${Math.floor(power)}%`;

    if (power <= 0) {
        gameOver("A energia acabou!");
    }
}, 3000);

// Ciclo da Noite (Tempo)
setInterval(() => {
    hour++;
    if (hour > 6) alert("Você sobreviveu!");
    document.getElementById('time').innerText = `${hour} AM`;
}, 60000); // 1 minuto real = 1 hora no jogo

// IA do Animatrônico
setInterval(() => {
    const locations = ['1A', '1B', '2A', 'OFFICE'];
    let index = locations.indexOf(animatronicPos);
    
    // Chance de mover para a próxima sala
    if (Math.random() > 0.5 && index < locations.length - 1) {
        animatronicPos = locations[index + 1];
        console.log("Inimigo moveu para: " + animatronicPos);
    }

    // Se ele chegar no escritório e você não estiver olhando as câmeras (ou vice-versa)
    if (animatronicPos === 'OFFICE') {
        gameOver();
    }
}, 8000);

function toggleCams() {
    camOpen = !camOpen;
    document.getElementById('camera-system').classList.toggle('hidden');
    updateCamDisplay();
}

function changeCam(cam) {
    currentCam = cam;
    updateCamDisplay();
}

function updateCamDisplay() {
    const display = document.getElementById('cam-display');
    if (animatronicPos === currentCam) {
        display.innerText = `VISUALIZANDO: ${currentCam} - [ALGO ESTÁ AQUI]`;
        display.style.color = "red";
    } else {
        display.innerText = `VISUALIZANDO: ${currentCam} - Tudo limpo`;
        display.style.color = "white";
    }
}

function gameOver() {
    clearInterval(powerInterval);
    document.getElementById('jumpscare').classList.remove('hidden');
}