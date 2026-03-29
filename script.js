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

// --- CONFIGURAÇÃO DO MUNDO INFINITO (OPTIMIZADO) ---
const CHUNK_SIZE = 16;       
const VIEW_DISTANCE = 4;    // Agora podemos ver mais longe porque está leve
let activeChunks = new Map(); 

// --- TEXTURAS (MODIFICADO PARA GRAMA MINECRAFT) ---
const loader = new THREE.TextureLoader();
const woodTex = loader.load('https://threejs.org/examples/textures/crate.gif'); 

// Usando o atlas oficial do Three.js que tem a grama pixelada do Minecraft
const grassTex = loader.load('https://threejs.org/examples/textures/minecraft/atlas.png'); 
const leafTex = loader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');

[woodTex, grassTex, leafTex].forEach(t => {
    t.magFilter = THREE.NearestFilter; // Isso tira o borrado e deixa pixelado
    t.minFilter = THREE.NearestFilter;
});

// Ajuste preciso para a textura de grama pegar o quadrado verde do atlas
grassTex.repeat.set(0.0625, 0.0625);
grassTex.offset.set(0, 0.9375); // Posição exata do bloco de grama no atlas.png

// --- MATERIAIS ÚNICOS (Reutilizar economiza MUITA memória) ---
const grassMat = new THREE.MeshLambertMaterial({map: grassTex}); 
const woodMat = new THREE.MeshLambertMaterial({map: woodTex, color: 0x663300});
const leafMat = new THREE.MeshLambertMaterial({color: 0x228822, map: leafTex, transparent: true, opacity: 0.9});
const blockGeo = new THREE.BoxGeometry(1, 1, 1);

function startGame() {
    document.getElementById('ui-overlay').style.display = 'none';
    document.getElementById('hotbar').style.display = 'flex';
    document.getElementById('crosshair').style.display = 'block';
    init();
}

function checkCollision(x, y, z) {
    const r = 0.3; 
    const h = 1.6;
    // Otimização: Só checar colisão com blocos muito próximos
    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i].position;
        if (Math.abs(x - b.x) < 1.5 && Math.abs(z - b.z) < 1.5) {
            if (x + r > b.x - 0.5 && x - r < b.x + 0.5 &&
                y + 0.2 > b.y - 0.5 && y - h < b.y + 0.5 &&
                z + r > b.z - 0.5 && z - r < b.z + 0.5) {
                return true;
            }
        }
    }
    if (y < 0.5) return true; 
    return false;
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 10, CHUNK_SIZE * VIEW_DISTANCE * 1.2); 
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.rotation.order = 'YXZ';
    camera.position.set(0, 5, 0); 
    
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(50, 100, 50);
    scene.add(sunLight);

    // Braço do Personagem
    hand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.6), new THREE.MeshLambertMaterial({color: 0xdbac82}));
    scene.add(hand);
    handItem = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), woodMat);
    handItem.visible = false;
    scene.add(handItem);

    renderer = new THREE.WebGLRenderer({ antialias: false }); // Desativar antialias aumenta o FPS
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

// --- GERAÇÃO DE MUNDO INFINITO PLANO ---
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

            // CHÃO COM TEXTURA DE GRAMA PIXELADA
            const grassBlock = new THREE.Mesh(blockGeo, grassMat);
            grassBlock.position.set(worldX, 0, worldZ);
            chunkGroup.add(grassBlock);
            blocks.push(grassBlock);

            // MENOS ÁRVORES (Espaçadas a cada 16 blocos para evitar lag)
            if (worldX % 16 === 0 && worldZ % 16 === 0) {
                spawnTreeProc(worldX, 0.5, worldZ, chunkGroup);
            }
        }
    }
}

