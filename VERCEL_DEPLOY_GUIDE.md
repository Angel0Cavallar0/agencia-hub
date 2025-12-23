# 🚀 Guia de Deploy - Vercel (Monorepo)

## ⚠️ IMPORTANTE: Configuração do Vercel

Para fazer deploy do **apps/admin** em um monorepo, siga EXATAMENTE estas configurações:

### 1️⃣ Importar o Projeto no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"Add New Project"**
3. Selecione o repositório **agencia-hub**

### 2️⃣ Configurações do Projeto (CRÍTICO!)

Na tela de configuração do projeto, configure:

#### **Framework Preset**
- Selecione: `Vite`

#### **Root Directory**
- ⚠️ **IMPORTANTE**: Clique em "Edit" e defina: `apps/admin`
- Isso faz o Vercel olhar para a pasta correta do monorepo

#### **Build & Development Settings**

```
Build Command:
npm run build

Output Directory:
dist

Install Command:
npm install
```

#### **Environment Variables**

Adicione as seguintes variáveis:

```
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

### 3️⃣ Deploy

Clique em **"Deploy"** e aguarde!

---

## 🔧 Se já fez deploy e está com página em branco:

### Opção A: Reconfigurar no Vercel Dashboard

1. Acesse o projeto no Vercel
2. Vá em **Settings** → **General**
3. Na seção **Root Directory**:
   - Clique em **Edit**
   - Digite: `apps/admin`
   - Clique em **Save**
4. Vá em **Deployments**
5. Clique nos 3 pontinhos do último deployment
6. Clique em **"Redeploy"**

### Opção B: Usar Vercel CLI

```bash
# Entrar na pasta do admin
cd apps/admin

# Fazer deploy
vercel --prod

# Seguir as instruções e confirmar as configurações
```

---

## 📋 Checklist de Troubleshooting

- [ ] Root Directory está configurado como `apps/admin`
- [ ] Build Command é `npm run build`
- [ ] Output Directory é `dist`
- [ ] Variáveis de ambiente estão configuradas
- [ ] Fez redeploy após mudar as configurações

---

## 🎯 Deploy do Client (Futuro)

Quando for fazer deploy do **apps/client**, crie um NOVO projeto no Vercel com:

- **Root Directory**: `apps/client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

---

## ❓ Ainda com problemas?

1. Verifique os **Build Logs** no Vercel
2. Procure por erros de build
3. Verifique se as variáveis de ambiente estão corretas

**Logs importantes:**
- Build Command Output
- Install Command Output
- Runtime Logs
