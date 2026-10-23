# Voz da Lia

Abra `/patient/assistant` e clique em **Iniciar demonstração com voz**. O modo guiado funciona sem chave OpenAI: lê respostas preparadas usando a síntese de voz do navegador, mostra as mensagens no chat e oferece perguntas prontas. Você também pode digitar uma pergunta ou usar **Falar uma pergunta**, quando o navegador oferecer reconhecimento de fala. A demonstração não é uma conversa livre com IA.

O reconhecimento de fala pode utilizar serviços do fabricante do navegador e depender de internet. Não utilizar dados reais na apresentação. A voz em português depende das vozes disponíveis no dispositivo. O chat escrito continua disponível quando a voz não é suportada.

## Microfone na rede local

Em HTTP, o microfone funciona em `localhost`, mas não no endereço IP da rede. Execute `npm run dev:https` e abra a URL HTTPS informada pelo Vite. O certificado de desenvolvimento precisa ser aceito/confiável no dispositivo; para uma apresentação em vários dispositivos, prefira um domínio HTTPS com certificado válido. Sem microfone, as perguntas prontas continuam disponíveis no HTTP atual.

## Voz feminina

A demonstração prioriza vozes femininas conhecidas em português brasileiro, como Microsoft Maria ou Francisca. A lista de vozes pode carregar depois da página; o app aguarda esse carregamento. Se nenhuma voz compatível estiver disponível, avisa no painel e mantém a resposta escrita, sem escolher automaticamente uma voz masculina. A opção de conversar com OpenAI foi retirada da interface.

## Integração OpenAI preparada, sem botão na interface

O código de integração preparado usa WebRTC e uma credencial temporária emitida por `createLiaVoiceSession`, mas o acesso a esse modo foi removido da interface a pedido do usuário. Os passos abaixo documentam a configuração caso seja reativado futuramente. O limite de três minutos da apresentação é aplicado no cliente; não é uma cota de faturamento imposta pelo servidor.

1. Instalar o backend com `npm --prefix functions ci` e compilar com `npm run build:functions`.
2. No projeto Firebase, configurar `OPENAI_API_KEY` no Secret Manager: `firebase functions:secrets:set OPENAI_API_KEY --project gestante-openia`.
3. Configurar `OPENAI_REALTIME_MODEL` e `LIA_ALLOWED_ORIGINS` em `functions/.env`. As origens devem corresponder exatamente às URLs autorizadas do frontend.
4. Publicar apenas a Function: `firebase deploy --only functions:createLiaVoiceSession --project gestante-openia`.
5. Colocar a URL publicada em `VITE_LIA_VOICE_SESSION_URL` de `.env.local` e reiniciar Vite.
6. Entrar com uma conta Firebase cujo documento `users/{uid}` tenha `role: patient` e `active: true`.

A chave principal nunca vai ao frontend. O endpoint verifica o token e o perfil, aplica quota atômica de dez emissões por hora e intervalo mínimo de trinta segundos, usa contexto do servidor e não registra áudio ou transcrições no Firestore. Limites de conta/custos devem ser configurados antes de disponibilização pública. A demo guiada permanece independente desse serviço.

A Function está implementada e compilada, mas não foi publicada nem testada com uma chave OpenAI real nesta entrega. Testes de navegador usam áudio e reconhecimento simulados para verificar os controles; não validam qualidade acústica nem o serviço OpenAI.

Referências: [WebRTC OpenAI](https://developers.openai.com/api/docs/guides/voice-webrtc), [credenciais temporárias](https://developers.openai.com/api/reference/resources/realtime/subresources/client_secrets/methods/create).
