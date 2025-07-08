const express = require('express');
const router = express.Router();
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Home - acesso livre
router.get('/', optionalAuth, (req, res) => {
    const success = req.query.success;
    const error = req.query.error;
    
    res.render('index', { 
        title: 'Find Workers - Conectando pessoas e serviços',
        message: 'Bem-vindo ao Find Workers!',
        success: success ? decodeURIComponent(success) : null,
        error: error ? decodeURIComponent(error) : null
    });
});

// Dashboard - requer autenticação
router.get('/dashboard', requireAuth, (req, res) => {
    const success = req.query.success;
    const error = req.query.error;
    
    res.render('dashboard', { 
        title: 'Dashboard',
        user: req.user.toPublicObject(),
        success: success ? decodeURIComponent(success) : null,
        error: error ? decodeURIComponent(error) : null
    });
});

// Settings - requer autenticação
router.get('/settings', requireAuth, (req, res) => {
    const success = req.query.success;
    const error = req.query.error;
    
    res.render('settings', { 
        title: 'Configurações',
        user: req.user.toPublicObject(),
        success: success ? decodeURIComponent(success) : null,
        error: error ? decodeURIComponent(error) : null
    });
});

module.exports = router;
