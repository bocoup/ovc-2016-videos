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

    return (
      <div className={cx('talk-player-tray', { open })}>
        <div className='tray-controls'>
        <button onClick={this._handleToggle}>{open ? 'Close' : 'Open'}</button>
        </div>

        <TalkPlayer width={videoWidth} height={videoHeight} data={data} />
      </div>
    );
  }
});

export default TalkPlayerTray;
