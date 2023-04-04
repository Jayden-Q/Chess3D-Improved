import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import Socket from '../Socket.js';

import DOMElements from '../DOMElements.js';
import { Knight, Bishop, Rook, Queen } from './Piece.js';

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

            console.log('Promoted type: ' + PieceType);

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
        for (let i = 0; i < possible_move_squares.length; i++) {
            possible_move_squares[i].ShowMove();
        }

        // Check if the king has moved already
        // If the king has, then exit
        //
        // Get the left and right rooks
        // Check if they moved
        // If they didn't:
        //  Check if there's any pieces between
        //  If there aren't, then display a second move
        //  If the king is moved there, move the king there and move the rook to the square on the other side of the king

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