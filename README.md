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
npm run create-user # Criar usuários teste
```

## 🎯 Funcionalidades

### ✅ Implementado
- [x] Sistema de autenticação (login/logout)
- [x] Dashboard para clientes e trabalhadores
- [x] Gerenciamento de perfil
- [x] Proteção de rotas
- [x] Interface responsiva

### 🔄 Em Desenvolvimento
- [ ] Sistema de serviços (CRUD)
- [ ] Solicitações e matching
- [ ] Sistema de busca
- [ ] Mensagens entre usuários

## 🚦 Status

- ✅ Autenticação completa
- ✅ Interface básica funcionando
- 🔄 Funcionalidades de negócio
- ⏳ Testes automatizados

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
