(function init(d3) {
  function initializeTimeline(talkData, focused) {
    const width = focused.node().offsetWidth;
    const height = 400;

    const innerMargin = { top: 10, right: 10, bottom: 10, left: 10 };
    const innerWidth = width - innerMargin.left - innerMargin.right;
    const innerHeight = height - innerMargin.top - innerMargin.bottom;

    const xScale = d3.scale.linear().domain([0, talkData.maxTime]).range([0, innerWidth]);
    const sizeScale = d3.scale.linear().domain([0, 0.1]).range([10, 30]);
    const svg = focused.append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
        .classed('vis-inner', true)
        .attr('transform', `translate(${innerMargin.left} ${innerMargin.top}`);


    const terms = svg.append('g')
      .classed('terms', true);


    const termGroup = terms.selectAll('.term')
      .data(talkData.terms, d => d.term)
      .enter()
      .append('g')
        .classed('term', true);

    // randomize which timestamp we use to prevent clumping near the start of the talk
    termGroup.append('text')
      .attr('x', (d, i) => xScale(d.timestamps[i % d.timestamps.length]))
      .attr('y', (d, i) => (i * 20) % innerHeight)
      .style('font-size', d => sizeScale(d.score))
      .text(d => d.term);
  }

  function initializeFocused(talkData, vis) {
    // add in container
    const focused = vis.append('div')
      .datum(talkData)
      .classed('focused-talk', true);

    // add in header
    const focusedHeader = focused.append('header');

    focusedHeader.append('h1')
      .classed('talk-title', true)
      .text(d => d.title);

    focusedHeader.append('h2')
      .classed('talk-speakers', true)
      .text(d => d.speakers);


    // add in timeline
    initializeTimeline(talkData, focused);
  }

  function initializeGrid(data, vis) {
    // add in grid
    const grid = vis.append('div')
      .classed('grid', true);

    // determine cell sizes
    const gridCellSpacing = 10;
    const gridCellWidth = 330;
    const gridCellHeight = gridCellWidth;

    // add in a cell for each talk
    const talkCells = grid.selectAll('.talk-cell')
      .data(data, d => d.id)
      .enter()
      .append('div')
        .classed('talk-cell', true)
        .style('width', `${gridCellWidth}px`)
        .style('height', `${gridCellHeight}px`)
        .style('margin', `0 ${gridCellSpacing}px ${gridCellSpacing}px 0`)
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
              .data(d.terms, d => d.term)
              .enter()
              .append('span')
                .classed('term', true)
                .text(d => d.term);
          });
  }

  function initializeVis(data) {
    const vis = d3.select('#video-vis');

    initializeFocused(data[0], vis);
    initializeGrid(data, vis);
  }

  d3.json('/data/ovc2016_talks.json', (error, data) => {
    console.log('data is ', data);

    if (error) {
      console.error(error);
      return;
    }

    initializeVis(data);
  });
})(window.d3);
