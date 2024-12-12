class PuzzleBoard {
  constructor(pieces) {
    this.pieces = pieces;
    this.boardElement = document.getElementById('puzzleBoard');
    this.trayElement = document.getElementById('piecesTray');
    this.initBoard();
    this.initTray();
  }

  initBoard() {
    this.boardElement.innerHTML = '';
    this.boardElement.style.display = 'grid';
    this.boardElement.style.gap = '2px';
    this.boardElement.style.width = '320px';
    this.boardElement.style.height = '320px';
    this.boardElement.style.backgroundColor = '#f8fafc';
    this.boardElement.style.padding = '0.5rem';
    this.boardElement.style.borderRadius = '8px';
    this.boardElement.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    this.boardElement.style.gridTemplateColumns = `repeat(4, 1fr)`;
    this.boardElement.style.gridTemplateRows = `repeat(4, 1fr)`;

    for (let i = 0; i < 16; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.classList.add('puzzle-piece');
      emptyCell.style.backgroundSize = 'cover';
      emptyCell.style.backgroundPosition = 'center';
      emptyCell.style.border = '1px solid #ccc';
      emptyCell.style.cursor = 'pointer';
      emptyCell.textContent = i + 1;
      this.boardElement.appendChild(emptyCell);
    }
  }

  initTray() {
    this.trayElement.innerHTML = '';
    this.trayElement.style.display = 'grid';
    this.trayElement.style.gridTemplateColumns = 'repeat(2, 1fr)';
    this.trayElement.style.gap = '0.5rem';
    this.trayElement.style.padding = '0.5rem';
    this.trayElement.style.maxHeight = 'calc(100vh - 4rem)';
    this.trayElement.style.overflowY = 'auto';
    this.trayElement.style.backgroundColor = 'white';
    this.trayElement.style.border = '2px solid var(--primary-color)';
    this.trayElement.style.borderRadius = 'var(--border-radius)';
    this.trayElement.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';

    this.pieces.forEach(piece => {
      const pieceElement = document.createElement('div');
      pieceElement.classList.add('tray-piece');
      pieceElement.style.backgroundSize = 'cover';
      pieceElement.style.backgroundPosition = 'center';
      pieceElement.style.border = '1px solid #ccc';
      pieceElement.style.cursor = 'pointer';
      pieceElement.style.width = '60px';
      pieceElement.style.height = '60px';
      pieceElement.style.backgroundImage = `url(${piece.filepath})`;
      pieceElement.dataset.correctPosition = piece.correct_position;
      pieceElement.dataset.id = piece.id;
      pieceElement.dataset.from = `tray`;
      this.trayElement.appendChild(pieceElement);
    });
  }
}

export default PuzzleBoard;