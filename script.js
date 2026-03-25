let scene, camera, renderer, raycaster, hand, handItem, ground;
let moveF = false, moveB = false, moveL = false, moveR = false, canJump = false;
let velocity = new THREE.Vector3(), direction = new THREE.Vector3();
let targetRotation = new THREE.Euler(0, 0, 0, 'YXZ');
let prevTime = performance.now();
let blocks = [], drops = [], clouds = []; 
let inventoryWood = 0, selectedSlot = 0;
let isMining = false, miningTime = 0, currentTarget = null;

// --- CARREGAMENTO DE TEXTURAS (COM ESTILO PIXELADO DO MINECRAFT) ---
const loader = new THREE.TextureLoader();

// Textura da Madeira (Crate padrão, mas pixelada)
const woodTex = loader.load('https://threejs.org/examples/textures/crate.gif');

// --- NOVA TEXTURA DE GRAMA IGUAL DO MINECRAFT ---
// Usando uma textura que imita o bloco de grama clássico do Minecraft (topo verde, lados terra)
const grassTex = loader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg'); 
// Vamos ajustar a cor da grama existente para torná-la mais verde e vibrante, imitando o bioma clássico do Minecraft
grassTex.wrapS = THREE.RepeatWrapping;
grassTex.wrapT = THREE.RepeatWrapping;
grassTex.repeat.set(128, 128); // Repetir a textura para cobrir o chão imenso

// Textura das Folhas (Pixelada e com transparência)
const leafTex = loader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');

// --- CRÍTICO: APLICAR FILTRO NEAREST PARA VISUAL DE PIXEL (MINECRAFT) ---
// Isso impede o suavizamento dos pixels, mantendo-os nítidos e quadrados
[woodTex, grassTex, leafTex].forEach(t => {
    t.magFilter = THREE.NearestFilter; // Filtro para ampliação (quando você está perto)
    t.minFilter = THREE.NearestFilter; // Filtro para minificação (quando você está longe)
});

function startGame() {
    document.getElementById('ui-overlay').style.display = 'none';
    document.getElementById('hotbar').style.display = 'flex';
    document.getElementById('crosshair').style.display = 'block';
    document.getElementById('instructions').style.display = 'block';
    init();
}

// --- COLISÃO AABB CORRIGIDA ---
function checkCollision(x, y, z) {
    const r = 0.35; // Largura do jogador (raio)
    const h = 1.6;  // Altura do corpo (dos pés aos olhos)
    
    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i].position;
        // Verifica se a "caixa" do jogador intersecta a "caixa" do bloco (1x1x1)
        if (x + r > b.x - 0.5 && x - r < b.x + 0.5 &&
            y + 0.2 > b.y - 0.5 && y - h < b.y + 0.5 &&
            z + r > b.z - 0.5 && z - r < b.z + 0.5) {
            return true;
        }
    }
    return false;
}

function init() {
    scene = new THREE.Scene();
    // Céu azul claro e Fog combinando
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 20, 250); 
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.rotation.order = 'YXZ'; // Ordem de rotação para FPS
    
    // Iluminação
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 0.6);
    sun.position.set(10, 50, 10);
    scene.add(sun);

    // --- TERRENO COM NOVA TEXTURA ESTILO MINECRAFT ---
    const groundGeo = new THREE.PlaneGeometry(2000, 2000); 
    groundGeo.rotateX(-Math.PI / 2);
    // Usando MeshLambertMaterial com a textura de grama pixelada
    ground = new THREE.Mesh(groundGeo, new THREE.MeshLambertMaterial({
        map: grassTex,
        color: 0x55aa55 // Adicionando um tom verde vibrante clássico do Minecraft
    }));
    scene.add(ground);

    // --- SISTEMA DE NUVENS GIGANTE (MANTIDO) ---
    const cloudMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    for(let i = 0; i < 80; i++) {
        const cloudGroup = new THREE.Group();
        const w = Math.floor(Math.random() * 5) + 3; 
        const d = Math.floor(Math.random() * 4) + 2;
        for(let x = 0; x < w; x++) {
            for(let z = 0; z < d; z++) {
                if(Math.random() > 0.2) {
                    const blockGeo = new THREE.BoxGeometry(6, 1.8, 6);
                    const cloudBlock = new THREE.Mesh(blockGeo, cloudMaterial);
                    cloudBlock.position.set(x * 6, 0, z * 6);
                    cloudGroup.add(cloudBlock);
                }
            }
        }
        cloudGroup.position.set(Math.random() * 1600 - 800, 50 + Math.random() * 25, Math.random() * 1600 - 800);
        cloudGroup.scale.setScalar(Math.random() * 1.5 + 0.5);
        scene.add(cloudGroup);
        clouds.push(cloudGroup);
    }

    // Braço do Jogador e Item na mão
    hand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.6), new THREE.MeshLambertMaterial({color: 0xdbac82}));
    scene.add(hand);
    handItem = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshLambertMaterial({map: woodTex}));
    handItem.visible = false;
    scene.add(handItem);

    // Árvores aleatórias
    for(let i=0; i<30; i++) spawnTree(Math.random()*150-75, 0, Math.random()*150-75);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    raycaster = new THREE.Raycaster();

    // Eventos de Input
    document.addEventListener('mousedown', (e) => {
        if (document.pointerLockElement !== renderer.domElement) {
            renderer.domElement.requestPointerLock();
        } else { 
            if (e.button === 0) startMining(); // Botão Esquerdo: Quebrar
            if (e.button === 2) placeBlock();  // Botão Direito: Colocar
        }
    });
    document.addEventListener('contextmenu', e => e.preventDefault()); // Desabilitar menu de contexto
    document.addEventListener('mouseup', () => stopMining());
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);

    animate();
}

