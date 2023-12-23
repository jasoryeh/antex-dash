<script setup>
</script>

<template>
  <div class="card mx-2 my-2">
    <div class="card-header">
        Shifts <span class="font-normal">from</span>&nbsp;
        <input type="date" id="start" name="start" 
                class="border-black-500 border-2 rounded-xl py-1 px-2" 
                v-model="scheduleStart" 
                @input="onScheduleUpdate()" />
       <span class="font-normal"> to </span>
       <input type="date" id="start" name="start" 
                class="border-black-500 border-2 rounded-xl py-1 px-2" 
                v-model="scheduleEnd" 
                @input="onScheduleUpdate()" />
        &nbsp;
       <button @click="onScheduleUpdate()">
        <span v-if="!ui_refreshing">🔄</span>
        <span v-else>⏳</span>
       </button>
       &nbsp;
       <button @click="ui_lastWeek()">⏮️</button>
       <button @click="ui_currentWeek()" class="px-1">↩️</button>
       <button @click="ui_nextWeek()">⏭️</button>
      <br />
      <small class="font-normal pt-4" v-if="shifts">
        <i>📈</i>&nbsp;
        <span class="font-bold"> {{ ui_future_hours == -1 ? '...' : ui_future_hours }}</span>
        <span> hour{{ ui_future_hours == 1 ? '' : 's' }} in the future. </span>
        <br />
        <i>🕒</i>&nbsp;
        <span class="font-bold">{{ hours() }} </span>
        <span> hour{{ hours() == 1 ? '' : 's' }} scheduled in this range.</span>
      </small>
      <br />
    </div>
    <div class="card-body" v-if="shifts && routePresets">
      <table class="table">
        <thead>
          <tr>
            <th>Route</th>
            <th>#</th>
            <th>Rounds</th>
            <th>Start</th>
            <th>End</th>
            <th class="text-center">Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="shift in shifts">
            <td>
              <span class="badge" 
                    :style="`background-color: ${routePresets.route(shift.route).color}; 
                             color: ${routePresets.route(shift.route).text};`">
                    {{ shift.route }}
              </span>
            </td>
            <td>{{ shift.bus.replace("BUS ", '') }}</td>
            <td>
              <b class="text-amber-400 drop-shadow-2xl">{{ calculateRounds(routePresets.route(shift.route), shift.start, shift.end) % 1 != 0 ? '⚠' : '' }}</b>
              {{ Math.floor(calculateRounds(routePresets.route(shift.route), shift.start, shift.end)) }}
            </td>
            <td :class="isToday(shift.start) ? '!bg-amber-200 font-bold text-xs' : 'text-xs'" v-html="displayDateTime(shift.start)"></td>
            <td :class="isToday(shift.start) ? '!bg-amber-200 font-bold text-xs' : 'text-xs'" v-html="displayDateTime(shift.end)"></td>
            <td class="text-center">
                {{ isPast(shift.end) ? "✅" : "⌛" }}
                {{ shift.in_trade ? "⏫" : "" }}
                {{ isToday(shift.start) ? "⏰" : "" }}
            </td>
            <td>
              <button class="btn btn-info text-xs px-2 py-1" @click="trade_post(shift.shiftboard_id)" v-if="!shift.in_trade">Trade</button>
              <button class="btn btn-danger text-xs px-2 py-1" @click="trade_cancel(shift.shiftboard_id)" v-else>Un-Trade</button>
            </td>
          </tr>
        </tbody>
      </table>
      <small>
        <div class="card-body text-center py-4" v-if="ui_refreshing">
          Loading...
        </div>
        <div class="py-8 text-center" v-if="shifts.length == 0">
          No shifts found in this time range!
        </div>
        <ul class="schedule-key flex flex-wrap">
            <li><b class="text-amber-400 drop-shadow-2xl">⚠</b> Timing Inaccuracy (Closing/Timing Change?)</li>
            <li>⌛ Future</li>
            <li>✅ Finished</li>
            <li>⏫ Posted for Trade</li>
            <li>⏰ Today</li>
            <li>🔄 Refresh</li>
            <li>⏮️ Previous Week</li>
            <li>↩️ Current Week</li>
            <li>⏭️ Next Week</li>
        </ul>
      </small>
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
        
        ui_refreshing: false,
        ui_future_hours: -1.0,
    }
  },
  methods: {
    async onScheduleUpdate() {
      // sends the date ranges to api.js
      this.ui_refreshing = true;
      this.shifts = await window.dashapi.shifts(this.scheduleStart, this.scheduleEnd);
      this.ui_refreshing = false;
    },
    futureShifts() {
        return this.shifts.filter(shift => {
            var startDay = new Date(shift.start);
            startDay.setHours(23);
            startDay.setMinutes(59);
            startDay.setSeconds(59);
            startDay.setMilliseconds(999);
            return shift.yours && (startDay > Date.now()) && shift.yours;
        });
    },
    async futureHours() {
      var today = new Date(Date.now());
      var longIntoTheFuture = new Date(Date.now());
      longIntoTheFuture.setUTCFullYear(9999);
      var allShifts = await window.dashapi.shifts(today, longIntoTheFuture);

      var time = 0;
      for (let shift of allShifts) {
        time += (new Date(shift.end)) - (new Date(shift.start));
      }
      return (time / (1000 * 60 * 60));
    },
    hours() {
      var time = 0;
      for (let shift of this.shifts) {
        time += (new Date(shift.end)) - (new Date(shift.start));
      }
      return (time / (1000 * 60 * 60));
    },
    isToday: window.axdash_utils.isToday,
    isPast: window.axdash_utils.isPast,
    calculateRounds: window.axdash_utils.calculateRounds,
    displayDateTime: window.axdash_utils.displayDateTime,
    async trade_post(shift_id) {
      let note = prompt("Add a optional note or click 'cancel' to cancel shift trade:");
      if (note == null) {
        return;
      }
      let trade_id = await window.dashapi.trade_post(shift_id, note);
      await this.onScheduleUpdate();
      console.log("Trade:");
      console.log(trade_id);
      return trade_id;
    },
    async trade_cancel(shift_id) {
      console.log("Cancel:");
      console.log(shift_id);
      let result = await window.dashapi.trade_cancel_blind(shift_id);
      await this.onScheduleUpdate();
      return result;
    },
    getWeekRangeOfDate(date) {
      let start = new Date(date);
      while (start.getUTCDay() != 0) { // go back until start is a Sunday
        start.setUTCDate(start.getUTCDate() - 1);
      }

      let end = new Date(start);
      while (end.getUTCDay() != 6) { // go forward until end is a Saturday
        end.setUTCDate(end.getUTCDate() + 1);
      }

      return { start, end };
    },
    setRange(start, end) {
      // expects Date objects on start and end
      // converts the range to a string that the date picker in the browser can read
      this.scheduleStart = window.axdash_utils.dateToFormFormat(start);
      this.scheduleEnd = window.axdash_utils.dateToFormFormat(end);
    },
    currentWeek() {
      var today = Date.now();
      var { start, end } = this.getWeekRangeOfDate(today);
      this.setRange(start, end);
    },
    nextWeek() {
      var startPoint = new Date(this.scheduleStart);

      if (startPoint.getUTCDay() == 0) {
        startPoint.setUTCDate(startPoint.getUTCDate() + 1);
      }

      while(startPoint.getUTCDay() != 0) {
        startPoint.setUTCDate(startPoint.getUTCDate() + 1);
      }

      var { start, end } = this.getWeekRangeOfDate(startPoint);
      this.setRange(start, end);
    },
    lastWeek() {
      var startPoint = new Date(this.scheduleStart);

      if (startPoint.getUTCDay() == 0) {
        startPoint.setUTCDate(startPoint.getUTCDate() - 1);
      }

      while(startPoint.getUTCDay() != 0) {
        startPoint.setUTCDate(startPoint.getUTCDate() - 1);
      }

      var { start, end } = this.getWeekRangeOfDate(startPoint);
      this.setRange(start, end);
    },
    async ui_currentWeek() {
      this.currentWeek();
      await this.onScheduleUpdate();
    },
    async ui_nextWeek() {
      this.nextWeek();
      await this.onScheduleUpdate();
    },
    async ui_lastWeek() {
      this.lastWeek();
      await this.onScheduleUpdate();
    }
  },
  async mounted() {
    this.routePresets = await window.axdash_presets.get(window.dashapi);
    
    await this.ui_currentWeek();
    this.ui_future_hours = await this.futureHours();
  }
}
</script>
