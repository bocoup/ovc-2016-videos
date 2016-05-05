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
    const cellHeight = Math.floor(cellWidth * 10 / 16);

    // add in a cell for each talk
    const talkCells = grid.selectAll('.talk-cell')
      .data(data, d => d.id)
      .enter()
      .append('div')
        .attr('class', 'talk-cell')
        .style('width', `${cellWidth}px`)
        .style('height', `${cellHeight}px`)
        .style('margin', `0 ${cellSpacing}px ${cellSpacing}px 0`)
        .style('background-color', d => {
          if (d.day === 25) {
            return `rgba(0, 100, 100, ${0.3 * d.talk / 10})`;
          }
          return `rgba(100, 0, 100, ${0.3 * d.talk / 11})`;
        })
        .text(d => d.title);
  }
})(window.d3);
