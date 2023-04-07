import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import Socket from '../Socket.js';

import DOMElements from '../DOMElements.js';
import { Knight, Bishop, Rook, Queen } from './Piece.js';

const x_coord = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const y_coord = [1, 2, 3, 4, 5, 6, 7, 8];

class Player {
    static instance;

    constructor(chessboard, side) {
        if (Player.instance) return Player.instance;

        Player.instance = this;
    
        this._chessboard = chessboard;
        this._side = side;

        this._selectable_pieces = this._chessboard._pieces
                            .filter(piece => piece._side == this._side)
                            .map(piece => piece._mesh.children[0]);

        this._current_turn = this._side == "white";
        this._chessboard._camera.position.set(7, 10, this._side == "white" ? -3 : 17);

        this._raycaster = new THREE.Raycaster();
        this._pointer = new THREE.Vector2();
        this._selected_piece = null;
        this._is_moving_piece = false;
        this._possible_move_squares = [];

        this._castle_left_square = null;
        this._castle_right_square = null;

        this.SetUpSocketEventListeners();

        document.addEventListener("click", e => this.OnClick(e));
    }

    SetUpSocketEventListeners() {
        Socket.instance.AddListener('game:move', coords => {
            this.SetCurrentTurn(true);
            
            const movePiece = this._chessboard.GetPieceByCoordinate(coords.from);
            if (!movePiece) return;

            const dstPiece = this._chessboard.GetPieceByCoordinate(coords.to);

            if (dstPiece) {
                this._chessboard.RemovePiece(dstPiece);
                this.UpdateSelectablePieces();
            }

            movePiece.SetCoordinate(coords.to);
            movePiece.SetPosition(this._chessboard.GetSquareByCoordinate(coords.to).position);
            movePiece.SetHasMoved(true);
        });

        Socket.instance.AddListener('game:promote_piece', data => {
            const PieceType = 
                data.type == 'knight' ? Knight :
                data.type == 'bishop' ? Bishop :
                data.type == 'rook' ? Rook :
                data.type == 'queen' ? Queen : null;

            if (!PieceType) return;

            const removed_pawn = this._chessboard.GetPieceByCoordinate(data.at);

            this._chessboard.RemovePiece(removed_pawn);

            const promoted_piece = new PieceType(removed_pawn.coordinate);
            promoted_piece.SetCoordinate(removed_pawn.coordinate);
            promoted_piece.SetPosition(this._chessboard.GetSquareByCoordinate(removed_pawn.coordinate).position);

            if (this._side == 'white') {
                promoted_piece._mesh.rotation.y += Math.PI;
                promoted_piece.SetSide('black', this._chessboard._black_piece);
            } else {
                promoted_piece.SetSide('white', this._chessboard._white_piece);
            }

            this._chessboard._scene.add(promoted_piece._mesh);
            this._chessboard._pieces.push(promoted_piece);

            this.UpdateSelectablePieces();
        });
    }

    UpdateSelectablePieces() {
        this._selectable_pieces = this._chessboard._pieces
            .filter(piece => piece._side == this._side)
            .map(piece => piece._mesh.children[0]);
    }

