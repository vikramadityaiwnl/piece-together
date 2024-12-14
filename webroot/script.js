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
    this.panelToggles = document.querySelectorAll('.tab');  // Changed from .panel-toggle
    this.panelContents = document.querySelectorAll('.panel-content');
    this.puzzleTitle = document.getElementById('puzzle-title');
    this.backButton = document.getElementById('back-button');
    this.puzzleBoard = document.getElementById('puzzleBoard');
    this.piecesTray = document.getElementById('piecesTray');
    this.timer = document.getElementById('timer');
    this.auditPanel = document.getElementById('audit-panel-content'); // Ensure this line is present

    // Add back button handler
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

    this.soloButton.addEventListener('click', () => this.startGame('solo'));
    this.coopButton.addEventListener('click', () => this.startGame('coop'));

    // Update panel toggle handlers
    this.panelToggles.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all toggles first
        this.panelToggles.forEach(t => t.classList.remove('active'));
        // Add active class to clicked toggle
        button.classList.add('active');

        // Hide all panels first
        this.panelContents.forEach(p => p.classList.remove('active'));
        // Show the selected panel
        const panelId = `${button.dataset.tab}-panel`;
        document.getElementById(panelId)?.classList.add('active');
      });
    });

    // Add sub-panel tab handlers
    document.querySelectorAll('.sub-tab').forEach(button => {
      button.addEventListener('click', () => {
        const parentPanel = button.closest('.panel-content');
        const subtabName = button.dataset.subtab;
        
        // Update active state of tabs
        parentPanel.querySelectorAll('.sub-tab').forEach(tab => {
          tab.classList.toggle('active', tab === button);
        });
        
        // Update visibility of content panels
        parentPanel.querySelectorAll('.sub-panel-content').forEach(content => {
          content.classList.toggle('active', content.id === `${subtabName}-content`);
        });
      });
    });

    // Add handler for back button to reset mode elements and clear state
    if (this.backButton) {
      this.backButton.addEventListener('click', () => {
        if (this.puzzleBoard) {
          this.puzzleBoard.resetModeElements();
          this.puzzleBoard.resetState();
        }
        this.gameState = null;
        this.gameScreen.style.display = 'none';
        this.mainMenuScreen.style.display = 'block';

        sendMessage('leave-coop');
      });
    }
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
      // Update local state to match Redis state
      if (this.puzzleBoard && this.puzzleBoard.mode === 'coop') {
        this.puzzleBoard.updateState(message.data.gameState);
      }
    }

    if (message.data.type === 'cooldown-update') {
      // Update cooldown state when received from Redis
      if (this.puzzleBoard && this.puzzleBoard.mode === 'coop') {
        this.puzzleBoard.updateCooldown(message.data.cooldown);
      }
    }

    if (message.data.type === 'audit-update') {
      this.updateAuditPanel(message.data.auditLog);
    }

    // Add handling for online players update
    if (message.data.type === 'online-players-update') {
      this.updateOnlinePlayers(message.data.players);
    }
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
      
      return `
        <div class="audit-entry">
          <div class="audit-header">
            <span class="audit-time">${time}</span>
            <span class="audit-user">${entry.username}</span>
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

    // Update leaderboard
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
      const { from, to, pieceId } = action;

      // Ensure puzzleBoard and pieces are defined
      if (!this.puzzleBoard || !this.puzzleBoard.pieces) return;

      const piece = this.puzzleBoard.pieces.find(p => p.id === pieceId);
      if (!piece) return;

      const isCorrect = piece.correct_position === parseInt(to.split('-')[1] - 1);

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

    // Update MVPs
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
   * 
   */
  startGame(mode) {
    if (mode === 'coop') {
      sendMessage('start-coop');
    } else {
      sendMessage('start-solo');
    }

    this.mainMenuScreen.style.display = 'none';
    this.gameScreen.style.display = 'block';
    
    // Convert 'co-op' to 'coop' for consistency
    const normalizedMode = mode === 'co-op' ? 'coop' : mode;
    const image = this.initialData.image[normalizedMode];
    
    if (!image) {
      console.error(`No image found for mode: ${normalizedMode}`);
      return;
    }
    
    this.puzzleTitle.textContent = `r/${image.subreddit}`
    
    this.gameManager = new GameManager(mode, this.sessionId);

    // Request latest state from Redis for coop mode
    if (mode === 'coop') {
      sendMessage('get-game-state');
      sendMessage('get-cooldown');
    }
    
    this.initializePuzzleBoard(mode, null, image);

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
    const { assets, username } = data;

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
    this.initialData = data;
    this.sessionId = data.sessionId;  // Add this line
    this.setupSoundToggleButton(assets);

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
    this.puzzleBoard = new PuzzleBoard(
      image.pieces, 
      mode, 
      this.sessionId, 
      gameState,
      this.initialData.username,
      this.initialData.cooldown,
      mode === 'coop' ? image.startedAt : null  // Use startedAt instead of separate time
    );
  }

  // Add new methods for player management
  updateOnlinePlayers(players) {
    this.onlinePlayers = new Map(players.map(player => [player.username, player]));
    this.renderOnlinePlayers();
  }

  // Update the renderOnlinePlayers method to include avatars
  renderOnlinePlayers() {
    const list = document.querySelector('.online-players-list');
    if (!list) return;

    list.innerHTML = Array.from(this.onlinePlayers.values())
      .map(({ username, color, avatar }) => `
        <div class="online-player">
          <img src="${avatar}" alt="${username}'s avatar" class="player-avatar">
          <div class="player-color-badge" style="background-color: ${color}"></div>
          <span class="player-name">${username}</span>
        </div>
      `).join('');
  }
}

new App();
