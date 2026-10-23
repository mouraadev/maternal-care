// A Web Speech API não informa gênero. Priorizar nomes de vozes femininas conhecidas.
export function selectFemaleVoice(voices:SpeechSynthesisVoice[]) {
  const female=/(francisca|maria|helena|luciana|l[uú]cia|vit[oó]ria|fernanda|raquel|joana|catarina|female|feminina)/i;
  const portuguese=voices.filter(voice=>/^pt(?:-|_)/i.test(voice.lang));
  return portuguese.find(voice=>/^pt[-_]br$/i.test(voice.lang)&&female.test(voice.name))
    ?? portuguese.find(voice=>/^pt[-_]br$/i.test(voice.lang)&&/google.*portugu[eê]s/i.test(voice.name))
    ?? portuguese.find(voice=>female.test(voice.name))
    ?? null;
}

export async function loadFemaleVoice(synth:SpeechSynthesis) {
  const selected=selectFemaleVoice(synth.getVoices());
  if(selected)return selected;
  return new Promise<SpeechSynthesisVoice|null>(resolve=>{
    const finish=()=>{clearTimeout(timer);synth.removeEventListener('voiceschanged',changed);resolve(selectFemaleVoice(synth.getVoices()));};
    const changed=()=>{if(selectFemaleVoice(synth.getVoices()))finish();};
    const timer=setTimeout(finish,1500);
    synth.addEventListener('voiceschanged',changed);
    changed();
  });
}
