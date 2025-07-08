const { ObjectId } = require('mongodb');
const { getDB } = require('../db/database');

class Service {
    constructor(serviceData) {
        this.title = serviceData.title;
        this.description = serviceData.description;
        this.price = serviceData.price;
        this.workerId = serviceData.workerId ? new ObjectId(serviceData.workerId) : null;
        this.category = serviceData.category;
        this.status = serviceData.status || 'disponível';
        this.createdAt = serviceData.createdAt || new Date();
        this.updatedAt = serviceData.updatedAt || new Date();
        
        if (serviceData._id) {
            this._id = new ObjectId(serviceData._id);
        }
    }

    static getCollection() {
        return getDB().collection('services');
    }

    async save() {
        const collection = Service.getCollection();
        
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

    toObject() {
        const obj = {
            title: this.title,
            description: this.description,
            price: this.price,
            workerId: this.workerId,
            category: this.category,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
        
        if (this._id) {
            obj._id = this._id;
        }
        
        return obj;
    }

    static async findById(id) {
        const collection = Service.getCollection();
        const serviceData = await collection.findOne({ _id: new ObjectId(id) });
        return serviceData ? new Service(serviceData) : null;
    }

    static async findOne(query) {
        const collection = Service.getCollection();
        const serviceData = await collection.findOne(query);
        return serviceData ? new Service(serviceData) : null;
    }

    static async find(query = {}, options = {}) {
        const collection = Service.getCollection();
        const cursor = collection.find(query, options);
        const services = await cursor.toArray();
        return services.map(serviceData => new Service(serviceData));
    }

    static async findByIdAndUpdate(id, update, options = {}) {
        const collection = Service.getCollection();
        update.updatedAt = new Date();
        
        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: update },
            { returnDocument: 'after', ...options }
        );
        
        return result.value ? new Service(result.value) : null;
    }

    static async findByIdAndDelete(id) {
        const collection = Service.getCollection();
        const result = await collection.findOneAndDelete({ _id: new ObjectId(id) });
        return result.value ? new Service(result.value) : null;
    }

    async populateWorker() {
        const User = require('./User');
        const worker = await User.findById(this.workerId);
        this.worker = worker ? worker.toJSON() : null;
        return this;
    }

    static async findWithWorker(query = {}, options = {}) {
        const services = await Service.find(query, options);
        const populatedServices = await Promise.all(
            services.map(service => service.populateWorker())
        );
        return populatedServices;
    }

    validateRequired() {
        if (!this.title || !this.description || !this.price || !this.workerId || !this.category) {
            throw new Error('Campos obrigatórios: title, description, price, workerId, category');
        }
    }

    validateStatus() {
        const validStatuses = ['disponível', 'indisponível', 'pausado'];
        if (!validStatuses.includes(this.status)) {
            throw new Error('Status deve ser: disponível, indisponível ou pausado');
        }
    }
}

module.exports = Service;
