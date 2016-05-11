import React from 'react';
import ReactDOM from 'react-dom';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import d3 from 'd3';
import cx from 'classnames';
import ThumbnailTimeline from './ThumbnailTimeline';
import Dispatcher from '../events/Dispatcher';

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
    width: React.PropTypes.number
  },

  getInitialState() {
    return {};
  },

  getDefaultProps() {
    return {
      width: 1000
    };
  },

  componentDidMount() {
    // store the bounding boxes to fix the widths of text. sometimes it doesn't set it right,
    // I think possibly due to the loading of the web font, which maybe won't be an issue
    // when it is loaded in the page after selecting one as opposed to immediately on
    // page load.
    setTimeout(() => {
      this.setState({ boundingBoxes: this._readTermTextBoundingBoxes(), encodeScore: true, showText: true });
    }, 0);
  },

  componentDidUpdate(prevProps) {
    const { data } = this.props;

    // if the data changed, recompute the bounding boxes
    if (data !== prevProps.data) {
      this.setState({ boundingBoxes: this._readTermTextBoundingBoxes() });
    }
  },

  _visComponents() {
    const { data, width } = this.props;
    const { boundingBoxes } = this.state;

    // start with height 400
    let height = 400;
    const innerMargin = { top: 120, right: 50, bottom: 30, left: 50 };
    const innerWidth = width - innerMargin.left - innerMargin.right;

    // there's an issue using the max time to set the xScale since each chunk in the
    // compressed thumbnails will be K pixels wide. All chunks represent T time, except
    // the last chunk which is shorter than the rest. So instead, we set the scale
    // to match to the number of frames and have it end K pixels short of the width
    // (i.e., it ends at the beginning of the last thumbnail). Since the scale
    // is not clamped, it works for the timestamps that follow after it as well.
    const maxFrame = d3.max(data.frames);
    const thumbnailCompressedWidth = innerWidth / data.frames.length;
    const xScale = d3.scale.linear().domain([0, maxFrame]).range([0, innerWidth - thumbnailCompressedWidth]);


    const timelineHeight = 10;
    const termPadding = 8;
    const termHeight = 15 + 2 * termPadding;
    const termMargin = 4;


    const terms = data.terms.slice(0, 25);
    const scoreExtent = d3.extent(terms.map(term => term.score));
    const scoreScale = d3.scale.linear().domain(scoreExtent).range(['#fff', '#8ADAC8']);

    // generate the layout using the boundingBoxes
    const layout = this._computeLayout(terms, xScale, termPadding, termHeight, termMargin, boundingBoxes);

    // update height based on layout
    const maxLayoutY = d3.max(layout.map(d => d.y + d.height));
    if (maxLayoutY > 100) { // < 100 then just keep the default, probably hasn't been computed yet
      height = maxLayoutY + innerMargin.top + innerMargin.bottom;
    }
    const innerHeight = height - innerMargin.top - innerMargin.bottom;


    return {
      width,
      height,
      innerMargin,
      innerWidth,
      innerHeight,
      terms,
      termHeight,
      termPadding,
      timelineHeight,
      xScale,
      data,
      layout,
      scoreScale
    };
  },


  _readTermTextBoundingBoxes() {
    const svg = d3.select(ReactDOM.findDOMNode(this.refs.svg));
    const textElems = svg.selectAll('.term text')[0];
    return textElems.map(elem => elem.getBBox());
  },

  // NOTE: boundingBoxes is around the text element.
  _computeLayout(terms, xScale, termPadding, termHeight, termMargin, boundingBoxes) {

    // compute x values and width
    const layout = terms.map((term, i) => {
      const boundingBox = boundingBoxes && boundingBoxes[i];
      let width;

      // use bounding box if we have already calculated it
      if (boundingBox) {
        width = Math.ceil(boundingBox.width) + 2 * termPadding;
      } else {
        const termStr = term.term;
        width = termStr.length * 3 + 2 * termPadding; // crude approximation for now
      }

      return {
        term: term.term,
        x: xScale(d3.mean(term.timestamps)) - (width / 2),
        y: 30,
        width,
        height: termHeight
      };
    });

    if (!boundingBoxes) {
      return layout;
    }

    function collides(box1, box2) {
      // within vertical region
      if (box2.y >= box1.y && box2.y <= (box1.y + box1.height)) {

        // within horizontally (more complex due to variable width)
        const leftEdgeInside = box2.x >= box1.x && box2.x <= (box1.x + box1.width);
        const rightEdgeInside = (box2.x + box2.width) >= box1.x && (box2.x + box2.width) <= (box1.x + box1.width);
        const leftEdgeLeft = box2.x < box1.x;
        const rightEdgeRight = (box2.x + box2.width) > (box1.x + box1.width);

        if (leftEdgeInside || rightEdgeInside || (leftEdgeLeft && rightEdgeRight)) {
          return true;
        }
      }

      return false;
    }

    layout.map((termBox, i) => {
      // check all the terms that came before it to check if they collide
      // we need to restart the check loop each time there is a collision since
      // by moving the box we may have collided with boxes that we have already checked.
      for (let j = 0; j < i; j++) {
        const otherTermBox = layout[j];

        // we only will adjust y position to avoid collisions, since x encodes time
        if (collides(termBox, otherTermBox)) {
          termBox.y = otherTermBox.y + otherTermBox.height + termMargin;
          // recheck all boxes to ensure no new collisions as a result of changing position
          j = 0;
        }
      }
    });

    return layout;
  },

  _handleHoverTerm(term) {
    term = term == null ? this.state.toggledTerm : term;
    this.setState({ focusedTerm: term });
  },

  _handleClickThumbnail(talk, frame) {
    this.setState({ focusedTerm: null, toggledTerm: null });
    Dispatcher.trigger(Dispatcher.events.navigateVideo, talk, frame);
  },

  _handleClickTimestamp(timestamp) {
    const { data } = this.props;
    Dispatcher.trigger(Dispatcher.events.navigateVideo, data, timestamp);
  },

  _handleHoverThumbnail(frame) {
    this.setState({ focusedFrame: frame });
  },

  _handleClickTerm(term) {
    if (term === 'clear') { // if clicking the background of the svg
      this.setState({ focusedTerm: null, toggledTerm: null });
    } else {
      if (this.state.toggledTerm === term) {
        term = null;
      }

      this.setState({ toggledTerm: term });
    }
  },

  _getTermLayout(term, visComponents) {
    const { layout, terms } = visComponents;
    const termIndex = terms.indexOf(term);
    const termLayout = layout[termIndex];
    return termLayout;
  },

  _renderFocused(visComponents) {
    const { xScale, timelineHeight } = visComponents;
    const { focusedTerm } = this.state;

    if (!focusedTerm) {
      return null;
    }

    const { x: termX, y: termY, width: termWidth } = this._getTermLayout(focusedTerm, visComponents);
    const timelineY = -timelineHeight / 2; // counter-act the transform placed on terms and get to middle of timeline

    return (
      <g className='focused-group'>
        {focusedTerm.timestamps.map((time, i) => {
          const timelineX = xScale(time);
          return (
            <line key={i} x1={termX + termWidth / 2} y1={termY} x2={timelineX} y2={timelineY} className='timestamp-term-line' />
          );
        })}
      </g>
    );
  },

  // rect must be separate from text to get proper rendering with goo
  // otherwise the goo blurs text+rect and we get a darker goo blob than
  // the rect
  _renderTermRect(visComponents, term, termIndex) {
    const { data, termHeight: height, scoreScale } = visComponents;
    const { toggledTerm, focusedTerm, encodeScore, focusedFrame } = this.state;
    const { x, y, width } = this._getTermLayout(term, visComponents);

    const toggled = toggledTerm === term;
    const focused = focusedTerm === term;

    // check if a thumbnail is focused and if we should highlight this term
    let isInFocusedFrame = false;
    if (focusedFrame != null) {
      const termFrames = timestampsToFrames(term.timestamps, data.frames);
      isInFocusedFrame = termFrames.indexOf(focusedFrame) !== -1;
    }


    let rectFill;
    if (toggled) {
      rectFill = { fill: '#FFC6E6' };
    } else if (focused) {
      rectFill = { fill: '#C4E3F1' };
    } else if (isInFocusedFrame) {
      rectFill = { fill: '#E2DEF7' };
    } else if (encodeScore) {
      rectFill = { fill: scoreScale(term.score) };
    }

    return (
      <g key={termIndex} className={cx('term', { focused })}
          style={{ transform: `translate(${x}px, ${y}px)` }}
          onMouseEnter={this._handleHoverTerm.bind(this, term)}
          onMouseLeave={this._handleHoverTerm.bind(this, null)}
          onClick={this._handleClickTerm.bind(this, term)}>
        <rect x={0} y={0} width={width} height={height} style={rectFill} />
      </g>
    );
  },

  _renderTermText(visComponents, term, termIndex) {
    const { termPadding: padding } = visComponents;
    const { focusedTerm, showText } = this.state;
    const { x, y, width } = this._getTermLayout(term, visComponents);

    const focused = focusedTerm === term;
    const termStr = term.term;

    const textOpacity = showText ? 1 : 0;

    return (
      <g key={termIndex} className={cx('term', { focused })}
          style={{ transform: `translate(${x}px, ${y}px)` }}>
        <text x={width / 2} y={padding} textAnchor='middle' style={{ opacity: textOpacity }}>{termStr}</text>
      </g>
    );
  },

  _renderTerms(visComponents) {
    const { terms, timelineHeight, innerMargin, width, innerHeight } = visComponents;

    const gooStyle = { filter: 'url(#goo)' };
    // const gooStyle = {}; // temporarily disable goo

    return (
      <g className='terms' transform={`translate(0 ${timelineHeight})`}>
        <rect className='detoggle-click-space'
          x={-innerMargin.left} y={0}
          width={width} height={innerHeight + innerMargin.bottom}
          style={{ opacity: 0 }}
          onClick={this._handleClickTerm.bind(this, 'clear')}
         />
        {this._renderFocused(visComponents)}
        <ReactCSSTransitionGroup component='g' transitionName='terms' transitionAppear={true} transitionAppearTimeout={1000} transitionEnterTimeout={6000} transitionLeaveTimeout={0} style={gooStyle}>
          {terms.map((term, i) => this._renderTermRect(visComponents, term, i))}
        </ReactCSSTransitionGroup>
        {terms.map((term, i) => this._renderTermText(visComponents, term, i))}
      </g>
    );
  },

  _renderTimeline(visComponents) {
    const { width, innerMargin, timelineHeight } = visComponents;

    return (
      <g className='timeline'>
        <rect x={-innerMargin.left} y={0} width={width} height={timelineHeight} className='timeline-bg' />
      </g>
    );
  },

  // separate from the timeline rect so that the circles appear above the lines
  _renderTimelineMarkers(visComponents) {
    const { timelineHeight, xScale } = visComponents;
    const { focusedTerm } = this.state;

    let timestamps;
    if (focusedTerm) {
      timestamps = focusedTerm.timestamps;
    } else {
      return null;
    }

    const timestampMarkerRadius = 4;

    return (
      <g className='timeline-markers'>
        {timestamps && timestamps.map((time, i) => {
          return (
            <circle key={i} cx={xScale(time)} cy={timelineHeight / 2} r={timestampMarkerRadius}
              className='timestamp-marker' onClick={this._handleClickTimestamp.bind(this, time)} />
          );
        })}
      </g>
    );
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
          <ThumbnailTimeline data={this.props.data} width={width} highlightFrames={highlightFrames}
            onHoverThumbnail={this._handleHoverThumbnail} onClickThumbnail={this._handleClickThumbnail} />
        </div>
        <svg width={width} height={height} className='term-vis' ref='svg'>
          <defs>
            <filter id="goo">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
              <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
            </filter>
          </defs>
          <g className='vis-inner' transform={`translate(${innerMargin.left} ${innerMargin.top})`}>
            {this._renderTimeline(visComponents)}
            {this._renderTerms(visComponents)}
            {this._renderTimelineMarkers(visComponents)}
          </g>
        </svg>
      </div>
    );
  }
});

export default TermVis;
