const Request = require('../models/Request');
const { REQUEST_STATUS, PAYMENT_STATUS } = require('../utils/constants');
const Logger = require('../utils/logger');

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
            const request = await Request.findById(id);
            if (!request) {
                throw new Error('Solicitação não encontrada');
            }

            // Atualizar o status
            const updatedRequest = await Request.findByIdAndUpdate(
                id,
                { 
                    status,
                    paymentStatus: status === REQUEST_STATUS.COMPLETED ? PAYMENT_STATUS.COMPLETED : request.paymentStatus || PAYMENT_STATUS.PENDING
                }
            );

            // Se o status for 'concluida', processar pagamento automático
            if (status === REQUEST_STATUS.COMPLETED) {
                try {
                    const transactionService = require('./transactionService');
                    
                    // Buscar dados completos da solicitação para processar pagamento
                    const populatedRequest = await Request.populateRequestData(updatedRequest);
                    
                    // Processar pagamento automaticamente
                    await transactionService.processPaymentFromObject({
                        clientId: populatedRequest.clientId._id,
                        workerId: populatedRequest.serviceId.workerId._id || populatedRequest.serviceId.workerId,
                        serviceId: populatedRequest.serviceId._id,
                        requestId: populatedRequest._id,
                        amount: populatedRequest.serviceId.price,
                        description: `Pagamento pelo serviço: ${populatedRequest.serviceId.title}`,
                        transactionDate: new Date()
                    });

                    // Atualizar a solicitação com as transações criadas
                    await Request.findByIdAndUpdate(id, {
                        paymentStatus: PAYMENT_STATUS.COMPLETED
                    });

                    Logger.info(`Pagamento processado automaticamente para solicitação ${id}`);
                } catch (financialError) {
                    Logger.error('Erro ao processar pagamento automático:', financialError);
                    await Request.findByIdAndUpdate(id, {
                        paymentStatus: PAYMENT_STATUS.FAILED
                    });
                }
            }
            
            return await Request.populateRequestData(updatedRequest);
        } catch (error) {
            throw new Error(`Erro ao atualizar status da solicitação: ${error.message}`);
        }
    },

    async getPendingRequests() {
        try {
            return await this.findByStatus(REQUEST_STATUS.PENDING);
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
            
            if (request.status !== REQUEST_STATUS.PENDING) {
                throw new Error('Solicitação não está pendente');
            }

            // Atualizar status para aceita
            return await this.updateStatus(requestId, REQUEST_STATUS.ACCEPTED);
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

            if (request.status !== REQUEST_STATUS.PENDING) {
                throw new Error('Solicitação não está pendente');
            }

            return await this.updateStatus(requestId, REQUEST_STATUS.REJECTED);
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

            if (request.status !== REQUEST_STATUS.ACCEPTED && request.status !== REQUEST_STATUS.IN_PROGRESS) {
                throw new Error('Solicitação deve estar aceita ou em andamento para ser concluída');
            }

            return await this.updateStatus(requestId, REQUEST_STATUS.COMPLETED);
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

            if (request.status !== REQUEST_STATUS.ACCEPTED) {
                throw new Error('Solicitação deve estar aceita para ser iniciada');
            }

            return await this.updateStatus(requestId, REQUEST_STATUS.IN_PROGRESS);
        } catch (error) {
            throw new Error(`Erro ao iniciar solicitação: ${error.message}`);
        }
    }
};
module.exports = requestService;
