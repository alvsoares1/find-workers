// Modelo Request.js - Estrutura básica sem implementação do banco
// TODO: Implementar conexão com banco de dados quando necessário

class Request {
    constructor(requestData) {
        this.clientId = requestData.clientId;
        this.serviceId = requestData.serviceId;
        this.status = requestData.status || 'pendente';
        this.description = requestData.description;
        this.createdAt = requestData.createdAt || new Date();
        this.updatedAt = requestData.updatedAt || new Date();
        this._id = requestData._id;
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
            clientId: this.clientId,
            serviceId: this.serviceId,
            status: this.status,
            description: this.description,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Request;
