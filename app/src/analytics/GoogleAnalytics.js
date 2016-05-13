// assumes window[GoogleAnalyticsObject] exists and is configured elsewhere
if (!window.GoogleAnalyticsObject) {
  window.GoogleAnalyticsObject = 'ga';
}

function GoogleAnalytics() {}

const category = 'ovc-videos';

GoogleAnalytics.prototype.trackEvent = function (action, label, value) {
  const ga = window[window.GoogleAnalyticsObject];

  // if Google Analytics has loaded, send it, otherwise queue it
  if (typeof ga === 'function') {
    ga('send', 'event', category, action, label, value);
  } else if (ga && ga.q && ga.q.constructor === Array) { // otherwise, queue it up
    ga.q.push(['send', 'event', category, action, label, value]);
  }
};

const instance = new GoogleAnalytics();

export default instance;
