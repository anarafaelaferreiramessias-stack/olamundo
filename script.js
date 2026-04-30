function initGame() {
    // 1. LIMPEZA DO MENU
    // Esconde o menu e mostra a área onde o jogo será renderizado
    document.getElementById('menu').style.display = 'none';
    const container = document.getElementById('game-container');
    container.style.display = 'block';

    // 2. CONFIGURAÇÃO DA CENA
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Cor do céu (Sky Blue)

    // 3. CÂMERA
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(10, 10, 20); // Posição inicial da câmera

    // 4. RENDERIZADOR (O "Motor" que desenha na tela)
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 5. ILUMINAÇÃO (Sem isso os blocos ficam pretos)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Luz suave em todo lugar
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8); // Luz do "Sol"
    sunLight.position.set(5, 15, 10);
    scene.add(sunLight);

    // 6. CRIAÇÃO DOS BLOCOS
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    
    function createBlock(x, y, z) {
        // Material verde (grama)
        const material = new THREE.MeshLambertMaterial({ color: 0x55902e });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(x, y, z);
        
        // Adiciona contorno preto nos blocos (estilo Minecraft)
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
        cube.add(line);
        
        scene.add(cube);
    }

    // Gerando um terreno de 20x20 blocos
    for(let x = -10; x < 10; x++) {
        for(let z = -10; z < 10; z++) {
            // Cria um chão básico
            createBlock(x, 0, z);
            
            // Adiciona alguns blocos aleatórios para parecer relevo
            if(Math.random() > 0.9) {
                createBlock(x, 1, z);
            }
        }
    }

    camera.lookAt(0, 0, 0);

    // 7. LOOP DE ANIMAÇÃO (Mantém o jogo rodando)
    function animate() {
        requestAnimationFrame(animate);
        
        // Faz o mundo girar um pouquinho para você ver que é 3D
        scene.rotation.y += 0.003;
        
        renderer.render(scene, camera);
    }
    
    animate();

    // Ajusta o tamanho se você redimensionar a janela do navegador
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}