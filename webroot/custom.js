import GameManager from './GameManager.js';
import PuzzleBoard from './PuzzleBoard.js';
import ToastManager from './ToastManager.js';
import { sendMessage } from './utils.js';

class CustomApp {
  constructor() {
    this.toastManager = new ToastManager();
    this.initializeElements();
    this.setupEventListeners();
    this.gameState = null;
    this.initialData = null;
    this.lastEmojiTime = 0;
  }

  /**
   * Initialize DOM elements.
   */
  initializeElements() {
    this.gameScreen = document.getElementById('game-screen');
    this.hintButton = document.getElementById('hintButton');
    this.sidePanel = document.getElementById('sidePanel');
    this.panelToggles = document.querySelectorAll('.tab');
    this.panelContents = document.querySelectorAll('.panel-content');
    this.puzzleTitle = document.getElementById('puzzle-title');
    this.puzzleBoard = document.getElementById('puzzleBoard');
    this.piecesTray = document.getElementById('piecesTray');
    this.timer = document.getElementById('timer');
    this.leaderboardContent = document.querySelector('#rankings-content .rankings-list');
  }

  /**
   * Setup event listeners.
   */
  setupEventListeners() {
    window.addEventListener('message', (ev) => this.handleMessage(ev));

    this.panelToggles.forEach(button => {
      button.addEventListener('click', () => {
        this.panelToggles.forEach(t => t.classList.remove('active'));
        button.classList.add('active');

        this.panelContents.forEach(p => p.classList.remove('active'));
        const panelId = `${button.dataset.tab}-panel`;
        document.getElementById(panelId)?.classList.add('active');
      });
    });

    if (this.hintButton) {
      this.hintButton.addEventListener('click', () => {
        this.toastManager.show(this.hint, 'info');
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

    // Change this block to properly handle the message data structure
    if (message.data?.type === 'customInitialData') {
      this.handleInitialData(message.data.data);
    }

    if (message.type === 'show-toast') {
      this.toastManager.show(message.data.message, 'warning');
    }

    if (message.type === 'leaderboard-update') {
      this.initializeLeaderboard(message.data.leaderboard);
    }
  }

  /**
   * Handle initial data received from the message.
   * @param {Object} data - The initial data.
   */
  handleInitialData(data) {
    const { username, pieces, hint, leaderboard, subreddit, owner } = data;

    this.username = username;
    this.hint = hint;
    this.sessionId = data.sessionId;
    this.initialData = data;
    this.owner = owner;

    // Make sure gameScreen is shown
    this.gameScreen.style.display = 'flex';
    this.puzzleTitle.textContent = `r/${subreddit}`;

    // Initialize the GameManager first
    this.gameManager = new GameManager('solo', this.sessionId);

    // Initialize the PuzzleBoard with custom type
    this.puzzleBoard = new PuzzleBoard(
      pieces,
      'solo',
      this.sessionId,
      null,
      this.username,
      null,
      null,
      '#3b82f6',
      'custom',
      this.hint,
      'custom'  // Add type parameter
    );
    if (this.owner === this.username) {
      this.puzzleBoard.disablePieceMovement()
      this.toastManager.show('As the game master, your pieces are locked in place!', 'info');
    } else {
      this.toastManager.showWelcomeToast(username);
    }

    // Initialize leaderboard with the provided data
    const formattedLeaderboard = leaderboard.map(entry => ({
      ...entry,
      time: entry.time || '00:00' // Add default time if not present
    }));
    this.initializeLeaderboard(formattedLeaderboard);
  }

  /**
   * Initialize the leaderboard with existing scores
   * @param {Array} leaderboard - Array of leaderboard entries
   */
  initializeLeaderboard(leaderboard) {
    if (!this.leaderboardContent) {
      this.leaderboardContent = document.querySelector('#rankings-content .rankings-list');
      if (!this.leaderboardContent) return;
    }

    // Time is already in milliseconds, sort directly
    const sortedLeaderboard = leaderboard.sort((a, b) => a.time - b.time);

    const leaderboardHtml = sortedLeaderboard.map(({ username, avatar, time }) => {
      const minutes = Math.floor(time / 60000);
      const seconds = Math.floor((time % 60000) / 1000);
      const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      return `
        <div class="leaderboard-entry ${username === this.username ? 'owner' : ''}">
          <img src="${avatar}" alt="${username}'s avatar" class="leaderboard-avatar">
          <span class="leaderboard-username">${username}</span>
          <span class="leaderboard-score">${formattedTime}</span>
        </div>
      `;
    }).join('');

    this.leaderboardContent.innerHTML = leaderboardHtml;
  }

  /**
   * Initialize the puzzle board with the puzzle pieces.
   * @param {Array} pieces - Array of puzzle pieces
   */
  initializePuzzleBoard(pieces) {
    this.gameManager = new GameManager('solo', this.sessionId);

    this.puzzleBoard = new PuzzleBoard(
      pieces,
      'solo',
      this.sessionId,
      null,
      this.username,
      null,
      null,
      '#3b82f6',
      'custom',
      this.hint
    );
  }
}

new CustomApp();
