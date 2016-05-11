import React from 'react';
import TalkGridCell from './TalkGridCell';

const TalkGrid = React.createClass({
  propTypes: {
    data: React.PropTypes.array,
    onSelectTalk: React.PropTypes.func
  },

  render() {
    const { data, onSelectTalk } = this.props;

    return (
      <div className='talk-grid'>
        {data.map(talk => {
          return (
            <TalkGridCell data={talk} key={talk.id} onSelectTalk={onSelectTalk} />
          );
        })}
      </div>
    );
  }
});

export default TalkGrid;
