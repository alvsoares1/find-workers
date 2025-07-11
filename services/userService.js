const User = require('../models/User');
const userService = {
    async findAll() {
        try {
            return await User.find();
        } catch (error) {
            throw new Error(`Erro ao buscar usuários: ${error.message}`);
        }
    },
    async findById(id) {
        try {
            return await User.findById(id);
        } catch (error) {
            throw new Error(`Erro ao buscar usuário: ${error.message}`);
        }
    },
    async findByEmail(email) {
        try {
            return await User.findOne({ email: email.toLowerCase() });
        } catch (error) {
            throw new Error(`Erro ao buscar usuário por email: ${error.message}`);
        }
    },
    async create(userData) {
        try {
            const user = new User(userData);
            return await user.save();
        } catch (error) {
            if (error.message.includes('Email já está em uso')) {
                throw new Error('Email já está em uso');
            }
            throw new Error(`Erro ao criar usuário: ${error.message}`);
        }
    },
    async update(id, updateData) {
        try {
            return await User.findByIdAndUpdate(id, updateData);
        } catch (error) {
            throw new Error(`Erro ao atualizar usuário: ${error.message}`);
        }
    },
    async emailExists(email) {
        try {
            const user = await User.findOne({ email: email.toLowerCase() });
            return !!user;
        } catch (error) {
            throw new Error(`Erro ao verificar email: ${error.message}`);
        }
    }
};
module.exports = userService;
