let scene, camera, renderer, controls;
let objects = [];

init();
animate();

function init() {
    // Cena
    scene = new THREE.Scene();

    // Câmera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    
    // Renderizador
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Luz
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5,10,7.5);
    scene.add(light);

    // Controles FPS
    controls = new THREE.PointerLockControls(camera, document.body);
    document.body.addEventListener('click', () => controls.lock());

    // Chão
    const floorGeometry = new THREE.BoxGeometry(50, 1, 50);
    const floorMaterial = new THREE.MeshLambertMaterial({color: 0x228B22});
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.5;
    scene.add(floor);
    objects.push(floor);

    // Árvores simples
    createTree(3,0, -5);
    createTree(-4,0, -8);

    // Blocos interativos
    window.addEventListener('click', collectBlock);
}

// Função para criar árvores
function createTree(x, y, z){
    const trunkGeometry = new THREE.BoxGeometry(0.5,2,0.5);
    const trunkMaterial = new THREE.MeshLambertMaterial({color:0x8B4513});
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x,1,y);
    scene.add(trunk);
    objects.push(trunk);

    const leavesGeometry = new THREE.BoxGeometry(2,2,2);
    const leavesMaterial = new THREE.MeshLambertMaterial({color:0x00FF00});
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x,3,y);
    scene.add(leaves);
    objects.push(leaves);
}

// Coletar blocos
function collectBlock(event){
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({x:0,y:0}, camera);
    const intersects = raycaster.intersectObjects(objects);
    if(intersects.length > 0){
        const obj = intersects[0].object;
        scene.remove(obj);
        objects.splice(objects.indexOf(obj),1);
    }
}

// Animação
function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}