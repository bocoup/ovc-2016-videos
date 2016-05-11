import React from 'react';
import d3 from 'd3';
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

    if (!data) {
      return null;
    }

    const totalNumTerms = 5;
    const numTop = 2;
    const topTerms = data.terms.slice(0, numTop);

    // add in a few random terms
    const remainingTerms = data.terms.slice(numTop);
    const terms = topTerms.concat(d3.shuffle(remainingTerms).slice(0, totalNumTerms - numTop));

    const hasSlides = (data.slidesUrl && data.slidesUrl) !== '';

    return (
      <div className='talk-grid-cell' onClick={this._handleSelectTalk}>
        <div className='talk-grid-cell-main'>
          <h1 className='talk-title'>{data.title}</h1>
          <h2 className='talk-speakers'>{data.speakers}</h2>
          <div className='talk-terms'>
            {terms.map((term, i) => {
              return <div key={i} className='talk-term'>{term.term}</div>;
            })}
          </div>
        </div>
        <div className='talk-links'>
          <a href={`https://www.youtube.com/watch?v=${data.youtubeId}`}><i className='fa fa-lg fa-youtube-play' title='Play Video' /></a>
          {hasSlides ? <a href={`${data.slidesUrl}`}><i className='fa fa-lg fa-desktop' title='View Slides' /></a> : null}
        </div>
      </div>
    );
  }
});

export default TalkGridCell;
