import Assets from './Assets.js';

const x_coord = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const y_coord = [1, 2, 3, 4, 5, 6, 7, 8];

class Piece {
    constructor(coordinate) {
        this._coordinate = coordinate;
        this._mesh = null;
        this._side = "";
        this._type = "";
        this._has_moved = false;
        this._pieces = [];
    }

    get coordinate() { return this._coordinate; }
    get position() { return this._mesh.position; }

    SetSide(side, material) { 
        this._side = side;

        this._mesh.traverse(c => {
            if (!c.isMesh) return;
            c.material = material;
        });
    }
    
    SetCoordinate(coordinate) {
        this._coordinate = coordinate;
        if (this._mesh) this._mesh.children[0].userData.coordinate = coordinate;

    }
    SetPosition(position) { this._mesh.position.copy(position); }

    GetXYIndices() {
        const s = this._coordinate.split('');
        return [
            x_coord.findIndex(xi => xi == s[0]),
            y_coord.findIndex(yi => yi == parseInt(s[1]))
        ];
    }

    GetPossibleForwardMoves(steps) {
        const [x, y] = this.GetXYIndices();

        const moves = [];

        /* Forward */
        for (let i = 0; i < (steps ?? y_coord.length - y + 1); i++) {
            if (i + y + 1 > y_coord.length - 1) break;

            const coord = this.CreateCoordinate(x, i + y + 1);

            const piece = this.CheckPieceAtCoord(coord);

            if (piece) {
                if (piece._side !== this._side && this._type !== "Pawn") moves.push(coord);
                break;
            }

            moves.push(coord);
        }

        /* Pawn Capturing */
        if (this._type == "Pawn") {
            const leftUp = this.CreateCoordinate(x - 1, y + 1);
            const rightUp = this.CreateCoordinate(x + 1, y + 1);

            const pieceLeft = this.CheckPieceAtCoord(leftUp);
            const pieceRight = this.CheckPieceAtCoord(rightUp);

            if (pieceLeft && pieceLeft._side !== this._side) moves.push(leftUp);
            if (pieceRight && pieceRight._side !== this._side) moves.push(rightUp);
        }

        return moves;
    }

    GetPossibleBackwardMoves(steps) {
        const [x, y] = this.GetXYIndices();

        const moves = [];

        /* Backward */
        for (let i = -2; i > (steps ? (steps * -1) - 1 : -(y + 1))-1; i--) {
            if (i + y + 1 < 0) break;

            const coord = this.CreateCoordinate(x, i + y + 1);

            const piece = this.CheckPieceAtCoord(coord);

            if (piece) {
                if (piece._side !== this._side && this._type !== "Pawn") moves.push(coord);
                break;
            }

            moves.push(coord);
        }

        /* Pawn Capturing */
        if (this._type == "Pawn") {
            const leftDown = this.CreateCoordinate(x - 1, y - 1);
            const rightDown = this.CreateCoordinate(x + 1, y - 1);

            const pieceLeft = this.CheckPieceAtCoord(leftDown);
            const pieceRight = this.CheckPieceAtCoord(rightDown);

            if (pieceLeft && pieceLeft._side !== this._side) moves.push(leftDown);
            if (pieceRight && pieceRight._side !== this._side) moves.push(rightDown);
        }
    
        return moves;
    }

    GetPossibleSidewayMoves(steps) {
        const [x, y] = this.GetXYIndices();

        const moves = [];

        /* Right */
        for (let i = 0; i < (steps ?? x_coord.length - x + 1); i++) {
            if (i + x + 1 > x_coord.length - 1) break;

            const coord = this.CreateCoordinate(i + x + 1, y);

            const piece = this.CheckPieceAtCoord(coord);

            if (piece) {
                if (piece._side !== this._side) moves.push(coord);
                break;
            }

            moves.push(coord);
        }

        /* Left */
        for (let i = -2; i > (steps ? (steps * -1) - 1 : (-(x + 1))) - 1; i--) {
            if (i + x + 1 < 0) break;
            
            const coord = this.CreateCoordinate(i + x + 1, y);

            const piece = this.CheckPieceAtCoord(coord);

            if (piece) {
                if (piece._side !== this._side) moves.push(coord);
                break;
            }

            moves.push(coord);
        }

        return moves;
    }

