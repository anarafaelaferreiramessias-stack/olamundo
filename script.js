import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';

// --- CONFIGURAÇÕES DO MOTOR DE BLOCOS ---
let scene, camera, renderer;
let moveF = false, moveB = false, moveL = false, moveR = false;
let velocity = new THREE.Vector3();
let prevTime = performance.now();

function init() {
    // 1. Criar a Cena (Igual ao mundo do Java)
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Cor do céu

    // 2. Câmera (Perspectiva 3D real)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 3, 5);

    // 3. Renderizador (O que desenha na tela)
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 4. Luz (Para os blocos terem sombra e profundidade)
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 20, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    // 5. CRIAR OS BLOCOS (VOXELS)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    
    // Criar um chão de 20x20 blocos
    for (let x = -10; x < 10; x++) {
        for (let z = -10; z < 10; z++) {
            // Material verde para a grama
            const material = new THREE.MeshLambertMaterial({ color: 0x228B22 });
            const block = new THREE.Mesh(geometry, material);
            
            block.position.set(x, 0, z);
            scene.add(block);
        }
    }

    // Controles de Teclado
    window.addEventListener('keydown', (e) => {
        if(e.code === 'KeyW') moveF = true;
        if(e.code === 'KeyS') moveB = true;
    });
    window.addEventListener('keyup', (e) => {
        if(e.code === 'KeyW') moveF = false;
        if(e.code === 'KeyS') moveB = false;
    });

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    
    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    // Movimentação simples
    if (moveF) camera.translateZ(-10 * delta);
    if (moveB) camera.translateZ(10 * delta);

    renderer.render(scene, camera);
    prevTime = time;
}

init();