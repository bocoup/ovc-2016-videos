import React from 'react';
import TalkGridCell from './TalkGridCell';

const TalkGrid = React.createClass({
  propTypes: {
    data: React.PropTypes.array
  },

  render() {
    const { data } = this.props;

    return (
      <div className='talk-grid'>
        {data.map(talk => {
          return (
            <TalkGridCell data={talk} key={talk.id} />
          );
        })}
      </div>
    );
  }
});

export default TalkGrid;
