import React from 'react';
import ReactDOM from 'react-dom';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import d3 from 'd3';
import cx from 'classnames';
import ThumbnailTimeline from './ThumbnailTimeline';
import Term from './Term';

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
      width: 1000,
      height: 600
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

  _visComponents() {
    const { data, width, height } = this.props;
    const { boundingBoxes } = this.state;

    const innerMargin = { top: 120, right: 50, bottom: 30, left: 50 };
    const innerWidth = width - innerMargin.left - innerMargin.right;
    const innerHeight = height - innerMargin.top - innerMargin.bottom;

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
    const termMargin = 20;


    const terms = data.terms.slice(0, 25);
    const scoreExtent = d3.extent(terms.map(term => term.score));
    const scoreScale = d3.scale.linear().domain(scoreExtent).range(['#fff', '#8ADAC8']);

    // generate the layout using the boundingBoxes
    const layout = this._computeLayout(terms, xScale, termPadding, termHeight, termMargin, boundingBoxes);

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
      // we only need to check them once since we are moving each term down,
      // so our modifications will keep the lack of collisions with previous terms
      for (let j = 0; j < i; j++) {
        const otherTermBox = layout[j];

        // we only will adjust y position to avoid collisions, since x encodes time
        if (collides(termBox, otherTermBox)) {
          termBox.y = otherTermBox.y + otherTermBox.height + termMargin;
        }
      }
    });

    return layout;
  },

  _handleHoverTerm(term) {
    this.setState({ focusedTerm: term });
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
    const { termHeight: height, scoreScale } = visComponents;
    const { focusedTerm, encodeScore } = this.state;
    const { x, y, width } = this._getTermLayout(term, visComponents);

    const focused = focusedTerm === term;

    let rectFill;
    if (focused) {
      rectFill = { fill: '#C4E3F1' };
    } else if (encodeScore) {
      rectFill = { fill: scoreScale(term.score) };
    }

    return (
      <g key={termIndex} className={cx('term', { focused })}
          style={{ transform: `translate(${x}px, ${y}px)` }}
          onMouseEnter={this._handleHoverTerm.bind(this, term)}
          onMouseLeave={this._handleHoverTerm.bind(this, null)}>
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
    const { terms, timelineHeight } = visComponents;

    const gooStyle = { filter: 'url(#goo)' };
    // const gooStyle = {}; // temporarily disable goo

    return (
      <g className='terms' transform={`translate(0 ${timelineHeight})`}>
        {this._renderFocused(visComponents)}
        <ReactCSSTransitionGroup component='g' transitionName='terms' transitionAppear={true} transitionAppearTimeout={1000} transitionEnterTimeout={6000} transitionLeaveTimeout={0} style={gooStyle}>
          {terms.map((term, i) => this._renderTermRect(visComponents, term, i))}
        </ReactCSSTransitionGroup>
        {terms.map((term, i) => this._renderTermText(visComponents, term, i))}
      </g>
    );
  },

  _renderTimeline(visComponents) {
    const { innerWidth, timelineHeight } = visComponents;

    return (
      <g className='timeline'>
        <rect x={0} y={0} width={innerWidth} height={timelineHeight} className='timeline-bg' />
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
              className='timestamp-marker' />
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
          <ThumbnailTimeline data={this.props.data} width={innerWidth} highlightFrames={highlightFrames} />
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
