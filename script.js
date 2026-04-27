// Importe o PointerLockControls se estiver usando módulos, 
// ou use a versão CDN como abaixo para facilitar o teste:
import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

let scene, camera, renderer, controls, raycaster;
let moveF = false, moveB = false, moveL = false, moveR = false, canJump = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let objects = []; // Lista para colisão e interação

const loader = new THREE.TextureLoader();

// --- TEXTURAS ---
const texGrass = loader.load('https://threejs.org/examples/textures/minecraft/atlas.png');
texGrass.magFilter = THREE.NearestFilter;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 0, 50);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Luzes
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(10, 20, 10);
    scene.add(sun);

    // Renderizador
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // --- CONTROLES FPS ---
    controls = new PointerLockControls(camera, document.body);
    
    document.addEventListener('click', () => controls.lock());
    scene.add(controls.getObject());

    const onKeyDown = (e) => {
        switch (e.code) {
            case 'KeyW': moveF = true; break;
            case 'KeyS': moveB = true; break;
            case 'KeyA': moveL = true; break;
            case 'KeyD': moveR = true; break;
            case 'Space': if (canJump) velocity.y += 10; canJump = false; break;
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

    // --- MUNDO (CHÃO DE BLOCOS) ---
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const grassMat = new THREE.MeshLambertMaterial({ map: texGrass });

    for (let x = -10; x < 10; x++) {
        for (let z = -10; z < 10; z++) {
            const block = new THREE.Mesh(boxGeo, grassMat);
            block.position.set(x, 0, z);
            scene.add(block);
            objects.push(block);
        }
    }

    // --- INTERAÇÃO (QUEBRAR/COLOCAR) ---
    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 4);
    
    document.addEventListener('mousedown', (e) => {
        if (!controls.isLocked) return;

        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(objects);

        if (intersects.length > 0) {
            const intersect = intersects[0];
            
            if (e.button === 0) { // Botão Esquerdo: QUEBRAR
                scene.remove(intersect.object);
                objects.splice(objects.indexOf(intersect.object), 1);
            } else if (e.button === 2) { // Botão Direito: COLOCAR
                const newBlock = new THREE.Mesh(boxGeo, grassMat);
                newBlock.position.copy(intersect.object.position).add(intersect.face.normal);
                scene.add(newBlock);
                objects.push(newBlock);
            }
        }
    });

    animate();
}

let prevTime = performance.now();
function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    if (controls.isLocked) {
        // Gravidade e Atrito
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 30.0 * delta; 

        direction.z = Number(moveF) - Number(moveB);
        direction.x = Number(moveR) - Number(moveL);
        direction.normalize();

        if (moveF || moveB) velocity.z -= direction.z * 100.0 * delta;
        if (moveL || moveR) velocity.x -= direction.x * 100.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        controls.getObject().position.y += velocity.y * delta;

        // Colisão simples com o "chão" zero
        if (controls.getObject().position.y < 1.5) {
            velocity.y = 0;
            controls.getObject().position.y = 1.5;
            canJump = true;
        }
    }

    prevTime = time;
    renderer.render(scene, camera);
}

init();