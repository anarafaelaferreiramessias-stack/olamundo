let state = {
    power: 100,
    usage: 1,
    isMonitorOpen: false,
    currentCam: '1A',
    animatronicPos: '1A',
    leftDoorClosed: false,
};

// Movimentação do Mouse (Efeito de olhar para os lados)
document.addEventListener('mousemove', (e) => {
    if (!state.isMonitorOpen) {
        const move = (e.clientX - window.innerWidth / 2) / 20;
        document.getElementById('office').style.transform = `translateX(${-move}px)`;
    }
});

function toggleMonitor() {
    state.isMonitorOpen = !state.isMonitorOpen;
    const mon = document.getElementById('monitor');
    mon.classList.toggle('hidden');
    state.usage = state.isMonitorOpen ? 2 : 1;
}

function switchCam(camID) {
    state.currentCam = camID;
    document.getElementById('cam-label').innerText = `CAM ${camID}`;
    
    // Simular "glitch" na troca de câmera
    const overlay = document.querySelector('.static-overlay');
    overlay.style.opacity = "0.3";
    setTimeout(() => overlay.style.opacity = "0.05", 150);
}

// Consumo de Energia Realista
setInterval(() => {
    let consumption = state.usage;
    if (state.leftDoorClosed) consumption++;
    
    state.power -= (consumption * 0.1);
    document.getElementById('power-val').innerText = Math.max(0, Math.floor(state.power));
    
    if (state.power <= 0) {
        document.body.innerHTML = "<h1 style='color:red; text-align:center; margin-top:20%'>TOO DARK...</h1>";
    }
}, 1000);

function toggleDoor(side) {
    state.leftDoorClosed = !state.leftDoorClosed;
    const btn = document.querySelector('.btn-door');
    btn.style.background = state.leftDoorClosed ? "red" : "#444";
}