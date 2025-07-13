const Transaction = require('../models/Transaction');
const Logger = require('../utils/logger');
const { TRANSACTION_TYPES, TRANSACTION_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } = require('../utils/constants');
const { ObjectId } = require('mongodb');

class TransactionService {
    
    static async createTransaction(transactionData) {
        try {
            const transaction = new Transaction(transactionData);
            await transaction.save();
            return transaction;
        } catch (error) {
            Logger.error('Erro ao criar transação:', error);
            throw error;
        }
    }

    static async processPayment(userId, serviceId, requestId, amount, description = '') {
        try {
            const platformFeeRate = 0.05;
            const platformFee = amount * platformFeeRate;
            const netAmount = amount - platformFee;

            // Criar transação de pagamento para o cliente
            const paymentTransaction = await this.createTransaction({
                userId: userId,
                serviceId: serviceId,
                requestId: requestId,
                amount: amount,
                platformFee: 0, // Cliente não paga taxa adicional
                netAmount: amount,
                type: TRANSACTION_TYPES.PAYMENT,
                status: TRANSACTION_STATUS.COMPLETED,
                description: description || 'Pagamento de serviço',
                paymentMethod: PAYMENT_METHODS.PLATFORM
            });

            // Buscar o prestador de serviço (precisamos do workerId)
            const Service = require('../models/Service');
            const service = await Service.findById(serviceId);
            
            if (!service) {
                throw new Error('Serviço não encontrado');
            }

            // Criar transação de recebimento para o prestador
            const receiptTransaction = await this.createTransaction({
                userId: service.workerId,
                serviceId: serviceId,
                requestId: requestId,
                amount: amount,
                platformFee: platformFee,
                netAmount: netAmount,
                type: TRANSACTION_TYPES.RECEIPT,
                status: TRANSACTION_STATUS.COMPLETED,
                description: description || 'Recebimento de serviço',
                paymentMethod: PAYMENT_METHODS.PLATFORM
            });

            // Atualizar a Request com os dados da transação
            try {
                const Request = require('../models/Request');
                const request = await Request.findById(requestId);
                if (request) {
                    request.agreedPrice = amount;
                    request.paymentStatus = 'completed';
                    request.transactionIds = [paymentTransaction._id, receiptTransaction._id];
                    await request.save();
                }
            } catch (requestError) {
                Logger.warn('Erro ao atualizar request com dados da transação:', requestError);
            }

            Logger.info(`Pagamento processado: ${amount} - Cliente: ${userId}, Prestador: ${service.workerId}`);
            
            return {
                paymentTransaction,
                receiptTransaction,
                platformFee,
                netAmount,
                success: true
            };
        } catch (error) {
            Logger.error('Erro ao processar pagamento:', error);
            throw error;
        }
    }

    static async processPaymentFromObject(paymentData) {
        try {
            const {
                clientId,
                workerId, 
                serviceId,
                requestId,
                amount,
                description = '',
                transactionDate = new Date()
            } = paymentData;

            // Validações básicas
            if (!clientId || !workerId || !serviceId || !requestId || !amount) {
                throw new Error('Dados obrigatórios faltando: clientId, workerId, serviceId, requestId, amount');
            }

            // Calcular taxa da plataforma (5%)
            const platformFeeRate = 0.05;
            const platformFee = amount * platformFeeRate;
            const netAmount = amount - platformFee;

            // Criar transação de pagamento do cliente
            const paymentTransactionData = {
                userId: clientId,
                serviceId: serviceId,
                requestId: requestId,
                amount: amount,
                platformFee: 0, // Cliente não paga taxa extra
                netAmount: amount,
                type: TRANSACTION_TYPES.PAYMENT,
                status: TRANSACTION_STATUS.COMPLETED,
                description: description || 'Pagamento de serviço',
                paymentMethod: PAYMENT_METHODS.PLATFORM,
                transactionDate: transactionDate
            };
            
            const paymentTransaction = await this.createTransaction(paymentTransactionData);

            // Criar transação de recebimento para o prestador
            const receiptTransactionData = {
                userId: workerId,
                serviceId: serviceId,
                requestId: requestId,
                amount: amount,
                platformFee: platformFee,
                netAmount: netAmount,
                type: TRANSACTION_TYPES.RECEIPT,
                status: TRANSACTION_STATUS.COMPLETED,
                description: description || 'Recebimento de serviço',
                paymentMethod: PAYMENT_METHODS.PLATFORM,
                transactionDate: transactionDate
            };
            
            const receiptTransaction = await this.createTransaction(receiptTransactionData);

            // Atualizar a Request com os dados da transação
            try {
                const Request = require('../models/Request');
                const request = await Request.findById(requestId);
                if (request) {
                    request.agreedPrice = amount;
                    request.paymentStatus = 'completed';
                    request.transactionIds = [paymentTransaction._id, receiptTransaction._id];
                    await request.save();
                }
            } catch (requestError) {
                Logger.warn('Erro ao atualizar request com dados da transação:', requestError);
            }

            Logger.info(`Pagamento processado: ${amount} - Cliente: ${clientId}, Prestador: ${workerId}`);
            
            return {
                paymentTransaction,
                receiptTransaction,
                platformFee,
                netAmount,
                success: true
            };
        } catch (error) {
            Logger.error('Erro ao processar pagamento:', error);
            throw error;
        }
    }

