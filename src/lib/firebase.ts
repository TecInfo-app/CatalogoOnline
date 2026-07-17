import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBpf9XJvVQISXXSN9yWSJ2vGwTiQtlMmK0",
  authDomain: "catalogoonline-b4c73.firebaseapp.com",
  projectId: "catalogoonline-b4c73",
  storageBucket: "catalogoonline-b4c73.firebasestorage.app",
  messagingSenderId: "843763107616",
  appId: "1:843763107616:web:2d455a74d22e8077f1b945"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Ensure persistence is set
setPersistence(auth, browserLocalPersistence).catch(console.error);

export { app, auth, db };
