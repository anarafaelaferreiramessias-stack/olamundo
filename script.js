// --- CONFIGURAÇÕES TÉCNICAS E VARIÁVEIS GLOBAIS ---
let scene, camera, renderer, raycaster, hand, handItem, ground, sunLight;
let moveF = false, moveB = false, moveL = false, moveR = false, canJump = false;
let velocity = new THREE.Vector3(), direction = new THREE.Vector3();
let targetRotation = new THREE.Euler(0, 0, 0, 'YXZ');
let prevTime = performance.now();
let blocks = [], drops = [], clouds = []; 
let inventoryWood = 0, selectedSlot = 0;
let isMining = false, miningTime = 0, currentTarget = null;
let worldTime = 0; 

// --- CONFIGURAÇÃO DO MUNDO INFINITO (CHUNKS) ---
const CHUNK_SIZE = 16;       // Tamanho de cada pedaço (16x16 blocos)
const TERRAIN_HEIGHT = 25;  // Altura máxima das montanhas
// --- INFESTAÇÃO TOTAL: 100% DE CHANCE DE ÁRVORE ---
const TREE_DENSITY = 1.0;   // 1.0 = Árvore em CADA bloco. CUIDADO COM A PERFORMANCE!
// --- DISTÂNCIA DE VISÃO REDUZIDA PARA EVITAR CRASH ---
const VIEW_DISTANCE = 2;    // Mantido baixo (2 ou 3) para compensar a densidade extrema
let activeChunks = new Map(); // Armazena os chunks gerados: "x,z" -> Group

// --- CARREGAMENTO DE TEXTURAS PIXELADAS ---
const loader = new THREE.TextureLoader();
// Texturas padrão (pixeladas no seu projeto)
const woodTex = loader.load('https://threejs.org/examples/textures/crate.gif'); 
const grassTex = loader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg'); 
const leafTex = loader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');

[woodTex, grassTex, leafTex].forEach(t => {
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
});

// --- FUNÇÃO START GAME ---
function startGame() {
    // Esconder UI
    document.getElementById('ui-overlay').style.display = 'none';
    document.getElementById('hotbar').style.display = 'flex';
    document.getElementById('crosshair').style.display = 'block';
    document.getElementById('instructions').style.display = 'block';
    
    init();
}

// --- SISTEMA DE COLISÃO ROBUSTO ---
function checkCollision(x, y, z) {
    const r = 0.35; // Raio do jogador
    const h = 1.6;  // Altura
    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i].position;
        if (x + r > b.x - 0.5 && x - r < b.x + 0.5 &&
            y + 0.2 > b.y - 0.5 && y - h < b.y + 0.5 &&
            z + r > b.z - 0.5 && z - r < b.z + 0.5) {
            return true;
        }
    }
    // Colisão com o "chão base" infinito (camada de segurança)
    if (y < 1.0) return true; 
    return false;
}

// --- INICIALIZAÇÃO DO JOGO (init) ---
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    // Fog ajustado para a distância de visão curta
    scene.fog = new THREE.Fog(0x87CEEB, 5, CHUNK_SIZE * VIEW_DISTANCE * 0.8); 
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.rotation.order = 'YXZ';
    
    // Posição inicial do jogador (MUITO ALTA para não nascer sufocado em árvores)
    camera.position.set(CHUNK_SIZE / 2, TERRAIN_HEIGHT + 15, CHUNK_SIZE / 2);
    
    // Iluminação Dinâmica
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(50, 100, 50);
    scene.add(sunLight);

    // Nuvens
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    for(let i = 0; i < 100; i++) {
        const group = new THREE.Group();
        const size = Math.floor(Math.random() * 4) + 2;
        for(let j = 0; j < size; j++) {
            const b = new THREE.Mesh(new THREE.BoxGeometry(10, 2, 10), cloudMat);
            b.position.set(j*8, 0, Math.random()*5);
            group.add(b);
        }
        group.position.set(Math.random()*2000-1000, 80+Math.random()*20, Math.random()*2000-1000);
        scene.add(group);
        clouds.push(group);
    }

    // Braço e Item
    hand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.6), new THREE.MeshLambertMaterial({color: 0xdbac82}));
    scene.add(hand);
    handItem = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshLambertMaterial({map: woodTex, color: 0x8B4513}));
    handItem.visible = false;
    scene.add(handItem);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);
    raycaster = new THREE.Raycaster();

    // Eventos
    document.addEventListener('mousedown', (e) => {
        if (document.pointerLockElement !== renderer.domElement) {
            renderer.domElement.requestPointerLock();
        } else { 
            if (e.button === 0) startMining();
            if (e.button === 2) placeBlock();
        }
    });
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('mouseup', stopMining);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);

    animate();
}

