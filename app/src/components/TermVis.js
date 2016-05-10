import React from 'react';
import ReactDOM from 'react-dom';
import d3 from 'd3';
import cx from 'classnames';
import ThumbnailTimeline from './ThumbnailTimeline';

import './TermVis.scss';

/**
 * takes an array of timestamps and an array of frames and
 * maps the timestamps to the frame that represents that time
 */
function timestampsToFrames(timestamps, frames) {
  let frameIndex = 0;

  const timestampFrames = timestamps.map(time => {
    while (frames[frameIndex]) {
      const frameStart = frames[frameIndex];
      const frameEnd = frames[frameIndex + 1];

      // at the end of the frames
      if (frameEnd === undefined) {
        return frameStart;

      // between this frame and the next
      } else if (frameStart <= time && time < frameEnd) {
        return frameStart;

      // time is > frameEnd, so increment frames
      } else {
        frameIndex += 1;
      }
    }

    return null;
  });

  return timestampFrames;
}

/**
 * Renders the visualization of top terms/bigrams in the talk
 */
const TermVis = React.createClass({
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
      height: 600
    };
  },

  _visComponents() {
    const { data, width, height } = this.props;

    const innerMargin = { top: 120, right: 50, bottom: 30, left: 50 };
    const innerWidth = width - innerMargin.left - innerMargin.right;
    const innerHeight = height - innerMargin.top - innerMargin.bottom;

    const xScale = d3.scale.linear().domain([0, data.maxTime]).range([0, innerWidth]);
    const termHeight = 25;
    const timelineHeight = 10;

    const terms = data.terms.slice(0, 15);

    return {
      width,
      height,
      innerMargin,
      innerWidth,
      innerHeight,
      terms,
      termHeight,
      timelineHeight,
      xScale,
      data
    };
  },

  _handleHoverTerm(term) {
    this.setState({ focusedTerm: term });
  },

  _getTermCoordinates(term, visComponents) {
    const { innerHeight, terms, xScale, timelineHeight } = visComponents;
    const termIndex = visComponents.terms.indexOf(term);

    return {
      x: xScale(d3.mean(term.timestamps)),
      y: (termIndex * ((innerHeight - timelineHeight) / terms.length))
    };
  },

  _renderFocused(visComponents) {
    const { xScale, timelineHeight } = visComponents;
    const { focusedTerm } = this.state;

    if (!focusedTerm) {
      return null;
    }

    const { x: termX, y: termY } = this._getTermCoordinates(focusedTerm, visComponents);
    const timelineY = -timelineHeight / 2; // counter-act the transform placed on terms and get to middle of timeline

    return (
      <g className='focused-group'>
        {focusedTerm.timestamps.map((time, i) => {
          const timelineX = xScale(time);
          return (
            <line key={i} x1={termX} y1={termY} x2={timelineX} y2={timelineY} className='timestamp-term-line' />
          );
        })}
      </g>
    );
  },

  _renderTerms(visComponents) {
    const { terms, timelineHeight, termHeight } = visComponents;
    const { focusedTerm, boundingBoxes } = this.state;
    const termPadding = 5;
    return (
      <g className='terms' transform={`translate(0 ${timelineHeight})`}>
        {this._renderFocused(visComponents)}
        {terms.map((term, i) => {
          const { x, y } = this._getTermCoordinates(term, visComponents);

          const isFocused = focusedTerm === term;
          const termStr = term.term;
          let termWidth;

          // use bounding box if we have already calculated it
          if (boundingBoxes && boundingBoxes[i]) {
            termWidth = Math.ceil(boundingBoxes[i].width) + 2 * termPadding;
          } else {
            termWidth = termStr.length * 10 + 2 * termPadding; // crude approximation for now
          }

          return (
            <g className={cx('term', { focused: isFocused })}
                key={termStr}
                transform={`translate(${x} ${y})`}
                onMouseEnter={this._handleHoverTerm.bind(this, term)}
                onMouseLeave={this._handleHoverTerm.bind(this, null)}>
              <rect x={-termWidth / 2} y={0} width={termWidth} height={termHeight} />
              <text x={0} y={termPadding} textAnchor='middle'>{termStr}</text>
            </g>
          );
        })}
      </g>
    );
  },


  _renderTimeline(visComponents) {
    const { innerWidth, timelineHeight, xScale } = visComponents;
    const { focusedTerm } = this.state;

    let timestamps;
    if (focusedTerm) {
      timestamps = focusedTerm.timestamps;
    }

    const timestampMarkerRadius = 4;

    return (
      <g className='timeline'>
        <rect x={0} y={0} width={innerWidth} height={timelineHeight} className='timeline-bg' />
        {timestamps && timestamps.map((time, i) => {
          return (
            <circle key={i} cx={xScale(time)} cy={timelineHeight / 2} r={timestampMarkerRadius}
              className='timestamp-marker' />
          );
        })}
      </g>
    );
  },

  _readTermBoundingBoxes() {
    const svg = ReactDOM.findDOMNode(this.refs.svg);
    const terms = d3.select(svg).selectAll('.term text');

    const boundingBoxes = terms[0].map((textElem) => {
      console.log(textElem.innerHTML, textElem.getBBox().width);
      return textElem.getBBox();
    });

    return boundingBoxes;
  },

  // compute the widths for the text terms
  componentDidMount() {
    setTimeout(() => {
      const boundingBoxes = this._readTermBoundingBoxes();
      this.setState({ boundingBoxes });
    }, 0);
  },

  render() {
    const visComponents = this._visComponents();
    const { data, width, height, innerMargin, innerWidth } = visComponents;
    const { focusedTerm } = this.state;

    let highlightFrames;
    if (focusedTerm) {
      highlightFrames = timestampsToFrames(focusedTerm.timestamps, data.frames);
    }

    return (
      <div className='term-vis-container'>
        <div className='timeline-container'>
          <ThumbnailTimeline data={this.props.data} width={innerWidth} highlightFrames={highlightFrames} />
        </div>
        <svg width={width} height={height} className='term-vis' ref='svg'>
          <g className='vis-inner' transform={`translate(${innerMargin.left} ${innerMargin.top})`}>
            {this._renderTimeline(visComponents)}
            {this._renderTerms(visComponents)}
          </g>
        </svg>
      </div>
    );
  }
});

export default TermVis;
