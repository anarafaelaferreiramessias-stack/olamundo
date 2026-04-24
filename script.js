// --- VARIÁVEIS GLOBAIS ---
let scene, camera, renderer, raycaster;
let moveF = false, moveB = false, moveL = false, moveR = false, canJump = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();
let blocks = [];
let inventoryWood = 0;

// --- CONFIGURAÇÕES DO MUNDO ---
const CHUNK_SIZE = 20;
const PLAYER_SPEED = 40.0;
const JUMP_FORCE = 8.0;

// --- TEXTURAS PIXELADAS ---
const loader = new THREE.TextureLoader();
const loadTex = (url) => {
    const tex = loader.load(url);
    tex.magFilter = THREE.NearestFilter; // Pixels nítidos (estilo Minecraft)
    tex.minFilter = THREE.NearestFilter;
    return tex;
};

// Textura de grama clássica
const grassMat = new THREE.MeshLambertMaterial({ 
    map: loadTex('https://threejs.org/examples/textures/minecraft/atlas.png') 
});
// Ajustando a coordenada da textura para pegar só a grama
grassMat.map.repeat.set(0.0625, 0.0625);
grassMat.map.offset.set(0, 0.9375);

const woodMat = new THREE.MeshLambertMaterial({ 
    map: loadTex('https://threejs.org/examples/textures/crate.gif') 
});

function init() {
    // 1. Cena e Câmera
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 2, 5);

    // 2. Luz
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 0.5);
    sun.position.set(10, 20, 10);
    scene.add(sun);

    // 3. Renderizador (SEM ANTI-ALIAS para ficar pixelado)
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();

    // 4. Chão Inicial
    const geo = new THREE.BoxGeometry(1, 1, 1);
    for (let x = -10; x < 10; x++) {
        for (let z = -10; z < 10; z++) {
            const block = new THREE.Mesh(geo, grassMat);
            block.position.set(x, 0, z);
            scene.add(block);
            blocks.push(block);
        }
    }

    // 5. Controles de Teclado
    const onKeyDown = (e) => {
        switch (e.code) {
            case 'KeyW': case 'ArrowUp': moveF = true; break;
            case 'KeyS': case 'ArrowDown': moveB = true; break;
            case 'KeyA': case 'ArrowLeft': moveL = true; break;
            case 'KeyD': case 'ArrowRight': moveR = true; break;
            case 'Space': if (canJump) velocity.y += JUMP_FORCE; canJump = false; break;
        }
    };
    const onKeyUp = (e) => {
        switch (e.code) {
            case 'KeyW': case 'ArrowUp': moveF = false; break;
            case 'KeyS': case 'ArrowDown': moveB = false; break;
            case 'KeyA': case 'ArrowLeft': moveL = false; break;
            case 'KeyD': case 'ArrowRight': moveR = false; break;
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Mouse para girar
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement) {
            camera.rotation.y -= e.movementX * 0.002;
            camera.rotation.x -= e.movementY * 0.002;
            camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
        }
    });

    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

    animate();
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    // --- LÓGICA DE MOVIMENTO ---
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 20.0 * delta; // Gravidade

    direction.z = Number(moveF) - Number(moveB);
    direction.x = Number(moveR) - Number(moveL);
    direction.normalize();

    if (moveF || moveB) velocity.z -= direction.z * PLAYER_SPEED * delta;
    if (moveL || moveR) velocity.x -= direction.x * PLAYER_SPEED * delta;

    camera.translateX(-velocity.x * delta);
    camera.translateZ(-velocity.z * delta);
    camera.position.y += velocity.y * delta;

    // Chão simples (colisão básica)
    if (camera.position.y < 2) {
        velocity.y = 0;
        camera.position.y = 2;
        canJump = true;
    }

    prevTime = time;
    renderer.render(scene, camera);
}

init();