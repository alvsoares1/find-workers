const User = require('../models/User');
const Logger = require('../utils/logger');

/**
 * Middleware para verificar se o usuário está autenticado
 */
const requireAuth = async (req, res, next) => {
    try {
        // Verificar se existe sessão ativa
        if (!req.session || !req.session.userId) {
            Logger.warn(`Tentativa de acesso não autorizado: ${req.method} ${req.originalUrl} - Sem sessão`);
            return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
        }

        // Buscar o usuário no banco de dados
        const user = await User.findById(req.session.userId);
        if (!user) {
            Logger.warn(`Usuário não encontrado na sessão: ${req.session.userId}`);
            req.session.destroy((err) => {
                if (err) Logger.error('Erro ao destruir sessão:', err);
            });
            return res.redirect('/login?error=' + encodeURIComponent('Sessão inválida'));
        }

        // Adicionar o usuário ao objeto request
        req.user = user;
        next();
    } catch (error) {
        Logger.error('Erro no middleware de autenticação:', error);
        return res.status(500).render('error', {
            title: 'Erro interno',
            message: 'Erro na verificação de autenticação'
        });
    }
};

/**
 * Middleware para adicionar usuário às views (se autenticado)
 */
const addUserToViews = async (req, res, next) => {
    try {
        if (req.session && req.session.userId) {
            const user = await User.findById(req.session.userId);
            if (user) {
                req.user = user;
                res.locals.user = user.toPublicObject();
                res.locals.isAuthenticated = true;
            }
        }
        
        if (!res.locals.user) {
            res.locals.user = null;
            res.locals.isAuthenticated = false;
        }
        
        next();
    } catch (error) {
        Logger.error('Erro ao adicionar usuário às views:', error);
        res.locals.user = null;
        res.locals.isAuthenticated = false;
        next();
    }
};

/**
 * Middleware para permitir acesso opcional (com ou sem autenticação)
 */
const optionalAuth = async (req, res, next) => {
    try {
        if (req.session && req.session.userId) {
            const user = await User.findById(req.session.userId);
            if (user) {
                req.user = user;
            }
        }
        next();
    } catch (error) {
        Logger.error('Erro no middleware de autenticação opcional:', error);
        next(); // Continua mesmo com erro, pois é opcional
    }
};

/**
 * Middleware para redirecionar usuários já autenticados
 */
const redirectIfAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        const redirectTo = req.query.redirect || '/dashboard';
        return res.redirect(redirectTo);
    }
    next();
};

/**
 * Middleware para verificar tipo de usuário
 */
const requireUserType = (allowedTypes) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.redirect('/login');
        }

        if (!allowedTypes.includes(req.user.userType)) {
            Logger.warn(`Acesso negado - tipo de usuário: ${req.user.userType}, rota: ${req.originalUrl}`);
            return res.status(403).render('error', {
                title: 'Acesso negado',
                message: 'Você não tem permissão para acessar esta página.'
            });
        }

        next();
    };
};

/**
 * Função para fazer login do usuário
 */
const loginUser = (req, user) => {
    return new Promise((resolve, reject) => {
        req.session.userId = user._id.toString();
        req.session.userType = user.userType;
        req.session.loginTime = new Date();
        
        // Forçar salvamento da sessão
        req.session.save((err) => {
            if (err) {
                Logger.error('Erro ao salvar sessão:', err);
                reject(err);
            } else {
                Logger.info(`Usuário logado: ${user.email} (${user.userType})`);
                resolve();
            }
        });
    });
};

/**
 * Função para fazer logout do usuário
 */
const logoutUser = (req) => {
    return new Promise((resolve, reject) => {
        if (req.session) {
            const userEmail = req.user ? req.user.email : 'unknown';
            Logger.info(`Usuário deslogado: ${userEmail}`);
            
            req.session.destroy((err) => {
                if (err) {
                    Logger.error('Erro ao destruir sessão:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
};

module.exports = {
    requireAuth,
    addUserToViews,
    optionalAuth,
    redirectIfAuthenticated,
    requireUserType,
    loginUser,
    logoutUser
};
