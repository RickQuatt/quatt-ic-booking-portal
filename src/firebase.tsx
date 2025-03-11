import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";

const firebaseConfig = JSON.parse(
  import.meta.env.VITE_FIREBASE_CONFIG_JSON as string,
);

console.log("firebaseConfig", import.meta.env);
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const signinWithGoogle = async () => {
  const oldToken = await auth.currentUser?.getIdToken();
  if (oldToken) {
    return { token: oldToken };
  }

  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // This gives you a Google Access Token. You can use it to access the Google API.
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    // The signed-in user info.
    const user = result.user;
    return { token };
  } catch (e) {
    console.error("Error in firebase popup", e);
  }
};
