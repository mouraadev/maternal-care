import {getApps,initializeApp, type FirebaseApp} from 'firebase/app';
import {getAuth, connectAuthEmulator, type Auth} from 'firebase/auth';
import {getFirestore, connectFirestoreEmulator, type Firestore} from 'firebase/firestore';
const env=import.meta.env;
const cfg={apiKey:env.VITE_FIREBASE_API_KEY,authDomain:env.VITE_FIREBASE_AUTH_DOMAIN,projectId:env.VITE_FIREBASE_PROJECT_ID,appId:env.VITE_FIREBASE_APP_ID,storageBucket:env.VITE_FIREBASE_STORAGE_BUCKET,messagingSenderId:env.VITE_FIREBASE_MESSAGING_SENDER_ID};
export const firebaseEnabled=Boolean(cfg.apiKey&&cfg.projectId&&cfg.appId);
export const app:FirebaseApp|null=firebaseEnabled?(getApps()[0]??initializeApp(cfg)):null;
export const auth:Auth|null=app?getAuth(app):null;
export const db:Firestore|null=app?getFirestore(app):null;
if(auth&&db&&env.VITE_USE_FIREBASE_EMULATORS==='true'&&typeof window!=='undefined'){
 const configured=globalThis as typeof globalThis & {__maternalEmulators?:boolean};
 if(!configured.__maternalEmulators){connectAuthEmulator(auth,`http://${window.location.hostname}:9099`,{disableWarnings:true});connectFirestoreEmulator(db,window.location.hostname,8080);configured.__maternalEmulators=true;}
}
// Não substitua validação das regras Firestore e autorização por perfil no servidor.
