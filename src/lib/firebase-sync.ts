import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const KNOWN_KEYS = ['store_profile', 'products', 'coupons', 'clients', 'orders', 'product_categories', 'agenda_items', 'planned_routes'];

// Call this on app load or when user logs in
// It will pull all keys from Firestore into localStorage
// And also set up listeners for changes? No, just pull once for now.
export const loadStoreData = async (email: string) => {
  for (const key of KNOWN_KEYS) {
    try {
      const docRef = doc(db, 'users', email, 'data', key);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data().value;
        if (data !== undefined) {
          localStorage.setItem(`vercos_${email}_${key}`, JSON.stringify(data));
        }
      }
    } catch (e) {
      console.error(`Error loading ${key}`, e);
    }
  }
};

let isPatched = false;

export const patchLocalStorage = () => {
  if (isPatched) return;
  isPatched = true;

  const originalSetItem = localStorage.setItem;

  localStorage.setItem = function(key: string, value: string) {
    originalSetItem.apply(this, [key, value]);
    
    if (key.startsWith('vercos_')) {
      for (const knownKey of KNOWN_KEYS) {
        if (key.endsWith(`_${knownKey}`)) {
          // Extract email which is in the middle: vercos_{email}_{knownKey}
          const email = key.substring('vercos_'.length, key.length - `_${knownKey}`.length);
          
          try {
            const parsed = JSON.parse(value);
            const docRef = doc(db, 'users', email, 'data', knownKey);
            setDoc(docRef, { value: parsed }).catch(e => console.error("Firebase sync error", e));
          } catch (e) {
            // Not valid JSON or something else
          }
          break; // Found the matching key, no need to check others
        }
      }
    }
  };
};

patchLocalStorage();
