import './createPost.js';
import { Devvit, useState, useAsync, useChannel, UseChannelResult } from '@devvit/public-api';
import { images } from './images.data.js';

const PLAYER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEEAD', '#D4A5A5', '#9B89B3', '#FF9999',
  '#77DD77', '#89ABE3', '#FCB7AF', '#B19CD9'
];

type InitialData = {
  type: 'initialData';
  data: {
    username: string;
    avatar: string;
    assets: Assets;
    image: PuzzlePieceImage;
    cooldown?: number;
    startedAt?: number;
    sessionId: string;
    auditLog: any[];
    onlinePlayers: { username: string, color: string, avatar: string }[];
    gameState: GameState | null;
  };
};

type CustomInitialData = {
  type: 'customInitialData';
  data: {
    username: string;
    avatar: string;
    assets: Assets;
    sessionId: string;
    leaderboard: { username: string; avatar: string, time: number }[];
    pieces: { id: string; filepath: string, correct_position: number }[];
    hint: string;
    subreddit: string;
  };
}

type MemorialInitialData = {
  type: 'memorialInitialData';
  data: {
    pieces: { id: string; filepath: string, correct_position: number }[];
    subreddit: string;
    completedIn: number;
    rankings: { username: string; avatar: string, score: number }[];
    mvp: {
      mostActive: { username: string, moves: number, avatar: string } | null;
      mostAccurate: { username: string, accuracy: number, avatar: string } | null;
      mostAdventurous: { username: string, incorrectMoves: number, avatar: string } | null;
    };
    auditLog: any[];
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

type LeaveCoop = {
  type: 'leave-coop';
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

type GetHint = {
  type: 'get-hint';
  username: string;
  mode: 'solo' | 'coop';
}

type ShowHint = {
  type: 'show-hint';
  message: string;
}

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

// Update PuzzleCompletionCoop type
type PuzzleCompletionCoop = {
  type: 'puzzle-completion-coop';
  username: string;
  sessionId: string;
  completedIn: number; // Change to number instead of string
  subreddit: string;
  pieces: { id: string; filepath: string, correct_position: number }[];
  rankings: { username: string; avatar: string, score: number }[];
  mvp: {
    mostActive: { username: string, moves: number, avatar: string } | null;
    mostAccurate: { username: string, accuracy: number, avatar: string } | null;
    mostAdventurous: { username: string, incorrectMoves: number, avatar: string } | null;
  };
  auditLog: {
    username: string;
    avatar: string;
    action: {
      from: string;
      to: string;
      pieceId: string;
      timestamp: number;
      isCorrect: boolean;
    };
  }[];
}

type MemorialPost = {
  type: 'memorial-post';
  sessionId: string;
}

type UploadCustomPost = {
  type: 'upload-custom-post';
  username: string;
  leaderboard: { username: string; avatar: string, time: number }[];
  pieces: { id: string; filepath: string, correct_position: number }[];
  hint: string;
  completedIn: number;
  subreddit: string;
  sessionId: string;
}

type AuditUpdate = {
  type: 'audit-update';
  auditLog: any[];
  sessionId: string;
}

type ClearCache = {
  type: 'clear-cache';
}

type OnlinePlayersUpdate = {
  type: 'online-players-update';
  players: { username: string, color: string, avatar: string }[];
  sessionId: string;
};

type SendEmoji = {
  type: 'send-emoji';
  emoji: string;
  username: string;
  sessionId: string;
};

type HighlightPiece = {
  type: 'highlight-piece';
  pieceId: string;
  color: string;
  sessionId: string;
};

type DeselectPiece = {
  type: 'deselect-piece';
  pieceId: string;
  sessionId: string;
};

type SendImageData = {
  type: 'send-image-data';
  imageData: typeof images;
}

// Add new message type
type GetImageUrls = {
  type: 'get-image-urls';
  pieces: { filepath: string }[];
}

// Add new message type
type AddToLeaderboard = {
  type: 'add-to-leaderboard';
  username: string;
  time: string;
  sessionId: string;
}

// Add to WebViewMessage and RealtimeMessage types
type PuzzleCompletion = {
  type: 'puzzle-completion';
  username: string;
  sessionId: string;
  completionTime: number;
};

// Update WebViewMessage type
type WebViewMessage = AddCooldown | ShowCooldown | UpdateGameState | ShowToast | StartCoop | LeaveCoop | StartSolo | GetGameState | GetCooldown | AddAudit | OnlinePlayersUpdate | SendEmoji | HighlightPiece | DeselectPiece | GetHint | ShowHint | SendImageData | GetImageUrls | UploadCustomPost | PuzzleCompletionCoop | AddToLeaderboard | ClearCache | PuzzleCompletion;
type RealtimeMessage = UpdateGameState | AuditUpdate | OnlinePlayersUpdate | SendEmoji | HighlightPiece | DeselectPiece | PuzzleCompletionCoop | MemorialPost | PuzzleCompletion;

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
  title: string;
  solo: string;
  coop: string;
  soundOn: string;
  soundOff: string;
  mainMenuBackground: string;
  backgroundMusic: string;
  dummyProfile: string;
};

/**
 * Function to get asset URLs.
 * @param {Devvit.Context} context - The Devvit context.
 * @returns {Assets} The assets URLs.
 */
const getAssets = (context: Devvit.Context): Assets => ({
  title: context.assets.getURL('game/title.png'),
  solo: context.assets.getURL('game/solo_button.png'),
  coop: context.assets.getURL('game/co_op_button.png'),
  soundOn: context.assets.getURL('game/sound_on.png'),
  soundOff: context.assets.getURL('game/sound_off.png'),
  mainMenuBackground: context.assets.getURL('game/main_menu_background.png'),
  backgroundMusic: context.assets.getURL('game/background_music.mp3'),
  dummyProfile: context.assets.getURL('game/dummy_profile.png'),
});

const getPuzzleImage = async (context: Devvit.Context): Promise<PuzzlePieceImage> => {
  const cacheKey = `puzzle:${context.postId}:image`;
  const timeKey = `puzzle:${context.postId}:time`;

  const startTime = await context.redis.get(timeKey);
  if (!startTime) {
    return {
      folder: '',
      subreddit: '',
      hint: '',
      pieces: []
    };
  }

  const cachedImage = await context.redis.get(cacheKey);
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
    }))
  }

  const expiration = startTime ? new Date(parseInt(startTime) + 60 * 60 * 1000) : new Date();
  await context.redis.set(cacheKey, JSON.stringify(puzzleImage), { expiration });

  return puzzleImage;
}

