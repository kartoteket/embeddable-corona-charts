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
          class="text-sm uppercase text-sm tracking-wide text-gray-800 border-b-2 border-gray-500 mt-4"
        >
          {{ chart.title }}
        </h2>
        <multi-line-chart
          id="fhi_scenario_chart"
          :series="chart.data"
          :extras="{ id: 'scenarios', data: scenarios }"
          :y-scale-type="yScaleType"
          :config="chart.config"
        />
      </article>
    </div>
    <p v-if="!isLoading" class="text-xs text-right pr-4">
      Kilde:
      <a
        class="underline"
        href="https://www.fhi.no/sv/smittsomme-sykdommer/corona/dags--og-ukerapporter/dags--og-ukerapporter-om-koronavirus/"
      >
        FHI </a
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
        icu: { mean: 60, min: 45, max: 80 }
      },
      {
        strategy: 'nothing',
        date: new Date('2020-04-04'),
        hospital: { mean: 1070, min: 920, max: 1250 },
        icu: { mean: 150, min: 110, max: 180 }
      },
      {
        strategy: 'nothing',
        date: new Date('2020-04-11'),
        hospital: { mean: 2700, min: 2340, max: 3060 },
        icu: { mean: 380, min: 320, max: 440 }
      },
      {
        strategy: 'contain',
        date: new Date('2020-03-28'),
        hospital: { mean: 280, min: 230, max: 340 },
        icu: { mean: 55, min: 40, max: 70 }
      },
      {
        strategy: 'contain',
        date: new Date('2020-04-04'),
        hospital: { mean: 390, min: 320, max: 460 },
        icu: { mean: 90, min: 65, max: 110 }
      },
      {
        strategy: 'contain',
        date: new Date('2020-04-11'),
        hospital: { mean: 510, min: 920, max: 1250 },
        icu: { mean: 120, min: 95, max: 145 }
      },
      {
        strategy: 'supress',
        date: new Date('2020-03-28'),
        hospital: { mean: 240, min: 200, max: 280 },
        icu: { mean: 50, min: 35, max: 65 }
      },
      {
        strategy: 'supress',
        date: new Date('2020-04-04'),
        hospital: { mean: 245, min: 190, max: 300 },
        icu: { mean: 70, min: 50, max: 90 }
      },
      {
        strategy: 'supress',
        date: new Date('2020-04-11'),
        hospital: { mean: 225, min: 170, max: 270 },
        icu: { mean: 70, min: 50, max: 85 }
      }
    ];
    return {
      isLoading: true,
      input: [],
      feature: null,
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
      ],
      margin: {
        right: 50,
        left: 10,
        top: 20,
        bottom: 20
      }
    };
  },
  computed: {
    xDomain() {
      if (this.feature === 'scenarios') {
        // if showing icu in scenario-mode, lock X axis domain to set date range
        if (this.dimensions[0] === 'icu')
          return [new Date('2020-03-12'), new Date('2020-04-20')];
      }
      return null;
    },
    yDomain() {
      if (this.feature === 'scenarios') {
        // if showing icu in scenario-mode, lock Y axis domain to set value range
        if (this.dimensions[0] === 'icu') return [0, 500];
      }
      return null;
    },
    colorScale() {
      return d3.scaleOrdinal(d3.schemeDark2); // d3.schemeTableau10
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
      const cutoff = d3.min(firstCase);

      const output = dimensions.map((line, i) => {
        return {
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
        yAxis: 'right',
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
        icu: 'På intensivpost',
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
