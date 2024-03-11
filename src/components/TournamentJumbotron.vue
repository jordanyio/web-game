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
    <div>
      <button class="btn btn-warning play-match-btn" @click="playMatch">Click here to play your match</button>
    </div>
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
      async playMatch() {
        try {
          // Step 1: Query the Players Collection to find the player's ID
          const playersRef = collection(db, "Players");
          const qPlayer = query(playersRef, where("PlayerName", "==", this.username));
          const playerSnapshot = await getDocs(qPlayer);
          
          if (playerSnapshot.empty) {
            console.log(this.username)
            alert("Player not found.");
            return; // Stop if no player is found
          }

          const playerId = playerSnapshot.docs[0].data().userId; 
          console.log(playerId)// Assuming unique usernames

          // Step 2: Query the Matches Collection
          const matchesRef = collection(db, "Matches");
          const qMatch1 = query(matchesRef, where("player1ID", "==", playerId));
          const matchSnapshot1 = await getDocs(qMatch1);

          // Second query for player2ID
          const qMatch2 = query(matchesRef, where("player2ID", "==", playerId));
          const matchSnapshot2 = await getDocs(qMatch2);

          // Combine the results
          const matches = [...matchSnapshot1.docs, ...matchSnapshot2.docs];

          if (matches.length === 0) {
            alert("No match found for you right now!");
            return; // Exit if no match is found
          }

          // Assuming we take the first match found
          const match = matches[0].data(); // Using the first match for demonstration
          const matchNumber = match.matchNumber;

          // Navigate to the LiveGame route with matchNumber as a param
          this.$router.push({ name: 'LiveGame', params: { matchNumber: `${matchNumber}` } });


        } catch (error) {
          console.error("Error fetching match details:", error);
          alert("There was an issue fetching your match. Please try again later.");
        }
      },


    }
  };
  </script>
  
  <style scoped>
  /* You can add styles specific to this component here */
  </style>
  