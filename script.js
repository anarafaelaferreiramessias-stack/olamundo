// --- CONFIGURAÇÕES TÉCNICAS E VARIÁVEIS GLOBAIS ---
let scene, camera, renderer, raycaster, hand, handItem, sunLight;
let moveF = false, moveB = false, moveL = false, moveR = false, canJump = false;
let velocity = new THREE.Vector3(), direction = new THREE.Vector3();
let targetRotation = new THREE.Euler(0, 0, 0, 'YXZ');
let prevTime = performance.now();
let blocks = [], activeChunks = new Map();
let inventoryWood = 0, isMining = false, miningTime = 0, currentTarget = null;

const CHUNK_SIZE = 16;       
const VIEW_DISTANCE = 3;    

// --- SISTEMA DE TEXTURAS "PIXEL-PERFECT" ---
const loader = new THREE.TextureLoader();

function createPixelTexture(url) {
    const tex = loader.load(url);
    // ESSENCIAL: NearestFilter faz o pixel ficar quadrado e nítido
    tex.magFilter = THREE.NearestFilter; 
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false; // Evita que o Three.js suavize ao longe
    return tex;
}

// Texturas clássicas
const grassTex = createPixelTexture('https://threejs.org/examples/textures/minecraft/atlas.png');
grassTex.repeat.set(0.0625, 0.0625);
grassTex.offset.set(0, 0.9375);

const woodTex = createPixelTexture('https://threejs.org/examples/textures/crate.gif');
const leafTex = createPixelTexture('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');

const grassMat = new THREE.MeshLambertMaterial({ map: grassTex });
const woodMat = new THREE.MeshLambertMaterial({ map: woodTex });
const leafMat = new THREE.MeshLambertMaterial({ map: leafTex, color: 0x228822 });
const blockGeo = new THREE.BoxGeometry(1, 1, 1);

function startGame() {
    document.getElementById('ui-overlay').style.display = 'none';
    document.getElementById('hotbar').style.display = 'flex';
    document.getElementById('crosshair').style.display = 'block';
    init();
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x50A0FF); // Azul mais vivo
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.rotation.order = 'YXZ';
    camera.position.set(0, 5, 0); 
    
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    sunLight = new THREE.DirectionalLight(0xffffff, 0.5);
    sunLight.position.set(10, 20, 10);
    scene.add(sunLight);

    hand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.5), new THREE.MeshLambertMaterial({color: 0xdbac82}));
    scene.add(hand);

    renderer = new THREE.WebGLRenderer({ antialias: false }); // Desativado para manter pixels serrilhados
    renderer.setPixelRatio(1); // Força resolução baixa se quiser mais pixelado (tente 0.5 para efeito retro extremo)
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

function handleKeyDown(e) {
    // Suporte para WASD e SETAS
    if(e.code === 'KeyW' || e.code === 'ArrowUp') moveF = true;
    if(e.code === 'KeyS' || e.code === 'ArrowDown') moveB = true;
    if(e.code === 'KeyA' || e.code === 'ArrowLeft') moveL = true;
    if(e.code === 'KeyD' || e.code === 'ArrowRight') moveR = true;
    if(e.code === 'Space' && canJump) { velocity.y = 8; canJump = false; }
}

function handleKeyUp(e) {
    if(e.code === 'KeyW' || e.code === 'ArrowUp') moveF = false;
    if(e.code === 'KeyS' || e.code === 'ArrowDown') moveB = false;
    if(e.code === 'KeyA' || e.code === 'ArrowLeft') moveL = false;
    if(e.code === 'KeyD' || e.code === 'ArrowRight') moveR = false;
}

function checkCollision(x, y, z) {
    const r = 0.3; 
    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i].position;
        if (Math.abs(x - b.x) < 0.8 && Math.abs(z - b.z) < 0.8 && Math.abs(y - b.y) < 1) return true;
    }
    return y < 0.5;
}

function generateChunk(chunkX, chunkZ) {
    const chunkKey = `${chunkX},${chunkZ}`;
    if (activeChunks.has(chunkKey)) return;
    const chunkGroup = new THREE.Group();
    activeChunks.set(chunkKey, chunkGroup);
    scene.add(chunkGroup);
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = chunkX * CHUNK_SIZE + x;
            const worldZ = chunkZ * CHUNK_SIZE + z;
            const grassBlock = new THREE.Mesh(blockGeo, grassMat);
            grassBlock.position.set(worldX, 0, worldZ);
            chunkGroup.add(grassBlock);
            blocks.push(grassBlock);
            if (Math.random() < 0.02) spawnTree(worldX, 1, worldZ, chunkGroup);
        }
    }
}

