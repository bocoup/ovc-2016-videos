import React from 'react';
import cx from 'classnames';

import './TalkPane.scss';
import AutoWidth from './AutoWidth';
import TermVis from './TermVis';
const TalkPane = React.createClass({
  propTypes: {
    selectedTalk: React.PropTypes.object,
    allTalks: React.PropTypes.array,
    onTalkSelect: React.PropTypes.func
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

  _handleTalkSelect(talk) {
    const { onTalkSelect } = this.props;

    if (onTalkSelect) {
      onTalkSelect(talk);
    }
  },

  _renderQuickSelect() {
    const { allTalks } = this.props;

    return (
      <div className='talk-quick-select'>
        <span className='help-text'>Select a Talk:</span>
        <div className='talk-quick-select-items'>
          {allTalks.map((talk, i) => {
            const { shortId, day } = talk;
            return (
              <div key={i}
                className={cx('talk-quick-select-item', `day-${day}`)}
                onClick={this._handleTalkSelect.bind(this, talk)}>
                {shortId}
              </div>
            );
          })}
        </div>
      </div>
    );
  },

  render() {
    const { selectedTalk } = this.props;

    if (!selectedTalk) {
      return null;
    }

    return (
      <div className='talk-pane'>
        <header>
          <h2 className='talk-speakers'>{selectedTalk.speakers}</h2>
          <h1 className='talk-title'>{selectedTalk.title}</h1>
        </header>

        <AutoWidth><TermVis data={selectedTalk} /></AutoWidth>
        {this._renderQuickSelect()}
      </div>
    );
  }
});

export default TalkPane;
