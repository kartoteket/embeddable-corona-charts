<template>
  <article class="flex flex-col font-light">
    <div
      v-if="isLoading"
      class="flex justify-center items-center w-full h-screen"
    >
      <scale-loader :loading="isLoading" color="#444" class="mx-auto" />
    </div>
    <div v-if="!isLoading">
      <article v-if="chart" class="mb-4">
        <h2
          v-if="chart.title"
          class="text-sm uppercase text-sm tracking-wide text-gray-800 border-b-2 border-gray-500 mt-4 pl-4"
        >
          {{ chart.title }}
        </h2>
        <multi-line-chart
          id="fhi_scenario_chart"
          :series="chart.data"
          :extras="extras"
          :y-scale-type="yScaleType"
          :config="chart.config"
        />
      </article>
    </div>
    <p v-if="!isLoading" class="text-xs ml-4">
      Kilde:
      <a
        class="underline"
        href="https://www.fhi.no/sv/smittsomme-sykdommer/corona/dags--og-ukerapporter/dags--og-ukerapporter-om-koronavirus/"
        >FHI
      </a>
      <span v-if="feature === 'scenarios'">
        /
        <a
          class="underline"
          href="https://www.fhi.no/contentassets/c9e459cd7cc24991810a0d28d7803bd0/covid-19-epidemien-risiko-prognose-og-respons-i-norge-etter-uke-12.--24.mars-2020.pdf"
          >FHIs Risikoprognose
        </a></span
      >. Grafikk:
      <a class="underline" target="_parent" href="https://kartoteket.as">
        Kartoteket
      </a>
      . Oppdatert {{ lastUpdate }}.
    </p>
  </article>
</template>
<script>
/*
[X] get dimension(s) from URL parameter
  [x] Update scales to work
  => [] publish version
[ ] create mode for showtarget=true to include targets
  => [ ] publish new version

[] Create ICU bed charts
*/

// @todo cherrypick like this: var d3 = Object.assign({}, require("d3-format"), require("d3-geo"), require("d3-geo-projection"));
import * as d3 from 'd3';

import ScaleLoader from 'vue-spinner/src/PulseLoader.vue';
import MultiLineChart from '@/components/charts/MultiLineChart';

