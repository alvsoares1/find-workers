/**
 * Utilitários para validação de dados
 */

class Validator {
    static isEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static isPhone(phone) {
        if (!phone) return true; // Campo opcional
        
        // Remove caracteres não numéricos
        const cleanPhone = phone.replace(/\D/g, '');
        
        // Aceita telefones brasileiros (10 ou 11 dígitos)
        return cleanPhone.length >= 10 && cleanPhone.length <= 11;
    }

    static isStrongPassword(password) {
        if (!password || password.length < 6) return false;
        
        // Pelo menos uma letra e um número
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        
        return hasLetter && hasNumber;
    }

    static sanitizeString(str) {
        if (typeof str !== 'string') return '';
        
        return str
            .trim()
            .replace(/[<>]/g, '') // Remove caracteres básicos de XSS
            .substring(0, 500); // Limita tamanho
    }

    static isValidUserType(userType) {
        return ['client', 'worker', 'admin'].includes(userType);
    }

    static isValidObjectId(id) {
        const objectIdPattern = /^[0-9a-fA-F]{24}$/;
        return objectIdPattern.test(id);
    }

    static validateUser(userData) {
        const errors = [];

        if (!userData.name || userData.name.trim().length < 2) {
            errors.push('Nome deve ter pelo menos 2 caracteres');
        }

        if (!userData.email || !this.isEmail(userData.email)) {
            errors.push('Email inválido');
        }

        if (!userData.password || !this.isStrongPassword(userData.password)) {
            errors.push('Senha deve ter pelo menos 6 caracteres, incluindo letras e números');
        }

        if (!this.isValidUserType(userData.userType)) {
            errors.push('Tipo de usuário deve ser "client", "worker" ou "admin"');
        }

        if (userData.phone && !this.isPhone(userData.phone)) {
            errors.push('Telefone inválido');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = Validator;