function spawnTreeProc(x, groundY, z, chunkGroup) {
    const treeHeight = 5; 
    // Tronco de Madeira
    for (let h = 0; h < treeHeight; h++) {
        const log = new THREE.Mesh(blockGeo, woodMat);
        log.position.set(x, groundY + h + 0.5, z);
        log.userData = { type: 'wood', t: 1.0 };
        chunkGroup.add(log);
        blocks.push(log);
    }
    // Folhagem simplificada 3x3x3
    for (let hy = 0; hy < 3; hy++) {
        for (let hx = -1; hx <= 1; hx++) {
            for (let hz = -1; hz <= 1; hz++) {
                if (hx === 0 && hz === 0 && hy < 2) continue; 
                const leaf = new THREE.Mesh(blockGeo, leafMat);
                leaf.position.set(x + hx, groundY + treeHeight + hy - 0.5, z + hz);
                leaf.userData = { type: 'leaf', t: 0.3 };
                chunkGroup.add(leaf);
                blocks.push(leaf);
            }
        }
    }
}

function updateChunks() {
    const pX = Math.floor(camera.position.x / CHUNK_SIZE);
    const pZ = Math.floor(camera.position.z / CHUNK_SIZE);

    // Criar novos chunks conforme o jogador anda
    for (let x = pX - VIEW_DISTANCE; x <= pX + VIEW_DISTANCE; x++) {
        for (let z = pZ - VIEW_DISTANCE; z <= pZ + VIEW_DISTANCE; z++) {
            generateChunk(x, z);
        }
    }

    // Limpeza de memória (Remove chunks distantes)
    for (const [key, group] of activeChunks) {
        const [cx, cz] = key.split(',').map(Number);
        if (Math.abs(cx - pX) > VIEW_DISTANCE + 1 || Math.abs(cz - pZ) > VIEW_DISTANCE + 1) {
            group.children.forEach(child => {
                const index = blocks.indexOf(child);
                if (index > -1) blocks.splice(index, 1);
            });
            scene.remove(group);
            activeChunks.delete(key);
        }
    }
}

// --- SISTEMAS DE INTERAÇÃO ---
function placeBlock() {
    if (selectedSlot !== 0 || inventoryWood <= 0) return;
    raycaster.setFromCamera(new THREE.Vector2(), camera);
    const hits = raycaster.intersectObjects(blocks);
    if (hits.length > 0 && hits[0].distance < 5) {
        const hit = hits[0];
        const pos = hit.point.clone().add(hit.face.normal.clone().multiplyScalar(0.5));
        const b = new THREE.Mesh(blockGeo, woodMat);
        b.position.set(Math.round(pos.x), Math.round(pos.y), Math.round(pos.z));
        b.userData = { type: 'wood', t: 1.0 };
        scene.add(b); 
        blocks.push(b); 
        inventoryWood--;
        document.getElementById('inv-wood').innerText = inventoryWood;
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

function handleKeyDown(e) {
    if(e.code === 'KeyW') moveF = true; if(e.code === 'KeyS') moveB = true;
    if(e.code === 'KeyA') moveL = true; if(e.code === 'KeyD') moveR = true;
    if(e.code === 'Space' && canJump) { velocity.y = 8; canJump = false; }
}

function handleKeyUp(e) {
    if(e.code === 'KeyW') moveF = false; if(e.code === 'KeyS') moveB = false;
    if(e.code === 'KeyA') moveL = false; if(e.code === 'KeyD') moveR = false;
}

function handleMouseMove(e) {
    if (document.pointerLockElement === renderer.domElement) {
        targetRotation.y -= e.movementX * 0.002;
        targetRotation.x -= e.movementY * 0.002;
        targetRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, targetRotation.x));
    }
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = Math.min((time - prevTime) / 1000, 0.1);

    updateChunks();

    // Suavização da Rotação
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

    // Mineração
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

    // Braço
    hand.position.copy(camera.position); hand.quaternion.copy(camera.quaternion);
    hand.translateX(0.4); hand.translateY(-0.3); hand.translateZ(-0.6);

    prevTime = time;
    renderer.render(scene, camera);
}