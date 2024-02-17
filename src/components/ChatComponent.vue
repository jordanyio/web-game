<template>
  <div class="chat-container custom-margin p-3 mb-2 bg-light border rounded">
    <div v-if="waiting">
      <p>You are waiting for a game...</p>
    </div>
    <div v-else>
      <div class="messages" style="height: 200px; overflow-y: auto;">
        <div v-if="messages.length === 0" class="text-muted">No messages</div>
        <div v-else>
          <div v-for="(message, index) in messages" :key="index" class="message mb-2">
            <strong>{{ message.sender }}:</strong> {{ message.text }}
          </div>
        </div>
      </div>
      <div class="input-group mt-3">
        <input type="text" v-model="newMessage" @keyup.enter="sendMessage" class="form-control" placeholder="Type a message..." />
        <div class="input-group-append">
          <button class="btn btn-primary" type="button" @click="sendMessage">Send</button>
        </div>
      </div>
      <div v-if="error" class="text-danger">{{ error }}</div>
    </div>
  </div>
</template>

<script>
import { db } from "@/firebase";
import { collection, addDoc, query, orderBy, serverTimestamp, onSnapshot } from "firebase/firestore";

export default {
  name: 'ChatComponent',
  props: ['gameId', 'username', 'waiting'], // Add waiting as a prop
  data() {
    return {
      newMessage: '',
      messages: [],
      error: null,
    };
  },
  mounted() {
    if (!this.waiting) {
      this.fetchMessages();
    }
  },
  methods: {
    async fetchMessages() {
      try {
        const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
        onSnapshot(q, (querySnapshot) => {
          this.error = null;
          this.messages = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log("Fetched messages:", this.messages);
        }, (error) => {
          console.error("Error fetching messages:", error);
          this.error = "Error fetching messages. Please try again later.";
        });
      } catch (error) {
        console.error("Error fetching messages:", error);
        this.error = "Error fetching messages. Please try again later.";
      }
    },
    async sendMessage() {
      try {
        if (!this.newMessage.trim()) return;

        const message = {
          sender: this.username,
          text: this.newMessage,
          timestamp: serverTimestamp(),
          gameId: this.gameId
        };

        await addDoc(collection(db, "messages"), message);
        this.newMessage = '';
      } catch (error) {
        console.error("Error sending message:", error);
        this.error = "Error sending message. Please try again later.";
      }
    }
  }
}
</script>

<style scoped>
.chat-container {
  margin-top: 20px;
  border: 1px solid #ccc;
  padding: 10px;
}

.messages {
  max-height: 200px;
  overflow-y: auto;
}

.message-input input {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
}

.custom-margin {
  margin-left: 10vw; /* Customize as needed */
  margin-right: 10vw; /* Customize as needed */
}
</style>

  
  