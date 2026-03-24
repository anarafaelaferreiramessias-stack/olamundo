let scene, camera, renderer, raycaster, hand, handItem, ground;
let moveF = false, moveB = false, moveL = false, moveR = false, canJump = false;
let velocity = new THREE.Vector3(), direction = new THREE.Vector3();
let targetRotation = new THREE.Euler(0, 0, 0, 'YXZ');
let prevTime = performance.now();
let blocks = [], drops = [], clouds = []; 
let inventoryWood = 0, selectedSlot = 0;
let isMining = false, miningTime = 0, currentTarget = null;

// Texturas (Grama e Madeira)
const loader = new THREE.TextureLoader();
const woodTex = loader.load('https://threejs.org/examples/textures/crate.gif');
const grassTex = loader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
const leafTex = loader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');

function startGame() {
    document.getElementById('ui-overlay').style.display = 'none';
    document.getElementById('hotbar').style.display = 'flex';
    document.getElementById('crosshair').style.display = 'block';
    document.getElementById('instructions').style.display = 'block';
    init();
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 20, 150);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.rotation.order = 'YXZ';
    
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 0.6);
    sun.position.set(10, 50, 10);
    scene.add(sun);

    // Terreno
    const groundGeo = new THREE.PlaneGeometry(1000, 1000);
    groundGeo.rotateX(-Math.PI / 2);
    ground = new THREE.Mesh(groundGeo, new THREE.MeshLambertMaterial({map: grassTex}));
    scene.add(ground);

    // --- NOVO SISTEMA DE NUVENS VOLUMÉTRICAS (RESOLVE O ERRO DE TEXTURA) ---
    const cloudMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.8 
    });

    for(let i = 0; i < 15; i++) {
        const cloudGroup = new THREE.Group();
        const w = Math.floor(Math.random() * 4) + 3; 
        const d = Math.floor(Math.random() * 3) + 2;

        for(let x = 0; x < w; x++) {
            for(let z = 0; z < d; z++) {
                if(Math.random() > 0.3) {
                    const blockGeo = new THREE.BoxGeometry(6, 1.5, 6);
                    const cloudBlock = new THREE.Mesh(blockGeo, cloudMaterial);
                    cloudBlock.position.set(x * 6, 0, z * 6);
                    cloudGroup.add(cloudBlock);
                }
            }
        }
        cloudGroup.position.set(Math.random()*600-300, 50 + Math.random()*10, Math.random()*600-300);
        scene.add(cloudGroup);
        clouds.push(cloudGroup);
    }

    // Braço do Jogador
    hand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.6), new THREE.MeshLambertMaterial({color: 0xdbac82}));
    scene.add(hand);
    handItem = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshLambertMaterial({map: woodTex}));
    handItem.visible = false;
    scene.add(handItem);

    for(let i=0; i<30; i++) spawnTree(Math.random()*100-50, 0, Math.random()*100-50);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    raycaster = new THREE.Raycaster();

    // Eventos de Input
    document.addEventListener('mousedown', (e) => {
        if (document.pointerLockElement !== renderer.domElement) {
            renderer.domElement.requestPointerLock();
        } else { 
            if (e.button === 0) startMining(); 
            if (e.button === 2) placeBlock(); 
        }
    });
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('mouseup', () => stopMining());
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);

    animate();
}

function spawnTree(x, y, z) {
    for(let h=0; h<4; h++) {
        const log = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({map: woodTex}));
        log.position.set(x, h + 0.5, z);
        log.userData = { type: 'wood', t: 1.2 };
        scene.add(log); blocks.push(log);
    }
    for(let hy=3; hy<6; hy++) {
        for(let hx=-2; hx<=2; hx++) {
            for(let hz=-2; hz<=2; hz++) {
                if(Math.abs(hx) + Math.abs(hz) > 2) continue;
                const leaf = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({color: 0x2d5a27, map: leafTex, transparent: true, opacity: 0.9}));
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

function handleKeyDown(e) {
    if(e.code === 'KeyW') moveF = true; if(e.code === 'KeyS') moveB = true;
    if(e.code === 'KeyA') moveL = true; if(e.code === 'KeyD') moveR = true;
    if(e.code === 'Space' && canJump) { velocity.y += 5; canJump = false; }
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

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    camera.rotation.x += (targetRotation.x - camera.rotation.x) * 0.2;
    camera.rotation.y += (targetRotation.y - camera.rotation.y) * 0.2;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 15.0 * delta; 

    direction.z = Number(moveF) - Number(moveB);
    direction.x = Number(moveR) - Number(moveL);
    direction.normalize();

    if (moveF || moveB) velocity.z -= direction.z * 50.0 * delta;
    if (moveL || moveR) velocity.x -= direction.x * 50.0 * delta;

    camera.translateX(-velocity.x * delta);
    camera.translateZ(velocity.z * delta);
    camera.position.y += velocity.y * delta;
    
    if (camera.position.y < 1.8) { velocity.y = 0; camera.position.y = 1.8; canJump = true; }

    // --- MOVIMENTO DAS NUVENS ---
    clouds.forEach(c => { 
        c.position.x += 0.03; 
        if(c.position.x > 300) c.position.x = -300; 
    });

    if (isMining && currentTarget) {
        miningTime += delta;
        document.getElementById('mining-bar').style.width = (miningTime/currentTarget.userData.t)*100 + '%';
        if (miningTime >= currentTarget.userData.t) {
            const d = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.3,0.3), new THREE.MeshLambertMaterial({map: woodTex}));
            d.position.copy(currentTarget.position);
            scene.add(d); drops.push(d);
            scene.remove(currentTarget);
            blocks = blocks.filter(b => b !== currentTarget);
            stopMining();
        }
    }

    drops.forEach((d, i) => {
        d.rotation.y += 0.05;
        if (camera.position.distanceTo(d.position) < 1.8) {
            inventoryWood++; 
            document.getElementById('inv-wood').innerText = inventoryWood;
            if(selectedSlot === 0) handItem.visible = true;
            scene.remove(d); drops.splice(i, 1);
        }
    });

    const bob = Math.sin(time * 0.008) * ( (moveF||moveB) ? 0.03 : 0.005);
    hand.position.copy(camera.position); hand.quaternion.copy(camera.quaternion);
    hand.translateX(0.45); hand.translateY(-0.35 + bob); hand.translateZ(-0.6);
    handItem.position.copy(hand.position); handItem.quaternion.copy(hand.quaternion);
    handItem.translateZ(-0.3);

    prevTime = time;
    renderer.render(scene, camera);
}