import GameManager from './GameManager.js';
import PuzzleBoard from './PuzzleBoard.js';
import ToastManager from './ToastManager.js';
import { sendMessage } from './utils.js';

class App {
  constructor() {
    this.toastManager = new ToastManager();
    this.initializeElements();
    this.setupEventListeners();
    this.gameState = null;
    this.initialData = null;
    this.reactionPanel = document.querySelector('.reaction-panel');
    this.initializeReactions();
    this.lastEmojiTime = 0;
    this.hintDialog = null;
    this.imageData = null;
  }

  /**
   * Initialize DOM elements.
   */
  initializeElements() {
    this.mainMenuScreen = document.getElementById('main-menu-screen');
    this.gameScreen = document.getElementById('game-screen');
    this.backgroundMusic = document.getElementById('background-music');
    this.soloButton = document.getElementById('solo-button');
    this.coopButton = document.getElementById('coop-button');
    this.soundToggleButton = document.getElementById('sound-toggle-button');
    this.hintButton = document.getElementById('hintButton');
    this.sidePanel = document.getElementById('sidePanel');
    this.panelToggles = document.querySelectorAll('.tab');
    this.panelContents = document.querySelectorAll('.panel-content');
    this.puzzleTitle = document.getElementById('puzzle-title');
    this.backButton = document.getElementById('back-button');
    this.puzzleBoard = document.getElementById('puzzleBoard');
    this.piecesTray = document.getElementById('piecesTray');
    this.timer = document.getElementById('timer');
    this.auditPanel = document.getElementById('audit-panel-content');
    this.mainMenuTitle = document.getElementById('main-menu-title');

    if (this.backButton) {
      this.backButton.addEventListener('click', () => {
        this.gameScreen.style.display = 'none';
        this.mainMenuScreen.style.display = 'block';
      });
    }
  }

  /**
   * Setup event listeners.
   */
  setupEventListeners() {
    window.addEventListener('message', (ev) => this.handleMessage(ev));

    this.soloButton.addEventListener('click', () => {
      sendMessage('start-solo');
    });
    this.coopButton.addEventListener('click', () => this.startGame('coop'));

    this.panelToggles.forEach(button => {
      button.addEventListener('click', () => {
        this.panelToggles.forEach(t => t.classList.remove('active'));
        button.classList.add('active');

        this.panelContents.forEach(p => p.classList.remove('active'));
        const panelId = `${button.dataset.tab}-panel`;
        document.getElementById(panelId)?.classList.add('active');
      });
    });

    document.querySelectorAll('.sub-tab').forEach(button => {
      button.addEventListener('click', () => {
        const parentPanel = button.closest('.panel-content');
        const subtabName = button.dataset.subtab;

        parentPanel.querySelectorAll('.sub-tab').forEach(tab => {
          tab.classList.toggle('active', tab === button);
        });

        parentPanel.querySelectorAll('.sub-panel-content').forEach(content => {
          content.classList.toggle('active', content.id === `${subtabName}-content`);
        });
      });
    });

    if (this.backButton) {
      this.backButton.addEventListener('click', () => {
        if (this.puzzleBoard) {
          this.puzzleBoard.resetModeElements();
        }
        this.gameState = null;
        this.gameScreen.style.display = 'none';
        this.mainMenuScreen.style.display = 'block';
        this.puzzleBoard.resetTimer()

        sendMessage('leave-coop');
      });
    }

    if (this.hintButton) {
      this.hintButton.addEventListener('click', () => {
        if (this.puzzleBoard.mode === 'solo') {
          this.toastManager.show(this.hint, 'info');
        }

        if (this.puzzleBoard.mode === 'coop') {
          sendMessage('get-hint', { username: this.initialData.username, mode: this.puzzleBoard.mode });
        }
      });
    }

    document.getElementById('audit-panel-content').addEventListener('click', (event) => {
      const pieceIdElement = event.target.closest('.audit-piece-id');
      if (pieceIdElement) {
        const pieceId = pieceIdElement.textContent;
        this.selectPieceById(pieceId);
      }
    });
  }

