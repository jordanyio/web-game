<template>
  <div id="app">
    <ConnectFour :username="username" />
    <ChatComponent :gameId="username" :username="username" />
  </div>
</template>

<script>
import ConnectFour from './components/ConnectFour.vue'
import ChatComponent from './components/ChatComponent.vue'

export default {
  name: 'App',
  components: {
    ConnectFour,
    ChatComponent
  },
  data() {
    return {
      username: null,
    };
  },
  mounted() {
    // Check if username exists in localStorage
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      this.username = storedUsername;
    } else {
      // Prompt user to enter username through modal
      this.promptUsername();
    }
  },
  methods: {
    promptUsername() {
      const username = prompt('Please enter your username:');
      if (username) {
        // Store username in localStorage
        localStorage.setItem('username', username);
        this.username = username;
      } else {
        // Handle case where user cancels prompt
        alert('You must enter a username.');
        this.promptUsername();
      }
    }
  }
}
</script>




