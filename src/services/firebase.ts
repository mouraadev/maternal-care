import {getApps,initializeApp, type FirebaseApp} from 'firebase/app';
import {getAuth, type Auth} from 'firebase/auth';
import {getFirestore, type Firestore} from 'firebase/firestore';
const env=import.meta.env;
const cfg={apiKey:env.VITE_FIREBASE_API_KEY,authDomain:env.VITE_FIREBASE_AUTH_DOMAIN,projectId:env.VITE_FIREBASE_PROJECT_ID,appId:env.VITE_FIREBASE_APP_ID};
export const firebaseEnabled=Boolean(cfg.apiKey&&cfg.projectId&&cfg.appId);
export const app:FirebaseApp|null=firebaseEnabled?(getApps()[0]??initializeApp(cfg)):null;
export const auth:Auth|null=app?getAuth(app):null;
export const db:Firestore|null=app?getFirestore(app):null;
// Não substitua validação das regras Firestore e autorização por perfil no servidor.
