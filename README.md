# Find Workers 🔨

Uma plataforma para conectar clientes e prestadores de serviço.

## 📋 Sobre o Projeto

O Find Workers permite:
- **Clientes**: Buscar e contratar serviços
- **Trabalhadores**: Oferecer serviços e receber solicitações
- **Sistema de autenticação** completo e seguro

## 🚀 Tecnologias

- **Backend**: Node.js + Express.js
- **Banco de Dados**: MongoDB
- **Frontend**: EJS + Bootstrap 5
- **Autenticação**: Sessões HTTP + bcrypt
- **Containerização**: Docker

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- MongoDB
- Git

### Início Rápido

1. **Clone e instale**
```bash
git clone <url-do-repositorio>
cd find-workers
npm install
```

2. **Configure o ambiente**
Crie um arquivo `.env`:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/find-workers
SESSION_SECRET=sua-chave-secreta-forte
```

3. **Inicie a aplicação**
```bash
# Criar usuários de teste
npm run create-user

# Iniciar servidor
npm start
```

4. **Acesse**: `http://localhost:3000`

### Credenciais de Teste
- **Cliente**: `cliente@teste.com` / `123456`
- **Trabalhador**: `trabalhador@teste.com` / `123456`

## 📁 Estrutura

```
find-workers/
├── config/           # Configurações
├── db/               # MongoDB
├── middleware/       # Auth e middlewares
├── models/           # User, Service, Request
├── routes/           # Rotas da API
├── views/            # Templates EJS
├── public/           # CSS, JS, assets
├── utils/            # Helpers
└── docs/             # Documentação
```

## 🔧 Scripts

```bash
npm start           # Inicia aplicação
npm run dev         # Desenvolvimento (nodemon)
```

## 🚀 Deploy

### Render (Recomendado)

**Resumo rápido:**
1. Configure MongoDB Atlas
2. Crie Web Service no Render conectado ao GitHub
3. Configure variáveis de ambiente
4. Deploy automático via GitHub Actions

## 🎯 Funcionalidades

### ✅ Implementado
- [x] Sistema de autenticação completo (login/logout/registro)
- [x] Dashboard personalizado para clientes e trabalhadores
- [x] Sistema de serviços (CRUD completo)
- [x] Sistema de solicitações e matching
- [x] Gerenciamento de perfil e configurações
- [x] Proteção de rotas e autorização
- [x] Interface responsiva com Bootstrap 5
- [x] Sistema de busca e filtros

### 🔄 Planejado para Futuras Versões
- [ ] Sistema de avaliações e reviews
- [ ] Chat/mensagens entre usuários
- [ ] Sistema de pagamentos
- [ ] Notificações push
- [ ] App mobile

## 🚦 Status

- ✅ **Aplicação completa e funcional**
- ✅ Sistema de autenticação e autorização
- ✅ CRUD completo de serviços e solicitações
- ✅ Interface moderna e responsiva
- ✅ Pronto para produção no Render

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: nova feature'`)
4. Push (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença ISC.

---

**Find Workers** - Conectando pessoas que precisam com pessoas que fazem! 🤝