/**
 * Clear all cached data for a specific puzzle.
 * @param {Devvit.Context} context - The Devvit context.
 */
const clearCache = async (context: Devvit.Context) => {
  const keysToDelete = [
    `puzzle:${context.postId}:image`,
    `puzzle:${context.postId}:time`,
    `puzzle:${context.postId}:gameState`,
    `puzzle:${context.postId}:audit`,
    `puzzle:${context.postId}:onlinePlayers`,
    `puzzle:${context.postId}:hint`
  ];

  await Promise.all(keysToDelete.map(key => context.redis.del(key)));
};

/**
 * Check if cache is expired and needs clearing.
 * @param {Devvit.Context} context - The Devvit context.
 * @returns {Promise<{startedAt: number | null, expired: boolean}>}
 */
const checkCacheExpiration = async (context: Devvit.Context) => {
  const timeKey = `puzzle:${context.postId}:time`;
  const startTime = await context.redis.get(timeKey);

  if (!startTime) {
    const now = Date.now();
    await context.redis.set(timeKey, now.toString(), {
      expiration: new Date(now + 60 * 60 * 1000)
    });
    return { startedAt: now, expired: false };
  }

  const startTimeMs = parseInt(startTime);
  const now = Date.now();
  const elapsed = now - startTimeMs;
  const oneHour = 60 * 60 * 1000;

  if (elapsed >= oneHour) {
    await clearCache(context);
    const newStartTime = Date.now();
    await context.redis.set(timeKey, newStartTime.toString(), {
      expiration: new Date(newStartTime + oneHour)
    });
    return { startedAt: newStartTime, expired: true };
  }

  return { startedAt: startTimeMs, expired: false };
};

