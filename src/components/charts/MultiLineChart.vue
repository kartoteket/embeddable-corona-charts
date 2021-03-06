<template>
  <svg :id="`chart-${id}`" class="chart" />
</template>
<script>
import * as d3 from 'd3'; // @todo cherrypick like this: var d3 = Object.assign({}, require("d3-format"), require("d3-geo"), require("d3-geo-projection"));
const locale = d3.formatLocale({
  decimal: ',',
  thousands: ' ',
  grouping: [3]
});

// extras
// @todo move into instace scope
let goalPosts = null;
let thresholds = {};

export default {
  props: {
    yScaleType: {
      type: String,
      default: 'linear'
    },
    series: {
      type: Array,
      required: true
    },
    id: {
      type: [String, Number],
      default: '1'
    },
    config: {
      type: Object,
      default: () => {}
    },
    extras: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      chart: null,

      defaultConfig: {
        aspectRatio: 0.5,
        colorScale: d3.scaleOrdinal(d3.schemeSet2),
        textColor: '#fff',
        yAxis: 'left',
        curve: d3.curveCatmullRom,
        margin: {
          right: 30,
          left: 50,
          top: 20,
          bottom: 20
        },
        domainX: d3.extent(this.series[0].values, d => d.date),
        domainY: [
          0,
          // d3.min(this.series, s => d3.min(s.values, v => v.value)),
          d3.max(this.series, s => d3.max(s.values, v => v.value))
        ]
      }
    };
  },
  computed: {
    options() {
      return { ...this.defaultConfig, ...this.config };
    },
    width() {
      return d3.min([500, 1600]); // @todo: get clientWidth
    },
    height() {
      return d3.min([this.width * this.options.aspectRatio, 800]);
    },
    yScale() {
      return this.yScaleType === 'log' ? this.yScaleLog : this.yScaleLinear;
    },
    yScaleLinear() {
      return d3
        .scaleLinear()
        .domain(this.options.domainY)
        .range([
          this.height - this.options.margin.bottom,
          this.options.margin.top
        ]);
    },
    yScaleLog() {
      return d3
        .scaleLog()
        .base(10)
        .domain([
          d3.max([1, d3.min(this.series, s => d3.min(s.values, v => v.value))]),
          d3.max(this.series, s => d3.max(s.values, v => v.value))
        ])
        .range([
          this.height - this.options.margin.bottom,
          this.options.margin.top
        ]);
    },
    xScale() {
      return d3
        .scaleTime()
        .domain(this.options.domainX)
        .range([
          this.options.margin.left,
          this.width - this.options.margin.right
        ]);
    },
    color() {
      return this.options.colorScale;
      // return d3.scaleOrdinal(d3.schemeSet2);
    },
    changeLine() {
      return d3
        .line()
        .defined(d =>
          this.yScaleType === 'log' ? d.value > 0 : !isNaN(d.value)
        )
        .x(d => this.xScale(d.date))
        .y(d => this.yScale(d.value))
        .curve(this.options.curve);
    }
  },
  watch: {
    series(val) {
      this.drawChart(`#chart-${this.id}`, val);
    },
    yScaleType() {
      this.drawChart(`#chart-${this.id}`, this.series);
    }
  },

  mounted() {
    // if in scenarios-mode, load goalPosts-utils
    if (this.extras) {
      if (this.extras.id === 'scenarios') {
        goalPosts = require('@/utils/chartGoalPosts.js');
        if (this.series[0].id === 'icu') {
          // @todo: make this a config property "thresholds"
          thresholds = require('@/utils/thresholdLines.js');
        }
      }
    }

    this.drawChart(`#chart-${this.id}`, this.series);
  },
  methods: {
    drawChart(id, series) {
      const that = this;
      const el = this.chart || d3.select(id);
      const svg = el;
      const t = svg.transition().duration(750);

      // initalize on first call
      if (!el.g) {
        svg
          .attr('viewBox', `0 0 ${this.width} ${this.height}`)
          .attr('style', 'width:100%');
        el.g = svg.append('g');
        el.gapLines = el.g.append('g').classed('gapLines', true);
        el.lines = el.g.append('g').classed('lines', true);
        el.xAxis = el.g.append('g').classed('axis  axis-x', true);
        el.yAxis = el.g.append('g').classed('axis axis-y', true);
        el.legend = el.g.append('g').classed('legend', true);
        el.tooltip = el.g.append('g').classed('tooltip', true);
      }
      // add X axis
      el.xAxis.call(this.xAxis, this.xScale);
      // add y axis
      el.yAxis.call(this.yAxis, this.yScale);

      //  INSERT TARGET GOALPOSTS START
      if (this.extras && this.extras.id === 'scenarios' && goalPosts) {
        const dimension = this.series[0].id; // for now always only only one line
        const strategies = ['nothing', 'contain', 'supress'];

        el.goalposts = el.g.append('g').classed('goalpoasts', true);
        el.goalpostsLegend = el.g
          .append('g')
          .classed('goalpoasts-legend', true)
          .attr(
            'transform',
            `translate(${this.width - 60},${this.options.margin.top + 120})`
          );

        el.goalpostsLegend
          .append('text')
          .style('font-family', 'Helvetica, Arial, sans serif')
          .style('font-weight', 'bold')
          .style('font-size', '9px')
          .attr('x', -30)
          .attr('y', -10)
          .text('FHIs prognoser');

        el.goalpostsLegend.call(goalPosts.legend, strategies, '#444');

        if (thresholds.add) {
          el.thresholds = el.g.append('g').classed('ice-thresholds', true);

          // ! Ad hoc extra fix for icu beds info
          if (this.yScale.domain()[1] < 900) {
            el.thresholds
              .append('text')
              .style('font-family', 'Helvetica, Arial, sans serif')
              .style('font-size', '9px')
              .style('fill', '#FF7F00')
              .attr('x', this.width - this.options.margin.right + 10)
              .attr('y', 20)
              .selectAll('tspan')
              .data(['↑ maks 925 mulige', 'intensivplasser'])
              .join('tspan')
              .attr('text-anchor', 'left')
              .attr('x', this.width - this.options.margin.right + 10)
              .attr('dy', (_, i) => `${i * 1.2}em`)
              .text(d => d);
          }
          const th = [
            [this.yScale(289), ['289 etablerte', 'intensivplasser']],
            [this.yScale(925), ['925 maks mulige', 'intensivplasser']]
          ];
          th.forEach(threshold => {
            el.thresholds.call(thresholds.add, threshold, {
              x1: this.options.margin.left,
              x2: this.width - this.options.margin.right,
              xText: this.width - this.options.margin.right + 10
            });
          });
        }
        strategies.forEach(strategy => {
          const data = this.extras.data.filter(d => d.strategy === strategy);
          el.goalposts
            .selectAll('g')
            .data(data)
            .join('g')
            .attr('transform', d => `translate(${this.xScale(d.date)},0)`)
            .call(
              goalPosts.generate,
              dimension,
              this.yScale,
              goalPosts.colorScale(strategy)
            );
        });
      }
      //  INSERT TARGET GOALPOSTS END

      // add legend
      el.legend.selectAll('g').remove();
      const legends = el.legend
        .attr(
          'transform',
          `translate(${this.options.margin.left + 10}, ${this.options.margin
            .top + 10})`
        )
        .selectAll('g')
        .data(
          series.sort((a, b) =>
            d3.descending(
              a.values[a.values.length - 1].value,
              b.values[b.values.length - 1].value
            )
          )
        )
        .join('g');

      legends
        .append('rect')
        .attr('fill', d => this.color(d.id))
        .attr('width', 20)
        .attr('height', 2)
        .attr('rx', 2)
        .attr('y', (_, i) => i * 16);

      legends
        .append('text')
        .style('font-family', 'Helvetica, Arial, sans serif')
        .style('font-size', '.75rem')
        .style('fill', this.options.textColor)
        .attr('x', 25)
        .attr('dy', 4)
        .attr('y', (_, i) => i * 16)
        .text(d => d.name);

      // missing data / gapLine creates complete data series
      // used to draw dotted interpolated lines between
      // data points where data is missing

      // we have to deep clone each object to preserve the original series array
      const seriesCopy = series.map(o => ({ ...o }));
      const missingData = seriesCopy.map(s => {
        s.values = s.values.filter(this.changeLine.defined()); // ref: https://observablehq.com/@d3/line-with-missing-data
        return s;
      });
      el.gapLines
        .attr('fill', 'none')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2, 2')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .selectAll('path')
        .data(missingData)
        .join('path')
        .attr('stroke', '#ddd')
        .transition(t)
        .attr('d', d => this.changeLine(d.values));

      // el.lines.selectAll('path').remove();
      el.lines
        // .append('g')
        .attr('fill', 'none')
        .attr('stroke-width', 2)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .selectAll('path')
        .data(series)
        .join('path')
        .attr('stroke', d => this.color(d.id))
        .transition(t)
        .attr('d', d => this.changeLine(d.values));

      // style axis and tick lines
      el.yAxis
        .selectAll('.tick')
        .selectAll('line')
        .attr('stroke-width', 0.33)
        .style('opacity', this.yScaleType === 'log' ? 0.1 : 0.15)
        // .attr('stroke-dasharray', '3, 3')
        .attr('stroke', this.options.textColor);

      el.xAxis
        .selectAll('.tick')
        .selectAll('line')
        .style('opacity', 0.15)
        .attr('stroke', this.options.textColor);

      el.g
        .selectAll('.axis .tick')
        .selectAll('text')
        .style('fill', this.options.textColor)
        .attr('y', '5');

      el.g
        .selectAll('.axis .domain')
        .transition(t)
        .style('opacity', 0.25);

      // tooltip
      svg.on('touchmove mousemove', function() {
        const values = that.bisect(d3.mouse(this)[0]);
        const yPos = d3.mouse(this)[1];
        if (values[0]) {
          el.tooltip
            .attr('transform', `translate(${that.xScale(values[0].date)},0)`)
            // ${that.yScale(values[0].value) - 50}
            // ${yTemp(values[0].value) - 125
            .call(that.callout, values, yPos);
        }
      });
      svg.on('touchend mouseleave', () => el.tooltip.call(that.callout, null));

      this.chart = el;
    },
    // AXIS
    xAxis(svg, x) {
      return svg
        .attr(
          'transform',
          `translate(0,${this.height - this.options.margin.bottom})`
        )
        .call(
          d3
            .axisBottom(x)
            .ticks(4) // this.width > 600 ? 10 : 3
            .tickFormat(d3.timeFormat('%d.%m'))
            .tickSizeOuter(0)
            .tickSizeInner(
              5
              //   (this.height -
              //     this.options.margin.top -
              //     this.options.margin.bottom) *
              //     -1
            )
        );
    },
    yAxis(svg, y) {
      let generator = d3.axisLeft(y);
      let position = this.options.margin.left;
      const tickWidth =
        (this.width - this.options.margin.right - this.options.margin.left) *
        -1;
      const tickFormat =
        this.yScaleType === 'log'
          ? d => this.yScaleLog.tickFormat(5, d3.format(',d'))(d)
          : d => this.yScaleLinear.tickFormat(5, locale.format(',d'))(d);

      if (this.options.yAxis === 'right') {
        generator = d3.axisRight(y);
        position = this.width - this.options.margin.right;
      }
      return svg.attr('transform', `translate(${position},0)`).call(
        generator
          .ticks(5)
          .tickFormat(tickFormat)
          .tickSizeOuter(0)
          .tickSizeInner(tickWidth)
      );
    },
    callout(g, values, yPos) {
      if (!values) return g.style('display', 'none');

      // get a date x days back in tome
      const flipDate = new Date().setTime(
        new Date().getTime() - 24 * 60 * 60 * 1000 * 10
      ); // 10 days

      // get the country names
      const names = this.series.map(d => d.name);

      // flip as series are sorted ascending
      // names.reverse();
      // values.reverse();

      // trick to print date on first line
      names.unshift('Date');
      values.unshift(values[0]);

      // genearet text
      const echoTooltip = text =>
        text
          .selectAll('tspan')
          .data(values)
          .join('tspan')
          .attr('text-anchor', d =>
            d.date.getTime() > flipDate ? 'middle' : 'start'
          )
          // .attr('x', 10)
          .attr('x', d => (d.date.getTime() < flipDate ? '10' : '-30'))
          .attr('y', (d, i) => `${i * 1.25}em`)
          .style('text-align', 'left')
          .style('font-weight', (_, i) => (i ? null : 'bold'))
          .text(function(d, i) {
            if (i < 1) return `${d3.timeFormat('%d. %b')(d.date)}`; // print date on first line
            return `${names[i]} ${locale.format(',')(d.value)}`;
          });

      // tooltip container
      const callout = g
        .style('display', null)
        .style('pointer-events', 'none')
        .style('font', '0.75rem Helvetica, arial, sans-serif')
        .style('fill', this.options.textColor);

      // generate text to get dimensions
      const text = callout.append('text').call(text => echoTooltip(text));
      const { x, y, width: w, height: h } = text.node().getBBox();

      // calucuale textpos position
      const position = yPos > this.height - h ? yPos - h : yPos + 20;

      // tooltip guide-line
      callout
        .selectAll('line')
        .data([null])
        .join('line')
        .attr('stroke', this.options.textColor)
        .style('stroke-opacity', 0.5)
        .attr('stroke-width', 0.5)
        .style('stroke-dasharray', '1, 1')
        .attr('class', 'guide')
        .attr('x1', 0)
        .attr('y1', this.options.margin.bottom)
        .attr('x2', 0)
        .attr('y2', this.height - this.options.margin.bottom);

      // tooltip bg box
      callout
        .selectAll('rect')
        .data([null])
        .join('rect')
        .attr('fill', this.options.textColor === '#fff' ? '#2a3b4b' : 'white') // @todo: ad hoc ternary fix
        .attr('fill-opacity', 0.75)
        .attr('stroke', this.options.textColor)
        .attr('stroke-opacity', 0.25)
        .attr('rx', 2)
        .attr('transform', `translate(0,${position})`)
        .attr('width', w + 20)
        .attr('x', x - 10)
        .attr('y', -15)
        .attr('height', h + 10);

      // re-append text on top og bg box
      callout.selectAll('text').remove();
      callout
        .append('text')
        .attr('transform', `translate(0,${position})`)
        .call(text => echoTooltip(text));

      // position
      text.attr('transform', `translate(0,${-10 - y})`);
    },
    bisect(mx) {
      const bisect = d3.bisector(d => d.date).right;
      const date = this.xScale.invert(mx);
      return this.series.map(function(line) {
        const index = bisect(line.values, date, 1);
        const a = line.values[index - 1];
        const b = line.values[index];
        if (b) return date - a.date > b.date - date ? b : a;
        return null;
      });
    }
  }
};
</script>
<style>
.axis text {
  font-weight: 300;
  opacity: 0.33;
}

.tooltip text,
.legend text,
.axis {
  font-size: 0.8rem !important;
}
@screen sm {
  .tooltip text,
  .legend text,
  .axis {
    font-size: 0.7rem !important;
  }
}
@screen lg {
  .tooltip text,
  .legend text,
  .axis {
    font-size: 0.66rem !important;
  }
}
</style>