  /**
   * Handle incoming messages.
   * @param {MessageEvent} ev - The message event.
   */
  handleMessage(ev) {
    const { data, type } = ev.data;
    if (type !== 'devvit-message') return;

    const { message } = data;
    console.log('Received message:', message);
    if (!message) return;

    if (message.data.type === 'initialData') {
      this.handleInitialData(message.data.data);
    }

    if (message.data.type === 'show-toast') {
      this.toastManager.show(message.data.message, 'warning');
    }

    if (message.data.type === 'update-game-state') {
      if (this.puzzleBoard && this.puzzleBoard.mode === 'coop') {
        this.puzzleBoard.updateState(message.data.gameState);
      }
    }

    if (message.data.type === 'cooldown-update') {
      if (this.puzzleBoard && this.puzzleBoard.mode === 'coop') {
        this.puzzleBoard.updateCooldown(message.data.cooldown);
      }
    }

    if (message.data.type === 'audit-update') {
      this.updateAuditPanel(message.data.auditLog);
    }

    if (message.data.type === 'online-players-update') {
      this.updateOnlinePlayers(message.data.players);
    }

    if (message.data.type === 'send-emoji') {
      this.renderFloatingEmoji(message.data.emoji);
    }

    if (message.data.type === 'highlight-piece') {
      if (this.puzzleBoard) {
        this.puzzleBoard.handleHighlight(message.data.pieceId, message.data.color);
      }
    }

    if (message.data.type === 'deselect-piece') {
      if (this.puzzleBoard) {
        this.puzzleBoard.handleDeselect(message.data.pieceId);
      }
    }

    if (message.data.type === 'show-hint') {
      this.showHintDialog(message.data.message);
    }

    if (message.data.type === 'send-image-data') {
      this.imageData = message.data.imageData;
      this.hint = message.data.hint;
      this.showSubredditDialog().then(selectedSubreddit => {
        if (selectedSubreddit) {
          this.initializeGame('solo', selectedSubreddit);
        }
      });
    }
  }

  /**
   * Render floating emoji animation.
   * @param {string} emoji - The emoji to render.
   */
  renderFloatingEmoji(emoji) {
    const floatingEmoji = document.createElement('div');
    floatingEmoji.className = 'floating-emoji';
    floatingEmoji.textContent = emoji;
    floatingEmoji.style.left = `${window.innerWidth / 2}px`;
    floatingEmoji.style.top = `${window.innerHeight / 2}px`;
    document.body.appendChild(floatingEmoji);

    floatingEmoji.addEventListener('animationend', () => {
      floatingEmoji.remove();
    });
  }

  /**
   * Update the audit panel with new entries and update the leaderboard.
   * @param {Array} auditLog - Array of audit entries
   */
  updateAuditPanel(auditLog) {
    const auditHtml = [...auditLog].reverse().map(entry => {
      const time = new Date(entry.action.timestamp).toLocaleTimeString();
      const from = entry.action.from;
      const to = entry.action.to;
      const pieceId = entry.action.pieceId;
      const isCorrect = entry.action.isCorrect;

      return `
        <div class="audit-entry" data-is-correct="${isCorrect}">
          <div class="audit-header">
            <span class="audit-time" data-timestamp="${entry.action.timestamp}">${time}</span>
            <span class="audit-user" data-avatar="${entry.avatar || this.initialData.assets.dummyProfile}">${entry.username}</span>
          </div>
          <div class="audit-move">
            moved <span class="audit-piece-id">${pieceId}</span> 
            from <span class="audit-position">${from}</span>
            to
            <span class="audit-position">${to}</span>
          </div>
        </div>
      `;
    }).join('');

    this.auditPanel.innerHTML = auditHtml;
    this.auditPanel.scrollTop = this.auditPanel.scrollHeight;

    this.updateLeaderboard(auditLog);
  }

