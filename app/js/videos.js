(function init(d3) {
  d3.json('/data/ovc2016_talks.json', (error, data) => {
    console.log('data is ', data);
  });
})(window.d3);
