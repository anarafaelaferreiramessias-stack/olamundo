// --- CONFIGURAÇÕES E VARIÁVEIS ---
let scene, camera, renderer, raycaster, hand, sunLight;
let moveF = false, moveB = false, moveL = false, moveR = false, canJump = false;
let velocity = new THREE.Vector3(), direction = new THREE.Vector3();
let targetRotation = new THREE.Euler(0, 0, 0, 'YXZ');
let prevTime = performance.now();
let blocks = []; 
let inventoryWood = 0;
let isMining = false, miningTime = 0, currentTarget = null;

const CHUNK_SIZE = 16;       
const VIEW_DISTANCE = 4;    
let activeChunks = new Map(); 

const loader = new THREE.TextureLoader();
const blockGeo = new THREE.BoxGeometry(1, 1, 1);

// --- O SEGREDO DA TEXTURA DO MINECRAFT ---
// Função para criar o material de cada face usando o Atlas
function createBoxMaterial(x, y) {
    const tex = loader.load('https://threejs.org/examples/textures/minecraft/atlas.png');
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    // O atlas tem 16x16 blocos. 1/16 = 0.0625
    tex.repeat.set(0.0625, 0.0625);
    tex.offset.set(x * 0.0625, y * 0.0625);
    return new THREE.MeshLambertMaterial({ map: tex });
}

// Criando o array de 6 materiais (um para cada face do cubo)
// Coordenadas no Atlas: Lateral (3,15), Topo (0,15), Baixo (2,15)
const grassMaterials = [
    createBoxMaterial(3, 15), createBoxMaterial(3, 15), // Laterais (X)
    createBoxMaterial(0, 15), createBoxMaterial(2, 15), // Cima (Y+) e Baixo (Y-)
    createBoxMaterial(3, 15), createBoxMaterial(3, 15)  // Laterais (Z)
];

const woodMat = createBoxMaterial(4, 15); // Textura de tronco do Atlas
const leafMat = new THREE.MeshLambertMaterial({ color: 0x228822, transparent: true, opacity: 0.9 });

// --- INICIALIZAÇÃO ---
function startGame() {
    document.getElementById('ui-overlay').style.display = 'none';
    document.getElementById('hotbar').style.display = 'flex';
    document.getElementById('crosshair').style.display = 'block';
    init();
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 15, 50); 
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.rotation.order = 'YXZ';
    camera.position.set(0, 5, 0); 
    
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    sunLight = new THREE.DirectionalLight(0xffffff, 0.6);
    sunLight.position.set(10, 20, 10);
    scene.add(sunLight);

    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    raycaster = new THREE.Raycaster();

    // Eventos
    document.addEventListener('mousedown', () => renderer.domElement.requestPointerLock());
    document.addEventListener('keydown', (e) => toggleKey(e.code, true));
    document.addEventListener('keyup', (e) => toggleKey(e.code, false));
    document.addEventListener('mousemove', handleMouseMove);

    animate();
}

function toggleKey(code, isPressed) {
    if(code === 'KeyW') moveF = isPressed; if(code === 'KeyS') moveB = isPressed;
    if(code === 'KeyA') moveL = isPressed; if(code === 'KeyD') moveR = isPressed;
    if(code === 'Space' && isPressed && canJump) { velocity.y = 8; canJump = false; }
}

function handleMouseMove(e) {
    if (document.pointerLockElement === renderer.domElement) {
        targetRotation.y -= e.movementX * 0.002;
        targetRotation.x -= e.movementY * 0.002;
        targetRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, targetRotation.x));
    }
}

// --- MUNDO E CHUNKS ---
function generateChunk(chunkX, chunkZ) {
    const key = `${chunkX},${chunkZ}`;
    if (activeChunks.has(key)) return;

    const group = new THREE.Group();
    activeChunks.set(key, group);
    scene.add(group);

    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = chunkX * CHUNK_SIZE + x;
            const worldZ = chunkZ * CHUNK_SIZE + z;

            // AQUI A MÁGICA: Passamos o array de materiais grassMaterials
            const grassBlock = new THREE.Mesh(blockGeo, grassMaterials);
            grassBlock.position.set(worldX, 0, worldZ);
            group.add(grassBlock);
            blocks.push(grassBlock);

            if (worldX % 12 === 0 && worldZ % 12 === 0) spawnTree(worldX, 0.5, worldZ, group);
        }
    }
}

function spawnTree(x, y, z, group) {
    for (let i = 1; i <= 4; i++) {
        const log = new THREE.Mesh(blockGeo, woodMat);
        log.position.set(x, y + i, z);
        group.add(log);
        blocks.push(log);
    }
}

function updateWorld() {
    const pX = Math.floor(camera.position.x / CHUNK_SIZE);
    const pZ = Math.floor(camera.position.z / CHUNK_SIZE);

    for (let x = pX - VIEW_DISTANCE; x <= pX + VIEW_DISTANCE; x++) {
        for (let z = pZ - VIEW_DISTANCE; z <= pZ + VIEW_DISTANCE; z++) {
            generateChunk(x, z);
        }
    }
}

function checkCollision(x, y, z) {
    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i].position;
        if (Math.abs(x - b.x) < 0.7 && Math.abs(z - b.z) < 0.7 && Math.abs(y - b.y) < 1.1) return true;
    }
    return y < 0.5;
}

// --- LOOP ---
function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    updateWorld();

    // Suavização da câmera
    camera.rotation.x += (targetRotation.x - camera.rotation.x) * 0.15;
    camera.rotation.y += (targetRotation.y - camera.rotation.y) * 0.15;

    // Física simples
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 22.0 * delta; 

    direction.z = Number(moveF) - Number(moveB);
    direction.x = Number(moveR) - Number(moveL);
    direction.normalize();

    if (moveF || moveB) velocity.z -= direction.z * 100.0 * delta;
    if (moveL || moveR) velocity.x -= direction.x * 100.0 * delta;

    const sinY = Math.sin(camera.rotation.y), cosY = Math.cos(camera.rotation.y);
    const mX = (velocity.z * sinY - velocity.x * cosY) * delta;
    const mZ = (velocity.z * cosY + velocity.x * sinY) * delta;

    if (!checkCollision(camera.position.x + mX, camera.position.y, camera.position.z)) camera.position.x += mX;
    if (!checkCollision(camera.position.x, camera.position.y, camera.position.z + mZ)) camera.position.z += mZ;

    camera.position.y += velocity.y * delta;
    if (checkCollision(camera.position.x, camera.position.y, camera.position.z)) {
        camera.position.y -= velocity.y * delta;
        if (velocity.y < 0) canJump = true;
        velocity.y = 0;
    }

    prevTime = time;
    renderer.render(scene, camera);
}