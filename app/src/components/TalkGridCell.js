import React from 'react';

import './TalkGridCell.scss';

const TalkGridCell = React.createClass({
  propTypes: {
    data: React.PropTypes.object
  },

  render() {
    const { data } = this.props;

    return (
      <div className='talk-grid-cell'>
        <h1 className='talk-title'>{data.title}</h1>
        <h2 className='talk-speakers'>{data.speakers}</h2>
      </div>
    );
  }
});

export default TalkGridCell;
