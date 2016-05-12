import React from 'react';
import youTube from 'youtube-video';

import Dispatcher from '../events/Dispatcher';

import './TalkPlayer.scss';

const TalkPlayer = React.createClass({
  propTypes: {
    width: React.PropTypes.number,
    height: React.PropTypes.number
  },

  componentWillMount() {
    Dispatcher.subscribe(this);
  },

  componentWillUnmount() {
    Dispatcher.unsubscribe(this);
  },

  onDispatch(event, ...args) {
    if (!this.video) {
      return;
    }

    if (event === Dispatcher.events.navigateVideo) {
      const talk = args[0];
      const timestamp = args[1];

      // seek if we already have it
      const currentVideoId = this.video.getVideoData()['video_id'];
      if (currentVideoId === talk.youtubeId) {
        this.video.seekTo(timestamp, true);
        this.video.playVideo();

      // otherwise load the video at that point
      } else {
        this.video.loadVideoById({ videoId: talk.youtubeId, startSeconds: timestamp, autoplay: true });
      }
    } else if (event === Dispatcher.events.stopVideo) {
      this.video.stopVideo();
    }
  },

  componentDidMount() {
    const { width, height } = this.props;

    youTube(null, {
      elementId: 'youtube-video',
      selector: true,
      autoplay: false,
      width,
      height,
      controls: true
    }, (_, video) => {
      this.video = video;
    });
  },

  render() {
    return (
      <div className='talk-player'>
        <div id='youtube-video' ref='youtube-video'/>
      </div>
    );
  }
});

export default TalkPlayer;
