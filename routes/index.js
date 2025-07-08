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

router.get('/dashboard', requireAuth, async (req, res) => {
    try {
        const success = req.query.success;
        const error = req.query.error;
        const userId = req.user._id;
        const userType = req.user.userType;
        
        // Dados mockados para demonstração
        let stats = {
            active: 0,
            completed: 0,
            rating: 0,
            earnings: 0
        };
        
        let recentActivity = [];
        
        if (userType === 'worker') {
            // Mock de dados para trabalhadores
            stats = {
                active: 3,
                completed: 8,
                rating: 4.7,
                earnings: 1850
            };
            
            recentActivity = [
                {
                    title: 'Serviço: Instalação Elétrica',
                    description: 'Status: disponível',
                    time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 dias atrás
                },
                {
                    title: 'Serviço: Pintura Residencial',
                    description: 'Status: disponível',
                    time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 dias atrás
                },
                {
                    title: 'Serviço: Conserto de Encanamento',
                    description: 'Status: pausado',
                    time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 1 semana atrás
                }
            ];
            
        } else {
            // Mock de dados para clientes
            stats = {
                active: 2,
                completed: 5,
                rating: 4.9,
                earnings: 750 // Para clientes representa gastos
            };
            
            recentActivity = [
                {
                    title: 'Solicitação: Limpeza Residencial',
                    description: 'Preciso de faxineira para limpeza completa da casa...',
                    time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 dia atrás
                },
                {
                    title: 'Solicitação: Jardinagem',
                    description: 'Manutenção do jardim com poda das plantas...',
                    time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 dias atrás
                }
            ];
        }
        
        res.render('dashboard', { 
            title: 'Dashboard',
            user: req.user.toPublicObject(),
            stats: stats,
            recentActivity: recentActivity,
            success: success ? decodeURIComponent(success) : null,
            error: error ? decodeURIComponent(error) : null
        });
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        res.render('dashboard', { 
            title: 'Dashboard',
            user: req.user.toPublicObject(),
            stats: { active: 0, completed: 0, rating: 0, earnings: 0 },
            recentActivity: [],
            success: null,
            error: 'Erro ao carregar dados do dashboard'
        });
    }
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
