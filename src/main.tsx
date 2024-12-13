import './createPost.js';
import { Devvit, useState, useAsync, useChannel } from '@devvit/public-api';
import { images } from './images.data.js';

type InitialData = {
  type: 'initialData';
  data: {
    username: string;
    avatar: string;
    assets: Assets;
    image: {
      solo: PuzzlePieceImage;
      coop: PuzzlePieceImage;
    };
    cooldown?: number;
    time?: string;  // Add time to InitialData type
    sessionId: string;  // Add this line
    auditLog: any[]; // Add this line
  };
};

type AddCooldown = {
  type: 'add-cooldown';
  username: string;
  sessionId: string;
}

type ShowCooldown = {
  type: 'show-cooldown';
  cooldown: number;
}

type UpdateGameState = {
  type: 'update-game-state';
  gameState: GameState;
  sessionId: string;
}

type ShowToast = {
  type: 'show-toast';
  message: string;
}

type StartCoop = {
  type: 'start-coop';
}

type StartSolo = {
  type: 'start-solo';
}

type GetGameState = {
  type: 'get-game-state';
}

type GetCooldown = {
  type: 'get-cooldown';
}

// Add new type for audit log messages
type AddAudit = {
  type: 'add-audit';
  username: string;
  sessionId: string;
  action: {
    from: string;
    to: string;
    pieceId: string;
    timestamp: number;
  };
}

// Update WebViewMessage type
type WebViewMessage = AddCooldown | ShowCooldown | UpdateGameState | ShowToast | StartCoop | StartSolo | GetGameState | GetCooldown | AddAudit;
type RealtimeMessage = UpdateGameState | { type: 'audit-update'; auditLog: any[]; sessionId: string; };

type PuzzlePieceImage = {
  folder: string;
  subreddit: string;
  hint: string;
  pieces: { filepath: string; correct_position: number; id: string }[];
  startedAt?: number;
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

const getPuzzleImage = async (context: Devvit.Context, mode: string): Promise<PuzzlePieceImage> => {
  if (mode === 'coop') {
    const cacheKey = `puzzle:${context.postId}:image:coop`;
    const timeKey = `puzzle:${context.postId}:time`;
    
    // Check for existing image and time
    const [cachedImage, cachedTime] = await Promise.all([
      context.redis.get(cacheKey),
      context.redis.get(timeKey)
    ]);

    // If we have both image and time, return the cached image
    if (cachedImage && cachedTime) {
      const parsedImage = JSON.parse(cachedImage) as PuzzlePieceImage;
      parsedImage.startedAt = parseInt(cachedTime);
      return parsedImage;
    }
  }

  // Create new puzzle image
  const now = Date.now();
  let randomIndex = Math.floor(Math.random() * images.length);
  
  // For solo mode or new co-op game, get a random image
  if (mode === 'solo') {
    const coopImageData = await context.redis.get(`puzzle:${context.postId}:image:coop`);
    if (coopImageData) {
      const coopImage = JSON.parse(coopImageData);
      // Keep generating new random index until we get a different image
      while (images[randomIndex].folder === coopImage.folder) {
        randomIndex = Math.floor(Math.random() * images.length);
      }
    }
  }

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
    startedAt: mode === 'coop' ? now : undefined
  }

  // Cache co-op image and time
  if (mode === 'coop') {
    const expiration = new Date(now + 60 * 60 * 1000);
    await Promise.all([
      context.redis.set(`puzzle:${context.postId}:image:coop`, 
        JSON.stringify(puzzleImage), 
        { expiration }
      ),
      context.redis.set(`puzzle:${context.postId}:time`,
        now.toString(),
        { expiration }
      )
    ]);
  }

  return puzzleImage;
}

Devvit.configure({
  redditAPI: true,
  redis: true,
  realtime: true,
});

