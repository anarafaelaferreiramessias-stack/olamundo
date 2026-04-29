function init() {
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x87CEEB);
            
            // Ajustamos o Fog: ele começa a 20 unidades e fica totalmente opaco aos 75
            // Isso esconde o "fim" do chão que agora vai até 50
            scene.fog = new THREE.Fog(0x87CEEB, 20, 75);

            camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
            camera.rotation.order = 'YXZ';

            renderer = new THREE.WebGLRenderer({ antialias: false });
            renderer.setSize(window.innerWidth, window.innerHeight);
            document.body.appendChild(renderer.domElement);
            raycaster = new THREE.Raycaster();

            scene.add(new THREE.AmbientLight(0xffffff, 0.8));

            // CHÃO AMPLIADO
            const matG = [
                new THREE.MeshLambertMaterial({map:texT}),
                new THREE.MeshLambertMaterial({map:texT}),
                new THREE.MeshLambertMaterial({map:texG}),
                new THREE.MeshLambertMaterial({map:texT}),
                new THREE.MeshLambertMaterial({map:texT}),
                new THREE.MeshLambertMaterial({map:texT})
            ];
            const geo = new THREE.BoxGeometry(1,1,1);

            // Aumentamos de -20/20 para -50/50 (Mundo 100x100 blocos)
            for(let x=-50; x<50; x++) {
                for(let z=-50; z<50; z++) {
                    const b = new THREE.Mesh(geo, matG);
                    b.position.set(x, 0, z);
                    scene.add(b);
                    objects.push(b);
                    
                    // Ajuste na probabilidade de árvores para não sobrecarregar
                    if(Math.random() > 0.99 && (x>5 || x<-5 || z>5 || z<-5)) {
                        spawnTree(x, 1, z);
                    }
                }
            }

            // Mão Animada
            handGroup = new THREE.Group();
            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.8), new THREE.MeshLambertMaterial({map: texSkin}));
            const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.4), new THREE.MeshLambertMaterial({map: texShirt}));
            sleeve.position.z = 0.2;
            handGroup.add(arm); handGroup.add(sleeve);
            scene.add(handGroup);

            setupListeners();
        }