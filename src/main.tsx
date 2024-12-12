import './createPost.js';

import { Devvit, useState, useAsync } from '@devvit/public-api';

type InitialData = {
  type: 'initialData';
  data: {
    username: string,
    avatar: string,
    assets: Assets,
  };
}

type WebViewMessage = InitialData;

Devvit.configure({
  redditAPI: true,
  redis: true,
});

type Assets = {
  solo: string;
  coop: string;
  soundOn: string;
  soundOff: string;
  mainMenuBackground: string;
  backgroundMusic: string;
}
const getAssets = (context: Devvit.Context): Assets => {
  return {
    solo: context.assets.getURL('game/solo_button.png'),
    coop: context.assets.getURL('game/co_op_button.png'),
    soundOn: context.assets.getURL('game/sound_on.png'),
    soundOff: context.assets.getURL('game/sound_off.png'),
    mainMenuBackground: context.assets.getURL('game/main_menu_background.png'),
    backgroundMusic: context.assets.getURL('game/background_music.mp3'),
  }
}

Devvit.addCustomPostType({
  name: 'Webview Example',
  height: 'tall',
  render: (context) => {
    const [webviewVisible, setWebviewVisible] = useState(false);

    const initialData = useAsync<InitialData>(async () => {
      const currUser = await context.reddit.getCurrentUser();

      return {
        type: 'initialData',
        data: {
          username: currUser?.username || 'Unknown',
          avatar: await currUser?.getSnoovatarUrl() || '',
          assets: getAssets(context),
        },
      }
    });

    const onMessage = async (msg: WebViewMessage) => {
      switch (msg.type) {
        default:
          throw new Error(`Unknown message type: ${msg}`);
      }
    };

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