    GetPossibleDiagonalMoves(steps) {
        const [x, y] = this.GetXYIndices();

        const moves = [];

        let b1, b2, b3, b4;
        b1 = b2 = b3 = b4 = true;

        for (let i = 0; i < (steps ?? y_coord.length - y + 1); i++) {
            if (i + y + 1 > y_coord.length - 1) break;

            /* Up Right */
            if (!(x + 1 + i > x_coord.length - 1) && b1) {
                const coord = this.CreateCoordinate(x + 1 + i, i + y + 1);
                const piece = this.CheckPieceAtCoord(coord);
                if (piece) {
                    if (piece._side !== this._side) moves.push(coord);
                    b1 = false;
                }
                else moves.push(coord);
            }

            /* Up Left */
            if (!(x - 1 - i < 0) && b2) {
                const coord = this.CreateCoordinate(x - 1 - i, i + y + 1);
                const piece = this.CheckPieceAtCoord(coord);
                if (piece) {
                    if (piece._side !== this._side) moves.push(coord);
                    b2 = false;
                }
                else moves.push(coord);
            }
        }

        for (let i = -2; i > (steps ? (steps * -1) - 1 : -(y + 1))-1; i--) {
            if (i + y + 1 < 0) break;

            /* Down Right */
            if (!(x - 1 - i > x_coord.length - 1) && b3) {
                const coord = this.CreateCoordinate(x - 1 - i, i + y + 1);
                const piece = this.CheckPieceAtCoord(coord);
                if (piece) {
                    if (piece._side !== this._side) moves.push(coord);
                    b3 = false;
                }
                else moves.push(coord);
            }

            /* Down Left */
            if (!(x + 1 + i < 0) && b4) {
                const coord = this.CreateCoordinate(x + 1 + i, i + y + 1);
                const piece = this.CheckPieceAtCoord(coord);
                if (piece) {
                    if (piece._side !== this._side) moves.push(coord);
                    b4 = false;
                }
                else moves.push(coord);
            }
        }

        return moves;
    }

    GetPossibleKnightMoves() {
        const [x, y] = this.GetXYIndices();

        const moves = [];

        /* Forward */
        if (!(y + 2 > y_coord.length - 1)) {
            if (x - 1 > -1) {
                const coord = this.CreateCoordinate(x - 1, y + 2);
                const piece = this.CheckPieceAtCoord(coord);

                /* Left */
                if (piece) {
                    if (piece._side !== this._side) moves.push(coord);
                } else moves.push(coord);
            }
            if (x + 1 < x_coord.length) {
                const coord = this.CreateCoordinate(x + 1, y + 2);
                const piece = this.CheckPieceAtCoord(coord);

                /* Right */
                if (piece) {
                    if (piece._side !== this._side) moves.push(coord);
                } else moves.push(coord);
            }
        }

        /* Backward */
        if (!(y - 2 < 0)) {
            if (x - 1 > -1) {
                const coord = this.CreateCoordinate(x - 1, y - 2);
                const piece = this.CheckPieceAtCoord(coord);

                /* Left */
                if (piece) {
                    if (piece._side !== this._side) moves.push(coord);
                } else moves.push(coord);
            }
            if (x + 1 < x_coord.length) {
                const coord = this.CreateCoordinate(x + 1, y - 2);
                const piece = this.CheckPieceAtCoord(coord);

                /* Right */
                if (piece) {
                    if (piece._side !== this._side) moves.push(coord);
                } else moves.push(coord);
            }
        }

        /* Right */
        if (!(x + 2 > x_coord.length - 1)) {
            if (y - 1 > -1) {
                const coord = this.CreateCoordinate(x + 2, y - 1);
                const piece = this.CheckPieceAtCoord(coord);

                /* Down */
                if (piece) {
                    if (piece._side !== this._side) moves.push(coord);
                } else moves.push(coord);
            }
            if (y + 1 < y_coord.length) {
                const coord = this.CreateCoordinate(x + 2, y + 1);
                const piece = this.CheckPieceAtCoord(coord);

                /* Up */
                if (piece) {
                    if (piece._side !== this._side) moves.push(coord);
                } else moves.push(coord);
            }
        };

        /* Left */
        if (!(x - 2 < 0)) {
            if (!(y - 2 < 0)) {
                const coord = this.CreateCoordinate(x - 2, y - 1);
                const piece = this.CheckPieceAtCoord(coord);

                /* Down */
                if (piece) {
                    if (piece._side !== this._side) moves.push(coord);
                } else moves.push(coord);
            }
            if (!(y + 1 > y_coord.length - 1)) {
                const coord = this.CreateCoordinate(x - 2, y + 1);
                const piece = this.CheckPieceAtCoord(coord);

                /* Up */
                if (piece) {
                    if (piece._side !== this._side) moves.push(coord);
                } else moves.push(coord);
            }
        };

        return moves;
    }

