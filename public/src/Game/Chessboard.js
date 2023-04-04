import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import Square from './Square.js';
import { Pawn, Rook, Knight, Bishop, Queen, King } from './Piece.js';

const x_coord = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const y_coord = [1, 2, 3, 4, 5, 6, 7, 8];

class Chessboard {
    constructor(scene, camera) {
        this._scene = scene;
        this._camera = camera;

        this._white_square = new THREE.MeshStandardMaterial({ color: 0xffffff });
        this._black_square = new THREE.MeshStandardMaterial({ color: 0x000000 });
        this._white_piece = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        this._black_piece = new THREE.MeshStandardMaterial({ color: 0x111111 });

        this._square_geometry = new THREE.BoxBufferGeometry(Square.size, 0.5, Square.size);

        this._select_mesh = new THREE.Mesh(
            new THREE.BoxBufferGeometry(Square.size - 0.1, 0.7, Square.size - 0.1),
            new THREE.MeshStandardMaterial({ color: 0xFFFF0E, transparent: true, opacity: 0.75 })
        );
        this._select_mesh.visible = false;
        this._scene.add(this._select_mesh);

        this._squares = [];
        this._pieces = [];

        this._layout = [
            [2, 3, 4, 6, 5, 4, 3, 2],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [2, 3, 4, 6, 5, 4, 3, 2],
        ];

        this.CreateBoard();
    }

    CreateBoard() {
        for (let y = 0; y < this._layout.length; y++) {
            for (let x = 0; x < this._layout[y].length; x++) {
                let square = null;
                
                /* Create a square */
                if ((x + y) % 2 == 0)
                    square = new Square(`${x_coord[(this._layout[y].length - 1) - x]}${y_coord[y]}`, this._square_geometry, this._white_square);
                else 
                    square = new Square(`${x_coord[(this._layout[y].length - 1) - x]}${y_coord[y]}`, this._square_geometry, this._black_piece);
                
                /* Set the position of the square */
                square.SetPosition(new THREE.Vector3(x * Square.size, 0, y * Square.size));
                
                /* Add the square to the scene */
                this._scene.add(square._mesh);
                this._scene.add(square._show_move);
                this._squares.push(square);
            }
        }

        this.CreatePieces();
        console.log(this._pieces);
    }

    CreatePieces() {
        for (let y = 0; y < this._layout.length; y++) {
            for (let x = 0; x < this._layout[y].length; x++) {
                let piece = null;

                const coordinate = `${x_coord[(this._layout[y].length - 1) - x]}${y_coord[y]}`;

                /* Create piece according to current number in the layout */
                switch(this._layout[y][x]) {
                    case 0: break;
                    case 1: piece = new Pawn(coordinate); break;
                    case 2: piece = new Rook(coordinate); break;
                    case 3: piece = new Knight(coordinate); break;
                    case 4: piece = new Bishop(coordinate); break;
                    case 5: piece = new Queen(coordinate); break;
                    case 6: piece = new King(coordinate); break;
                }

                if (!piece) continue;
                
                /* Set Position */
                piece.SetPosition(this.GetSquareByCoordinate(coordinate).position);
 
                /* Pass all pieces by reference */
                piece._pieces = this._pieces;

                /* Set coordinate in user data */
                piece.SetCoordinate(coordinate);

                /* Set Rotation */
                if (y > 4) { /* Black */
                    piece._mesh.rotation.y += Math.PI;
                    piece.SetSide("black", this._black_piece);
                } else { /* White */
                    piece.SetSide("white", this._white_piece);
                }

                /* Add to Scene */
                this._scene.add(piece._mesh);

                /* Add to Array */
                this._pieces.push(piece);
            }
        }
    }

    Reset() {
        for (let i = 0; i < this._pieces.length; i++) this._scene.remove(this._pieces[i]._mesh);
        this._pieces = [];
        this.CreatePieces();
    }

    GetPieceByCoordinate(coordinate) {
        for (let i = 0; i < this._pieces.length; i++)
        {
            if (this._pieces[i].coordinate !== coordinate) continue;
            return this._pieces[i];
        }
    }

    GetSquareByCoordinate(coordinate) {
        for (let i = 0; i < this._squares.length; i++)
        {
            if (this._squares[i].coordinate !== coordinate) continue;
            return this._squares[i];
        }
    }

    SelectSquare(square) {
        this._select_mesh.position.copy(square._mesh.position);
        this._select_mesh.visible = true;
    }

    RemovePiece(piece) {
        const pieceI = this._pieces.findIndex(p => p.coordinate == piece.coordinate);

        if (pieceI < 0) {
            console.warn('No piece found!');
            return;
        }

        this._scene.remove(this._pieces[pieceI]._mesh);
        this._pieces.splice(pieceI, 1);
    }
}

export default Chessboard;