const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const { getDB } = require('../db/database');
const Validator = require('../utils/validator');
const Logger = require('../utils/logger');

class User {
    constructor(userData) {
        this.name = Validator.sanitizeString(userData.name);
        this.email = userData.email ? userData.email.toLowerCase().trim() : null;
        this.password = userData.password;
        this.userType = userData.userType;
        this.phone = userData.phone ? Validator.sanitizeString(userData.phone) : null;
        this.createdAt = userData.createdAt || new Date();
        this.updatedAt = userData.updatedAt || new Date();
        this.rating = userData.rating || {
            average: 0,
            totalRatings: 0
        };
        
        if (userData._id) {
            this._id = new ObjectId(userData._id);
        }
    }

    static getCollection() {
        return getDB().collection('users');
    }

    async save() {
        try {
            const collection = User.getCollection();
            
            // Validar dados antes de salvar
            const validation = Validator.validateUser(this);
            if (!validation.isValid) {
                throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
            }
            
            if (!this._id) {
                // Novo usuário
                await this.checkEmailExists();
                this.password = await bcrypt.hash(this.password, 12);
                this.createdAt = new Date();
                this.updatedAt = new Date();
                
                const result = await collection.insertOne(this.toObject());
                this._id = result.insertedId;
                
                Logger.info(`Novo usuário criado: ${this.email} (${this.userType})`);
            } else {
                // Atualizar usuário existente
                this.updatedAt = new Date();
                if (this.password && !this.password.startsWith('$2a$')) {
                    this.password = await bcrypt.hash(this.password, 12);
                }
                
                await collection.updateOne(
                    { _id: this._id },
                    { $set: this.toObject() }
                );
                
                Logger.info(`Usuário atualizado: ${this.email}`);
            }
            
            return this;
        } catch (error) {
            Logger.error('Erro ao salvar usuário:', error);
            throw error;
        }
    }

    async comparePassword(candidatePassword) {
        try {
            return await bcrypt.compare(candidatePassword, this.password);
        } catch (error) {
            Logger.error('Erro ao comparar senha:', error);
            return false;
        }
    }

    async checkEmailExists() {
        const collection = User.getCollection();
        const existingUser = await collection.findOne({ email: this.email });
        if (existingUser) {
            throw new Error('Email já está em uso');
        }
    }

    toObject() {
        const obj = {
            name: this.name,
            email: this.email,
            userType: this.userType,
            phone: this.phone,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            rating: this.rating
        };
        
        // Incluir senha apenas se necessário
        if (this.password) {
            obj.password = this.password;
        }
        
        if (this._id) {
            obj._id = this._id;
        }
        
        return obj;
    }

    // Método para retornar dados públicos (sem senha)
    toPublicObject() {
        return {
            _id: this._id,
            name: this.name,
            email: this.email,
            userType: this.userType,
            phone: this.phone,
            createdAt: this.createdAt,
            rating: this.rating
        };
    }

    toJSON() {
        const obj = this.toObject();
        delete obj.password;
        return obj;
    }

    static async findById(id) {
        const collection = User.getCollection();
        const userData = await collection.findOne({ _id: new ObjectId(id) });
        return userData ? new User(userData) : null;
    }

    static async findOne(query) {
        const collection = User.getCollection();
        const userData = await collection.findOne(query);
        return userData ? new User(userData) : null;
    }

    static async find(query = {}, options = {}) {
        const collection = User.getCollection();
        const cursor = collection.find(query, options);
        const users = await cursor.toArray();
        return users.map(userData => new User(userData));
    }

    static async findByIdAndUpdate(id, update, options = {}) {
        const collection = User.getCollection();
        update.updatedAt = new Date();
        
        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: update },
            { returnDocument: 'after', ...options }
        );
        
        return result.value ? new User(result.value) : null;
    }

    static async findByIdAndDelete(id) {
        const collection = User.getCollection();
        const result = await collection.findOneAndDelete({ _id: new ObjectId(id) });
        return result.value ? new User(result.value) : null;
    }
}

module.exports = User;
