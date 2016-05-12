import React from 'react';
import d3 from 'd3';
import './TalkGridCell.scss';
import Dispatcher from '../events/Dispatcher';
import TimeoutTransitionGroup from '../vendor/TimeoutTransitionGroup';

function timerDelay() {
  return Math.random() * 30000 + 15000;
}

const transitionTime = 1000;

const TalkGridCell = React.createClass({
  propTypes: {
    data: React.PropTypes.object,
    onSelectTalk: React.PropTypes.func
  },

  getInitialState() {
    return {
      terms: this._selectTerms(true)
    };
  },

  componentWillMount() {
    this.timer = setTimeout(() => this._timedSetTerms(), timerDelay());
  },

  componentWillUnmount() {
    clearTimeout(this.timer);
    this.timer = null;
  },

  _handleSelectTalk() {
    const { onSelectTalk, data } = this.props;
    if (onSelectTalk) {
      onSelectTalk(data);
    }
  },

  // one timer removes exisitng random, then the next adds in a new set of random
  _timedSetTerms(includeRandomTerms) {
    this.timer = null;
    const terms = this._selectTerms(includeRandomTerms);
    this.setState({ terms });

    // if we included random terms, keep this for the long delay, otherwise just wait for the leave
    // transition to finish then add in random words
    this.timer = setTimeout(() => this._timedSetTerms(!includeRandomTerms),
      includeRandomTerms ? timerDelay() : transitionTime);
  },

  _selectTerms(includeRandomTerms) {
    const { data } = this.props;

    const totalNumTerms = 6;
    const numTop = 3;
    const topTerms = data.terms.slice(0, numTop);
    let terms = topTerms;

    // add in a few random terms
    if (includeRandomTerms) {
      const remainingTerms = data.terms.slice(numTop);
      terms = topTerms.concat(d3.shuffle(remainingTerms).slice(0, totalNumTerms - numTop));
    }

    return terms;
  },

  _handleClickPlayVideo(evt) {
    const { data } = this.props;
    Dispatcher.trigger(Dispatcher.events.navigateVideo, data, 0);

    evt.preventDefault();
    evt.stopPropagation();
  },

  _handleClickSlides(evt) {
    evt.stopPropagation();
  },


  render() {
    const { data } = this.props;

    if (!data) {
      return null;
    }

    const { terms } = this.state;

    const hasSlides = (data.slidesUrl && data.slidesUrl) !== '';

    const scoreExtent = d3.extent(data.terms.map(term => term.score));
    const scoreScale = d3.scale.linear().domain([scoreExtent[0], scoreExtent[1] * 0.9]).range([0.5, 1]);

    return (
      <div className={`talk-grid-cell day-${data.day}`} onClick={this._handleSelectTalk}>
        <div className='talk-grid-cell-main'>
          <h1 className='talk-title'>{data.title}</h1>
          <h2 className='talk-speakers'>{data.speakers}</h2>
          <div className='talk-terms'>
            <TimeoutTransitionGroup component='div' transitionName='talk-term' enterTimeout={transitionTime} leaveTimeout={transitionTime}>
              {terms.map((term) => {
                // wrap it in a div to get the transition opacity
                return <div className='talk-term-container' key={term.term}><div className='talk-term' style={{ opacity: scoreScale(term.score) }}>{term.term}</div></div>;
              })}
            </TimeoutTransitionGroup>
          </div>
        </div>
        <div className='talk-grid-cell-bottom'>
          <div className='talk-time'>
            {`April ${data.day}, ${data.time}`}
          </div>
          <a onClick={this._handleClickPlayVideo} dhref={`https://www.youtube.com/watch?v=${data.youtubeId}`}><i className='fa fa-lg fa-youtube-play' title='Play Video' /></a>
          {hasSlides ? <a onClick={this._handleClickSlides} href={`${data.slidesUrl}`}><i className='fa fa-lg fa-desktop' title='View Slides' /></a> : null}
        </div>
      </div>
    );
  }
});

export default TalkGridCell;
