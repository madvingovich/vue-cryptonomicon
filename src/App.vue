<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <div
      v-if="coinlistLoading"
      class="
        fixed
        w-100
        h-100
        opacity-80
        bg-purple-800
        inset-0
        z-50
        flex
        items-center
        justify-center
      "
    >
      <svg
        class="animate-spin -ml-1 mr-3 h-12 w-12 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>

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
                @keydown.enter="addTicker"
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
            <CoinSuggestions
              v-if="coinlist && ticker.length"
              :coinlist="coinlist"
              :searchValue="ticker"
              @select="onSuggestionClick"
            />
            <div v-if="error" class="text-sm text-red-600">
              Такой тикер уже добавлен
            </div>
          </div>
        </div>
        <button
          @click="addTicker"
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
        <div class="flex items-center">
          <span>Фильтр:</span>
          <input
            type="text"
            v-model="filter"
            class="
              mx-2
              border-gray-300
              text-gray-900
              focus:outline-none focus:ring-gray-500 focus:border-gray-500
              sm:text-sm
              rounded-md
            "
          />
          <hr />
          <span class="mr-4">Страница:</span>
          <span
            v-if="page > 1"
            @click="this.page--"
            class="
              cursor-pointer
              p-1
              bg-white
              rounded-md
              border-red-300 border-2
            "
            >&lt;</span
          >

          <span class="p-1 bg-white rounded-md mx-1 border-red-300 border-2">{{
            page
          }}</span>
          <span
            v-if="isNextPageAvailable"
            @click="this.page++"
            class="
              cursor-pointer
              p-1
              bg-white
              rounded-md
              border-red-300 border-2
            "
            >&gt;</span
          >
        </div>
      </section>

      <template v-if="paginatedTickers.length">
        <hr class="w-full border-t border-gray-600 my-4" />
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <AppTicker
            v-for="t in paginatedTickers"
            :key="t.name"
            :price="formatPrice(t.price)"
            :name="t.name"
            :error="t.error"
            :selected="t === this.selected"
            @delete="onDelete(t)"
            @select="onSelect(t)"
          />
        </dl>
      </template>
      <hr class="w-full border-t border-gray-600 my-4" />
      <PriceBars
        v-if="selected"
        :title="`${selected.name} - USD`"
        :prices="[]"
        @close="selected = null"
      />
    </div>
  </div>
</template>

<script>
import AppTicker from './AppTicker.vue';
import PriceBars from './PriceBars.vue';
import CoinSuggestions from './CoinSuggestions.vue';
import { nextTick } from '@vue/runtime-core';
import {
  loadCoinlist,
  subscribeToTicker,
  unsubscribeFromTicker,
  PRICE_UPDATE,
  PRICE_ERROR,
} from './api';
import { createStorageService } from './storageService';
import { urlService } from './urlService';

const ITEMS_PER_PAGE = 6;

const tickersStorage = createStorageService('tickers');

export default {
  name: 'App',
  data() {
    return {
      ticker: 'BTC',
      filter: '',
      page: 1,
      coinlist: [],
      coinlistLoading: false,
      tickers: [],
      error: null,
      selected: null,
      interval: null,
    };
  },
  components: {
    AppTicker,
    PriceBars,
    CoinSuggestions,
  },
  mounted() {
    this.loadCoinlist();
    this.getSavedTickets();
    this.parseUrl();
  },
  unmounted() {
    this.tickers.forEach((t) => {
      unsubscribeFromTicker(t.name);
    });
  },
  methods: {
    addTicker() {
      if (this.tickerAlreadyAdded) {
        nextTick(() => {
          this.error = 'Такой тикер уже добавлен';
        });
      } else {
        const newTicker = {
          name: this.ticker.toUpperCase(),
          price: '-',
          error: false,
        };
        this.tickers = [...this.tickers, newTicker];
        this.subscribeToTickerUpdates(newTicker.name);
        this.ticker = '';
      }
    },
    getTickerByName(name) {
      const index = this.tickers.findIndex((t) => t.name === name);
      return this.tickers[index];
    },
    loadCoinlist() {
      this.coinlistLoading = true;
      loadCoinlist()
        .then((res) => {
          this.coinlist = Object.values(res.Data);
        })
        .finally(() => {
          this.coinlistLoading = false;
        });
    },
    updateTickerPrice(name, price) {
      this.getTickerByName(name).price = price;
    },
    setTickerError(name, error) {
      this.getTickerByName(name).error = error;
    },
    clearError() {
      this.error = null;
    },
    onSuggestionClick(ticker) {
      this.ticker = ticker;
      this.addTicker();
    },
    onSelect(t) {
      this.selected = t;
    },
    onDelete(tickerToRemove) {
      this.tickers = this.tickers.filter((t) => t !== tickerToRemove);
      if (tickerToRemove === this.selected) {
        this.selected = null;
      }
      unsubscribeFromTicker(tickerToRemove.name);
    },
    parseUrl() {
      Object.assign(this, urlService.getSearchParams(['filter', 'page']));
    },
    getSavedTickets() {
      const savedTickers = tickersStorage.get();
      if (savedTickers) {
        this.tickers = savedTickers.map((t) => {
          t.price = '-';
          this.subscribeToTickerUpdates(t.name);
          return t;
        });
      }
    },
    subscribeToTickerUpdates(name) {
      subscribeToTicker(name, ({ type, value }) => {
        if (type === PRICE_UPDATE) {
          this.updateTickerPrice(name, value);
        } else if (type === PRICE_ERROR) {
          this.setTickerError(name, true);
        }
      });
    },
    formatPrice(price) {
      if (!price || typeof price !== 'number') {
        return '-';
      }
      return price > 1 ? price.toFixed(3) : price.toPrecision(3);
    },
  },
  computed: {
    startIndex() {
      return (this.page - 1) * ITEMS_PER_PAGE;
    },
    endIndex() {
      return this.page * ITEMS_PER_PAGE;
    },
    tickerAlreadyAdded() {
      return (
        this.ticker.length &&
        this.tickers.findIndex(
          (t) => t.name.toLowerCase() === this.ticker.toLowerCase()
        ) !== -1
      );
    },
    filteredTickers() {
      return this.tickers.filter((t) =>
        t.name.toLowerCase().includes(this.filter)
      );
    },
    paginatedTickers() {
      return this.filteredTickers.slice(this.startIndex, this.endIndex);
    },
    isNextPageAvailable() {
      return this.filteredTickers.length > this.endIndex;
    },
    pageState() {
      return { filter: this.filter, page: this.page };
    },
  },
  watch: {
    ticker() {
      this.clearError();
    },
    tickers() {
      tickersStorage.set(this.tickers);
    },
    paginatedTickers() {
      if (this.paginatedTickers.length === 0 && this.page > 1) {
        this.page -= 1;
      }
    },
    filter() {
      this.page = 1;
    },
    pageState(pageState) {
      urlService.setSearchParams(pageState);
    },
  },
};
</script>
