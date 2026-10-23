import {useEffect,useRef,useState} from 'react';
import {Headphones,Heart,Mic,MicOff,Phone,PhoneOff,Volume2,VolumeX} from 'lucide-react';
import {connectLiaVoice,liveVoiceConfigured,type VoiceConnection} from '../../services/liaVoice';
import {demoReply,voiceSuggestions} from './voiceDemo';
import './voice.css';
import {loadFemaleVoice} from './femaleVoice';

type Recognition = {lang:string;continuous:boolean;interimResults:boolean;onresult:((e:{results:{[index:number]:{[index:number]:{transcript:string}}}})=>void)|null;onerror:((e:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;abort:()=>void};
type SpeechWindow = Window & {SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
type Status = 'idle'|'connecting'|'listening'|'speaking';
const labels = {idle:'Um espaço para conversar, com calma.',connecting:'Conectando sua chamada…',listening:'Pode falar. Estou ouvindo.',speaking:'Lia está respondendo…'};

export default function VoicePanel({week,onMessage}:{week:number;onMessage:(role:'user'|'assistant',text:string)=>void}) {
  const [mode] = useState<'demo'|'live'>('demo');
  const [status,setStatus] = useState<Status>('idle');
  const [muted,setMuted] = useState(false);
  const [error,setError] = useState('');
  const [seconds,setSeconds] = useState(0);
  const [draft,setDraft] = useState('');
  const [recognizing,setRecognizing] = useState(false);
  const [sound,setSound] = useState(true);
  const active = useRef(false);
  const connection = useRef<VoiceConnection|null>(null);
  const controller = useRef<AbortController|null>(null);
  const recognition = useRef<Recognition|null>(null);
  const run = useRef(0);
  const messageHandler = useRef(onMessage);
  messageHandler.current = onMessage;
  const synthAvailable = typeof window!=='undefined' && 'speechSynthesis' in window;

  function cleanup() {
    active.current = false;run.current++;
    controller.current?.abort();controller.current=null;
    connection.current?.close();connection.current=null;
    if(recognition.current){recognition.current.onend=null;recognition.current.abort();recognition.current=null;}
    if(synthAvailable) window.speechSynthesis.cancel();
  }
  function stop() {cleanup();setStatus('idle');setRecognizing(false);setMuted(false);}
  useEffect(()=>()=>cleanup(),[]);
  useEffect(()=>{
    if(status==='idle') return;
    const timer = setInterval(()=>setSeconds(value=>value+1),1000);
    return ()=>clearInterval(timer);
  },[status==='idle']);
  useEffect(()=>{if(seconds>=180&&active.current){stop();setError('Demonstração encerrada após 3 minutos. Você pode iniciar outra conversa.');}},[seconds]);

  async function speak(text:string) {
    recognition.current?.abort();setRecognizing(false);
    if(!sound||!synthAvailable){setStatus('listening');return;}
    window.speechSynthesis.cancel();
    const requestedRun=run.current;
    setStatus('speaking');
    const voice=await loadFemaleVoice(window.speechSynthesis);
    if(!active.current||run.current!==requestedRun)return;
    if(!voice){setStatus('listening');setError('Não foi encontrada uma voz feminina em português neste dispositivo. Ative uma voz como Microsoft Maria ou Francisca nas configurações de fala; as respostas continuam no chat.');return;}
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang=voice.lang;utterance.rate=.95;utterance.voice=voice;
    const currentRun = run.current;
    utterance.onend=()=>{if(active.current&&run.current===currentRun)setStatus('listening');};
    utterance.onerror=event=>{if(active.current&&run.current===currentRun&&event.error!=='canceled'&&event.error!=='interrupted'){setStatus('listening');setError('A voz do navegador não está disponível. A resposta continua no chat.');}};
    setStatus('speaking');window.speechSynthesis.speak(utterance);
  }
  function answer(text:string) {
    if(!active.current||mode!=='demo'||!text.trim()) return;
    setDraft('');setError('');
    messageHandler.current('user',text.trim());
    const reply=demoReply(text,week);
    messageHandler.current('assistant',reply);speak(reply);
  }
  async function start() {
    if(active.current) return;
    setError('');setSeconds(0);setMuted(false);active.current=true;
    if(mode==='demo') {
      const welcome='Olá! Eu sou a Lia. Esta é uma demonstração guiada, com respostas preparadas e voz gerada pelo navegador. Você pode escolher uma pergunta ou usar o botão de microfone para falar. Vamos organizar suas dúvidas para a próxima consulta?';
      messageHandler.current('assistant',welcome);speak(welcome);return;
    }
    setStatus('connecting');controller.current=new AbortController();
    const currentRun=run.current;
    try {
      const live=await connectLiaVoice({
        onState:state=>{if(active.current&&run.current===currentRun)setStatus(state);},
        onMessage:(role,text)=>{if(active.current&&run.current===currentRun)messageHandler.current(role,text);},
        onError:message=>{if(active.current&&run.current===currentRun){stop();setError(message);}}
      },controller.current.signal);
      if(!active.current||run.current!==currentRun) live.close();else connection.current=live;
    } catch(cause) {if(active.current&&run.current===currentRun){stop();setError(cause instanceof Error?cause.message:'Não foi possível iniciar a chamada.');}}
  }
  function listen() {
    if(recognizing){recognition.current?.abort();setRecognizing(false);return;}
    if(!window.isSecureContext){setError('O microfone precisa de HTTPS ou localhost. Neste endereço HTTP, use as perguntas prontas ou digite para ouvir a Lia.');return;}
    const RecognitionClass=(window as SpeechWindow).SpeechRecognition??(window as SpeechWindow).webkitSpeechRecognition;
    if(!RecognitionClass){setError('Este navegador não oferece reconhecimento de voz. Digite ou use uma pergunta pronta; a Lia pode continuar respondendo em áudio.');return;}
    if(synthAvailable) window.speechSynthesis.cancel();
    recognition.current?.abort();
    const recognizer=new RecognitionClass();recognition.current=recognizer;
    recognizer.lang='pt-BR';recognizer.continuous=false;recognizer.interimResults=false;
    recognizer.onresult=event=>{if(active.current)answer(event.results[0][0].transcript);};
    recognizer.onend=()=>{if(active.current)setRecognizing(false);};
    recognizer.onerror=event=>{if(active.current&&event.error!=='aborted'){setRecognizing(false);setError(event.error==='not-allowed'?'Permita o uso do microfone no navegador para falar.':'Não consegui ouvir sua fala. Tente novamente ou digite sua pergunta.');}};
    try{recognizer.start();setRecognizing(true);setStatus('listening');setError('');}catch{setError('O microfone está ocupado. Aguarde e tente novamente.');}
  }
  function toggleMute() {connection.current?.mute(!muted);setMuted(!muted);}
  return <section className={`lia-voice ${status!=='idle'?'voice-active':''}`} aria-label="Conversa por voz com Lia">
    <div className="voice-top"><span><Headphones size={17}/> LIA POR VOZ</span><span className="voice-mode-badge">{mode==='demo'?'Demonstração guiada':'OpenAI ao vivo'}</span></div>
    <div className={`voice-orb ${status}`} aria-hidden="true"><span/><Heart size={36}/><span/></div>
    <h2>Um cuidado que você pode ouvir.</h2><p className="voice-status" role="status">{recognizing?'Ouvindo sua pergunta…':muted?'Microfone silenciado.':mode==='demo'&&status==='listening'?'Escolha uma pergunta ou ative o microfone.':labels[status]}</p>
    <p className="voice-description">{mode==='demo'?'Respostas preparadas, lidas com a voz do navegador. Experimente sem uma chave de API.':'Conversa livre por voz com a Lia, conectada à OpenAI. Requer conta autenticada e backend configurado.'}</p>
    {status!=='idle'&&<div className="voice-timer">{Math.floor(seconds/60).toString().padStart(2,'0')}:{(seconds%60).toString().padStart(2,'0')} <span>· sessão de até 3 min</span></div>}
    <div className="voice-controls">
      {status==='idle'?<button className="primary-btn" onClick={()=>void start()} disabled={mode==='live'&&!liveVoiceConfigured}><Phone size={17}/>{mode==='demo'?'Iniciar demonstração com voz':'Iniciar conversa ao vivo'}</button>:<>
        {mode==='live'?<button className="voice-control" onClick={toggleMute} disabled={status==='connecting'} aria-pressed={muted}>{muted?<MicOff size={19}/>:<Mic size={19}/>} {muted?'Ativar microfone':'Silenciar'}</button>:<button className="voice-control" onClick={listen} aria-pressed={recognizing}>{recognizing?<MicOff size={19}/>:<Mic size={19}/>} {recognizing?'Parar microfone':'Falar uma pergunta'}</button>}
        <button className="voice-end" onClick={stop}><PhoneOff size={18}/> Encerrar</button>
      </>}
      {mode==='demo'&&<button className="voice-control" aria-pressed={sound} onClick={()=>{setSound(!sound);if(synthAvailable)window.speechSynthesis.cancel();if(status==='speaking')setStatus('listening');}}>{sound?<Volume2 size={17}/>:<VolumeX size={17}/>} {sound?'Voz ligada':'Voz desligada'}</button>}
      {mode==='live'&&status==='speaking'&&<button className="voice-control" onClick={()=>connection.current?.interrupt()}>Interromper resposta</button>}
    </div>
    {mode==='demo'&&status!=='idle'&&<div className="voice-demo-questions"><span>Escolha uma pergunta para apresentar</span><div>{voiceSuggestions.map(question=><button key={question} onClick={()=>answer(question)}>{question}</button>)}</div><form onSubmit={event=>{event.preventDefault();answer(draft);}}><input aria-label="Pergunta para a demonstração de voz" maxLength={1500} value={draft} onChange={event=>setDraft(event.target.value)} placeholder="Ou digite uma pergunta para a demonstração…"/><button type="submit" disabled={!draft.trim()}>Ouvir resposta</button></form></div>}
    {mode==='live'&&!liveVoiceConfigured&&<p className="voice-setup">A conexão OpenAI ainda não foi configurada. Use a demonstração guiada para a apresentação.</p>}
    {error&&<p className="voice-error" role="alert">{error}</p>}
    <small className="voice-disclaimer">Você está ouvindo uma voz artificial. A Lia oferece apoio educativo e não faz diagnósticos ou prescrições. As transcrições aparecem no chat desta página.</small>
  </section>;
}
