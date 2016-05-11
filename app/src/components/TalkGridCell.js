import React from 'react';

import './TalkGridCell.scss';

const TalkGridCell = React.createClass({
  propTypes: {
    data: React.PropTypes.object,
    onSelectTalk: React.PropTypes.func
  },

  _handleSelectTalk() {
    const { onSelectTalk, data } = this.props;
    if (onSelectTalk) {
      onSelectTalk(data);
    }
  },

  render() {
    const { data } = this.props;

    return (
      <div className='talk-grid-cell' onClick={this._handleSelectTalk}>
        <h1 className='talk-title'>{data.title}</h1>
        <h2 className='talk-speakers'>{data.speakers}</h2>
      </div>
    );
  }
});

export default TalkGridCell;
