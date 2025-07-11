const Request = require('../models/Request');

const requestService = {
    async findAll() {
        try {
            const requests = await Request.find();
            const populatedRequests = [];
            
            for (const request of requests) {
                const populated = await Request.populateRequestData(request);
                populatedRequests.push(populated);
            }
            
            return populatedRequests;
        } catch (error) {
            throw new Error(`Erro ao buscar solicitações: ${error.message}`);
        }
    },

    async findById(id) {
        try {
            const request = await Request.findById(id);
            if (!request) {
                return null;
            }
            return await Request.populateRequestData(request);
        } catch (error) {
            throw new Error(`Erro ao buscar solicitação: ${error.message}`);
        }
    },

    async findByClientId(clientId) {
        try {
            const { ObjectId } = require('mongodb');
            const requests = await Request.find({ clientId: new ObjectId(clientId) });
            const populatedRequests = [];
            
            for (const request of requests) {
                const populated = await Request.populateRequestData(request);
                populatedRequests.push(populated);
            }
            
            return populatedRequests;
        } catch (error) {
            throw new Error(`Erro ao buscar solicitações do cliente: ${error.message}`);
        }
    },

    async findByServiceId(serviceId) {
        try {
            const { ObjectId } = require('mongodb');
            const requests = await Request.find({ serviceId: new ObjectId(serviceId) });
            const populatedRequests = [];
            
            for (const request of requests) {
                const populated = await Request.populateRequestData(request);
                populatedRequests.push(populated);
            }
            
            return populatedRequests;
        } catch (error) {
            throw new Error(`Erro ao buscar solicitações do serviço: ${error.message}`);
        }
    },

    async findByStatus(status) {
        try {
            const requests = await Request.find({ status });
            const populatedRequests = [];
            
            for (const request of requests) {
                const populated = await Request.populateRequestData(request);
                populatedRequests.push(populated);
            }
            
            return populatedRequests;
        } catch (error) {
            throw new Error(`Erro ao buscar solicitações por status: ${error.message}`);
        }
    },

    async create(requestData) {
        try {
            const request = new Request(requestData);
            const savedRequest = await request.save();
            return await Request.populateRequestData(savedRequest);
        } catch (error) {
            throw new Error(`Erro ao criar solicitação: ${error.message}`);
        }
    },

    async update(id, updateData) {
        try {
            const updatedRequest = await Request.findByIdAndUpdate(id, updateData);
            if (!updatedRequest) {
                throw new Error('Solicitação não encontrada');
            }
            return await Request.populateRequestData(updatedRequest);
        } catch (error) {
            throw new Error(`Erro ao atualizar solicitação: ${error.message}`);
        }
    },

    async delete(id) {
        try {
            const deletedRequest = await Request.findByIdAndDelete(id);
            if (!deletedRequest) {
                throw new Error('Solicitação não encontrada');
            }
            return deletedRequest;
        } catch (error) {
            throw new Error(`Erro ao deletar solicitação: ${error.message}`);
        }
    },

    async updateStatus(id, status) {
        try {
            const updatedRequest = await Request.findByIdAndUpdate(
                id,
                { status }
            );
            
            if (!updatedRequest) {
                throw new Error('Solicitação não encontrada');
            }
            
            return await Request.populateRequestData(updatedRequest);
        } catch (error) {
            throw new Error(`Erro ao atualizar status da solicitação: ${error.message}`);
        }
    },

    // Métodos específicos para o fluxo de negócio
    async getPendingRequests() {
        try {
            return await this.findByStatus('pendente');
        } catch (error) {
            throw new Error(`Erro ao buscar solicitações pendentes: ${error.message}`);
        }
    },

    async acceptRequest(requestId, workerId) {
        try {
            // Verificar se a solicitação existe e está pendente
            const request = await Request.findById(requestId);
            if (!request) {
                throw new Error('Solicitação não encontrada');
            }
            
            if (request.status !== 'pendente') {
                throw new Error('Solicitação não está pendente');
            }

            // Atualizar status para aceita
            return await this.updateStatus(requestId, 'aceita');
        } catch (error) {
            throw new Error(`Erro ao aceitar solicitação: ${error.message}`);
        }
    },

    async rejectRequest(requestId, reason = '') {
        try {
            const request = await Request.findById(requestId);
            if (!request) {
                throw new Error('Solicitação não encontrada');
            }

            if (request.status !== 'pendente') {
                throw new Error('Solicitação não está pendente');
            }

            return await this.updateStatus(requestId, 'rejeitada');
        } catch (error) {
            throw new Error(`Erro ao rejeitar solicitação: ${error.message}`);
        }
    },

    async completeRequest(requestId) {
        try {
            const request = await Request.findById(requestId);
            if (!request) {
                throw new Error('Solicitação não encontrada');
            }

            if (request.status !== 'aceita' && request.status !== 'em_andamento') {
                throw new Error('Solicitação deve estar aceita ou em andamento para ser concluída');
            }

            return await this.updateStatus(requestId, 'concluida');
        } catch (error) {
            throw new Error(`Erro ao concluir solicitação: ${error.message}`);
        }
    },

    async startRequest(requestId) {
        try {
            const request = await Request.findById(requestId);
            if (!request) {
                throw new Error('Solicitação não encontrada');
            }

            if (request.status !== 'aceita') {
                throw new Error('Solicitação deve estar aceita para ser iniciada');
            }

            return await this.updateStatus(requestId, 'em_andamento');
        } catch (error) {
            throw new Error(`Erro ao iniciar solicitação: ${error.message}`);
        }
    }
};
module.exports = requestService;
