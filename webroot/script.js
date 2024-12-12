import GameManager from './GameManager.js';
import PuzzleBoard from './PuzzleBoard.js';

class App {
  constructor() {
    this.initializeElements();
    this.setupEventListeners();
  }

  /**
   * Initialize DOM elements.
   */
  initializeElements() {
    this.mainMenuScreen = document.getElementById('main-menu-screen');
    this.gameScreen = document.getElementById('game-screen');
    this.backgroundMusic = document.getElementById('background-music');
    this.soloButton = document.getElementById('solo-button');
    this.coopButton = document.getElementById('co-op-button');
    this.soundToggleButton = document.getElementById('sound-toggle-button');
    this.hintButton = document.getElementById('hintButton');
    this.sidePanel = document.getElementById('sidePanel');
    this.panelToggles = document.querySelectorAll('.panel-toggle');
    this.panelContents = document.querySelectorAll('.panel-content');
    this.puzzleTitle = document.getElementById('puzzle-title');
  }

  /**
   * Setup event listeners.
   */
  setupEventListeners() {
    window.addEventListener('message', (ev) => this.handleMessage(ev));

    this.soloButton.addEventListener('click', () => this.startGame('solo'));
    this.coopButton.addEventListener('click', () => this.startGame('co-op'));

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

    if (message?.data.type === 'initialData') {
      this.handleInitialData(message.data.data);
    }
  }

  /**
   * Start the game with the given mode.
   * @param {'solo' | 'co-op'} mode - The game mode.
   * 
   */
  startGame(mode) {
    this.mainMenuScreen.style.display = 'none';
    this.gameScreen.style.display = 'block';
    this.puzzleTitle.textContent = `r/${this.initialData.image.subreddit}`
    this.gameManager = new GameManager(mode);
    this.initializePuzzleBoard();
  }

  /**
   * Handle initial data received from the message.
   * @param {Object} data - The initial data.
   * @param {Object} data.assets - The assets data.
   */
  handleInitialData(data) {
    const { assets } = data;

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
    this.setupSoundToggleButton(assets);
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
  initializePuzzleBoard() {
    const { image } = this.initialData;
    this.puzzleBoard = new PuzzleBoard(image.pieces);
  }
}

new App();
