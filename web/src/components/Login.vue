<script setup>
</script>

<template>
  <div class="card w-fit h-fit mt-4">
    <div class="card-header">
      <b>Login</b>
      via your Shiftboard credentials.
    </div>
    <div class="card-body">
      <form>

        <div class="input-group mb-3" v-if="showEndpoint()">
          <input type="text" class="form-control" placeholder="Endpoint" aria-label="Endpoint" v-model="endpoint">
        </div>

        <div class="input-group mb-3">
          <input type="text" class="form-control" placeholder="Username" aria-label="Username" v-model="username">
        </div>

        <div class="input-group mb-3">
          <input type="password" class="form-control" placeholder="Password" aria-label="Password" v-model="password">
        </div>

        <input type="submit" @click="(e) => {e.preventDefault(); $emit('credentials', username, password, endpoint);}" 
          class="btn btn-info"
          value="Submit">
      </form>
    </div>
  </div>
</template>

<style scoped>

</style>

<script>
export default {
  data() {
    return {
      endpoint: "http://127.0.0.1:8787",
      username: "",
      password: "",
    }
  },
  methods: {
    showEndpoint() {
      return window.location.href.includes('#endpoint');
    }
  }
}
</script>
