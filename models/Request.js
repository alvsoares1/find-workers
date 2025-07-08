const { ObjectId } = require('mongodb');
const { getDB } = require('../db/database');

class Request {
    constructor(requestData) {
        this.clientId = requestData.clientId ? new ObjectId(requestData.clientId) : null;
        this.serviceId = requestData.serviceId ? new ObjectId(requestData.serviceId) : null;
        this.status = requestData.status || 'pendente';
        this.description = requestData.description;
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
        const collection = Request.getCollection();
        
        this.validateRequired();
        this.validateStatus();
        
        if (!this._id) {
            this.createdAt = new Date();
            this.updatedAt = new Date();
            
            const result = await collection.insertOne(this.toObject());
            this._id = result.insertedId;
        } else {
            this.updatedAt = new Date();
            
            await collection.updateOne(
                { _id: this._id },
                { $set: this.toObject() }
            );
        }
        
        return this;
    }

    validateRequired() {
        if (!this.clientId || !this.serviceId || !this.description) {
            throw new Error('Campos obrigatórios: clientId, serviceId, description');
        }
    }

    validateStatus() {
        const validStatuses = ['pendente', 'aceito', 'em_andamento', 'concluído', 'cancelado'];
        if (!validStatuses.includes(this.status)) {
            throw new Error('Status deve ser: pendente, aceito, em_andamento, concluído ou cancelado');
        }
    }

    toObject() {
        const obj = {
            clientId: this.clientId,
            serviceId: this.serviceId,
            status: this.status,
            description: this.description,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
        
        if (this._id) {
            obj._id = this._id;
        }
        
        return obj;
    }

    static async findById(id) {
        const collection = Request.getCollection();
        const requestData = await collection.findOne({ _id: new ObjectId(id) });
        return requestData ? new Request(requestData) : null;
    }

    static async findOne(query) {
        const collection = Request.getCollection();
        const requestData = await collection.findOne(query);
        return requestData ? new Request(requestData) : null;
    }

    static async find(query = {}, options = {}) {
        const collection = Request.getCollection();
        const cursor = collection.find(query, options);
        const requests = await cursor.toArray();
        return requests.map(requestData => new Request(requestData));
    }

    static async findByIdAndUpdate(id, update, options = {}) {
        const collection = Request.getCollection();
        update.updatedAt = new Date();
        
        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: update },
            { returnDocument: 'after', ...options }
        );
        
        return result.value ? new Request(result.value) : null;
    }

    static async findByIdAndDelete(id) {
        const collection = Request.getCollection();
        const result = await collection.findOneAndDelete({ _id: new ObjectId(id) });
        return result.value ? new Request(result.value) : null;
    }

    async populateClient() {
        const User = require('./User');
        const client = await User.findById(this.clientId);
        this.client = client ? client.toJSON() : null;
        return this;
    }

    async populateService() {
        const Service = require('./Service');
        const service = await Service.findById(this.serviceId);
        this.service = service ? service.toObject() : null;
        return this;
    }

    async populate() {
        await this.populateClient();
        await this.populateService();
        return this;
    }

    static async findWithPopulate(query = {}, options = {}) {
        const requests = await Request.find(query, options);
        const populatedRequests = await Promise.all(
            requests.map(request => request.populate())
        );
        return populatedRequests;
    }
}

module.exports = Request;
