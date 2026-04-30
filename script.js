// --- SISTEMA DE PARTÍCULAS (EFEITO DE QUEBRAR) ---
function criarParticulas(posicao, cor) {
    const contagem = 8;
    const particulas = [];
    const geoParticula = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const matParticula = new THREE.MeshLambertMaterial({ color: cor });

    for (let i = 0; i < contagem; i++) {
        const p = new THREE.Mesh(geoParticula, matParticula);
        p.position.copy(posicao);
        
        // Direção aleatória para a explosão
        p.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            Math.random() * 0.2,
            (Math.random() - 0.5) * 0.2
        );
        
        scene.add(p);
        particulas.push(p);
    }

    // Remove as partículas após 500ms
    setTimeout(() => {
        particulas.forEach(p => scene.remove(p));
    }, 500);

    // Função interna para animar as partículas
    const animarParticulas = () => {
        particulas.forEach(p => {
            p.position.add(p.userData.velocity);
            p.userData.velocity.y -= 0.01; // Gravidade nas partículas
        });
        if (particulas[0] && particulas[0].parent) requestAnimationFrame(animarParticulas);
    };
    animarParticulas();
}

// --- ATUALIZAÇÃO DO EVENTO DE CLIQUE (MOUSE DOWN) ---
window.addEventListener('mousedown', (e) => {
    if (document.pointerLockElement !== document.body) return;

    // 1. Aciona a animação da mão (aquela que já temos no CSS)
    const hand = document.getElementById('hand');
    hand.classList.remove('punching');
    void hand.offsetWidth; 
    hand.classList.add('punching');

    // 2. Lógica de Raycaster para detectar o bloco
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = ray.intersectObjects(objects);

    if (intersects.length > 0 && e.button === 0) {
        const bloco = intersects[0].object;
        const corBloco = bloco.material.color || 0x55902e;

        // Animação de "Encolher" antes de sumir
        let sc = 1.0;
        const encolher = setInterval(() => {
            sc -= 0.2;
            bloco.scale.set(sc, sc, sc);
            if (sc <= 0.2) {
                clearInterval(encolher);
                
                // Cria as partículas na posição do bloco
                criarParticulas(bloco.position, corBloco);
                
                // Remove o bloco de vez
                scene.remove(bloco);
                objects.splice(objects.indexOf(bloco), 1);
            }
        }, 20); // Faz o bloco sumir rapidinho em 100ms
    }
});