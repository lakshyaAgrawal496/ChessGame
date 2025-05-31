const socket = io();

// socket.emit("churan"); // front-end se back-end pe churan bheja
// socket.on("churan papdi", function(){ // back-end se front-end pe receive hua
//     console.log("churan papdi received");
// });

let selectedSquare = null; // stores row & col of selected piece (for click-based move)

const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";

    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
            );

            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square); // You can use getPieceUnicode() here later
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowindex, col: squareindex };
                        e.dataTransfer.setData("text/plain", ""); // Required for drag to work
                    }
                });

                pieceElement.addEventListener("click", () => {
                    clearHighlights();
                
                    selectedSquare = { row: rowindex, col: squareindex }; // store selected piece
                
                    const moves = chess.moves({
                        square: `${String.fromCharCode(97 + squareindex)}${8 - rowindex}`,
                        verbose: true,
                    });
                
                    moves.forEach(move => {
                        const row = 8 - parseInt(move.to[1]);
                        const col = move.to.charCodeAt(0) - 97;
                        const selector = `.square[data-row="${row}"][data-col="${col}"]`;
                        const targetSquare = document.querySelector(selector);
                        if (targetSquare) {
                            targetSquare.classList.add("highlight");
                            targetSquare.dataset.moveTo = move.to; // store target square (for click)
                        }
                    });
                });
                            
                function clearHighlights() {
                    document.querySelectorAll(".square").forEach(el => {
                        el.classList.remove("highlight");
                        delete el.dataset.moveTo;
                    });
                }                

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement); // ✅ Append piece to square
            }

            squareElement.addEventListener("click", (e) => {
                const moveTo = squareElement.dataset.moveTo;
                if (selectedSquare && moveTo) {
                    const target = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
            
                    handleMove(selectedSquare, target); // reuse your existing handleMove
                    selectedSquare = null;
                    clearHighlights();
                }
            });            

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSource);
                }
            });

            boardElement.appendChild(squareElement); // ✅ Correct place for this
        });
    });
    if(playerRole ==='b'){
        boardElement.classList.add("flipped");
    }
    else{
        boardElement.classList.remove("flipped");
    }

};

const handleMove = (source, target) => {
    const move = {
      from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
      to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
      promotion: 'q', // promote to queen if pawn reaches last rank
    };
  
    socket.emit("move", move); // send move to server
    socket.emit("boardState", chess.fen());

  };
   

const getPieceUnicode = (piece) => {
    if (!piece) return '';
  
    const unicodePieces = {
      p: { w: '♙', b: '♟︎' },
      r: { w: '♖', b: '♜' },
      n: { w: '♘', b: '♞' },
      b: { w: '♗', b: '♝' },
      q: { w: '♕', b: '♛' },
      k: { w: '♔', b: '♚' },
    };
  
    return unicodePieces[piece.type][piece.color];
};



socket.on("playerRole", function(role){
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", function(fen){
    playerRole = null;
    renderBoard();
});

socket.on("boardState", function(fen) {
    chess.load(fen);
    renderBoard();
});


socket.on("move",function(move){
    chess.move(move);
    renderBoard();
});

renderBoard();