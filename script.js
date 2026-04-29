const cameraImages = {
    '1A': 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1000', // Palco
    '1B': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1000', // Área de Jantar
    '2A': 'https://images.unsplash.com/photo-1551135049-8a33b5883817?q=80&w=1000', // Corredor
    '5': 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000'  // Bastidores
};

let isMonitorOpen = false;

// 1. Movimento da Câmera no Escritório (Olhar para os lados)
document.addEventListener('mousemove', (e) => {
    if (!isMonitorOpen) {
        const x = e.clientX / window.innerWidth;
        const move = (x - 0.5) * 150; // Ajusta o quanto a sala desliza
        document.getElementById('office').style.transform = `translateX(${-move}px)`;
    }
});

// 2. Abrir/Fechar Monitor
function toggleMonitor() {
    isMonitorOpen = !isMonitorOpen;
    const mon = document.getElementById('monitor');
    mon.classList.toggle('monitor-hidden');
    
    if (isMonitorOpen) {
        updateCameraDisplay();
    }
}

// 3. Trocar de Câmera (Funcionamento real)
let currentCam = '1A';

function changeRoom(id, name) {
    currentCam = id;
    document.getElementById('cam-id').innerText = id;
    document.getElementById('cam-name').innerText = name;
    
    // Efeito de interferência ao trocar
    const view = document.getElementById('camera-view');
    view.style.opacity = "0.2";
    
    setTimeout(() => {
        updateCameraDisplay();
        view.style.opacity = "1";
    }, 150);
}

function updateCameraDisplay() {
    const view = document.getElementById('camera-view');
    // Aqui trocamos a imagem de fundo baseada na câmera selecionada
    view.style.backgroundImage = `url('${cameraImages[currentCam]}')`;
}

// 4. Lógica das Portas
let doorLeft = false;
function toggleDoor(side) {
    doorLeft = !doorLeft;
    const door = document.getElementById('door-L');
    door.style.height = doorLeft ? "100%" : "0%";
    door.style.background = "#333";
}