function spawnTree(x, y, z) {
    // Tronco (Madeira pixelada)
    for(let h=0; h<4; h++) {
        const log = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({map: woodTex}));
        log.position.set(x, h + 0.5, z);
        log.userData = { type: 'wood', t: 1.2 };
        scene.add(log); blocks.push(log);
    }
    // Folhas (Verde escuro pixelado)
    for(let hy=3; hy<6; hy++) {
        for(let hx=-2; hx<=2; hx++) {
            for(let hz=-2; hz<=2; hz++) {
                if(Math.abs(hx) + Math.abs(hz) > 2) continue;
                const leaf = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({
                    color: 0x228822, // Verde escuro para folhas
                    map: leafTex, 
                    transparent: true, 
                    opacity: 0.9
                }));
                leaf.position.set(x+hx, hy+0.5, z+hz);
                leaf.userData = { type: 'leaf', t: 0.3 };
                scene.add(leaf); blocks.push(leaf);
            }
        }
    }
}

function placeBlock() {
    if (selectedSlot !== 0 || inventoryWood <= 0) return;
    raycaster.setFromCamera(new THREE.Vector2(), camera);
    const hits = raycaster.intersectObjects([ground, ...blocks]);
    if (hits.length > 0 && hits[0].distance < 5) {
        const hit = hits[0];
        const pos = hit.point.clone().add(hit.face.normal.clone().multiplyScalar(0.5));
        const b = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({map: woodTex}));
        b.position.set(Math.round(pos.x), Math.round(pos.y), Math.round(pos.z));
        b.userData = { type: 'wood', t: 1.2 };
        scene.add(b); blocks.push(b); 
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

// --- CONTROLES WASD (CORRIGIDOS) ---
function handleKeyDown(e) {
    if(e.code === 'KeyW') moveF = true; 
    if(e.code === 'KeyS') moveB = true;
    if(e.code === 'KeyA') moveL = true; 
    if(e.code === 'KeyD') moveR = true;
    // Espaço: Pulo (canJump impede pulo duplo no ar)
    if(e.code === 'Space' && canJump) { velocity.y = 8; canJump = false; }
    if(e.key >= 1 && e.key <= 4) updateSlot(parseInt(e.key)-1); // Hotbar
}

function handleKeyUp(e) {
    if(e.code === 'KeyW') moveF = false; 
    if(e.code === 'KeyS') moveB = false;
    if(e.code === 'KeyA') moveL = false; 
    if(e.code === 'KeyD') moveR = false;
}

function handleMouseMove(e) {
    if (document.pointerLockElement === renderer.domElement) {
        targetRotation.y -= e.movementX * 0.002; // Rotação Horizontal
        targetRotation.x -= e.movementY * 0.002; // Rotação Vertical
        // Limitar rotação vertical (não olhar muito para cima/baixo)
        targetRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, targetRotation.x));
    }
}

