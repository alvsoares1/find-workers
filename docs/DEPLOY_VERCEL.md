# Deploy no Vercel com GitHub Actions

## Pré-requisitos

### 1. Conta no Vercel
- Crie uma conta em [vercel.com](https://vercel.com)
- Conecte sua conta GitHub ao Vercel

### 2. Criar projeto no Vercel
1. No dashboard do Vercel, clique em "New Project"
2. Importe seu repositório GitHub
3. Configure as variáveis de ambiente

### 3. Obter tokens e IDs necessários

#### Vercel Token
1. Vá para [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Crie um novo token
3. Copie o token

#### Project ID e Org ID
1. No seu projeto no Vercel, vá para Settings
2. Copie o **Project ID**
3. Copie o **Team ID** (ou **Org ID**)

### 4. Configurar GitHub Secrets

No seu repositório GitHub:
1. Vá para **Settings** > **Secrets and variables** > **Actions**
2. Adicione os seguintes secrets:

```
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_org_id_here
VERCEL_PROJECT_ID=your_project_id_here
```

### 5. Variáveis de Ambiente no Vercel

Configure as seguintes variáveis no Vercel Dashboard:

```
NODE_ENV=production
SESSION_SECRET=your-super-secret-session-key-for-production
MONGODB_URI=your-mongodb-atlas-connection-string
PORT=3000
```

## Arquivos Necessários

### ✅ `vercel.json` (já criado)
Configuração específica do Vercel para Node.js

### ✅ `.github/workflows/deploy.yml` (já atualizado)
Workflow do GitHub Actions para deploy automático

### ✅ `package.json` (já configurado)
Scripts e dependências já estão corretos

## Fluxo de Deploy

1. **Push para main/master**: Automaticamente dispara o deploy
2. **Pull Request**: Cria preview deployment
3. **Merge**: Deploy para produção

## Comandos Locais

```bash
# Instalar Vercel CLI (opcional)
npm i -g vercel

# Deploy manual (se necessário)
vercel --prod

# Preview deployment
vercel
```

## Diferenças do Docker

❌ **Não precisa de:**
- Dockerfile
- docker-compose.yml para produção
- Configuração de containers

✅ **Vercel cuida automaticamente de:**
- Build do Node.js
- Serverless functions
- CDN global
- HTTPS automático
- Escalabilidade

## Monitoramento

- **Logs**: Disponíveis no dashboard do Vercel
- **Analytics**: Integrado no Vercel
- **Rollback**: Fácil através do dashboard

## Troubleshooting

### Problema comum: MongoDB
- Use MongoDB Atlas (cloud) ao invés de MongoDB local
- Configure a string de conexão nas variáveis de ambiente

### Build fails
- Verifique se todas as dependências estão no `package.json`
- Confirme que `npm ci` funciona localmente

### 500 errors
- Verifique os logs no dashboard do Vercel
- Confirme as variáveis de ambiente
