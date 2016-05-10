import React from 'react';
import cx from 'classnames';
import * as Util from '../util/Util';

import './ThumbnailTimeline.scss';

// allows webpack to find the thumbnails
const thumbnailContext = require.context('../img/talks');

function thumbnailUrl(talk, frame) {
  return thumbnailContext(`./${talk.id}/ovc2016_${talk.day}_${Util.leadingZeroFormat(talk.talk, 2)}_${talk.id}-${frame}.png`);
}

/**
 * The thumbnail timeline for a given talk
 */
const ThumbnailTimeline = React.createClass({
  propTypes: {
    data: React.PropTypes.object, // the talk data object. has `terms` key
    width: React.PropTypes.number,
    height: React.PropTypes.number,
    highlightFrames: React.PropTypes.array,
    onHoverThumbnail: React.PropTypes.func,
    onClickThumbnail: React.PropTypes.func
  },

  getInitialState() {
    return {};
  },

  getDefaultProps() {
    return {
      width: 800,
      height: 120
    };
  },

  _visComponents() {
    const { data, width, height } = this.props;

    const innerMargin = { top: 0, right: 0, bottom: 0, left: 0 };
    const innerWidth = width - innerMargin.left - innerMargin.right;
    const innerHeight = height - innerMargin.top - innerMargin.bottom;

    const frames = data.frames;

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

  _handleClickThumbnail(frame) {
    const { onClickThumbnail, data } = this.props;

    if (onClickThumbnail) {
      onClickThumbnail(data, frame);
    }
  },

  _handleHoverThumbnail(frame) {
    const { onHoverThumbnail } = this.props;
    this.setState({ focusedFrame: frame });

    if (onHoverThumbnail) {
      onHoverThumbnail(frame);
    }
  },

  render() {
    const visComponents = this._visComponents();
    const { data, width, height, frames } = visComponents;
    const { highlightFrames } = this.props;
    const { focusedFrame } = this.state;

    const { thumbnailRatio } = data;
    const thumbnailFullWidth = Math.floor(height * thumbnailRatio) - 4; // many thumbnails seem to have this weird black line at the end

    const hasFocusedFrame = focusedFrame != null;
    const hasHighlightFrames = highlightFrames && highlightFrames.length;

    // the compressed width is based on the combination of number of thumbnails, overall width and if
    // we have any thumbnail expanded currently
    let thumbnailCompressedWidth = width / frames.length;
    if (hasFocusedFrame) {
      thumbnailCompressedWidth = (width - thumbnailFullWidth) / (frames.length - 1);
    }

    return (
      <div className={cx('thumbnail-timeline', { 'has-highlight': hasHighlightFrames })} style={{ width, height }}>

        {frames.map((frame, i) => {
          const isHighlighted = hasHighlightFrames && highlightFrames.indexOf(frame) !== -1;
          const isFocused = focusedFrame === frame;
          const url = thumbnailUrl(data, frame);

          // compute left positioning based on if there is an expanded thumbnail or not
          let left = i * thumbnailCompressedWidth;
          if (hasFocusedFrame && frame > focusedFrame) {
            left += (thumbnailFullWidth - thumbnailCompressedWidth);
          }

          const thumbnailWidth = isFocused ? thumbnailFullWidth : thumbnailCompressedWidth;

          const style = {
            backgroundImage: `url(${url})`,
            left,
            height,
            width: thumbnailWidth,
            backgroundSize: `auto ${height}px`
          };


          return (
            <div key={i} className={cx('thumbnail', { highlighted: isHighlighted })} style={style}
              onMouseEnter={this._handleHoverThumbnail.bind(this, frame)}
              onMouseLeave={this._handleHoverThumbnail.bind(this, null)}
              onClick={this._handleClickThumbnail.bind(this, frame)} />
          );
        })}
      </div>
    );
  }
});

export default ThumbnailTimeline;
