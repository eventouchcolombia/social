// firebase.js
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCTst3S9JL8w_H7qic-dk2gp5z9HmYdAIw",
  authDomain: "socialeventouch.firebaseapp.com",
  projectId: "socialeventouch",
  storageBucket: "socialeventouch.firebasestorage.app",
  messagingSenderId: "885113882594",
  appId: "1:885113882594:web:f0f42acc8d511752c29bbb"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage };
