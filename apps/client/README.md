# Agência Hub - Client App

Aplicação client do Agência Hub com autenticação e dashboard.

## 🚀 Funcionalidades

- ✅ Tela de login com autenticação Supabase
- ✅ Dashboard com menu lateral colapsável
- ✅ Proteção de rotas
- ✅ Sistema de notificações (toast)
- ✅ Interface responsiva com TailwindCSS

## 📋 Pré-requisitos

- Node.js >= 18
- npm ou yarn
- Conta no Supabase

## 🔧 Configuração Local

1. **Clone o repositório** (se ainda não fez):
```bash
git clone [url-do-repositorio]
cd agencia-hub/apps/client
```

2. **Instale as dependências**:
```bash
npm install
```

3. **Configure as variáveis de ambiente**:
```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica
```

4. **Rode o servidor de desenvolvimento**:
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 🌐 Deploy no Vercel

### Opção 1: Via Painel do Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Importe o repositório
3. Configure o projeto:
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/client` ⚠️ **IMPORTANTE**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. Adicione as Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

5. Faça o deploy

### Opção 2: Via CLI do Vercel

```bash
cd apps/client
vercel --prod
```

## 🔐 Obtendo Credenciais do Supabase

1. Acesse o [painel do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Project Settings → API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## 📁 Estrutura do Projeto

```
apps/client/
├── src/
│   ├── components/
│   │   ├── ui/              # Componentes UI reutilizáveis
│   │   ├── Layout.tsx       # Layout principal
│   │   ├── Sidebar.tsx      # Menu lateral
│   │   ├── ProtectedRoute.tsx
│   │   └── EnvWarning.tsx   # Aviso de env vars
│   ├── contexts/
│   │   └── AuthContext.tsx  # Contexto de autenticação
│   ├── integrations/
│   │   └── supabase/
│   │       └── client.ts    # Cliente Supabase
│   ├── pages/
│   │   ├── Login.tsx        # Página de login
│   │   └── Dashboard.tsx    # Dashboard principal
│   ├── lib/
│   │   └── utils.ts         # Funções utilitárias
│   ├── App.tsx              # App principal
│   ├── main.tsx             # Entry point
│   └── index.css            # Estilos globais
├── public/
├── index.html
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── .env.example
```

## 🛠️ Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Verifica problemas no código

## 🐛 Troubleshooting

### Tela branca ao acessar

- Verifique se as variáveis de ambiente estão configuradas
- A aplicação mostrará um aviso se as env vars não estiverem configuradas

### Erro de autenticação

- Verifique se as credenciais do Supabase estão corretas
- Certifique-se de que o projeto Supabase está ativo

### Build falha no Vercel

- Verifique se o **Root Directory** está configurado como `apps/client`
- Verifique se as variáveis de ambiente estão adicionadas no Vercel

## 📝 Licença

Privado - Agência Hub
