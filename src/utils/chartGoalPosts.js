import { scaleOrdinal } from 'd3-scale';
import { schemeSet2 } from 'd3-scale-chromatic';
const d3 = {
  scaleOrdinal,
  schemeSet2
};

const colorScale = d3.scaleOrdinal(d3.schemeSet2); // d3.schemeTableau10

const generate = (g, data, xScale, yScale, color) => {
  g.append('line')
    .attr('stroke', color)
    .style('stroke-opacity', 1)
    .attr('stroke-width', 1)
    .attr('class', 'goalposts')
    .attr('x1', 0)
    .attr('y1', d => yScale(d.icu.max))
    .attr('x2', 0)
    .attr('y2', d => yScale(d.icu.min));
  g.append('line')
    .attr('stroke', color)
    .style('stroke-opacity', 1)
    .attr('stroke-width', 1)
    .attr('class', 'goalposts')
    .attr('x1', -5)
    .attr('y1', d => yScale(d.icu.max))
    .attr('x2', 5)
    .attr('y2', d => yScale(d.icu.max));
  g.append('line')
    .attr('stroke', color)
    .style('stroke-opacity', 1)
    .attr('stroke-width', 1)
    .attr('class', 'goalposts')
    .attr('x1', -5)
    .attr('y1', d => yScale(d.icu.min))
    .attr('x2', 5)
    .attr('y2', d => yScale(d.icu.min));
  g.append('circle')
    .attr('stroke', color)
    .attr('fill', color)
    .style('opacity', 0.75)
    .attr('stroke-width', 1)
    .attr('class', 'goalposts')
    .attr('r', 2)
    .attr('cy', d => yScale(d.icu.mean));
};

export { generate, colorScale };
