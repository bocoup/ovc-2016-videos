import React from 'react';
import d3 from 'd3';
import cx from 'classnames';

import './TermVis.scss';

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

    const innerMargin = { top: 10, right: 50, bottom: 30, left: 50 };
    const innerWidth = width - innerMargin.left - innerMargin.right;
    const innerHeight = height - innerMargin.top - innerMargin.bottom;

    const xScale = d3.scale.linear().domain([0, data.maxTime]).range([0, innerWidth]);
    const termHeight = 25;
    const timelineHeight = 30;

    const terms = data.terms;

    return {
      width,
      height,
      innerMargin,
      innerWidth,
      innerHeight,
      terms,
      termHeight,
      timelineHeight,
      xScale
    };
  },

  _handleHoverTerm(term) {
    this.setState({ focusedTerm: term });
  },

  _getTermCoordinates(term, visComponents) {
    const { innerHeight, terms, xScale, timelineHeight } = visComponents;
    const termIndex = visComponents.terms.indexOf(term);

    return {
      x: xScale(term.timestamps[termIndex % term.timestamps.length]),
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
    const { focusedTerm } = this.state;

    return (
      <g className='terms' transform={`translate(0 ${timelineHeight})`}>
        {this._renderFocused(visComponents)}
        {terms.map((term) => {
          const { x, y } = this._getTermCoordinates(term, visComponents);

          const isFocused = focusedTerm === term;
          const termStr = term.term;
          const termWidth = termStr.length * 10; // crude approximation for now

          return (
            <g className={cx('term', { focused: isFocused })}
                key={termStr}
                transform={`translate(${x} ${y})`}
                onMouseEnter={this._handleHoverTerm.bind(this, term)}
                onMouseLeave={this._handleHoverTerm.bind(this, null)}>
              <rect x={-termWidth / 2} y={0} width={termWidth} height={termHeight} />
              <text x={4} y={5} textAnchor='middle'>{termStr}</text>
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

  render() {
    const visComponents = this._visComponents();
    const { width, height, innerMargin } = visComponents;

    return (
      <svg width={width} height={height} className='term-vis'>
        <g className='vis-inner' transform={`translate(${innerMargin.left} ${innerMargin.top})`}>
          {this._renderTimeline(visComponents)}
          {this._renderTerms(visComponents)}
        </g>
      </svg>
    );
  }
});

export default TermVis;
