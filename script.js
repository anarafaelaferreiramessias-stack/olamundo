// 1. Variáveis Globais
let scene, camera, renderer, raycaster, hand, handItem, ground;
let moveF = false, moveB = false, moveL = false, moveR = false, canJump = false;
let velocity = new THREE.Vector3(), direction = new THREE.Vector3();
let targetRotation = new THREE.Euler(0, 0, 0, 'YXZ');
let prevTime = performance.now();
let blocks = [], drops = [], clouds = []; 
let inventoryWood = 0, selectedSlot = 0;
let isMining = false, miningTime = 0, currentTarget = null;

// 2. Carregamento de Texturas
const loader = new THREE.TextureLoader();
const woodTex = loader.load('https://threejs.org/examples/textures/crate.gif');
const grassTex = loader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
const leafTex = loader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
const cloudTex = loader.load('https://i.imgur.com/8pSInmI.png'); // Textura de nuvem estilo pixel

// 3. Funções de Início
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
    
    camera = new THREE.