    static async getUserTransactions(userId, options = {}) {
        try {
            return await Transaction.findByUserId(userId, options);
        } catch (error) {
            Logger.error('Erro ao buscar transações do usuário:', error);
            throw error;
        }
    }

    static async getUserTransactionsWithDetails(userId, options = {}) {
        try {
            const transactions = await Transaction.findByUserId(userId, options);
            const Service = require('../models/Service');
            const User = require('../models/User');
            const Request = require('../models/Request');
            
            // Enriquecer transações com detalhes
            const enrichedTransactions = await Promise.all(
                transactions.map(async (transaction) => {
                    const transactionObj = transaction.toObject();
                    
                    // Buscar detalhes do serviço
                    try {
                        const service = await Service.findById(transaction.serviceId);
                        if (service) {
                            transactionObj.service = {
                                title: service.title,
                                category: service.category,
                                description: service.description,
                                price: service.price
                            };
                            
                            // Buscar dados do prestador (para pagamentos) ou cliente (para recebimentos)
                            if (transaction.type === TRANSACTION_TYPES.PAYMENT) {
                                const worker = await User.findById(service.workerId);
                                if (worker) {
                                    transactionObj.counterpart = {
                                        name: worker.name,
                                        type: 'worker'
                                    };
                                }
                            } else if (transaction.type === TRANSACTION_TYPES.RECEIPT) {
                                // Para recebimentos, buscar dados do cliente através da request
                                if (transaction.requestId) {
                                    const request = await Request.findById(transaction.requestId);
                                    if (request) {
                                        const client = await User.findById(request.clientId);
                                        if (client) {
                                            transactionObj.counterpart = {
                                                name: client.name,
                                                type: 'client'
                                            };
                                        }
                                    }
                                }
                            }
                        }
                    } catch (serviceError) {
                        Logger.warn(`Erro ao buscar detalhes do serviço ${transaction.serviceId}:`, serviceError);
                        transactionObj.service = { title: 'Serviço não encontrado' };
                    }
                    
                    // Buscar detalhes da request se disponível
                    if (transaction.requestId) {
                        try {
                            const request = await Request.findById(transaction.requestId);
                            if (request) {
                                transactionObj.request = {
                                    id: request._id,
                                    status: request.status,
                                    description: request.description,
                                    preferredDate: request.preferredDate,
                                    paymentStatus: request.paymentStatus
                                };
                            }
                        } catch (requestError) {
                            Logger.warn(`Erro ao buscar detalhes da solicitação ${transaction.requestId}:`, requestError);
                        }
                    }
                    
                    return transactionObj;
                })
            );
            
            return enrichedTransactions;
        } catch (error) {
            Logger.error('Erro ao buscar transações com detalhes:', error);
            throw error;
        }
    }

