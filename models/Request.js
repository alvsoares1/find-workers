const { ObjectId } = require('mongodb');
const { getDB } = require('../db/database');
const Validator = require('../utils/validator');
const Logger = require('../utils/logger');

class Request {
    constructor(requestData) {
        this.clientId = typeof requestData.clientId === 'string' ? new ObjectId(requestData.clientId) : requestData.clientId;
        this.serviceId = typeof requestData.serviceId === 'string' ? new ObjectId(requestData.serviceId) : requestData.serviceId;
        this.status = requestData.status || 'pendente';
        this.description = requestData.description ? Validator.sanitizeString(requestData.description) : '';
        this.preferredDate = requestData.preferredDate ? new Date(requestData.preferredDate) : null;
        this.createdAt = requestData.createdAt || new Date();
        this.updatedAt = requestData.updatedAt || new Date();
        
        if (requestData._id) {
            this._id = new ObjectId(requestData._id);
        }
    }

    static getCollection() {
        return getDB().collection('requests');
    }

    async save() {
        try {
            const collection = Request.getCollection();
            
            if (!this.clientId || !this.serviceId) {
                throw new Error('ClientId e ServiceId são obrigatórios');
            }

            if (!this._id) {
                // Nova solicitação
                this.createdAt = new Date();
                this.updatedAt = new Date();
                
                const result = await collection.insertOne(this.toObject());
                this._id = result.insertedId;
                
                Logger.info(`Nova solicitação criada: ${this._id.toString()}`);
            } else {
                // Atualizar solicitação existente
                this.updatedAt = new Date();
                
                await collection.updateOne(
                    { _id: this._id },
                    { $set: this.toObject() }
                );
                
                Logger.info(`Solicitação atualizada: ${this._id.toString()}`);
            }
            
            return this;
        } catch (error) {
            Logger.error('Erro ao salvar solicitação:', error);
            throw error;
        }
    }

    static async find(query = {}) {
        try {
            const collection = Request.getCollection();
            const cursor = collection.find(query);
            const requests = await cursor.toArray();
            return requests.map(requestData => new Request(requestData));
        } catch (error) {
            Logger.error('Erro ao buscar solicitações:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const collection = Request.getCollection();
            const requestData = await collection.findOne({ _id: new ObjectId(id) });
            return requestData ? new Request(requestData) : null;
        } catch (error) {
            Logger.error('Erro ao buscar solicitação por ID:', error);
            throw error;
        }
    }

    static async findOne(query) {
        try {
            const collection = Request.getCollection();
            const requestData = await collection.findOne(query);
            return requestData ? new Request(requestData) : null;
        } catch (error) {
            Logger.error('Erro ao buscar uma solicitação:', error);
            throw error;
        }
    }

    static async findByIdAndUpdate(id, updateData, options = {}) {
        try {
            const collection = Request.getCollection();
            const objectId = new ObjectId(id);
            
            // Verificar se o documento existe
            const existingDoc = await collection.findOne({ _id: objectId });
            if (!existingDoc) {
                return null;
            }

            // Usar updateOne e depois buscar o documento
            const updateResult = await collection.updateOne(
                { _id: objectId },
                { $set: { ...updateData, updatedAt: new Date() } }
            );
            
            if (updateResult.modifiedCount === 0) {
                return null;
            }
            
            // Buscar o documento atualizado
            const updatedDoc = await collection.findOne({ _id: objectId });
            
            return updatedDoc ? new Request(updatedDoc) : null;
        } catch (error) {
            Logger.error('Erro ao atualizar solicitação:', error);
            throw error;
        }
    }

    static async findByIdAndDelete(id) {
        try {
            const collection = Request.getCollection();
            const result = await collection.findOneAndDelete({ _id: new ObjectId(id) });
            return result.value ? new Request(result.value) : null;
        } catch (error) {
            Logger.error('Erro ao deletar solicitação:', error);
            throw error;
        }
    }

    // Método para popular dados relacionados
    static async populateRequestData(request) {
        try {
            if (!request) {
                throw new Error('Request is null or undefined');
            }

            const usersCollection = getDB().collection('users');
            const servicesCollection = getDB().collection('services');

            // Buscar dados do cliente
            const client = await usersCollection.findOne(
                { _id: request.clientId },
                { projection: { name: 1, email: 1, userType: 1 } }
            );

            // Buscar dados do serviço
            const service = await servicesCollection.findOne(
                { _id: request.serviceId },
                { projection: { title: 1, description: 1, price: 1, category: 1, workerId: 1 } }
            );

            // Buscar dados do trabalhador (se o serviço existir)
            let worker = null;
            if (service && service.workerId) {
                worker = await usersCollection.findOne(
                    { _id: service.workerId },
                    { projection: { name: 1, email: 1, userType: 1, phone: 1 } }
                );
            }

            return {
                ...request.toObject(),
                clientId: client || { name: 'Cliente não encontrado', email: '' },
                serviceId: service || { title: 'Serviço não encontrado', description: '' },
                workerId: worker || null
            };
        } catch (error) {
            Logger.error('Erro ao popular dados da solicitação:', error);
            throw error;
        }
    }

    toObject() {
        return {
            _id: this._id,
            clientId: this.clientId,
            serviceId: this.serviceId,
            status: this.status,
            description: this.description,
            preferredDate: this.preferredDate,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Request;
