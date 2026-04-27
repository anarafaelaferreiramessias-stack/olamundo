/* 
   Lógica do Jogo: Mundo de Blocos 3D
   - Sistema de Quebrar e Colocar blocos
   - Física de Gravidade e Colisão simples
*/

let cena, camera, renderizador, controles;
let moverFrente = false, moverTras = false, moverEsquerda = false, moverDireita = false;
let podePular = false, correndo = false;
let velocidade = new THREE.Vector3();
let direcao = new THREE.Vector3();
let blocos = []; // Lista para colisão e interação

function comecar() {
    document.getElementById('tela-inicial').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('tela-inicial').style.display = 'none';
        document.getElementById('instrucoes').style.display = 'block';
    }, 800);

    inicializar3D();
}

function inicializar3D() {
    // 1. Cena e Camera
    cena = new THREE.Scene();
    cena.background = new THREE.Color(0x87CEEB); // Cor do céu
    cena.fog = new THREE.Fog(0x87CEEB, 0, 100);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // 2. Renderizador
    renderizador = new THREE.WebGLRenderer({ antialias: true });
    renderizador.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderizador.domElement);

    // 3. Luzes
    const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.6);
    cena.add(luzAmbiente);
    const luzSol = new THREE.DirectionalLight(0xffffff, 0.8);
    luzSol.position.set(10, 20, 10);
    cena.add(luzSol);

    // 4. Criar o Chão (Mundo de blocos inicial)
    const tamanho = 20;
    for (let x = -tamanho/2; x < tamanho/2; x++) {
        for (let z = -tamanho/2; z < tamanho/2; z++) {
            criarBloco(x, 0, z, 'grama');
        }
    }

    // 5. Eventos de Controles
    document.addEventListener('keydown', (e) => tratarTeclado(e.code, true));
    document.addEventListener('keyup', (e) => tratarTeclado(e.code, false));
    
    // Travar mouse ao clicar
    document.body.addEventListener('click', () => {
        document.body.requestPointerLock();
    });

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === document.body) {
            camera.rotation.y -= e.movementX * 0.002;
            camera.rotation.x -= e.movementY * 0.002;
            camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
        }
    });

    // Clique para quebrar/colocar
    document.addEventListener('mousedown', interagirComBlocos);

    camera.position.y = 2; // Altura inicial do personagem
    camera.rotation.order = "YXZ"; // Ordem de rotação correta para FPS

    animar();
}

function criarBloco(x, y, z, tipo) {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    let cor = tipo === 'grama' ? 0x55aa55 : 0x8b4513;
    const mat = new THREE.MeshLambertMaterial({ color: cor });
    const bloco = new THREE.Mesh(geo, mat);
    bloco.position.set(x, y, z);
    cena.add(bloco);
    blocos.push(bloco);
}

function interagirComBlocos(e) {
    if (document.pointerLockElement !== document.body) return;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(blocos);

    if (intersects.length > 0 && intersects[0].distance < 5) {
        const obj = intersects[0].object;

        if (e.button === 0) { // Clique Esquerdo: Quebrar
            cena.remove(obj);
            blocos = blocos.filter(b => b !== obj);
        } else if (e.button === 2) { // Clique Direito: Colocar
            const normal = intersects[0].face.normal;
            const pos = obj.position.clone().add(normal);
            criarBloco(pos.x, pos.y, pos.z, 'terra');
        }
    }
}

function tratarTeclado(code, status) {
    if (code === 'KeyW') moverFrente = status;
    if (code === 'KeyS') moverTras = status;
    if (code === 'KeyA') moverEsquerda = status;
    if (code === 'KeyD') moverDireita = status;
    if (code === 'Space' && status && podePular) {
        velocidade.y += 10;
        podePular = false;
    }
    if (code === 'ShiftLeft') correndo = status;
}

function animar() {
    requestAnimationFrame(animar);

    const delta = 0.15;
    const multVel = correndo ? 1.5 : 1.0;

    // Física de Movimento
    velocity_logic: {
        velocidade.x -= velocidade.x * 10.0 * delta;
        velocidade.z -= velocidade.z * 10.0 * delta;
        velocidade.y -= 9.8 * 3.0 * delta; // Gravidade

        direcao.z = Number(moverFrente) - Number(moverTras);
        direcao.x = Number(moverDireita) - Number(moverEsquerda);
        direcao.normalize();

        if (moverFrente || moverTras) velocidade.z -= direcao.z * 400.0 * delta * multVel;
        if (moverEsquerda || moverDireita) velocidade.x -= direcao.x * 400.0 * delta * multVel;

        camera.translateX(-velocidade.x * delta / 100);
        camera.translateZ(velocidade.z * delta / 100);
        camera.position.y += (velocidade.y * delta / 60);

        // Chão Simples (Prevenir cair no infinito)
        if (camera.position.y < 1.8) {
            velocidade.y = 0;
            camera.position.y = 1.8;
            podePular = true;
        }
    }

    renderizador.render(cena, camera);
}

// Bloquear menu de contexto do clique direito
document.addEventListener('contextmenu', e => e.preventDefault());