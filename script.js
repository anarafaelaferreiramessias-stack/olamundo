// Variáveis Globais de Controle
let camera, scene, renderer, moveForward = false, moveBackward = false, 
    moveLeft = false, moveRight = false, canJump = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();

function iniciarJogo() {
    // 1. Limpar Interface
    document.getElementById('menu').style.display = 'none';

    // 2. Cena e Câmera (Perspectiva de primeira pessoa)
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Céu azul
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.015); // Neblina de distância

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 2; // Altura dos olhos do "Steve"

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 3. Luzes (Para dar volume aos blocos)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(10, 20, 10);
    scene.add(sunLight);

    // 4. Criação do Mundo (Chão de Blocos)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const materialGrama = new THREE.MeshLambertMaterial({ color: 0x55902e });

    for (let x = -20; x < 20; x++) {
        for (let z = -20; z < 20; z++) {
            const bloco = new THREE.Mesh(geometry, materialGrama);
            bloco.position.set(x, 0, z);
            
            // Adiciona aquela bordinha preta clássica
            const edges = new THREE.EdgesGeometry(geometry);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.1 }));
            bloco.add(line);
            scene.add(bloco);
        }
    }

    // 5. Controles de Teclado
    const onKeyDown = (event) => {
        switch (event.code) {
            case 'KeyW': moveForward = true; break;
            case 'KeyA': moveLeft = true; break;
            case 'KeyS': moveBackward = true; break;
            case 'KeyD': moveRight = true; break;
            case 'Space': if (canJump === true) velocity.y += 5; canJump = false; break;
        }
    };
    const onKeyUp = (event) => {
        switch (event.code) {
            case 'KeyW': moveForward = false; break;
            case 'KeyA': moveLeft = false; break;
            case 'KeyS': moveBackward = false; break;
            case 'KeyD': moveRight = false; break;
        }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // 6. Controle do Mouse (Girar a cabeça)
    let yaw = 0, pitch = 0;
    document.addEventListener('mousemove', (event) => {
        if (document.pointerLockElement === document.body) {
            yaw -= event.movementX * 0.002;
            pitch -= event.movementY * 0.002;
            pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
            camera.rotation.set(pitch, yaw, 0, 'YXZ');
        }
    });

    // Clicar na tela trava o mouse para jogar
    document.body.addEventListener('click', () => {
        document.body.requestPointerLock();
    });

    // 7. Loop de Animação e Física
    function animate() {
        requestAnimationFrame(animate);

        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        // Fricção (faz o personagem parar aos poucos)
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 1.5 * delta; // Gravidade

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        // Movimento relativo à direção da câmera
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        camDir.y = 0; camDir.normalize();
        const camSide = new THREE.Vector3().crossVectors(camera.up, camDir).normalize();

        if (moveForward || moveBackward) velocity.addScaledVector(camDir, 40 * delta * direction.z);
        if (moveLeft || moveRight) velocity.addScaledVector(camSide, 40 * delta * direction.x);

        camera.position.x += velocity.x * delta;
        camera.position.y += velocity.y * delta;
        camera.position.z += velocity.z * delta;

        // Chão (Colisão básica)
        if (camera.position.y < 2) {
            velocity.y = 0;
            camera.position.y = 2;
            canJump = true;
        }

        renderer.render(scene, camera);
        prevTime = time;
    }

    animate();
}