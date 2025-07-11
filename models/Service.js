const { ObjectId } = require('mongodb');
const { getDB } = require('../db/database');
const Validator = require('../utils/validator');
const Logger = require('../utils/logger');
const { SERVICE_STATUS } = require('../utils/constants');

class Service {
  constructor(serviceData) {
    this.title = Validator.sanitizeString(serviceData.title);
    this.description = serviceData.description ? Validator.sanitizeString(serviceData.description) : '';
    this.category = Validator.sanitizeString(serviceData.category);
    this.price = typeof serviceData.price === 'number' ? serviceData.price : 0;
    this.status = serviceData.status || SERVICE_STATUS.AVAILABLE;

    if (serviceData.workerId) {
      this.workerId = typeof serviceData.workerId === 'string' ? new ObjectId(serviceData.workerId) : serviceData.workerId;
    } else {
      this.workerId = null;
    }

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
    try {
      const collection = Service.getCollection();

      if (!this.title || !this.category || !this.workerId) {
        throw new Error('Título, categoria e workerId são obrigatórios');
      }

      if (!this._id) {
        this.createdAt = new Date();
        this.updatedAt = new Date();

        const result = await collection.insertOne(this.toObject());
        this._id = result.insertedId;

        Logger.info(`Novo serviço criado: ${this.title} por worker ${this.workerId.toString()}`);
      } else {
        this.updatedAt = new Date();

        await collection.updateOne(
          { _id: this._id },
          { $set: this.toObject() }
        );

        Logger.info(`Serviço atualizado: ${this._id.toString()}`);
      }

      return this;
    } catch (error) {
      Logger.error('Erro ao salvar serviço:', error);
      throw error;
    }
  }

  static async findAll() {
    const collection = Service.getCollection();
    const cursor = collection.find({});
    const services = await cursor.toArray();
    return services.map(serviceData => new Service(serviceData));
  }

  static async findById(id) {
    const collection = Service.getCollection();
    const serviceData = await collection.findOne({ _id: new ObjectId(id) });
    return serviceData ? new Service(serviceData) : null;
  }

  static async findByWorkerId(workerId) {
    const collection = Service.getCollection();
    const id = typeof workerId === 'string' ? new ObjectId(workerId) : workerId;
    const cursor = collection.find({ workerId: id });
    const services = await cursor.toArray();
    return services.map(serviceData => new Service(serviceData));
  }

  static async findByCategory(category) {
    const collection = Service.getCollection();
    const cursor = collection.find({ category });
    const services = await cursor.toArray();
    return services.map(serviceData => new Service(serviceData));
  }

  static async findAvailable() {
    const collection = Service.getCollection();
    const cursor = collection.find({ status: SERVICE_STATUS.AVAILABLE });
    const services = await cursor.toArray();
    return services.map(serviceData => new Service(serviceData));
  }

  static async create(serviceData) {
    const service = new Service(serviceData);
    return await service.save();
  }

  static async update(id, updateData) {
    const collection = Service.getCollection();
    updateData.updatedAt = new Date();

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    return result.value ? new Service(result.value) : null;
  }

  static async delete(id) {
    const collection = Service.getCollection();
    const result = await collection.findOneAndDelete({ _id: new ObjectId(id) });
    return result.value ? new Service(result.value) : null;
  }

  static async updateStatus(id, status) {
    const collection = Service.getCollection();
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    return result.value ? new Service(result.value) : null;
  }

  toObject() {
    const obj = {
      title: this.title,
      description: this.description,
      category: this.category,
      price: this.price,
      status: this.status,
      workerId: this.workerId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };

    if (this._id) {
      obj._id = this._id;
    }

    return obj;
  }
}

module.exports = Service;
