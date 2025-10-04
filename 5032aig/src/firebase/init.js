import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCAtjZWgzNCQ-D-SxJ1J-_7i9VSg64bfn4",
  authDomain: "week7-hongxiang.firebaseapp.com",
  projectId: "week7-hongxiang",
  storageBucket: "week7-hongxiang.firebasestorage.app",
  messagingSenderId: "404056791626",
  appId: "1:404056791626:web:5ba1686cab0f1b267e24b3"
};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
export { db, auth };