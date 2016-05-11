import React from 'react';
import ReactDOM from 'react-dom';

/**
 * Component for automatically setting a width prop to the DOM node of the first child
 * By Peter Beshai (@pbesh)
 */
const AutoWidth = React.createClass({
  propTypes: {
    children: React.PropTypes.object
  },

  getInitialState() {
    return {
      width: 200 // arbitrary starting number
    };
  },

  componentDidMount() {
    this._updateWidth();
  },

  componentDidUpdate() {
    // need this here to auto resize when window size changes
    if (this._shouldUpdateWidth()) {
      this._updateWidth();
    }
  },

  // Returns true the dom node width is different than the stored state width
  _shouldUpdateWidth() {
    const domWidth = this._getResizeDOMNode().offsetWidth;
    return this.state.width !== domWidth;
  },

  // Call set state to update the width so it starts an update of the child component
  _updateWidth() {
    this.setState({
      width: this._getResizeDOMNode().offsetWidth
    });
  },

  _getResizeDOMNode() {
    return ReactDOM.findDOMNode(this);
  },

  render() {
    if (React.Children.count(this.props.children) > 1) {
      console.warn('AutoWidth only works with a single child element.');
    }
    const child = this.props.children;
    const newChild = React.cloneElement(child, { width: this.state.width });
    return <div className='auto-width'>{newChild}</div>;
  }
});

export default AutoWidth;