    MovePiece(coords) {
        const movePiece = this._chessboard.GetPieceByCoordinate(coords.from);
        if (!movePiece) return;

        const dstPiece = this._chessboard.GetPieceByCoordinate(coords.to);

        if (dstPiece) {
            if (dstPiece._type == 'King' && dstPiece._side != this._side) Socket.instance.EmitEvent('game:win');
            this._chessboard.RemovePiece(dstPiece);
            this.UpdateSelectablePieces();
        }

        movePiece.SetCoordinate(coords.to);
        movePiece.SetPosition(this._chessboard.GetSquareByCoordinate(coords.to).position);
        movePiece.SetHasMoved(true);
        
        const y_coord_index = movePiece.GetXYIndices()[1];

        if (movePiece._type == 'Pawn') {
            if ((y_coord_index == 7 && this._side == 'white') || (y_coord_index == 0 && this._side == 'black')) {
                const OnPromote = e => {
                    DOMElements.gameUI.promoteOptionsContainer.classList.add('hidden');
                    DOMElements.gameUI.promoteOptions.forEach(option => option.removeEventListener('click', OnPromote));

                    const PieceType = 
                        e.target.id == 'knight' ? Knight :
                        e.target.id == 'bishop' ? Bishop :
                        e.target.id == 'rook' ? Rook :
                        e.target.id == 'queen' ? Queen : null;

                    if (!PieceType) return;

                    this._chessboard.RemovePiece(movePiece);

                    const promoted_piece = new PieceType(movePiece.coordinate);
                    promoted_piece._pieces = this._chessboard._pieces;
                    promoted_piece.SetCoordinate(movePiece.coordinate);
                    promoted_piece.SetPosition(this._chessboard.GetSquareByCoordinate(movePiece.coordinate).position);

                    if (this._side == 'white') {
                        promoted_piece.SetSide('white', this._chessboard._white_piece);
                    } else {
                        promoted_piece._mesh.rotation.y += Math.PI;
                        promoted_piece.SetSide('black', this._chessboard._black_piece);
                    }

                    this._chessboard._scene.add(promoted_piece._mesh);
                    this._chessboard._pieces.push(promoted_piece);

                    this.UpdateSelectablePieces();

                    Socket.instance.EmitEvent('game:move', coords);
                    Socket.instance.EmitEvent('game:promote_piece', { at: promoted_piece.coordinate, type: e.target.id });
                }

                DOMElements.gameUI.promoteOptionsContainer.classList.remove('hidden');
                DOMElements.gameUI.promoteOptions.forEach(option => option.addEventListener('click', OnPromote));   
                
                return;
            }
        }

        if (this._castle_left_square && this._castle_left_square.coordinate == coords.to) {
            const left_rook_coord = this._side == 'white' ? 'A1' : 'H8';
            const left_rook = this._chessboard.GetPieceByCoordinate(left_rook_coord);

            const [x, y] = movePiece.GetXYIndices();

            const new_coord = `${this._side == 'white' ? x_coord[x + 1] : x_coord[x - 1]}${y_coord[y]}`;

            left_rook.SetCoordinate(new_coord);
            left_rook.SetPosition(this._chessboard.GetSquareByCoordinate(left_rook.coordinate).position);
            left_rook.SetHasMoved(true);

            Socket.instance.EmitEvent('game:move', [coords, { from: left_rook_coord, to: new_coord }]);

            return;
        } else if (this._castle_right_square && this._castle_right_square.coordinate == coords.to) {
            const right_rook_coord = this._side == 'white' ? 'H1' : 'A8';
            const right_rook = this._chessboard.GetPieceByCoordinate(right_rook_coord);

            const [x, y] = movePiece.GetXYIndices();

            const new_coord = `${this._side == 'white' ? x_coord[x - 1] : x_coord[x + 1]}${y_coord[y]}`;

            right_rook.SetCoordinate(new_coord);
            right_rook.SetPosition(this._chessboard.GetSquareByCoordinate(right_rook.coordinate).position);
            right_rook.SetHasMoved(true);

            Socket.instance.EmitEvent('game:move', coords, { from: right_rook_coord, to: new_coord });

            return;
        }

        Socket.instance.EmitEvent('game:move', coords);
    }

    SetSide(side) {
        this._side = side;
        this._current_turn = this._side == "white";

        this.Unselect();
        this.UpdateSelectablePieces();

        this._chessboard._camera.position.set(7, 10, this._side == "white" ? -3 : 17);
    }

    SetCurrentTurn(isCurrentTurn) {
        this._current_turn = isCurrentTurn;
    }

    GetIntersections(meshes) {
        this._raycaster.setFromCamera(this._pointer, this._chessboard._camera);
        const intersections = this._raycaster.intersectObjects(meshes, false);
        if (intersections.length < 1) return;
        return intersections;
    }

    Unselect() {
        this._selected_piece = null;
        this._is_moving_piece = false;
        this._chessboard._select_mesh.visible = false;
    
        for (let i = 0; i < this._chessboard._squares.length; i++)
            this._chessboard._squares[i].HideMove();

        this._castle_left_square = this._castle_right_square = null;
    }

