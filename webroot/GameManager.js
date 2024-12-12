class GameManager {
  /**
   * Initialize the game manager with the given mode.
   * @param {'solo' | 'coop'} mode - The game mode. 
   */
  constructor(mode, sessionId) {
    this.mode = mode;
    this.sessionId = sessionId;
  }
}

export default GameManager;