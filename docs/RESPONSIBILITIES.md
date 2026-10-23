# Responsabilidades

## Ryan — Frontend e APIs

- Interfaces dos três perfis, componentes, layouts, dashboards e gráficos.
- Navegação, sessão e integração com Firebase Authentication.
- Consumo dos serviços Firestore e Cloud Functions pelos adaptadores do frontend.
- Interface do chat Lia, estados de carregamento, erro e acessibilidade.
- Pastas principais: `src/`, incluindo `src/services/api`.

## Felipe — Banco de dados e backend

- Configuração do Firebase, ambientes e emuladores.
- Modelagem das coleções, índices, regras e permissões.
- Cloud Functions, validação dos payloads e lógica de negócio.
- Integração segura com OpenAI, gestão de segredos e limites de uso.
- Provisionamento dos perfis e vínculos entre médicos e pacientes.
- Pastas principais: `functions/` e futuros arquivos Firebase da raiz.

## Acordos para trabalho em paralelo

- Usar `docs/API.md` e `docs/FIREBASE.md` como contratos iniciais; combinar mudanças de campos e endpoints antes de integrar.
- Ryan pode trabalhar com mocks alinhados aos contratos enquanto Felipe implementa o backend.
- Felipe define e publica os contratos; Ryan mantém os adaptadores de consumo.
- Trabalhar em branches curtas, por exemplo `feat/patient-dashboard` e `feat/appointment-functions`, com revisão via pull request.
- Alterações em documentação e contratos são responsabilidade conjunta.
- Não versionar credenciais nem usar dados reais de pacientes durante o hackathon.

## Ordem sugerida

1. Em conjunto: confirmar contratos, estados e convenções de datas.
2. Ryan: inicializar frontend e layouts. Felipe: inicializar Firebase, emuladores e autorização.
3. Ryan: telas com mocks. Felipe: usuários, vínculos e atendimentos.
4. Integrar autenticação, leituras autorizadas, atendimentos e Lia.
5. Validar permissões, fluxos por perfil e tratamento de falhas antes da demonstração.
