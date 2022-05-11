<template>
  <div class="max-w-xs">
    <label for="wallet" class="block text-sm font-medium text-gray-700"
      >Тикер</label
    >
    <div class="mt-1 relative rounded-md shadow-md">
      <input
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        @keydown.enter="addTicker"
        @blur="$emit('blur')"
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
    <coin-suggestions
      :searchValue="modelValue"
      @select="onSuggestionClick"
      @loaded="$emit('loaded')"
    />
    <div v-if="error" class="text-sm text-red-600">
      Такой тикер уже добавлен
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
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
    "
  >
    <add-icon />
    Добавить
  </button>
</template>
<script>
import CoinSuggestions from './CoinSuggestions.vue';
import AddIcon from './AddIcon.vue';
import { nextTick } from '@vue/runtime-core';

export default {
  props: {
    error: String || null,
    addTicker: Function,
    modelValue: String,
  },
  emits: {
    'update:modelValue': (v) => typeof v === 'string',
    blur: null,
    loaded: null,
  },
  components: {
    CoinSuggestions,
    AddIcon,
  },
  data() {
    return {};
  },
  methods: {
    onSuggestionClick(ticker) {
      this.$emit('update:modelValue', ticker);
      nextTick(this.addTicker());
    },
  },
};
</script>
