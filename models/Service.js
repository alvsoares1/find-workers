// Modelo Service.js - Estrutura básica sem implementação do banco
// TODO: Implementar conexão com banco de dados quando necessário

class Service {
    constructor(serviceData) {
        this.title = serviceData.title;
        this.description = serviceData.description;
        this.price = serviceData.price;
        this.workerId = serviceData.workerId;
        this.category = serviceData.category;
        this.status = serviceData.status || 'disponível';
        this.createdAt = serviceData.createdAt || new Date();
        this.updatedAt = serviceData.updatedAt || new Date();
        this._id = serviceData._id;
    }

    // Método estático que retorna dados mockados para desenvolvimento
    static async find(query = {}) {
        // Retorna array vazio por padrão - será mockado onde necessário
        return [];
    }

    static async findById(id) {
        return null;
    }

    static async findOne(query) {
        return null;
    }

    async save() {
        // TODO: Implementar salvamento no banco
        return this;
    }

    toObject() {
        return {
            _id: this._id,
            title: this.title,
            description: this.description,
            price: this.price,
            workerId: this.workerId,
            category: this.category,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Service;
