// --- CONFIGURAÇÕES TÉCNICAS ---
let camera, scene, renderer, raycaster;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, canJump = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();
const objects = []; // Lista de blocos que podem ser interagidos

function iniciarJogo() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('crosshair').style.display = 'block';

    // 1. CENA E CÂMERA
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.01);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 10; // Começa um pouco alto

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);

    // 2. MATERIAIS
    const loader = new THREE.TextureLoader();
    const materialGrama = new THREE.MeshLambertMaterial({ color: 0x55902e });
    const materialTronco = new THREE.MeshLambertMaterial({ color: 0x614126 });
    const materialFolha = new THREE.MeshLambertMaterial({ color: 0x2d5a27 });

    // 3. GERAR MUNDO (RELEVO E ÁRVORES)
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    for (let x = -20; x < 20; x++) {
        for (let z = -20; z < 20; z++) {
            // Criar relevo usando Math.sin para fazer "ondas" de terra
            let h = Math.floor(Math.sin(x * 0.2) * 2 + Math.cos(z * 0.2) * 2);
            
            const bloco = new THREE.Mesh(geometry, materialGrama);
            bloco.position.set(x, h, z);
            scene.add(bloco);
            objects.push(bloco);

            // Chance de nascer uma árvore
            if (Math.random() > 0.98 && x % 5 === 0) {
                criarArvore(x, h + 1, z);
            }
        }
    }

    function criarArvore(x, y, z) {
        // Tronco (3 blocos de altura)
        for (let i = 0; i < 3; i++) {
            const tronco = new THREE.Mesh(geometry, materialTronco);
            tronco.position.set(x, y + i, z);
            scene.add(tronco);
            objects.push(tronco);
        }
        // Folhas
        for (let ix = -1; ix <= 1; ix++) {
            for (let iy = 3; iy <= 4; iy++) {
                for (let iz = -1; iz <= 1; iz++) {
                    const folha = new THREE.Mesh(geometry, materialFolha);
                    folha.position.set(x + ix, y + iy, z + iz);
                    scene.add(folha);
                    objects.push(folha);
                }
            }
        }
    }

    // 4. SISTEMA DE QUEBRAR/COLOCAR BLOCOS
    window.addEventListener('mousedown', (event) => {
        if (document.pointerLockElement !== document.body) return;

        const mouseRaycaster = new THREE.Raycaster();
        mouseRaycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = mouseRaycaster.intersectObjects(objects);

        if (intersects.length > 0) {
            const intersect = intersects[0];

            if (event.button === 0) { // Botão Esquerdo: QUEBRAR
                scene.remove(intersect.object);
                objects.splice(objects.indexOf(intersect.object), 1);
            } 
            else if (event.button === 2) { // Botão Direito: COLOCAR
                const newBlock = new THREE.Mesh(geometry, materialGrama);
                newBlock.position.copy(intersect.object.position).add(intersect.face.normal);
                scene.add(newBlock);
                objects.push(newBlock);
            }
        }
    });

    // Bloqueia o menu de contexto do botão direito
    window.addEventListener('contextmenu', e => e.preventDefault());

    // 5. CONTROLES (WASD + MOUSE)
    document.body.addEventListener('click', () => document.body.requestPointerLock());
    
    const onKeyDown = (e) => {
        if (e.code === 'KeyW') moveForward = true;
        if (e.code === 'KeyS') moveBackward = true;
        if (e.code === 'KeyA') moveLeft = true;
        if (e.code === 'KeyD') moveRight = true;
        if (e.code === 'Space' && canJump) { velocity.y += 5; canJump = false; }
    };
    const onKeyUp = (e) => {
        if (e.code === 'KeyW') moveForward = false;
        if (e.code === 'KeyS') moveBackward = false;
        if (e.code === 'KeyA') moveLeft = false;
        if (e.code === 'KeyD') moveRight = false;
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    let yaw = 0, pitch = 0;
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === document.body) {
            yaw -= e.movementX * 0.002;
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
            camera.rotation.set(pitch, yaw, 0, 'YXZ');
        }
    });

    // 6. LUZES
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(10, 20, 10);
    scene.add(sun);

    // 7. LOOP DE ANIMAÇÃO
    function animate() {
        requestAnimationFrame(animate);
        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 1.5 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        camDir.y = 0; camDir.normalize();
        const camSide = new THREE.Vector3().crossVectors(camera.up, camDir).normalize();

        if (moveForward || moveBackward) velocity.addScaledVector(camDir, 50 * delta * direction.z);
        if (moveLeft || moveRight) velocity.addScaledVector(camSide, 50 * delta * direction.x);

        camera.position.x += velocity.x * delta;
        camera.position.y += velocity.y * delta;
        camera.position.z += velocity.z * delta;

        // Colisão com o chão dinâmico
        if (camera.position.y < 3) {
            velocity.y = 0;
            camera.position.y = 3;
            canJump = true;
        }

        renderer.render(scene, camera);
        prevTime = time;
    }
    animate();
}