    SelectPiece(coordinate) {
        const piece = this._chessboard.GetPieceByCoordinate(coordinate);
        const square = this._chessboard.GetSquareByCoordinate(coordinate);

        if (!piece || !square) return;

        /* Show the user that the piece is selected */
        this._chessboard.SelectSquare(square);

        this._selected_piece = piece;
        this._is_moving_piece = true;

        /* Get all the possible moves */
        const possible_move_coords = piece.GetPossibleMoves();
        const possible_move_squares = possible_move_coords.map(coord => this._chessboard.GetSquareByCoordinate(coord));

        /* Display all the possible moves */
        for (let i = 0; i < possible_move_squares.length; i++) possible_move_squares[i].ShowMove();

        this._castle_left_square = this._castle_right_square = null;

        if (this._selected_piece._type == 'King' && !this._selected_piece._has_moved) {
            const left_rook_coord = this._side == 'white' ? 'A1' : 'H8';
            const right_rook_coord = this._side == 'white' ? 'H1' : 'A8';

            const left_rook = this._chessboard.GetPieceByCoordinate(left_rook_coord);
            const right_rook = this._chessboard.GetPieceByCoordinate(right_rook_coord);

            if (left_rook && !left_rook._has_moved) {
                let can_castle_left = true;
                const [x, y] = this._selected_piece.GetXYIndices();

                if (this._side == 'white') {
                    for (let i = 1; i < x; i++) {
                        if (this._chessboard.GetPieceByCoordinate(`${x_coord[i]}1`)) {
                            can_castle_left = false;
                            break;
                        }
                    }

                    if (can_castle_left) {
                        const square = this._chessboard.GetSquareByCoordinate(this._selected_piece.GetCastleLeftMove());
                        square.ShowMove();
                        possible_move_squares.push(square);
                        this._castle_left_square = square;
                    }
                } else {
                    for (let i = 6; i > x; i--) {
                        if (this._chessboard.GetPieceByCoordinate(`${x_coord[i]}8`)) {
                            can_castle_left = false;
                            break;
                        }
                    }
                    
                    if (can_castle_left) {
                        const square = this._chessboard.GetSquareByCoordinate(this._selected_piece.GetCastleLeftMove());
                        square.ShowMove();
                        possible_move_squares.push(square);
                        this._castle_left_square = square;
                    }
                }
            }

            if (right_rook && !right_rook._has_moved) {
                let can_castle_right = true;
                const [x, y] = this._selected_piece.GetXYIndices();

                if (this._side == 'white') {
                    for (let i = 6; i > x; i--) {
                        if (this._chessboard.GetPieceByCoordinate(`${x_coord[i]}1`)) {
                            can_castle_right = false;
                            break;
                        }
                    }

                    if (can_castle_right) {
                        const square = this._chessboard.GetSquareByCoordinate(this._selected_piece.GetCastleRightMove());
                        square.ShowMove();
                        possible_move_squares.push(square);
                        this._castle_right_square = square;
                    }
                } else {
                    for (let i = 1; i < x; i++) {
                        if (this._chessboard.GetPieceByCoordinate(`${x_coord[i]}8`)) {
                            can_castle_right = false;
                            break;
                        }
                    }
                    
                    if (can_castle_right) {
                        const square = this._chessboard.GetSquareByCoordinate(this._selected_piece.GetCastleRightMove());
                        square.ShowMove();
                        possible_move_squares.push(square);
                        this._castle_right_square = square;
                    }
                }
            }
        }

        this._possible_move_squares = possible_move_squares;
    }

    OnClick(e) {
        if (!this._current_turn) return;

        /* Get normalized pointer location */
        this._pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        this._pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

        if (this._is_moving_piece) { // If a piece is selected
            const intersections = this.GetIntersections(this._possible_move_squares.map(square => square._show_move)); // Get the square to move to
            
            if (!intersections) { // Unselect piece if there is no intersection
                this.Unselect();
                return;
            };

            this.SetCurrentTurn(false);
            this.MovePiece({ from: this._selected_piece.coordinate, to: intersections[0].object.userData.coordinate });

            /* Unselect piece and hide possible moves */
            this.Unselect();

            return;
        }

        this.Unselect(); // Unselect pieces previously selected
    
        const intersections = this.GetIntersections(this._selectable_pieces); // Check if any piece was clicked on
        if (!intersections) return;

        const coordinate = intersections[0].object.userData.coordinate; // Get the coordinate of the selected piece

        this.SelectPiece(coordinate); // Display the selected piece
    }
}



export default Player;