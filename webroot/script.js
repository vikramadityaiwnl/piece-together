class App {
  constructor() {
    // Screens & Utils
    const mainMenuScreen = document.getElementById('main-menu-screen');
    const gameScreen = document.getElementById('game-screen');
    const backgroundMusic = document.getElementById('background-music');

    // Main Menu Components
    const soloButton = document.getElementById('solo-button');
    const coopButton = document.getElementById('co-op-button');
    const soundToggleButton = document.getElementById('sound-toggle-button');

    window.addEventListener('message', (ev) => {
      const { data, type } = ev.data;

      if (type !== 'devvit-message') return

      const { message } = data;

      console.log('Received message:', message);

      if (message?.data.type === 'initialData') {
        const { assets } = message.data.data;

        if (soloButton) soloButton.setAttribute('src', assets.solo);
        if (coopButton) coopButton.setAttribute('src', assets.coop);
        if (backgroundMusic) {
          backgroundMusic.setAttribute('src', assets.backgroundMusic);
          backgroundMusic.load(); // Ensure the audio is loaded
        }
        if (mainMenuScreen) mainMenuScreen.style.backgroundImage = `url(${assets.mainMenuBackground})`;
        this.setupSoundToggleButton(soundToggleButton, assets);

        if (mainMenuScreen) {
          mainMenuScreen.style.display = 'block';
          gameScreen.style.display = 'none';
        }  
      }
    });
  }

  setupSoundToggleButton(soundToggleButton, assets) {
    soundToggleButton.setAttribute('src', assets.soundOn);

    soundToggleButton.addEventListener('click', () => {
      const backgroundMusic = document.getElementById('background-music');

      if (backgroundMusic.src) { // Check if the source is set
        if (backgroundMusic.paused) {
          backgroundMusic.play().catch(error => console.error('Error playing audio:', error));
          soundToggleButton.setAttribute('src', assets.soundOn);
        } else {
          backgroundMusic.pause();
          soundToggleButton.setAttribute('src', assets.soundOff);
        }
      } else {
        console.error('Background music source is not set.');
      }
    });
  }
}

new App();
