import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class {text:string;lang='';rate=1;voice:unknown=null;onend:(()=>void)|null=null;onerror:((event:unknown)=>void)|null=null;constructor(text:string){this.text=text;}}});
    Object.defineProperty(window,'speechSynthesis',{value:{cancel:()=>{},getVoices:()=>[{name:'Microsoft Daniel',lang:'pt-BR'},{name:'Microsoft Maria',lang:'pt-BR'}],speak:(utterance:SpeechSynthesisUtterance)=>{(window as Window & {selectedLiaVoice?:string}).selectedLiaVoice=utterance.voice?.name;setTimeout(()=>utterance.onend?.({} as SpeechSynthesisEvent),50);}}});
    class Recognition {
      lang='';continuous=false;interimResults=false;
      onresult:((event:unknown)=>void)|null=null;onend:(()=>void)|null=null;onerror:((event:unknown)=>void)|null=null;
      start(){setTimeout(()=>{this.onresult?.({results:[[{transcript:'Como organizar minhas dúvidas?'}]]});this.onend?.();},100);}
      abort(){this.onend?.();}
    }
    Object.defineProperty(window,'SpeechRecognition',{value:Recognition});
  });
  await page.goto('/patient/assistant');
});

test('demonstra áudio, perguntas guiadas e encerramento sem uma chave OpenAI',async({page})=>{
  await page.getByRole('button',{name:'Iniciar demonstração com voz'}).click();
  await expect(page.getByText('Esta é uma demonstração guiada, com respostas preparadas e voz gerada pelo navegador.',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'O que perguntar na próxima consulta?',exact:true}).first().click();
  await expect(page.getByText('Você pode levar uma lista com três pontos:',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'Encerrar',exact:true}).click();
  await expect(page.getByRole('button',{name:'Iniciar demonstração com voz'})).toBeVisible();
});

test('transcreve a pergunta do microfone simulado e mostra a resposta no chat',async({page})=>{
  await page.getByRole('button',{name:'Iniciar demonstração com voz'}).click();
  await page.getByRole('button',{name:'Falar uma pergunta',exact:true}).click();
  await expect(page.getByText('Você pode anotar suas dúvidas assim que surgirem',{exact:false})).toBeVisible();
});

test('seleciona voz feminina e não oferece o botão OpenAI',async({page})=>{
  await expect(page.getByRole('button',{name:'Conversar com OpenAI',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Iniciar demonstração com voz'}).click();
  await expect.poll(()=>page.evaluate(()=>(window as Window & {selectedLiaVoice?:string}).selectedLiaVoice)).toBe('Microsoft Maria');
});

test('layout de voz não cria rolagem horizontal no celular',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Iniciar demonstração com voz'}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/lia-voice-mobile.png',fullPage:true});
});
