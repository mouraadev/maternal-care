# Doul.IA

Plataforma de acompanhamento gestacional com inteligência artificial para um hackathon da OpenAI.

Este repositório contém somente o esqueleto da arquitetura. Não há implementação, dependências instaladas ou comandos executáveis de desenvolvimento, build e testes nesta etapa.

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

As pastas vazias possuem `.gitkeep` para serem versionadas. `App.tsx` e `functions/src/index.ts` serão criados quando a implementação começar.

## Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [Firebase e modelo de dados](docs/FIREBASE.md)
- [Responsabilidades de Ryan e Felipe](docs/RESPONSIBILITIES.md)
- [Contratos iniciais de API](docs/API.md)

## Próxima etapa

Inicializar Vite e Functions, instalar as dependências, configurar o projeto Firebase e implementar os contratos documentados. Os arquivos `.env.example` são modelos sem credenciais. Nenhum recurso foi publicado ou provisionado.
