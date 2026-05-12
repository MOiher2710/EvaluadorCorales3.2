import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBFYJOKpfSIdJmI04BaOPBGjjDbIcZp0_4",
  authDomain: "evaluadorcorales.firebaseapp.com",
  projectId: "evaluadorcorales",
  storageBucket: "evaluadorcorales.appspot.com",
  messagingSenderId: "1062854555638",
  appId: "1:1062854555638:web:d2169ea8f6135cfc2479d7",
  measurementId: "G-J7PDQGT5MS"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);