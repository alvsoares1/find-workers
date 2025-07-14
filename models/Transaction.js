const { ObjectId } = require('mongodb');
const { getDB } = require('../db/database');
const Validator = require('../utils/validator');
const Logger = require('../utils/logger');
const { TRANSACTION_TYPES, TRANSACTION_STATUS, PAYMENT_METHODS } = require('../utils/constants');

class Transaction {
    constructor(transactionData) {
        this.userId = typeof transactionData.userId === 'string' ? new ObjectId(transactionData.userId) : transactionData.userId;
        this.serviceId = typeof transactionData.serviceId === 'string' ? new ObjectId(transactionData.serviceId) : transactionData.serviceId;
        this.requestId = typeof transactionData.requestId === 'string' ? new ObjectId(transactionData.requestId) : transactionData.requestId;
        
        this.amount = parseFloat(transactionData.amount) || 0;
        this.platformFee = parseFloat(transactionData.platformFee) || 0;
        this.netAmount = parseFloat(transactionData.netAmount) || (this.amount - this.platformFee);
        
        this.type = transactionData.type; // 'payment' ou 'receipt'
        this.status = transactionData.status || TRANSACTION_STATUS.PENDING; // pending, completed, failed, refunded
        
        this.description = transactionData.description ? Validator.sanitizeString(transactionData.description) : '';
        this.paymentMethod = transactionData.paymentMethod || PAYMENT_METHODS.PLATFORM; // platform, credit_card, pix, etc
        this.transactionDate = transactionData.transactionDate || new Date();
        
        this.metadata = transactionData.metadata || {};
        this.createdAt = transactionData.createdAt || new Date();
        this.updatedAt = transactionData.updatedAt || new Date();
        
        if (transactionData._id) {
            this._id = new ObjectId(transactionData._id);
        }
    }

    static getCollection() {
        return getDB().collection('transactions');
    }

    async save() {
        try {
            const collection = Transaction.getCollection();
            
            if (!this.userId || !this.serviceId || !this.amount || !this.type) {
                throw new Error('UserId, ServiceId, amount e type são obrigatórios');
            }

            if (!Object.values(TRANSACTION_TYPES).includes(this.type)) {
                throw new Error('Tipo de transação deve ser "payment" ou "receipt"');
            }

            if (!this._id) {
                this.createdAt = new Date();
                this.updatedAt = new Date();
                
                const result = await collection.insertOne(this.toObject());
                this._id = result.insertedId;
                
                Logger.info(`Nova transação criada: ${this._id.toString()}`);
            } else {
                this.updatedAt = new Date();
                
                await collection.updateOne(
                    { _id: this._id },
                    { $set: this.toObject() }
                );
                
                Logger.info(`Transação atualizada: ${this._id.toString()}`);
            }
            
            return this;
        } catch (error) {
            Logger.error('Erro ao salvar transação:', error);
            throw error;
        }
    }

