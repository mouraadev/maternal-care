# Contratos iniciais de API

Proposta para Cloud Functions callable. Nenhum endpoint está implementado. O SDK Firebase envia a sessão; todas as Functions devem verificar usuário ativo e perfil no servidor. IDs e datas retornados ao frontend serão strings; instantes em ISO 8601.

O frontend importado do MVP ainda utiliza dados locais e um cliente HTTP para Lia. Os contratos abaixo representam o backend planejado; as diferenças e o trabalho necessário para integração estão em [INTEGRATION.md](INTEGRATION.md).

| Function prevista | Perfil | Entrada | Saída |
| --- | --- | --- | --- |
| `createUser` | Admin | `displayName`, `email`, `role: doctor ou patient` | `uid` |
| `updateUser` | Admin | `uid`, `displayName?`, `active?` | `uid` |
| `assignPatient` | Admin | `patientId`, `doctorId` ou `null` | `patientId`, `doctorId` |
| `updatePregnancy` | Médico vinculado | `patientId`, `lastMenstrualPeriod?`, `estimatedDueDate?` | `patientId`, `updatedAt` |
| `saveFollowUp` | Médico vinculado | `patientId`, `followUpId?`, `notes`, `occurredAt` | `id` |
| `requestAppointment` | Paciente | `reason` | `id`, `status: pending` |
| `updateAppointmentStatus` | Médico responsável | `appointmentId`, `status`, `scheduledAt?` | `id`, `status` |
| `chatWithLia` | Paciente | `message`, `requestId` | `reply`, `messageId` |

`requestAppointment` obtém `patientId` da sessão e `doctorId` do vínculo persistido. Rejeitar solicitação sem médico vinculado. `createUser` não cria administradores; o primeiro administrador é provisionado fora da API pública. Alteração de email, exclusão e promoção de perfil ficam fora deste contrato inicial.

## Atendimento

Transições previstas: `pending → scheduled | cancelled`; `scheduled → completed | cancelled`. Estados finais não podem ser reabertos. Validar transições em transação para evitar concorrência e exigir `scheduledAt` ao agendar. Pacientes leem o histórico, mas não atualizam status diretamente.

## Chat Lia

Buscar fase gestacional e histórico limitado no servidor; não aceitar instruções privilegiadas, mensagens de sistema ou identidade fornecidas pelo cliente. Limitar mensagem a 2.000 caracteres e definir uma janela de uso por UID. Persistir mensagens somente no caminho da paciente autenticada. Usar `requestId` para evitar duplicação em retentativas e definir tratamento de falhas parciais antes de integrar a UI.

A integração deverá usar `responses.create`, com segredo restrito ao backend, `store: false` e limite de saída. Essa configuração não substitui a definição das políticas de dados do provedor. O modelo será configurável. A UI deve mostrar o caráter educativo da Lia e disponibilizar a solicitação de atendimento.

## Erros

Usar códigos callable padronizados: `unauthenticated`, `permission-denied`, `invalid-argument`, `not-found`, `failed-precondition`, `resource-exhausted`, `unavailable` e `internal`. Mensagens públicas não devem expor chaves, prontuários ou respostas brutas dos provedores. O frontend deve apresentar estados de espera, erro e retentativa sem duplicar operações.

## Leitura de dados

Dashboards, pacientes vinculados, histórico e mensagens serão consultados por serviços Firestore com filtros autorizados e paginação. Indicadores globais do administrador devem usar consultas de agregação ou uma Function específica a definir quando os gráficos forem implementados. Não liberar coleções clínicas inteiras para calcular indicadores no navegador.
