module.exports = {
  plugins: {
    tailwindcss: {},
    'vue-cli-plugin-tailwind/purgecss': {
      whitelist: ['v-select', 'tooltip', 'legend', 'axis'],
      whitelistPatterns: [
        /-(leave|enter|appear)(|-(to|from|active))$/,
        /vs__/,
        /vs--/
      ]
    }
  }
};
