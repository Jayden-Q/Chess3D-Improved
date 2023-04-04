import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

class Renderer {
    constructor(sizes) {
        this.sizes = sizes;

        this.instance = new THREE.WebGLRenderer({ antialias: true });
        this.instance.setPixelRatio(window.devicePixelRatio);
        this.instance.setSize(this.sizes.width, this.sizes.height);
        this.instance.shadowMap.enabled = true;
        this.instance.shadowMap.type = THREE.VSMShadowMap;
        this.instance.outputEncoding = THREE.sRGBEncoding;
        this.instance.toneMapping = THREE.ACESFilmicToneMapping;
    }

    Resize() {
        this.instance.setSize(this.sizes.width, this.sizes.height);
        this.instance.setPixelRatio(window.devicePixelRatio);
    }

    Update(scene, camera) {
        this.instance.render(scene, camera);
    }
}

export default Renderer;