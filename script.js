// --- VARIÁVEIS GLOBAIS ---
let scene, camera, renderer, raycaster, controls;
let moveF = false, moveB = false, moveL = false, moveR = false, canJump = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();
let objects = [];

// --- CARREGADOR DE TEXTURAS (PIXEL ART OTIMIZADO) ---
const loader = new THREE.TextureLoader();
const loadTex = (url) => {
    const tex = loader.load(url);
    tex.magFilter = THREE.NearestFilter; // Mantém os pixels nítidos
    tex.minFilter = THREE.NearestFilter;
    return tex;
};

// --- MATERIAIS DE ALTA QUALIDADE (MINECRAFT STYLE) ---
const atlas = 'https://threejs.org/examples/textures/minecraft/atlas.png';

// Função para criar o material da grama (Lados, Cima, Baixo)
function getGrassMaterials() {
    const sideTex = loadTex(atlas);
    const topTex = loadTex(atlas);
    const bottomTex = loadTex(atlas);

    // Ajuste fino do Atlas (Coordenadas UV)
    // Grama Lado
    sideTex.repeat.set(0.0625, 0.0625);
    sideTex.offset.set(0.1875, 0.9375);
    
    // Grama Cima
    topTex.repeat.set(0.0625, 0.0625);
    topTex.offset.set(0, 0.9375);
    
    // Terra Baixo
    bottomTex.repeat.set(0.0625, 0.0625);
    bottomTex.offset.set(0.125, 0.9375);

    const sideMat = new THREE.MeshLambertMaterial({ map: sideTex });
    const topMat = new THREE.MeshLambertMaterial({ map: topTex });
    const bottomMat = new THREE.MeshLambertMaterial({ map: bottomTex });

    // Ordem das faces: +X, -X, +Y, -Y, +Z, -Z
    return [sideMat, sideMat, topMat, bottomMat, sideMat, sideMat];
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);
    // Neblina ajuda a esconder o fim do mapa
    scene.fog = new THREE.FogExp2(0xbfd1e5, 0.02);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);

    // Iluminação que destaca as faces dos cubos
    const ambient = new THREE.AmbientLight(0xcccccc);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(100, 200, 100);
    scene.add(sun);

    renderer = new THREE.WebGLRenderer({ antialias: false }); // Antialias OFF para visual pixelado
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Chão com materiais de 6 faces
    const grassMats = getGrassMaterials();
    const geo = new THREE.BoxGeometry(1, 1, 1);

    for (let x = -15; x < 15; x++) {
        for (let z = -15; z < 15; z++) {
            const block = new THREE.Mesh(geo, grassMats);
            block.position.set(x, 0, z);
            scene.add(block);
            objects.push(block);
        }
    }

    // Controles (Reutilizando sua lógica de teclado)
    setupControls();
    animate();
}

function setupControls() {
    const onKeyDown = (e) => {
        switch (e.code) {
            case 'KeyW': moveF = true; break;
            case 'KeyS': moveB = true; break;
            case 'KeyA': moveL = true; break;
            case 'KeyD': moveR = true; break;
            case 'Space': if (canJump) velocity.y += 12; canJump = false; break;
        }
    };
    const onKeyUp = (e) => {
        switch (e.code) {
            case 'KeyW': moveF = false; break;
            case 'KeyS': moveB = false; break;
            case 'KeyA': moveL = false; break;
            case 'KeyD': moveR = false; break;
        }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement) {
            camera.rotation.y -= e.movementX * 0.002;
            camera.rotation.x -= e.movementY * 0.002;
            camera.rotation.x = Math.max(-1.5, Math.min(1.5, camera.rotation.x));
            camera.rotation.order = 'YXZ'; // Evita rotação estranha na câmera
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 30.0 * delta; // Gravidade mais forte

    direction.z = Number(moveF) - Number(moveB);
    direction.x = Number(moveR) - Number(moveL);
    direction.normalize();

    if (moveF || moveB) velocity.z -= direction.z * 150.0 * delta;
    if (moveL || moveR) velocity.x -= direction.x * 150.0 * delta;

    camera.translateX(-velocity.x * delta);
    camera.translateZ(-velocity.z * delta);
    camera.position.y += velocity.y * delta;

    if (camera.position.y < 2) {
        velocity.y = 0;
        camera.position.y = 2;
        canJump = true;
    }

    prevTime = time;
    renderer.render(scene, camera);
}

init();