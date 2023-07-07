<script setup>
import Schedule from './Schedule.vue';
import Trades from './Trades.vue';
import MasterSchedule from './MasterSchedule.vue';
import News from './News.vue';
</script>

<template>
  <div class="container-fluid" v-if="ready">
    <div class="row">
      <div class="col-lg-7">
        <Schedule />
      </div>
      <div class="col-lg-5">
        <Trades />
        <MasterSchedule />
        <News />
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>

<script>

export default {
  data() {
    return {
      ready: false,
      presets: null,
    }
  },
  methods: {
    isToday: window.axdash_utils.isToday,
    calculateRounds: window.axdash_utils.calculateRounds,
    displayDateTime: window.axdash_utils.displayDateTime,
  },
  async mounted() {
    if (!(await window.dashapi.check())) {
      console.warn("Failed to authenticate again!");
      return;
    }
    this.me = await window.dashapi.me();
    this.presets = await window.axdash_presets.get(window.dashapi);
    this.ready = true;
  },
}
</script>