  /**
   * Update the leaderboard based on the audit log.
   * @param {Array} auditLog - Array of audit entries
   */
  updateLeaderboard(auditLog) {
    const scores = {};
    const movesCount = {};
    const correctMovesCount = {};
    const incorrectMovesCount = {};

    auditLog.forEach(entry => {
      const { username, action, avatar } = entry;
      const { isCorrect } = action;

      if (!scores[username]) {
        scores[username] = { score: 0, avatar };
        movesCount[username] = 0;
        correctMovesCount[username] = 0;
        incorrectMovesCount[username] = 0;
      }

      movesCount[username] += 1;

      if (isCorrect) {
        scores[username].score += 5;
        correctMovesCount[username] += 1;
      } else {
        scores[username].score -= 2;
        incorrectMovesCount[username] += 1;
      }
    });

    const sortedScores = Object.entries(scores).sort((a, b) => b[1].score - a[1].score);
    const leaderboardHtml = sortedScores.map(([username, { score, avatar }]) => `
      <div class="leaderboard-entry">
        <img src="${avatar}" alt="${username}'s avatar" class="leaderboard-avatar">
        <span class="leaderboard-username">${username}</span>
        <span class="leaderboard-score">${score}</span>
      </div>
    `).join('');

    document.querySelector('#rankings-content .rankings-list').innerHTML = leaderboardHtml;

    const mostActivePlayer = Object.entries(movesCount).sort((a, b) => b[1] - a[1])[0];
    const mostAccuratePlayer = Object.entries(correctMovesCount).sort((a, b) => b[1] - a[1])[0];
    const mostAdventurousPlayer = Object.entries(incorrectMovesCount).sort((a, b) => b[1] - a[1])[0];

    const dummyProfile = this.initialData.assets.dummyProfile;

    const mvpHtml = `
      <div class="mvp-card">
        <img src="${mostActivePlayer ? scores[mostActivePlayer[0]].avatar : dummyProfile}" alt="Avatar" class="mvp-avatar">
        <div class="mvp-content">
          <div class="mvp-title">Most Active Player</div>
          <div class="mvp-subtitle">${mostActivePlayer ? mostActivePlayer[0] : '-'}</div>
        </div>
      </div>
      <div class="mvp-card">
        <img src="${mostAccuratePlayer && mostAccuratePlayer[0] !== mostActivePlayer[0] ? scores[mostAccuratePlayer[0]].avatar : dummyProfile}" alt="Avatar" class="mvp-avatar">
        <div class="mvp-content">
          <div class="mvp-title">Most Accurate Player</div>
          <div class="mvp-subtitle">${mostAccuratePlayer && mostAccuratePlayer[0] !== mostActivePlayer[0] ? mostAccuratePlayer[0] : '-'}</div>
        </div>
      </div>
      <div class="mvp-card">
        <img src="${mostAdventurousPlayer && mostAdventurousPlayer[0] !== mostActivePlayer[0] && mostAdventurousPlayer[0] !== mostAccuratePlayer[0] ? scores[mostAdventurousPlayer[0]].avatar : dummyProfile}" alt="Avatar" class="mvp-avatar">
        <div class="mvp-content">
          <div class="mvp-title">Most Adventurous Player</div>
          <div class="mvp-subtitle">${mostAdventurousPlayer && mostAdventurousPlayer[0] !== mostActivePlayer[0] && mostAdventurousPlayer[0] !== mostAccuratePlayer[0] ? mostAdventurousPlayer[0] : '-'}</div>
        </div>
      </div>
    `;

    document.querySelector('#mvp-content').innerHTML = mvpHtml;
  }

  /**
   * Start the game with the given mode.
   * @param {'solo' | 'coop'} mode - The game mode.
   */
  startGame(mode) {
    if (mode === 'coop') {
      sendMessage('start-coop');
    }

    this.mainMenuScreen.style.display = 'none';
    this.gameScreen.style.display = 'block';

    const image = this.initialData.image;

    if (!image) {
      console.error('No image found');
      return;
    }

    this.puzzleTitle.textContent = `r/${image.subreddit}`

    this.gameManager = new GameManager(mode, this.sessionId);

    this.initializePuzzleBoard(mode, mode === 'coop' ? this.initialData.gameState : null, image);

    if (mode === 'coop') {
      if (this.initialData.auditLog) this.updateAuditPanel(this.initialData.auditLog);
      if (this.initialData.onlinePlayers) this.updateOnlinePlayers(this.initialData.onlinePlayers);
    }
  }

