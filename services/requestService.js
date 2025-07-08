const Request = require('../models/Request');
const requestService = {
    async findAll() {
        try {
            return await Request.find()
                .populate('clientId', 'name email userType')
                .populate('serviceId', 'title description price category');
        } catch (error) {
            throw new Error(`Erro ao buscar solicitações: ${error.message}`);
        }
    },
    async findById(id) {
        try {
            return await Request.findById(id)
                .populate('clientId', 'name email userType')
                .populate('serviceId', 'title description price category');
        } catch (error) {
            throw new Error(`Erro ao buscar solicitação: ${error.message}`);
        }
    },
    async findByClientId(clientId) {
        try {
            return await Request.find({ clientId })
                .populate('clientId', 'name email userType')
                .populate('serviceId', 'title description price category');
        } catch (error) {
            throw new Error(`Erro ao buscar solicitações do cliente: ${error.message}`);
        }
    },
    async findByServiceId(serviceId) {
        try {
            return await Request.find({ serviceId })
                .populate('clientId', 'name email userType')
                .populate('serviceId', 'title description price category');
        } catch (error) {
            throw new Error(`Erro ao buscar solicitações do serviço: ${error.message}`);
        }
    },
    async findByStatus(status) {
        try {
            return await Request.find({ status })
                .populate('clientId', 'name email userType')
                .populate('serviceId', 'title description price category');
        } catch (error) {
            throw new Error(`Erro ao buscar solicitações por status: ${error.message}`);
        }
    },
    async create(requestData) {
        try {
            const request = new Request(requestData);
            return await request.save();
        } catch (error) {
            throw new Error(`Erro ao criar solicitação: ${error.message}`);
        }
    },
    async update(id, updateData) {
        try {
            return await Request.findByIdAndUpdate(
                id,
                { ...updateData, updatedAt: Date.now() },
                { new: true, runValidators: true }
            )
                .populate('clientId', 'name email userType')
                .populate('serviceId', 'title description price category');
        } catch (error) {
            throw new Error(`Erro ao atualizar solicitação: ${error.message}`);
        }
    },
    async delete(id) {
        try {
            return await Request.findByIdAndDelete(id);
        } catch (error) {
            throw new Error(`Erro ao deletar solicitação: ${error.message}`);
        }
    },
    async updateStatus(id, status) {
        try {
            return await Request.findByIdAndUpdate(
                id,
                { status, updatedAt: Date.now() },
                { new: true, runValidators: true }
            )
                .populate('clientId', 'name email userType')
                .populate('serviceId', 'title description price category');
        } catch (error) {
            throw new Error(`Erro ao atualizar status da solicitação: ${error.message}`);
        }
    }
};
module.exports = requestService;
