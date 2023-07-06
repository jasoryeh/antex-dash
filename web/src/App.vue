<script setup>
import HelloWorld from './components/HelloWorld.vue'

import Login from './components/Login.vue'
import Dash from './components/Dash.vue'
</script>

<template>
  <nav class="navbar bg-body-tertiary">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">AX Dash</a>
    </div>
  </nav>
  <div class="content w-full h-screen">
    <HelloWorld v-if="info" :msg="info_msg" :type="info_type"/>
    <Login v-if="!authenticated" @credentials="onCredentials" class="m-auto" />
    <Dash v-else />
  </div>
</template>

<style scoped>

</style>

<script>
export default {
  data() {
    return {
      info: true,
      info_msg: "Loading...",
      info_type: "success",

      dashapi: null,
      authenticated: false,
    }
  },
  methods: {
    log(stuff) {
      console.log(stuff);
    },
    show(enable, msg = null, type = 'danger') {
      this.info = enable;
      this.info_msg = msg;
      this.info_type = type;
    },
    resetSession() {
      window.dashapi = new window.axdash();
    },
    async checkAndLogin() {
      if (!window.dashapi.credentials) {
        console.warn("Cannot check credentials and log in without credentials!");
        return false;
      }
      var validity = await window.dashapi.check();
      if (!validity) {
        this.show(true, "Failure occurred whilst validating returned credentials.");
        return false;
      }
      this.show(true, "Logged in!", "success");
      return true;
    },
    async onCredentials(usn, pwd, endp) {
      this.show(false);
      window.dashapi.username = usn;
      window.dashapi.password = pwd;
      try {
        await window.dashapi.logIn();
      } catch(ex) {
        this.show(true, "Failure occurred whilst logging in.")
        console.log(ex);
        return;
      }
      var validate = await this.checkAndLogin();
      if (validate) {
        window.dashapi.save();
        console.log("Saved credentials to browser.");
      }
    },
  },
  filters: {},
  async mounted() {
    if (!window.axdash) {
      this.show(true, "A catastrophic failure has occurred whilst loading this page. Please reload and try again.");
      return;
    }
    this.show(false);

    var attempt = window.axdash.load();
    if (attempt) {
      this.show(true, "Reloading session from browser...", "info")
      window.dashapi = attempt;
      var validate = await this.checkAndLogin();
      if (validate) {
        this.show(true, "Session was loaded from browser!", "info");
      } else {
        console.log("Could not reload session from browser!");
      }
    } else {
      this.show(true, "Starting a new session...", "info");
      this.resetSession();
      this.show(false);
    }

    setInterval(() => {
      this.dashapi = window.dashapi;
      this.authenticated = this.dashapi && this.dashapi.authenticated;
    }, 100);

  },
};
</script>