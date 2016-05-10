import React from 'react';
import cx from 'classnames';
import Dispatcher from '../events/Dispatcher';

import TalkPlayer from './TalkPlayer';
import './TalkPlayerTray.scss';

const TalkPlayerTray = React.createClass({
  propTypes: {
    data: React.PropTypes.object,
    videoWidth: React.PropTypes.number,
    videoHeight: React.PropTypes.number
  },

  getInitialState() {
    return {
      open: false
    };
  },

  componentWillMount() {
    Dispatcher.subscribe(this);
  },

  componentWillUnmount() {
    Dispatcher.unsubscribe(this);
  },

  onDispatch(event, ...args) {
    if (event === Dispatcher.events.navigateVideo) {
      if (!this.state.open) {
        this._handleToggle();
      }
    }
  },

  _handleToggle() {
    const open = !this.state.open;

    if (!open) {
      Dispatcher.trigger(Dispatcher.events.stopVideo);
    }

    this.setState({
      open
    });
  },

  render() {
    const { data, videoWidth, videoHeight } = this.props;
    const { open } = this.state;

    if (!data) {
      return null;
    }

    return (
      <div className={cx('talk-player-tray', { open })}>
        <div className='tray-controls'>
          <i onClick={this._handleToggle} className={cx('close-control', 'fa', { 'fa-chevron-down': open, 'fa-chevron-up': !open })} />
        </div>
        <div className='player-container'>
          <TalkPlayer width={videoWidth} height={videoHeight} data={data} />
        </div>
      </div>
    );
  }
});

export default TalkPlayerTray;
