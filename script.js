/* LOGICA DO JOGO - MINECRAFT 3D (JavaScript)
   Instruções: 
   - W, A, S, D para andar
   - SHIFT para correr
   - ESPAÇO para pular
   - CLIQUE na tela para travar o mouse e olhar ao redor
*/

let scene, camera, renderer, moveForward, moveBackward, moveLeft, moveRight, canJump;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let trees = [];

function iniciarJogo() {
    // Esconde o menu
    document.getElementById('tela-inicial').style.display = 'none';

    // 1. Configuração Básica da Cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Céu
    scene.fog = new THREE.Fog(0x87CEEB, 0, 50); // Neblina para parecer infinito

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 2. Iluminação
    const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 1);
    scene.add(light);

    // 3. O Chão (Grama)
    const floorGeo = new THREE.PlaneGeometry(200, 200);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x44aa44 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // 4. Criando Árvores (Troncos e Folhas)
    for (let i = 0; i < 20; i++) {
        criarArvore(
            Math.random() * 80 - 40, 
            Math.random() * 80 - 40
        );
    }

    // 5. Controles de Teclado
    document.addEventListener('keydown', (e) => toggleKey(e.code, true));
    document.addEventListener('keyup', (e) => toggleKey(e.code, false));

    // 6. Controle de Mouse (Olhar)
    document.addEventListener('click', () => {
        document.body.requestPointerLock();
    });

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === document.body) {
            camera.rotation.y -= e.movementX * 0.002;
            // Limitar olhar para cima e baixo
            let newRotationX = camera.rotation.x - e.movementY * 0.002;
            camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, newRotationX));
        }
    });

    animate();
}

function criarArvore(x, z) {
    const trunk = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 3, 0.8),
        new THREE.MeshLambertMaterial({ color: 0x5d4037 })
    );
    trunk.position.set(x, 1.5, z);
    
    const leaves = new THREE.Mesh(
        new THREE.BoxGeometry(3, 3, 3),
        new THREE.MeshLambertMaterial({ color: 0x228822 })
    );
    leaves.position.set(x, 4, z);
    
    scene.add(trunk);
    scene.add(leaves);
}

function toggleKey(code, isPressed) {
    if (code === 'KeyW') moveForward = isPressed;
    if (code === 'KeyS') moveBackward = isPressed;
    if (code === 'KeyA') moveLeft = isPressed;
    if (code === 'KeyD') moveRight = isPressed;
    if (code === 'Space' && isPressed && canJump) {
        velocity.y += 10;
        canJump = false;
    }
}

function animate() {
    requestAnimationFrame(animate);

    const delta = 0.1; // Velocidade do tempo
    const sprint = (keys['ShiftLeft'] || keys['ShiftRight']) ? 1.5 : 1.0;

    // Física de Movimento
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 2.0 * delta; // Gravidade

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta * sprint;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta * sprint;

    // Aplicar Velocidade à Câmera
    camera.translateX(-velocity.x * delta);
    camera.translateZ(velocity.z * delta);
    camera.position.y += (velocity.y * delta);

    // Chão Físico
    if (camera.position.y < 1.6) {
        velocity.y = 0;
        camera.position.y = 1.6;
        canJump = true;
    }

    renderer.render(scene, camera);
}

// Objeto auxiliar para capturar Shift
const keys = {};
document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);