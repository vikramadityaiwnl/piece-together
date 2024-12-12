class PuzzleBoard {
  constructor(pieces) {
    this.pieces = pieces;
    this.boardElement = document.getElementById('puzzleBoard');
    this.trayElement = document.getElementById('piecesTray');
    this.selectedPiece = null;
    this.initBoard();
    this.initTray();
    this.setupEventListeners();
  }

  initBoard() {
    this.boardElement.innerHTML = '';
    this.boardElement.style.display = 'grid';
    this.boardElement.style.width = '400px';
    this.boardElement.style.height = '400px';
    this.boardElement.style.backgroundColor = '#f8fafc';
    this.boardElement.style.padding = '0.5rem';
    this.boardElement.style.borderRadius = '8px';
    this.boardElement.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    this.boardElement.style.gridTemplateColumns = `repeat(4, 95px)`;
    this.boardElement.style.gridTemplateRows = `repeat(4, 95px)`;

    for (let i = 0; i < 16; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.classList.add('puzzle-piece');
      emptyCell.style.backgroundSize = 'cover';
      emptyCell.style.backgroundPosition = 'center';
      emptyCell.style.cursor = 'pointer';
      emptyCell.style.width = '100%';
      emptyCell.style.height = '100%';

      if (i % 4 < 3) {
        emptyCell.style.borderRight = '1px solid #e2e8f0';
      }
      
      if (Math.floor(i / 4) < 3) {
        emptyCell.style.borderBottom = '1px solid #e2e8f0';
      }

      this.boardElement.appendChild(emptyCell);
    }

    this.boardElement.style.border = '1px solid #e2e8f0';
  }

  initTray() {
    this.trayElement.innerHTML = '';
    this.trayElement.style.display = 'grid';
    this.trayElement.style.gridTemplateColumns = 'repeat(2, 85px)';
    this.trayElement.style.gap = '0.5rem';
    this.trayElement.style.padding = '0.5rem';
    this.trayElement.style.justifyContent = 'space-evenly';
    this.trayElement.style.alignItems = 'center';
    
    for (let i = 0; i < 16; i++) {
      const slot = document.createElement('div');
      slot.classList.add('tray-piece');
      slot.style.border = '1px dashed #cbd5e1';
      slot.style.borderRadius = '4px';
      slot.style.height = '90px';
      slot.style.width = '90px';
      slot.style.aspectRatio = '1';
      this.trayElement.appendChild(slot);
    }

    this.pieces.forEach((piece, index) => {
      const slot = this.trayElement.children[index];
      slot.style.border = '1px solid #ccc';
      slot.style.backgroundSize = 'cover';
      slot.style.backgroundPosition = 'center';
      slot.style.cursor = 'pointer';
      slot.style.backgroundImage = `url(${piece.filepath})`;
      slot.dataset.correctPosition = piece.correct_position;
      slot.dataset.id = piece.id;
      slot.dataset.from = 'tray';
    });
  }

  /**
   * Setup event listeners for piece placement.
   */
  setupEventListeners() {
    this.boardElement.querySelectorAll('.puzzle-piece').forEach(cell => {
      cell.addEventListener('click', (e) => this.handleCellClick(e));
    });

    this.trayElement.querySelectorAll('.tray-piece').forEach(piece => {
      piece.addEventListener('click', (e) => this.handlePieceClick(e));
    });
  }

  /**
   * Handle clicks on board cells.
   * @param {Event} e - The click event.
   */
  handleCellClick(e) {
    const cell = e.target;

    if (this.selectedPiece) {
      if (cell === this.selectedPiece) {
        this.deselectPiece();
        return;
      }
      this.placePieceOnBoard(cell);
    } else if (cell.style.backgroundImage) {
      this.selectPiece(cell);
    }
  }

  /**
   * Handle clicks on tray pieces.
   * @param {Event} e - The click event.
   */
  handlePieceClick(e) {
    const piece = e.target;
    
    if (this.selectedPiece === piece) {
      this.deselectPiece();
    } else {
      this.selectPiece(piece);
    }
  }

  /**
   * Select a piece for placement.
   * @param {HTMLElement} piece - The piece element to select.
   */
  selectPiece(piece) {
    if (this.selectedPiece) {
      const isFromTray = this.selectedPiece.classList.contains('tray-piece');
      const borderStyle = isFromTray ? '1px solid #ccc' : '1px solid #e2e8f0';
      this.selectedPiece.style.border = borderStyle;
    }
    this.selectedPiece = piece;
    piece.style.border = '2px solid #3b82f6';
  }

  /**
   * Deselect the currently selected piece.
   */
  deselectPiece() {
    if (this.selectedPiece) {
      const isFromTray = this.selectedPiece.classList.contains('tray-piece');
      const borderStyle = isFromTray ? '1px solid #ccc' : '1px solid #e2e8f0';
      this.selectedPiece.style.border = borderStyle;
      this.selectedPiece = null;
    }
  }

  /**
   * Place a piece on the board.
   * @param {HTMLElement} cell - The target cell element.
   */
  placePieceOnBoard(cell) {
    if (!this.selectedPiece) return;

    const isFromTray = this.selectedPiece.classList.contains('tray-piece');
    const selectedImage = this.selectedPiece.style.backgroundImage;

    cell.style.backgroundImage = selectedImage;
    
    if (isFromTray) {
      this.selectedPiece.style.backgroundImage = '';
      this.selectedPiece.style.border = '1px dashed #cbd5e1';
      this.selectedPiece.style.cursor = 'default';
    } else {
      this.selectedPiece.style.backgroundImage = '';
    }

    this.deselectPiece();
  }
}

export default PuzzleBoard;