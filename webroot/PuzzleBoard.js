import { sendMessage, getCooldownMessage, formatRemainingTime } from "./utils.js";

export default class PuzzleBoard {
  /**
   * Initialize the puzzle board.
   * @param {Object[]} pieces - The puzzle pieces.
   * @param {'solo' | 'coop'} mode - The game mode.
   * @param {string} sessionId - The session ID.
   * @param {Object} gameState - The game state.
   * @param {string} username - The username.
   * @param {number} [cooldown] - Initial cooldown timestamp.
   * @param {number} [startTime] - Initial start time for countdown timer.
   * @param {string} playerColor - The color assigned to the player.
   */
  constructor(pieces, mode, sessionId, gameState = null, username, cooldown, startTime = null, playerColor) {
    this.pieces = pieces;
    this.mode = mode;
    this.sessionId = sessionId;
    this.username = username;
    this.cooldownDuration = 60000;
    this.initialTime = startTime ? parseInt(startTime) : null;
    this.lastMoveTime = 0;
    
    this.onlinePlayers = [];
    this.playerColor = playerColor; 
    this.isCompleted = false; 

    this.boardElement = document.getElementById('puzzleBoard');
    this.boardElement.classList.remove('completed');

    this.trayElement = document.getElementById('piecesTray');
    this.timerElement = document.getElementById('timer');
    
    if (!this.boardElement || !this.trayElement || !this.timerElement) {
      throw new Error('Required DOM elements not found');
    }

    this.selectedPiece = null;
    this.boardState = null;
    this.trayState = null;
    this.timerStarted = false;
    this.startTime = 0;
    this.timerInterval = null;

    this.initializeModeElements(mode);

    this.initBoard(gameState ? gameState.board : null);
    this.initTray(gameState ? gameState.tray : null);

    if (gameState) {
      this.updateState(gameState);
    }

    if (cooldown) {
      this.updateCooldown(cooldown);
    }

    if (mode === 'solo') {
      this.timerElement.classList.add('active');
    }
    
    if (mode === 'coop' && this.initialTime) {
      this.startTimer();
    }

    this.setupEventListeners();

    this.onlinePlayersButton = document.getElementById('online-players-button');
    this.onlinePlayersPanel = document.getElementById('online-players-panel');
    
    if (this.onlinePlayersButton && this.onlinePlayersPanel) {
      this.onlinePlayersButton.addEventListener('click', () => {
        this.onlinePlayersPanel.classList.toggle('active');
      });

      document.addEventListener('click', (e) => {
        if (!this.onlinePlayersButton.contains(e.target) && 
            !this.onlinePlayersPanel.contains(e.target)) {
          this.onlinePlayersPanel.classList.remove('active');
        }
      });
    }
  }

  /**
   * Initialize mode-specific elements
   * @param {'solo' | 'coop'} mode - The game mode
   */
  initializeModeElements(mode) {
    this.timerElement.classList.add('active');

    document.querySelectorAll('[data-mode="coop"]').forEach(element => {
      if (mode === 'coop') {
        element.classList.add('active');
      } else {
        element.classList.remove('active');
      }
    });

    if (mode === 'solo') {
      document.getElementById('leaderboard-panel').style.opacity = '0';
      document.getElementById('audit-panel').style.opacity = '0';
      document.getElementById('leaderboard-panel').style.pointerEvents = 'none';
      document.getElementById('audit-panel').style.pointerEvents = 'none';
    } else {
      document.getElementById('leaderboard-panel').style.opacity = '1';
      document.getElementById('audit-panel').style.opacity = '1';
      document.getElementById('leaderboard-panel').style.pointerEvents = 'auto';
      document.getElementById('audit-panel').style.pointerEvents = 'auto';
    }
  }

