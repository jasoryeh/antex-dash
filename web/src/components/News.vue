<script setup>
import { ref } from 'vue'

defineProps({
  news: Object,
})

</script>

<template>
  <div class="card mx-2 my-2">
    <div class="card-header">
      News
    </div>
    <div class="card-body" v-if="news && (news.manager || news.team || news.member)">
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
    <div class="card-body text-center py-8" v-else>
      No messages!
    </div>
  </div>
</template>

<style scoped>

</style>

<script>

export default {
  data() {
    return {
      news: null,
    }
  },
  methods: {
  },
  async mounted() {
    this.news = await window.dashapi.news();
  }
}
</script>
