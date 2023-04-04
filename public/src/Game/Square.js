import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

class Square {
    static size = 2.0;

    constructor(coordinate, geometry, material) {
        if (!coordinate) {
            console.warn('No coordinate specified!');
            return;
        }
        
        this._coordinate = coordinate; 

        if (!geometry) {
            console.warn('No geometry specified!');
            return;
        }

        if (!material) {
            console.warn('No material specified!')
            return;
        }

        this._mesh = new THREE.Mesh(geometry, material);

        this._show_move = new THREE.Mesh(
            new THREE.BoxGeometry(Square.size - 0.1, 0.7, Square.size - 0.1),
            new THREE.MeshStandardMaterial({ color: 0x00FF00, transparent: true, opacity: 0.45 })
        );
        this._show_move.visible = false;
        this._show_move.position.copy(this._mesh);
        this._show_move.userData.coordinate = this._coordinate;
    }

    get coordinate() { return this._coordinate; }
    get position() { return this._mesh.position; }

    SetPosition(position) {
        this._mesh.position.copy(position);
        this._show_move.position.copy(position);
    }

    ShowMove() {
        this._show_move.visible = true;
    }

    HideMove() {
        this._show_move.visible = false;
    }
}

export default Square;