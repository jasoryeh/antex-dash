<script setup>
</script>

<template>
  <div class="container" v-if="ready">
    <div class="card mx-2 my-2">
      <div class="card-header">
        Shifts
      </div>
      <div class="card-body">
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
            <tr v-for="shift in shifts.filter(e => e.yours && ((new Date(e.start)) > Date.now()))">
              <td :class="isToday(shift.start) ? 'bg-amber-500' : ''">
                <span class="badge" 
                      :style="`background-color: ${presets.route(shift.route).color}; color: ${presets.route(shift.route).text};`">
                      {{ shift.route }}
                </span>
              </td>
              <td>{{ shift.bus.replace("BUS ", '') }}</td>
              <td>{{ calculateRounds(shift.route, shift.start, shift.end) }}</td>
              <td v-html="displayDateTime(shift.start)"></td>
              <td v-html="displayDateTime(shift.end)"></td>
              <td class="text-center">{{ shift.in_trade ? "�" : "✅" }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
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
            </tr>
          </thead>
          <tbody>
            <tr v-for="trade in trades">
              <td>
                <span class="badge" 
                      :style="`background-color: ${presets.route(trade.route).color}; color: ${presets.route(trade.route).text};`">
                      {{ trade.route }}
                </span>
              </td>
              <td>{{ calculateRounds(trade.route, trade.start, trade.end) }}</td>
              <td>
                {{ trade.from_name }}
                <br />
                ({{ trade.from_username }})
              </td>
              <td v-html="displayDateTime(trade.start)"></td>
              <td v-html="displayDateTime(trade.end)"></td>
              <td>{{ trade.notes }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="card mx-2 my-2">
      <div class="card-header">
        Known Schedule
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
            </tr>
          </thead>
          <tbody>
            <tr v-for="trade in trades">
              <td>
                <span class="badge" 
                      :style="`background-color: ${presets.route(trade.route).color}; color: ${presets.route(trade.route).text};`">
                      {{ trade.route }}
                </span>
              </td>
              <td>{{ calculateRounds(trade.route, trade.start, trade.end) }}</td>
              <td>
                {{ trade.from_name }}
                <br />
                ({{ trade.from_username }})
              </td>
              <td v-html="displayDateTime(trade.start)"></td>
              <td v-html="displayDateTime(trade.end)"></td>
              <td>{{ trade.notes }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="card mx-2 my-2">
      <div class="card-header">
        News
      </div>
      <div class="card-body" v-if="news.manager || news.team || news.memeber">
        <div class="card w-[100%] h-fit mx-2 my-2" v-if="news.manager">
          <div class="card-header">Manager News</div>
          <div class="card-body" v-html="news.manager"></div>
        </div>
        <div class="card w-[100%] h-fit mx-2 my-2" v-if="news.team">
          <div class="card-header">Team News</div>
          <div class="card-body" v-html="news.team"></div>
        </div>
        <div class="card w-[100%] h-fit mx-2 my-2" v-if="news.member">
          <div class="card-header">Member News</div>
          <div class="card-body" v-html="news.member"></div>
        </div>
      </div>
      <div class="card-body" v-else>
        <div class="m-auto py-4 font-bold">No messages!</div>
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
      shifts: [],
      trades: [],
      news: null,
      presets: null,
      timeOpts: { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' },
    }
  },
  methods: {
    resolveColors(route) {
      return window.dashapi.presets().lookupRoute(route);
    },
    displayDateTime(date) {
      var parsed = (new Date(date));
      return parsed.toLocaleDateString('en-US', this.timeOpts)
                    .replace(' at ', '<br/>')
    },
    calculateRounds(route, start, end) {
      var begin = new Date(start);
      var end = new Date(end);
      var timing = this.presets.route(route).timing;
      return (end - begin) / (1000 * 60 * timing);
    },
    isToday(time) {
      let parsed = new Date(time);
      let today = new Date();
      return (today.getMonth() == parsed.getMonth()) 
                && (today.getDate() == parsed.getDate())
                && (today.getFullYear() == parsed.getFullYear());
    }
  },
  async mounted() {
    if (!(await window.dashapi.check())) {
      console.warn("Failed to authenticate again!");
      return;
    }
    this.shifts = await window.dashapi.shifts();
    this.trades = await window.dashapi.trades();
    this.presets = await window.dashapi.presets();
    this.news = await window.dashapi.news();
    this.ready = true;
  },
}
</script>
