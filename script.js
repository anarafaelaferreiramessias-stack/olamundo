let scene, camera, renderer, controls;
let objects = []; // Blocos que podem ser interagidos
let raycaster; // Para detectar onde o mouse aponta

function inicializar3D() {
    // 1. Configuração da Cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Céu azul
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.01);

    // 2. Câmera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(10, 2, 10);

    // 3. Renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // 4. Luzes
    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 0.5).normalize();
    scene.add(directionalLight);

    // 5. Controles (Pointer Lock)
    setupControls();

    // 6. Gerar Mundo
    gerarChao();
    gerarArvore(5, 5);
    gerarArvore(-5, -8);

    // 7. Raycaster para Interação
    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);

    // Loop de Animação
    animate();
}

function gerarChao() {
    const loader = new THREE.TextureLoader();
    // Textura de grama simples (usando placeholder caso não tenha imagem)
    const grassTex = loader.load('https://vignette.wikia.nocookie.net/minecraft/images/f/f3/Grass_Block_Side.png');
    
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({ color: 0x559944 });

    for (let x = -15; x < 15; x++) {
        for (let z = -15; z < 15; z++) {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, 0, z);
            scene.add(mesh);
            objects.push(mesh);
        }
    }
}

function gerarArvore(x, z) {
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x4b3621 });
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    const geom = new THREE.BoxGeometry(1, 1, 1);

    // Tronco
    for(let i = 1; i <= 3; i++) {
        const tronco = new THREE.Mesh(geom, woodMat);
        tronco.position.set(x, i, z);
        scene.add(tronco);
        objects.push(tronco);
    }
    // Folhas
    const copa = new THREE.Mesh(geom, leafMat);
    copa.position.set(x, 4, z);
    copa.scale.set(3, 2, 3);
    scene.add(copa);
    objects.push(copa);
}

// Lógica de Movimento
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, canJump = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();

function setupControls() {
    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'KeyW': moveForward = true; break;
            case 'KeyS': moveBackward = true; break;
            case 'KeyA': moveLeft = true; break;
            case 'KeyD': moveRight = true; break;
            case 'Space': if (canJump) velocity.y += 0.2; canJump = false; break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'KeyW': moveForward = false; break;
            case 'KeyS': moveBackward = false; break;
            case 'KeyA': moveLeft = false; break;
            case 'KeyD': moveRight = false; break;
        }
    });

    // Travar mouse ao clicar na tela
    document.body.addEventListener('click', () => {
        document.body.requestPointerLock();
    });

    // Interação com blocos
    document.addEventListener('mousedown', (e) => {
        if (document.pointerLockElement !== document.body) return;

        raycaster.setFromCamera({x: 0, y: 0}, camera);
        const intersects = raycaster.intersectObjects(objects);

        if (intersects.length > 0) {
            const intersect = intersects[0];
            
            if (e.button === 0) { // Botão Esquerdo: Quebrar
                scene.remove(intersect.object);
                objects.splice(objects.indexOf(intersect.object), 1);
            } else if (e.button === 2) { // Botão Direito: Colocar
                const voxel = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshLambertMaterial({color: 0x888888}));
                voxel.position.copy(intersect.object.position).add(intersect.face.normal);
                scene.add(voxel);
                objects.push(voxel);
            }
        }
    });
    
    // Prevenir menu de contexto no botão direito
    document.addEventListener('contextmenu', e => e.preventDefault());
}

let prevTime = performance.now();
function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    // Simulação de Gravidade e Movimento
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 0.5 * delta; // gravidade

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * 100.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 100.0 * delta;

    camera.translateX(-velocity.x * delta);
    camera.translateZ(velocity.z * delta);
    camera.position.y += velocity.y;

    if (camera.position.y < 2) {
        velocity.y = 0;
        camera.position.y = 2;
        canJump = true;
    }

    // Rotação da câmera com o mouse (simples)
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === document.body) {
            camera.rotation.y -= e.movementX * 0.002;
            camera.rotation.x -= e.movementY * 0.002;
            camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
        }
    });

    renderer.render(scene, camera);
    prevTime = time;
}

// Ajuste de janela
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});