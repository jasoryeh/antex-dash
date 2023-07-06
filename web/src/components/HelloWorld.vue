<script setup>
import { ref } from 'vue'

defineProps({
  msg: String,
  type: String,
})

const count = ref(0)
</script>

<template>
  <div :class="`alert alert-${type} rounded-0 border-0 bg-${mapping(type).bg} color-${mapping(type).txt} text-center`">
    <b v-if="!msg">An error has occurred, and is irrecoverrable. Please reload the page.</b>
    <b v-else>{{ msg }}</b>
  </div>
</template>

<style scoped>

</style>

<script>

export default {
  data() {
    return {
      typeMappings: {
        "danger": {
          "bg": "red-200",
          "txt": "black"
        }
      }
    }
  },
  methods: {
    mapping(type) {
      let lookup = this.typeMappings[type];
      if (!lookup) {
        return {
          "bg": "blue-200",
          "txt": "black",
        };
      }
      return lookup;
    }
  }
}
</script>
