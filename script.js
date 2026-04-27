let scene, camera, renderer, moveForward, moveBackward, moveLeft, moveRight, canJump;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let objects = [];

function inicializar3D() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 0, 50);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.rotation.order = 'YXZ';

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 1);
    scene.add(light);

    // --- CHÃO COM TEXTURA DE GRAMA ---
    const loader = new THREE.TextureLoader();
    // Usando uma textura de grama pixelada estilo Minecraft
    const grassTexture = loader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(25, 25); // Repete a textura para não ficar esticada

    const floorGeo = new THREE.PlaneGeometry(100, 100);
    const floorMat = new THREE.MeshLambertMaterial({ map: grassTexture });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // --- GERAR ALGUNS BLOCOS 3D NO CENÁRIO ---
    for (let i = 0; i < 30; i++) {
        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
        const box = new THREE.Mesh(geo, mat);
        box.position.set(Math.floor(Math.random() * 20 - 10), 0.5, Math.floor(Math.random() * 20 - 10));
        scene.add(box);
        objects.push(box);
    }

    // Controles
    document.addEventListener('keydown', (e) => handleKeys(e.code, true));
    document.addEventListener('keyup', (e) => handleKeys(e.code, false));
    document.addEventListener('click', () => document.body.requestPointerLock());
    
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === document.body) {
            camera.rotation.y -= e.movementX * 0.002;
            camera.rotation.x -= e.movementY * 0.002;
            camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
        }
    });

    animate();
}

function handleKeys(code, isPressed) {
    if (code === 'KeyW') moveForward = isPressed;
    if (code === 'KeyS') moveBackward = isPressed;
    if (code === 'KeyA') moveLeft = isPressed;
    if (code === 'KeyD') moveRight = isPressed;
    if (code === 'Space' && isPressed && canJump) { velocity.y += 10; canJump = false; }
}

function animate() {
    requestAnimationFrame(animate);

    const delta = 0.1;
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 2.5 * delta; // Gravidade

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    camera.translateX(-velocity.x * delta);
    camera.translateZ(velocity.z * delta);
    camera.position.y += (velocity.y * delta);

    if (camera.position.y < 1.6) {
        velocity.y = 0;
        camera.position.y = 1.6;
        canJump = true;
    }

    renderer.render(scene, camera);
}