import React from 'react';

import './TalkPane.scss';
import TermVis from './TermVis';
const TalkPane = React.createClass({
  propTypes: {
    data: React.PropTypes.object
  },

  render() {
    const { data } = this.props;

    return (
      <div className='talk-pane'>
        <header>
          <h1 className='talk-title'>{data.title}</h1>
          <h2 className='talk-speakers'>{data.speakers}</h2>
        </header>

        <TermVis data={data} />
      </div>
    );
  }
});

export default TalkPane;
