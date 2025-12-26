// Claude-Craft 3D Viewer - FIXED VERSION
class Viewer3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.currentObject = null;
        this.animations = [];
        this.initialized = false;
        
        // Warte bis DOM bereit ist
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            // DOM ist schon bereit
            setTimeout(() => this.init(), 100);
        }
    }

    init() {
        console.log('🎮 Initialisiere 3D-Viewer...');
        
        const container = document.getElementById('3d-viewer');
        if (!container) {
            console.error('❌ 3D-Viewer Container nicht gefunden!');
            setTimeout(() => this.init(), 500); // Versuche es nochmal
            return;
        }
        
        // Setze explizite Größe
        container.style.width = '100%';
        container.style.height = '400px';
        container.style.position = 'relative';
        
        const width = container.clientWidth || 600;
        const height = container.clientHeight || 400;
        
        console.log(`📐 Container Größe: ${width}x${height}`);

        // Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xe3f2fd);
        
        // Camera Setup
        this.camera = new THREE.PerspectiveCamera(
            75, width / height, 0.1, 1000
        );
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);

        // Renderer Setup
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(width, height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;        
        // Füge Renderer zum Container hinzu
        container.innerHTML = ''; // Leere Container erst
        container.appendChild(this.renderer.domElement);
        console.log('✅ Renderer hinzugefügt');

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Grid Helper
        const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0xcccccc);
        this.scene.add(gridHelper);

        // Axes Helper (zum Debuggen)
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);

        // Mouse Controls
        this.setupControls();
        
        this.initialized = true;
        console.log('✅ 3D-Viewer initialisiert!');

        // Start Animation Loop
        this.animate();
        
        // Erstelle Test-Block zur Demonstration
        setTimeout(() => {
            console.log('🎮 Erstelle Demo-Block...');
            this.createBlock({ 
                name: 'Demo-Block',
                texture: 'stone',
                size: 1
            });
        }, 500);
    }

    setupControls() {
        let mouseX = 0, mouseY = 0;
        
        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX - window.innerWidth / 2) / 100;
            mouseY = (event.clientY - window.innerHeight / 2) / 100;
        });

        this.updateCamera = () => {
            this.camera.position.x = 5 + mouseX * 0.5;
            this.camera.position.y = 5 + mouseY * 0.5;
            this.camera.lookAt(0, 0, 0);
        };
    }
    createBlock(properties = {}) {
        console.log('📦 Erstelle Block mit Properties:', properties);
        
        if (!this.initialized) {
            console.error('❌ 3D-Viewer noch nicht initialisiert!');
            return;
        }
        
        // Remove existing object
        if (this.currentObject) {
            this.scene.remove(this.currentObject);
            console.log('🗑️ Altes Objekt entfernt');
        }

        // Create geometry with size
        const size = properties.size || 1;
        const geometry = new THREE.BoxGeometry(2 * size, 2 * size, 2 * size);
        
        // Create material
        let material;
        if (properties.color) {
            // Verwende Farbe
            material = new THREE.MeshPhongMaterial({
                color: new THREE.Color(properties.color),
                transparent: properties.transparent || false,
                opacity: properties.transparent ? 0.7 : 1.0
            });
            console.log(`🎨 Farbe: ${properties.color}`);
        } else if (properties.texture) {
            // Verwende Textur (vereinfacht)
            const colors = {
                'stone': 0x888888,
                'wood': 0x8B4513,
                'grass': 0x7CFC00,
                'diamond': 0x00FFFF,
                'glass': 0xADD8E6
            };
            material = new THREE.MeshPhongMaterial({
                color: colors[properties.texture] || 0x4facfe,
                transparent: properties.transparent || false,
                opacity: properties.transparent ? 0.7 : 1.0
            });
            console.log(`🎨 Textur: ${properties.texture}`);
        } else {
            // Standard Material
            material = new THREE.MeshPhongMaterial({
                color: 0x4facfe,
                transparent: false,
                opacity: 1.0
            });
        }
        
        // Leuchten?
        if (properties.luminance && properties.luminance > 0) {
            material.emissive = new THREE.Color(0xffff00);
            material.emissiveIntensity = properties.luminance / 15;
            console.log(`💡 Leuchtkraft: ${properties.luminance}`);
        }

        // Create mesh
        this.currentObject = new THREE.Mesh(geometry, material);
        this.currentObject.position.y = 1;
        this.currentObject.castShadow = true;
        this.currentObject.receiveShadow = true;
        
        // Add to scene
        this.scene.add(this.currentObject);
        console.log('✅ Block zur Szene hinzugefügt!');
        
        // Update info
        const infoElement = document.getElementById('object-info');
        if (infoElement) {
            infoElement.textContent = `Block: ${properties.name || 'CustomBlock'}`;
        }
        
        // Render einmal manuell
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    createItem(properties = {}) {
        console.log('⚔️ Erstelle Item:', properties);
        
        if (!this.initialized) {
            console.error('❌ 3D-Viewer noch nicht initialisiert!');
            return;
        }
        
        if (this.currentObject) {
            this.scene.remove(this.currentObject);
        }

        // Create sword-like geometry
        const group = new THREE.Group();
        
        // Griff
        const handle = new THREE.BoxGeometry(0.3, 1.5, 0.3);
        const handleMesh = new THREE.Mesh(handle, 
            new THREE.MeshPhongMaterial({ color: 0x8b4513 }));
        
        // Klinge
        const blade = new THREE.BoxGeometry(0.15, 2.5, 0.4);
        const bladeMesh = new THREE.Mesh(blade, 
            new THREE.MeshPhongMaterial({ 
                color: 0xc0c0c0,
                metalness: 0.8,
                roughness: 0.2
            }));
        bladeMesh.position.y = 2;
        
        group.add(handleMesh);
        group.add(bladeMesh);
        
        this.currentObject = group;
        this.currentObject.position.y = 2;
        
        this.scene.add(this.currentObject);
        console.log('✅ Item zur Szene hinzugefügt!');
        
        const infoElement = document.getElementById('object-info');
        if (infoElement) {
            infoElement.textContent = `Item: ${properties.name || 'CustomSword'}`;
        }
    }

    // Animationen
    startRotation() {
        if (!this.currentObject) return;
        console.log('🔄 Starte Rotation');
        this.animations.push(() => {
            this.currentObject.rotation.y += 0.02;
        });
    }

    startPulsing() {
        if (!this.currentObject) return;
        console.log('💗 Starte Pulsieren');
        let scale = 1;
        let growing = true;
        
        this.animations.push(() => {
            if (growing) {
                scale += 0.01;
                if (scale > 1.3) growing = false;
            } else {
                scale -= 0.01;
                if (scale < 0.7) growing = true;
            }
            this.currentObject.scale.set(scale, scale, scale);
        });
    }

    startFloating() {
        if (!this.currentObject) return;
        console.log('☁️ Starte Schweben');
        let floatY = 0;
        
        this.animations.push(() => {
            floatY += 0.05;
            this.currentObject.position.y = 2 + Math.sin(floatY) * 0.5;
        });
    }
    
    startShaking() {
        if (!this.currentObject) return;
        console.log('🫨 Starte Wackeln');
        let shakeTime = 0;
        
        this.animations.push(() => {
            shakeTime += 0.1;
            this.currentObject.position.x = Math.sin(shakeTime * 10) * 0.1;
            this.currentObject.position.z = Math.cos(shakeTime * 10) * 0.1;
        });
    }

    applyRainbowEffect() {
        if (!this.currentObject) return;
        console.log('🌈 Aktiviere Regenbogen-Effekt');
        
        let hue = 0;
        this.animations.push(() => {
            hue = (hue + 1) % 360;
            const color = new THREE.Color(`hsl(${hue}, 100%, 50%)`);
            
            if (this.currentObject.material) {
                this.currentObject.material.color = color;
            } else if (this.currentObject.children) {
                this.currentObject.children.forEach(child => {
                    if (child.material) child.material.color = color;
                });
            }
        });
    }

    changeColor(color) {
        if (!this.currentObject) return;
        console.log(`🎨 Ändere Farbe zu: ${color}`);
        
        if (this.currentObject.material) {
            this.currentObject.material.color = new THREE.Color(color);
        } else if (this.currentObject.children) {
            this.currentObject.children.forEach(child => {
                if (child.material) child.material.color = new THREE.Color(color);
            });
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Run all animations
        this.animations.forEach(anim => anim());
        
        // Update camera
        if (this.updateCamera) {
            this.updateCamera();
        }
        
        // Render
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    resetCamera() {
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);
        console.log('📷 Kamera zurückgesetzt');
    }

    toggleWireframe() {
        if (!this.currentObject) return;
        
        if (this.currentObject.material) {
            this.currentObject.material.wireframe = !this.currentObject.material.wireframe;
        } else if (this.currentObject.children) {
            this.currentObject.children.forEach(child => {
                if (child.material) {
                    child.material.wireframe = !child.material.wireframe;
                }
            });
        }
        console.log('📐 Wireframe umgeschaltet');
    }

    exportModel() {
        console.log('💾 Export zu MCreator...');
        alert('Model wird zu MCreator exportiert!');
    }
}

// Initialisierung
console.log('🚀 Erstelle globale viewer3D Instanz...');
window.viewer3D = new Viewer3D();