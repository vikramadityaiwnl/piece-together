import { sendMessage, getCooldownMessage, formatRemainingTime } from "./utils.js";

class PuzzleBoard {
  /**
   * Initialize the puzzle board.
   * @param {Object[]} pieces - The puzzle pieces.
   * @param {'solo' | 'coop'} mode - The game mode.
   * @param {string} sessionId - The session ID.
   * @param {Object} gameState - The game state.
   * @param {string} username - The username.
   * @param {number} [cooldown] - Initial cooldown timestamp.
   */
  constructor(pieces, mode, sessionId, gameState = null, username, cooldown) {
    this.pieces = pieces;
    this.mode = mode;
    this.sessionId = sessionId;
    this.username = username;
    this.cooldownDuration = 60000; // Move this before lastMoveTime initialization
    
    // Calculate lastMoveTime based on cooldown from Redis
    if (cooldown) {
      // If we have a Redis cooldown timestamp, calculate when the last move was made
      const now = Date.now();
      if (cooldown > now) {
        this.lastMoveTime = now - (this.cooldownDuration - (cooldown - now));
      } else {
        this.lastMoveTime = 0;
      }
    } else {
      this.lastMoveTime = 0;
    }

    this.timerStarted = false;
    this.timerElement = document.getElementById('timer');
    this.startTime = 0;
    this.timerInterval = null;

    if (mode === 'solo') {
      this.timerElement.classList.add('active');
    }

    this.boardElement = document.getElementById('puzzleBoard');
    this.trayElement = document.getElementById('piecesTray');
    this.selectedPiece = null;
    const isNewGame = !gameState || (gameState.board.length === 0 && gameState.tray.length === 0);
    this.initBoard(isNewGame ? null : gameState.board);
    this.initTray(isNewGame ? null : gameState.tray);
    this.setupEventListeners();
  }

  initBoard(boardState = null) {
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
      emptyCell.dataset.from = `position-${i + 1}`;

      if (i % 4 < 3) {
        emptyCell.style.borderRight = '1px solid #e2e8f0';
      }
      
      if (Math.floor(i / 4) < 3) {
        emptyCell.style.borderBottom = '1px solid #e2e8f0';
      }

      this.boardElement.appendChild(emptyCell);
    }

    const cells = Array.from(this.boardElement.children);
    if (boardState) {
      boardState.forEach((state, index) => {
        const cell = cells[index];
        cell.style.backgroundImage = state.backgroundImage;
        if (state.backgroundImage) {
          cell.style.cursor = 'pointer';
        }
      });
    }

