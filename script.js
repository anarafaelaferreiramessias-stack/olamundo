// Setup da cena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

// Câmera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(5, 5, 5);

// Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game-container').appendChild(renderer.domElement);

// Luz
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);

// Controle de blocos
const blocks = [];
const blockSize = 1;

// Função para criar blocos
function createBlock(x, y, z, color = 0x00ff00) {
    const geometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
    const material = new THREE.MeshStandardMaterial({ color });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(x, y, z);
    scene.add(cube);
    blocks.push(cube);
}

// Criando um chão inicial
for (let x = 0; x < 10; x++) {
    for (let z = 0; z < 10; z++) {
        createBlock(x, 0, z, 0x8B4513); // bloco de terra
    }
}

// Controle de câmera com teclado
const keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function moveCamera() {
    const speed = 0.2;
    if (keys['w']) camera.position.z -= speed;
    if (keys['s']) camera.position.z += speed;
    if (keys['a']) camera.position.x -= speed;
    if (keys['d']) camera.position.x += speed;
}

// Loop de animação
function animate() {
    requestAnimationFrame(animate);
    moveCamera();
    renderer.render(scene, camera);
}

animate();