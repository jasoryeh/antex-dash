<script setup>
import { ref } from 'vue'

defineProps({
  masterSchedule: Object,
})

</script>

<template>
  <div class="card mx-2 my-2">
    <div class="card-header">
      Known Schedules <span class="font-normal">on </span>
      <input type="date" id="start" name="start" 
              class="border-black-500 border-2 rounded-xl py-1 px-2" 
              v-model="masterScheduleDate" 
              @input="onMasterSchedule()" />
    </div>
    <div class="card-body row">
      <div class="card w-fit h-fit p-0 mx-1" v-if="Object.keys(masterSchedule).length > 0" v-for="route in Object.keys(masterSchedule)">
        <div class="card-header" :style="`background-color: ${routePresets.route(route).color}; 
                                          color: ${routePresets.route(route).text};`">{{ route }}</div>
        <div class="card-body card w-fit h-fit flex p-0" v-for="bus in Object.keys(masterSchedule[route])">
          <div class="card-header">{{ bus }}</div>
          <div class="card-body">
            <p v-for="shift of masterSchedule[route][bus]">{{ shift.raw.screen_name }} {{ formatTime(shift.clean.start) }}-{{ formatTime(shift.clean.end) }}</p>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-4">
        No schedules known for this day!
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
        routePresets: null,
        masterScheduleDate: null,
        masterSchedule: {},
    }
  },
  methods: {
    isToday: window.axdash_utils.isToday,
    calculateRounds: window.axdash_utils.calculateRounds,
    displayDateTime: window.axdash_utils.displayDateTime,
    padNumber: window.axdash_utils.padNumber,
    formatTime(dateTimeObj) {
      var d = new Date(dateTimeObj);
      return `${this.padNumber(d.getHours())}:${this.padNumber(d.getMinutes())}`
    },
    async onMasterSchedule() {
      this.masterSchedule = await window.dashapi.masterschedule(this.masterScheduleDate + 'T07:00:00.000Z');
    },
  },
  async mounted() {
    this.routePresets = await window.axdash_presets.get(window.dashapi);

    let now = new Date(Date.now());
    this.masterScheduleDate = `${now.getFullYear()}-${this.padNumber(now.getMonth() + 1)}-${this.padNumber(now.getDate())}`;

    await this.onMasterSchedule();
  }
}
</script>
