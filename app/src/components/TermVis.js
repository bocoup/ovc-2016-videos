import React from 'react';
import ReactDOM from 'react-dom';
import TimeoutTransitionGroup from '../vendor/TimeoutTransitionGroup';
import d3 from 'd3';
import cx from 'classnames';
import ThumbnailTimeline from './ThumbnailTimeline';
import Dispatcher from '../events/Dispatcher';
import * as Util from '../util/Util';
import Analytics from '../analytics/GoogleAnalytics';

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

const transitionUpdateTime = 300;
const transitionLeaveTime = 300;
const transitionEnterTime = transitionLeaveTime + 200 + 300; // delay until after all have left then a bit
const videoDelay = 3; // number of seconds to navigate the video back from the set timestamp/frame
/**
 * Renders the visualization of top terms/bigrams in the talk
 */
const TermVis = React.createClass({
  propTypes: {
    data: React.PropTypes.object, // the talk data object. has `terms` key
    width: React.PropTypes.number,
    touched: React.PropTypes.bool
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
      this.setState({ boundingBoxes: this._readTermTextBoundingBoxes(), encodeScore: true });
    }, 0);

    // try again to set the bounding boxes in case we haven't downloaded the font initially
    setTimeout(() => this.setState({ boundingBoxes: this._readTermTextBoundingBoxes() }), 100);
    setTimeout(() => this.setState({ boundingBoxes: this._readTermTextBoundingBoxes() }), 500);
    setTimeout(() => this.setState({ boundingBoxes: this._readTermTextBoundingBoxes() }), 3000);

  },

  componentWillReceiveProps(nextProps) {
    if (this.props.data !== nextProps.data) {
      if (this.updatingDataTimer) {
        clearTimeout(this.updatingDataTimer);
      }
      this.setState({ updatingData: true, focusedTerm: null, toggledTerm: null });
      this.updatingDataTimer = setTimeout(() => {
        this.updatingDataTimer = null;
        this.setState({ updatingData: false });
      }, transitionUpdateTime);
    }
  },

  componentDidUpdate(prevProps) {
    const { data, touched } = this.props;
    // if the data changed, recompute the bounding boxes
    if (data !== prevProps.data || touched !== prevProps.touched) {
      this.setState({ boundingBoxes: this._readTermTextBoundingBoxes() });
    }
  },

  _visComponents() {
    const { data, width, touched } = this.props;
    const { boundingBoxes } = this.state;

    // start with height 400
    let height = 400;
    const innerMargin = { top: 120, right: touched ? 80 : 50, bottom: 20, left: touched ? 80 : 50 };
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
    const xTimelineScale = d3.scale.linear().domain([0, maxFrame]).range([-innerMargin.left, width - thumbnailCompressedWidth - innerMargin.left]);

    const termTextSize = touched ? 20 : 14; // matches css-- needed since we can't use dominant-baseline: hanging for IE
    const timelineHeight = touched ? 35 : 16;
    const termPadding = touched ? 12 : 8;
    const termHeight = 15 + 2 * termPadding;
    const termMargin = touched ? 16 : 4;
    const maxNumTerms = 100;
    const termsTopMargin = touched ? 60 : 30;

    const terms = data.terms.slice(0, maxNumTerms);
    const scoreExtent = d3.extent(terms.map(term => term.score));

    const highScoreColor = '#46cce0';
    const lowScoreColor = '#fff';
    const scoreScale = d3.scale.linear().domain(scoreExtent).range([lowScoreColor, highScoreColor]);

    // generate the layout using the boundingBoxes
    const layout = this._computeLayout(terms, xScale, termPadding, termHeight, termMargin, termsTopMargin, boundingBoxes);

    // update height based on layout
    const maxLayoutY = d3.max(layout.map(d => d.y + d.height));
    if (maxLayoutY > 100) { // < 100 then just keep the default, probably hasn't been computed yet
      height = maxLayoutY + innerMargin.top + innerMargin.bottom + termMargin;
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
      xTimelineScale,
      data,
      layout,
      scoreScale,
      termTextSize,
      termsTopMargin
    };
  },


  _readTermTextBoundingBoxes() {
    const termsDiv = d3.select(ReactDOM.findDOMNode(this.refs.termsDiv));

    if (!termsDiv) {
      return null;
    }

    const textElems = termsDiv.selectAll('.term')[0];

    // can't rely on the index matching the terms since during update there are terms from both talks
    return textElems.reduce((boxes, elem) => {
      const termStr = elem.innerHTML;
      boxes[termStr] = elem.getBoundingClientRect();
      return boxes;
    }, {});
  },

  // NOTE: boundingBoxes is around the text element.
  _computeLayout(terms, xScale, termPadding, termHeight, termMargin, topMargin, boundingBoxes) {
    // compute x values and width
    const layout = terms.map((term, i) => {
      const boundingBox = boundingBoxes && boundingBoxes[term.term];
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
        y: topMargin,
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
    let { toggledTerm, focusedTerm } = this.state;

    // if we have a toggled term, check if we are clicking a thumbnail that is highlighted or not
    if (toggledTerm) {
      const highlightFrames = timestampsToFrames(toggledTerm.timestamps, talk.frames);
      if (highlightFrames.indexOf(frame) === -1) {
        toggledTerm = null;
        focusedTerm = null;
      }
    } else {
      focusedTerm = null;
    }

    Analytics.trackEvent('click-thumbnail', talk.id, frame);

    this.setState({ focusedTerm, toggledTerm });
    Dispatcher.trigger(Dispatcher.events.navigateVideo, talk, Math.max(frame - videoDelay, 0));
  },

  _handleClickTimestamp(timestamp) {
    const { data } = this.props;

    Analytics.trackEvent('click-timestamp', data.id, timestamp);

    Dispatcher.trigger(Dispatcher.events.navigateVideo, data, Math.max(timestamp - videoDelay, 0));
  },

  _handleHoverTimestamp(timestamp) {
    this.setState({ focusedTimestamp: timestamp });
  },

  _handleChangeFocusedFrame(frame) {
    this.setState({ focusedFrame: frame });
  },

  _handleClear() {
    this.setState({ focusedTerm: null, toggledTerm: null, focusedFrame: null });
  },

  _handleClickTerm(term, evt) {
    if (this.state.toggledTerm === term) {
      term = null;
    }

    this.setState({ focusedTerm: term, toggledTerm: term });
    evt.preventDefault(); // prevent click when touching which would invert the toggle

    // track overall term clicking
    Analytics.trackEvent('click-term', term.term);
    // track talk-specific term clicking
    Analytics.trackEvent('click-talk-term', `${this.props.data.id}: ${term.term}`);
  },

  _getTermLayout(term, visComponents) {
    const { layout, terms } = visComponents;
    const termIndex = terms.indexOf(term);
    const termLayout = layout[termIndex];
    return termLayout;
  },

  _renderFocused(visComponents) {
    const { xTimelineScale, timelineHeight } = visComponents;
    const { focusedTerm } = this.state;

    if (!focusedTerm) {
      return null;
    }

    const termLayout = this._getTermLayout(focusedTerm, visComponents);
    if (!termLayout) {
      return null;
    }

    const { x: termX, y: termY, width: termWidth } = termLayout;
    const timelineY = -timelineHeight / 2; // counter-act the transform placed on terms and get to middle of timeline

    return (
      <g className='focused-group'>
        {focusedTerm.timestamps.map((time, i) => {
          const timelineX = xTimelineScale(time);
          return (
            <line key={i} x1={termX + termWidth / 2} y1={termY} x2={timelineX} y2={timelineY} className='timestamp-term-line' />
          );
        })}
      </g>
    );
  },

  _renderTermLines(visComponents) {
    const { timelineHeight } = visComponents;
    const { updatingData } = this.state;

    return (
      <g transform={`translate(0 ${timelineHeight})`}
        className={cx('terms', { 'updating-terms': updatingData })}>
        {this._renderFocused(visComponents)}
      </g>
    );
  },

  _renderTermDiv(visComponents, term) {
    const { data, scoreScale } = visComponents;
    const { toggledTerm, focusedTerm, encodeScore, focusedFrame } = this.state;
    const { x, y } = this._getTermLayout(term, visComponents);

    const toggled = toggledTerm === term;
    const focused = focusedTerm === term;

    // check if a thumbnail is focused and if we should highlight this term
    let isInFocusedFrame = false;
    if (focusedFrame != null) {
      const termFrames = timestampsToFrames(term.timestamps, data.frames);
      isInFocusedFrame = termFrames.indexOf(focusedFrame) !== -1;
    }


    let rectStyle;
    // otherwise read from the CSS
    if (!toggled && !focused && !isInFocusedFrame && encodeScore) {
      rectStyle = { fill: scoreScale(term.score) };
    }
    const termStr = term.term;


    return (
      <div key={termStr} className={cx('term', { focused, toggled, 'in-frame': isInFocusedFrame })}
          onMouseEnter={this._handleHoverTerm.bind(this, term)}
          onMouseLeave={this._handleHoverTerm.bind(this, null)}
          onClick={this._handleClickTerm.bind(this, term)}
          onTouchEnd={this._handleClickTerm.bind(this, term)}
          style={{ transform: `translate(${x}px, ${y}px)`, backgroundColor: rectStyle && rectStyle.fill }}>
        {termStr}
      </div>
    );
  },

  _renderTermDivs(visComponents) {
    const { terms, innerMargin, width, innerHeight } = visComponents;
    const { updatingData } = this.state;

    return (
      <div className={cx('terms', { 'updating-terms': updatingData })}>
        <div className='detoggle-click-space'
          style={{ marginLeft: -innerMargin.left, width: width, height: innerHeight }}
          onClick={this._handleClear}
          onTouchEnd={this._handleClear} />
        <TimeoutTransitionGroup
            component='div'
            transitionName='term'
            enterTimeout={transitionEnterTime}
            leaveTimeout={transitionLeaveTime}>
          {terms.map((term, i) => this._renderTermDiv(visComponents, term, i))}
        </TimeoutTransitionGroup>
      </div>
    );
  },

  _renderTimeline(visComponents) {
    const { data, width, innerMargin, xTimelineScale, timelineHeight } = visComponents;
    const { focusedTerm } = this.state;
    const timeWidth = 35;

    // gets the starting and ending edges for the text and the text anchor.
    function getStartEndAnchor(time) {
      let x = xTimelineScale(time);
      let xStart, xEnd, textAnchor;
      if (x < timeWidth) {
        textAnchor = 'start';
        xStart = x;
        xEnd = x + timeWidth;
      } else if (x + timeWidth > xTimelineScale.range()[1]) {
        textAnchor = 'end';
        xStart = x - timeWidth;
        xEnd = x;
      } else {
        textAnchor = 'middle';
        xStart = Math.floor(x - timeWidth / 2);
        xEnd = Math.ceil(x + timeWidth / 2);
      }

      return { textAnchor, xStart, xEnd };
    }

    // add timestamps from focused term without overlap
    const timesToShow = [0, data.maxTime];
    if (focusedTerm) {
      focusedTerm.timestamps.forEach(time => {
        // if it doesn't overlap, add it in
        let overlap = false;
        const { xStart, xEnd } = getStartEndAnchor(time);

        timesToShow.forEach(shownTime => {
          // be generous with adding/subtracting width since text anchor changes
          const { xStart: shownXStart, xEnd: shownXEnd } = getStartEndAnchor(shownTime);

          if ((shownXStart <= xStart && shownXEnd >= xStart) || (shownXStart <= xEnd && shownXEnd >= xEnd)) {
            overlap = true;
          }
        });

        if (!overlap) {
          timesToShow.push(time);
        }
      });
    }

    return (
      <g className='timeline'>
        <rect x={-innerMargin.left} y={0} width={width} height={timelineHeight} className='timeline-bg' />
        {timesToShow.map((time, i) => {
          const x = xTimelineScale(time);
          const y = timelineHeight;
          const { textAnchor } = getStartEndAnchor(time);

          return (
            <g className='time-group' key={i} transform={`translate(${x} ${y})`}>
              <text x={0} y={0} textAnchor={textAnchor} dy={10}>{Util.timeFormat(time)}</text>
            </g>
          );
        })}
      </g>
    );
  },

  // separate from the timeline rect so that the circles appear above the lines
  _renderTimelineMarkers(visComponents) {
    const { timelineHeight, xTimelineScale } = visComponents;
    const { focusedTerm, focusedTimestamp } = this.state;

    let timestamps;
    if (focusedTerm) {
      timestamps = focusedTerm.timestamps;
    } else {
      return null;
    }

    const timestampMarkerRadius = Math.round(0.6 * timelineHeight / 2);
    const timeWidth = 35;
    const timeHeight = 12;

    return (
      <g className='timeline-markers'>
        {timestamps && timestamps.map((time, i) => {
          const cx = xTimelineScale(time);
          const cy = timelineHeight / 2;

          let focusedTimestampTime;
          if (focusedTimestamp === time) {
            focusedTimestampTime = (
              <g className='time-group focused' transform={`translate(0 ${timelineHeight + 15})`}>
                <rect x={-timeWidth / 2} y={0} width={timeWidth} height={timeHeight} />
                <text x={0} y={0} textAnchor={'middle'} dy={10}>{Util.timeFormat(time)}</text>
              </g>
            );
          }

          return (
            <g key={i} transform={`translate(${cx} 0)`}>
              <circle key={i} cx={0} cy={cy} r={timestampMarkerRadius}
                className='timestamp-marker'
                onMouseEnter={this._handleHoverTimestamp.bind(this, time)}
                onMouseLeave={this._handleHoverTimestamp.bind(this, null)}
                onClick={this._handleClickTimestamp.bind(this, time)}
                onTouchEnd={this._handleClickTimestamp.bind(this, time)} />
              {focusedTimestampTime}
            </g>
          );
        })}
      </g>
    );
  },

  render() {
    const { touched } = this.props;
    const visComponents = this._visComponents();
    const { data, width, height, innerMargin, timelineHeight, termsTopMargin } = visComponents;
    const { focusedTerm, focusedFrame } = this.state;

    let highlightFrames;
    if (focusedTerm) {
      highlightFrames = timestampsToFrames(focusedTerm.timestamps, data.frames);
    }

    // switching from rect/text to div has made it so we need multiple SVG layers
    // the marker layer needs to be separate from the lines layer since it needs
    // mouse events and the line layer needs to have no mouse events so you can
    // hover over the div boxes. Yet the line layer needs to be above the boxes.
    return (
      <div className='term-vis-container' style={{ width, height }}>
        <div ref='termsDiv' className={cx('terms-container', { touched })}
            style={{ marginTop: innerMargin.top + timelineHeight, marginLeft: innerMargin.left }}>
          {this._renderTermDivs(visComponents)}
        </div>
        <svg width={width} height={height}
            className={cx('term-vis', 'term-vis-line-layer', { touched })}>
          <g className='vis-inner' transform={`translate(${innerMargin.left} ${innerMargin.top})`}>
            {this._renderTimeline(visComponents)}
            {this._renderTermLines(visComponents)}
          </g>
        </svg>
        <svg width={width} height={innerMargin.top + timelineHeight + termsTopMargin}
            className={cx('term-vis', 'term-vis-marker-layer', { touched })}>
          <g className='vis-inner' transform={`translate(${innerMargin.left} ${innerMargin.top})`}>
            {this._renderTimelineMarkers(visComponents)}
          </g>
        </svg>
        <div className='timeline-container'>
          <ThumbnailTimeline data={this.props.data} width={width} highlightFrames={highlightFrames}
              focusedFrame={focusedFrame}
              onChangeFocusedFrame={this._handleChangeFocusedFrame}
              onClickThumbnail={this._handleClickThumbnail} />
        </div>
      </div>
    );
  }
});

export default TermVis;
