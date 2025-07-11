const express = require('express');
const router = express.Router();
const requestService = require('../services/requestService');
const serviceService = require('../services/serviceService');
const { requireAuth, requireUserType } = require('../middleware/auth');
const Logger = require('../utils/logger');
const { USER_TYPES } = require('../utils/constants');

// Middleware para verificar se usuário está logado
router.use(requireAuth);

// GET /requests - Listar solicitações do usuário
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        let requests = [];

        if (user.userType === USER_TYPES.CLIENT) {
            // Cliente vê suas próprias solicitações
            requests = await requestService.findByClientId(user._id);
        } else if (user.userType === USER_TYPES.WORKER) {
            // Trabalhador vê solicitações para seus serviços
            const userServices = await serviceService.findByWorkerId(user._id);
            for (const service of userServices) {
                const serviceRequests = await requestService.findByServiceId(service._id);
                requests.push(...serviceRequests);
            }
        }

        res.render('requests/index', {
            title: 'Minhas Solicitações',
            user,
            requests,
            userType: user.userType
        });
    } catch (error) {
        Logger.error('Erro ao listar solicitações:', error);
        res.status(500).render('error', {
            message: 'Erro ao carregar solicitações',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// GET /requests/:id - Visualizar detalhes de uma solicitação
router.get('/:id', async (req, res) => {
    try {
        const request = await requestService.findById(req.params.id);
        const user = req.user;

        if (!request) {
            return res.status(404).render('404', {
                message: 'Solicitação não encontrada'
            });
        }

        // Verificar se o usuário tem permissão para ver esta solicitação
        const canView = (
            (user.userType === USER_TYPES.CLIENT && request.clientId._id.toString() === user._id.toString()) ||
            (user.userType === USER_TYPES.WORKER && request.serviceId.workerId && request.serviceId.workerId.toString() === user._id.toString())
        );

        if (!canView) {
            return res.status(403).render('error', {
                message: 'Você não tem permissão para ver esta solicitação'
            });
        }

        res.render('requests/details', {
            title: 'Detalhes da Solicitação',
            user,
            request,
            userType: user.userType
        });
    } catch (error) {
        Logger.error('Erro ao visualizar solicitação:', error);
        res.status(500).render('error', {
            message: 'Erro ao carregar detalhes da solicitação',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// POST /requests - Criar nova solicitação (apenas clientes)
router.post('/', requireUserType(USER_TYPES.CLIENT), async (req, res) => {
    try {
        const { serviceId, description, preferredDate } = req.body;
        const clientId = req.user._id;

        if (!serviceId) {
            return res.status(400).json({
                success: false,
                message: 'ID do serviço é obrigatório'
            });
        }

        // Verificar se o serviço existe
        const service = await serviceService.findById(serviceId);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Serviço não encontrado'
            });
        }

        // Criar a solicitação
        const requestData = {
            clientId,
            serviceId,
            description: description || '',
            preferredDate: preferredDate ? new Date(preferredDate) : null,
            status: 'pendente'
        };

        const newRequest = await requestService.create(requestData);

        Logger.info(`Nova solicitação criada: ${newRequest._id} por cliente ${clientId}`);

        if (req.headers['content-type'] === 'application/json') {
            res.json({
                success: true,
                message: 'Solicitação criada com sucesso',
                request: newRequest
            });
        } else {
            req.session.flash = {
                type: 'success',
                message: 'Solicitação enviada com sucesso!'
            };
            res.redirect('/requests');
        }
    } catch (error) {
        Logger.error('Erro ao criar solicitação:', error);
        
        if (req.headers['content-type'] === 'application/json') {
            res.status(500).json({
                success: false,
                message: error.message
            });
        } else {
            req.session.flash = {
                type: 'error',
                message: 'Erro ao criar solicitação: ' + error.message
            };
            res.redirect('back');
        }
    }
});

// PUT /requests/:id/accept - Aceitar solicitação (apenas trabalhadores)
router.put('/:id/accept', requireUserType(USER_TYPES.WORKER), async (req, res) => {
    try {
        const requestId = req.params.id;
        const workerId = req.user._id;

        const updatedRequest = await requestService.acceptRequest(requestId, workerId);

        Logger.info(`Solicitação ${requestId} aceita por trabalhador ${workerId}`);

        res.json({
            success: true,
            message: 'Solicitação aceita com sucesso',
            request: updatedRequest
        });
    } catch (error) {
        Logger.error('Erro ao aceitar solicitação:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// PUT /requests/:id/reject - Rejeitar solicitação (apenas trabalhadores)
router.put('/:id/reject', requireUserType(USER_TYPES.WORKER), async (req, res) => {
    try {
        const requestId = req.params.id;
        const { reason } = req.body;

        const updatedRequest = await requestService.rejectRequest(requestId, reason);

        Logger.info(`Solicitação ${requestId} rejeitada`);

        res.json({
            success: true,
            message: 'Solicitação rejeitada',
            request: updatedRequest
        });
    } catch (error) {
        Logger.error('Erro ao rejeitar solicitação:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// PUT /requests/:id/start - Iniciar trabalho (apenas trabalhadores)
router.put('/:id/start', requireUserType(USER_TYPES.WORKER), async (req, res) => {
    try {
        const requestId = req.params.id;

        const updatedRequest = await requestService.startRequest(requestId);

        Logger.info(`Trabalho iniciado para solicitação ${requestId}`);

        res.json({
            success: true,
            message: 'Trabalho iniciado',
            request: updatedRequest
        });
    } catch (error) {
        Logger.error('Erro ao iniciar trabalho:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// PUT /requests/:id/complete - Concluir trabalho (apenas trabalhadores)
router.put('/:id/complete', requireUserType(USER_TYPES.WORKER), async (req, res) => {
    try {
        const requestId = req.params.id;

        const updatedRequest = await requestService.completeRequest(requestId);

        Logger.info(`Trabalho concluído para solicitação ${requestId}`);

        res.json({
            success: true,
            message: 'Trabalho concluído com sucesso',
            request: updatedRequest
        });
    } catch (error) {
        Logger.error('Erro ao concluir trabalho:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// PUT /requests/:id/status - Atualizar status (flexível)
router.put('/:id/status', async (req, res) => {
    try {
        const requestId = req.params.id;
        const { status } = req.body;
        const user = req.user;

        // Validar status
        const validStatuses = ['pendente', 'aceita', 'rejeitada', 'em_andamento', 'concluida', 'cancelada'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status inválido'
            });
        }

        // Verificar permissões baseadas no tipo de usuário
        const request = await requestService.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Solicitação não encontrada'
            });
        }

        // Cliente só pode cancelar suas próprias solicitações
        if (user.userType === USER_TYPES.CLIENT) {
            if (request.clientId._id.toString() !== user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Você não tem permissão para modificar esta solicitação'
                });
            }
            if (status !== 'cancelada') {
                return res.status(403).json({
                    success: false,
                    message: 'Clientes só podem cancelar solicitações'
                });
            }
        }

        // Worker só pode modificar solicitações dos seus próprios serviços
        if (user.userType === USER_TYPES.WORKER) {
            // Buscar o serviço para verificar se pertence ao worker
            const service = await serviceService.findById(request.serviceId._id || request.serviceId);
            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: 'Serviço não encontrado'
                });
            }
            
            if (service.workerId.toString() !== user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Você não tem permissão para modificar esta solicitação'
                });
            }
        }

        const updatedRequest = await requestService.updateStatus(requestId, status);

        Logger.info(`Status da solicitação ${requestId} atualizado para ${status}`);

        res.json({
            success: true,
            message: 'Status atualizado com sucesso',
            request: updatedRequest
        });
    } catch (error) {
        Logger.error('Erro ao atualizar status:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// DELETE /requests/:id - Deletar solicitação (apenas o cliente que criou)
router.delete('/:id', async (req, res) => {
    try {
        const requestId = req.params.id;
        const user = req.user;

        const request = await requestService.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Solicitação não encontrada'
            });
        }

        // Verificar se é o cliente que criou a solicitação
        if (user.userType !== USER_TYPES.CLIENT || request.clientId._id.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Você não tem permissão para deletar esta solicitação'
            });
        }

        // Não permitir deletar solicitações em andamento
        if (request.status === 'em_andamento') {
            return res.status(400).json({
                success: false,
                message: 'Não é possível deletar solicitação em andamento'
            });
        }

        await requestService.delete(requestId);

        Logger.info(`Solicitação ${requestId} deletada pelo cliente ${user._id}`);

        res.json({
            success: true,
            message: 'Solicitação deletada com sucesso'
        });
    } catch (error) {
        Logger.error('Erro ao deletar solicitação:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
