import {auth} from './firebase';
export async function askLia(message:string,context:{week:number}):Promise<string>{
 const endpoint=import.meta.env.VITE_LIA_FUNCTION_URL as string|undefined;
 if(!endpoint)throw new Error('A IA ainda não está conectada. Felipe deve configurar a Cloud Function no Firebase.');
 if(!auth?.currentUser)throw new Error('Entre com sua conta para conversar com a Lia.');
 const token=await auth.currentUser.getIdToken();
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({message,week:context.week})});
 if(!response.ok)throw new Error('Não foi possível consultar a Lia agora.');
 const body=await response.json() as {reply?:unknown};
 if(typeof body.reply!=='string')throw new Error('A resposta recebida não foi válida.');
 return body.reply;
}
