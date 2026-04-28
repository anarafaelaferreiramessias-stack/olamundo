let scene, camera, renderer, raycaster;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, canJump = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let objects = [];

function inicializar3D() {
    // 1. Criar a Cena
    scene = new THREE.Scene();
    // Cor do céu (Sky Blue)
    scene.background = new THREE.Color(0x87CEEB); 
    // Adiciona neblina para dar profundidade
    scene.fog = new THREE.Fog(0x87CEEB, 0, 50);

    // 2. Câmera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Posiciona a câmera um pouco acima do chão (y=2)
    camera.position.set(0, 2, 5); 

    // 3. Renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x87CEEB); // Garante que o fundo não seja preto
    document.body.appendChild(renderer.domElement);

    // 4. Iluminação (Fundamental para não ver tudo preto)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Luz suave em tudo
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8); // Luz do "Sol"
    sunLight.position.set(10, 20, 10);
    scene.add(sunLight);

    // 5. Criar o Chão de Grama
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const matGrama = new THREE.MeshLambertMaterial({ color: 0x44aa44 }); // Verde grama
    const matTerra = new THREE.MeshLambertMaterial({ color: 0x8b4513 }); // Marrom terra

    // Criar uma plataforma 20x20
    for (let x = -10; x < 10; x++) {
        for (let z = -10; z < 10; z++) {
            const bloco = new THREE.Mesh(geo, matGrama);
            bloco.position.set(x, 0, z); // Y=0 é o chão
            scene.add(bloco);
            objects.push(bloco);
        }
    }

    // 6. Controles e Mouse
    setupControls();

    // 7. Loop de renderização
    animate();
}

function setupControls() {
    // Trava o mouse ao clicar na tela para girar a câmera
    document.addEventListener('click', () => {
        document.body.requestPointerLock();
    });

    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'KeyW': moveForward = true; break;
            case 'KeyS': moveBackward = true; break;
            case 'KeyA': moveLeft = true; break;
            case 'KeyD': moveRight = true; break;
            case 'Space': if (canJump) velocity.y += 0.15; canJump = false; break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'KeyW': moveForward = false; break;
            case 'KeyS': moveBackward = false; break;
            case 'KeyA': moveLeft = false; break;
            case 'KeyD': moveRight = false; break;
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === document.body) {
            camera.rotation.y -= e.movementX * 0.002;
            camera.rotation.x -= e.movementY * 0.002;
            camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
        }
    });

    // Resetar orientação da câmera para evitar bugs de rotação
    camera.rotation.order = 'YXZ';
}

function animate() {
    requestAnimationFrame(animate);

    const delta = 0.15; // Velocidade do movimento

    // Simulação básica de física
    velocity.x -= velocity.x * 0.1;
    velocity.z -= velocity.z * 0.1;
    velocity.y -= 0.008; // Gravidade

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * delta;

    camera.translateX(-velocity.x);
    camera.translateZ(velocity.z);
    camera.position.y += velocity.y;

    // Colisão simples com o chão (y=1.5 para manter o "olho" na altura certa)
    if (camera.position.y < 1.5) {
        velocity.y = 0;
        camera.position.y = 1.5;
        canJump = true;
    }

    renderer.render(scene, camera);
}

// Ajuste de tela caso redimensione o navegador
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});