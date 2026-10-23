# Contrato de integração — Ryan e Felipe

## Merge do MVP

As páginas e os estilos do ZIP foram incorporados ao esqueleto existente, preservando as pastas de autenticação e backend. Não havia tela de login na branch `main` consultada nem no ZIP. O arquivo ZIP original permanece local, ignorado pelo Git; seu conteúdo de aplicação foi incorporado à raiz do projeto. A documentação, as variáveis de ambiente e o `.gitignore` foram combinados com os arquivos existentes.

Na validação do merge, foi removido um import não utilizado no layout, atualizado React Router para a série 7.18 e aplicado override de `@grpc/grpc-js` para a série 1.14.6, corrigindo os alertas da auditoria das dependências. O lockfile registra as versões instaladas. Nenhum contrato de autenticação foi implementado ou alterado.

## Ryan — frontend
- Desenvolve as páginas em `src/pages/doctor` e `src/pages/patient`.
- Mantém os componentes, experiência visual e as chamadas centralizadas nos serviços.
- Substitui o uso do `demoStore` por um repositório Firestore após aprovação do contrato de dados.

## Felipe — Firebase, autenticação e API de IA
- Configura projeto Firebase, Authentication, Firestore e regras de segurança.
- Cria perfis `admin`, `doctor`, `patient` e mecanismo de autorização confiável (claims definidas pelo servidor ou perfis validados por regras; nunca confiar apenas no role do front).
- Garante que um médico só possa ler/editar informações das pacientes associadas à sua conta, que gestantes acessem somente seus próprios dados, e que atribuições sejam exclusivas do admin.
- Fornece endpoints/serviços equivalentes a `listPatientsForDoctor`, `getPatient`, `updatePatientNotes`, `listRequests`, `updateRequestStatus`, `createRequest`, `getPregnancyTimeline`.
- Implementa Cloud Function da Lia validando o Firebase ID token, limites, consentimento e acesso aos dados; a OpenAI API key fica no Secrets Manager/ambiente da função.
- Define tratamento de dados sensíveis, retenção mínima e auditoria antes de qualquer dado real.

## Integração de login
O frontend **não contém formulário de login**. Depois que Felipe implementar autenticação, use um wrapper de rotas com checagem de sessão e perfil no servidor, substitua o botão temporário de troca de papel no layout e direcione para `/doctor/dashboard` ou `/patient/dashboard` conforme o perfil validado.

## Modelo de dados e compatibilidade

O modelo de backend de referência é o de [FIREBASE.md](FIREBASE.md). Não criar coleções paralelas `doctorPatientLinks` ou `careRequests` apenas com base nos nomes do protótipo. O vínculo planejado fica em `patients/{uid}.doctorId`; as solicitações serão representadas por `appointments` no contrato inicial.

O frontend usa tipos de demonstração em `src/types/index.ts`, IDs fictícios, datas civis e estados `Pendente`, `Em andamento`, `Concluído`. Esses estados não equivalem automaticamente às transições de agendamento propostas em [API.md](API.md). Definir o mapeamento ou ajustar a UI durante a integração; não persistir diretamente os objetos do `demoStore` no banco.

## Integração atual da Lia

`src/services/lia.ts` usa HTTP POST para `VITE_LIA_FUNCTION_URL`, com `Authorization: Bearer <Firebase ID token>`, entrada `{ message, week }` e saída `{ reply }`. Esse adaptador ainda não consome o callable `chatWithLia` proposto em [API.md](API.md). Antes de ativar a IA, Felipe e Ryan devem implementar o callable e ajustar o adaptador, ou documentar explicitamente uma Function HTTP equivalente, com verificação do token e CORS restrito. A semana informada pelo navegador não é uma fonte clínica confiável.

As variáveis `VITE_USE_FIREBASE_EMULATORS` e `VITE_FIREBASE_FUNCTIONS_REGION` vieram do esqueleto e ainda não são consumidas pelo MVP. Não presumir que preencher `.env.local` conecta emuladores, banco ou autorização. O SDK inicializa apenas se houver configuração pública Firebase.

Não publicar regras Firestore abertas (`allow read, write: if true`).
