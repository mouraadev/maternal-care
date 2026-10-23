# Matercal care

Plataforma de acompanhamento gestacional com inteligência artificial para um hackathon da OpenAI.

O repositório reúne a arquitetura inicial do Doul.IA e o frontend de demonstração importado de `maternal-care-mvp.zip`. As áreas de médico e paciente são navegáveis com dados fictícios e persistência local. O login permanece reservado ao Felipe; não há backend, autorização real ou IA conectada nesta versão.

## Executar o frontend

Requer Node.js 22.12+ ou 24 e npm.

```bash
npm ci
npm run dev
```

Abrir `http://localhost:5173`. Para validar: `npm run typecheck` e `npm run build`. Para visualizar o build: `npm run preview`. Ainda não há suíte de testes automatizados ou script de lint.

Rotas de demonstração: `/doctor/dashboard`, `/doctor/patients`, `/doctor/patients/:id`, `/doctor/requests`, `/patient/dashboard`, `/patient/pregnancy`, `/patient/appointments` e `/patient/assistant`. O botão de troca de perfil serve somente para demonstração; não autentica usuários. A área administrativa ainda não foi implementada.

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

## Próxima etapa

Felipe implementará login, sessão, autorização, Firebase e Functions. Ryan integrará os adaptadores e as telas ao backend conforme os contratos. Nenhuma tela de login foi adicionada ou alterada neste merge.

Os arquivos `.env.example` são modelos sem credenciais. Para configurar o cliente Firebase, copiar para `.env.local` e preencher a configuração pública. `VITE_LIA_FUNCTION_URL` pertence ao adaptador HTTP do MVP; ele ainda difere do callable planejado, conforme `docs/INTEGRATION.md`. Nunca colocar chaves OpenAI no frontend. Nenhum recurso foi publicado ou provisionado.

O MVP mantém pacientes, notas e solicitações fictícias no navegador. Consultas, semanas e gráficos usam dados de demonstração; o histórico do chat existe somente na sessão da página. Não usar dados reais até concluir autenticação, regras e integração. A Lia não substitui orientação profissional.
