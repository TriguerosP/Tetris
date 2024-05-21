const mainCanvas = document.querySelector("#main");
const nextCanvas = document.querySelector("#next");
const info = document.querySelector(".info");
const mainCTX = mainCanvas.getContext("2d");
const nextCtx = nextCanvas.getContext("2d");

// lines, pause, sound, levels and score,

mainCTX.fillRect(0, 0, mainCanvas.width, mainCanvas.height);

//constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
  "#323232",
  "red",
  "blue",
  "yellow",
  "orange",
  "green",
  "cyan",
  "pink",
  "white"
];
const LEVELS = {
  0: 800,
  1: 720,
  2: 630,
  3: 550,
  4: 470,
  5: 380
};
const time = { start: performance.now(), elapsed: 0, level: LEVELS[0] };
let animationFrame;

// classes
class Piece {
  constructor(x) {
    this.x = x;
    this.y = 0;
    this.shape = getShape();
  }

  draw(ctx) {
    this.shape.forEach((row, y) => {
      row.forEach((num, x) => {
        if (num < 1) return;
        ctx.fillStyle = COLORS[num];
        ctx.fillRect(
          (this.x + x) * BLOCK_SIZE,
          (this.y + y) * BLOCK_SIZE,
          BLOCK_SIZE,
          BLOCK_SIZE
        );
        ctx.strokeRect(
          (this.x + x) * BLOCK_SIZE,
          (this.y + y) * BLOCK_SIZE,
          BLOCK_SIZE,
          BLOCK_SIZE
        );
      });
    });
  }
}
class Board {
  constructor(ctx, nextCTX) {
    this.ctx = ctx;
    this.nextCTX = nextCTX;
    this.color = COLORS[0];
    this.init();
    this.gameOver = false;
  }

  init() {
    this.grid = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => 0)
    );
    this.ctx.canvas.width = COLS * BLOCK_SIZE;
    this.ctx.canvas.height = ROWS * BLOCK_SIZE;
    this.piece = new Piece(3);
    this.next = getShape();
    this.draw();
  }

  draw() {
    const p = moves["ArrowDown"](this.piece);
    const isValid = this.isValid(p);
    if (!isValid) {
      //save board
      this.freeze(this.piece);
      // get new pieces
      this.piece.shape = this.next;
      this.piece.y = 0;
      this.piece.x = 3;
      this.next = getShape();
      //remove lines
    } else {
      this.piece.y = p.y; // commit movement
    }
    // but before remove lines
    this.removeLines();
    // check if overflow
    if (this.grid[0].some((num) => num !== 0)) {
      // game over
      console.log("Game over");
      this.gameOver = true;
      return;
    }
    this.drawNext(this.next);
    this.drawBoard();
    this.piece.draw(this.ctx);
  }

  removeLines() {
    let lines = 0;
    let remove = false;
    this.grid.forEach((row, y) => {
      if (row.every((num, x) => num > 0)) {
        lines++;
        this.grid[y].forEach((num, x) => {
          if (this.grid[y][x] === 8) {
            remove = true;
          }
          this.grid[y][x] = 8;
        });
        if (remove) {
          this.grid.splice(y, 1);
          this.grid.unshift(Array(COLS).fill(0));
        }
      }
    });
  }

  freeze(piece) {
    piece.shape.forEach((row, y) => {
      row.forEach((num, x) => {
        if (num > 0) {
          this.grid[piece.y + y][piece.x + x] = num;
        }
      });
    });
  }

  isValid(p) {
    return p.shape.every((row, dy) =>
      row.every((num, dx) => {
        const x = p.x + dx;
        const y = p.y + dy;
        return (
          num === 0 || (this.isUnderAvailable(x, y) && this.isInside(x, y))
        );
      })
    );
  }

  repeat(shape, cb) {
    shape.forEach((row, y) => {
      row.forEach((num, x) => {
        cb(x, y, num, row);
      });
    });
  }

  isUnderAvailable(x, y): BooleanConstructor {
    return this.grid[y] && this.grid[y][x] === 0;
  }

  isInside(x, y) {
    return x >= 0 && x < COLS && y <= ROWS;
  }

  drawNext(next) {
    //this.nextCTX.scale(BLOCK_SIZE,BLOCK_SIZE);
    this.nextCTX.clearRect(0, 0, BLOCK_SIZE * 5, BLOCK_SIZE * 5);
    next.forEach((row, y) => {
      row.forEach((num, x) => {
        if (num < 1) return;
        this.nextCTX.fillStyle = COLORS[num];
        this.nextCTX.fillRect(
          (x + 1) * BLOCK_SIZE,
          y * BLOCK_SIZE,
          1 * BLOCK_SIZE,
          1 * BLOCK_SIZE
        );
      });
    });
  }

  drawBoard() {
    this.grid.forEach((row, y) => {
      row.forEach((num, x) => {
        this.ctx.fillStyle = COLORS[num];
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = "#222";
        this.ctx.fillRect(
          x * BLOCK_SIZE,
          y * BLOCK_SIZE,
          BLOCK_SIZE,
          BLOCK_SIZE
        );
        this.ctx.strokeRect(
          x * BLOCK_SIZE,
          y * BLOCK_SIZE,
          BLOCK_SIZE,
          BLOCK_SIZE
        );
      });
    });
  }
} // Board

// auxiliar functions
const moves = {
  ArrowLeft: (p) => ({ ...p, x: p.x - 1 }),
  ArrowRight: (p) => ({ ...p, x: p.x + 1 }),
  ArrowDown: (p) => ({ ...p, y: p.y + 1 }),
  ArrowUp: (p) => {
    const piece = JSON.parse(JSON.stringify(p));
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < y; x++) {
        [piece.shape[x][y], piece.shape[y][x]] = [
          piece.shape[y][x],
          piece.shape[x][y]
        ];
      }
    }
    piece.shape.forEach((row) => row.reverse());
    //piece.shape.reverse(); // counterClockwise
    return piece;
  }
};

function getShape() {
  const shapes = [
    [
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    [
      [2, 2, 0],
      [0, 2, 2],
      [0, 0, 0]
    ],
    [
      [0, 3, 3],
      [3, 3, 0],
      [0, 0, 0]
    ],
    [
      [4, 4],
      [4, 4]
    ],
    [
      [0, 0, 5],
      [5, 5, 5],
      [0, 0, 0]
    ],
    [
      [6, 0, 0],
      [6, 6, 6],
      [0, 0, 0]
    ],
    [
      [7, 7, 7],
      [0, 7, 0],
      [0, 0, 0]
    ]
  ];
  return shapes[Math.floor(Math.random() * shapes.length)];
}

// instances
const board = new Board(mainCTX, nextCtx);

// animation
const animate = (now = 0) => {
  time.elapsed = now - time.start;
  //console.log(time.elapsed);
  if (time.elapsed > time.level) {
    time.start = now;
    board.draw();
    // GAMEOVER?
    if (board.gameOver) {
      return cancelAnimationFrame(animationFrame);
    }
  }
  animationFrame = requestAnimationFrame(animate);
};

animate();

// listeners
addEventListener("keydown", (event) => {
  // new state
  const getNextState = moves[event.key];
  if (!getNextState) return;
  const p = getNextState(board.piece);
  // if valid commit
  if (board.isValid(p)) {
    board.piece.shape = p.shape;
    board.piece.x = p.x;
    board.piece.y = p.y;
    board.drawBoard();
    board.piece.draw(board.ctx);
  }
});