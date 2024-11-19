class Minesweeper {
    constructor() {
        this.difficulties = {
            beginner: { rows: 9, cols: 9, mines: 10 },
            intermediate: { rows: 16, cols: 16, mines: 40 },
            expert: { rows: 16, cols: 30, mines: 99 }
        };
        this.grid = [];
        this.gameOver = false;
        this.firstClick = true;
        this.mineCount = 0;
        this.flagCount = 0;
        this.timer = 0;
        this.timerInterval = null;

        this.initializeGame();
        this.setupEventListeners();
    }

    initializeGame(difficulty = 'beginner') {
        this.stopTimer();
        this.timer = 0;
        this.updateTimer();
        this.gameOver = false;
        this.firstClick = true;
        this.currentDifficulty = this.difficulties[difficulty];
        this.mineCount = this.currentDifficulty.mines;
        this.flagCount = 0;
        this.updateMineCounter();
        this.createGrid();
        document.getElementById('reset-button').textContent = '😊';
    }

    createGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';
        gridElement.style.gridTemplateColumns = `repeat(${this.currentDifficulty.cols}, var(--cell-size))`;

        this.grid = [];
        for (let row = 0; row < this.currentDifficulty.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.currentDifficulty.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                gridElement.appendChild(cell);
                
                this.grid[row][col] = {
                    element: cell,
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    adjacentMines: 0
                };
            }
        }
    }

    placeMines(firstClickRow, firstClickCol) {
        let minesPlaced = 0;
        while (minesPlaced < this.currentDifficulty.mines) {
            const row = Math.floor(Math.random() * this.currentDifficulty.rows);
            const col = Math.floor(Math.random() * this.currentDifficulty.cols);
            
            // Avoid placing mine on first click or where a mine already exists
            if (!this.grid[row][col].isMine && 
                !(row === firstClickRow && col === firstClickCol)) {
                this.grid[row][col].isMine = true;
                minesPlaced++;
            }
        }
        this.calculateAdjacentMines();
    }

    calculateAdjacentMines() {
        for (let row = 0; row < this.currentDifficulty.rows; row++) {
            for (let col = 0; col < this.currentDifficulty.cols; col++) {
                if (!this.grid[row][col].isMine) {
                    let count = 0;
                    this.forEachNeighbor(row, col, (r, c) => {
                        if (this.grid[r][c].isMine) count++;
                    });
                    this.grid[row][col].adjacentMines = count;
                }
            }
        }
    }

    forEachNeighbor(row, col, callback) {
        for (let r = Math.max(0, row - 1); r <= Math.min(row + 1, this.currentDifficulty.rows - 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(col + 1, this.currentDifficulty.cols - 1); c++) {
                if (r !== row || c !== col) {
                    callback(r, c);
                }
            }
        }
    }

    revealCell(row, col) {
        const cell = this.grid[row][col];
        if (cell.isRevealed || cell.isFlagged || this.gameOver) return;

        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(row, col);
            this.startTimer();
        }

        cell.isRevealed = true;
        cell.element.classList.add('revealed');

        if (cell.isMine) {
            this.gameOver = true;
            this.revealAllMines();
            document.getElementById('reset-button').textContent = '😵';
            this.stopTimer();
            return;
        }

        if (cell.adjacentMines > 0) {
            cell.element.textContent = cell.adjacentMines;
            cell.element.dataset.number = cell.adjacentMines;
        } else {
            this.forEachNeighbor(row, col, (r, c) => {
                if (!this.grid[r][c].isRevealed) {
                    this.revealCell(r, c);
                }
            });
        }

        if (this.checkWin()) {
            this.gameOver = true;
            document.getElementById('reset-button').textContent = '😎';
            this.stopTimer();
        }
    }

    toggleFlag(row, col) {
        const cell = this.grid[row][col];
        if (cell.isRevealed || this.gameOver) return;

        cell.isFlagged = !cell.isFlagged;
        cell.element.classList.toggle('flagged');
        this.flagCount += cell.isFlagged ? 1 : -1;
        this.updateMineCounter();
    }

    revealAllMines() {
        for (let row = 0; row < this.currentDifficulty.rows; row++) {
            for (let col = 0; col < this.currentDifficulty.cols; col++) {
                const cell = this.grid[row][col];
                if (cell.isMine) {
                    cell.element.classList.add('revealed', 'mine');
                    cell.element.textContent = '💣';
                }
            }
        }
    }

    checkWin() {
        for (let row = 0; row < this.currentDifficulty.rows; row++) {
            for (let col = 0; col < this.currentDifficulty.cols; col++) {
                const cell = this.grid[row][col];
                if (!cell.isMine && !cell.isRevealed) return false;
            }
        }
        return true;
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimer();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        document.getElementById('timer').textContent = this.timer.toString().padStart(3, '0');
    }

    updateMineCounter() {
        const remaining = this.mineCount - this.flagCount;
        document.getElementById('mine-count').textContent = remaining.toString().padStart(3, '0');
    }

    setupEventListeners() {
        const grid = document.getElementById('grid');
        grid.addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (cell) {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                this.revealCell(row, col);
            }
        });

        grid.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const cell = e.target.closest('.cell');
            if (cell) {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                this.toggleFlag(row, col);
            }
        });

        document.getElementById('reset-button').addEventListener('click', () => {
            this.initializeGame(Object.keys(this.difficulties)[0]);
        });

        const difficultyButtons = document.querySelectorAll('.difficulty-selector button');
        difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.initializeGame(button.dataset.difficulty);
            });
        });
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Minesweeper();
});
