# Matercal care

Plataforma de acompanhamento gestacional com inteligência artificial para um hackathon da OpenAI.

O repositório reúne a arquitetura inicial do Doul.IA e o frontend de demonstração importado de `maternal-care-mvp.zip`. As áreas de médico e paciente são navegáveis com dados fictícios e persistência local. A tela `/login` oferece acesso por Firebase Authentication quando configurado. Backend, regras de autorização e IA ainda dependem de implementação.

## Executar o frontend

Requer Node.js 22.12+ ou 24 e npm.

```bash
npm ci
npm run dev
```

Abrir `http://localhost:5173`. Para validar: `npm test`, `npm run typecheck` e `npm run build`. Para visualizar o build: `npm run preview`. Ainda não há script de lint.

Rotas de demonstração: `/admin/dashboard`, `/admin/patients`, `/admin/doctors`, `/admin/requests`, `/admin/appointments`, `/doctor/dashboard`, `/doctor/patients`, `/doctor/patients/:id`, `/doctor/requests`, `/patient/dashboard`, `/patient/pregnancy`, `/patient/appointments` e `/patient/assistant`. Os atalhos de administração e seleção de cadastros servem somente para demonstração; não autenticam usuários.

## Stack planejada

- Frontend: React, Vite, TypeScript e Tailwind CSS.
- Componentes e gráficos: Lucide React e Recharts.
- Autenticação e dados: Firebase Authentication e Cloud Firestore.
- Backend: Firebase Cloud Functions com TypeScript.
- Assistente Lia: API da OpenAI, acessada exclusivamente pelo backend.
- Versionamento: Git e GitHub.

## Organização

```text
src/
  assets/
  components/{ui,layouts,charts}/
  pages/{auth,admin,doctor,patient}/
  features/{auth,appointments,pregnancy,ai-assistant}/
  services/{firebase,api}/
  hooks/
  contexts/
  routes/
  types/
  utils/
functions/
  src/{controllers,services,middlewares}/
docs/
```

As pastas vazias possuem `.gitkeep` para serem versionadas. O frontend entra por `src/main.tsx` e `src/App.tsx`. O ponto de entrada `functions/src/index.ts` será criado por Felipe ao implementar o backend. O MVP utiliza CSS próprio em `src/styles/global.css`; Tailwind ainda não foi configurado.

## Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [Firebase e modelo de dados](docs/FIREBASE.md)
- [Responsabilidades de Ryan e Felipe](docs/RESPONSIBILITIES.md)
- [Contratos iniciais de API](docs/API.md)
- [Integração do MVP e diferenças em relação aos contratos](docs/INTEGRATION.md)
- [Administração, atribuições e progresso dos atendimentos](docs/ADMIN.md)

## Próxima etapa

O formulário de login está em `src/pages/auth/Login.tsx`, com estilos responsivos próprios. A raiz `/` abre `/login`. O acesso por conta exige Email/Password habilitado no Firebase e documento `users/{uid}` com `active: true` e `role: admin`, `doctor` ou `patient`. Cada perfil é direcionado ao seu dashboard. Perfis ausentes ou inativos não são direcionados aos painéis, e a sessão recém-aberta é encerrada.

Os atalhos de demonstração continuam públicos; esta tela não implementa guardas de rota nem autorização dos dados. Felipe completará sessão persistente, proteção de rotas, regras, provisionamento e Functions. Ryan integrará os adaptadores e as telas ao backend conforme os contratos. Recuperação de senha ainda deve ser solicitada ao administrador; não há cadastro público.

Os arquivos `.env.example` são modelos sem credenciais. Para configurar o cliente Firebase, copiar para `.env.local` e preencher a configuração pública. `VITE_LIA_FUNCTION_URL` pertence ao adaptador HTTP do MVP; ele ainda difere do callable planejado, conforme `docs/INTEGRATION.md`. Nunca colocar chaves OpenAI no frontend. Nenhum recurso foi publicado ou provisionado.

O MVP mantém pacientes, notas e solicitações fictícias no navegador. Consultas, semanas e gráficos usam dados de demonstração; o histórico do chat existe somente na sessão da página. Não usar dados reais até concluir autenticação, regras e integração. A Lia não substitui orientação profissional.
