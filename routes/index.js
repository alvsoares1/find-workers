const express = require('express');
const router = express.Router();
const { requireAuth, optionalAuth } = require('../middleware/auth');
const requestService = require('../services/requestService');
const serviceService = require('../services/serviceService');
const { USER_TYPES } = require('../utils/constants');

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
        
        let stats = {
            active: 0,
            completed: 0,
            rating: 0,
            earnings: 0
        };
        
        let recentActivity = [];
        
        if (userType === USER_TYPES.WORKER) {
            // Buscar serviços do trabalhador
            const userServices = await serviceService.findByWorkerId(userId);
            
            // Buscar todas as solicitações para os serviços do trabalhador
            let allRequests = [];
            for (const service of userServices) {
                const serviceRequests = await requestService.findByServiceId(service._id);
                allRequests.push(...serviceRequests);
            }
            
            // Calcular estatísticas
            stats = {
                active: userServices.filter(s => s.status === 'disponível').length,
                completed: allRequests.filter(r => r.status === 'concluida').length,
                rating: 4.5, // Sistema de avaliações será implementado posteriormente
                earnings: allRequests.filter(r => r.status === 'concluida')
                    .reduce((total, r) => total + (r.serviceId.price || 0), 0)
            };
            
            // Atividade recente - solicitações recentes
            recentActivity = allRequests
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5)
                .map(request => ({
                    title: `Solicitação: ${request.serviceId.title}`,
                    description: `Cliente: ${request.clientId.name} - Status: ${request.status}`,
                    time: request.createdAt,
                    link: `/requests/${request._id}`
                }));
            
        } else {
            // Buscar solicitações do cliente
            const userRequests = await requestService.findByClientId(userId);
            
            // Calcular estatísticas
            stats = {
                active: userRequests.filter(r => ['pendente', 'aceita', 'em_andamento'].includes(r.status)).length,
                completed: userRequests.filter(r => r.status === 'concluida').length,
                rating: 4.8, // Sistema de avaliações será implementado posteriormente
                earnings: userRequests.filter(r => r.status === 'concluida')
                    .reduce((total, r) => total + (r.serviceId.price || 0), 0)
            };
            
            // Atividade recente - solicitações recentes
            recentActivity = userRequests
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5)
                .map(request => ({
                    title: `Solicitação: ${request.serviceId.title}`,
                    description: `Status: ${request.status} - ${request.description || 'Sem descrição'}`,
                    time: request.createdAt,
                    link: `/requests/${request._id}`
                }));
        }
        
        res.render('dashboard', { 
            title: 'Dashboard',
            user: req.user.toPublicObject(),
            stats: stats,
            recentActivity: recentActivity,
            userType: userType,
            success: success ? decodeURIComponent(success) : null,
            error: error ? decodeURIComponent(error) : null
        });
        
    } catch (error) {
        Logger.error('Erro ao carregar dashboard:', error);
        res.render('dashboard', { 
            title: 'Dashboard',
            user: req.user.toPublicObject(),
            stats: { active: 0, completed: 0, rating: 0, earnings: 0 },
            recentActivity: [],
            userType: req.user.userType,
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
