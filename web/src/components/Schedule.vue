<script setup>
</script>

<template>
  <div class="card mx-2 my-2">
    <div class="card-header">
        Shifts from 
        <input type="date" id="start" name="start" 
                class="border-black-500 border-2 rounded-xl py-1 px-2" 
                v-model="scheduleStart" 
                @input="onScheduleUpdate()" />
       to 
       <input type="date" id="start" name="start" 
                class="border-black-500 border-2 rounded-xl py-1 px-2" 
                v-model="scheduleEnd" 
                @input="onScheduleUpdate()" />
    </div>
    <div class="card-body" v-if="routePresets">
      <table class="table">
        <thead>
          <tr>
            <th>Route</th>
            <th>#</th>
            <th>Rounds</th>
            <th>Start</th>
            <th>End</th>
            <th class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="shift in (true ? shifts : futureShifts())">
            <td :class="isToday(shift.start) ? 'bg-amber-500' : ''">
              <span class="badge" 
                    :style="`background-color: ${routePresets.route(shift.route).color}; 
                             color: ${routePresets.route(shift.route).text};`">
                    {{ shift.route }}
              </span>
            </td>
            <td>{{ shift.bus.replace("BUS ", '') }}</td>
            <td>{{ calculateRounds(routePresets.route(shift.route), shift.start, shift.end) }}</td>
            <td v-html="displayDateTime(shift.start)"></td>
            <td v-html="displayDateTime(shift.end)"></td>
            <td class="text-center">
                {{ isPast(shift.end) ? "✅" : "" }}
                {{ shift.in_trade ? "⏫" : "" }}
                {{ isToday(shift.start) ? "⏰" : "" }}
            </td>
          </tr>
        </tbody>
      </table>
      <small>
        <ul class="schedule-key flex">
            <li>✅ Finished</li>
            <li>⏫ Posted</li>
            <li>⏰ Today</li>
        </ul>
      </small>
      <div class="py-8 text-center" v-if="futureShifts().length == 0">
        No more future shifts!
      </div>
    </div>
  </div>
</template>

<style scoped>
.schedule-key li {
    border: none;
    padding-left: 3px;
    padding-right: 3px;
}
</style>

<script>

export default {
  data() {
    return {
        shifts: null,
        routePresets: null,
        scheduleStart: '2023-01-01',
        scheduleEnd: '2023-01-01',
    }
  },
  methods: {
    async onScheduleUpdate() {
      this.shifts = await window.dashapi.shifts(this.scheduleStart + 'T07:00:00.000Z', this.scheduleEnd + 'T07:00:00.000Z');
    },
    futureShifts() {
        return this.shifts.filter(shift => {
            var startDay = new Date(shift.start);
            startDay.setHours(23);
            startDay.setMinutes(59);
            startDay.setSeconds(59);
            startDay.setMilliseconds(999);
            return shift.yours && (startDay > Date.now());
        });
    },
    isToday: window.axdash_utils.isToday,
    isPast: window.axdash_utils.isPast,
    calculateRounds: window.axdash_utils.calculateRounds,
    displayDateTime: window.axdash_utils.displayDateTime,
  },
  async mounted() {
    let start = new Date(Date.now());
    let end = new Date(start);
    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() + 14);
    this.scheduleStart = window.axdash_utils.dateToFormFormat(start);
    this.scheduleEnd = window.axdash_utils.dateToFormFormat(end);

    await this.onScheduleUpdate(start, end);
    this.routePresets = await window.axdash_presets.get(window.dashapi);
  }
}
</script>
