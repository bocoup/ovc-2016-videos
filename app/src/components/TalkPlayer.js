import React from 'react';
import youTube from 'youtube-video';

import Dispatcher from '../events/Dispatcher';

import './TalkPlayer.scss';

const TalkPlayer = React.createClass({
  propTypes: {
    data: React.PropTypes.object,
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
    if (event === Dispatcher.events.navigateVideo) {
      const talk = args[0];
      const timestamp = args[1];

      if (this.video) {
        this.video.seekTo(timestamp, true);
        this.video.playVideo();
      }
    } else if (event === Dispatcher.events.stopVideo) {
      this.video.stopVideo();
    }
  },

  componentDidMount() {
    const { data, width, height } = this.props;

    const { youtubeId } = data; // TODO - read from data
    // const youtubeId = '0oUP7uHAsNA';

    youTube(youtubeId, {
      elementId: 'youtube-video',
      selector: true,
      autoplay: false,
      width,
      height,
      controls: true
    }, (_, video) => {
      this.video = video;
      video.addEventListener('onStateChange', this._handleVideoEvent, false);
      // video.loadVideoById(videoId);
    });
  },

  render() {
    const { data } = this.props;

    return (
      <div className='talk-player'>
        <div id='youtube-video' ref='youtube-video'/>
      </div>
    );
  }
});

export default TalkPlayer;
