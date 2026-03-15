import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAKd5Xu1eNOuW3d3b7tJ-J-K0BrzTq4-f8",
  authDomain: "moniq-84a78.firebaseapp.com",
  projectId: "moniq-84a78",
  storageBucket: "moniq-84a78.firebasestorage.app",
  messagingSenderId: "658531253097",
  appId: "1:658531253097:web:d4858a20f348495774dbf8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);