// --- GERAÇÃO DE CHUNKS (Procedural com Ruído) ---
function noise(x, z) {
    // Ruído básico determinístico
    let v = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 0.6 + 0.4;
    v += Math.sin(x * 0.04 + z * 0.04) * 0.3; // Detalhes maiores das montanhas
    return v; // Valor entre ~0 e ~1
}

function generateChunk(chunkX, chunkZ) {
    const chunkKey = `${chunkX},${chunkZ}`;
    if (activeChunks.has(chunkKey)) return; // Já gerado

    const chunkGroup = new THREE.Group();
    activeChunks.set(chunkKey, chunkGroup);
    scene.add(chunkGroup);

    const startX = chunkX * CHUNK_SIZE;
    const startZ = chunkZ * CHUNK_SIZE;

    const grassMat = new THREE.MeshLambertMaterial({map: grassTex, color: 0x55aa55});
    const woodMat = new THREE.MeshLambertMaterial({map: woodTex, color: 0x663300});
    const leafMat = new THREE.MeshLambertMaterial({color: 0x228822, map: leafTex, transparent: true, opacity: 0.9});

    const blockGeo = new THREE.BoxGeometry(1, 1, 1);

    // Percorrer a grade do chunk
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = startX + x;
            const worldZ = startZ + z;

            // 1. Calcular Altura do Terreno (Montanhas)
            const n = noise(worldX, worldZ);
            const groundHeight = Math.floor(n * TERRAIN_HEIGHT) + 1; // Mínimo 1 bloco

            // 2. Gerar Bloco de Grama no topo
            const grassBlock = new THREE.Mesh(blockGeo, grassMat);
            grassBlock.position.set(worldX, groundHeight - 0.5, worldZ);
            chunkGroup.add(grassBlock);
            blocks.push(grassBlock); // Adicionar à lista global para colisão

            // 3. INFESTAÇÃO TOTAL DE ÁRVORES
            // Como TREE_DENSITY é 1.0, esta condição SEMPRE será verdadeira.
            // Colocamos árvore em CADA bloco de grama gerado.
            spawnTreeProc(worldX, groundHeight, worldZ, chunkGroup, woodMat, leafMat, blockGeo);
        }
    }
}

// Função para gerar árvore processual dentro do chunk
function spawnTreeProc(x, groundHeight, z, chunkGroup, woodMat, leafMat, blockGeo) {
    // Altura tronco variando entre 4 e 6 blocos
    const treeHeight = Math.floor(Math.random() * 3) + 4; 

    // Tronco
    for (let h = 0; h < treeHeight; h++) {
        const log = new THREE.Mesh(blockGeo, woodMat);
        log.position.set(x, groundHeight + h + 0.5, z);
        log.userData = { type: 'wood', t: 1.2 };
        chunkGroup.add(log);
        blocks.push(log);
    }

    // Copa (Cubo de folhas estilo Minecraft)
    // Infelizmente, as copas vão se sobrepor completamente, criando um emaranhado denso.
    for (let hy = treeHeight - 2; hy <= treeHeight + 1; hy++) {
        let radius = (hy > treeHeight) ? 1 : 2; // Estreita no topo
        for (let hx = -radius; hx <= radius; hx++) {
            for (let hz = -radius; hz <= radius; hz++) {
                // Removemos a falha aleatória para garantir densidade máxima
                const leaf = new THREE.Mesh(blockGeo, leafMat);
                leaf.position.set(x + hx, groundHeight + hy + 0.5, z + hz);
                leaf.userData = { type: 'leaf', t: 0.3 };
                chunkGroup.add(leaf);
                blocks.push(leaf);
            }
        }
    }
}

// Função para gerenciar quais chunks devem estar ativos
function updateChunks() {
    const playerChunkX = Math.floor(camera.position.x / CHUNK_SIZE);
    const playerChunkZ = Math.floor(camera.position.z / CHUNK_SIZE);

    // 1. Gerar novos chunks ao redor
    for (let x = playerChunkX - VIEW_DISTANCE; x <= playerChunkX + VIEW_DISTANCE; x++) {
        for (let z = playerChunkZ - VIEW_DISTANCE; z <= playerChunkZ + VIEW_DISTANCE; z++) {
            generateChunk(x, z);
        }
    }

    // 2. (Opcional) Remover chunks distantes para economizar memória
    // Manteremos ativos para simplificar o exemplo, mas isso consome memória.
}

// --- FUNÇÕES DE MINERAÇÃO, COLOCAÇÃO E INPUT (Mantidas) ---
function placeBlock() {
    if (selectedSlot !== 0 || inventoryWood <= 0) return;
    raycaster.setFromCamera(new THREE.Vector2(), camera);
    const hits = raycaster.intersectObjects(blocks);
    if (hits.length > 0 && hits[0].distance < 5) {
        const hit = hits[0];
        const pos = hit.point.clone().add(hit.face.normal.clone().multiplyScalar(0.5));
        
        const bMat = new THREE.MeshLambertMaterial({map: woodTex, color: 0x8B4513});
        const b = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), bMat);
        b.position.set(Math.round(pos.x), Math.round(pos.y), Math.round(pos.z));
        b.userData = { type: 'wood', t: 1.2 };
        
        scene.add(b); 
        blocks.push(b); 
        
        inventoryWood--;
        document.getElementById('inv-wood').innerText = inventoryWood;
        if(inventoryWood <= 0) handItem.visible = false;
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
    if(e.code === 'Space' && canJump) { velocity.y = 8.5; canJump = false; }
    if(e.key >= 1 && e.key <= 4) updateSlot(parseInt(e.key)-1);
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

