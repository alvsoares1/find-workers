const Service = require('../models/Service');

const serviceService = {
  async findAll() {
    try {
      return await Service.findAll();
    } catch (error) {
      throw new Error(`Erro ao buscar serviços: ${error.message}`);
    }
  },

  async findById(id) {
    try {
      return await Service.findById(id);
    } catch (error) {
      throw new Error(`Erro ao buscar serviço: ${error.message}`);
    }
  },

  async findByWorkerId(workerId) {
    try {
      return await Service.findByWorkerId(workerId);
    } catch (error) {
      throw new Error(`Erro ao buscar serviços do trabalhador: ${error.message}`);
    }
  },

  async findByCategory(category) {
    try {
      return await Service.findByCategory(category);
    } catch (error) {
      throw new Error(`Erro ao buscar serviços por categoria: ${error.message}`);
    }
  },

  async findAvailable() {
    try {
      return await Service.findAvailable();
    } catch (error) {
      throw new Error(`Erro ao buscar serviços disponíveis: ${error.message}`);
    }
  },

  async create(serviceData) {
    try {
      const service = new Service(serviceData);
      return await service.save();
    } catch (error) {
      throw new Error(`Erro ao criar serviço: ${error.message}`);
    }
  },

  async update(id, updateData) {
    try {
      return await Service.update(id, updateData);
    } catch (error) {
      throw new Error(`Erro ao atualizar serviço: ${error.message}`);
    }
  },

  async delete(id) {
    try {
      return await Service.delete(id);
    } catch (error) {
      throw new Error(`Erro ao deletar serviço: ${error.message}`);
    }
  },

  async updateStatus(id, status) {
    try {
      return await Service.updateStatus(id, status);
    } catch (error) {
      throw new Error(`Erro ao atualizar status do serviço: ${error.message}`);
    }
  }
};

module.exports = serviceService;