  /**
   * Handle initial data received from the message.
   * @param {Object} data - The initial data.
   * @param {Object} data.assets - The assets data.
   */
  handleInitialData(data) {
    const { assets, username, startedAt, gameState } = data;

    if (this.soloButton) this.soloButton.setAttribute('src', assets.solo);
    if (this.coopButton) this.coopButton.setAttribute('src', assets.coop);
    if (this.backgroundMusic) {
      this.backgroundMusic.setAttribute('src', assets.backgroundMusic);
      this.backgroundMusic.load();
    }
    if (this.mainMenuScreen) {
      this.mainMenuScreen.style.backgroundImage = `url(${assets.mainMenuBackground})`;
      this.mainMenuScreen.style.display = 'block';
      this.gameScreen.style.display = 'none';
    }
    if (this.mainMenuTitle) this.mainMenuTitle.style.backgroundImage = `url(${assets.title})`;
    this.initialData = data;
    this.sessionId = data.sessionId;
    this.setupSoundToggleButton(assets);

    if (startedAt) {
      this.startedAt = startedAt;
    }

    this.toastManager.showWelcomeToast(username);
  }

  /**
   * Setup the sound toggle button functionality.
   * @param {Object} assets - The assets data.
   */
  setupSoundToggleButton(assets) {
    this.soundToggleButton.setAttribute('src', assets.soundOn);

    this.soundToggleButton.addEventListener('click', () => {
      if (this.backgroundMusic.src) {
        if (this.backgroundMusic.paused) {
          this.backgroundMusic.play().catch(error => console.error('Error playing audio:', error));
          this.soundToggleButton.setAttribute('src', assets.soundOn);
        } else {
          this.backgroundMusic.pause();
          this.soundToggleButton.setAttribute('src', assets.soundOff);
        }
      } else {
        console.error('Background music source is not set.');
      }
    });
  }

  /**
   * Toggle the visibility of the specified panel.
   * @param {string} panelId - The ID of the panel to toggle.
   */
  togglePanel(panelId) {
    this.panelContents.forEach(panel => {
      if (panel.id === `${panelId}-panel`) {
        panel.classList.toggle('active');
      } else {
        panel.classList.remove('active');
      }
    });
    this.sidePanel.classList.toggle('active');
  }

  /**
   * Initialize the puzzle board with the puzzle pieces.
   */
  initializePuzzleBoard(mode, gameState = null, image) {
    const currentUser = this.initialData.username;
    this.onlinePlayers = this.onlinePlayers || [];
    const player = this.onlinePlayers.find(player => player.username === currentUser);
    const playerColor = player ? player.color : '#3b82f6';

    this.puzzleBoard = new PuzzleBoard(
      image.pieces,
      mode,
      this.sessionId,
      gameState,
      this.initialData.username,
      this.initialData.cooldown,
      mode === 'coop' ? this.startedAt : null,
      playerColor,
      image.subreddit,
      this.hint
    );
  }

  updateOnlinePlayers(players) {
    this.onlinePlayers = this.onlinePlayers || [];
    players.forEach(newPlayer => {
      const existingPlayerIndex = this.onlinePlayers.findIndex(player => player.username === newPlayer.username);
      if (existingPlayerIndex !== -1) {
        this.onlinePlayers[existingPlayerIndex] = newPlayer;
      } else {
        this.onlinePlayers.push(newPlayer);
      }
    });
    this.renderOnlinePlayers();

    const currentUser = this.initialData.username;
    const player = this.onlinePlayers.find(player => player.username === currentUser);
    if (player && this.puzzleBoard) {
      this.puzzleBoard.updatePlayerColor(player.color);
    }
  }

  renderOnlinePlayers() {
    const list = document.querySelector('.online-players-list');
    if (!list) return;

    list.innerHTML = this.onlinePlayers
      .map(({ username, color, avatar }) => `
        <div class="online-player">
          <img src="${avatar}" alt="${username}'s avatar" class="player-avatar">
          <div class="player-color-badge" style="background-color: ${color}"></div>
          <span class="player-name">${username}</span>
        </div>
      `).join('');
  }

