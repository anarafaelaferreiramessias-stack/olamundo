// game.js - A Lógica do Jogo
let scene, camera, renderer, objects = [], raycaster;
let moveF = false, moveB = false, moveL = false, moveR = false, canJump = false;
let velocity = new THREE.Vector3(), direction = new THREE.Vector3();
let selected = 1, handGroup, swing = false, swingTime = 0;
let mouseSwayX = 0, mouseSwayY = 0;

// 1. GERADOR DE TEXTURAS (Grama, Terra, Madeira, etc)
function createPixelTex(c1, c2) {
    const canvas = document.createElement('canvas');
    canvas.width = 16; canvas.height = 16;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = c1; ctx.fillRect(0,0,16,16);
    for(let i=0; i<40; i++) { 
        ctx.fillStyle = c2; 
        ctx.fillRect(Math.floor(Math.random()*16), Math.floor(Math.random()*16), 1, 1); 
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    return tex;
}

const texG = createPixelTex('#5fa03d', '#4a7d31'); // Grama
const texT = createPixelTex('#79553a', '#5d3f2a'); // Terra
const texM = createPixelTex('#5d3f2a', '#3d291b'); // Madeira
const texF = createPixelTex('#3a6324', '#2d4d1c'); // Folha
const texSkin = createPixelTex('#d8bb9d', '#c2a385'); // Pele
const texShirt = createPixelTex('#008b8b', '#007070'); // Camisa

// 2. FUNÇÃO QUE O BOTÃO DO HTML CHAMA
function start() {
    document.getElementById('overlay').style.display = 'none'; // Esconde o menu
    init(); // Cria o mundo
    animate(); // Começa a rodar os frames
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 20, 75); // Neblina para o fim do mundo

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.rotation.order = 'YXZ';

    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    raycaster = new THREE.Raycaster();

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    // CRIANDO O CHÃO
    const matG = [
        new THREE.MeshLambertMaterial({map:texT}), new THREE.MeshLambertMaterial({map:texT}),
        new THREE.MeshLambertMaterial({map:texG}), new THREE.MeshLambertMaterial({map:texT}),
        new THREE.MeshLambertMaterial({map:texT}), new THREE.MeshLambertMaterial({map:texT})
    ];
    const geo = new THREE.BoxGeometry(1,1,1);

    for(let x=-40; x<40; x++) {
        for(let z=-40; z<40; z++) {
            const b = new THREE.Mesh(geo, matG);
            b.position.set(x, 0, z);
            scene.add(b);
            objects.push(b);
            // Árvores aleatórias
            if(Math.random() > 0.99 && (Math.abs(x)>5 || Math.abs(z)>5)) spawnTree(x, 1, z);
        }
    }

    // BRAÇO DO PERSONAGEM
    handGroup = new THREE.Group();
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.8), new THREE.MeshLambertMaterial({map: texSkin}));
    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.4), new THREE.MeshLambertMaterial({map: texShirt}));
    sleeve.position.z = 0.2;
    handGroup.add(arm); handGroup.add(sleeve);
    scene.add(handGroup);

    setupListeners();
}

function spawnTree(x,y,z) {
    const matM = new THREE.MeshLambertMaterial({map:texM});
    const matF = new THREE.MeshLambertMaterial({map:texF});
    for(let i=0; i<4; i++) {
        const t = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), matM); 
        t.position.set(x,y+i,z);
        scene.add(t); objects.push(t);
    }
    for(let ox=-1; ox<=1; ox++) {
        for(let oz=-1; oz<=1; oz++) {
            const f = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), matF); 
            f.position.set(x+ox,y+4,z+oz);
            scene.add(f); objects.push(f);
        }
    }
}

