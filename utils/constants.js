// Enum para tipos de usuário
const USER_TYPES = {
    CLIENT: 'client',
    WORKER: 'worker'
};

// Enum para status de solicitação
const REQUEST_STATUS = {
    PENDING: 'pendente',
    ACCEPTED: 'aceita',
    REJECTED: 'rejeitada',
    IN_PROGRESS: 'em_andamento',
    COMPLETED: 'concluida',
    CANCELLED: 'cancelada'
};

// Enum para status de serviço
const SERVICE_STATUS = {
    AVAILABLE: 'disponível',
    UNAVAILABLE: 'indisponível',
    PAUSED: 'pausado'
};

// Enum para tipos de transação
const TRANSACTION_TYPES = {
    PAYMENT: 'payment',
    RECEIPT: 'receipt'
};

// Enum para status de transação
const TRANSACTION_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};

// Enum para status de pagamento
const PAYMENT_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

const PAYMENT_METHODS = {
    PLATFORM: 'platform',
    CREDIT_CARD: 'credit_card',
    PIX: 'pix',
    BANK_TRANSFER: 'bank_transfer'
};

// Validar tipo de usuário
const isValidUserType = (userType) => {
    return Object.values(USER_TYPES).includes(userType);
};

// Validar status de solicitação
const isValidRequestStatus = (status) => {
    return Object.values(REQUEST_STATUS).includes(status);
};

// Validar status de serviço
const isValidServiceStatus = (status) => {
    return Object.values(SERVICE_STATUS).includes(status);
};

// Validar tipo de transação
const isValidTransactionType = (type) => {
    return Object.values(TRANSACTION_TYPES).includes(type);
};

// Validar status de transação
const isValidTransactionStatus = (status) => {
    return Object.values(TRANSACTION_STATUS).includes(status);
};

// Validar status de pagamento
const isValidPaymentStatus = (status) => {
    return Object.values(PAYMENT_STATUS).includes(status);
};

const isValidPaymentMethod = (method) => {
    return Object.values(PAYMENT_METHODS).includes(method);
};

module.exports = {
    USER_TYPES,
    REQUEST_STATUS,
    SERVICE_STATUS,
    TRANSACTION_TYPES,
    TRANSACTION_STATUS,
    PAYMENT_STATUS,
    PAYMENT_METHODS,
    isValidUserType,
    isValidRequestStatus,
    isValidServiceStatus,
    isValidTransactionType,
    isValidTransactionStatus,
    isValidPaymentStatus,
    isValidPaymentMethod
};
