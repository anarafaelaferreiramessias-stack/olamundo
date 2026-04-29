let monitorOpen = false;
let doors = { L: false, R: false };
let currentCam = '1A';
let animatronicLocation = '1A';

// Movimentação do Escritório (Olhar ao redor)
document.addEventListener('mousemove', (e) => {
    if (!monitorOpen) {
        let x = (e.clientX / window.innerWidth) - 0.5;
        document.getElementById('office').style.transform = `translateX(${x * -200}px)`;
    }
});

// Portas e Luzes
function toggleDoor(side) {
    doors[side] = !doors[side];
    document.getElementById(`door-${side}`).style.height = doors[side] ? "100%" : "0%";
}

function light(side, isOn) {
    document.getElementById(`light-effect-${side}`).style.opacity = isOn ? "1" : "0";
}

// Monitor e Câmeras
function toggleMonitor() {
    monitorOpen = !monitorOpen;
    document.getElementById('monitor').classList.toggle('monitor-off');
    updateCam();
}

function changeCam(id, name) {
    currentCam = id;
    document.getElementById('cam-num').innerText = id;
    document.getElementById('cam-name').innerText = name;
    updateCam();
}

function updateCam() {
    const enemy = document.getElementById('animatronic');
    // Se o inimigo estiver na mesma sala que a câmera está olhando
    if (animatronicLocation === currentCam) {
        enemy.style.display = 'block';
        enemy.style.top = Math.random() * 50 + '%';
        enemy.style.left = Math.random() * 70 + '%';
    } else {
        enemy.style.display = 'none';
    }
}

// IA do Inimigo (Ele muda de sala a cada 10 segundos)
setInterval(() => {
    const locs = ['1A', '1B', '2A', 'OFFICE'];
    let idx = locs.indexOf(animatronicLocation);
    if (idx < locs.length - 1) {
        animatronicLocation = locs[idx + 1];
        console.log("Inimigo moveu para: " + animatronicLocation);
        if(monitorOpen) updateCam();
    }
    
    if (animatronicLocation === 'OFFICE' && !doors.L) {
        alert("GAME OVER! O animatrônico entrou!");
        location.reload();
    }
}, 10000);