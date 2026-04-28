// Variáveis Globais
let scene, camera, renderer, raycaster;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, canJump = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let objects = []; // Lista de blocos para colisão e interação

// Esta função é chamada pelo HTML quando você clica em "JOGAR MUNDO"
function inicializar3D() {
    console.log("Iniciando motor 3D...");

    // 1. Criar a Cena e o Céu
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Cor azul céu
    scene.fog = new THREE.Fog(0x87CEEB, 0, 100);  // Neblina suave

    // 2. Câmera (Perspectiva)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Posiciona o jogador um pouco acima do chão (Y=1.6 é altura dos olhos)
    camera.position.set(0, 1.6, 5);
    // Configura a ordem de rotação para evitar bugs no controle do mouse
    camera.rotation.order = 'YXZ';

    // 3. Renderizador (WebGL)
    // Se der erro aqui, é porque a biblioteca THREE.js não carregou no HTML
    if (typeof THREE === 'undefined') {
        alert("Erro: A biblioteca THREE.js não foi carregada corretamente no HTML.");
        return;
    }
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // 4. Iluminação (Fundamental para ver os blocos)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Luz suave em tudo
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8); // Luz do "Sol"
    sunLight.position.set(10, 20, 10);
    scene.add(sunLight);

    // 5. Criar o Chão de Grama
    const geoBloco = new THREE.BoxGeometry(1, 1, 1);
    const matGrama = new THREE.MeshLambertMaterial({ color: 0x55aa44 }); // Verde

    // Gerar uma plataforma 30x30
    for (let x = -15; x < 15; x++) {
        for (let z = -15; z < 15; z++) {
            const bloco = new THREE.Mesh(geoBloco, matGrama);
            // O chão é Y=0. Os pés do jogador ficam em Y=0.5. A câmera fica em Y=1.6
            bloco.position.set(x, 0, z);
            scene.add(bloco);
            objects.push(bloco); // Adiciona na lista de colisão
        }
    }

    // 6. Controles e Mouse
    setupControls();

    // 7. Raycaster para detecção de chão
    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 2);

    // 8. Loop de animação
    animate();
    console.log("Jogo carregado. Clique na tela para controlar.");
}

function setupControls() {
    // Trava o mouse ao clicar na tela
    document.addEventListener('click', () => {
        // Verifica se a tela inicial já sumiu (para não travar o mouse antes da hora)
        if (document.getElementById('tela-inicial').style.display === 'none') {
            document.body.requestPointerLock();
        }
    });

    // Teclado
    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'KeyW': case 'ArrowUp': moveForward = true; break;
            case 'KeyS': case 'ArrowDown': moveBackward = true; break;
            case 'KeyA': case 'ArrowLeft': moveLeft = true; break;
            case 'KeyD': case 'ArrowRight': moveRight = true; break;
            case 'Space': if (canJump === true) velocity.y += 0.2; canJump = false; break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'KeyW': case 'ArrowUp': moveForward = false; break;
            case 'KeyS': case 'ArrowDown': moveBackward = false; break;
            case 'KeyA': case 'ArrowLeft': moveLeft = false; break;
            case 'KeyD': case 'ArrowRight': moveRight = false; break;
        }
    });

    // Mouse para olhar
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === document.body) {
            // Sensibilidade do mouse
            const sensitivity = 0.002;
            camera.rotation.y -= e.movementX * sensitivity;
            camera.rotation.x -= e.movementY * sensitivity;
            // Limita o ângulo para não quebrar o pescoço
            camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
        }
    });
}

function animate() {
    requestAnimationFrame(animate);

    // Tempo entre quadros (delta) fixo para simplicidade
    const delta = 0.1; 

    // Simulação de Física e Movimento
    velocity.x -= velocity.x * 0.5 * delta; // Atrito X
    velocity.z -= velocity.z * 0.5 * delta; // Atrito Z
    velocity.y -= 0.05; // Gravidade

    // Direção do movimento baseada na câmera
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // Garante velocidade constante na diagonal

    // Aplica velocidade
    const speed = 0.2;
    if (moveForward || moveBackward) velocity.z -= direction.z * speed;
    if (moveLeft || moveRight) velocity.x -= direction.x * speed;

    // Move a câmera (jogador)
    camera.translateX(-velocity.x);
    camera.translateZ(velocity.z);
    camera.position.y += velocity.y;

    // Colisão simples com o chão (Raycasting)
    raycaster.ray.origin.copy(camera.position);
    const intersections = raycaster.intersectObjects(objects);

    const onObject = intersections.length > 0;

    if (onObject === true) {
        // Altura dos olhos (1.6m) + altura do bloco (0.5m até o centro) = 2.1m
        if (camera.position.y < 1.6) {
            velocity.y = Math.max(0, velocity.y);
            camera.position.y = 1.6;
            canJump = true;
        }
    } else if (camera.position.y < -10) {
        // Se cair do mundo, reseta posição
        camera.position.set(0, 5, 0);
        velocity.set(0,0,0);
    }

    renderer.render(scene, camera);
}

// Ajuste de tela caso redimensione o navegador
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});