import { Devvit } from '@devvit/public-api';

Devvit.configure({
  redditAPI: true,
});

Devvit.addMenuItem({
  label: 'Create New Jigsaw Puzzle',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
      title: 'Jigsaw Puzzle',
      subredditName: subreddit.name,
      // The preview appears while the post loads
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
      ),
    });
    ui.showToast({ text: 'Post created!' });
    ui.navigateTo(post);
  },
});