    static async getMonthlyReport(userId, year, month) {
        try {
            return await Transaction.getMonthlyReport(userId, year, month);
        } catch (error) {
            Logger.error('Erro ao gerar relatório mensal:', error);
            throw error;
        }
    }

    static async getYearlyReport(userId, year) {
        try {
            return await Transaction.getYearlyReport(userId, year);
        } catch (error) {
            Logger.error('Erro ao gerar relatório anual:', error);
            throw error;
        }
    }

    static async getUserFinancialStats(userId) {
        try {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1;
            
            // Buscar transações do mês atual
            const monthlyReport = await this.getMonthlyReport(userId, currentYear, currentMonth);
            
            // Buscar transações dos últimos 6 meses
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            const recentTransactions = await Transaction.findByUserId(userId, {
                startDate: sixMonthsAgo,
                status: 'completed',
                limit: 10
            });
            
            // Calcular total geral
            const allCompletedTransactions = await Transaction.findByUserId(userId, {
                status: TRANSACTION_STATUS.COMPLETED
            });
            
            const totalPaid = allCompletedTransactions
                .filter(t => t.type === TRANSACTION_TYPES.PAYMENT)
                .reduce((sum, t) => sum + t.amount, 0);
                
            const totalReceived = allCompletedTransactions
                .filter(t => t.type === TRANSACTION_TYPES.RECEIPT)
                .reduce((sum, t) => sum + t.netAmount, 0);
                
            const totalFees = allCompletedTransactions
                .filter(t => t.type === TRANSACTION_TYPES.RECEIPT)
                .reduce((sum, t) => sum + t.platformFee, 0);
            
            return {
                currentMonth: monthlyReport.summary,
                totals: {
                    totalPaid,
                    totalReceived,
                    totalFees,
                    netBalance: totalReceived - totalPaid
                },
                recentTransactions: recentTransactions.slice(0, 5),
                transactionCount: allCompletedTransactions.length
            };
        } catch (error) {
            Logger.error('Erro ao obter estatísticas financeiras:', error);
            throw error;
        }
    }

