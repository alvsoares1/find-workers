// Find Workers - Service Details JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupAutoAlerts();
});

// Inicializar página
function initializePage() {
    animateContent();
    initializeForms();
}

// Animação do conteúdo
function animateContent() {
    const elements = document.querySelectorAll('.card, .review-item');
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        setTimeout(() => {
            element.style.transition = 'all 0.5s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Inicializar formulários
function initializeForms() {
    const requestServiceForm = document.getElementById('requestServiceForm');
    if (requestServiceForm) {
        requestServiceForm.addEventListener('submit', handleRequestService);
    }
}

// Solicitar serviço
function requestService() {
    // Preencher dados do modal (usando dados da página ou mock)
    const serviceTitle = document.querySelector('.card-header h4').textContent.trim();
    const servicePrice = document.querySelector('.text-success').textContent.trim();
    const workerName = document.querySelector('.card-body h5')?.textContent.trim() || 'João Silva';
    
    document.getElementById('requestServiceTitle').textContent = serviceTitle;
    document.getElementById('requestServicePrice').textContent = servicePrice;
    document.getElementById('requestServiceWorker').textContent = workerName;
    
    // Mostrar modal
    new bootstrap.Modal(document.getElementById('requestServiceModal')).show();
}

// Manipular solicitação de serviço
async function handleRequestService(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';

        const formData = {
            serviceId: window.location.pathname.split('/').pop(), // Pegar ID da URL
            description: document.getElementById('requestDescription').value,
            preferredDate: document.getElementById('requestDate').value
        };

        // Mock da resposta - em produção seria uma chamada real à API
        await mockApiCall('/api/requests', 'POST', formData);
        
        showAlert('success', 'Solicitação enviada com sucesso! O prestador será notificado.');
        
        // Fechar modal e limpar formulário
        bootstrap.Modal.getInstance(document.getElementById('requestServiceModal')).hide();
        e.target.reset();

    } catch (error) {
        showAlert('danger', 'Erro ao enviar solicitação. Tente novamente.');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

// Ver perfil do trabalhador
function viewWorkerProfile() {
    // Mock - em produção redirecionaria para o perfil real
    const workerId = 'mock-worker-id';
    showAlert('info', 'Redirecionando para o perfil do trabalhador...');
    
    setTimeout(() => {
        window.location.href = `/workers/${workerId}`;
    }, 1500);
}

// Enviar mensagem
function sendMessage() {
    // Mock - em produção abriria um modal de mensagem ou redirecionaria
    showAlert('info', 'Abrindo conversa com o prestador...');
    
    setTimeout(() => {
        window.location.href = '/messages?new=true';
    }, 1500);
}

// Setup auto-dismiss para alertas
function setupAutoAlerts() {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
}

// Mostrar alertas
function showAlert(type, message) {
    const alertContainer = document.querySelector('.main-content');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.insertBefore(alert, alertContainer.firstChild);
    
    // Auto-dismiss após 5 segundos
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
    }, 5000);
}

// Mock de chamada da API
function mockApiCall(url, method, data) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simular 90% de sucesso
            if (Math.random() > 0.1) {
                resolve({ success: true, data });
            } else {
                reject(new Error('Mock API error'));
            }
        }, 1000 + Math.random() * 1000);
    });
}

// CSS adicional para avatar pequeno
const style = document.createElement('style');
style.textContent = `
    .user-avatar-small {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 1.1rem;
    }
    
    .review-item {
        transition: all 0.3s ease;
    }
    
    .review-item:hover {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 15px !important;
        margin: -10px;
    }
    
    .service-item {
        transition: all 0.3s ease;
        cursor: pointer;
    }
    
    .service-item:hover {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 10px;
        margin: -5px;
    }
`;
document.head.appendChild(style);