  /**
   * Initialize reaction buttons.
   */
  initializeReactions() {
    if (this.reactionPanel) {
      this.reactionPanel.addEventListener('click', (event) => {
        const button = event.target.closest('.reaction-button');
        if (button) {
          const emoji = button.dataset.emoji;
          const now = Date.now();
          if (now - this.lastEmojiTime >= 250) {
            this.showFloatingEmoji(emoji, button);
            this.lastEmojiTime = now;
          }
        }
      });
    }
  }

  /**
   * Show floating emoji animation.
   * @param {string} emoji - The emoji to show.
   * @param {HTMLElement} button - The button element.
   */
  showFloatingEmoji(emoji, button) {
    const floatingEmoji = document.createElement('div');
    floatingEmoji.className = 'floating-emoji';
    floatingEmoji.textContent = emoji;
    const rect = button.getBoundingClientRect();
    floatingEmoji.style.left = `${rect.left + rect.width / 2}px`;
    floatingEmoji.style.top = `${rect.top}px`;
    document.body.appendChild(floatingEmoji);

    floatingEmoji.addEventListener('animationend', () => {
      floatingEmoji.remove();
    });

    sendMessage('send-emoji', { emoji, username: this.initialData.username, sessionId: this.sessionId });
  }

  /**
   * Show the hint dialog with the provided hint message.
   * @param {string} hint - The hint message to display.
   */
  showHintDialog(hint) {
    if (this.hintDialog) {
      this.hintDialog.remove();
    }

    this.hintDialog = document.createElement('div');
    this.hintDialog.className = 'hint-dialog';
    this.hintDialog.innerHTML = `
      <h2>Hint</h2>
      <p>${hint}</p>
      <button>Close</button>
    `;

    document.body.appendChild(this.hintDialog);

    this.hintDialog.querySelector('button').addEventListener('click', () => {
      this.hintDialog.remove();
      this.hintDialog = null;
    });
  }

  /**
   * Show subreddit selection dialog.
   * @returns {Promise<string>} Selected subreddit name
   */
  showSubredditDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'subreddit-dialog';

    return new Promise((resolve) => {
      const subreddits = [...new Set(this.imageData.map(image => image.subreddit))];

      dialog.innerHTML = `
        <div class="subreddit-dialog-content">
          <h2>Select Subreddit</h2>
          <div class="subreddit-list">
            ${subreddits.map(subreddit => `
              <button class="subreddit-button" data-subreddit="${subreddit}">
                r/${subreddit}
              </button>
            `).join('')}
          </div>
          <button class="dialog-close">Close</button>
        </div>
      `;

      document.body.appendChild(dialog);

      dialog.querySelectorAll('.subreddit-button').forEach(button => {
        button.addEventListener('click', () => {
          const subreddit = button.dataset.subreddit;
          resolve(subreddit);
          dialog.remove();
        });
      });

      dialog.querySelector('.dialog-close').addEventListener('click', () => {
        resolve(null);
        dialog.remove();
      });
    });
  }

  /**
   * Initialize the game with selected settings
   * @param {string} mode - Game mode
   * @param {string} [selectedSubreddit] - Selected subreddit for solo mode
   */
  initializeGame(mode, selectedSubreddit = null) {
    if (selectedSubreddit) {
      const subredditImages = this.imageData.filter(img => img.subreddit === selectedSubreddit);
      if (subredditImages.length > 0) {
        const randomImage = subredditImages[Math.floor(Math.random() * subredditImages.length)];
        this.initialData.image = randomImage;
        this.startGame('solo');
        return;
      }
    }

    this.startGame(mode);
  }

  /**
   * Select a piece by its ID.
   * @param {string} pieceId - The ID of the piece to select.
   */
  selectPieceById(pieceId) {
    const piece = [...this.puzzleBoard.boardElement.children, ...this.puzzleBoard.trayElement.children]
      .find(el => el.dataset.id === pieceId);
    if (piece) {
      if (this.puzzleBoard.selectedPiece) {
        sendMessage('deselect-piece', {
          pieceId: this.puzzleBoard.selectedPiece.dataset.id,
          sessionId: this.sessionId
        });
      }

      this.puzzleBoard.selectPiece(piece);
    }
  }
}

new App();
