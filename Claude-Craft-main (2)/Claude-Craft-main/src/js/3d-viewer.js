// Claude-Craft 3D Viewer
class Viewer3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.currentObject = null;
        this.animations = [];
        this.init();
    }

    init() {
        const container = document.getElementById('3d-viewer');
        const width = container.clientWidth;
        const height = container.clientHeight;

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
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.shadowMap.enabled = true;        container.appendChild(this.renderer.domElement);

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

        // Axes Helper
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);

        // Mouse Controls
        this.setupControls();

        // Start Animation Loop
        this.animate();
    }

    setupControls() {
        let mouseX = 0, mouseY = 0;
        let targetX = 0, targetY = 0;
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;
        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX - windowHalfX) / 100;
            mouseY = (event.clientY - windowHalfY) / 100;
        });

        this.updateCamera = () => {
            targetX = mouseX * 0.05;
            targetY = mouseY * 0.05;
            
            this.camera.position.x += (targetX - this.camera.position.x) * 0.05;
            this.camera.position.y += (-targetY - this.camera.position.y) * 0.05;
            this.camera.lookAt(this.scene.position);
        };
    }

    createBlock(properties = {}) {
        // Remove existing object
        if (this.currentObject) {
            this.scene.remove(this.currentObject);
        }

        // Create geometry with size
        const size = properties.size || 1;
        const geometry = new THREE.BoxGeometry(2 * size, 2 * size, 2 * size);
        
        // Get Minecraft texture
        const texture = window.minecraftTextures && properties.texture ? 
            window.minecraftTextures.generateBlockTexture(properties.texture) :
            null;
        
        // Create material
        const material = new THREE.MeshPhongMaterial({
            map: texture,
            color: properties.color ? new THREE.Color(properties.color) : 
                   (texture ? 0xffffff : 0x4facfe),
            transparent: properties.transparent || false,
            opacity: properties.transparent ? 0.7 : 1.0,
            emissive: properties.luminance ? new THREE.Color(0xffff00) : 0x000000,
            emissiveIntensity: properties.luminance ? (properties.luminance / 15) : 0
        });

        // Create mesh
        this.currentObject = new THREE.Mesh(geometry, material);
        this.currentObject.position.y = 1;
        this.currentObject.castShadow = true;
        this.currentObject.receiveShadow = true;
        
        // Add to scene
        this.scene.add(this.currentObject);
        
        // Update info
        document.getElementById('object-info').textContent = 
            `Block erstellt: ${properties.name || 'CustomBlock'}`;
    }

    createItem(properties = {}) {
        if (this.currentObject) {
            this.scene.remove(this.currentObject);
        }

        // Create sword-like geometry
        const handle = new THREE.BoxGeometry(0.2, 1.5, 0.2);
        const blade = new THREE.BoxGeometry(0.1, 2, 0.3);
        
        const handleMesh = new THREE.Mesh(handle, 
            new THREE.MeshPhongMaterial({ color: 0x8b4513 }));
        const bladeMesh = new THREE.Mesh(blade, 
            new THREE.MeshPhongMaterial({ color: 0xc0c0c0 }));
        bladeMesh.position.y = 1.75;
        
        this.currentObject = new THREE.Group();
        this.currentObject.add(handleMesh);
        this.currentObject.add(bladeMesh);
        this.currentObject.position.y = 2;
        
        this.scene.add(this.currentObject);
        
        document.getElementById('object-info').textContent = 
            `Item erstellt: ${properties.name || 'CustomSword'}`;
    }

    applyRainbowEffect() {
        if (!this.currentObject) return;
        
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
    startRotation() {
        if (!this.currentObject) return;
        this.animations.push(() => {
            this.currentObject.rotation.y += 0.02;
        });
    }

    startPulsing() {
        if (!this.currentObject) return;
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
        let floatY = 0;
        
        this.animations.push(() => {
            floatY += 0.05;
            this.currentObject.position.y = 2 + Math.sin(floatY) * 0.5;
        });
    }
    
    startShaking() {
        if (!this.currentObject) return;
        let shakeTime = 0;
        
        this.animations.push(() => {
            shakeTime += 0.1;
            this.currentObject.position.x = Math.sin(shakeTime * 10) * 0.1;
            this.currentObject.position.z = Math.cos(shakeTime * 10) * 0.1;
        });
    }
    changeColor(color) {
        if (!this.currentObject) return;
        
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
        this.renderer.render(this.scene, this.camera);
    }

    resetCamera() {
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);
    }

    toggleWireframe() {        if (!this.currentObject) return;
        
        if (this.currentObject.material) {
            this.currentObject.material.wireframe = !this.currentObject.material.wireframe;
        } else if (this.currentObject.children) {
            this.currentObject.children.forEach(child => {
                if (child.material) {
                    child.material.wireframe = !child.material.wireframe;
                }
            });
        }
    }

    exportModel() {
        // Hier würde der Export zu MCreator erfolgen
        console.log('Exporting model to MCreator...');
        alert('Model wird zu MCreator exportiert!');
    }
}

// Initialisierung
window.viewer3D = new Viewer3D();