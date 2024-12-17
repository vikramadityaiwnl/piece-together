import { sendMessage } from './utils.js';

class MemorialApp {
  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    this.initialData = null;
  }

  initializeElements() {
    this.gameScreen = document.getElementById('game-screen');
    this.puzzleBoard = document.getElementById('puzzleBoard');
    this.puzzleTitle = document.getElementById('puzzle-title');
    this.timerText = document.querySelector('.timer-text');
    this.leaderboardContent = document.querySelector('#rankings-content .rankings-list');
    this.mvpContent = document.getElementById('mvp-content');
    this.auditPanel = document.getElementById('audit-panel-content');
    this.panelToggles = document.querySelectorAll('.tab');
    this.panelContents = document.querySelectorAll('.panel-content');
  }

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
  }

  handleMessage(ev) {
    const { data, type } = ev.data;
    if (type !== 'devvit-message') return;

    const { message } = data;
    if (!message) return;

    // The message structure was incorrect - fix it here
    if (message.type === 'memorialInitialData') {
      this.handleInitialData(message.data);
    } else if (message.data?.type === 'memorialInitialData') {
      // Handle nested data structure
      this.handleInitialData(message.data.data);
    }
  }

  handleInitialData(data) {
    const { pieces, subreddit, completedIn, rankings, mvp, auditLog } = data;
    this.initialData = data;
    
    // Set title
    this.puzzleTitle.textContent = `r/${subreddit}`;

    // Set completion time
    const minutes = Math.floor(completedIn / 60000);
    const seconds = Math.floor((completedIn % 60000) / 1000);
    this.timerText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Initialize board with completed pieces
    this.initializeCompletedBoard(pieces);

    // Initialize leaderboard and MVPs
    this.initializeLeaderboard(rankings);
    this.initializeMVPs(mvp);
 
    // Initialize audit log
    this.initializeAuditLog(auditLog);
  }

  initializeCompletedBoard(pieces) {
    this.puzzleBoard.innerHTML = '';
    const sortedPieces = pieces.sort((a, b) => a.correct_position - b.correct_position);

    sortedPieces.forEach(piece => {
      const cell = document.createElement('div');
      cell.classList.add('puzzle-piece');
      cell.style.backgroundImage = `url(${piece.filepath})`;
      cell.dataset.id = piece.id;
      this.puzzleBoard.appendChild(cell);
    });
  }

  initializeLeaderboard(rankings) {
    const leaderboardHtml = rankings.map(({ username, avatar, score }) => `
      <div class="leaderboard-entry">
        <img src="${avatar}" alt="${username}'s avatar" class="leaderboard-avatar">
        <span class="leaderboard-username">${username}</span>
        <span class="leaderboard-score">${score}</span>
      </div>
    `).join('');

    this.leaderboardContent.innerHTML = leaderboardHtml;
  }

  initializeMVPs(mvp) {
    const mvpHtml = `
      <div class="mvp-card">
        <img src="${mvp.mostActive?.avatar}" alt="Most Active" class="mvp-avatar">
        <div class="mvp-content">
          <div class="mvp-title">Most Active Player</div>
          <div class="mvp-subtitle">${mvp.mostActive?.username || '-'}</div>
        </div>
      </div>
      <div class="mvp-card">
        <img src="${mvp.mostAccurate?.avatar}" alt="Most Accurate" class="mvp-avatar">
        <div class="mvp-content">
          <div class="mvp-title">Most Accurate Player</div>
          <div class="mvp-subtitle">${mvp.mostAccurate?.username || '-'}</div>
        </div>
      </div>
      <div class="mvp-card">
        <img src="${mvp.mostAdventurous?.avatar}" alt="Most Adventurous" class="mvp-avatar">
        <div class="mvp-content">
          <div class="mvp-title">Most Adventurous Player</div>
          <div class="mvp-subtitle">${mvp.mostAdventurous?.username || '-'}</div>
        </div>
      </div>
    `;

    this.mvpContent.innerHTML = mvpHtml;
  }

  initializeAuditLog(auditLog) {
    const auditHtml = [...auditLog].reverse().map(entry => {
      const time = new Date(entry.action.timestamp).toLocaleTimeString();
      return `
        <div class="audit-entry">
          <div class="audit-header">
            <span class="audit-time">${time}</span>
            <span class="audit-user">${entry.username}</span>
          </div>
          <div class="audit-move">
            moved <span class="audit-piece-id">${entry.action.pieceId}</span> 
            from <span class="audit-position">${entry.action.from}</span>
            to <span class="audit-position">${entry.action.to}</span>
          </div>
        </div>
      `;
    }).join('');

    this.auditPanel.innerHTML = auditHtml;
  }
}

new MemorialApp();
