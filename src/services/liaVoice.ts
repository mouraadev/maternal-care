import {auth} from './firebase';

export type VoiceCallbacks = {onState:(state:'listening'|'speaking')=>void;onMessage:(role:'user'|'assistant',text:string)=>void;onError:(message:string)=>void};
export type VoiceConnection = {close:()=>void;mute:(muted:boolean)=>void;interrupt:()=>void};
export const liveVoiceConfigured = Boolean(import.meta.env.VITE_LIA_VOICE_SESSION_URL);

export async function connectLiaVoice(callbacks:VoiceCallbacks, signal:AbortSignal):Promise<VoiceConnection> {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('Para usar o microfone, abra este aplicativo em HTTPS ou em localhost.');
  if (!liveVoiceConfigured) throw new Error('Configure a Function de voz antes de iniciar a conversa OpenAI. A demonstração guiada já está disponível.');
  if (!auth?.currentUser) throw new Error('Entre com uma conta Firebase para usar a voz OpenAI.');
  const pc = new RTCPeerConnection();
  const audio = new Audio();
  audio.autoplay = true;
  let stream:MediaStream|undefined;
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    stream?.getTracks().forEach(track=>track.stop());
    pc.close(); audio.pause(); audio.srcObject = null;
    signal.removeEventListener('abort',close);
  };
  signal.addEventListener('abort',close,{once:true});
  const ensureActive = () => { if (signal.aborted || closed) throw new DOMException('Chamada encerrada','AbortError'); };
  try {
    ensureActive();
    stream = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
    if (closed) stream.getTracks().forEach(track=>track.stop());
    ensureActive();
    const token = await auth.currentUser.getIdToken();
    const response = await fetch(import.meta.env.VITE_LIA_VOICE_SESSION_URL,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:'{}',signal});
    if (!response.ok) throw new Error(response.status===429?'Limite de chamadas atingido. Aguarde alguns minutos.':'Não foi possível autorizar a chamada. Verifique sua conta e a configuração do backend.');
    const session = await response.json() as {value?:string};
    if (!session.value) throw new Error('A sessão de voz não foi autorizada.');
    ensureActive();
    pc.ontrack = event => { audio.srcObject = event.streams[0] ?? new MediaStream([event.track]); void audio.play().catch(()=>callbacks.onError('O navegador bloqueou o áudio. Encerre e inicie a chamada novamente.')); };
    pc.onconnectionstatechange = () => { if (!closed && ['failed','disconnected'].includes(pc.connectionState)) { close(); callbacks.onError('A conexão de voz foi interrompida. Inicie uma nova chamada.'); } };
    stream.getTracks().forEach(track=>pc.addTrack(track,stream!));
    const channel = pc.createDataChannel('oai-events');
    channel.onmessage = event => {
      if (closed) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type==='input_audio_buffer.speech_started') callbacks.onState('listening');
        if (data.type==='output_audio_buffer.started') callbacks.onState('speaking');
        if (data.type==='output_audio_buffer.stopped' || data.type==='output_audio_buffer.cleared') callbacks.onState('listening');
        if (data.type==='conversation.item.input_audio_transcription.completed' && data.transcript) callbacks.onMessage('user',data.transcript);
        if (data.type==='response.output_audio_transcript.done' && data.transcript) callbacks.onMessage('assistant',data.transcript);
        if (data.type==='error') { close(); callbacks.onError('A sessão de voz encontrou um erro. Encerre e tente novamente.'); }
      } catch { /* Ignorar eventos que não sejam JSON válido. */ }
    };
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const answer = await fetch('https://api.openai.com/v1/realtime/calls',{method:'POST',headers:{Authorization:`Bearer ${session.value}`,'Content-Type':'application/sdp'},body:offer.sdp,signal});
    if (!answer.ok) throw new Error('Não foi possível conectar a voz OpenAI. Confira o modelo e os créditos da API.');
    ensureActive();
    await pc.setRemoteDescription({type:'answer',sdp:await answer.text()});
    // Só liberar os controles depois que a sessão de eventos estiver pronta.
    await new Promise<void>((resolve,reject)=>{
      if (channel.readyState==='open') { resolve(); return; }
      const timeout = setTimeout(()=>{cleanup();reject(new Error('A conexão demorou demais. Tente novamente.'));},15000);
      const abort = () => {cleanup();reject(new DOMException('Chamada encerrada','AbortError'));};
      const opened = () => {cleanup();resolve();};
      const cleanup = () => {clearTimeout(timeout);signal.removeEventListener('abort',abort);channel.removeEventListener('open',opened);};
      signal.addEventListener('abort',abort,{once:true});channel.addEventListener('open',opened,{once:true});
      if (signal.aborted) abort();
    });
    ensureActive();
    callbacks.onState('listening');
    return {close,mute:(muted)=>stream?.getAudioTracks().forEach(track=>{track.enabled=!muted;}),interrupt:()=>{if(channel.readyState==='open') channel.send(JSON.stringify({type:'output_audio_buffer.clear'}));}};
  } catch (error) { close(); throw error; }
}
