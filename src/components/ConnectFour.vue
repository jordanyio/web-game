<template>
    <div class="container mt-5">
      <div class="text-center mb-4">
        <h1>Connect Four Tournament</h1>
        <div v-if="winMessage" class="alert alert-success" role="alert">
          {{ winMessage }}
        </div>
        <div v-if="!gameOver" class="turn-indicator">
          Player <span class="font-weight-bold" :class="`player-${currentPlayer}-color`"> {{ currentPlayer }} </span>'s turn
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
        <button @click="lookForGame" class="btn btn-primary mr-5">Play A Game!</button>
        <button @click="resetGame" class="btn btn-danger ml-5">Reset Game!</button>
      </div>
    </div>
  </template>
  
  <script>
  import { db } from "@/firebase";
  import { collection, query, orderBy, getDocs, limit, where, updateDoc, onSnapshot, doc } from "firebase/firestore";

  export default {
    name: 'ConnectFour',
    props: ['username', 'tournamentPlayers'],
    data() {
      return {
        board: Array(6).fill().map(() => Array(7).fill(0)),
        currentPlayer: '1',
        currentPlayerName: '',
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
        movesPerRowCount: [0,0,0,0,0,0,0]
      };
    },
    async mounted() {
      await new Promise(resolve => setTimeout(resolve, 100));

      while (this.playerCount < 2) {
        await this.animateGame();
      }
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

      drawNumber(){
        const randomNumber = Math.random();
        return Math.floor(randomNumber * 7); 
      },

      logVars(){
        console.log('logging vars...')
        console.log(
        'username :' + this.username,
        'currentPlayer :' + this.currentPlayer,
        'currentPlayerName :' + this.currentPlayerName,
        'player1 :' + this.player1,
        'player2 :' + this.player2,
        'playerCount :' + this.playerCount,
        'playerUsernameLookingForGame :' + this.playerUsernameLookingForGame,
        'isPlayerLookingForGame :' + this.isPlayerLookingForGame,
        'gameId :' + this.gameId,
        'gameOn :' + this.gameOn,
        'gameOver :' + this.gameOver)
      },

      async lookForGame(){

        this.playerUsernameLookingForGame = this.username;
        this.isPlayerLookingForGame = true;



        await this.logVars();
        await this.setGameId();
        await this.logVars();
        await this.subscribeToGame();
        await this.logVars();

        const querySnapshot = await this.getGame();

        let doc = querySnapshot.docs[0];
        let docRef = doc.ref; 

        if (this.player1 == ""){
          this.player1 = this.username;
          await this.updateGameDoc(docRef);
          console.log('hit here')
        
          await this.logVars();
        } else if (this.player1 != this.username && this.player1 != ""){
          this.player2 = this.username;
          await this.updateGameDoc(docRef);
          await this.logVars();
        }

        if (this.player1 == this.username && this.player2 == ""){
          console.log('player one has joined the game.')
        } else if ( this.player2 == this.username && this.player1 != this.username && this.player1 != ""){
          console.log('player two has joined the game')
          console.log('starting game...')

          this.gameOn = true;
          this.isPlayerLookingForGame = false;

          // Randomly select who moves first
          const randomNumber = Math.random();

          let oneOrTwo = randomNumber < 0.5 ? 1 : 2;

          if (oneOrTwo == 1){ 
            this.currentPlayerName = this.player1;
            this.currentPlayer = '1';
            this.playerMovingFirst = '1';
          } else { 
            this.currentPlayerName = this.player2;
            this.currentPlayer = '2';
            this.playerMovingFirst = '2';
          }

          await this.updateGameDoc(docRef);
          

        }
        
        console.log('end of lookForGame')
      },

      async subscribeToGame() {
        try {
          const q = query(collection(db, 'games'), where('gameId', '==', this.gameId));
          onSnapshot(q, (querySnapshot) => {
              if (!querySnapshot.empty) {
                  const docData = querySnapshot.docs[0].data();
                  if (docData) {
                      // Update component's state with document data
                      this.currentPlayer = docData.currentPlayer;
                      this.currentPlayerName = docData.currentPlayerName;
                      this.player1 = docData.player1;
                      this.player2 = docData.player2;
                      this.playerCount = docData.playerCount;
                      this.playerUsernameLookingForGame = docData.playerUsernameLookingForGame;
                      this.isPlayerLookingForGame = docData.isPlayerLookingForGame;
                      this.gameId = docData.gameId;
                      this.gameOn = docData.gameOn;
                      this.gameOver = docData.gameOver;
                  } else {
                      console.log("Document data is empty.");
                  }
              } else {
                  console.log("No game document found.");
              }
          }, (error) => {
              console.error("Error in onSnapshot:", error);
              this.error = "Error fetching game state. Please try again later.";
          });
          // Store the unsubscribe function if needed to later stop listening to changes
          // this.unsubscribe = unsubscribe;
        } catch (error) {
            console.error("Error fetching game state:", error);
            this.error = "Error fetching game state. Please try again later.";
        }
    },

    async updateDocument() {
      try {
          const docRef = doc(collection(db, 'games'), this.gameId);
          await updateDoc(docRef, {
              currentPlayer: this.currentPlayer,
              player1: this.player1,
              player2: this.player2,
              playerCount: this.playerCount,
              playerUsernameLookingForGame: this.playerUsernameLookingForGame,
              isPlayerLookingForGame: this.isPlayerLookingForGame,
              gameId: this.gameId,
              gameOn: this.gameOn,
              gameOver: this.gameOver,
          });

          if (this.gameOn){
            await updateDoc(docRef, {
              board: this.board
            })
          }
          console.log("Document updated successfully.");
      } catch (error) {
          console.error("Error updating document:", error);
          this.error = "Error updating game state. Please try again later.";
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

      async updateGameDoc(docRef){
        console.log('docRef! :' + docRef)
        await updateDoc(docRef, {
          currentPlayer: this.currentPlayer,
          currentPlayerName: this.currentPlayerName,
          player1: this.player1,
          player2: this.player2,
          playerCount: this.playerCount,
          playerUsernameLookingForGame: this.playerUsernameLookingForGame,
          isPlayerLookingForGame: this.isPlayerLookingForGame,
          gameId: this.gameId,
          gameOn: this.gameOn,
          gameOver: this.gameOver,
        });

        if (this.gameOn){
          await updateDoc(docRef, {
            board: this.board
          })
        }
      },

      async addGameDoc(){
        await db.collection('games').addDoc({
          currentPlayer: this.currentPlayer,
          currentPlayerName: this.currentPlayerName,
          player1: this.player1,
          player2: this.player2,
          playerCount: this.playerCount,
          playerUsernameLookingForGame: this.playerUsernameLookingForGame,
          isPlayerLookingForGame: this.isPlayerLookingForGame,
          gameId: this.gameId,
          gameOn: this.gameOn,
          gameOver: this.gameOver,
        });
      },

      async dropPiece(col) {
          if (this.gameOver) {
              return; // Prevent any moves if the game is over or not on
          }

          if (this.gameOn){
            if (this.currentPlayerName == this.player1 && this.currentPlayer != '1'){
            // this will prevent a player from moving when its not their turn 
            // TODO alert them that its the other players turn
            
              return;
            }

            if (this.currentPlayerName == this.player2 && this.currentPlayer != '2'){
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
                      return; 
                  }
                  this.currentPlayer = this.currentPlayer === '1' ? '2' : '1';
                  this.currentPlayerName = this.currentPlayerName === this.player1 ? this.player2 : this.player1; // Switch player if no win
                  
                  await this.updateGameDoc;
                  
                  break;
                  // if (this.gameOn){
                  //   this.currentPlayer = this.currentPlayer === this.player1 ? this.player2 : this.player1; // Switch player if no win
                  //   break;
                  // } else {
                  //   this.currentPlayer = this.currentPlayer === '1' ? '2' : '1'; // Switch player if no win
                  //   break;
                  // }
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

  