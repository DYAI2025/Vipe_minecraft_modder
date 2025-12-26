// Minecraft Texture Generator für Claude-Craft
class MinecraftTextures {
    constructor() {
        this.textureCache = {};
    }

    generateBlockTexture(type = 'stone') {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');

        switch(type) {
            case 'stone':
                this.drawStoneTexture(ctx);
                break;
            case 'grass':
                this.drawGrassTexture(ctx);
                break;
            case 'wood':
                this.drawWoodTexture(ctx);
                break;
            case 'diamond':
                this.drawDiamondTexture(ctx);
                break;
            default:
                this.drawDefaultTexture(ctx);
        }

        // Convert to Three.js texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return texture;
    }

    drawStoneTexture(ctx) {
        // Minecraft-style stone texture
        const colors = ['#8B8B8B', '#7A7A7A', '#969696', '#A3A3A3'];
        for(let x = 0; x < 16; x++) {
            for(let y = 0; y < 16; y++) {
                ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    drawGrassTexture(ctx) {
        // Grass base
        ctx.fillStyle = '#7CBD6E';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add grass details
        for(let i = 0; i < 20; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#5FA052' : '#8FD180';
            ctx.fillRect(Math.random() * 16, Math.random() * 16, 1, 1);
        }
    }

    drawWoodTexture(ctx) {
        // Wood planks
        ctx.fillStyle = '#8B6F47';
        ctx.fillRect(0, 0, 16, 16);
        
        // Wood grain
        ctx.strokeStyle = '#6B5537';
        ctx.lineWidth = 1;
        for(let y = 0; y < 16; y += 4) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(16, y);
            ctx.stroke();
        }
    }

    drawDiamondTexture(ctx) {
        // Diamond block
        ctx.fillStyle = '#5FDBDB';
        ctx.fillRect(0, 0, 16, 16);
        
        // Diamond pattern
        ctx.fillStyle = '#7FF7F7';
        ctx.fillRect(3, 3, 10, 10);
        ctx.fillStyle = '#4FC3C3';
        ctx.fillRect(5, 5, 6, 6);
    }

    drawDefaultTexture(ctx) {
        // Purple-pink gradient (missing texture style)
        for(let x = 0; x < 16; x++) {
            for(let y = 0; y < 16; y++) {
                if((x + y) % 2 === 0) {
                    ctx.fillStyle = '#FF00FF';
                } else {
                    ctx.fillStyle = '#000000';
                }
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
}

// Global instance
window.minecraftTextures = new MinecraftTextures();