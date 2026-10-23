# Firebase e modelo de dados proposto

Nada foi provisionado. Os nomes e campos abaixo são contratos de arquitetura a implementar.

## Coleções

| Caminho | Campos principais | Finalidade |
| --- | --- | --- |
| `users/{uid}` | `displayName`, `email`, `role`, `active`, `createdAt`, `updatedAt` | Perfil, com `role` em `admin`, `doctor`, `patient` |
| `patients/{patientId}` | `doctorId`, `lastMenstrualPeriod`, `estimatedDueDate`, `createdAt`, `updatedAt` | Gestação e vínculo; `patientId` corresponde ao UID |
| `patients/{patientId}/followUps/{id}` | `doctorId`, `notes`, `occurredAt`, `createdAt`, `updatedAt` | Registro de acompanhamento |
| `appointments/{id}` | `patientId`, `doctorId`, `reason`, `status`, `requestedAt`, `scheduledAt`, `updatedAt` | Solicitações e histórico de atendimento |
| `patients/{patientId}/messages/{id}` | `role`, `content`, `createdAt` | Conversa privada com Lia; `role` em `user`, `assistant` |
| `aiUsage/{uid}` | `windowStart`, `count` | Controle de uso, exclusivo do servidor |

Usar timestamps do Firestore para instantes e datas civis `YYYY-MM-DD` para datas gestacionais, evitando conversões indevidas de fuso. `doctorId` pode ser nulo enquanto a paciente não estiver vinculada. O prazo estimado e a linha do tempo não substituem avaliação profissional.

## Matriz de acesso planejada

| Recurso | Administrador | Médico | Paciente |
| --- | --- | --- | --- |
| Perfis | Gerenciar via Functions | Ler próprio | Ler próprio |
| Cadastro gestacional | Gerenciar vínculo via Functions | Ler e editar dados permitidos de vinculadas | Ler próprio |
| Acompanhamentos | Sem acesso clínico por padrão | Ler e editar das vinculadas | Ler próprios |
| Atendimentos | Ler indicadores e metadados operacionais | Ler e atualizar fila própria via Functions | Ler e solicitar próprios via Functions |
| Conversas Lia | Sem acesso por padrão | Sem acesso por padrão | Ler próprias; enviar via Function |
| Controle de uso | Apenas servidor | Apenas servidor | Apenas servidor |

Negar acesso por padrão. Campos como `role`, `doctorId` e `patientId` são controlados pelo servidor. Validar campos alteráveis, tipos e tamanho, inclusive em atualizações. Médicos não podem se vincular unilateralmente a pacientes. Reavaliar autorizações durante mudanças de vínculo; atendimentos históricos permanecem associados ao médico original.

## Autenticação e provisionamento

Habilitar Email/Password. Criar o primeiro administrador por procedimento administrativo confiável usando Admin SDK; nunca por cadastro público ou UID fixo no código. Os demais usuários são criados por administrador autenticado via Function. Adotar envio de convite/redefinição de senha; não armazenar senhas no Firestore. Planejar compensação se a criação no Auth funcionar e a escrita no Firestore falhar.

O documento de perfil será a fonte de autorização inicial, lida no servidor e nas regras. Alterações de perfil são exclusivas do backend. Desativar um perfil deve bloquear novas operações também nas Functions.

## Consultas e índices previstos

- `patients`: igualdade por `doctorId`.
- `appointments`: `doctorId` + `requestedAt` decrescente.
- `appointments`: `patientId` + `requestedAt` decrescente.
- `appointments`: `doctorId` + `status` + `requestedAt` crescente.
- Mensagens: `createdAt` crescente, com paginação e limite.

As consultas precisam incluir os filtros exigidos pela autorização; regras não filtram resultados. Criar `firestore.indexes.json` junto das consultas efetivamente implementadas.

## Configuração futura

1. Criar um projeto Firebase de desenvolvimento e registrar o app Web.
2. Habilitar Authentication e Firestore; escolher região alinhada às Functions.
3. Inicializar os arquivos `firebase.json`, `.firebaserc`, `firestore.rules` e `firestore.indexes.json`.
4. Configurar emuladores Auth, Firestore e Functions, com um projeto de demonstração isolado.
5. Preencher `.env.local` a partir de `.env.example`.
6. Definir `OPENAI_API_KEY` pelo Secret Manager e vinculá-la somente à Function da Lia; selecionar `OPENAI_MODEL` no backend.
7. Usar `.secret.local` no emulador e contas fictícias para os três perfis.
8. Testar regras, autorização e índices antes de qualquer deploy.

Planejar Functions com Node.js 22, conforme [runtimes documentados pelo Firebase](https://firebase.google.com/docs/functions/manage-functions). Confirmar requisitos de faturamento e permissões ao provisionar. Este esqueleto não habilita acesso a nenhum banco.
