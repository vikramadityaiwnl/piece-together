import './createPost.js';
import { Devvit, useState, useAsync } from '@devvit/public-api';
import { images } from './images.data.js';

type InitialData = {
  type: 'initialData';
  data: {
    username: string;
    avatar: string;
    assets: Assets;
    image: PuzzlePieceImage;
  };
};

type AddCooldown = {
  type: 'add-cooldown';
  username: string;
}

type UpdateGameState = {
  type: 'update-game-state';
  gameState: GameState;
  sessionId: string;
}

type WebViewMessage = AddCooldown | UpdateGameState;

type PuzzlePieceImage = {
  folder: string;
  subreddit: string;
  hint: string;
  pieces: { filepath: string; correct_position: number; id: string }[];
}

type GameState = {
  board: any[];
  tray: any[];
}

type Assets = {
  solo: string;
  coop: string;
  soundOn: string;
  soundOff: string;
  mainMenuBackground: string;
  backgroundMusic: string;
};

/**
 * Function to get asset URLs.
 * @param {Devvit.Context} context - The Devvit context.
 * @returns {Assets} The assets URLs.
 */
const getAssets = (context: Devvit.Context): Assets => ({
  solo: context.assets.getURL('game/solo_button.png'),
  coop: context.assets.getURL('game/co_op_button.png'),
  soundOn: context.assets.getURL('game/sound_on.png'),
  soundOff: context.assets.getURL('game/sound_off.png'),
  mainMenuBackground: context.assets.getURL('game/main_menu_background.png'),
  backgroundMusic: context.assets.getURL('game/background_music.mp3'),
});

const getPuzzleImage = async (context: Devvit.Context): Promise<PuzzlePieceImage> => {
  const cachedImage = await context.redis.get(`puzzle:${context.postId}:image`)
  if (cachedImage) {
    return JSON.parse(cachedImage) as PuzzlePieceImage;
  }

  const randomIndex = Math.floor(Math.random() * images.length);
  const image = images[randomIndex];
  const piecesUrl = image.pieces.map((piece) => (
    context.assets.getURL(piece.filepath)
  ));

  const puzzleImage = {
    folder: image.folder,
    subreddit: image.subreddit,
    hint: image.hint,
    pieces: image.pieces.map((piece, index) => ({
      filepath: piecesUrl[index],
      correct_position: piece.correct_position,
      id: piece.id,
    })),
  }

  context.redis.set(`puzzle:${context.postId}:image`, JSON.stringify(puzzleImage));

  return puzzleImage
}

Devvit.configure({
  redditAPI: true,
  redis: true,
});

Devvit.addCustomPostType({
  name: 'Webview Example',
  height: 'tall',
  render: (context) => {
    const [webviewVisible, setWebviewVisible] = useState(false);

    const initialData = useAsync<InitialData>(async () => {
      const currUser = await context.reddit.getCurrentUser();
      const image = await getPuzzleImage(context);
      const gameState = await context.redis.get(`puzzle:${context.postId}:gameState`);
      const cooldownTimer = await context.redis.get(`puzzle:${context.postId}:${currUser?.username}:cooldown`);

      return {
        type: 'initialData',
        data: {
          username: currUser?.username || 'Unknown',
          avatar: await currUser?.getSnoovatarUrl() || '',
          assets: getAssets(context),
          image,
          gameState: gameState ? JSON.parse(gameState) : { board: [], tray: [] },
        },
      };
    });

    /**
     * Handle messages from the webview.
     * @param {WebViewMessage} msg - The message from the webview.
     */
    const onMessage = async (msg: WebViewMessage) => {
      switch (msg.type) {
        // case 'add-cooldown':
        //   const cooldown = new Date(Date.now() + 60 * 1000)
        //   await context.redis.set(`puzzle:${context.postId}:${msg.username}:cooldown`, cooldown, {
        //     expiration: cooldown,
        //     nx: true,
        //   });
        //   break;

        case 'update-game-state':
          await context.redis.set(`puzzle:${context.postId}:gameState`, JSON.stringify(msg.gameState));
          // add realtime aswell
          break;

        default:
          throw new Error(`Unknown message type: ${msg}`);
      }
    };

    /**
     * Show the webview when the main screen is pressed.
     */
    const showWebView = () => {
      if (initialData.error === null) {
        context.ui.webView.postMessage('myWebView', initialData);
        setWebviewVisible(true);
      } else {
        console.error('Initial data not ready:', initialData);
      }
    };

    return (
      <vstack grow padding="small">
        <vstack
          grow={!webviewVisible}
          height={webviewVisible ? '0%' : '100%'}
          alignment="middle center"
        >
          <image
            url='game/main_screen_background.gif'
            description='Main screen background'
            height='100%'
            width='100%'
            imageHeight={100}
            imageWidth={100}
            onPress={showWebView}
          />
        </vstack>
        <vstack grow={webviewVisible} height={webviewVisible ? '100%' : '0%'}>
          <vstack border="thick" borderColor="black" height={webviewVisible ? '100%' : '0%'}>
            <webview
              id="myWebView"
              url="page.html"
              onMessage={(msg) => onMessage(msg as WebViewMessage)}
              grow
              height={webviewVisible ? '100%' : '0%'}
            />
          </vstack>
        </vstack>
      </vstack>
    );
  },
});

export default Devvit;
