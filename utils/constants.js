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

module.exports = {
    USER_TYPES,
    REQUEST_STATUS,
    SERVICE_STATUS,
    isValidUserType,
    isValidRequestStatus,
    isValidServiceStatus
};
