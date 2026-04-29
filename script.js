let scene, camera, renderer, controls;
let objects = [];

init();
animate();

function init() {
    // Cena
    scene = new THREE.Scene();

    // Câmera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 2; // altura do olho
    camera.position.z = 5;

    // Renderizador
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Luz
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7.5);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // Controles FPS
    controls = new THREE.PointerLockControls(camera, renderer.domElement);
    document.body.addEventListener('click', () => controls.lock());

    // Chão
    const floorGeometry = new THREE.BoxGeometry(50, 1, 50);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.5;
    scene.add(floor);
    objects.push(floor);

    // Árvores simples
    createTree(3, 0, -5);
    createTree(-4, 0, -8);

    // Movimentação com teclado
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Blocos interativos
    window.addEventListener('mousedown', collectBlock);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Função para criar árvores
function createTree(x, y, z) {
    const trunkGeometry = new THREE.BoxGeometry(0.5, 2, 0.5);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 1, z);
    scene.add(trunk);
    objects.push(trunk);

    const leavesGeometry = new THREE.BoxGeometry(2, 2, 2);
    const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x00FF00 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, 3, z);
    scene.add(leaves);
    objects.push(leaves);
}

// Movimentação básica
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();

function onKeyDown(event) {
    switch (event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyD': moveRight = true; break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyD': moveRight = false; break;
    }
}

// Coletar blocos
function collectBlock(event) {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    const intersects = raycaster.intersectObjects(objects);
    if (intersects.length > 0) {
        const obj = intersects[0].object;
        scene.remove(obj);
        objects.splice(objects.indexOf(obj), 1);
    }
}

// Animação
function animate() {
    requestAnimationFrame(animate);

    // Movimento FPS
    const speed = 0.1;
    velocity.set(0, 0, 0);
    if (moveForward) velocity.z -= speed;
    if (moveBackward) velocity.z += speed;
    if (moveLeft) velocity.x -= speed;
    if (moveRight) velocity.x += speed;

    controls.moveRight(velocity.x);
    controls.moveForward(velocity.z);

    renderer.render(scene, camera);
}