export default {
  layout: 'embed',
  components: {
    MultiLineChart: MultiLineChart,
    ScaleLoader
  },
  data() {
    // @todo: move to seperate file and require on demand
    const scenarios = [
      {
        strategy: 'nothing',
        date: new Date('2020-03-28'),
        hospital: { mean: 430, min: 360, max: 500 },
        icu: { mean: 60, min: 45, max: 80 },
        total: { mean: 17000, min: 15000, max: 19000 }
      },
      {
        strategy: 'nothing',
        date: new Date('2020-04-04'),
        hospital: { mean: 1070, min: 920, max: 1250 },
        icu: { mean: 150, min: 110, max: 180 },
        total: { mean: 42000, min: 36000, max: 47000 }
      },
      {
        strategy: 'nothing',
        date: new Date('2020-04-11'),
        hospital: { mean: 2700, min: 2340, max: 3060 },
        icu: { mean: 380, min: 320, max: 440 },
        total: { mean: 101000, min: 89000, max: 112000 }
      },
      {
        strategy: 'contain',
        date: new Date('2020-03-28'),
        hospital: { mean: 280, min: 230, max: 340 },
        icu: { mean: 55, min: 40, max: 70 },
        total: { mean: 4700, min: 4100, max: 5500 }
      },
      {
        strategy: 'contain',
        date: new Date('2020-04-04'),
        hospital: { mean: 390, min: 320, max: 460 },
        icu: { mean: 90, min: 65, max: 110 },
        total: { mean: 6000, min: 5200, max: 7000 }
      },
      {
        strategy: 'contain',
        date: new Date('2020-04-11'),
        hospital: { mean: 510, min: 420, max: 610 },
        icu: { mean: 120, min: 95, max: 145 },
        total: { mean: 7600, min: 6500, max: 9000 }
      },
      {
        strategy: 'supress',
        date: new Date('2020-03-28'),
        hospital: { mean: 240, min: 200, max: 280 },
        icu: { mean: 50, min: 35, max: 65 },
        total: { mean: 2500, min: 2100, max: 2700 }
      },
      {
        strategy: 'supress',
        date: new Date('2020-04-04'),
        hospital: { mean: 245, min: 190, max: 300 },
        icu: { mean: 70, min: 50, max: 90 },
        total: { mean: 2200, min: 1900, max: 2500 }
      },
      {
        strategy: 'supress',
        date: new Date('2020-04-11'),
        hospital: { mean: 225, min: 170, max: 270 },
        icu: { mean: 70, min: 50, max: 85 },
        total: { mean: 2000, min: 1700, max: 2200 }
      }
    ];
    return {
      isLoading: true,
      input: [],
      feature: null,
      zoom: 1,
      scenarios,
      dimensions: ['total'],
      alllowedDimensions: [
        'total',
        'new',
        'hospital',
        'icu',
        'deaths',
        'tested',
        'mean_age',
        'female',
        'male'
      ]
    };
  },
  computed: {
    extras() {
      if (this.feature === 'scenarios') {
        return { id: 'scenarios', data: this.scenarios };
      }
      return {};
    },
    margin() {
      return {
        right: this.feature === 'scenarios' ? 100 : 50,
        left: 50,
        top: 20,
        bottom: 20
      };
    },
    xDomain() {
      if (this.feature === 'scenarios') {
        // if showing icu in scenario-mode, lock X axis domain to set date range
        if (
          this.dimensions[0] === 'icu' ||
          this.dimensions[0] === 'hospital' ||
          this.dimensions[0] === 'total'
        )
          return [new Date('2020-03-12'), new Date('2020-04-20')];
      }
      return null;
    },
    yDomain() {
      if (this.feature === 'scenarios') {
        // if showing icu in scenario-mode, lock Y axis domain to set value range
        if (this.dimensions[0] === 'icu') return [0, 450 / this.zoom];
        if (this.dimensions[0] === 'hospital') return [0, 3500 / this.zoom];
        if (this.dimensions[0] === 'total') return [0, 112000 / this.zoom];
      }
      return null;
    },
    colorScale() {
      return d3.scaleOrdinal(d3.schemeSet2); // d3.schemeTableau10
    },
    chart() {
      return this.createChart(this.dimensions);
    },
    lastUpdate() {
      const dates = this.input.map(d => d.date);
      return d3.timeFormat('%d. %b')(dates[dates.length - 1]);
    },
    yScaleType() {
      if (this.chartType === 'logline') {
        return 'log';
      }
      return 'linear';
    }
  },
  async mounted() {
    if (this.$route.params.dimension) {
      this.dimensions = this.$route.params.dimension.split(',').map(d => {
        let output = d.trim().toLowerCase();
        if (this.alllowedDimensions.includes(output)) {
          return output;
        }
      });
    }
    this.input = await this.fetchData();

    // check for special features in query string
    if (this.$route.query && this.$route.query.feature) {
      this.feature = this.$route.query.feature;
    }
    if (this.$route.query && this.$route.query.zoom) {
      this.zoom = this.$route.query.zoom;
    }

    // done loading
    this.isLoading = false;
  },
  methods: {
    getSeries(dimensions) {
      // create array of all values for any serie and find first date with cases
      const firstCase = [];
      const values = [];
      dimensions.map((dimension, i) => {
        values[i] = this.input.map(d => {
          if (!firstCase[i] && d[dimension] > 0) firstCase[i] = d.date;
          return {
            date: d.date,
            value: d[dimension]
          };
        });
      });

      // create serie with nam/values from set startDate
      let cutoff = d3.min(firstCase);
      if (this.feature === 'scenarios') {
        cutoff = new Date('2020-03-15');
      }
      const output = dimensions.map((line, i) => {
        return {
          id: line,
          name: this.printLabel(line),
          values: values[i].filter(
            d => d.date > cutoff.setDate(cutoff.getDate() - 1)
          )
        };
      });
      return output;
    },

    createChart(dimensions) {
      const config = {
        colorScale: this.colorScale,
        textColor: '#444',
        aspectRatio: 0.5,
        yAxis: 'left',
        curve: d3.curveLinear,
        margin: this.margin
      };

      if (this.yDomain) config.domainY = this.yDomain;
      if (this.xDomain) config.domainX = this.xDomain;

      return {
        title: `Norge`,
        data: this.getSeries(dimensions),
        config
      };
    },
    printLabel(token) {
      const labels = {
        total: 'Registrert smittet (totalt)',
        new: 'Registrert smittet (nye)',
        hospital: 'Innlagt ',
        icu: 'Under intensivbehandling',
        deaths: 'Døde',
        tested: 'Testet (totalt)',
        mean_age: 'Gjennomsnittsalder (innlagte)',
        female: '%-andel kvinner',
        male: '%-andel menn'
      };
      return token in labels ? labels[token] : token;
    },
    capitalize(string) {
      if (string.length < 4) {
        return string.toUpperCase();
      }
      return string
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('-');
    },
    async fetchData() {
      // make request
      const result = await d3.csv('/data/fhi-norway-corona.csv', d3.autoType);
      return result;
    }
  }
};
</script>
