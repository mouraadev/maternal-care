import {useEffect} from 'react';
import {onAuthStateChanged} from 'firebase/auth';
import {doc,getDoc} from 'firebase/firestore';
import {auth,db} from '../services/firebase';
import {demoStore} from '../services/demoStore';
import {persistChanges,subscribeRecords} from '../services/firebaseRepository';

export default function FirebaseDataBridge(){
  useEffect(()=>{
    if(!auth||!db)return;
    let version=0;
    let unsubscribeData:(()=>void)|undefined;
    const unsubscribeAuth=onAuthStateChanged(auth,async user=>{
      const current=++version;unsubscribeData?.();unsubscribeData=undefined;
      if(!user){demoStore.enterDemo();return;}
      // Limpar dados de demonstração imediatamente, antes de carregar registros reais.
      demoStore.connectRemote(user.uid,'patient',persistChanges);
      try{
        const profile=(await getDoc(doc(db!,'users',user.uid))).data();
        if(current!==version)return;
        if(profile?.active!==true||!['admin','doctor','patient'].includes(profile?.role))throw new Error('Perfil inativo ou não cadastrado.');
        demoStore.connectRemote(user.uid,profile.role,persistChanges);
        unsubscribeData=subscribeRecords(user.uid,profile.role,data=>{if(current===version)demoStore.receiveRemote(data);},message=>{if(current===version)demoStore.remoteError(message);});
      }catch{if(current===version)demoStore.remoteError('Seu perfil não está liberado ou não foi possível conectar ao Firestore. Verifique a configuração com o administrador.');}
    });
    return ()=>{version++;unsubscribeAuth();unsubscribeData?.();};
  },[]);
  return null;
}