    static generateCSVReport(transactions, summary = null, userType = null) {
        try {
            let csv = '';
            
            if (userType === 'client') {
                // CSV para clientes (apenas pagamentos)
                csv = 'Data,Descrição,Valor Pago,Status,Serviço,Prestador\n';
                
                transactions.forEach(transaction => {
                    const date = transaction.transactionDate.toLocaleDateString('pt-BR');
                    const description = (transaction.description || 'Pagamento de serviço').replace(/,/g, ';');
                    const amount = transaction.amount.toFixed(2).replace('.', ',');
                    const status = this.getStatusLabel(transaction.status);
                    const service = (transaction.serviceTitle || 'N/A').replace(/,/g, ';');
                    const worker = (transaction.workerName || 'N/A').replace(/,/g, ';');
                    
                    csv += `${date},${description},R$ ${amount},${status},${service},${worker}\n`;
                });
                
                if (summary) {
                    csv += '\n--- RESUMO ---\n';
                    csv += `Total Pago,R$ ${summary.totalPaid.toFixed(2).replace('.', ',')}\n`;
                    csv += `Número de Transações,${summary.transactionCount}\n`;
                }
                
            } else if (userType === 'worker') {
                // CSV para workers (apenas recebimentos)
                csv = 'Data,Descrição,Valor Bruto,Taxa Plataforma,Valor Líquido,Status,Serviço,Cliente\n';
                
                transactions.forEach(transaction => {
                    const date = transaction.transactionDate.toLocaleDateString('pt-BR');
                    const description = (transaction.description || 'Recebimento de serviço').replace(/,/g, ';');
                    const gross = transaction.amount.toFixed(2).replace('.', ',');
                    const fee = transaction.platformFee.toFixed(2).replace('.', ',');
                    const net = transaction.netAmount.toFixed(2).replace('.', ',');
                    const status = this.getStatusLabel(transaction.status);
                    const service = (transaction.serviceTitle || 'N/A').replace(/,/g, ';');
                    const client = (transaction.clientName || 'N/A').replace(/,/g, ';');
                    
                    csv += `${date},${description},R$ ${gross},R$ ${fee},R$ ${net},${status},${service},${client}\n`;
                });
                
                if (summary) {
                    csv += '\n--- RESUMO ---\n';
                    csv += `Total Recebido,R$ ${summary.totalReceived.toFixed(2).replace('.', ',')}\n`;
                    csv += `Total em Taxas,R$ ${summary.totalFees.toFixed(2).replace('.', ',')}\n`;
                    csv += `Número de Transações,${summary.transactionCount}\n`;
                }
                
            } else {
                // CSV genérico (compatibilidade)
                csv = 'Data,Tipo,Descrição,Valor,Taxa,Valor Líquido,Status,Método\n';
                
                transactions.forEach(transaction => {
                    const date = transaction.transactionDate.toLocaleDateString('pt-BR');
                    const type = transaction.type === TRANSACTION_TYPES.PAYMENT ? 'Pagamento' : 'Recebimento';
                    const description = transaction.description.replace(/,/g, ';');
                    const amount = transaction.amount.toFixed(2).replace('.', ',');
                    const fee = transaction.platformFee.toFixed(2).replace('.', ',');
                    const netAmount = transaction.netAmount.toFixed(2).replace('.', ',');
                    const status = this.getStatusLabel(transaction.status);
                    const method = this.getPaymentMethodLabel(transaction.paymentMethod);
                    
                    csv += `${date},${type},${description},R$ ${amount},R$ ${fee},R$ ${netAmount},${status},${method}\n`;
                });
                
                if (summary) {
                    csv += '\n--- RESUMO ---\n';
                    csv += `Total de Pagamentos,R$ ${summary.totalPayments.toFixed(2).replace('.', ',')}\n`;
                    csv += `Total de Recebimentos,R$ ${summary.totalReceipts.toFixed(2).replace('.', ',')}\n`;
                    csv += `Total de Taxas,R$ ${summary.totalFees.toFixed(2).replace('.', ',')}\n`;
                    csv += `Saldo Líquido,R$ ${summary.netBalance.toFixed(2).replace('.', ',')}\n`;
                }
            }
            
            return csv;
        } catch (error) {
            Logger.error('Erro ao gerar relatório CSV:', error);
            throw error;
        }
    }

    static getStatusLabel(status) {
        const labels = {
            'pending': 'Pendente',
            'completed': 'Concluído',
            'failed': 'Falhou',
            'refunded': 'Reembolsado'
        };
        return labels[status] || status;
    }

    static getPaymentMethodLabel(method) {
        const labels = {
            'platform': 'Plataforma',
            'credit_card': 'Cartão de Crédito',
            'pix': 'PIX',
            'bank_transfer': 'Transferência Bancária'
        };
        return labels[method] || method;
    }

    static async getRequestTransactions(requestId) {
        try {
            return await Transaction.find({ requestId: new ObjectId(requestId) });
        } catch (error) {
            Logger.error('Erro ao buscar transações da solicitação:', error);
            throw error;
        }
    }

    static async getRequestFinancialStatus(requestId) {
        try {
            const transactions = await this.getRequestTransactions(requestId);
            
            const payment = transactions.find(t => t.type === TRANSACTION_TYPES.PAYMENT);
            const receipt = transactions.find(t => t.type === TRANSACTION_TYPES.RECEIPT);
            
            return {
                hasPayment: !!payment,
                hasReceipt: !!receipt,
                paymentStatus: payment?.status || 'pending',
                receiptStatus: receipt?.status || 'pending',
                amount: payment?.amount || 0,
                platformFee: receipt?.platformFee || 0,
                netAmount: receipt?.netAmount || 0,
                transactions
            };
        } catch (error) {
            Logger.error('Erro ao verificar status financeiro da solicitação:', error);
            throw error;
        }
    }

    static async getServiceTransactions(serviceId) {
        try {
            return await Transaction.find({ serviceId: new ObjectId(serviceId) });
        } catch (error) {
            Logger.error('Erro ao buscar transações do serviço:', error);
            throw error;
        }
    }
}

module.exports = TransactionService;

