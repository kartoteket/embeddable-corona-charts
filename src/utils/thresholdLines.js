const add = (g, data, pos) => {
  g.append('line')
    .attr('stroke', '#FF7F00')
    .style('stroke-opacity', 1)
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4 4')
    .attr('class', 'goalposts')
    .attr('x1', pos.x1)
    .attr('y1', data[0])
    .attr('x2', pos.x2)
    .attr('y2', data[0]);
  g.append('text')
    .style('font-family', 'Helvetica, Arial, sans serif')
    .style('font-size', '9px')
    .style('fill', '#FF7F00')
    .attr('x', pos.xText)
    .attr('y', data[0])
    .selectAll('tspan')
    .data(data[1])
    .join('tspan')
    .attr('text-anchor', 'left')
    .attr('x', pos.xText)
    .attr('dy', (_, i) => `${i * 1.2}em`)
    .text(d => d);
};

export { add };