  // Add new method to reset mode-specific elements
  resetModeElements() {
    // Reset timer
    this.timerElement.classList.remove('active');
    this.stopTimer();
    
    // Reset all coop elements
    document.querySelectorAll('[data-mode="coop"]').forEach(element => {
      element.classList.remove('active');
    });
    
    // Reset panels
    const panels = ['leaderboard-panel', 'audit-panel'];
    panels.forEach(panelId => {
      const panel = document.getElementById(panelId);
      if (panel) {
        panel.style.opacity = '1';
        panel.style.pointerEvents = 'auto';
      }
    });
  }

  initBoard(boardState = null) {
    this.boardState = boardState;
    this.boardElement.innerHTML = '';

    for (let i = 0; i < 16; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.classList.add('puzzle-piece');
      emptyCell.dataset.from = `position-${i + 1}`;
      this.boardElement.appendChild(emptyCell);
    }

    const cells = Array.from(this.boardElement.children);
    if (boardState) {
      boardState.forEach((state, index) => {
        const cell = cells[index];
        cell.style.backgroundImage = state.backgroundImage;
        cell.dataset.id = state.pieceId;
      });
    }
  }

  initTray(trayState = null) {
    this.trayState = trayState;
    this.trayElement.innerHTML = '';
    
    for (let i = 0; i < 16; i++) {
      const slot = document.createElement('div');
      slot.classList.add('tray-piece');
      slot.dataset.from = 'tray';
      this.trayElement.appendChild(slot);
    }

    const slots = Array.from(this.trayElement.children);
    if (trayState && trayState.length > 0) {
      trayState.forEach((state, index) => {
        const slot = slots[index];
        slot.style.backgroundImage = state.backgroundImage;
        slot.dataset.id = state.id;
      });
    } else {
      const shuffledPieces = this.pieces.sort(() => Math.random() - 0.5);
      shuffledPieces.forEach((piece, index) => {
        const slot = slots[index];
        slot.style.backgroundImage = `url(${piece.filepath})`;
        slot.dataset.id = piece.id;
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
    if (this.isCompleted) return;
    
    const cell = e.target;

    if (this.selectedPiece) {
      if (cell === this.selectedPiece) {
        this.deselectPiece();
        return;
      }
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
    if (this.isCompleted) return;
    
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
   * @param {string} [color] - The color to use for highlighting
   */
  highlightPiece(piece, highlight = true, color = this.playerColor) {
    if (!piece) return;
    
    const isFromTray = piece.classList.contains('tray-piece');
    const borderStyle = highlight ? 
      `2px solid ${color}` : 
      (isFromTray ? '1px solid #ccc' : '1px solid #e2e8f0');
    piece.style.border = borderStyle;
  }

  /**
   * Select a piece for placement.
   * @param {HTMLElement} piece - The piece element to select.
   */
  async selectPiece(piece) {
    if (this.selectedPiece === piece) {
      this.deselectPiece();
      return;
    }

    if (this.selectedPiece) {
      this.highlightPiece(this.selectedPiece, false);
    }
    
    this.selectedPiece = piece;
    this.highlightPiece(piece);

    if (this.mode === 'coop') {
      sendMessage('highlight-piece', {
        pieceId: piece.dataset.id,
        color: this.playerColor,
        sessionId: this.sessionId
      });
    }

    if (!(await this.checkCooldown())) {
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

      if (this.mode === 'coop') {
        sendMessage('deselect-piece', {
          pieceId: this.selectedPiece.dataset.id,
          sessionId: this.sessionId
        });
      }
      this.selectedPiece = null;
    }
  }

  /**
   * Handle incoming deselect messages.
   * @param {string} pieceId - The ID of the piece to deselect.
   */
  handleDeselect(pieceId) {
    const piece = [...this.boardElement.children, ...this.trayElement.children]
      .find(el => el.dataset.id === pieceId);
    if (piece) {
      this.highlightPiece(piece, false);
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
  async placePieceOnBoard(cell) {
    if (!this.selectedPiece) return;

    if (this.mode === 'coop' && !(await this.checkCooldown())) {
      return;
    }

    const isFromTray = this.selectedPiece.classList.contains('tray-piece');
    const selectedImage = this.selectedPiece.style.backgroundImage;
    const targetImage = cell.style.backgroundImage;
    const pieceId = this.selectedPiece.dataset.id; 
    
    // Store the target cell's piece ID before swap
    const targetPieceId = cell.dataset.id;

    if (targetImage && isFromTray) {
      const emptySlot = this.findEmptyTraySlot();
      if (!emptySlot) {
        this.deselectPiece();
        return;
      }
      emptySlot.style.backgroundImage = targetImage;
      emptySlot.style.border = '1px solid #ccc';
      emptySlot.style.backgroundSize = 'cover';
      emptySlot.style.backgroundPosition = 'center';
      emptySlot.style.cursor = 'pointer';
      emptySlot.dataset.id = targetPieceId; // Use stored piece ID
    }

    cell.style.backgroundImage = selectedImage;
    cell.dataset.id = pieceId;
    
    if (isFromTray) {
      this.selectedPiece.style.backgroundImage = '';
      this.selectedPiece.style.border = '1px dashed #cbd5e1';
      this.selectedPiece.style.cursor = 'default';
      this.selectedPiece.dataset.id = '';
    } else {
      if (targetImage) {
        this.selectedPiece.style.backgroundImage = targetImage;
        this.selectedPiece.dataset.id = targetPieceId; // Use stored piece ID
      } else {
        this.selectedPiece.style.backgroundImage = '';
        this.selectedPiece.dataset.id = '';
      }
    }

    this.lastMoveTime = Date.now();
    if (this.mode === 'coop') {
      sendMessage('add-cooldown', {
        username: this.username,
        sessionId: this.sessionId
      });
      this.saveGameState(cell.dataset.from, this.selectedPiece.dataset.from, pieceId);
    }

    this.deselectPiece();
    
    // Add a small delay before checking completion to ensure DOM is updated
    setTimeout(() => this.checkPuzzleCompletion(), 0);
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
    if (this.timerStarted) return;
    
    this.timerStarted = true;
    this.startTime = Date.now();

    const updateTimer = () => {
      const now = Date.now();
      let displayTime;

      if (this.mode === 'coop' && this.initialTime) {
        const timeLeft = Math.max(0, this.initialTime + (60 * 60 * 1000) - now);
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (timeLeft === 0) {
          this.stopTimer();
          this.disablePieceMovement()
        }
      } else {
        const elapsed = now - this.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }

      this.timerElement.querySelector('.timer-text').textContent = displayTime;
    };

    updateTimer();
    this.timerInterval = setInterval(updateTimer, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  resetTimer() {
    this.stopTimer();
    this.timerStarted = false;
    this.startTime = 0;
    this.timerElement.querySelector('.timer-text').textContent = '00:00';
  }

  /**
   * Save the current game state.
   * Only used in co-op mode.
   */
  saveGameState(toPosition, fromPosition, pieceId) {
    if (this.mode !== 'coop') return;

    const boardState = Array.from(this.boardElement.children).map(cell => ({
      backgroundImage: cell.style.backgroundImage,
      pieceId: cell.dataset.id,
    }));

    const trayState = Array.from(this.trayElement.children).map(slot => ({
      backgroundImage: slot.style.backgroundImage,
      id: slot.dataset.id,
    }));

    const gameState = { board: boardState, tray: trayState };
    sendMessage('update-game-state', {
      gameState,
      sessionId: this.sessionId
    });

    sendMessage('add-audit', {
      username: this.username,
      sessionId: this.sessionId,
      action: {
        from: fromPosition,
        to: toPosition,
        pieceId,
        timestamp: Date.now(),
        isCorrect: this.pieces.find(piece => piece.id === pieceId).correct_position === Number(toPosition.split('-')[1]) - 1
      }
    });
  }

  updateState(gameState) {
    if (!gameState) return;

    const boardPieces = this.boardElement.children;
    const trayPieces = this.trayElement.children;

    gameState.board.forEach((state, index) => {
      if (boardPieces[index]) {
        boardPieces[index].style.backgroundImage = state.backgroundImage;
        boardPieces[index].dataset.id = state.pieceId;
      }
    });

    gameState.tray.forEach((state, index) => {
      if (trayPieces[index]) {
        trayPieces[index].style.backgroundImage = state.backgroundImage;
        trayPieces[index].dataset.id = state.id;
      }
    });
  }

  updateCooldown(cooldown) {
    if (!cooldown) return;
    
    const now = Date.now();
    if (cooldown > now) {
      this.lastMoveTime = now - (this.cooldownDuration - (cooldown - now));
    } else {
      this.lastMoveTime = 0;
    }
  }

  /**
   * Handle incoming highlight messages.
   * @param {string} pieceId - The ID of the piece to highlight.
   * @param {string} color - The color to use for highlighting.
   */
  handleHighlight(pieceId, color) {
    const piece = [...this.boardElement.children, ...this.trayElement.children]
      .find(el => el.dataset.id === pieceId);
    if (piece) {
      this.highlightPiece(piece, true, color);
    }
  }

  /**
   * Check if the puzzle is completed correctly
   */
  checkPuzzleCompletion() {
    if (this.isCompleted) return;

    const boardPieces = Array.from(this.boardElement.children);
    
    const allFilled = boardPieces.every(cell => cell.style.backgroundImage);
    if (!allFilled) return;

    const allCorrect = boardPieces.every((cell) => {
      const pieceId = cell.dataset.id;
      if (!pieceId) return false;

      const position = Number(cell.dataset.from.split('-')[1]) - 1;
      const piece = this.pieces.find(p => p.id === pieceId);
      
      return piece && piece.correct_position === position;
    });

    if (allCorrect) {
      this.handlePuzzleCompletion();
    }
  }

  /**
   * Handle puzzle completion
   */
  handlePuzzleCompletion() {
    if (this.isCompleted) return;
    
    this.isCompleted = true;
    this.stopTimer();

    const completionTime = Date.now() - this.startTime;
    const minutes = Math.floor(completionTime / 60000);
    const seconds = Math.floor((completionTime % 60000) / 1000);
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    this.boardElement.classList.add('completed');
    
    if (this.mode === 'solo') {
      const dialog = document.getElementById('completion-dialog');
      const timeSpan = document.getElementById('completion-time');
      timeSpan.textContent = timeString;
      dialog.style.display = 'block';

      const postButton = dialog.querySelector('.post-button');
      const closeButton = dialog.querySelector('.close-button');

      postButton.onclick = () => {
        sendMessage('post-completion', {
          completionTime: timeString,
          username: this.username
        });
        dialog.style.display = 'none';
      };

      closeButton.onclick = () => {
        dialog.style.display = 'none';
      };
    } else {
      sendMessage('puzzle-completed', {
        sessionId: this.sessionId,
        completionTime: timeString,
        username: this.username
      });
    }

    this.disablePieceMovement();
  }

  /**
   * Disable piece movement after completion
   */
  disablePieceMovement() {
    this.boardElement.querySelectorAll('.puzzle-piece').forEach(cell => {
      cell.style.cursor = 'default';
      cell.style.pointerEvents = 'none'; // Add this line
    });

    this.trayElement.querySelectorAll('.tray-piece').forEach(piece => {
      piece.style.cursor = 'default';
      piece.style.pointerEvents = 'none'; // Add this line
    });

    this.deselectPiece();
  }

  /**
   * Update the player's color.
   * @param {string} color - The new color to use.
   */
  updatePlayerColor(color) {
    this.playerColor = color;
    if (this.selectedPiece) {
      this.highlightPiece(this.selectedPiece, true, color);
    }
  }
}