    this.boardElement.style.border = '1px solid #e2e8f0';
  }

  initTray(trayState = null) {
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
      slot.dataset.from = 'tray';
      this.trayElement.appendChild(slot);
    }

    const slots = Array.from(this.trayElement.children);
    if (trayState && trayState.length > 0) {
      trayState.forEach((state, index) => {
        const slot = slots[index];
        slot.style.backgroundImage = state.backgroundImage;
        slot.dataset.id = state.id;
        
        if (state.backgroundImage) {
          slot.style.border = '1px solid #ccc';
          slot.style.backgroundSize = 'cover';
          slot.style.backgroundPosition = 'center';
          slot.style.cursor = 'pointer';
        } else {
          slot.style.border = '1px dashed #cbd5e1';
          slot.style.cursor = 'default';
        }
      });
    } else {
      // Shuffle pieces
      const shuffledPieces = this.pieces.sort(() => Math.random() - 0.5);

      shuffledPieces.forEach((piece, index) => {
        const slot = slots[index];
        slot.style.border = '1px solid #ccc';
        slot.style.backgroundSize = 'cover';
        slot.style.backgroundPosition = 'center';
        slot.style.cursor = 'pointer';
        slot.style.backgroundImage = `url(${piece.filepath})`;
        slot.dataset.id = piece.id;
        slot.dataset.from = 'tray';
      });
    }
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
      // Proceed with placement only if we have a valid piece selected
      if (this.selectedPiece.style.backgroundImage) {
        this.placePieceOnBoard(cell);
      }
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
    
    // Don't allow selecting empty tray slots
    if (!piece.style.backgroundImage) return;
    
    if (this.selectedPiece === piece) {
      this.deselectPiece();
    } else {
      this.selectPiece(piece);
    }
  }

  /**
   * Highlight or unhighlight a piece
   * @param {HTMLElement} piece - The piece to highlight
   * @param {boolean} [highlight=true] - Whether to highlight or unhighlight
   */
  highlightPiece(piece, highlight = true) {
    if (!piece) return;
    
    const isFromTray = piece.classList.contains('tray-piece');
    const borderStyle = highlight ? 
      '2px solid #3b82f6' : 
      (isFromTray ? '1px solid #ccc' : '1px solid #e2e8f0');
    piece.style.border = borderStyle;
  }

  /**
   * Select a piece for placement.
   * @param {HTMLElement} piece - The piece element to select.
   */
  async selectPiece(piece) {
    if (this.selectedPiece) {
      this.highlightPiece(this.selectedPiece, false);
    }
    
    // Highlight the piece first
    this.selectedPiece = piece;
    this.highlightPiece(piece);

    // Then check cooldown and revert if needed
    if (!(await this.checkCooldown())) {
      this.deselectPiece();
      return;
    }

    this.startTimer();
  }

  /**
   * Deselect the currently selected piece.
   */
  deselectPiece() {
    if (this.selectedPiece) {
      this.highlightPiece(this.selectedPiece, false);
      this.selectedPiece = null;
    }
  }

  /**
   * Find first empty slot in the tray
   * @returns {HTMLElement|null} Empty tray slot or null if none found
   */
  findEmptyTraySlot() {
    return Array.from(this.trayElement.children).find(slot => !slot.style.backgroundImage);
  }

  /**
   * Place a piece on the board.
   * @param {HTMLElement} cell - The target cell element.
   */
  placePieceOnBoard(cell) {
    if (!this.selectedPiece) return;

    const isFromTray = this.selectedPiece.classList.contains('tray-piece');
    const selectedImage = this.selectedPiece.style.backgroundImage;
    const targetImage = cell.style.backgroundImage;

    // If target cell has a piece and we're coming from tray, 
    // find empty tray slot for the displaced piece
    if (targetImage && isFromTray) {
      const emptySlot = this.findEmptyTraySlot();
      if (!emptySlot) {
        // No empty slot found, can't make the move
        this.deselectPiece();
        return;
      }
      // Move displaced piece to tray
      emptySlot.style.backgroundImage = targetImage;
      emptySlot.style.border = '1px solid #ccc';
      emptySlot.style.backgroundSize = 'cover';
      emptySlot.style.backgroundPosition = 'center';
      emptySlot.style.cursor = 'pointer';
    }

    // Place selected piece in target cell
    cell.style.backgroundImage = selectedImage;
    
    if (isFromTray) {
      this.selectedPiece.style.backgroundImage = '';
      this.selectedPiece.style.border = '1px dashed #cbd5e1';
      this.selectedPiece.style.cursor = 'default';
    } else {
      // Handle board-to-board movement
      if (targetImage) {
        this.selectedPiece.style.backgroundImage = targetImage;
      } else {
        this.selectedPiece.style.backgroundImage = '';
      }
    }

    this.lastMoveTime = Date.now();
    if (this.mode === 'coop') {
      sendMessage('add-cooldown', {
        username: this.username
      });
    }

    this.deselectPiece();
    if (this.mode === 'coop') {
      this.saveGameState();
    }
  }

  async checkCooldown() {
    if (this.mode !== 'coop') return true;
    
    const now = Date.now();
    const timeSinceLastMove = now - this.lastMoveTime;
    
    if (timeSinceLastMove < this.cooldownDuration) {
      const remainingTime = this.cooldownDuration - timeSinceLastMove;
      const remainingSeconds = formatRemainingTime(remainingTime);
      const message = getCooldownMessage(remainingSeconds);
      sendMessage('show-toast', { message });
      return false;
    }
    
    return true;
  }

  startTimer() {
    if (this.mode !== 'solo' || this.timerStarted) return;
    
    this.timerStarted = true;
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      this.timerElement.querySelector('.timer-text').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Save the current game state.
   * Only used in co-op mode.
   */
  saveGameState() {
    if (this.mode !== 'coop') return;

    const boardState = Array.from(this.boardElement.children).map(cell => ({
      backgroundImage: cell.style.backgroundImage,
    }));

    const trayState = Array.from(this.trayElement.children).map(slot => ({
      backgroundImage: slot.style.backgroundImage,
      id: slot.dataset.id || null,
    }));

    sendMessage('update-game-state', {
      gameState: { board: boardState, tray: trayState },
      sessionId: this.sessionId
    });
  }
}

export default PuzzleBoard;