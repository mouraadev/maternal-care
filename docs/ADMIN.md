# Área administrativa

Acesse `/admin/dashboard` ou use o atalho de administração em `/login`. O formulário de login também direciona perfis Firebase `admin` ativos ao dashboard.

Esta etapa implementa gestão de demonstração, armazenada no `localStorage` deste navegador. Os cadastros não provisionam contas Firebase. A administração e as visualizações dos perfis continuam públicas para explorar o protótipo; controles de acesso reais e regras de servidor permanecem pendentes. Não utilizar dados reais.

## Telas

- `/admin/dashboard`: indicadores, gráfico por status, taxa de conclusão, pendências, carga por médico e progresso dos atendimentos.
- `/admin/patients`: cadastrar, editar e excluir pacientes; editar dados gestacionais e notas; vincular médico e abrir a interface da paciente selecionada.
- `/admin/doctors`: cadastrar, editar e excluir profissionais e abrir sua interface com a fila correspondente.
- `/admin/requests`: criar, editar, excluir e atribuir solicitações, definir prioridade e atualizar status. Busca e filtros por médico/status.
- `/admin/appointments`: gerenciar consultas, datas, horários, responsáveis e status.

## Comportamento

O médico de acompanhamento da paciente é o responsável padrão de novas solicitações. Uma mudança desse vínculo não reatribui registros anteriores: o administrador deve selecionar o responsável de cada atendimento ou consulta na central. Um atendimento pode ser atribuído a outro médico; sua paciente aparece na interface desse responsável para permitir o acompanhamento.

Os status operacionais são `Pendente`, `Em andamento` e `Concluído`, herdados do MVP. As etapas não indicam evolução clínica. O percentual do dashboard é a quantidade de solicitações concluídas dividida pelo total de solicitações. Consultas agendadas são registros separados, gerenciados na agenda.

Excluir uma paciente exige confirmação e remove seus registros fictícios associados. Médicos com vínculos ou registros não podem ser excluídos até que tudo seja reatribuído. O administrador pode abrir as duas interfaces, escolher o cadastro na barra de demonstração, editar notas como médico e enviar solicitações como paciente. Todas essas alterações compartilham o mesmo armazenamento local; não há sincronização entre dispositivos nem auditoria.

Os dados anteriores do protótipo são migrados ao carregar, adicionando equipe e responsáveis sem apagar as solicitações e pacientes existentes. Os IDs de demonstração funcionam também no preview HTTP da rede local.

## Próxima integração

Substituir o store por serviços autorizados, implementar sessão e guardas, revisar a matriz original de permissões para o acesso administrativo solicitado, definir auditoria e alinhar os status com `docs/API.md`. O modo de visualização de outro perfil não deve alterar a identidade autenticada no Firebase. Dados e responsabilidade devem ser validados pelo servidor.

Validação local: `npm test`, `npm run typecheck` e `npm run build`.
