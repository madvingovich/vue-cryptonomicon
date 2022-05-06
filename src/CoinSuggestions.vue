<template>
  <div class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap">
    <span
      v-for="suggestion in suggestions"
      :key="suggestion"
      @click="$emit('select', suggestion)"
      class="
        inline-flex
        items-center
        px-2
        m-1
        rounded-md
        text-xs
        font-medium
        bg-gray-300
        text-gray-800
        cursor-pointer
      "
    >
      {{ suggestion }}
    </span>
  </div>
</template>
<script>
import { loadCoinlist } from './coinlistApi';
export default {
  name: 'CoinSuggestions',
  props: ['searchValue'],
  emits: ['loaded'],
  data() {
    return {
      coinlist: [],
    };
  },
  created() {
    this.getCoinlist();
  },
  computed: {
    suggestions() {
      return this.coinlist
        .filter(({ Symbol, FullName }) =>
          `${Symbol}${FullName}`
            .toLowerCase()
            .includes(this.searchValue.toLowerCase())
        )
        .sort((a, b) =>
          a.Symbol.toLowerCase().includes(this.searchValue.toLowerCase()) &&
          !b.Symbol.toLowerCase().includes(this.searchValue.toLowerCase())
            ? -1
            : 1
        )
        .map(({ Symbol }) => Symbol)
        .slice(0, 4);
    },
  },
  methods: {
    getCoinlist() {
      loadCoinlist().then((res) => {
        this.coinlist = Object.values(res.Data);
        this.$emit('loaded');
      });
    },
  },
};
</script>
