import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCRosSeYnlmjNJ_SHIBe2SrgY5Z9jtZD0g",
  databaseURL: "https://focusflow-esp32-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: " focusflow-esp32"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export { ref, onValue };