// Update uploadMemorialPost function
const uploadMemorialPost = async (context: Devvit.Context, data: PuzzleCompletionCoop, channel: UseChannelResult<RealtimeMessage>) => {
  const post = await context.reddit.submitPost({
    title: `Jigsaw Puzzle on ${data.subreddit} topic completed!`,
    subredditName: (await context.reddit.getCurrentSubreddit()).name,
    preview: (
      <vstack height="100%" width="100%" alignment="middle center">
        <image
          url='game/loading_preview.gif'
          description='Loading Preview'
          height='100%'
          width='100%'
          imageHeight={100}
          imageWidth={100}
        />
      </vstack>
    )
  })

  clearCache(context)

  // Format rankings to ensure avatar URLs are included
  const rankings = data.rankings.map(rank => ({
    username: rank.username,
    avatar: rank.avatar || getAssets(context).dummyProfile, // Fallback to dummy profile if no avatar
    score: typeof rank.score === 'number' ? rank.score : 0 // Ensure score is a number
  }));

  // Format MVP data to ensure avatar URLs are included
  const mvp = {
    mostActive: data.mvp.mostActive ? {
      ...data.mvp.mostActive,
      avatar: data.mvp.mostActive.avatar || getAssets(context).dummyProfile
    } : null,
    mostAccurate: data.mvp.mostAccurate ? {
      ...data.mvp.mostAccurate,
      avatar: data.mvp.mostAccurate.avatar || getAssets(context).dummyProfile
    } : null,
    mostAdventurous: data.mvp.mostAdventurous ? {
      ...data.mvp.mostAdventurous,
      avatar: data.mvp.mostAdventurous.avatar || getAssets(context).dummyProfile
    } : null
  };

  try {
    await Promise.all([
      context.redis.set(`puzzle:${post.id}:completedIn`, String(data.completedIn)),
      context.redis.set(`puzzle:${post.id}:pieces`, JSON.stringify(data.pieces)),
      context.redis.set(`puzzle:${post.id}:subreddit`, data.subreddit),
      context.redis.set(`puzzle:${post.id}:rankings`, JSON.stringify(rankings)), // Use formatted rankings
      context.redis.set(`puzzle:${post.id}:mvp`, JSON.stringify(mvp)), // Use formatted MVP data
      context.redis.set(`puzzle:${post.id}:auditLog`, JSON.stringify(data.auditLog)),
      context.redis.set(`puzzle:${post.id}:type`, 'memorial'),
      context.redis.set(`puzzle:${post.id}:completionDetails`, JSON.stringify({
        completedBy: data.username,
        completedIn: data.completedIn,
        timestamp: Date.now()
      }))
    ]);

    context.ui.showToast({ text: 'Memorial post created!' });

    channel.send({
      type: 'memorial-post',
      sessionId: data.sessionId,
    })
  } catch (error) {
    context.ui.showToast({ text: 'Something went wrong! Please refresh the page!' });
  }
}

Devvit.configure({
  redditAPI: true,
  redis: true,
  realtime: true,
});

