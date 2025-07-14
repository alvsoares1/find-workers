const express = require('express');
const router = express.Router();
const User = require('../models/User');
const userService = require('../services/userService');
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


router.post('/logout', requireAuth, async (req, res) => {
    try {
        await logoutUser(req);
        res.redirect('/login?success=' + encodeURIComponent('Logout realizado com sucesso'));
    } catch (error) {
        Logger.error('Erro no logout:', error);
        res.redirect('/dashboard?error=' + encodeURIComponent('Erro ao fazer logout'));
    }
});

router.get('/logout', requireAuth, async (req, res) => {
    try {
        await logoutUser(req);
        res.redirect('/login?success=' + encodeURIComponent('Logout realizado com sucesso'));
    } catch (error) {
        Logger.error('Erro no logout:', error);
        res.redirect('/dashboard?error=' + encodeURIComponent('Erro ao fazer logout'));
    }
});

router.get('/profile', requireAuth, async (req, res) => {
    try {
        const success = req.query.success;
        const error = req.query.error;
        
        // Buscar dados financeiros específicos por tipo de usuário
        let financialStats = null;
        try {
            const transactionService = require('../services/transactionService');
            const { TRANSACTION_TYPES, TRANSACTION_STATUS } = require('../utils/constants');
            const userType = req.user.userType;
            
            if (userType === 'client') {
                // Estatísticas para cliente (apenas pagamentos)
                const allTransactions = await transactionService.getUserTransactions(req.user._id, {
                    type: TRANSACTION_TYPES.PAYMENT,
                    status: TRANSACTION_STATUS.COMPLETED
                });
                
                const totalPaid = allTransactions.reduce((sum, t) => sum + t.amount, 0);
                const currentMonth = new Date().getMonth() + 1;
                const currentYear = new Date().getFullYear();
                
                const monthlyTransactions = allTransactions.filter(t => {
                    const date = new Date(t.transactionDate);
                    return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
                });
                
                const monthlyTotal = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);
                
                // Buscar transações detalhadas
                const detailedTransactions = await transactionService.getUserTransactionsWithDetails(req.user._id, {
                    type: TRANSACTION_TYPES.PAYMENT,
                    status: TRANSACTION_STATUS.COMPLETED,
                    limit: 10
                });
                
                // Calcular valores adicionais
                const avgTransaction = allTransactions.length > 0 ? totalPaid / allTransactions.length : 0;
                
                financialStats = {
                    totalPaid,
                    monthlyTotal,
                    avgTransaction,
                    transactionCount: allTransactions.length,
                    monthlyCount: monthlyTransactions.length,
                    recentTransactions: detailedTransactions
                };
                
            } else if (userType === 'worker') {
                // Estatísticas para worker (apenas recebimentos)
                const allTransactions = await transactionService.getUserTransactions(req.user._id, {
                    type: TRANSACTION_TYPES.RECEIPT,
                    status: TRANSACTION_STATUS.COMPLETED
                });
                
                const totalReceived = allTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                const totalFees = allTransactions.reduce((sum, t) => sum + (t.platformFee || 0), 0);
                const currentMonth = new Date().getMonth() + 1;
                const currentYear = new Date().getFullYear();
                
                const monthlyTransactions = allTransactions.filter(t => {
                    const date = new Date(t.transactionDate);
                    return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
                });
                
                const monthlyTotal = monthlyTransactions.reduce((sum, t) => sum + (t.netAmount || 0), 0);
                const monthlyFees = monthlyTransactions.reduce((sum, t) => sum + (t.platformFee || 0), 0);
                
                // Buscar transações detalhadas
                const detailedTransactions = await transactionService.getUserTransactionsWithDetails(req.user._id, {
                    type: TRANSACTION_TYPES.RECEIPT,
                    status: TRANSACTION_STATUS.COMPLETED,
                    limit: 10
                });
                
                // Calcular valores adicionais
                const netTotal = totalReceived - totalFees;
                const avgTransaction = allTransactions.length > 0 ? totalReceived / allTransactions.length : 0;
                
                financialStats = {
                    totalReceived,
                    totalFees,
                    netTotal,
                    monthlyTotal,
                    monthlyFees,
                    avgTransaction,
                    transactionCount: allTransactions.length,
                    monthlyCount: monthlyTransactions.length,
                    recentTransactions: detailedTransactions
                };
            }
        } catch (financialError) {
            Logger.warn('Erro ao buscar dados financeiros (será ignorado):', financialError.message);
        }
        
        res.render('profile', {
            title: 'Meu Perfil - Find Workers',
            user: req.user.toPublicObject(),
            financialStats,
            success: success ? decodeURIComponent(success) : null,
            error: error ? decodeURIComponent(error) : null
        });
    } catch (error) {
        Logger.error('Erro ao carregar perfil:', error);
        res.render('profile', {
            title: 'Meu Perfil - Find Workers',
            user: req.user.toPublicObject(),
            financialStats: null,
            success: null,
            error: 'Erro ao carregar alguns dados do perfil'
        });
    }
});

