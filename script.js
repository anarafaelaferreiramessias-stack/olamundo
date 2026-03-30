// --- CONFIGURAÇÕES TÉCNICAS E VARIÁVEIS GLOBAIS ---
let scene, camera, renderer, raycaster, hand, handItem, sunLight;
let moveF = false, moveB = false, moveL = false, moveR = false, canJump = false;
let velocity = new THREE.Vector3(), direction = new THREE.Vector3();
let targetRotation = new THREE.Euler(0, 0, 0, 'YXZ');
let prevTime = performance.now();
let blocks = [], drops = [], clouds = []; 
let inventoryWood = 0, selectedSlot = 0;
let isMining = false, miningTime = 0, currentTarget = null;
let worldTime = 0; 

// --- CONFIGURAÇÃO DO MUNDO INFINITO ---
const CHUNK_SIZE = 16;       
const VIEW_DISTANCE = 4;    
let activeChunks = new Map(); 

// --- TEXTURAS ---
const loader = new THREE.TextureLoader();

// Função auxiliar para pegar um quadrado específico do Atlas
function getAtlasMat(x, y) {
    const tex = loader.load('https://threejs.org/examples/textures/minecraft/atlas.png');
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.repeat.set(0.0625, 0.0625); // 1/16 do atlas
    tex.offset.set(x * 0.0625, y * 0.0625);
    return new THREE.MeshLambertMaterial({ map: tex });
}

// --- MATERIAIS DE BLOCO (ESTILO MINECRAFT) ---
const grassTop = getAtlasMat(0, 15);    // Parte verde
const grassSide = getAtlasMat(3, 15);   // Lado (terra + grama)
const dirtMat = getAtlasMat(2, 15);     // Parte de baixo (só terra)

// Array de 6 materiais para as 6 faces do cubo [X+, X-, Y+, Y-, Z+, Z-]
const grassBlockMaterials = [
    grassSide, grassSide, // Lados
    grassTop,  dirtMat,   // Cima e Baixo
    grassSide, grassSide  // Frente e Trás
];

const woodTex = loader.load('https://threejs.org/examples/textures/crate.gif'); 
woodTex.magFilter = THREE.NearestFilter;
const woodMat = new THREE.MeshLambertMaterial({ map: woodTex });

const leafMat = new THREE.MeshLambertMaterial({ color: 0x228822, transparent: true, opacity: 0.9 });
const blockGeo = new THREE.BoxGeometry(1, 1, 1);

// --- FUNÇÕES DE JOGO ---
function startGame() {
    document.getElementById('ui-overlay').style.display = 'none';
    document.getElementById('hotbar').style.display = 'flex';
    document.getElementById('crosshair').style.display = 'block';
    init();
}

function checkCollision(x, y, z) {
    const r = 0.3; 
    const h = 1.6;
    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i].position;
        if (Math.abs(x - b.x) < 1.2 && Math.abs(z - b.z) < 1.2) {
            if (x + r > b.x - 0.5 && x - r < b.x + 0.5 &&
                y + 0.2 > b.y - 0.5 && y - h < b.y + 0.5 &&
                z + r > b.z - 0.5 && z - r < b.z + 0.5) {
                return true;
            }
        }
    }
    return y < 0.5; 
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 15, CHUNK_SIZE * VIEW_DISTANCE * 1.1); 
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.rotation.order = 'YXZ';
    camera.position.set(0, 5, 0); 
    
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    sunLight = new THREE.DirectionalLight(0xffffff, 0.7);
    sunLight.position.set(50, 100, 50);
    scene.add(sunLight);

    hand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.6), new THREE.MeshLambertMaterial({color: 0xdbac82}));
    scene.add(hand);

    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    raycaster = new THREE.Raycaster();

    document.addEventListener('mousedown', (e) => {
        if (document.pointerLockElement !== renderer.domElement) {
            renderer.domElement.requestPointerLock();
        } else { 
            if (e.button === 0) startMining();
            if (e.button === 2) placeBlock();
        }
    });
    document.addEventListener('mouseup', stopMining);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);

    animate();
}

function generateChunk(chunkX, chunkZ) {
    const chunkKey = `${chunkX},${chunkZ}`;
    if (activeChunks.has(chunkKey)) return;

    const chunkGroup = new THREE.Group();
    activeChunks.set(chunkKey, chunkGroup);
    scene.add(chunkGroup);

    const startX = chunkX * CHUNK_SIZE;
    const startZ = chunkZ * CHUNK_SIZE;

    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = startX + x;
            const worldZ = startZ + z;

            // --- AQUI MUDOU: O chão agora usa o array de materiais ---
            const grassBlock = new THREE.Mesh(blockGeo, grassBlockMaterials);
            grassBlock.position.set(worldX, 0, worldZ);
            chunkGroup.add(grassBlock);
            blocks.push(grassBlock);

            if (worldX % 10 === 0 && worldZ % 10 === 0) {
                spawnTreeProc(worldX, 0.5, worldZ, chunkGroup);
            }
        }
    }
}

function spawnTreeProc(x, groundY, z, chunkGroup) {
    const treeHeight = 5; 
    for (let h = 0; h < treeHeight; h++) {
        const log = new THREE.Mesh(blockGeo, woodMat);
        log.position.set(x, groundY + h + 0.5, z);
        log.userData = { type: 'wood', t: 1.0 };
        chunkGroup.add(log);
        blocks.push(log);
    }
    for (let hy = 0; hy < 3; hy++) {
        for (let hx = -1; hx <= 1; hx++) {
            for (let hz = -1; hz <= 1; hz++) {
                if (hx === 0 && hz === 0 && hy < 2) continue; 
                const leaf = new THREE.Mesh(blockGeo, leafMat);
                leaf.position.set(x + hx, groundY + treeHeight + hy - 0.5, z + hz);
                leaf.userData = {