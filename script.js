// --- CONFIGURAÇÕES TÉCNICAS E VARIÁVEIS GLOBAIS ---
let scene, camera, renderer, raycaster, hand, sunLight;
let moveF = false, moveB = false, moveL = false, moveR = false, canJump = false;
let velocity = new THREE.Vector3(), direction = new THREE.Vector3();
let targetRotation = new THREE.Euler(0, 0, 0, 'YXZ');
let prevTime = performance.now();
let blocks = [], activeChunks = new Map();
let inventoryWood = 0;
let isMining = false, miningTime = 0, currentTarget = null;

const CHUNK_SIZE = 16;
const VIEW_DISTANCE = 3;

// --- CONFIGURAÇÃO DE TEXTURAS (GARANTIDO: TEXTURA BASE64 INCLUÍDA) ---
const loader = new THREE.TextureLoader();

// Textura clássica da lateral da grama do Minecraft (Base64)
const grassSideBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAALHRFWHRDcmVhdGlvbiBUaW1lAFN1biAxNCBNYXkgMjAwNiAyMjoyMTo1NCAtMDQwMOfuYNoAAAAHdElNRQfWBhQTMy45Nm4vAAAACXBIWXMAAAsSAAALEgHS3X78AAAABGdBTUEAALGPC/xhBQAAALZJREFUOMuV0tsKwkAMBuYreS8v5X08iBex6IsUhEAt9Pr+T7S0reI44Yf9mUxm45XIsmwaY4w555xz7v9ofYwxdm5933fW2m4f56+v5XmOCG6O67pCNo9jVVV4HId7fV9WFAUh5S6KAnVd43me7uW5T98XWp45xtC447v35XmOOC6K45gQpY5lWbZf47jX6S/wT8Asy55vAVDGGH6N4V6nv8A/AbMsu67r7uX554DrC5w/4f8f4A5P0W5uF4Xm+wAAAABJRU5ErkJggg==";

// Textura da terra/fundo (Base64)
const dirtBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMklEQVQ4T2NkoBAwUqifAWdgZGBgcGFgYIAbwgg3gBFuAEPcAES4AYxwAxDhBjDCDFgAADXoAAm7vXisAAAAAElFT6kSuQmCC";

function createTexture(base64Data) {
    const tex = loader.load(base64Data);
    // IMPORTANTE: NearestFilter mantém o visual pixelado "retro" do Minecraft
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
}

const grassSideTex = createTexture(grassSideBase64);
const dirtTex = createTexture(dirtBase64);

// --- MATERIAIS DO BLOCO DE GRAMA ---
// No Minecraft, a lateral é diferente do topo e do fundo.
const grassSideMat = new THREE.MeshLambertMaterial({ map: grassSideTex });
const dirtMat = new THREE.MeshLambertMaterial({ map: dirtTex });
// Material para o topo (verde). Usamos uma cor sólida para simplificar, mas mantendo o tom do jogo.
const grassTopMat = new THREE.MeshLambertMaterial({ color: 0x55aa44 }); 

// Array de materiais para as 6 faces do cubo: [x+, x-, y+, y-, z+, z-]
// Lateral (x+), Lateral (x-), TOPO (y+), FUNDO (y-), Lateral (z+), Lateral (z-)
const grassBlockMaterials = [
    grassSideMat, // right
    grassSideMat, // left
    grassTopMat,  // top
    dirtMat,      // bottom
    grassSideMat, // front
    grassSideMat  // back
];

// Outros materiais básicos para árvores e mão
const woodMat = new THREE.MeshLambertMaterial({ color: 0x664422 }); // Marrom Tronco
const leafMat = new THREE.MeshLambertMaterial({ color: 0x228822, transparent: true, opacity: 0.9 });
const blockGeo = new THREE.BoxGeometry(1, 1, 1);