router.post('/profile', requireAuth, async (req, res) => {
    try {
        const { name, phone, currentPassword, newPassword, confirmNewPassword } = req.body;
        const user = req.user;

        if (!name) {
            return res.redirect('/profile?error=' + encodeURIComponent('Nome é obrigatório'));
        }

        const updateData = {
            name: Validator.sanitizeString(name),
            phone: phone ? Validator.sanitizeString(phone) : null
        };

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

            const isCurrentPasswordValid = await user.comparePassword(currentPassword);
            if (!isCurrentPasswordValid) {
                return res.redirect('/profile?error=' + encodeURIComponent('Senha atual incorreta'));
            }

            updateData.password = newPassword;
        }

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

router.get('/register', redirectIfAuthenticated, (req, res) => {
    const error = req.query.error;
    const success = req.query.success;
    
    res.render('register', {
        title: 'Cadastro - Find Workers',
        error: error ? decodeURIComponent(error) : null,
        success: success ? decodeURIComponent(success) : null,
        formData: {}
    });
});

router.post('/rate/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { rating } = req.body;

    try {
        const numericRating = parseFloat(rating);
        if (isNaN(numericRating)) {
            return res.status(400).json({ error: 'Nota inválida' });
        }

        const updatedUser = await userService.rateUser(id, numericRating);
        res.redirect('/some-success-page?success=' + encodeURIComponent('Avaliação registrada com sucesso'));
    } catch (error) {
        Logger.error('Erro ao avaliar usuário:', error);
        res.redirect('/some-failure-page?error=' + encodeURIComponent(error.message));
    }
});


router.post('/register', redirectIfAuthenticated, async (req, res) => {
    try {
        const { name, email, phone, userType, password, confirmPassword } = req.body;

        if (!name || !email || !password || !confirmPassword || !userType) {
            return res.render('register', {
                title: 'Cadastro - Find Workers',
                error: 'Todos os campos obrigatórios devem ser preenchidos',
                success: null,
                formData: req.body
            });
        }

        if (password !== confirmPassword) {
            return res.render('register', {
                title: 'Cadastro - Find Workers',
                error: 'As senhas não coincidem',
                success: null,
                formData: req.body
            });
        }

        if (!Validator.isEmail(email)) {
            return res.render('register', {
                title: 'Cadastro - Find Workers',
                error: 'Formato de email inválido',
                success: null,
                formData: req.body
            });
        }

        if (!Validator.isStrongPassword(password)) {
            return res.render('register', {
                title: 'Cadastro - Find Workers',
                error: 'A senha deve ter pelo menos 6 caracteres, incluindo letras e números',
                success: null,
                formData: req.body
            });
        }

        if (!Validator.isValidUserType(userType)) {
            return res.render('register', {
                title: 'Cadastro - Find Workers',
                error: 'Tipo de usuário inválido',
                success: null,
                formData: req.body
            });
        }

        if (phone && !Validator.isPhone(phone)) {
            return res.render('register', {
                title: 'Cadastro - Find Workers',
                error: 'Formato de telefone inválido',
                success: null,
                formData: req.body
            });
        }

        const userData = {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone ? phone.trim() : null,
            userType: userType,
            password: password
        };

        try {
            const user = await userService.create(userData);
            
            await loginUser(req, user);
            
            Logger.success(`Novo usuário registrado: ${user.email} (${user.userType})`);
            
            res.redirect('/dashboard');
            
        } catch (error) {
            if (error.message.includes('Email já está em uso')) {
                return res.render('register', {
                    title: 'Cadastro - Find Workers',
                    error: 'Este email já está cadastrado. Tente fazer login ou use outro email.',
                    success: null,
                    formData: req.body
                });
            }
            throw error;
        }

    } catch (error) {
        Logger.error('Erro no registro:', {
            message: error.message,
            stack: error.stack,
            email: req.body.email,
            userType: req.body.userType
        });
        
        res.render('register', {
            title: 'Cadastro - Find Workers',
            error: 'Erro interno do servidor. Tente novamente.',
            success: null,
            formData: req.body
        });
    }
});

module.exports = router;
