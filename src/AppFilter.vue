<template>
  <span>Фильтр:</span>
  <input
    type="text"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
    class="
      mx-2
      border-gray-300
      text-gray-900
      focus:outline-none focus:ring-gray-500 focus:border-gray-500
      sm:text-sm
      rounded-md
    "
  />
</template>

<script>
export default {
  props: {
    modelValue: String,
  },
  emits: {
    'update:modelValue': (v) => typeof v === 'string',
  },
};
</script>