// --- FUNÇÕES DE INICIALIZAÇÃO ---
function startGame() {
    // Esconde a UI e ativa o Pointer Lock
    document.getElementById('ui-overlay').style.display = 'none';
    document.getElementById('hotbar').style.display = 'flex';
    document.getElementById('crosshair').style.display = 'block';
    init();
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Céu azul claro
    scene.fog = new THREE.Fog(0x87CEEB, 10, 45); // Neblina para cobrir o fim do mundo

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.rotation.order = 'YXZ';
    camera.position.set(8, 5, 8); // Posição inicial elevada

    // Iluminação
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    sunLight = new THREE.DirectionalLight(0xffffff, 0.6);
    sunLight.position.set(10, 20, 10);
    scene.add(sunLight);

    // Representação da mão do jogador
    hand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.6), new THREE.MeshLambertMaterial({color: 0xdbac82}));
    scene.add(hand);

    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    raycaster = new THREE.Raycaster();

    // Eventos de Input
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', stopMining);
    document.addEventListener('keydown', (e) => handleKey(e.code, true));
    document.addEventListener('keyup', (e) => handleKey(e.code, false));
    document.addEventListener('mousemove', handleMouseMove);

    animate();
}

// --- LOGICA DE MUNDO E COLISÃO ---
function checkCollision(x, y, z) {
    for (let b of blocks) {
        const p = b.position;
        // Checagem simplificada de proximidade (AABB)
        if (Math.abs(x - p.x) < 0.7 && Math.abs(z - p.z) < 0.7 && Math.abs(y - p.y) < 1.2) return true;
    }
    return y < 0; // Impede cair abaixo do chão base
}

function generateChunk(cx, cz) {
    const key = `${cx},${cz}`;
    if (activeChunks.has(key)) return;

    const group = new THREE.Group();
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            // AQUI ESTÁ A MUDANÇA: Usando o array grassBlockMaterials
            const block = new THREE.Mesh(blockGeo, grassBlockMaterials);
            block.position.set(cx * CHUNK_SIZE + x, 0, cz * CHUNK_SIZE + z);
            group.add(block);
            blocks.push(block);

            // Gerar árvores aleatórias sobre o bloco de grama
            if (Math.random() > 0.985) spawnTree(block.position.x, 1, block.position.z, group);
        }
    }
    activeChunks.set(key, group);
    scene.add(group);
}

function spawnTree(x, y, z, group) {
    // Tronco
    for (let i = 0; i < 4; i++) {
        const log = new THREE.Mesh(blockGeo, woodMat);
        log.position.set(x, y + i, z);
        log.userData = { type: 'wood' };
        group.add(log); blocks.push(log);
    }
    // Folhas simplificadas (bloco grande verde)
    const leaf = new THREE.Mesh(blockGeo, leafMat);
    leaf.position.set(x, y + 4, z);
    leaf.scale.set(3, 2, 3);
    group.add(leaf); blocks.push(leaf);
}

// --- INPUTS E INTERAÇÃO ---
function handleKey(code, isPressed) {
    if(code === 'KeyW') moveF = isPressed;
    if(code === 'KeyS') moveB = isPressed;
    if(code === 'KeyA') moveL = isPressed;
    if(code === 'KeyD') moveR = isPressed;
    if(code === 'Space' && isPressed && canJump) { velocity.y = 8; canJump = false; }
}

function handleMouseMove(e) {
    if (document.pointerLockElement === renderer.domElement) {
        targetRotation.y -= e.movementX * 0.002;
        targetRotation.x -= e.movementY * 0.002;
        targetRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, targetRotation.x));
    }
}

function onMouseDown(e) {
    if (document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock();
    } else {
        if (e.button === 0) startMining(); // Botão esquerdo: Quebrar
        if (e.button === 2) placeBlock();  // Botão direito: Colocar
    }
}

function startMining() {
    raycaster.setFromCamera(new THREE.Vector2(), camera);
    const hits = raycaster.intersectObjects(blocks);
    if (hits.length > 0 && hits[0].distance < 4) {
        isMining = true; 
        currentTarget = hits[0].object; 
        miningTime = 0;
        document.getElementById('mining-progress').style.display = 'block';
    }
}

