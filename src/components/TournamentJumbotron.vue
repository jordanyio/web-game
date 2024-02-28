<template>
  <div class="jumbotron">
    <h1 class="display-4">Gen AI - March - P6 Contest</h1>
    <p class="lead" v-if="tournament">Current Round: {{ tournament.round }}</p>
    <hr class="my-4">
    <p>Status: {{ tournament ? tournament.status : 'Loading...' }}</p>
    <p>{{ playersNames }}</p>
    <p class="lead">
      <a class="btn btn-primary btn-lg" href="#" role="button" v-if="tournament && tournament.registered">View Tournament</a>
    </p>
    <!-- Ready Up Header -->
    <h3 v-if="!isPlayerReady">Hey, {{ username }}! Click here to ready up</h3>
    <h3 v-else>Good Luck, {{ username }}!</h3>
    <!-- Ready Up Button -->
    <button v-if="!isPlayerReady" class="btn btn-success" @click="readyUp">Ready Up</button>
  </div>
</template>
  
  <script>
  import { db } from '@/firebase'; // Adjust the path according to your project structure
  import { collection, query, onSnapshot, doc, updateDoc, where, getDocs } from "firebase/firestore";
  
  export default {
    props: ['tournamentPlayers', 'username'], 

    data() {
      return {
        tournament: null,
        isPlayerReady: false,
      };
    },

    computed: {
      playersNames() {
        return this.tournamentPlayers.map(player => player.PlayerName).join(', ');
      }
    },
    created() {
      this.fetchTournament();
    },
    methods: {
      async fetchTournament() {
        try {
          const q = query(collection(db, "Tournaments")); // Query without orderBy
          onSnapshot(q, (querySnapshot) => {
            this.error = null;
            // If there's expected to be only one document
            if (!querySnapshot.empty) {
              const doc = querySnapshot.docs[0]; // Assuming the first document is what you need
              this.tournament = {
                id: doc.id,
                ...doc.data()
              };
              console.log("Fetched tournament:", this.tournament);
            } else {
              // Handle case where no documents are found
              console.log("No tournament document found");
              this.error = "No tournament document found. Please try again later.";
            }
          }, (error) => {
            console.error("Error fetching tournament:", error);
            this.error = "Error fetching tournament. Please try again later.";
          });
        } catch (error) {
          console.error("Error setting up tournament fetch:", error);
          this.error = "Error setting up tournament fetch. Please try again later.";
        }
      },
      async readyUp() {
        try {
          // Find the player document by username (assuming you pass the unique username or userId as a prop)
          const playersRef = collection(db, "Players");
          const q = query(playersRef, where("username", "==", this.username)); // Adjust field name if necessary
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const playerDoc = querySnapshot.docs[0]; // Assuming username is unique
            await updateDoc(doc(db, "Players", playerDoc.id), {
              isReady: true
            });
            this.isPlayerReady = true;
          }
        } catch (error) {
          console.error("Error updating player status:", error);
        }
      },

    }
  };
  </script>
  
  <style scoped>
  /* You can add styles specific to this component here */
  </style>
  