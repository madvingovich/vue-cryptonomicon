<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <div class="container">
      <section>
        <div class="flex">
          <div class="max-w-xs">
            <label for="wallet" class="block text-sm font-medium text-gray-700"
              >Тикер</label
            >
            <div class="mt-1 relative rounded-md shadow-md">
              <input
                v-model="ticker"
                @keydown.enter="add"
                @blur="clearError"
                type="text"
                name="wallet"
                id="wallet"
                class="
                  block
                  w-full
                  pr-10
                  border-gray-300
                  text-gray-900
                  focus:outline-none focus:ring-gray-500 focus:border-gray-500
                  sm:text-sm
                  rounded-md
                "
                placeholder="Например DOGE"
              />
            </div>
            <div
              class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap"
            >
              <span
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
                BTC
              </span>
              <span
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
                DOGE
              </span>
              <span
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
                BCH
              </span>
              <span
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
                CHD
              </span>
            </div>
            <div v-if="error" class="text-sm text-red-600">
              Такой тикер уже добавлен
            </div>
          </div>
        </div>
        <button
          @click="add"
          type="button"
          class="
            my-4
            inline-flex
            items-center
            py-2
            px-4
            border border-transparent
            shadow-sm
            text-sm
            leading-4
            font-medium
            rounded-full
            text-white
            bg-gray-600
            hover:bg-gray-700
            transition-colors
            duration-300
            focus:outline-none
            focus:ring-2
            focus:ring-offset-2
            focus:ring-gray-500
          "
        >
          <svg
            class="-ml-0.5 mr-2 h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="#ffffff"
          >
            <path
              d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
            ></path>
          </svg>
          Добавить
        </button>
      </section>

      <template v-if="tickers.length">
        <hr class="w-full border-t border-gray-600 my-4" />
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <AppTicker
            v-for="t in tickers"
            :key="t.name"
            :price="t.price"
            :name="t.name"
            :selected="t === this.selected"
            @delete="onDelete(t)"
            @select="onSelect(t)"
            @priceUpdate="(price) => onPriceUpdate(t, price)"
          />
        </dl>
      </template>
      <hr class="w-full border-t border-gray-600 my-4" />
      <PriceBars
        v-if="selected"
        :title="`${selected.name} - USD`"
        :prices="selected.prices"
        @close="selected = null"
      />
    </div>
  </div>
</template>

<script>
import AppTicker from './AppTicker.vue';
import PriceBars from './PriceBars.vue';
export default {
  name: 'App',
  apiKey: '409dea7172697de942cd44745d23de93c799cec7d10538e3dc1501b8ad32e954',
  data() {
    return {
      ticker: 'BTC',
      tickers: [],
      error: null,
      selected: null,
    };
  },
  watch: {
    ticker() {
      this.clearError();
    },
  },
  methods: {
    add() {
      if (this.tickers.findIndex((t) => t.name === this.ticker) !== -1) {
        this.error = 'Такой тикер уже добавлен';
      } else {
        this.tickers.push({ name: this.ticker, price: '-', prices: [] });
        this.ticker = '';
      }
    },
    clearError() {
      this.error = null;
    },
    onSelect(t) {
      this.selected = t;
    },
    onDelete(tickerToRemove) {
      this.tickers = this.tickers.filter((t) => t !== tickerToRemove);
      if (tickerToRemove === this.selected) {
        this.selected = null;
      }
    },
    onPriceUpdate(ticker, price) {
      this.tickers = this.tickers.map((t) => {
        if (t === ticker) {
          t.price = price;
          t.prices.push(price);
        }
        return t;
      });
    },
  },
  components: {
    AppTicker,
    PriceBars,
  },
};
</script>