Devvit.addCustomPostType({
  name: 'Jigsaw Puzzle',
  height: 'tall',
  render: (context) => {
    const [webviewVisible, setWebviewVisible] = useState(false);
    const [hasClicked, setHasClicked] = useState(false);
    const [sessionId] = useState(Math.random().toString(36).substring(2, 9));

    const [onlinePlayers, setOnlinePlayers] = useState<{ username: string, color: string, avatar: string }[]>([]);

    // Modify post useAsync to handle memorial initialization
    const post = useAsync(async () => {
      const type = await context.redis.get(`puzzle:${context.postId}:type`);

      if (type === 'custom') {
        return {
          type: 'custom',
          webview: 'custom.html'
        }
      }

      if (type === 'memorial') {
        setWebviewVisible(true); // Auto-show webview for memorial posts
        const memorialData = await loadMemorialData(); // We'll define this function next
        if (memorialData) {
          // Slight delay to ensure webview is ready
          setTimeout(() => {
            context.ui.webView.postMessage('myWebView', {
              type: 'memorialInitialData',
              data: memorialData
            });
          }, 100);
        }
        return {
          type: 'memorial',
          webview: 'memorial.html'
        }
      }

      return {
        type: 'default',
        webview: 'page.html'
      }
    });

    // Helper function to load memorial data
    const loadMemorialData = async () => {
      const [
        pieces,
        subreddit,
        completedIn,
        rankings,
        mvp,
        auditLog
      ] = await Promise.all([
        context.redis.get(`puzzle:${context.postId}:pieces`),
        context.redis.get(`puzzle:${context.postId}:subreddit`),
        context.redis.get(`puzzle:${context.postId}:completedIn`),
        context.redis.get(`puzzle:${context.postId}:rankings`),
        context.redis.get(`puzzle:${context.postId}:mvp`),
        context.redis.get(`puzzle:${context.postId}:auditLog`)
      ]);

      return {
        pieces: pieces ? JSON.parse(pieces) : [],
        subreddit: subreddit || 'unknown',
        completedIn: completedIn ? parseInt(completedIn) : 0,
        rankings: rankings ? JSON.parse(rankings) : [],
        mvp: mvp ? JSON.parse(mvp) : {
          mostActive: null,
          mostAccurate: null,
          mostAdventurous: null
        },
        auditLog: auditLog ? JSON.parse(auditLog) : []
      };
    };

    const initialData = useAsync<InitialData>(async () => {
      const { startedAt, expired } = await checkCacheExpiration(context);

      const currUser = await context.reddit.getCurrentUser();

      const image = await getPuzzleImage(context);

      const [auditLog, cooldown, onlinePlayersData, gameState] = expired ?
        [null, null, null, null] :
        await Promise.all([
          context.redis.get(`puzzle:${context.postId}:audit`),
          context.redis.get(`puzzle:${context.postId}:${currUser?.username}:cooldown`),
          context.redis.get(`puzzle:${context.postId}:onlinePlayers`),
          context.redis.get(`puzzle:${context.postId}:gameState`)
        ]);

      const parsedOnlinePlayers = onlinePlayersData ? JSON.parse(onlinePlayersData) : [];

      return {
        type: 'initialData',
        data: {
          username: currUser?.username || 'Unknown',
          avatar: await currUser?.getSnoovatarUrl() || '',
          assets: getAssets(context),
          image,
          startedAt,
          cooldown: cooldown ? parseInt(cooldown) : undefined,
          sessionId,
          auditLog: auditLog ? JSON.parse(auditLog) : [],
          onlinePlayers: parsedOnlinePlayers,
          gameState: gameState ? JSON.parse(gameState) : null,
        },
      };
    });

    const customInitialData = useAsync<CustomInitialData>(async () => {
      const currUser = await context.reddit.getCurrentUser();
      const leaderboard = await context.redis.get(`puzzle:${context.postId}:leaderboard`);
      const pieces = await context.redis.get(`puzzle:${context.postId}:pieces`);
      const hint = await context.redis.get(`puzzle:${context.postId}:hint`);
      const subreddit = await context.redis.get(`puzzle:${context.postId}:subreddit`);
      const owner = await context.redis.get(`puzzle:${context.postId}:owner`);

      return {
        type: 'customInitialData',
        data: {
          username: currUser?.username || 'Unknown',
          avatar: await currUser?.getSnoovatarUrl() || '',
          assets: getAssets(context),
          sessionId,
          leaderboard: leaderboard ? JSON.parse(leaderboard) : [],
          pieces: pieces ? JSON.parse(pieces) : [],
          hint: hint || 'No hint available',
          subreddit: subreddit || 'default',
          owner: owner || 'Unknown'
        }
      };
    });

    const channel = useChannel({
      name: 'events',
      onMessage: (msg: RealtimeMessage) => {
        if (msg.type === 'online-players-update') {
          setOnlinePlayers(prevPlayers => {
            const updatedPlayers = [...prevPlayers];
            msg.players.forEach(newPlayer => {
              const existingPlayerIndex = updatedPlayers.findIndex(player => player.username === newPlayer.username);
              if (existingPlayerIndex !== -1) {
                updatedPlayers[existingPlayerIndex] = newPlayer;
              } else {
                updatedPlayers.push(newPlayer);
              }
            });
            return updatedPlayers;
          });
          context.ui.webView.postMessage('myWebView', { data: msg });
        }

        if (msg.type === "puzzle-completion-coop") {
          const selectedPlayer = onlinePlayers[onlinePlayers.length - 1];
          if (selectedPlayer.username === msg.username) {
            uploadMemorialPost(context, msg, channel);
          }
        }

        if (msg.type === 'memorial-post') {
          context.reddit.getCurrentSubreddit().then((subreddit) => {
            context.ui.navigateTo(subreddit)
          })
        }

        if (msg.sessionId === sessionId) return;

        if (msg.type === 'update-game-state' || msg.type === 'audit-update' || msg.type === 'send-emoji') {
          context.ui.webView.postMessage('myWebView', { data: msg });
        }

        if (msg.type === 'highlight-piece') {
          context.ui.webView.postMessage('myWebView', { data: msg });
        }

        if (msg.type === 'deselect-piece') {
          context.ui.webView.postMessage('myWebView', { data: msg });
        }

        // Handle puzzle-completion message
        if (msg.type === 'puzzle-completion') {
          context.ui.webView.postMessage('myWebView', { data: msg });
        }
      },
      onSubscribed: async () => {
        const currUser = await context.reddit.getCurrentUser();
        if (!currUser) return;

        const usedColors = onlinePlayers.map(player => player.color);
        const availableColors = PLAYER_COLORS.filter(c => !usedColors.includes(c));
        const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)]
          || PLAYER_COLORS[Math.floor(Math.random() * availableColors.length)];

        const updatedPlayers = [...onlinePlayers, { username: currUser.username, color: randomColor, avatar: await currUser.getSnoovatarUrl() || '' }];
        setOnlinePlayers(updatedPlayers);

        const timeKey = `puzzle:${context.postId}:time`;
        const startTime = await context.redis.get(timeKey);
        const expiration = new Date(parseInt(startTime || '0') + 60 * 60 * 1000);

        context.redis.set(`puzzle:${context.postId}:onlinePlayers`, JSON.stringify(updatedPlayers), { expiration });

        channel.send({
          type: 'online-players-update',
          players: updatedPlayers,
          sessionId
        });
      },
      onUnsubscribed: async () => {
        const currUser = await context.reddit.getCurrentUser();
        if (!currUser) return;

        const updatedPlayers = onlinePlayers.filter(player => player.username !== currUser.username);
        setOnlinePlayers(updatedPlayers);

        const timeKey = `puzzle:${context.postId}:time`;
        const startTime = await context.redis.get(timeKey);
        const expiration = new Date(parseInt(startTime || '0') + 60 * 60 * 1000);

        context.redis.set(`puzzle:${context.postId}:onlinePlayers`, JSON.stringify(updatedPlayers), { expiration });

        channel.send({
          type: 'online-players-update',
          players: updatedPlayers,
          sessionId
        });
      }
    })

    /**
     * Handle messages from the webview.
     * @param {WebViewMessage} msg - The message from the webview.
     */
    const onMessage = async (msg: WebViewMessage) => {
      const timeKey = `puzzle:${context.postId}:time`;
      const startTime = await context.redis.get(timeKey);
      const expiration = new Date(parseInt(startTime || '0') + 60 * 60 * 1000);

      switch (msg.type) {
        case 'add-cooldown':
          const cooldown = new Date(Date.now() + 60 * 1000);
          const key = `puzzle:${context.postId}:${msg.username}:cooldown`;
          context.redis.set(key, cooldown.getTime().toString(), {
            expiration: cooldown,
          });

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

        case 'get-hint':
          const hintCache = await context.redis.get(`puzzle:${context.postId}:hint`);
          const hintUsers = hintCache ? JSON.parse(hintCache) : [];

          if (hintUsers.length >= 10) {
            context.ui.webView.postMessage('myWebView', {
              data: {
                type: 'show-hint',
                message: initialData.data?.data.image.hint || 'No hint available'
              }
            });
            return;
          }

          const username = msg.username;
          if (!hintUsers.includes(username)) {
            context.redis.set(`puzzle:${context.postId}:hint`, JSON.stringify([...hintUsers, username]), { expiration });

            if (hintUsers.length + 1 >= 10) {
              context.ui.webView.postMessage('myWebView', {
                data: {
                  type: 'show-hint',
                  message: initialData.data?.data.image.hint || 'No hint available'
                }
              });
              return;
            } else if (hintUsers.length + 1 < 10) {
              context.ui.webView.postMessage('myWebView', {
                data: {
                  type: 'show-toast',
                  message: `More ${10 - (hintUsers.length + 1)} users needed for hint!`
                }
              });
              return;
            }
          }

          if (hintUsers.length < 10) {
            context.ui.webView.postMessage('myWebView', {
              data: {
                type: 'show-toast',
                message: `More ${10 - hintUsers.length} users needed for hint!`
              }
            });
          }
          break;

        case 'update-game-state':
          context.redis.set(`puzzle:${context.postId}:gameState`, JSON.stringify(msg.gameState), { expiration });
          channel.send(msg)
          break;

        case 'show-toast':
          context.ui.webView.postMessage('myWebView', { data: msg });
          break;

        case 'start-coop':
          await channel.subscribe();
          break;

        case 'leave-coop':
          channel.unsubscribe();
          break;

        case 'clear-cache':
          clearCache(context);
          const nav = await context.reddit.getCurrentSubreddit();
          context.ui.navigateTo(nav);
          break;

        case 'start-solo':
          channel.unsubscribe();
          const imagesWithUrls = await Promise.all(
            images.map(async (image) => ({
              ...image,
              pieces: await Promise.all(
                image.pieces.map(async (piece) => ({
                  ...piece,
                  filepath: context.assets.getURL(piece.filepath)
                }))
              )
            }))
          );

          context.ui.webView.postMessage('myWebView', {
            data: {
              type: 'send-image-data',
              imageData: imagesWithUrls,
              hint: imagesWithUrls[0].hint
            }
          });
          break;

        case 'add-audit':
          const auditKey = `puzzle:${context.postId}:audit`;
          const existingAudit = await context.redis.get(auditKey);
          const auditLog = existingAudit ? JSON.parse(existingAudit) : [];
          const user = await context.reddit.getCurrentUser();

          auditLog.push({
            username: msg.username,
            avatar: await user?.getSnoovatarUrl() || '',
            action: msg.action
          });

          if (auditLog.length > 100) {
            auditLog.shift();
          }

          context.redis.set(auditKey, JSON.stringify(auditLog), { expiration });

          context.ui.webView.postMessage('myWebView', {
            data: {
              type: 'audit-update',
              auditLog
            }
          });

          channel.send({
            type: 'audit-update',
            auditLog,
            sessionId: msg.sessionId
          });
          break;

        case 'upload-custom-post':
          const subreddit = await context.reddit.getCurrentSubreddit()
          const post = await context.reddit.submitPost({
            title: `${msg.username} challenges you to solve Jigsaw Puzzle on ${msg.subreddit} topic!`,
            subredditName: subreddit.name,
            preview: (
              <vstack height="100%" width="100%" alignment="middle center">
                <image
                  url='game/loading_preview.gif'
                  description='Loading Preview'
                  height='100%'
                  width='100%'
                  imageHeight={100}
                  imageWidth={100}
                />
              </vstack>
            )
          })

          const avatar = await (await context.reddit.getCurrentUser())?.getSnoovatarUrl() || '';
          await context.redis.set(`puzzle:${post.id}:leaderboard`, JSON.stringify([{ username: msg.username, avatar: avatar, time: msg.completedIn }]));
          await context.redis.set(`puzzle:${post.id}:completedIn`, String(msg.completedIn));
          await context.redis.set(`puzzle:${post.id}:pieces`, JSON.stringify(msg.pieces));
          await context.redis.set(`puzzle:${post.id}:hint`, msg.hint);
          await context.redis.set(`puzzle:${post.id}:subreddit`, msg.subreddit);
          await context.redis.set(`puzzle:${post.id}:owner`, msg.username);
          await context.redis.set(`puzzle:${post.id}:type`, 'custom');

          context.ui.showToast({ text: 'Custom post created!' });
          context.ui.navigateTo(post);
          break;

        case 'puzzle-completion-coop':
          try {
            await channel.send(msg);
          } catch (error) {
            context.ui.webView.postMessage('myWebView', {
              data: {
                type: 'show-toast',
                message: 'Something went wrong. Please refresh the page!'
              }
            });
          }
          break;

        case 'send-emoji':
          await channel.send(msg);
          break;

        case 'highlight-piece':
          await channel.send(msg);
          break;

        case 'deselect-piece':
          await channel.send(msg);
          break;

        case 'add-to-leaderboard':
          const leaderboardData = await context.redis.get(`puzzle:${context.postId}:leaderboard`);
          const currentUser = await context.reddit.getCurrentUser();
          const userAvatar = await currentUser?.getSnoovatarUrl() || '';

          let leaderboard = leaderboardData ? JSON.parse(leaderboardData) : [];

          const existingEntryIndex = leaderboard.findIndex((entry: any) => entry.username === msg.username);

          if (existingEntryIndex !== -1) {
            const existingEntry = leaderboard[existingEntryIndex];
            if (msg.time < existingEntry.time) {
              leaderboard[existingEntryIndex] = {
                username: msg.username,
                avatar: userAvatar,
                time: msg.time,
              };
            }
          } else {
            leaderboard.push({
              username: msg.username,
              avatar: userAvatar,
              time: msg.time,
            });
          }

          context.redis.set(`puzzle:${context.postId}:leaderboard`, JSON.stringify(leaderboard));

          context.ui.webView.postMessage('myWebView', {
            data: {
              type: 'leaderboard-update',
              leaderboard
            }
          });
          break;

        case 'puzzle-completion':
          await channel.send(msg);
          break;

        default:
          break;
      }
    };

    /**
     * Show the webview when the main screen is pressed.
     */
    const showWebView = () => {
      if (hasClicked) return;
      setHasClicked(true);

      if (post.data?.type === 'custom') {
        if (customInitialData.data) {
          context.ui.webView.postMessage('myWebView', customInitialData);
          setWebviewVisible(true);
        }
        return;
      }

      if (initialData.error === null) {
        if (initialData.data) {
          context.ui.webView.postMessage('myWebView', initialData);
          setWebviewVisible(true);
        }
        return;
      } 
      
      setHasClicked(false)
    };

    return (
      <vstack grow padding="small">
        {(!webviewVisible && post.data?.type !== 'memorial') && (
          <vstack
            grow
            height='100%'
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
        )}
        {(webviewVisible || post.data?.type === 'memorial') && (
          <vstack grow height='100%'>
            <vstack border="thick" borderColor="black" height='100%'>
              <webview
                id="myWebView"
                url={post.data?.webview || 'page.html'}
                onMessage={(msg) => onMessage(msg as WebViewMessage)}
                grow
                height='100%'
              />
            </vstack>
          </vstack>
        )}
      </vstack>
    );
  },
});

export default Devvit;
