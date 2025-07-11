const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();
const { connectDB } = require('./db/database');
const Logger = require('./utils/logger');

const app = express();

// Configuração de sessão simples
app.use(session({
    secret: process.env.SESSION_SECRET || 'find-workers-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true apenas em HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Configuração básica do Express
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuração do template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware de logs HTTP
app.use(Logger.http);

// Conectar ao banco de dados
(async () => {
    try {
        await connectDB();
        Logger.success('MongoDB conectado com sucesso!');
    } catch (error) {
        Logger.error('Erro ao conectar MongoDB:', error);
        process.exit(1);
    }
})();

const authRoutes = require('./routes/auth');
const indexRoutes = require('./routes/index');
const servicesRoutes = require('./routes/service');
const requestRoutes = require('./routes/request');
const { addUserToViews } = require('./middleware/auth');

app.use(addUserToViews);

// Configurar rotas
app.use('/', authRoutes);
app.use('/', indexRoutes);
app.use('/services', servicesRoutes);
app.use('/requests', requestRoutes);

// Middleware para 404
app.use((req, res) => {
    Logger.warn(`404 - Página não encontrada: ${req.method} ${req.originalUrl}`);
    res.status(404).render('404', { 
        title: 'Página não encontrada',
        message: 'A página que você está procurando não existe.'
    });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    Logger.error('Erro interno do servidor:', {
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });
    
    res.status(500).render('error', { 
        title: 'Erro interno',
        message: process.env.NODE_ENV === 'development' 
            ? err.message 
            : 'Algo deu errado! Tente novamente mais tarde.'
    });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    Logger.success(`Server is running on http://localhost:${PORT}`);
    Logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGINT', () => {
    Logger.info('Shutting down gracefully...');
    server.close(() => {
        Logger.info('Server closed');
        process.exit(0);
    });
});

process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Unhandled Rejection at:', { promise, reason });
});

process.on('uncaughtException', (error) => {
    Logger.error('Uncaught Exception thrown:', error);
    process.exit(1);
});