function spawnTree(x, y, z, group) {
    for(let i=0; i<3; i++) {
        const log = new THREE.Mesh(blockGeo, woodMat);
        log.position.set(x, y+i, z);
        log.userData = { t: 0.5 };
        group.add(log); blocks.push(log);
    }
}

function updateChunks() {
    const pX = Math.floor(camera.position.x / CHUNK_SIZE);
    const pZ = Math.floor(camera.position.z / CHUNK_SIZE);
    for (let x = pX - VIEW_DISTANCE; x <= pX + VIEW_DISTANCE; x++) {
        for (let z = pZ - VIEW_DISTANCE; z <= pZ + VIEW_DISTANCE; z++) generateChunk(x, z);
    }
}

function handleMouseMove(e) {
    if (document.pointerLockElement === renderer.domElement) {
        targetRotation.y -= e.movementX * 0.002;
        targetRotation.x -= e.movementY * 0.002;
        targetRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, targetRotation.x));
    }
}

function startMining() {
    raycaster.setFromCamera(new THREE.Vector2(), camera);
    const hits = raycaster.intersectObjects(blocks);
    if (hits.length > 0 && hits[0].distance < 4) {
        isMining = true; currentTarget = hits[0].object; miningTime = 0;
        document.getElementById('mining-progress').style.display = 'block';
    }
}

function stopMining() { isMining = false; document.getElementById('mining-progress').style.display = 'none'; }

function placeBlock() {
    if (inventoryWood <= 0) return;
    raycaster.setFromCamera(new THREE.Vector2(), camera);
    const hits = raycaster.intersectObjects(blocks);
    if (hits.length > 0 && hits[0].distance < 5) {
        const hit = hits[0];
        const pos = hit.point.clone().add(hit.face.normal.clone().multiplyScalar(0.5));
        const b = new THREE.Mesh(blockGeo, woodMat);
        b.position.set(Math.round(pos.x), Math.round(pos.y), Math.round(pos.z));
        b.userData = { t: 0.5 };
        scene.add(b); blocks.push(b); 
        inventoryWood--;
        document.getElementById('inv-wood').innerText = inventoryWood;
    }
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = Math.min((time - prevTime) / 1000, 0.1);
    updateChunks();

    camera.rotation.x += (targetRotation.x - camera.rotation.x) * 0.2;
    camera.rotation.y += (targetRotation.y - camera.rotation.y) * 0.2;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 22.0 * delta; 

    direction.z = Number(moveF) - Number(moveB);
    direction.x = Number(moveR) - Number(moveL);
    direction.normalize();

    if (moveF || moveB) velocity.z -= direction.z * 100.0 * delta;
    if (moveL || moveR) velocity.x -= direction.x * 100.0 * delta;

    const mX = (velocity.z * Math.sin(camera.rotation.y) - velocity.x * Math.cos(camera.rotation.y)) * delta;
    const mZ = (velocity.z * Math.cos(camera.rotation.y) + velocity.x * Math.sin(camera.rotation.y)) * delta;

    if (!checkCollision(camera.position.x + mX, camera.position.y, camera.position.z)) camera.position.x += mX;
    if (!checkCollision(camera.position.x, camera.position.y, camera.position.z + mZ)) camera.position.z += mZ;

    camera.position.y += velocity.y * delta;
    if (checkCollision(camera.position.x, camera.position.y, camera.position.z)) {
        camera.position.y -= velocity.y * delta;
        if (velocity.y < 0) canJump = true;
        velocity.y = 0;
    }

    if (isMining && currentTarget) {
        miningTime += delta;
        document.getElementById('mining-bar').style.width = (miningTime/currentTarget.userData.t)*100 + '%';
        if (miningTime >= currentTarget.userData.t) {
            inventoryWood++;
            document.getElementById('inv-wood').innerText = inventoryWood;
            currentTarget.parent.remove(currentTarget);
            blocks = blocks.filter(b => b !== currentTarget);
            stopMining();
        }
    }

    hand.position.copy(camera.position); 
    hand.quaternion.copy(camera.quaternion);
    hand.translateX(0.4); hand.translateY(-0.3); hand.translateZ(-0.6);

    prevTime = time;
    renderer.render(scene, camera);
}