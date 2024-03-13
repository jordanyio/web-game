<template>
  
    <div id="Home">
      <div>
        <TournamentJumbotron :tournamentPlayers="tournamentPlayers" :username="username"></TournamentJumbotron>
      </div>
  
      <ConnectFour :username="username" :tournamentPlayers="tournamentPlayers"/>
  
      <div class="card">
        <TournamentBracket :bracket-size="16"></TournamentBracket>
      </div>
  
      <ChatComponent :gameId="username" :username="username" />
    </div>
  </template>
  
  <script>
  
  import { db } from "@/firebase";
  import { collection, getDocs } from "firebase/firestore";
  
  import ConnectFour from './ConnectFour.vue'
  import ChatComponent from './ChatComponent.vue'
  import TournamentBracket from './Bracket.vue'
  import TournamentJumbotron from './TournamentJumbotron.vue';
  
  
  export default {
    name: 'HomePage',
    components: {
      ConnectFour,
      ChatComponent,
      TournamentBracket,
      TournamentJumbotron
    },
    data() {
      return {
        username: null,
        tournamentPlayers: []
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
      this.updateUsername(this.username);
  
      this.fetchPlayers();
    },
    methods: {
      updateUsername(newValue) {
        this.$store.commit('updateUsername', newValue);
      },
      async fetchPlayers() {
        try {
          const querySnapshot = await getDocs(collection(db, "Players"));
          this.tournamentPlayers = querySnapshot.docs.map(doc => ({
            PlayerName: doc.data().PlayerName,
            userId: doc.data().userId // Assuming the document ID is the userId
          }));
        } catch (error) {
          console.error("Error fetching players:", error);
        }
        console.log(this.tournamentPlayers)
      },
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
  
  <style>
  .card { 
    margin: 32px;
  }
  </style>