Devvit.addCustomPostType({
  name: 'Webview Example',
  height: 'tall',
  render: (context) => {
    const [webviewVisible, setWebviewVisible] = useState(false);
    const [hasClicked, setHasClicked] = useState(false);
    const [sessionId, setSessionId] = useState(Math.random().toString(36).substring(2, 9));

    // Update initialData to include audit log
    const initialData = useAsync<InitialData>(async () => {
      const currUser = await context.reddit.getCurrentUser();
      const gameState = await context.redis.get(`puzzle:${context.postId}:gameState`);
      const auditLog = await context.redis.get(`puzzle:${context.postId}:audit`);
      const time = await context.redis.get(`puzzle:${context.postId}:time`);
      const parsedState = gameState ? JSON.parse(gameState) : { board: [], tray: [] };

      // Get cooldown if it exists
      const cooldownKey = `puzzle:${context.postId}:${currUser?.username}:cooldown`;
      const cooldown = await context.redis.get(cooldownKey);

      // Get both images upfront
      const [coopImage, soloImage] = await Promise.all([
        getPuzzleImage(context, 'coop'),
        getPuzzleImage(context, 'solo')
      ]);

      return {
        type: 'initialData',
        data: {
          username: currUser?.username || 'Unknown',
          avatar: await currUser?.getSnoovatarUrl() || '',
          assets: getAssets(context),
          image: {
            coop: coopImage,
            solo: soloImage
          },
          time,
          gameState: parsedState,
          cooldown: cooldown ? parseInt(cooldown) : undefined,
          sessionId,
          auditLog: auditLog ? JSON.parse(auditLog) : [],
        },
      };
    });

    // Update channel handler
    const channel = useChannel({
      name: 'events',
      onMessage: (msg: RealtimeMessage) => {
        if (msg.sessionId === sessionId) return;
        
        if (msg.type === 'update-game-state' || msg.type === 'audit-update') {
          context.ui.webView.postMessage('myWebView', {
            data: msg
          });
        }
      },
    })

    /**
     * Handle messages from the webview.
     * @param {WebViewMessage} msg - The message from the webview.
     */
    const onMessage = async (msg: WebViewMessage) => {
      switch (msg.type) {
        case 'add-cooldown':
          const cooldown = new Date(Date.now() + 60 * 1000);
          const key = `puzzle:${context.postId}:${msg.username}:cooldown`;
          await context.redis.set(key, cooldown.getTime().toString(), {
            expiration: cooldown,
          });
          // Broadcast cooldown update
          context.ui.webView.postMessage('myWebView', {
            data: {
              type: 'cooldown-update',
              cooldown: cooldown.getTime()
            }
          });
          break;

        case 'get-game-state':
          const gameState = await context.redis.get(`puzzle:${context.postId}:gameState`);
          if (gameState) {
            context.ui.webView.postMessage('myWebView', {
              data: {
                type: 'update-game-state',
                gameState: JSON.parse(gameState)
              }
            });
          }
          break;

        case 'get-cooldown':
          const currUser = await context.reddit.getCurrentUser();
          if (currUser) {
            const cooldownKey = `puzzle:${context.postId}:${currUser.username}:cooldown`;
            const storedCooldown = await context.redis.get(cooldownKey);
            if (storedCooldown) {
              context.ui.webView.postMessage('myWebView', {
                data: {
                  type: 'cooldown-update',
                  cooldown: parseInt(storedCooldown)
                }
              });
            }
          }
          break;

        case 'update-game-state':
          await context.redis.set(`puzzle:${context.postId}:gameState`, JSON.stringify(msg.gameState));
          await channel.send(msg)
          break;

        case 'show-toast':
          context.ui.webView.postMessage('myWebView', { data: msg });
          break;

        case 'start-coop':
          channel.subscribe();
          break;

        case 'start-solo':
          channel.unsubscribe();
          break;

        // Add audit log handling
        case 'add-audit':
          const auditKey = `puzzle:${context.postId}:audit`;
          const existingAudit = await context.redis.get(auditKey);
          const auditLog = existingAudit ? JSON.parse(existingAudit) : [];
          const user = await context.reddit.getCurrentUser();
          
          // Add new entry to audit log
          auditLog.push({
            username: msg.username,
            avatar: await user?.getSnoovatarUrl() || '',
            action: msg.action
          });

          // Keep only last 100 moves
          if (auditLog.length > 100) {
            auditLog.shift();
          }

          // Save audit log
          await context.redis.set(auditKey, JSON.stringify(auditLog));

          // Broadcast audit update to all clients
          context.ui.webView.postMessage('myWebView', {
            data: {
              type: 'audit-update',
              auditLog
            }
          });

          // Also send through realtime channel
          await channel.send({
            type: 'audit-update',
            auditLog,
            sessionId: msg.sessionId
          });
          break;

        default:
          console.info('Unknown message:', JSON.stringify(msg));
          break;
      }
    };

    /**
     * Show the webview when the main screen is pressed.
     */
    const showWebView = () => {
      if (hasClicked) return;
      setHasClicked(true);

      if (initialData.error === null) {
        context.ui.webView.postMessage('myWebView', initialData);
        setWebviewVisible(true);
      } else {
        console.error('Initial data not ready:', initialData);
        setHasClicked(false)
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