function updateSlot(idx) {
    document.getElementById('s'+selectedSlot).classList.remove('selected');
    selectedSlot = idx;
    document.getElementById('s'+selectedSlot).classList.add('selected');
    handItem.visible = (selectedSlot === 0 && inventoryWood > 0);
}

// --- LOOP DE ANIMAÇÃO (animate) ---
function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = Math.min((time - prevTime) / 1000, 0.1);

    // 1. Atualizar Chunks (Infinito)
    updateChunks();

    // 2. Ciclo Dia/Noite (Lento)
    worldTime += delta * 0.05;
    const skyColor = new THREE.Color().setHSL(0.6, 0.5, 0.5 + Math.sin(worldTime)*0.3);
    scene.background = skyColor;
    scene.fog.color = skyColor;
    sunLight.intensity = 0.4 + Math.max(0, Math.sin(worldTime)*0.6);

    // 3. Câmera e Física
    camera.rotation.x += (targetRotation.x - camera.rotation.x) * 0.25;
    camera.rotation.y += (targetRotation.y - camera.rotation.y) * 0.25;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 26.0 * delta; // Gravidade forte

    direction.z = Number(moveF) - Number(moveB);
    direction.x = Number(moveR) - Number(moveL);
    direction.normalize();

    if (moveF || moveB) velocity.z -= direction.z * 110.0 * delta;
    if (moveL || moveR) velocity.x -= direction.x * 110.0 * delta;

    const sinY = Math.sin(camera.rotation.y), cosY = Math.cos(camera.rotation.y);
    const mX = (velocity.z * sinY - velocity.x * cosY) * delta;
    const mZ = (velocity.z * cosY + velocity.x * sinY) * delta;

    // Colisão Eixo X
    if (!checkCollision(camera.position.x + mX, camera.position.y, camera.position.z)) {
        camera.position.x += mX;
    } else { velocity.x = 0; }
    
    // Colisão Eixo Z
    if (!checkCollision(camera.position.x, camera.position.y, camera.position.z + mZ)) {
        camera.position.z += mZ;
    } else { velocity.z = 0; }

    // Colisão Eixo Y (Pulo e Gravidade)
    let nextY = camera.position.y + (velocity.y * delta);
    
    if (checkCollision(camera.position.x, nextY, camera.position.z)) {
        if (velocity.y < 0) {
            canJump = true; // Bateu no chão
        }
        velocity.y = 0;
    } else {
        camera.position.y = nextY;
        // Altura do pulo ajustada para nascer alto
        if (nextY > TERRAIN_HEIGHT + 15) canJump = false; 
    }

    // 4. Nuvens Infinitas
    clouds.forEach(c => { c.position.x += 0.05; if(c.position.x > 1000) c.position.x = -1000; });

    // 5. Mineração e Drops
    if (isMining && currentTarget) {
        miningTime += delta;
        document.getElementById('mining-bar').style.width = (miningTime/currentTarget.userData.t)*100 + '%';
        if (miningTime >= currentTarget.userData.t) {
            const dMat = new THREE.MeshLambertMaterial({map: woodTex, color: 0x8B4513});
            const d = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.3,0.3), dMat);
            d.position.copy(currentTarget.position);
            scene.add(d); drops.push(d);
            
            // Remover do chunk e da lista global
            currentTarget.parent.remove(currentTarget); 
            blocks = blocks.filter(b => b !== currentTarget);
            stopMining();
        }
    }

    // Coleta de Drops
    drops.forEach((d, i) => {
        d.rotation.y += 0.05;
        if (camera.position.distanceTo(d.position) < 2) {
            inventoryWood++; 
            document.getElementById('inv-wood').innerText = inventoryWood;
            if(selectedSlot === 0) handItem.visible = true;
            scene.remove(d); drops.splice(i, 1);
        }
    });

    // 6. Braço (Bobbing)
    const bob = Math.sin(time * 0.01) * ( (moveF||moveB) ? 0.05 : 0.005);
    hand.position.copy(camera.position); hand.quaternion.copy(camera.quaternion);
    hand.translateX(0.45); hand.translateY(-0.35 + bob); hand.translateZ(-0.6);
    handItem.position.copy(hand.position); handItem.quaternion.copy(hand.quaternion);
    handItem.translateZ(-0.3);

    prevTime = time;
    renderer.render(scene, camera);
}