function startGame() {
    // Esconde o menu
    document.getElementById('menu').style.display = 'none';

    // 1. Configuração Básica (Cena, Câmera, Renderizador)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Cor do céu
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    // 2. Luz
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7.5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    // 3. Criando o Mundo (Vários blocos)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    
    // Função para criar bloco com cor de grama
    function createBlock(x, y, z) {
        const material = new THREE.MeshLambertMaterial({ color: 0x4d9024 });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(x, y, z);
        
        // Adiciona uma borda preta para parecer mais com Minecraft
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
        cube.add(line);
        
        scene.add(cube);
    }

    // Gerar um "chão" de 10x10
    for(let x = -5; x < 5; x++) {
        for(let z = -5; z < 5; z++) {
            createBlock(x, 0, z);
        }
    }

    camera.position.z = 8;
    camera.position.y = 5;
    camera.lookAt(0, 0, 0);

    // 4. Animação e Controles Simples
    function animate() {
        requestAnimationFrame(animate);
        
        // Pequena rotação para dar efeito visual
        scene.rotation.y += 0.005;
        
        renderer.render(scene, camera);
    }
    animate();

    // Ajustar tela ao redimensionar
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}