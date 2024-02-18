<template>
    <div class="container mt-5">
      <div class="text-center mb-4">
        <h1>Connect Four</h1>
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
            :class="{ 'bg-danger': board[row - 1][col - 1] === 1, 'bg-warning': board[row - 1][col - 1] === 2 }"
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
        <button @click="resetGame" class="btn btn-primary mr-5">Play A Game!</button>
        <button @click="resetGame" class="btn btn-primary ml-5">Reset Game</button>
      </div>
    </div>
  </template>
  
  <script>
  import { db } from "@/firebase";
  import { collection, query, orderBy, getDocs, limit } from "firebase/firestore";

  export default {
    name: 'ConnectFour',
    data() {
      return {
        board: Array(6).fill().map(() => Array(7).fill(0)), // 6 rows by 7 columns board
        currentPlayer: '1',
        player1: '',
        player2: '',
        playerCount: 0,
        gameId: '',
        gameOn: false,
        gameOver: false,
        winMessage: '', 
        movesPerRowCount: [0,0,0,0,0,0,0]
      };
    },
    async mounted() {
      while (this.playerCount < 2) {
        await this.gameBuilder();
        await this.animateGame();

      }
    },
    methods: {

      async animateGame(){
      
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
      },

      async drawNumber(){
        const randomNumber = Math.random();
        return Math.floor(randomNumber * 7); 
      },

      async gameBuilder() {
        try {
          const q = query(collection(db, "games"), orderBy("gameId", "desc"), limit(1));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0]; // Get the first document
            let gameId = doc.data().gameId; // Retrieve the gameId property
            this.gameId = gameId++;
            return;
          } else {
            console.log("No games found.");
            this.gameId = 1;
            return;
          }
        
        } catch (error) {
          console.error("Error fetching gameId:", error);
          this.error = "Error fetching game data. Please try again later.";
          return;
        }
      },

  

      dropPiece(col) {
          if (this.gameOver) {
              return; // Prevent any moves if the game is over
          }

          for (let row = 5; row >= 0; row--) {
              if (this.board[row][col] === 0) {
                  this.board[row][col] = this.currentPlayer;
                  if (this.checkWin()) {
                      // Win logic is now handled within checkWin, so no need to do anything else here
                      return; // Exit early if a win is detected
                  }
                  this.currentPlayer = this.currentPlayer === 1 ? 2 : 1; // Switch player if no win
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
        this.board = Array(6).fill().map(() => Array(7).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        this.winMessage = '';
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

  