let scene, camera, renderer, raycaster, hand, handItem, ground;
let moveF = false, moveB = false, moveL = false, moveR = false, canJump = false;
let velocity = new THREE.Vector3(), direction = new THREE.Vector3();
let targetRotation = new THREE.Euler(0, 0, 0, 'YXZ');
let prevTime = performance.now();
let blocks = [], drops = [], clouds = []; 
let inventoryWood = 0, selectedSlot = 0;
let isMining = false, miningTime = 0, currentTarget = null;

// Tenta carregar texturas, mas define cores de reserva caso falhe (evita tela preta)
const loader = new THREE.TextureLoader();
const woodMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 }); // Marrom
const grassMat = new THREE.MeshLambertMaterial({ color: 0x4caf50 }); // Verde Grama
const leafMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32, transparent: true, opacity: 0.9 }); // Verde Folha

// Se quiser tentar carregar as texturas de novo, descomente as linhas abaixo:
// loader.load('https://threejs.org/examples/textures/crate.gif', (tex) => woodMat.map = tex);

function startGame() {
    const overlay = document.getElementById('ui-overlay');
    if(overlay) overlay.style.display = 'none';
    init();
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Céu Azul
    scene.fog = new THREE.Fog(0x87CEEB, 20, 100);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.rotation.order = 'YXZ';
    camera.position.y = 2; // Altura dos olhos do "Steve"

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(50, 100, 50);
    scene.add(sun);

    // Chão (Grama)
    const groundGeo = new THREE.PlaneGeometry(1000, 1000);
    groundGeo.rotateX(-Math.PI / 2);
    ground = new THREE.Mesh(groundGeo, grassMat);
    scene.add(ground);

    // Braço do Jogador (Estilo Minecraft)
    const handGeo = new THREE.BoxGeometry(0.2, 0.2, 0.5);
    hand = new THREE.Mesh(handGeo, new THREE.MeshLambertMaterial({color: 0xe0ac69}));
    scene.add(hand);

    // Criar árvores espalhadas
    for(let i=0; i<40; i++) {
        spawnTree(Math.random()*100-50, 0, Math.random()*100-50);
    }

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    raycaster = new THREE.Raycaster();

    // Controles
    document.addEventListener('mousedown', (e) => {
        if (document.pointerLockElement !== renderer.domElement) {
            renderer.domElement.requestPointerLock();
        } else {
            if (e.button === 0) startMining();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if(e.code === 'KeyW') moveF = true;
        if(e.code === 'KeyS') moveB = true;
        if(e.code === 'KeyA') moveL = true;
        if(e.code === 'KeyD') moveR = true;
        if(e.code === 'Space' && canJump) { velocity.y += 5; canJump = false; }
    });

    document.addEventListener('keyup', (e) => {
        if(e.code === 'KeyW') moveF = false;
        if(e.code === 'KeyS') moveB = false;
        if(e.code === 'KeyA') moveL = false;
        if(e.code === 'KeyD') moveR = false;
    });

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement) {
            targetRotation.y -= e.movementX * 0.002;
            targetRotation.x -= e.movementY * 0.002;
            targetRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, targetRotation.x));
        }
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
}

function spawnTree(x, y, z) {
    // Tronco
    for(let h=0; h<4; h++) {
        const log = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), woodMat);
        log.position.set(x, h + 0.5, z);
        log.userData = { type: 'wood', t: 1.0 };
        scene.add(log);
        blocks.push(log);
    }
    // Folhas
    for(let hy=3; hy<6; hy++) {
        for(let hx=-2; hx<=2; hx++) {
            for(let hz=-2; hz<=2; hz++) {
                if(Math.abs(hx) + Math.abs(hz) > 3) continue;
                const leaf = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), leafMat);
                leaf.position.set(x+hx, hy+0.5, z+hz);
                scene.add(leaf);
                blocks.push(leaf);
            }
        }
    }
}

// Lógica de Colisão
function checkCollision(nextPos) {
    const playerBox = new THREE.Box3().setFromCenterAndSize(
        nextPos, 
        new THREE.Vector3(0.7, 1.8, 0.7)
    );
    for (let i = 0; i < blocks.length; i++) {
        const blockBox = new THREE.Box3().setFromObject(blocks[i]);
        if (playerBox.intersectsBox(blockBox)) return true;
    }
    return false;
}

function startMining() {
    raycaster.setFromCamera(new THREE.Vector2(), camera);
    const hits = raycaster.intersectObjects(blocks);
    if (hits.length > 0 && hits[0].distance < 4) {
        const target = hits[0].object;
        scene.remove(target);
        blocks = blocks.filter(b => b !== target);
        inventoryWood++;
        console.log("Madeira coletada: " + inventoryWood);
    }
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    // Suavizar rotação da câmera
    camera.rotation.x += (targetRotation.x - camera.rotation.x) * 0.2;
    camera.rotation.y += (targetRotation.y - camera.rotation.y) * 0.2;

    // Física simples
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 18.0 * delta; // Gravidade

    direction.z = Number(moveF) - Number(moveB);
    direction.x = Number(moveR) - Number(moveL);
    direction.normalize();

    if (moveF || moveB) velocity.z -= direction.z * 60.0 * delta;
    if (moveL || moveR) velocity.x -= direction.x * 60.0 * delta;

    // Colisão Eixo X
    const stepX = -velocity.x * delta;
    const nextX = camera.position.clone();
    nextX.x += Math.cos(camera.rotation.y + Math.PI/2) * stepX; // Simplificado para teste
    if (!checkCollision(nextX)) camera.translateX(stepX);

    // Colisão Eixo Z
    const stepZ = velocity.z * delta;
    const nextZ = camera.position.clone();
    nextZ.translateZ(stepZ);
    if (!checkCollision(nextZ)) camera.translateZ(stepZ);

    // Gravidade e Chão
    camera.position.y += velocity.y * delta;
    if (camera.position.y < 2) {
        velocity.y = 0;
        camera.position.y = 2;
        canJump = true;
    }

    // Mover mão junto com câmera
    hand.position.copy(camera.position);
    hand.quaternion.copy(camera.quaternion);
    hand.translateX(0.5);
    hand.translateY(-0.4);
    hand.translateZ(-0.8);

    prevTime = time;
    renderer.render(scene, camera);
}