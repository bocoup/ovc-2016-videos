import React from 'react';

import './ThumbnailTimeline.scss';

// allows webpack to find the thumbnails
const thumbnailContext = require.context('../img/talks');


// add leading zeros to a string
function leadingZeroFormat(x, length) {
  return ('00000000' + x).slice(-length);
}

function thumbnailUrl(talk, frame) {
  return thumbnailContext(`./${talk.id}/ovc2016_${talk.day}_${leadingZeroFormat(talk.talk, 2)}_${talk.id}-${frame}.png`);
}

/**
 * The thumbnail timeline for a given talk
 */
const ThumbnailTimeline = React.createClass({
  propTypes: {
    data: React.PropTypes.object, // the talk data object. has `terms` key
    width: React.PropTypes.number,
    height: React.PropTypes.number
  },

  getInitialState() {
    return {};
  },

  getDefaultProps() {
    return {
      width: 800,
      height: 100
    };
  },

  _visComponents() {
    const { data, width, height } = this.props;

    const innerMargin = { top: 0, right: 0, bottom: 0, left: 0 };
    const innerWidth = width - innerMargin.left - innerMargin.right;
    const innerHeight = height - innerMargin.top - innerMargin.bottom;


    let lastFrame = -1000;
    const minFramesBetween = 30;
    const frames = data.frames.filter(frame => {
      const result = frame - lastFrame > minFramesBetween;
      if (result) {
        lastFrame = frame;
      }

      return result;
    });

    return {
      data,
      width,
      height,
      innerMargin,
      innerWidth,
      innerHeight,
      frames
    };
  },

  _handleHoverThumbnail(frame) {
    this.setState({ focusedFrame: frame });
  },

  render() {
    const visComponents = this._visComponents();
    const { data, width, height, frames } = visComponents;
    const { focusedFrame } = this.state;

    const thumbnailFullWidth = 188;
    const thumbnailHeight = 100;

    const hasFocusedFrame = focusedFrame != null;

    // the compressed width is based on the combination of number of thumbnails, overall width and if
    // we have any thumbnail expanded currently
    let thumbnailCompressedWidth = width / frames.length;
    if (hasFocusedFrame) {
      thumbnailCompressedWidth = (width - thumbnailFullWidth) / (frames.length - 1);
    }

    return (
      <div className='thumbnail-timeline' style={{ width, height }}>

        {frames.map((frame, i) => {
          const isFocused = focusedFrame === frame;
          const url = thumbnailUrl(data, frame);
          let left = i * thumbnailCompressedWidth;

          if (hasFocusedFrame && frame > focusedFrame) {
            left += (thumbnailFullWidth - thumbnailCompressedWidth);
          }

          const thumbnailWidth = isFocused ? thumbnailFullWidth : thumbnailCompressedWidth;

          const style = {
            backgroundImage: `url(${url})`,
            left,
            height: thumbnailHeight,
            width: thumbnailWidth
          };

          return (
            <div key={i} className='thumbnail' style={style}
              onMouseEnter={this._handleHoverThumbnail.bind(this, frame)}
              onMouseLeave={this._handleHoverThumbnail.bind(this, null)} />
          );
        })}
      </div>
    );
  }
});

export default ThumbnailTimeline;
