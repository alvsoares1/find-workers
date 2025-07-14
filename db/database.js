const { MongoClient } = require('mongodb');
const Logger = require('../utils/logger');

let db = null;
let client = null;

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/find-workers';
        
        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxIdleTimeMS: 30000,
            retryWrites: true,
            w: 'majority'
        };
        
        client = new MongoClient(mongoURI, options);
        await client.connect();
        
        // Testar a conexão
        await client.db().admin().ping();
        
        db = client.db();
        Logger.success(`MongoDB conectado: ${mongoURI.split('@')[1] || mongoURI}`);
        
        await createIndexes();
        
        return db;
    } catch (error) {
        Logger.error('Erro ao conectar ao MongoDB:', error);
        throw error;
    }
};

const createIndexes = async () => {
    try {
        // Índices para a coleção users
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ userType: 1 });
        
        // Índices para a coleção services
        await db.collection('services').createIndex({ workerId: 1 });
        await db.collection('services').createIndex({ category: 1 });
        await db.collection('services').createIndex({ 
            title: 'text', 
            description: 'text' 
        });
        
        // Índices para a coleção requests
        await db.collection('requests').createIndex({ clientId: 1 });
        await db.collection('requests').createIndex({ serviceId: 1 });
        await db.collection('requests').createIndex({ status: 1 });
        await db.collection('requests').createIndex({ createdAt: -1 });
        
        Logger.success('Índices do banco criados com sucesso');
    } catch (error) {
        Logger.error('Erro ao criar índices:', error);
    }
};

const getDB = () => {
    if (!db) {
        throw new Error('Database não foi inicializado. Chame connectDB() primeiro.');
    }
    return db;
};

const closeDB = async () => {
    try {
        if (client) {
            await client.close();
            db = null;
            client = null;
            Logger.info('Conexão com MongoDB fechada');
        }
    } catch (error) {
        Logger.error('Erro ao fechar conexão com MongoDB:', error);
    }
};

// Monitorar eventos de conexão
const setupConnectionEvents = () => {
    if (client) {
        client.on('error', (error) => {
            Logger.error('Erro de conexão MongoDB:', error);
        });
        
        client.on('close', () => {
            Logger.warn('Conexão MongoDB fechada');
        });
        
        client.on('reconnect', () => {
            Logger.info('Reconectado ao MongoDB');
        });
    }
};

module.exports = {
    connectDB,
    getDB,
    closeDB,
    setupConnectionEvents
};

process.on('SIGINT', async () => {
    Logger.info('Fechando conexão MongoDB...');
    await closeDB();
    process.exit(0);
});

module.exports = { connectDB, getDB, closeDB };