    CheckPieceAtCoord(coordinate) { return this._pieces.find(piece => piece.coordinate == coordinate); }
    CreateCoordinate(xi, yi) { return `${x_coord[xi]}${y_coord[yi]}`; }
    SetHasMoved(hasMoved) { this._has_moved = hasMoved; }
    GetPossibleMoves() {}
}

class Pawn extends Piece {
    constructor(coordinate) {
        super(coordinate);

        this._type = "Pawn";
        this._mesh = Assets.models.find(model => model.name == this._type).data.clone();
    }

    GetPossibleMoves() {
        return this._side == "white" ?
            this.GetPossibleForwardMoves(this._has_moved ? 1 : 2) :
            this.GetPossibleBackwardMoves(this._has_moved ? 1 : 2);
    }
}

class Rook extends Piece {
    constructor(coordinate) {
        super(coordinate);

        this._type = "Rook";
        this._mesh = Assets.models.find(model => model.name == this._type).data.clone();
    }

    GetPossibleMoves() {
        const moves = [
            ...this.GetPossibleForwardMoves(),
            ...this.GetPossibleBackwardMoves(),
            ...this.GetPossibleSidewayMoves(),
        ];

        return moves;
    }
}

class Knight extends Piece {
    constructor(coordinate) {
        super(coordinate);

        this._type = "Knight";
        this._mesh = Assets.models.find(model => model.name == this._type).data.clone();
    }

    GetPossibleMoves() {
        const moves = this.GetPossibleKnightMoves();

        return moves;
    }
}

class Bishop extends Piece {
    constructor(coordinate) {
        super(coordinate);

        this._type = "Bishop";
        this._mesh = Assets.models.find(model => model.name == this._type).data.clone();
    }

    GetPossibleMoves() {
        const moves = [
            ...this.GetPossibleDiagonalMoves(),
        ];

        return moves;
    }
}

class Queen extends Piece {
    constructor(coordinate) {
        super(coordinate);

        this._type = "Queen";
        this._mesh = Assets.models.find(model => model.name == this._type).data.clone();
    }

    GetPossibleMoves() {
        const moves = [
            ...this.GetPossibleForwardMoves(),
            ...this.GetPossibleBackwardMoves(),
            ...this.GetPossibleSidewayMoves(),
            ...this.GetPossibleDiagonalMoves(),
        ];

        return moves;
    }
}

class King extends Piece {
    constructor(coordinate) {
        super(coordinate);

        this._type = "King";
        this._mesh = Assets.models.find(model => model.name == this._type).data.clone();
    }

    GetPossibleMoves() {
        const moves = [
            ...this.GetPossibleForwardMoves(1),
            ...this.GetPossibleBackwardMoves(1),
            ...this.GetPossibleSidewayMoves(1),
            ...this.GetPossibleDiagonalMoves(1),
        ];

        return moves;
    }
}

export { Pawn, Rook, Knight, Bishop, Queen, King }