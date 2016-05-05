(function init(d3) {
  d3.json('/data/ovc2016_talks.json', (error, data) => {
    console.log('data is ', data);

    if (error) {
      console.error(error);
      return;
    }

    initializeVis(data);
  });

  function initializeVis(data) {
    const vis = d3.select('#video-vis');

    // add in grid
    const grid = vis.append('div')
      .attr('class', 'grid');

    // determine cell sizes
    const gridWidth = grid.node().offsetWidth;
    const cellSpacing = 10;
    const cellWidth = Math.floor(gridWidth / 3) - cellSpacing;
    const cellHeight = cellWidth;

    // add in a cell for each talk
    const talkCells = grid.selectAll('.talk-cell')
      .data(data, d => d.id)
      .enter()
      .append('div')
        .classed('talk-cell', true)
        .style('width', `${cellWidth}px`)
        .style('height', `${cellHeight}px`)
        .style('margin', `0 ${cellSpacing}px ${cellSpacing}px 0`)
        .style('background-color', d => {
          if (d.day === 25) {
            return `rgba(0, 100, 100, ${0.3 * d.talk / 10})`;
          }
          return `rgba(100, 0, 100, ${0.3 * d.talk / 11})`;
        });

      talkCells.append('h1')
        .classed('talk-title', true)
        .text(d => d.title);

      talkCells.append('h2')
        .classed('talk-speakers', true)
        .text(d => d.speakers);

      // add in top tf-idf terms
      talkCells.append('div')
          .classed('top-terms', true)
          .each(function appendTerms(d) { // do NOT use => here since it breaks d3.select(this)
            d3.select(this).selectAll('.term')
              .data(d.tfidf, d => d.token)
              .enter()
              .append('span')
                .classed('term', true)
                .text(d => d.token);
          });

  }

})(window.d3);