function updateSlot(idx) {
    document.getElementById('s'+selectedSlot).classList.remove('selected');
    selectedSlot = idx;
    document.getElementById('s'+selectedSlot).classList.add('selected');
    handItem.visible = (selectedSlot === 0 && inventoryWood > 0);
}

// --- LOOP DE ANIMAÇÃO ---
function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = Math.min((time - prevTime) / 1000, 0.1); // Travar delta máximo para física

    // Suavização da rotação da câmera
    camera.rotation.x += (targetRotation.x - camera.rotation.x) * 0.3;
    camera.rotation.y += (targetRotation.y - camera.rotation.y) * 0.3;

    // Física e Atrito
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 25.0 * delta; // Gravidade

    // Direção baseada no WASD e rotação da câmera
    direction.z = Number(moveF) - Number(moveB);
    direction.x = Number(moveR) - Number(moveL);
    direction.normalize();

    // Aplica força de caminhada
    if (moveF || moveB) velocity.z -= direction.z * 100.0 * delta;
    if (moveL || moveR) velocity.x -= direction.x * 100.0 * delta;

    // --- CÁLCULO DE MOVIMENTO LOCAL COM COLISÃO ---
    // O movimento é relativo ao ângulo de rotação Y da câmera
    const sinY = Math.sin(camera.rotation.y);
    const cosY = Math.cos(camera.rotation.y);

    // Vetor de movimento local projetado no mundo
    const moveX = (velocity.z * sinY - velocity.x * cosY) * delta;
    const moveZ = (velocity.z * cosY + velocity.x * sinY) * delta;

    // Tenta mover no Eixo X
    if (!checkCollision(camera.position.x + moveX, camera.position.y, camera.position.z)) {
        camera.position.x += moveX;
    } else { 
        velocity.x = 0; // Para a velocidade se houver colisão
    }

    // Tenta mover no Eixo Z
    if (!checkCollision(camera.position.x, camera.position.y, camera.position.z + moveZ)) {
        camera.position.z += moveZ;
    } else { 
        velocity.z = 0; // Para a velocidade se houver colisão
    }

    // Tenta mover no Eixo Y (Pulo e Gravidade)
    let nextY = camera.position.y + (velocity.y * delta);
    if (nextY < 1.8) { 
        // Colisão com o chão plano
        velocity.y = 0; camera.position.y = 1.8; canJump = true; 
    } else {
        // Colisão com blocos (teto ou chão de blocos)
        if (checkCollision(camera.position.x, nextY, camera.position.z)) {
            if (velocity.y < 0) canJump = true; // Pousou em cima de um bloco
            velocity.y = 0;
        } else {
            camera.position.y = nextY;
            if (nextY > 1.8) canJump = false; // Está no ar
        }
    }

    // Movimento das Nuvens (80 nuvens)
    clouds.forEach(c => { 
        c.position.x += 0.04; 
        if(c.position.x > 800) c.position.x = -800; 
    });

    // Mineração e Drops
    if (isMining && currentTarget) {
        miningTime += delta;
        document.getElementById('mining-bar').style.width = (miningTime/currentTarget.userData.t)*100 + '%';
        if (miningTime >= currentTarget.userData.t) {
            // Cria drop
            const d = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.3,0.3), new THREE.MeshLambertMaterial({map: woodTex}));
            d.position.copy(currentTarget.position);
            scene.add(d); drops.push(d);
            // Remove bloco
            scene.remove(currentTarget);
            blocks = blocks.filter(b => b !== currentTarget);
            stopMining();
        }
    }

    // Coleta de Drops
    drops.forEach((d, i) => {
        d.rotation.y += 0.05;
        if (camera.position.distanceTo(d.position) < 1.8) {
            inventoryWood++; 
            document.getElementById('inv-wood').innerText = inventoryWood;
            if(selectedSlot === 0) handItem.visible = true;
            scene.remove(d); drops.splice(i, 1);
        }
    });

    // Animação do Braço (Balanço ao andar)
    const bob = Math.sin(time * 0.01) * ( (moveF||moveB) ? 0.04 : 0.005);
    hand.position.copy(camera.position); hand.quaternion.copy(camera.quaternion);
    hand.translateX(0.45); hand.translateY(-0.35 + bob); hand.translateZ(-0.6);
    
    // Item na mão segue o braço
    handItem.position.copy(hand.position); handItem.quaternion.copy(hand.quaternion);
    handItem.translateZ(-0.3);

    prevTime = time;
    renderer.render(scene, camera);
}