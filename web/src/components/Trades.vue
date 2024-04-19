<script setup>
import { ref } from 'vue'

defineProps({
  trades: Object,
})

</script>

<template>
  <div class="card mx-2 my-2">
      <div class="card-header">
        Trades
      </div>
      <div class="card-body">
        <table class="table">
          <thead>
            <tr>
              <th>Route</th>
              <th>Rounds</th>
              <th>From</th>
              <th>Start</th>
              <th>End</th>
              <th>Notes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="trade in trades">
              <td>
                <span class="badge" 
                      :style="`background-color: ${routePresets.route(trade.route).color}; 
                               color: ${routePresets.route(trade.route).text};`">
                      {{ trade.route }}
                </span>
              </td>
              <td>
                <b class="text-amber-400 drop-shadow-2xl">{{ calculateRounds(routePresets.route(trade.route), trade.start, trade.end) % 1 != 0 ? '⚠' : '' }}</b>
                {{ Math.floor(calculateRounds(routePresets.route(trade.route), trade.start, trade.end)) }}
              </td>
              <td class="text-xs">
                {{ trade.from_name }}
                <br />
                <span v-if="trade.from_username">
                  ({{ trade.from_username }})
                </span>
              </td>
              <td class="text-xs" v-html="displayDateTime(trade.start)"></td>
              <td class="text-xs" v-html="displayDateTime(trade.end)"></td>
              <td>{{ trade.notes }}</td>
              <td><span class="btn btn-info text-xs px-2 py-1" @click="take(trade)">Take</span></td>
            </tr>
          </tbody>
        </table>
        <small>
          <ul class="schedule-key flex">
              <li><b class="text-amber-400 drop-shadow-2xl">⚠</b> Timing Inaccuracy (Closing/Timing Change?)</li>
          </ul>
        </small>
        <div class="py-8 text-center" v-if="trades.length == 0">
          No trades available!
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
        trades: [],
    }
  },
  methods: {
    isToday: window.axdash_utils.isToday,
    calculateRounds: window.axdash_utils.calculateRounds,
    displayDateTime: window.axdash_utils.displayDateTime,
    take: function(trade) {
      alert("Not yet available!");
      console.log(JSON.stringify(trade, null, 4));
    }
  },
  async mounted() {
    this.routePresets = await window.axdash_presets.get(window.dashapi);
    this.trades = await window.dashapi.trades();
  }
}
</script>
