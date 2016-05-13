import React from 'react';
import cx from 'classnames';

import Dispatcher from '../events/Dispatcher';
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

  _handleTitleClick(evt) {
    const { selectedTalk } = this.props;
    Dispatcher.trigger(Dispatcher.events.navigateVideo, selectedTalk, 0);

    evt.preventDefault();
  },

  _renderQuickSelect() {
    const { allTalks, touched } = this.props;

    function renderTalk(talk, i) {
      return (
        <div key={i}
          className={cx('talk-quick-select-item', `day-${talk.day}`)}
          onClick={this._handleTalkSelect.bind(this, talk)}>
          {talk.shortId}
        </div>
      );
    }

    return (
      <div className={cx('talk-quick-select', { touched })}>
        <span className='help-text'>Select a Talk:</span>
        <div className='talk-quick-select-items'>
          <div className='talks-day-group'>{allTalks.filter(talk => talk.day === 25).map(renderTalk.bind(this))}</div>
          <div className='talk-day-group'>{allTalks.filter(talk => talk.day === 26).map(renderTalk.bind(this))}</div>
        </div>
      </div>
    );
  },

  _renderTalk() {
    const { selectedTalk, touched } = this.props;

    if (!selectedTalk) {
      return null;
    }

    return (
      <div>
        <header>
          <h2 className='talk-speakers'>{selectedTalk.speakers}</h2>
          <h1 className='talk-title'>
            <a onClick={this._handleTitleClick}
              href={`https://www.youtube.com/watch?v=${selectedTalk.youtubeId}`}>
              {selectedTalk.title}
            </a>
          </h1>
        </header>
        <AutoWidth><TermVis data={selectedTalk} touched={touched} /></AutoWidth>
      </div>
    );
  },

  render() {
    const { selectedTalk } = this.props;

    return (
      <div className={cx('talk-pane', { 'has-talk': !!selectedTalk })}>
        {this._renderQuickSelect()}
        {this._renderTalk()}
      </div>
    );
  }
});

export default TalkPane;
