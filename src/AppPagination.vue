<template>
  <span class="mr-4">Страница:</span>
  <span
    v-if="page > 1"
    @click="$emit('prevPage')"
    class="cursor-pointer p-1 bg-white rounded-md border-red-300 border-2"
    >&lt;</span
  >

  <span class="p-1 bg-white rounded-md mx-1 border-red-300 border-2">{{
    page
  }}</span>
  <span
    v-if="isNextPageAvailable"
    @click="$emit('nextPage')"
    class="cursor-pointer p-1 bg-white rounded-md border-red-300 border-2"
    >&gt;</span
  >
</template>
<script>
export default {
  props: {
    page: Number,
    isNextPageAvailable: Boolean,
  },
  emits: ['prevPage, nextPage'],
  data() {
    return {};
  },
};
</script>
