const express = require('express');
const router = express.Router();
const serviceService = require('../services/serviceService');
const { requireAuth } = require('../middleware/auth');

// Criar um serviço
router.post('/', requireAuth, async (req, res) => {
  try {
    const workerId = req.user._id;
    const serviceData = { ...req.body, workerId };
    const newService = await serviceService.create(serviceData);
    res.status(201).json(newService);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar serviço por ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const service = await serviceService.findById(req.params.id);
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar serviços do trabalhador logado
router.get('/worker/me', requireAuth, async (req, res) => {
  try {
    const services = await serviceService.findByWorkerId(req.user._id);
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar por categoria
router.get('/category', requireAuth, async (req, res) => {
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
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });

    if (service.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Você não tem permissão para atualizar este serviço' });
    }

    const updatedService = await serviceService.update(req.params.id, req.body);
    res.json(updatedService);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar status
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status é obrigatório' });

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
