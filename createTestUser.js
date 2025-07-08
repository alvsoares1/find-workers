/**
 * Script para criar usuário de teste
 * Execute: node createTestUser.js
 */

require('dotenv').config();
const { connectDB } = require('./db/database');
const bcrypt = require('bcryptjs');
const Logger = require('./utils/logger');

async function createTestUser() {
    try {
        const db = await connectDB();
        Logger.info('Conectado ao MongoDB');

        const collection = db.collection('users');

        // Dados do usuário de teste
        const testUsers = [
            {
                name: 'Cliente Teste',
                email: 'cliente@teste.com',
                password: await bcrypt.hash('123456', 12),
                userType: 'client',
                phone: '(11) 99999-9999',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Trabalhador Teste',
                email: 'trabalhador@teste.com',
                password: await bcrypt.hash('123456', 12),
                userType: 'worker',
                phone: '(11) 88888-8888',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        for (const userData of testUsers) {
            try {
                // Verificar se usuário já existe
                const existingUser = await collection.findOne({ email: userData.email });
                if (existingUser) {
                    Logger.warn(`Usuário já existe: ${userData.email}`);
                    continue;
                }

                // Inserir usuário
                await collection.insertOne(userData);
                Logger.success(`Usuário criado: ${userData.email} (${userData.userType})`);
            } catch (error) {
                Logger.error(`Erro ao criar usuário ${userData.email}:`, error);
            }
        }

        Logger.info('\n=== USUÁRIOS DE TESTE CRIADOS ===');
        Logger.info('Cliente:');
        Logger.info('  Email: cliente@teste.com');
        Logger.info('  Senha: 123456');
        Logger.info('');
        Logger.info('Trabalhador:');
        Logger.info('  Email: trabalhador@teste.com');
        Logger.info('  Senha: 123456');
        Logger.info('================================\n');

        Logger.success('Usuários de teste criados com sucesso!');
        Logger.info('Agora você pode fazer login em: http://localhost:3000/login');

    } catch (error) {
        Logger.error('Erro ao criar usuários de teste:', error);
    } finally {
        process.exit(0);
    }
}

createTestUser();
