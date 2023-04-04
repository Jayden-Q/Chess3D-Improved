import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';

import Camera from './Camera.js';
import Renderer from './Renderer.js';

import Socket from '../Socket.js';
import Chessboard from './Chessboard.js';
import Player from './Player.js';
import Sizes from './utils/Sizes.js';

class Game {
    constructor(DOMElement) {
        this._dom_element = DOMElement;
        this._socket = new Socket();

        this.sizes = new Sizes(this._dom_element);

        this.InitializeScene();
        this.InitializeCamera();
        this.InitializeRenderer();
        this.InitializeLighting();
        this.InitializeSkybox();

        this._clock = new THREE.Clock();

        this._chessboard = new Chessboard(this._scene, this._camera.instance);

        window.addEventListener("resize", () => this.Resize(), false);
        window.requestAnimationFrame(() => this.Update());
    }

    ResetGame() {
        this._chessboard.Reset();
    }

    SetPlayerSide(side) {
        if (!this._player) {
            this._player = new Player(this._chessboard, side);
            return;
        }

        this._player.SetSide(side);
    }

    InitializeScene() {
        this._scene = new THREE.Scene();
    }

    InitializeCamera() {
        this._camera = new Camera(this.sizes, { fov: 75, near: 0.1, far: 1000.0 });
    }

    InitializeRenderer() {
        this._renderer = new Renderer(this.sizes);

        this._dom_element.appendChild(this._renderer.instance.domElement);
    }

    InitializeLighting() {
        const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
        directionalLight.position.set(25, 25, 7);
        directionalLight.target.position.set(7, 0, 7);
        directionalLight.target.updateMatrixWorld();
        directionalLight.castShadow = true;
        directionalLight.shadow.bias = -0.001;

        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.25);
        this._scene.add(directionalLight, ambientLight);

        const helper = new THREE.DirectionalLightHelper(directionalLight, 1.0);
        this._scene.add(helper);
    }

    InitializeSkybox() {
        const loader = new THREE.CubeTextureLoader();
        const texture = loader.load([
            "../../resources/skybox/miramar_lf.jpg",
            "../../resources/skybox/miramar_rt.jpg",
            "../../resources/skybox/miramar_up.jpg",
            "../../resources/skybox/miramar_dn.jpg",
            "../../resources/skybox/miramar_ft.jpg",
            "../../resources/skybox/miramar_bk.jpg",
        ]);
        this._scene.background = texture;
    }

    Resize() {
        this.sizes.Resize();
        this._camera.Resize();
        this._renderer.Resize();
    }

    Update() {
        const t = this._clock.getDelta();
        this._renderer.Update(this._scene, this._camera.instance);
        this._camera.Update();
        requestAnimationFrame(() => this.Update());
    }
}

class Background extends Game {
    static instance;

    constructor(DOMElement) {
        if (Background.instance) return Background.instance;
        super(DOMElement);
        Background.instance = this;

        this._camera._controls.dispose();
        this._camera._controls = null;
        this._camera.instance.position.set(-6, 7, 7);
        this._camera.instance.lookAt(7, 0, 7);
    }
}


export { Game, Background };