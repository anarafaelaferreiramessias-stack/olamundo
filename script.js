let monitorOpen = false;
let doors = { L: false, R: false };

// Configurações das Câmeras (Cores diferentes para você ver a troca)
const rooms = {
    '1A': { name: 'PALCO', color: '#1a1a2e' },
    '1B': { name: 'REFEITÓRIO', color: '#16213e' },
    '2A': { name: 'CORREDOR OESTE', color: '#0f3460' },
    '2B': { name: 'CORREDOR LESTE', color: '#1b1b1b' }
};

// 1. Movimento do Escritório
document.addEventListener('mousemove', (e) => {
    if (!monitorOpen) {
        let x = (e.clientX / window.innerWidth) - 0.5;
        document.getElementById('office').style.transform = `translateX(${x * -200}px)`;
    }
});

// 2. Abrir/Fechar Monitor
function toggleMonitor() {
    monitorOpen = !monitorOpen;
    document.getElementById('monitor').classList.toggle('hidden');
    if(monitorOpen) setCam('1A', 'PALCO');
}

// 3. Trocar Câmera
function setCam(id, name) {
    const render = document.getElementById('cam-render');
    document.getElementById('cam-title').innerText = "CAM " + id + " - " + name;
    
    // Simula a troca de sinal mudando a cor de fundo (Enquanto não tem imagens)
    render.style.backgroundColor = rooms[id].color;
    
    // Efeito de estática rápida
    render.style.opacity = "0.5";
    setTimeout(() => { render.style.opacity = "1"; }, 100);
}

// 4. Fechar Portas
function toggleDoor(side) {
    doors[side] = !doors[side];
    const doorEl = document.getElementById(`door-${side}`);
    doorEl.style.height = doors[side] ? "100%" : "0";
}