# Firebase compartilhado

A configuração pública do commit `2811be6` foi incorporada. O arquivo local `.env.local` aponta para `gestante-openia`, com `VITE_USE_FIREBASE_EMULATORS=false`. Esse arquivo é ignorado pelo Git. Reinicie Vite ao alterar o ambiente.

Após login, a aplicação lê o perfil `users/{uid}`, carrega as coleções por listeners Firestore e grava alterações via batches. Dados reais não são copiados para o armazenamento local, e dados fictícios não são enviados automaticamente ao banco. Sem login, os atalhos continuam acessando somente a demonstração local.

## Coleções utilizadas

- `users/{uid}`: perfil com `role`, `active`, `displayName`; médicos também possuem `name`, `email`, `specialty` e `registration`.
- `patients/{uid}`: cadastro gestacional utilizado pelas telas, incluindo `name`, `week`, `dueDate`, `doctorId`, `notes` e datas de acompanhamento. `estimatedDueDate` é aceito como alternativa de leitura de `dueDate`.
- `careRequests/{id}`: solicitações, responsáveis, prioridade e status operacional.
- `appointments/{id}`: consultas e agendamentos.
- `aiUsage/{uid}`: quotas da voz, acessadas somente pelo backend.

Esta integração mantém solicitações separadas de agendamentos, conforme os tipos atuais da interface; atualiza a proposta inicial de concentrá-los em `appointments`. Os status são `Pendente`, `Em andamento` e `Concluído`.

O administrador pode gerir os dados clínicos conforme solicitado. A atribuição de atendimentos mantém `careTeamIds` no cadastro da paciente para permitir leitura ao médico responsável. Esse campo é controlado por administradores. Notas/status de médicos são gravados com somente os campos alterados. Toda gravação depende das regras; a interface só confirma sucesso depois da confirmação do Firestore.

## Ativação no projeto compartilhado

1. Habilitar Email/Password no Authentication e criar contas de teste.
2. Provisionar o primeiro administrador manualmente no Firestore: documento `users/{UID_DA_CONTA}` com `displayName`, `role: admin` e `active: true`.
3. Revisar e publicar as regras preparadas: `firebase deploy --only firestore:rules,firestore:indexes --project gestante-openia`.
4. Entrar como administrador. Ao cadastrar médicos e pacientes no aplicativo, informar o UID da conta previamente criada no Authentication.

Cadastrar, editar ou excluir registros no app não cria, altera ou exclui credenciais no Authentication. O primeiro administrador não pode ser criado ou promovido pela interface. Não há migração automática de dados existentes nem seed em produção.

As regras foram testadas no emulador: isolamento de pacientes, notas e status do médico responsável, atribuição administrativa, bloqueio de promoção de perfil e bloqueio de acesso cliente às quotas. Nenhuma regra foi publicada nesta entrega. A conectividade ao endpoint Firestore foi verificada sem autenticação e retornou 403; o acesso autenticado precisa ser validado com as contas de teste, que não foram fornecidas.

## Testes

`npm test`, `npm run build`, `npm run build:functions`, `npm run test:e2e`.

Regras: `npx firebase-tools emulators:exec --project demo-maternal-care --only firestore "npm run test:rules"`. Os testes usam projeto fictício e não alteram o banco compartilhado.
