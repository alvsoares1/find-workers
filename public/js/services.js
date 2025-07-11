// Find Workers - Services JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeFilters();
    initializeForms();
    animateCards();
    setupAutoAlerts();
});

// Inicializar filtros
function initializeFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    const searchFilter = document.getElementById('searchFilter');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
    if (priceFilter) {
        priceFilter.addEventListener('change', applyFilters);
    }
    if (searchFilter) {
        searchFilter.addEventListener('input', debounce(applyFilters, 300));
    }
}

// Aplicar filtros
function applyFilters() {
    const categoryFilter = document.getElementById('categoryFilter').value.toLowerCase();
    const priceFilter = document.getElementById('priceFilter').value;
    const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
    
    const serviceCards = document.querySelectorAll('.service-card');
    let visibleCount = 0;

    serviceCards.forEach(card => {
        let visible = true;

        // Filtro de categoria
        if (categoryFilter && card.dataset.category.toLowerCase() !== categoryFilter) {
            visible = false;
        }

        // Filtro de preço
        if (priceFilter && visible) {
            const price = parseFloat(card.dataset.price);
            const [min, max] = priceFilter.split('-').map(p => p === '+' ? Infinity : parseFloat(p.replace('+', '')));
            
            if (priceFilter === '0-50' && (price < 0 || price > 50)) visible = false;
            else if (priceFilter === '50-100' && (price < 50 || price > 100)) visible = false;
            else if (priceFilter === '100-200' && (price < 100 || price > 200)) visible = false;
            else if (priceFilter === '200+' && price < 200) visible = false;
        }

        // Filtro de busca
        if (searchFilter && visible) {
            if (!card.dataset.search.includes(searchFilter)) {
                visible = false;
            }
        }

        // Mostrar/esconder card
        if (visible) {
            card.style.display = 'block';
            card.style.animation = 'fadeInUp 0.5s ease';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    // Mostrar mensagem se nenhum resultado
    updateNoResultsMessage(visibleCount);
}

// Limpar filtros
function clearFilters() {
    document.getElementById('categoryFilter').value = '';
    document.getElementById('priceFilter').value = '';
    document.getElementById('searchFilter').value = '';
    
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.style.display = 'block';
    });
    
    // Remover mensagem de "nenhum resultado"
    const noResults = document.getElementById('noResultsMessage');
    if (noResults) {
        noResults.remove();
    }
}

// Atualizar mensagem de "nenhum resultado"
function updateNoResultsMessage(visibleCount) {
    let noResults = document.getElementById('noResultsMessage');
    
    if (visibleCount === 0) {
        if (!noResults) {
            noResults = document.createElement('div');
            noResults.id = 'noResultsMessage';
            noResults.className = 'col-12';
            noResults.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">Nenhum serviço encontrado</h4>
                    <p class="text-muted">Tente ajustar os filtros ou buscar por outros termos.</p>
                    <button class="btn btn-outline-primary" onclick="clearFilters()">
                        <i class="fas fa-times me-2"></i>Limpar Filtros
                    </button>
                </div>
            `;
            document.getElementById('servicesList').appendChild(noResults);
        }
    } else if (noResults) {
        noResults.remove();
    }
}

// Inicializar formulários
function initializeForms() {
    const addServiceForm = document.getElementById('addServiceForm');
    const requestServiceForm = document.getElementById('requestServiceForm');

    if (addServiceForm) {
        addServiceForm.addEventListener('submit', handleAddService);
    }

    if (requestServiceForm) {
        requestServiceForm.addEventListener('submit', handleRequestService);
    }
}

// Manipular adição de serviço
async function handleAddService(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Salvando...';

        const formData = {
            title: document.getElementById('serviceTitle').value,
            description: document.getElementById('serviceDescription').value,
            category: document.getElementById('serviceCategory').value,
            price: parseFloat(document.getElementById('servicePrice').value),
            duration: document.getElementById('serviceDuration').value,
            tags: document.getElementById('serviceTags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
        };

        // Mock da resposta - em produção seria uma chamada real à API
        await mockApiCall('/api/services', 'POST', formData);
        
        showAlert('success', 'Serviço adicionado com sucesso!');
        
        // Fechar modal e limpar formulário
        bootstrap.Modal.getInstance(document.getElementById('addServiceModal')).hide();
        e.target.reset();
        
        // Simular reload da página para mostrar o novo serviço
        setTimeout(() => {
            window.location.reload();
        }, 1500);

    } catch (error) {
        showAlert('danger', 'Erro ao adicionar serviço. Tente novamente.');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
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
            serviceId: document.getElementById('requestServiceId').value,
            description: document.getElementById('requestDescription').value,
            preferredDate: document.getElementById('requestDate').value
        };

        // Chamada real para a API
        const response = await fetch('/requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        
        showAlert('success', 'Solicitação enviada com sucesso!');
        
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

// Solicitar serviço
function requestService(serviceId) {
    // Buscar dados do serviço (mock)
    const serviceCard = document.querySelector(`[data-service-id="${serviceId}"]`) || 
                       document.querySelector('.service-card'); // Fallback para demo
    
    if (serviceCard) {
        const title = serviceCard.querySelector('.card-header h6').textContent;
        const price = serviceCard.querySelector('.text-success').textContent;
        const worker = serviceCard.querySelector('.card-body span').textContent;

        // Preencher modal
        document.getElementById('requestServiceId').value = serviceId;
        document.getElementById('requestServiceTitle').textContent = title;
        document.getElementById('requestServicePrice').textContent = price;
        document.getElementById('requestServiceWorker').textContent = worker || 'João Silva'; // Mock

        // Mostrar modal
        new bootstrap.Modal(document.getElementById('requestServiceModal')).show();
    }
}

// Editar serviço
function editService(serviceId) {
    // Redirecionar para a página de edição
    window.location.href = `/services/${serviceId}/edit`;
}

// Alternar disponibilidade do serviço
async function toggleServiceAvailability(serviceId, newStatus) {    
    try {
        const status = newStatus ? 'disponível' : 'indisponível';
        
        const response = await fetch(`/services/${serviceId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ status: status })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        await response.json();
        
        showAlert('success', `Serviço ${newStatus ? 'ativado' : 'pausado'} com sucesso!`);
        
        setTimeout(() => {
            window.location.reload();
        }, 1500);

    } catch (error) {
        showAlert('danger', 'Erro ao alterar status do serviço.');
    }
}

// Deletar serviço
async function deleteService(serviceId) {
    if (confirm('Tem certeza que deseja excluir este serviço?\n\nEsta ação não pode ser desfeita e todas as solicitações relacionadas serão canceladas.')) {
        try {
            const response = await fetch(`/services/${serviceId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            
            showAlert('success', 'Serviço excluído com sucesso!');
            
            // Recarregar a página para mostrar as mudanças
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error) {
            showAlert('danger', 'Erro ao excluir serviço.');
        }
    }
}

// Animação das cards
function animateCards() {
    const cards = document.querySelectorAll('.service-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
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
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
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

// Função debounce para otimizar busca
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// CSS para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .service-card {
        transition: all 0.3s ease;
    }
    
    .service-card:hover {
        transform: translateY(-2px);
    }
`;
document.head.appendChild(style);
