import {createHash} from 'node:crypto';
import {initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore,Timestamp} from 'firebase-admin/firestore';
import {defineSecret,defineString} from 'firebase-functions/params';
import {onRequest} from 'firebase-functions/v2/https';
import {sessionConfig} from './services/liaSession';

initializeApp();
const apiKey=defineSecret('OPENAI_API_KEY');
const model=defineString('OPENAI_REALTIME_MODEL',{default:'gpt-realtime-2.1'});
const origins=defineString('LIA_ALLOWED_ORIGINS',{default:'http://localhost:5173,https://localhost:5173'});

export const createLiaVoiceSession=onRequest({region:'southamerica-east1',secrets:[apiKey],timeoutSeconds:30,maxInstances:2,cors:false},async(req,res)=>{
  res.set('Cache-Control','no-store');
  const origin=req.get('origin');
  const allowed=origins.value().split(',').map(value=>value.trim()).filter(Boolean);
  if(origin&&!allowed.includes(origin)){res.status(403).json({error:'Origem não autorizada.'});return;}
  if(origin){res.set('Access-Control-Allow-Origin',origin);res.set('Vary','Origin');}
  res.set('Access-Control-Allow-Methods','POST, OPTIONS');
  res.set('Access-Control-Allow-Headers','Authorization, Content-Type');
  if(req.method==='OPTIONS'){res.status(204).send('');return;}
  if(req.method!=='POST'){res.set('Allow','POST, OPTIONS');res.status(405).json({error:'Método não permitido.'});return;}
  const bearer=req.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if(!bearer){res.status(401).json({error:'Autenticação necessária.'});return;}
  let uid:string;
  try{uid=(await getAuth().verifyIdToken(bearer,true)).uid;}
  catch{res.status(401).json({error:'Sessão inválida.'});return;}
  try{
    const db=getFirestore();
    const profile=(await db.doc(`users/${uid}`).get()).data();
    if(profile?.active!==true||profile?.role!=='patient'){res.status(403).json({error:'É necessário um perfil de paciente ativo.'});return;}
    // Dez emissões por hora, com intervalo mínimo de 30 segundos. Atualização atômica.
    const permitted=await db.runTransaction(async tx=>{
      const ref=db.doc(`aiUsage/${uid}`);
      const usage=(await tx.get(ref)).data();
      const now=Date.now();
      const start=usage?.voiceWindowStart?.toMillis?.()??0;
      const last=usage?.voiceLastIssuedAt?.toMillis?.()??0;
      const count=now-start<3600000?(usage?.voiceCount??0):0;
      if(now-last<30000||count>=10)return false;
      tx.set(ref,{voiceWindowStart:Timestamp.fromMillis(now-start<3600000?start:now),voiceLastIssuedAt:Timestamp.fromMillis(now),voiceCount:count+1},{merge:true});
      return true;
    });
    if(!permitted){res.status(429).json({error:'Limite de chamadas atingido.'});return;}
    const patient=(await db.doc(`patients/${uid}`).get()).data();
    const upstream=await fetch('https://api.openai.com/v1/realtime/client_secrets',{
      method:'POST',headers:{Authorization:`Bearer ${apiKey.value()}`,'Content-Type':'application/json','OpenAI-Safety-Identifier':createHash('sha256').update(uid).digest('hex')},
      body:JSON.stringify(sessionConfig(model.value(),patient?.week)),signal:AbortSignal.timeout(20000)
    });
    if(!upstream.ok){res.status(502).json({error:'Não foi possível abrir a sessão de voz.'});return;}
    const session=await upstream.json() as {value?:string;expires_at?:number};
    if(!session.value){res.status(502).json({error:'Sessão de voz indisponível.'});return;}
    res.json({value:session.value,expires_at:session.expires_at});
  }catch{res.status(503).json({error:'Serviço de voz temporariamente indisponível.'});}
});
