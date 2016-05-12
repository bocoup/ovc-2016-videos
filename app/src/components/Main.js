import React from 'react';
import ReactDOM from 'react-dom';
import d3 from 'd3';
import Scroll from '../vendor/Scroll';

import TalkGrid from './TalkGrid';
import TalkPlayerTray from './TalkPlayerTray';
import TalkPane from './TalkPane';

import './Main.scss';
import ovcData from '../data/ovc2016_talks.json';
import ovcTermsData from '../data/ovc2016_terms.json';
import ovcFramesData from '../data/ovc2016_frames.json';

// for convenience while debugging, put d3 and the data in window
window.d3 = d3;
window.ovcData = ovcData;

// merge terms and frames into talks
ovcData.forEach((talk, i) => {
  talk.terms = ovcTermsData[i].terms;
  talk.frames = ovcFramesData[i];
});

console.log('ovcData =', ovcData);

const bodyScroll = new Scroll(document.body);

const Main = React.createClass({

  getInitialState() {
    return {};
  },

  _handleSelectTalk(talk) {
    this.setState({
      selectedTalk: talk
    });

    // scroll to the talk if we are beneath it
    const talkPane = ReactDOM.findDOMNode(this.refs.talkPane);
    const talkPaneTop = talkPane.getBoundingClientRect().top + window.pageYOffset;
    if (document.body.scrollTop > talkPaneTop) {
      bodyScroll.toElement(talkPane);
    }
  },

  render() {
    const { selectedTalk } = this.state;

    return (
      <div>
        <TalkPane ref='talkPane' selectedTalk={selectedTalk} allTalks={ovcData} onTalkSelect={this._handleSelectTalk} />
        <TalkGrid data={ovcData} onSelectTalk={this._handleSelectTalk} />
        <TalkPlayerTray data={selectedTalk} width={640} height={360} />
      </div>
    );
  }
});

export default Main;
