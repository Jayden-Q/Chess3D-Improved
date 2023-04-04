import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';

class Camera {
    constructor(sizes, params) {
        this.sizes = sizes;

        this.instance = new THREE.PerspectiveCamera(
            params.fov, this.sizes.width / this.sizes.height, params.near ?? 0.1, params.far ?? 1000);

        this.instance.position.set(7, 10, -3);
        this.instance.rotation.order = 'YXZ';
    
        this._controls = new OrbitControls(this.instance, this.sizes.DOMElement);
        this._controls.target = new THREE.Vector3(7, 0, 7);
        // this._controls.screenSpacePanning = true;
        // this._controls.zoomSpeed = 0.25;
        // this._controls.enableRotate = false;
        // this._controls.enableZoom = false;
        this._controls.enablePan = false;
        this._controls.dampingFactor = 0.1;
        this._controls.enableDamping = true;
        // this._controls.autoRotate = true;
        this._controls.update();
    }

    Resize() {
        this.instance.aspect = this.sizes.width / this.sizes.height;
        this.instance.updateProjectionMatrix();
    }

    Update() {
        if (this._controls) this._controls.update();
    }
}

export default Camera;