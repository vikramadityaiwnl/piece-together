import GameManager from './GameManager.js';
import PuzzleBoard from './PuzzleBoard.js';
import ToastManager from './ToastManager.js';

class App {
  constructor() {
    this.toastManager = new ToastManager();
    this.initializeElements();
    this.setupEventListeners();
    
    this.sessionId = this.generateSessionId();
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

    this.panelToggles.forEach(button => {
      button.addEventListener('click', () => this.togglePanel(button.dataset.panel));
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
    if (!message) return

    if (message.data.type === 'initialData') {
      this.handleInitialData(message.data.data);
    }

    if (message.data.type === 'show-toast') {
      this.toastManager.show(message.data.message, 'warning');
    }
  }

  /**
   * Start the game with the given mode.
   * @param {'solo' | 'coop'} mode - The game mode.
   * 
   */
  startGame(mode) {
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
    // Only pass gameState for coop mode, null for solo
    const gameState = mode === 'coop' ? this.initialData.gameState : null;
    this.initializePuzzleBoard(mode, gameState, image);
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
      // Show main menu screen after assets are loaded
      this.mainMenuScreen.style.display = 'block';
      this.gameScreen.style.display = 'none';
    }
    this.initialData = data;
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
      this.initialData.cooldown
    );
  }

  /**
   * Generate session id
   */
  generateSessionId() { 
    return Math.random().toString(36).substring(2, 9);
  }
}

new App();
