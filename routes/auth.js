const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { 
    loginUser, 
    logoutUser, 
    redirectIfAuthenticated, 
    requireAuth 
} = require('../middleware/auth');
const Validator = require('../utils/validator');
const Logger = require('../utils/logger');

// GET /login - Exibir formulário de login
router.get('/login', redirectIfAuthenticated, (req, res) => {
    const error = req.query.error;
    const success = req.query.success;
    
    res.render('login', {
        title: 'Login - Find Workers',
        error: error ? decodeURIComponent(error) : null,
        success: success ? decodeURIComponent(success) : null
    });
});

// POST /login - Processar login
router.post('/login', redirectIfAuthenticated, async (req, res) => {
    try {
        const { email, password, remember } = req.body;

        // Validação básica
        if (!email || !password) {
            return res.render('login', {
                title: 'Login - Find Workers',
                error: 'Email e senha são obrigatórios',
                success: null
            });
        }

        // Validar formato do email
        if (!Validator.isEmail(email)) {
            return res.render('login', {
                title: 'Login - Find Workers',
                error: 'Formato de email inválido',
                success: null
            });
        }

        // Buscar usuário por email
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            Logger.warn(`Tentativa de login com email inexistente: ${email}`);
            return res.render('login', {
                title: 'Login - Find Workers',
                error: 'Email ou senha incorretos',
                success: null
            });
        }

        // Verificar senha
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            Logger.warn(`Tentativa de login com senha incorreta: ${email}`);
            return res.render('login', {
                title: 'Login - Find Workers',
                error: 'Email ou senha incorretos',
                success: null
            });
        }

        // Fazer login
        await loginUser(req, user);

        // Configurar sessão "lembrar-me"
        if (remember) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
        }

        // Redirecionar para a página solicitada ou dashboard
        const redirectTo = req.query.redirect || '/dashboard';
        Logger.success(`Login realizado com sucesso: ${user.email}`);
        res.redirect(redirectTo);

    } catch (error) {
        Logger.error('Erro no login:', {
            message: error.message,
            stack: error.stack,
            email: req.body.email
        });
        res.render('login', {
            title: 'Login - Find Workers',
            error: 'Erro interno do servidor. Tente novamente.',
            success: null
        });
    }
});



// POST /logout - Fazer logout
router.post('/logout', requireAuth, async (req, res) => {
    try {
        await logoutUser(req);
        res.redirect('/login?success=' + encodeURIComponent('Logout realizado com sucesso'));
    } catch (error) {
        Logger.error('Erro no logout:', error);
        res.redirect('/dashboard?error=' + encodeURIComponent('Erro ao fazer logout'));
    }
});

// GET /logout - Fazer logout via GET (para compatibilidade)
router.get('/logout', requireAuth, async (req, res) => {
    try {
        await logoutUser(req);
        res.redirect('/login?success=' + encodeURIComponent('Logout realizado com sucesso'));
    } catch (error) {
        Logger.error('Erro no logout:', error);
        res.redirect('/dashboard?error=' + encodeURIComponent('Erro ao fazer logout'));
    }
});

// GET /profile - Exibir perfil do usuário
router.get('/profile', requireAuth, (req, res) => {
    const success = req.query.success;
    const error = req.query.error;
    
    res.render('profile', {
        title: 'Meu Perfil - Find Workers',
        user: req.user.toPublicObject(),
        success: success ? decodeURIComponent(success) : null,
        error: error ? decodeURIComponent(error) : null
    });
});

// POST /profile - Atualizar perfil do usuário
router.post('/profile', requireAuth, async (req, res) => {
    try {
        const { name, phone, currentPassword, newPassword, confirmNewPassword } = req.body;
        const user = req.user;

        // Validar dados básicos
        if (!name) {
            return res.redirect('/profile?error=' + encodeURIComponent('Nome é obrigatório'));
        }

        // Preparar dados para atualização
        const updateData = {
            name: Validator.sanitizeString(name),
            phone: phone ? Validator.sanitizeString(phone) : null
        };

        // Verificar se está tentando alterar senha
        if (newPassword) {
            if (!currentPassword) {
                return res.redirect('/profile?error=' + encodeURIComponent('Senha atual é obrigatória'));
            }

            if (newPassword !== confirmNewPassword) {
                return res.redirect('/profile?error=' + encodeURIComponent('As novas senhas não coincidem'));
            }

            if (newPassword.length < 6) {
                return res.redirect('/profile?error=' + encodeURIComponent('A nova senha deve ter pelo menos 6 caracteres'));
            }

            // Verificar senha atual
            const isCurrentPasswordValid = await user.comparePassword(currentPassword);
            if (!isCurrentPasswordValid) {
                return res.redirect('/profile?error=' + encodeURIComponent('Senha atual incorreta'));
            }

            updateData.password = newPassword;
        }

        // Atualizar usuário
        const updatedUser = await User.findByIdAndUpdate(user._id, updateData);
        if (!updatedUser) {
            return res.redirect('/profile?error=' + encodeURIComponent('Erro ao atualizar perfil'));
        }

        Logger.info(`Perfil atualizado: ${user.email}`);
        res.redirect('/profile?success=' + encodeURIComponent('Perfil atualizado com sucesso'));

    } catch (error) {
        Logger.error('Erro ao atualizar perfil:', error);
        res.redirect('/profile?error=' + encodeURIComponent('Erro interno do servidor'));
    }
});

module.exports = router;