    static async find(query = {}) {
        try {
            const collection = Transaction.getCollection();
            const cursor = collection.find(query);
            const transactions = await cursor.toArray();
            return transactions.map(transactionData => new Transaction(transactionData));
        } catch (error) {
            Logger.error('Erro ao buscar transações:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const collection = Transaction.getCollection();
            const transactionData = await collection.findOne({ _id: new ObjectId(id) });
            return transactionData ? new Transaction(transactionData) : null;
        } catch (error) {
            Logger.error('Erro ao buscar transação por ID:', error);
            throw error;
        }
    }

    static async findByUserId(userId, options = {}) {
        try {
            const collection = Transaction.getCollection();
            const query = { userId: new ObjectId(userId) };
            
            if (options.type) {
                query.type = options.type;
            }
            
            if (options.status) {
                query.status = options.status;
            }
            
            if (options.startDate || options.endDate) {
                query.transactionDate = {};
                if (options.startDate) {
                    query.transactionDate.$gte = new Date(options.startDate);
                }
                if (options.endDate) {
                    query.transactionDate.$lte = new Date(options.endDate);
                }
            }
            
            let cursor = collection.find(query);
            
            cursor = cursor.sort({ transactionDate: -1 });
            
            if (options.limit) {
                cursor = cursor.limit(parseInt(options.limit));
            }
            
            if (options.skip) {
                cursor = cursor.skip(parseInt(options.skip));
            }
            
            const transactions = await cursor.toArray();
            return transactions.map(transactionData => new Transaction(transactionData));
        } catch (error) {
            Logger.error('Erro ao buscar transações por usuário:', error);
            throw error;
        }
    }

    static async getMonthlyReport(userId, year, month) {
        try {
            const collection = Transaction.getCollection();
            
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            
            const query = {
                userId: new ObjectId(userId),
                transactionDate: {
                    $gte: startDate,
                    $lte: endDate
                },
                status: TRANSACTION_STATUS.COMPLETED
            };
            
            const transactions = await collection.find(query).sort({ transactionDate: -1 }).toArray();
            
            // Calcular totais
            const payments = transactions.filter(t => t.type === TRANSACTION_TYPES.PAYMENT);
            const receipts = transactions.filter(t => t.type === TRANSACTION_TYPES.RECEIPT);
            
            const totalPayments = payments.reduce((sum, t) => sum + t.amount, 0);
            const totalReceipts = receipts.reduce((sum, t) => sum + t.netAmount, 0);
            const totalFees = receipts.reduce((sum, t) => sum + t.platformFee, 0);
            
            return {
                month,
                year,
                transactions: transactions.map(t => new Transaction(t)),
                summary: {
                    totalPayments,
                    totalReceipts,
                    totalFees,
                    netBalance: totalReceipts - totalPayments,
                    transactionCount: transactions.length
                }
            };
        } catch (error) {
            Logger.error('Erro ao gerar relatório mensal:', error);
            throw error;
        }
    }

    static async getYearlyReport(userId, year) {
        try {
            const collection = Transaction.getCollection();
            
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31, 23, 59, 59);
            
            const pipeline = [
                {
                    $match: {
                        userId: new ObjectId(userId),
                        transactionDate: {
                            $gte: startDate,
                            $lte: endDate
                        },
                        status: TRANSACTION_STATUS.COMPLETED
                    }
                },
                {
                    $group: {
                        _id: {
                            month: { $month: '$transactionDate' },
                            type: '$type'
                        },
                        totalAmount: { $sum: '$amount' },
                        totalNetAmount: { $sum: '$netAmount' },
                        totalFees: { $sum: '$platformFee' },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { '_id.month': 1 }
                }
            ];
            
            const result = await collection.aggregate(pipeline).toArray();
            
            const monthlyData = {};
            for (let month = 1; month <= 12; month++) {
                monthlyData[month] = {
                    payments: { total: 0, count: 0 },
                    receipts: { total: 0, netTotal: 0, fees: 0, count: 0 }
                };
            }
            
            result.forEach(item => {
                const month = item._id.month;
                const type = item._id.type;
                
                if (type === TRANSACTION_TYPES.PAYMENT) {
                    monthlyData[month].payments.total = item.totalAmount;
                    monthlyData[month].payments.count = item.count;
                } else if (type === TRANSACTION_TYPES.RECEIPT) {
                    monthlyData[month].receipts.total = item.totalAmount;
                    monthlyData[month].receipts.netTotal = item.totalNetAmount;
                    monthlyData[month].receipts.fees = item.totalFees;
                    monthlyData[month].receipts.count = item.count;
                }
            });
            
            return {
                year,
                monthlyData
            };
        } catch (error) {
            Logger.error('Erro ao gerar relatório anual:', error);
            throw error;
        }
    }

    toObject() {
        const obj = {
            userId: this.userId,
            serviceId: this.serviceId,
            requestId: this.requestId,
            amount: this.amount,
            platformFee: this.platformFee,
            netAmount: this.netAmount,
            type: this.type,
            status: this.status,
            description: this.description,
            paymentMethod: this.paymentMethod,
            transactionDate: this.transactionDate,
            metadata: this.metadata,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
        
        if (this._id) {
            obj._id = this._id;
        }
        
        return obj;
    }
}

module.exports = Transaction;
