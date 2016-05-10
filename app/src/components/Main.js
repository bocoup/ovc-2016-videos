import React from 'react';
import d3 from 'd3';
import Dispatcher from '../events/Dispatcher';

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
console.log('ovcTermsData', ovcTermsData);

// merge terms into talks
ovcData.forEach((talk, i) => {
  talk.terms = ovcTermsData[i].terms;
  talk.frames = ovcFramesData[i];
});

console.log('ovcData =', ovcData);

const Main = React.createClass({
  render() {
    return (
      <div>
        <TalkPane data={ovcData[0]} />
        <TalkGrid data={ovcData} />
        <TalkPlayerTray data={ovcData[0]} width={640} height={360} />
      </div>
    );
  }
});

export default Main;
