<template>
    <div class="container mt-5">
      <div class="text-center mb-4">
        <h1>Connect Four Tournament</h1>
        <div v-if="winMessage" class="alert alert-success" role="alert">
          {{ winMessage }}
        </div>
        <div v-if="!gameOver" class="turn-indicator">
          {{ turnMessage }}
        </div>
      </div>
  
      <div class="board d-flex flex-column align-items-center mb-3">
        <div v-for="row in 6" :key="row" class="d-flex">
          <div
            v-for="col in 7"
            :key="col"
            class="cell m-1"
            :class="{ 'bg-danger': board[row - 1][col - 1] === '1', 'bg-warning': board[row - 1][col - 1] === '2' }"
            @click="dropPiece(col - 1)"
          ></div>
        </div>
      </div>
      <div class="text-center">
        <div v-if="winMessage" class="alert alert-success" role="alert">
          {{ winMessage }}
        </div>
      </div>
      
      <div class="text-center">
        <!-- <button @click="lookForGame" class="btn btn-primary mr-5">Play A Game!</button>
        <button @click="resetGame" class="btn btn-danger ml-5">Reset Game!</button> -->
      </div>
      <p>Match Number: {{ matchNumber }}</p>
    </div>
  </template>
  
  <script>
  import { db } from "@/firebase";
  import { collection, query, orderBy, getDocs, limit, where, updateDoc, onSnapshot } from "firebase/firestore";

  export default {
    name: 'ConnectFour',
    props: ['tournamentPlayers', 'matchNumber'],
    data() {
      return {
        board: Array(6).fill().map(() => Array(7).fill(0)),
        Username: '',
        winnerId: "",
        currentPlayer: '1',
        Player1Name: '',
        Player2Name: '',
        player1: '',
        player2: '',
        playerCount: 0,
        playerMovingFirst: '',
        playerUsernameLookingForGame: '',
        isPlayerLookingForGame: false,
        gameId: 0,
        gameOn: false,
        gameOver: false,
        winMessage: '', 
        movesPerRowCount: [0,0,0,0,0,0,0],
      };
    },
    async mounted() {
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log("Received match number:", this.matchNumber);

      while (this.playerCount < 2 && !this.matchNumber) {
        await this.animateGame();
      }
      this.subscribeToMatch();
      this.Username = this.username;
    },
    computed: {
      username() {
        return this.$store.getters.getUsername;
      },
      turnMessage() {
        if (this.gameOn) {
          const playerName = this.currentPlayer === '1' ? this.Player1Name : this.Player2Name;
          if (playerName == this.Username){
            return `It's your turn, ${playerName}!`
          }
          return `It's ${playerName}'s turn`;
        } else {
          // Default message when the game is not on
          return `Player ${this.currentPlayer}'s turn`;
        }
      },
    },
    methods: {

      async animateGame(){
      
        while (!this.gameOn){

          let scaledNumber = await this.drawNumber();
          while (this.movesPerRowCount[scaledNumber] > 5){
            scaledNumber = await this.drawNumber();
          }
          this.movesPerRowCount[scaledNumber]++;
          
          await new Promise(resolve => setTimeout(resolve, 200));

          this.dropPiece(scaledNumber);

          if (this.gameOver || this.movesPerRowCount.reduce((accumulator, currentValue) => accumulator + currentValue, 0) >= 42){
            this.movesPerRowCount.forEach((element, index) => {
              this.movesPerRowCount[index] = 0;
            });

            await new Promise(resolve => setTimeout(resolve, 3000));

            this.resetGame();
          }
        }

        // incase the animation overwrites the random draw in lookForGame
        this.currentPlayer = this.playerMovingFirst;
      },

      async subscribeToMatch() {
        this.gameOn = true;
        // Assuming this.matchNumber is already set to the specific match you want to subscribe to
        console.log("Subscribing to match with matchNumber:", this.matchNumber);

        // Define the query to select the match by matchNumber
        const matchRef = query(collection(db, "Matches"), where("matchNumber", "==", this.matchNumber));

        // Subscribe to updates on the match document with the specified matchNumber
        this.unsubscribe = onSnapshot(matchRef, (snapshot) => {
          if (!snapshot.empty) {
            // Assuming there's only one document with this matchNumber
            const matchData = snapshot.docs[0].data();
            console.log("Received match data:", matchData);

            // Here, update your component's data with the match information
            this.board = matchData.board ? JSON.parse(matchData.board) : this.board;
            this.player1 = matchData.player1ID;
            this.player2 = matchData.player2ID;
            this.Player1Name = matchData.Player1;
            this.Player2Name = matchData.Player2;
            this.currentPlayer = matchData.currentPlayer;
            // Handle other necessary updates based on the match data
          } else {
            console.error("No match found with matchNumber:", this.matchNumber);
          }
        }, (error) => {
          console.error("Error subscribing to match:", error);
        });

        await this.fetchPlayerNames();
      },

      async updateMatch() {
        console.log("Board: ", this.board)
        const matchRef = query(collection(db, "Matches"), where("matchNumber", "==", this.matchNumber));
        const snapshot = await getDocs(matchRef);
        if (!snapshot.empty) {
          const docRef = snapshot.docs[0].ref;
          await updateDoc(docRef, {
            board: JSON.stringify(this.board),
            gameOver: this.gameOver,
            winnerId: this.winnerId,
            currentPlayer: this.currentPlayer
            // Add other fields you might want to update, e.g., currentPlayer
          });
        } else {
          console.error("No match found to update");
        }
        console.log("Match updated.")
       
        
      },

      drawNumber(){
        const randomNumber = Math.random();
        return Math.floor(randomNumber * 7); 
      },

      async fetchPlayerNames() {
        try {
          const playersRef = collection(db, "Players");
          // Ensure `this.player1` and `this.player2` are not undefined or null
          if (this.player1 && this.player2) {
            const q = query(playersRef, where("userId", "in", [this.player1, this.player2]));
            const snapshot = await getDocs(q);

            snapshot.forEach(doc => {
              const data = doc.data();
              if (data.userId === this.player1) {
                this.Player1Name = data.PlayerName;
              } else if (data.userId === this.player2) {
                this.Player2Name = data.PlayerName;
              }
            });

            if (snapshot.empty) {
              console.log("No matching players found.");
            }
          } else {
            console.error("Player1 or Player2 ID is missing.");
          }
        } catch (error) {
          console.error("Error fetching player names:", error);
        }
      },

      async getGame(){
        const q = query(collection(db, "games"), orderBy("gameId", "desc"), limit(1));
          return await getDocs(q);
      },
  
      async setGameId() {
        try {
          //const q = query(collection(db, "games"), orderBy("gameId", "desc"), limit(1));
          const querySnapshot = await this.getGame();
          console.log("Documents:", querySnapshot.docs);

          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const docData = doc.data(); 
            const docRef = doc.ref; 

            let docGameId = docData.gameId;
            if (docData.player1 === "" || docData.player2 === "" && docGameId > 0){
              this.gameId = docGameId; 
              await this.updateGameDoc(docRef);
              console.log("hit 1 ", docGameId )
            } else {
              docGameId++;
              this.gameId = docGameId;
              console.log("hit 2 ", docGameId )

              await this.addGameDoc();
            }
          } else {
            console.log("No games found.");
            this.gameId = 1;
          }
          return;

        } catch (error) {
          console.error("Error fetching gameId:", error);
          this.error = "Error fetching game data. Please try again later.";
          return;
        }
      },


      async dropPiece(col) {
        if (this.checkWin()) {
          // Win logic is now handled within checkWin, so no need to do anything else here
          if (this.matchNumber){
            if (this.currentPlayer == '1'){
              this.winnerId = this.player1
            } else {
              this.winnerId = this.player2
            }
            this.gameOver = true;
            this.updateMatch();
          }
          return; 
        }

        if (this.gameOver) {
          console.log("Case 1 hit")
            return; // Prevent any moves if the game is over or not on
        }

        if (this.gameOn){
        
          if (this.username == this.Player1Name && this.currentPlayer != '1'){
          // this will prevent a player from moving when its not their turn 
          // TODO alert them that its the other players turn
          
            return;
          }

          if (this.username == this.Player2Name && this.currentPlayer != '2'){
            // this will prevent a player from moving when its not their turn 
            // TODO alert them that its the other players turn
     
            return;
          }
        }

        for (let row = 5; row >= 0; row--) {
            if (this.board[row][col] === 0) {
                this.board[row][col] = this.currentPlayer;
                if (this.checkWin()) {
                    // Win logic is now handled within checkWin, so no need to do anything else here
                    if (this.matchNumber){
                      if (this.currentPlayer == '1'){
                        this.winnerId = this.player1
                      } else {
                        this.winnerId = this.player2
                      }
                      this.gameOver = true;
                      this.updateMatch();
                    }
                    return; 
                }
                this.currentPlayer = this.currentPlayer === '1' ? '2' : '1';
                this.currentPlayerName = this.currentPlayerName === this.player1 ? this.player2 : this.player1; // Switch player if no win
                
                await this.updateGameDoc;
                if (this.matchNumber > 0) {
                  console.log("This.board = ", this.board)
                  
                  this.updateMatch();
                }
                break;
            }
          }
      },

      checkWin() {
        const directions = [
        { name: 'horizontal', increment: { row: 0, col: 1 } },
        { name: 'vertical', increment: { row: 1, col: 0 } },
        { name: 'diagonalDown', increment: { row: 1, col: 1 } },
        { name: 'diagonalUp', increment: { row: -1, col: 1 } },
        ];

        const checkDirection = (direction) => {
          for (let row = 0; row < 6; row++) {
              for (let col = 0; col < 7; col++) {
                  const initialCell = this.board[row][col];
                  if (initialCell === 0) continue;

                  let win = true;
                  for (let i = 1; i < 4; i++) {
                      const newRow = row + direction.increment.row * i;
                      const newCol = col + direction.increment.col * i;

                      if (newRow < 0 || newRow >= 6 || newCol < 0 || newCol >= 7 || this.board[newRow][newCol] !== initialCell) {
                      win = false;
                      break;
                      }
                  }

                  if (win) return true;
              }
          }

          return false;
          };

          for (const direction of directions) {
              if (checkDirection(direction)) {
                  this.gameOver = true; // Indicate the game is over
                  this.winMessage = `Player ${this.currentPlayer} wins!`; // Set the win message
                  return true; // You don't need to show alert here anymore
              }
          }
          return false; 
      },

      resetGame() {

        if (this.gameOn){
          this.board = Array(6).fill().map(() => Array(7).fill(0));
          this.gameOver = false;
          this.winMessage = '';
          return;
        }

        this.board = Array(6).fill().map(() => Array(7).fill(0));
        this.currentPlayer = '1';
        this.gameOver = false;
        this.winMessage = '';
        this.gameOn = false;
        this.animateGame;
      },
    },
  };
  </script>
  
<style scoped>

.cell {
  width: 50px;
  height: 50px;
  border-radius: 50%; /* Make cells circular */
  box-shadow: 0 0 5px rgba(0,0,0,0.5); /* Soft shadow for depth */
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden; /* Keep pseudo-elements within the cell */
}

.cell:before {
  content: '';
  position: absolute;
  top: -100%;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: inherit;
  transition: top 0.5s ease-in;
}

.cell.player-one, .cell.player-two {
  background-color: #eee; /* Fallback for empty cells */
}

.cell.player-one:before {
  background-color: #d9534f; /* Bootstrap 'btn-danger' color */
}

.cell.player-two:before {
  background-color: #f0ad4e; /* Bootstrap 'btn-warning' color */
}

.cell:hover:not(.player-one):not(.player-two):before {
  top: 0; /* Preview piece drop on hover */
}

.turn-indicator .player-1-color {
  color: #d9534f; /* Match player one color */
}

.turn-indicator .player-2-color {
  color: #f0ad4e; /* Match player two color */
}

.win-message {
  font-size: 1.25rem; /* Larger text for emphasis */
}

.board{
    margin-left: 10vw;
    margin-right: 10vw;
}

</style>

  