function stopMining() { 
    isMining = false; 
    document.getElementById('mining-progress').style.display = 'none'; 
}

function placeBlock() {
    if (inventoryWood <= 0) return;
    raycaster.setFromCamera(new THREE.Vector2(), camera);
    const hits = raycaster.intersectObjects(blocks);
    if (hits.length > 0 && hits[0].distance < 5) {
        const hit = hits[0];
        // Calcula a posição do novo bloco baseada na face clicada
        const pos = hit.point.clone().add(hit.face.normal.clone().multiplyScalar(0.5));
        const b = new THREE.Mesh(blockGeo, woodMat); // Coloca um bloco de madeira
        b.position.set(Math.round(pos.x), Math.round(pos.y), Math.round(pos.z));
        scene.add(b); blocks.push(b);
        inventoryWood--;
        document.getElementById('inv-wood').innerText = inventoryWood;
    }
}

// --- LOOP PRINCIPAL (ANIMATE) ---
function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = Math.min((time - prevTime) / 1000, 0.1);

    // Geração de mundo infinito ao redor do jogador
    const pX = Math.floor(camera.position.x / CHUNK_SIZE);
    const pZ = Math.floor(camera.position.z / CHUNK_SIZE);
    for(let x = pX-1; x <= pX+1; x++) {
        for(let z = pZ-1; z <= pZ+1; z++) generateChunk(x, z);
    }

    // Física Simplificada e Movimentação
    velocity.x -= velocity.x * 10.0 * delta; // Atrito X
    velocity.z -= velocity.z * 10.0 * delta; // Atrito Z
    velocity.y -= 22.0 * delta; // Gravidade

    direction.z = Number(moveF) - Number(moveB);
    direction.x = Number(moveR) - Number(moveL);
    direction.normalize();

    if (moveF || moveB) velocity.z -= direction.z * 100.0 * delta;
    if (moveL || moveR) velocity.x -= direction.x * 100.0 * delta;

    // Cálculo de direção baseado na rotação da câmera (Y)
    const sinY = Math.sin(camera.rotation.y), cosY = Math.cos(camera.rotation.y);
    const mX = (velocity.z * sinY - velocity.x * cosY) * delta;
    const mZ = (velocity.z * cosY + velocity.x * sinY) * delta;

    // Colisão simples em X e Z
    if (!checkCollision(camera.position.x + mX, camera.position.y, camera.position.z)) camera.position.x += mX;
    if (!checkCollision(camera.position.x, camera.position.y, camera.position.z + mZ)) camera.position.z += mZ;

    // Colisão simples e pulo em Y
    camera.position.y += velocity.y * delta;
    if (checkCollision(camera.position.x, camera.position.y - 1.6, camera.position.z)) {
        camera.position.y -= velocity.y * delta;
        velocity.y = 0; canJump = true;
    }

    // Suavização da rotação da câmera
    camera.rotation.x += (targetRotation.x - camera.rotation.x) * 0.2;
    camera.rotation.y += (targetRotation.y - camera.rotation.y) * 0.2;

    // Lógica de Mineração
    if (isMining && currentTarget) {
        miningTime += delta;
        document.getElementById('mining-bar').style.width = (miningTime / 0.8) * 100 + '%';
        if (miningTime >= 0.8) {
            inventoryWood++;
            document.getElementById('inv-wood').innerText = inventoryWood;
            currentTarget.visible = false; // Desativa o bloco visualmente
            blocks = blocks.filter(b => b !== currentTarget); // Remove da lista de colisões
            stopMining();
        }
    }

    // Posicionamento da "mão" para seguir a câmera
    hand.position.copy(camera.position); 
    hand.quaternion.copy(camera.quaternion);
    hand.translateX(0.4); hand.translateY(-0.3); hand.translateZ(-0.6);

    prevTime = time;
    renderer.render(scene, camera);
}