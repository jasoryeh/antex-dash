<script setup>
import Schedule from './Schedule.vue';
import Trades from './Trades.vue';
import MasterSchedule from './MasterSchedule.vue';
import News from './News.vue';
</script>

<template>
  <div class="container-fluid" v-if="ready">
    <div class="row">
      <div class="col-7">
        <Schedule />
      </div>
      <div class="col-5">
        <Trades :trades="trades" />
        <MasterSchedule :masterSchedule="masterSchedule" @onScheduleDate="onMasterSchedule" />
        <News :news="news" />
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
      trades: [],
      news: null,
      presets: null,
      masterSchedule: {},
    }
  },
  methods: {
    async onMasterSchedule(date) {
      this.masterSchedule = await window.dashapi.masterschedule(date + 'T07:00:00.000Z');
    },
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
    this.trades = await window.dashapi.trades();
    this.presets = await window.axdash_presets.get(window.dashapi);
    this.news = await window.dashapi.news();
    await this.onMasterSchedule();
    this.ready = true;
  },
}
</script>
