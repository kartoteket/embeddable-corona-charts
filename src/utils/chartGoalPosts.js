import { scaleOrdinal } from 'd3-scale';
import { schemeSet2 } from 'd3-scale-chromatic';
const d3 = {
  scaleOrdinal,
  schemeSet2
};

const strategyLables = {
  nothing: '«Slipp»',
  contain: '«Brems»',
  supress: '«Undertrykk»'
};

const colorScale = d3.scaleOrdinal(['#E31A1C', '#1F78B4', '#33A02C']); // d3.schemeTableau10

const generate = (g, dimension, yScale, color) => {
  g.append('line')
    .attr('stroke', color)
    .style('stroke-opacity', 1)
    .attr('stroke-width', 1)
    .attr('class', 'goalposts')
    .attr('x1', 0)
    .attr('y1', d => yScale(d[dimension].max))
    .attr('x2', 0)
    .attr('y2', d => yScale(d[dimension].min));
  g.append('line')
    .attr('stroke', color)
    .style('stroke-opacity', 1)
    .attr('stroke-width', 1)
    .attr('class', 'goalposts')
    .attr('x1', -5)
    .attr('y1', d => yScale(d[dimension].max))
    .attr('x2', 5)
    .attr('y2', d => yScale(d[dimension].max));
  g.append('line')
    .attr('stroke', color)
    .style('stroke-opacity', 1)
    .attr('stroke-width', 1)
    .attr('class', 'goalposts')
    .attr('x1', -5)
    .attr('y1', d => yScale(d[dimension].min))
    .attr('x2', 5)
    .attr('y2', d => yScale(d[dimension].min));
  g.append('circle')
    .attr('stroke', color)
    .attr('fill', color)
    .style('opacity', 0.75)
    .attr('stroke-width', 1)
    .attr('class', 'goalposts')
    .attr('r', 2)
    .attr('cy', d => yScale(d[dimension].mean));
  g.append('text')
    .style('font-family', 'Helvetica, Arial, sans serif')
    .style('font-size', '8px')
    .style('fill', color)
    .attr('x', 6)
    .attr('dy', (d, i) => {
      if (i < 1) {
        if (dimension === 'icu') {
          if (d[dimension].mean > 55) return -5;
          if (d[dimension].mean < 55) return 10;
        }
        if (dimension === 'hospital') {
          if (d[dimension].mean < 280) return 9;
        }
      }
      return 3;
    })
    .attr('y', d => yScale(d[dimension].mean))
    .text(d => d[dimension].mean);
};

const legend = (g, strategies, color) => {
  const height = 40;
  g.append('line')
    .attr('stroke', color)
    .style('stroke-opacity', 1)
    .attr('stroke-width', 1)
    .attr('class', 'goalposts')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', 0)
    .attr('y2', height);
  g.append('line')
    .attr('stroke', color)
    .style('stroke-opacity', 1)
    .attr('stroke-width', 1)
    .attr('class', 'goalposts')
    .attr('x1', -3)
    .attr('y1', 0)
    .attr('x2', 3)
    .attr('y2', 0);
  g.append('line')
    .attr('stroke', color)
    .style('stroke-opacity', 1)
    .attr('stroke-width', 1)
    .attr('class', 'goalposts')
    .attr('x1', -3)
    .attr('y1', height)
    .attr('x2', 3)
    .attr('y2', height);
  g.append('circle')
    .attr('stroke', color)
    .attr('fill', color)
    .style('opacity', 0.75)
    .attr('stroke-width', 1)
    .attr('class', 'goalposts')
    .attr('r', 2)
    .attr('cy', height / 2);
  g.append('text')
    .style('font-family', 'Helvetica, Arial, sans serif')
    .style('font-size', '9px')
    .style('fill', color)
    .attr('x', 6)
    .attr('dy', 2)
    .attr('y', 0)
    .text('maks');
  g.append('text')
    .style('font-family', 'Helvetica, Arial, sans serif')
    .style('font-size', '9px')
    .style('fill', color)
    .attr('x', 6)
    .attr('dy', 2)
    .attr('y', height)
    .text('min');
  g.append('text')
    .style('font-family', 'Helvetica, Arial, sans serif')
    .style('font-size', '9px')
    .style('fill', color)
    .attr('x', 6)
    .attr('dy', 2)
    .attr('y', height / 2)
    .text('prognose');

  const colorLegends = g
    .selectAll('g')
    .data(strategies)
    .join('g');

  colorLegends
    .append('circle')
    .attr('stroke', d => colorScale(d))
    .attr('fill', d => colorScale(d))
    .style('opacity', 0.75)
    .attr('stroke-width', 1)
    .attr('class', 'goalposts')
    .attr('r', 2)
    .attr('cy', (_, i) => 60 + 12 * i);

  colorLegends
    .append('text')
    .style('font-family', 'Helvetica, Arial, sans serif')
    .style('font-size', '9px')
    .style('fill', d => colorScale(d))
    .attr('x', 6)
    .attr('y', (_, i) => 60 + 12 * i)
    .attr('dy', 2)
    .text(d => strategyLables[d]);
};

export { generate, colorScale, legend };
