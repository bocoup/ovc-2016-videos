import React from 'react';

import './TalkPane.scss';
import AutoWidth from './AutoWidth';
import TermVis from './TermVis';
const TalkPane = React.createClass({
  propTypes: {
    data: React.PropTypes.object
  },

  componentWillMount() {
    window.addEventListener('resize', this._handleWindowResize);
  },

  componentWillUnmount() {
    window.removeEventListener('resize', this._handleWindowResize);
  },

  _handleWindowResize() {
    const debounceDelay = 200;

    // run initially
    if (this.resizeTimer == null) {
      this.forceUpdate();
    }

    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      this.forceUpdate();
      this.resizeTimer = null;
    }, debounceDelay);
  },

  render() {
    const { data } = this.props;

    if (!data) {
      return null;
    }

    return (
      <div className='talk-pane'>
        <header>
          <h1 className='talk-title'>{data.title}</h1>
          <h2 className='talk-speakers'>{data.speakers}</h2>
        </header>

        <AutoWidth><TermVis data={data} /></AutoWidth>
      </div>
    );
  }
});

export default TalkPane;
