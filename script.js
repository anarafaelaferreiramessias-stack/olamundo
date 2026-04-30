let camera, scene, renderer, objects = [];
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, canJump = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();

// Configurações de Física
const PLAYER_HEIGHT = 1.8;
const PLAYER_SPEED = 50.0;
const GRAVITY = 18.0;
const FRICTION = 10.0;

function createPixelTexture(color1, color2) {
    const size = 16;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const context = canvas.getContext('2d');
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            context.fillStyle = Math.random() > 0.5 ? color1 : color2;
            context.fillRect(x, y, 1, 1);
        }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}

function iniciarJogo() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('crosshair').style.display = 'block';

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.015);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 10;

    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Luzes
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(10, 50, 10);
    scene.add(sun);

    // Materiais
    const matGrama = new THREE.MeshLambertMaterial({ map: createPixelTexture('#55902e', '#4a7d28') });
    const matTerra = new THREE.MeshLambertMaterial({ map: createPixelTexture('#8B4513', '#5D2906') });
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    // Mundo com relevo
    for (let x = -15; x < 15; x++) {
        for (let z = -15; z < 15; z++) {
            let h = Math.floor(Math.sin(x * 0.2) * 2 + Math.cos(z * 0.2) * 2);
            for(let y = h; y > h-2; y--) {
                const b = new THREE.Mesh(geometry, y === h ? matGrama : matTerra);
                b.position.set(x, y, z);
                scene.add(b);
                objects.push(b);
            }
        }
    }

    // Controles
    document.body.addEventListener('click', () => document.body.requestPointerLock());
    const onKey = (e, val) => {
        if(e.code === 'KeyW') moveForward = val;
        if(e.code === 'KeyS') moveBackward = val;
        if(e.code === 'KeyA') moveLeft = val;
        if(e.code === 'KeyD') moveRight = val;
        if(e.code === 'Space' && val && canJump) { velocity.y += 8; canJump = false; }
    };
    document.addEventListener('keydown', (e) => onKey(e, true));
    document.addEventListener('keyup', (e) => onKey(e, false));

    let yaw = 0, pitch = 0;
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === document.body) {
            yaw -= e.movementX * 0.002;
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
            camera.rotation.set(pitch, yaw, 0, 'YXZ');
        }
    });

    function animate() {
        requestAnimationFrame(animate);
        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        // Física de Atrito
        velocity.x -= velocity.x * FRICTION * delta;
        velocity.z -= velocity.z * FRICTION * delta;
        velocity.y -= GRAVITY * delta; // Gravidade constante

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir); camDir.y = 0; camDir.normalize();
        const camSide = new THREE.Vector3().crossVectors(camera.up, camDir).normalize();

        if (moveForward || moveBackward) velocity.addScaledVector(camDir, PLAYER_SPEED * delta * direction.z);
        if (moveLeft || moveRight) velocity.addScaledVector(camSide, PLAYER_SPEED * delta * direction.x);

        // --- SISTEMA DE COLISÃO ---
        // Salva posição anterior
        const oldPos = camera.position.clone();
        
        // Aplica movimento
        camera.position.x += velocity.x * delta;
        camera.position.z += velocity.z * delta;
        camera.position.y += velocity.y * delta;

        // Detecção de colisão com os blocos (Simplificada para desempenho)
        objects.forEach(obj => {
            const dx = Math.abs(camera.position.x - obj.position.x);
            const dz = Math.abs(camera.position.z - obj.position.z);
            const dy = camera.position.y - obj.position.y;

            // Se estiver dentro de um bloco
            if (dx < 0.7 && dz < 0.7 && dy > 0 && dy < 1.5) {
                camera.position.x = oldPos.x;
                camera.position.z = oldPos.z;
            }
        });

        // Chão e Pulo
        if (camera.position.y < PLAYER_HEIGHT + 1) { // Ajuste baseado no relevo
            velocity.y = Math.max(0, velocity.y);
            camera.position.y = PLAYER_HEIGHT + 1; // Simplificado: mantém no topo
            canJump = true;
        }

        // View Bobbing (Balanço da câmera ao andar)
        if (moveForward || moveBackward || moveLeft || moveRight) {
            const timer = Date.now() * 0.008;
            camera.position.y += Math.sin(timer) * 0.02;
        }

        renderer.render(scene, camera);
        prevTime = time;
    }
    animate();
}