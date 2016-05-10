import React from 'react';
import ReactDOM from 'react-dom';
import d3 from 'd3';
import cx from 'classnames';

import './Term.scss';

/**
 * Renders an individual term in the term vis
 */
const Term = React.createClass({
  propTypes: {
    term: React.PropTypes.object,
    focused: React.PropTypes.bool,
    onHover: React.PropTypes.func,
    height: React.PropTypes.number,
    x: React.PropTypes.number,
    y: React.PropTypes.number
  },

  getInitialState() {
    return {};
  },

  _handleHover(term) {
    const { onHover } = this.props;

    if (onHover) {
      onHover(term);
    }
  },

  _readTermBoundingBox() {
    const textElem = ReactDOM.findDOMNode(this.refs.text);
    return textElem.getBBox();
  },

  // compute the widths for the text terms
  componentDidMount() {
    setTimeout(() => {
      const boundingBox = this._readTermBoundingBox();
      this.setState({ boundingBox });
    }, 0);
  },

  render() {
    const { term, focused, x, y, height } = this.props;
    const { boundingBox } = this.state;

    const termStr = term.term;

    let width;
    let padding = 5;

    // use bounding box if we have already calculated it
    if (boundingBox) {
      width = Math.ceil(boundingBox.width) + 2 * padding;
    } else {
      width = termStr.length * 10 + 2 * padding; // crude approximation for now
    }



    return (
      <g className={cx('term', { focused })}
          transform={`translate(${x} ${y})`}
          onMouseEnter={this._handleHover.bind(this, term)}
          onMouseLeave={this._handleHover.bind(this, null)}>
        <rect x={-width / 2} y={0} width={width} height={height} />
        <text ref='text' x={0} y={padding} textAnchor='middle'>{termStr}</text>
      </g>
    );
  }
});

export default Term;