function setupListeners() {
    // Teclado
    document.addEventListener('keydown', e => {
        if(e.code=='KeyW') moveF=true; if(e.code=='KeyS') moveB=true;
        if(e.code=='KeyA') moveL=true; if(e.code=='KeyD') moveR=true;
        if(e.code=='Space' && canJump) { velocity.y += 0.15; canJump = false; }
        if(['1','2','3'].includes(e.key)) {
            selected = e.key;
            document.querySelectorAll('.slot').forEach(s => s.classList.remove('active'));
            document.getElementById('s'+e.key).classList.add('active');
        }
    });
    document.addEventListener('keyup', e => {
        if(e.code=='KeyW') moveF=false; if(e.code=='KeyS') moveB=false;
        if(e.code=='KeyA') moveL=false; if(e.code=='KeyD') moveR=false;
    });

    // Mouse e Clique
    document.addEventListener('mousemove', e => {
        if(document.pointerLockElement) {
            camera.rotation.y -= e.movementX * 0.002;
            camera.rotation.x -= e.movementY * 0.002;
            camera.rotation.x = Math.max(-1.5, Math.min(1.5, camera.rotation.x));
            mouseSwayX = e.movementX * 0.01;
            mouseSwayY = e.movementY * 0.01;
        }
    });

    document.addEventListener('mousedown', e => {
        if(!document.pointerLockElement) { document.body.requestPointerLock(); return; }
        swing = true;
        raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
        const hits = raycaster.intersectObjects(objects);
        if(hits.length > 0 && hits[0].distance < 5) {
            if(e.button === 0) { // Botão Esquerdo: Quebra
                scene.remove(hits[0].object);
                objects = objects.filter(o => o !== hits[0].object);
            } else if(e.button === 2) { // Botão Direito: Coloca
                const pos = hits[0].point.add(hits[0].face.normal.clone().multiplyScalar(0.5));
                const mat = selected==1? [new THREE.MeshLambertMaterial({map:texT}),new THREE.MeshLambertMaterial({map:texT}),new THREE.MeshLambertMaterial({map:texG}),new THREE.MeshLambertMaterial({map:texT}),new THREE.MeshLambertMaterial({map:texT}),new THREE.MeshLambertMaterial({map:texT})] : (selected==2?new THREE.MeshLambertMaterial({map:texM}):new THREE.MeshLambertMaterial({map:texF}));
                const b = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), mat);
                b.position.set(Math.round(pos.x), Math.round(pos.y), Math.round(pos.z));
                scene.add(b); objects.push(b);
            }
        }
    });
    window.oncontextmenu = (e) => e.preventDefault();
}

function animate() {
    requestAnimationFrame(animate);
    const time = Date.now() * 0.005;
    const prev = camera.position.clone();

    // Física e Movimento (Andar normal, sem correr)
    velocity.x -= velocity.x * 0.1; velocity.z -= velocity.z * 0.1; velocity.y -= 0.01;
    direction.z = Number(moveF) - Number(moveB);
    direction.x = Number(moveR) - Number(moveL);
    direction.normalize();

    if (moveF || moveB) velocity.z -= direction.z * 0.035;
    if (moveL || moveR) velocity.x -= direction.x * 0.035;

    camera.translateX(-velocity.x); camera.translateZ(velocity.z);

    // Colisão simples
    for(let o of objects) {
        if(camera.position.distanceTo(o.position) < 0.8 && Math.abs(camera.position.y - o.position.y) < 1) {
            camera.position.x = prev.x; camera.position.z = prev.z;
        }
    }

    camera.position.y += velocity.y;
    if(camera.position.y < 1.6) { velocity.y = 0; camera.position.y = 1.6; canJump = true; }

    // Animação do Braço
    if(handGroup) {
        handGroup.position.copy(camera.position);
        handGroup.rotation.copy(camera.rotation);
        let isMoving = (moveF || moveB || moveL || moveR);
        let bobX = isMoving ? Math.cos(time) * 0.04 : 0;
        let bobY = isMoving ? Math.sin(time * 2) * 0.02 : 0;
        let sZ = 0;
        if(swing) {
            swingTime += 0.15;
            sZ = Math.sin(swingTime) * 0.4;
            if(swingTime >= Math.PI) { swingTime = 0; swing = false; }
        }
        handGroup.translateX(0.5 + bobX - (mouseSwayX * 0.2));
        handGroup.translateY(-0.4 + bobY + (mouseSwayY * 0.2));
        handGroup.translateZ(-0.7 - sZ);
        handGroup.rotation.x -= sZ * 1.5;
        mouseSwayX *= 0.9; mouseSwayY *= 0.9;
    }
    renderer.render(scene, camera);
}