const express = require('express');
const router = express.Router();
const serviceService = require('../services/serviceService');
const requestService = require('../services/requestService');
const { requireAuth, requireUserType } = require('../middleware/auth');
const Logger = require('../utils/logger');
const { USER_TYPES, SERVICE_STATUS, isValidServiceStatus } = require('../utils/constants');

router.get('/', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { category, search } = req.query;
    
    let services = [];
    
    if (user.userType === USER_TYPES.WORKER) {
      services = await serviceService.findByWorkerId(user._id);
    } else {
      services = await serviceService.findAvailable();
      
      // Aplicar filtros se fornecidos
      if (category) {
        services = services.filter(service => service.category === category);
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        services = services.filter(service => 
          service.title.toLowerCase().includes(searchLower) ||
          service.description.toLowerCase().includes(searchLower)
        );
      }
    }

    const allServices = await serviceService.findAvailable();
    const categories = [...new Set(allServices.map(service => service.category))];

    res.render('services/index', {
      title: user.userType === USER_TYPES.WORKER ? 'Meus Serviços' : 'Serviços Disponíveis',
      user,
      services,
      categories,
      userType: user.userType,
      filters: { category, search }
    });
  } catch (error) {
    Logger.error('Erro ao listar serviços:', error);
    res.status(500).render('error', {
      message: 'Erro ao carregar serviços',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

router.get('/new', requireUserType(USER_TYPES.WORKER), async (req, res) => {
  try {
    res.render('services/form', {
      title: 'Adicionar Serviço',
      user: req.user,
      service: null // Novo serviço
    });
  } catch (error) {
    Logger.error('Erro ao exibir formulário de serviço:', error);
    res.redirect('/services');
  }
});

// Exibir formulário para editar serviço (apenas trabalhadores)
router.get('/:id/edit', requireUserType(USER_TYPES.WORKER), async (req, res) => {
  try {
    const service = await serviceService.findById(req.params.id);
    
    if (!service) {
      return res.status(404).render('404', {
        message: 'Serviço não encontrado'
      });
    }

    // Verificar se o usuário é o dono do serviço
    if (service.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).render('error', {
        message: 'Você não tem permissão para editar este serviço',
        error: {}
      });
    }

    res.render('services/form', {
      title: 'Editar Serviço',
      user: req.user,
      service: service
    });
  } catch (error) {
    Logger.error('Erro ao exibir formulário de edição:', error);
    res.redirect('/services');
  }
});

// GET /services/:id - Visualizar detalhes de um serviço
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const service = await serviceService.findById(req.params.id);
    const user = req.user;
    
    if (!service) {
      return res.status(404).render('404', {
        message: 'Serviço não encontrado'
      });
    }

    // Buscar solicitações relacionadas a este serviço se for o dono
    let serviceRequests = [];
    if (user.userType === USER_TYPES.WORKER && service.workerId.toString() === user._id.toString()) {
      serviceRequests = await requestService.findByServiceId(service._id);
    }

    res.render('services/details', {
      title: service.title,
      user,
      service,
      serviceRequests,
      userType: user.userType
    });
  } catch (error) {
    Logger.error('Erro ao visualizar serviço:', error);
    res.status(500).render('error', {
      message: 'Erro ao carregar detalhes do serviço',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// POST /services/:id/request - Solicitar um serviço (apenas clientes)
router.post('/:id/request', requireUserType(USER_TYPES.CLIENT), async (req, res) => {
  try {
    const serviceId = req.params.id;
    const clientId = req.user._id;
    const { description } = req.body;

    // Verificar se o serviço existe e está disponível
    const service = await serviceService.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Serviço não encontrado'
      });
    }

    if (service.status !== SERVICE_STATUS.AVAILABLE) {
      return res.status(400).json({
        success: false,
        message: 'Serviço não está disponível'
      });
    }

    // Verificar se o cliente já tem uma solicitação pendente para este serviço
    const existingRequests = await requestService.findByClientId(clientId);
    const hasPendingRequest = existingRequests.some(request => 
      request.serviceId._id.toString() === serviceId && 
      ['pendente', 'aceita', 'em_andamento'].includes(request.status)
    );

    if (hasPendingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Você já tem uma solicitação ativa para este serviço'
      });
    }

    // Criar a solicitação
    const requestData = {
      clientId,
      serviceId,
      description: description || '',
      status: 'pendente'
    };

    const newRequest = await requestService.create(requestData);

    Logger.info(`Nova solicitação de serviço: ${serviceId} por cliente ${clientId}`);

    res.json({
      success: true,
      message: 'Solicitação enviada com sucesso!',
      request: newRequest
    });
  } catch (error) {
    Logger.error('Erro ao solicitar serviço:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Criar um serviço (apenas trabalhadores)
router.post('/', requireUserType(USER_TYPES.WORKER), async (req, res) => {
  try {
    const workerId = req.user._id;
    const serviceData = { ...req.body, workerId };
    const newService = await serviceService.create(serviceData);
    
    // Verificar se é uma requisição AJAX/JSON
    const isJsonRequest = req.xhr || 
                         req.headers['content-type'] === 'application/json' ||
                         (req.headers.accept && req.headers.accept.indexOf('application/json') > -1);
    
    if (isJsonRequest) {
      res.status(201).json(newService);
    } else {
      req.session.flash = {
        type: 'success',
        message: 'Serviço criado com sucesso!'
      };
      res.redirect('/services');
    }
  } catch (error) {
    Logger.error('Erro ao criar serviço:', error);
    
    const isJsonRequest = req.xhr || 
                         req.headers['content-type'] === 'application/json' ||
                         (req.headers.accept && req.headers.accept.indexOf('application/json') > -1);
    
    if (isJsonRequest) {
      res.status(500).json({ error: error.message });
    } else {
      req.session.flash = {
        type: 'error',
        message: 'Erro ao criar serviço: ' + error.message
      };
      res.redirect('/services');
    }
  }
});

// Buscar serviços do trabalhador logado
router.get('/api/worker/me', requireAuth, async (req, res) => {
  try {
    const services = await serviceService.findByWorkerId(req.user._id);
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar por categoria
router.get('/api/category', requireAuth, async (req, res) => {
  try {
    const category = req.query.category;
    if (!category) return res.status(400).json({ error: 'Parâmetro category é obrigatório' });

    const services = await serviceService.findByCategory(category);
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar serviços disponíveis
router.get('/available', requireAuth, async (req, res) => {
  try {
    const services = await serviceService.findAvailable();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar um serviço
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const service = await serviceService.findById(req.params.id);
    const isJsonRequest = req.xhr || 
                         req.headers['content-type'] === 'application/json' ||
                         (req.headers.accept && req.headers.accept.indexOf('application/json') > -1);

    if (!service) {
      const error = { error: 'Serviço não encontrado' };
      return isJsonRequest 
        ? res.status(404).json(error)
        : res.redirect('/services');
    }

    if (service.workerId.toString() !== req.user._id.toString()) {
      const error = { error: 'Você não tem permissão para atualizar este serviço' };
      return isJsonRequest 
        ? res.status(403).json(error)
        : res.redirect('/services');
    }

    const updatedService = await serviceService.update(req.params.id, req.body);
    
    if (isJsonRequest) {
      res.json(updatedService);
    } else {
      req.session.flash = {
        type: 'success',
        message: 'Serviço atualizado com sucesso!'
      };
      res.redirect('/services');
    }
  } catch (error) {
    Logger.error('Erro ao atualizar serviço:', error);
    
    const isJsonRequestError = req.xhr || 
                               req.headers['content-type'] === 'application/json' ||
                               (req.headers.accept && req.headers.accept.indexOf('application/json') > -1);
    
    if (isJsonRequestError) {
      res.status(500).json({ error: error.message });
    } else {
      req.session.flash = {
        type: 'error',
        message: 'Erro ao atualizar serviço: ' + error.message
      };
      res.redirect('/services');
    }
  }
});

// Atualizar status
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !isValidServiceStatus(status)) {
      return res.status(400).json({ 
        error: 'Status inválido. Use: disponível, indisponível ou pausado' 
      });
    }

    const service = await serviceService.findById(req.params.id);
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });

    if (service.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Você não tem permissão para atualizar este serviço' });
    }

    const updatedService = await serviceService.updateStatus(req.params.id, status);
    res.json(updatedService);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar um serviço
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const service = await serviceService.findById(req.params.id);
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });

    if (service.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Você não tem permissão para deletar este serviço' });
    }

    await serviceService.delete(req.params.id);
    res.json({ message: 'Serviço deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
