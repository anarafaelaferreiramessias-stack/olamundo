/**
 * LÓGICA DO JOGO - MINECRAFT JS
 * Professor: Este script controla a cena 3D, física de gravidade e inputs de teclado.
 */

// 1. Variáveis Globais (Estado do Jogo)
let camera, scene, renderer;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, canJump = false;
let velocity = new THREE.Vector3(); // Vetor de força atual
let direction = new THREE.Vector3(); // Vetor de direção do movimento
let prevTime = performance.now(); // Marcação de tempo para o Delta Time

function iniciarJogo() {
    // Esconde o menu e mostra a mira (UI)
    document.getElementById('menu').style.display = 'none';
    if(document.getElementById('crosshair')) document.getElementById('crosshair').style.display = 'block';

    // 2. Setup da Cena e Câmera
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Cor do céu (Sky Blue)
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.015); // Efeito de distância (Neblina)

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 2; // Altura dos olhos do jogador (nível do bloco)

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 3. Iluminação do Mundo
    const light = new THREE.AmbientLight(0xffffff, 0.7); // Luz global suave
    scene.add(light);
    const sun = new THREE.DirectionalLight(0xffffff, 0.8); // Luz direcional (Sol)
    sun.position.set(10, 20, 10);
    scene.add(sun);

    // 4. Geração do Terreno (Grid de Cubos)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({ color: 0x55902e }); // Material verde

    for (let x = -15; x < 15; x++) {
        for (let z = -15; z < 15; z++) {
            const block = new THREE.Mesh(geometry, material);
            block.position.set(x, 0, z);
            
            // Adição de contornos pretos para estética voxel
            const edges = new THREE.EdgesGeometry(geometry);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.1, transparent: true }));
            block.add(line);
            
            scene.add(block);
        }
    }

    // 5. Handlers de Eventos (Teclado)
    const onKeyDown = (e) => {
        if (e.code === 'KeyW') moveForward = true;
        if (e.code === 'KeyS') moveBackward = true;
        if (e.code === 'KeyA') moveLeft = true;
        if (e.code === 'KeyD') moveRight = true;
        if (e.code === 'Space' && canJump) { 
            velocity.y += 5; // Impulso do pulo
            canJump = false; 
        }
    };
    const onKeyUp = (e) => {
        if (e.code === 'KeyW') moveForward = false;
        if (e.code === 'KeyS') moveBackward = false;
        if (e.code === 'KeyA') moveLeft = false;
        if (e.code === 'KeyD') moveRight = false;
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // 6. Loop Principal (Motor de Física e Renderização)
    function animate() {
        requestAnimationFrame(animate);

        const time = performance.now();
        const delta = (time - prevTime) / 1000; // Cálculo do tempo real entre frames

        // Fricção (Desaceleração gradual)
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 1.5 * delta; // Gravidade acelerada

        // Determinação da direção do movimento
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // Evita velocidade dobrada na diagonal

        // Movimentação baseada no ângulo da câmera
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        camDir.y = 0; camDir.normalize();
        const camSide = new THREE.Vector3().crossVectors(camera.up, camDir).normalize();

        if (moveForward || moveBackward) velocity.addScaledVector(camDir, 40 * delta * direction.z);
        if (moveLeft || moveRight) velocity.addScaledVector(camSide, 40 * delta * direction.x);

        // Aplicação de movimento no personagem
        camera.position.x += velocity.x * delta;
        camera.position.y += velocity.y * delta;
        camera.position.z += velocity.z * delta;

        // Detecção de Colisão Simples (Chão fixo em Y=2)
        if (camera.position.y < 2) {
            velocity.y = 0;
            camera.position.y = 2;
            canJump = true;
        }

        renderer.render(scene, camera);
        prevTime = time;
    }

    animate();
}