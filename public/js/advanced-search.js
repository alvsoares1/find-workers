// Find Workers - Advanced Search JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeAdvancedSearch();
    setupEventListeners();
    loadInitialResults();
    animatePage();
});

// Estado da busca
let currentSearch = {
    filters: {},
    results: [],
    currentPage: 1,
    totalPages: 1,
    viewMode: 'list'
};

// Inicializar busca avançada
function initializeAdvancedSearch() {
    setupRatingSlider();
    setupMultiSelect();
    restoreSearchFromURL();
}

// Configurar slider de avaliação
function setupRatingSlider() {
    const ratingSlider = document.getElementById('minRating');
    const ratingDisplay = document.getElementById('ratingDisplay');
    
    ratingSlider.addEventListener('input', function() {
        const value = parseFloat(this.value);
        ratingDisplay.innerHTML = `<i class="fas fa-star"></i> ${value}+`;
        ratingDisplay.className = `badge ${value > 0 ? 'bg-warning text-dark' : 'bg-secondary'}`;
    });
}

// Configurar select múltiplo
function setupMultiSelect() {
    const categorySelect = document.getElementById('categoryFilter');
    
    // Adicionar visual feedback para seleção múltipla
    categorySelect.addEventListener('change', function() {
        const selectedCount = Array.from(this.selectedOptions).length;
        const label = this.previousElementSibling;
        
        if (selectedCount > 0) {
            label.textContent = `Categoria (${selectedCount} selecionadas)`;
        } else {
            label.textContent = 'Categoria';
        }
    });
}

// Configurar event listeners
function setupEventListeners() {
    const form = document.getElementById('advancedSearchForm');
    form.addEventListener('submit', handleAdvancedSearch);
    
    // View mode toggles
    document.getElementById('viewGrid').addEventListener('click', () => setViewMode('grid'));
    document.getElementById('viewList').addEventListener('click', () => setViewMode('list'));
    
    // Auto-search quando filtros mudam
    const autoSearchInputs = form.querySelectorAll('input, select');
    autoSearchInputs.forEach(input => {
        input.addEventListener('change', debounce(() => {
            if (input.type !== 'text') {
                handleAdvancedSearch({ preventDefault: () => {} });
            }
        }, 500));
        
        if (input.type === 'text') {
            input.addEventListener('input', debounce(() => {
                handleAdvancedSearch({ preventDefault: () => {} });
            }, 1000));
        }
    });
}

// Manipular busca avançada
async function handleAdvancedSearch(e) {
    e.preventDefault();
    
    const filters = collectFilters();
    currentSearch.filters = filters;
    currentSearch.currentPage = 1;
    
    showLoadingState();
    
    try {
        const results = await performSearch(filters);
        displayResults(results);
        updateURL(filters);
        
    } catch (error) {
        showError('Erro ao realizar busca. Tente novamente.');
    }
}

// Coletar filtros do formulário
function collectFilters() {
    const form = document.getElementById('advancedSearchForm');
    const formData = new FormData(form);
    
    return {
        searchText: document.getElementById('searchText').value.trim(),
        searchIn: {
            title: document.getElementById('searchTitle').checked,
            description: document.getElementById('searchDescription').checked,
            tags: document.getElementById('searchTags').checked
        },
        categories: Array.from(document.getElementById('categoryFilter').selectedOptions).map(o => o.value),
        priceMin: parseFloat(document.getElementById('priceMin').value) || null,
        priceMax: parseFloat(document.getElementById('priceMax').value) || null,
        location: document.getElementById('location').value.trim(),
        distance: document.getElementById('distance').value,
        minRating: parseFloat(document.getElementById('minRating').value),
        availableOnly: document.getElementById('availableOnly').checked,
        urgentAvailable: document.getElementById('urgentAvailable').checked,
        negotiablePrice: document.getElementById('negotiablePrice').checked,
        allowsScheduling: document.getElementById('allowsScheduling').checked,
        sortBy: document.getElementById('sortBy').value
    };
}

// Realizar busca (mock)
async function performSearch(filters) {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
    
    // Mock de resultados
    const mockResults = generateMockResults(filters);
    
    currentSearch.results = mockResults.services;
    currentSearch.totalPages = Math.ceil(mockResults.total / 12);
    
    return mockResults;
}

// Gerar resultados mock
function generateMockResults(filters) {
    const allServices = [
        {
            id: '1',
            title: 'Instalação Elétrica Residencial',
            description: 'Serviço completo de instalação elétrica para residências',
            category: 'Elétrica',
            price: 150.00,
            rating: 4.8,
            reviewCount: 23,
            worker: { name: 'João Silva', avatar: 'J' },
            location: 'São Paulo, SP',
            distance: 5.2,
            isAvailable: true,
            tags: ['residencial', 'instalação', 'segurança'],
            urgent: true,
            negotiable: false
        },
        {
            id: '2',
            title: 'Pintura de Apartamentos',
            description: 'Pintura profissional para apartamentos e casas',
            category: 'Pintura',
            price: 80.00,
            rating: 4.6,
            reviewCount: 31,
            worker: { name: 'Maria Santos', avatar: 'M' },
            location: 'Rio de Janeiro, RJ',
            distance: 12.5,
            isAvailable: true,
            tags: ['pintura', 'apartamento', 'qualidade'],
            urgent: false,
            negotiable: true
        },
        {
            id: '3',
            title: 'Reparo Hidráulico',
            description: 'Conserto de vazamentos e instalação de tubulações',
            category: 'Hidráulica',
            price: 120.00,
            rating: 4.9,
            reviewCount: 18,
            worker: { name: 'Carlos Oliveira', avatar: 'C' },
            location: 'Belo Horizonte, MG',
            distance: 8.3,
            isAvailable: true,
            tags: ['hidráulica', 'vazamento', 'urgente'],
            urgent: true,
            negotiable: false
        },
        {
            id: '4',
            title: 'Jardinagem e Paisagismo',
            description: 'Criação e manutenção de jardins residenciais',
            category: 'Jardinagem',
            price: 200.00,
            rating: 4.7,
            reviewCount: 15,
            worker: { name: 'Ana Costa', avatar: 'A' },
            location: 'Curitiba, PR',
            distance: 25.1,
            isAvailable: false,
            tags: ['jardim', 'paisagismo', 'plantas'],
            urgent: false,
            negotiable: true
        },
        {
            id: '5',
            title: 'Marcenaria Personalizada',
            description: 'Móveis sob medida e reformas em madeira',
            category: 'Marcenaria',
            price: 300.00,
            rating: 4.9,
            reviewCount: 27,
            worker: { name: 'Pedro Almeida', avatar: 'P' },
            location: 'Porto Alegre, RS',
            distance: 45.0,
            isAvailable: true,
            tags: ['marcenaria', 'móveis', 'personalizado'],
            urgent: false,
            negotiable: true
        }
    ];
    
    // Aplicar filtros
    let filtered = allServices.filter(service => {
        // Filtro de texto
        if (filters.searchText) {
            const searchLower = filters.searchText.toLowerCase();
            const matchTitle = filters.searchIn.title && service.title.toLowerCase().includes(searchLower);
            const matchDescription = filters.searchIn.description && service.description.toLowerCase().includes(searchLower);
            const matchTags = filters.searchIn.tags && service.tags.some(tag => tag.toLowerCase().includes(searchLower));
            
            if (!matchTitle && !matchDescription && !matchTags) return false;
        }
        
        // Filtro de categoria
        if (filters.categories.length > 0 && !filters.categories.includes(service.category)) {
            return false;
        }
        
        // Filtro de preço
        if (filters.priceMin !== null && service.price < filters.priceMin) return false;
        if (filters.priceMax !== null && service.price > filters.priceMax) return false;
        
        // Filtro de avaliação
        if (service.rating < filters.minRating) return false;
        
        // Filtro de disponibilidade
        if (filters.availableOnly && !service.isAvailable) return false;
        
        // Filtro de urgência
        if (filters.urgentAvailable && !service.urgent) return false;
        
        // Filtro de negociação
        if (filters.negotiablePrice && !service.negotiable) return false;
        
        // Filtro de distância
        if (filters.distance && service.distance > parseFloat(filters.distance)) return false;
        
        return true;
    });
    
    // Aplicar ordenação
    filtered = sortResults(filtered, filters.sortBy);
    
    return {
        services: filtered,
        total: filtered.length,
        filters: filters
    };
}

// Ordenar resultados
function sortResults(services, sortBy) {
    switch (sortBy) {
        case 'price_asc':
            return services.sort((a, b) => a.price - b.price);
        case 'price_desc':
            return services.sort((a, b) => b.price - a.price);
        case 'rating':
            return services.sort((a, b) => b.rating - a.rating);
        case 'newest':
            return services.sort((a, b) => b.id - a.id);
        case 'popular':
            return services.sort((a, b) => b.reviewCount - a.reviewCount);
        default: // relevance
            return services;
    }
}

// Exibir resultados
function displayResults(results) {
    const container = document.getElementById('searchResults');
    const countElement = document.getElementById('resultsCount');
    
    // Atualizar contador
    countElement.textContent = `${results.total} serviço${results.total !== 1 ? 's' : ''} encontrado${results.total !== 1 ? 's' : ''}`;
    
    if (results.services.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h4>Nenhum serviço encontrado</h4>
                <p>Tente ajustar os filtros ou ampliar os critérios de busca.</p>
                <button class="btn btn-primary" onclick="clearAdvancedFilters()">
                    <i class="fas fa-times me-2"></i>Limpar Filtros
                </button>
            </div>
        `;
        return;
    }
    
    // Renderizar serviços
    if (currentSearch.viewMode === 'grid') {
        renderGridView(results.services, container);
    } else {
        renderListView(results.services, container);
    }
    
    generatePagination();
}

// Renderizar visualização em grade
function renderGridView(services, container) {
    container.innerHTML = `
        <div class="row">
            ${services.map(service => `
                <div class="col-md-6 col-lg-4 mb-4 animate-fade-in-up">
                    <div class="card service-card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">${service.title}</h6>
                            <span class="badge category-${service.category.toLowerCase()}">${service.category}</span>
                        </div>
                        <div class="card-body">
                            <p class="text-muted mb-3">${service.description}</p>
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="service-price-small">R$ ${service.price.toFixed(2)}</span>
                                <div class="service-rating">
                                    ${'<i class="fas fa-star"></i>'.repeat(Math.floor(service.rating))}
                                    ${service.rating % 1 ? '<i class="fas fa-star-half-alt"></i>' : ''}
                                    <small class="text-muted">(${service.reviewCount})</small>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">
                                    <i class="fas fa-user me-1"></i>${service.worker.name}
                                </small>
                                <small class="text-muted">
                                    <i class="fas fa-map-marker-alt me-1"></i>${service.distance} km
                                </small>
                            </div>
                        </div>
                        <div class="card-footer">
                            <button class="btn btn-primary w-100" onclick="requestService('${service.id}')">
                                <i class="fas fa-paper-plane me-2"></i>Solicitar
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Renderizar visualização em lista
function renderListView(services, container) {
    container.innerHTML = services.map(service => `
        <div class="card mb-3 animate-fade-in-up">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <div class="d-flex align-items-center mb-2">
                            <h5 class="mb-0 me-3">${service.title}</h5>
                            <span class="badge category-${service.category.toLowerCase()} me-2">${service.category}</span>
                            ${!service.isAvailable ? '<span class="badge bg-secondary">Indisponível</span>' : ''}
                            ${service.urgent ? '<span class="badge bg-warning text-dark">Urgente</span>' : ''}
                            ${service.negotiable ? '<span class="badge bg-info">Negociável</span>' : ''}
                        </div>
                        <p class="text-muted mb-2">${service.description}</p>
                        <div class="d-flex align-items-center gap-3">
                            <div class="service-rating">
                                ${'<i class="fas fa-star"></i>'.repeat(Math.floor(service.rating))}
                                ${service.rating % 1 ? '<i class="fas fa-star-half-alt"></i>' : ''}
                                <small class="text-muted">(${service.reviewCount} avaliações)</small>
                            </div>
                            <small class="text-muted">
                                <i class="fas fa-user me-1"></i>${service.worker.name}
                            </small>
                            <small class="text-muted">
                                <i class="fas fa-map-marker-alt me-1"></i>${service.location} (${service.distance} km)
                            </small>
                        </div>
                    </div>
                    <div class="col-md-4 text-md-end">
                        <div class="mb-2">
                            <span class="service-price">R$ ${service.price.toFixed(2)}</span>
                        </div>
                        <div class="service-actions">
                            <button class="btn btn-outline-primary btn-sm" onclick="viewServiceDetails('${service.id}')">
                                <i class="fas fa-eye me-1"></i>Ver Detalhes
                            </button>
                            ${service.isAvailable ? 
                                `<button class="btn btn-primary btn-sm" onclick="requestService('${service.id}')">
                                    <i class="fas fa-paper-plane me-1"></i>Solicitar
                                </button>` : 
                                `<button class="btn btn-secondary btn-sm" disabled>
                                    <i class="fas fa-ban me-1"></i>Indisponível
                                </button>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Gerar paginação
function generatePagination() {
    const container = document.getElementById('pagination');
    const totalPages = currentSearch.totalPages;
    const currentPage = currentSearch.currentPage;
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let pagination = '';
    
    // Botão anterior
    pagination += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Páginas
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        pagination += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }
    
    // Botão próximo
    pagination += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
    
    container.innerHTML = pagination;
}

// Mudar página
function changePage(page) {
    if (page < 1 || page > currentSearch.totalPages) return;
    
    currentSearch.currentPage = page;
    performSearch(currentSearch.filters).then(displayResults);
}

// Alterar modo de visualização
function setViewMode(mode) {
    currentSearch.viewMode = mode;
    
    // Atualizar botões
    document.getElementById('viewGrid').classList.toggle('active', mode === 'grid');
    document.getElementById('viewList').classList.toggle('active', mode === 'list');
    
    // Re-renderizar resultados
    if (currentSearch.results.length > 0) {
        displayResults({ services: currentSearch.results, total: currentSearch.results.length });
    }
}

// Limpar filtros avançados
function clearAdvancedFilters() {
    document.getElementById('advancedSearchForm').reset();
    document.getElementById('minRating').value = 0;
    document.getElementById('ratingDisplay').innerHTML = '<i class="fas fa-star"></i> 0+';
    document.getElementById('ratingDisplay').className = 'badge bg-secondary';
    
    // Resetar label da categoria
    document.querySelector('label[for="categoryFilter"]').textContent = 'Categoria';
    
    handleAdvancedSearch({ preventDefault: () => {} });
}

// Salvar busca
function saveSearch() {
    new bootstrap.Modal(document.getElementById('saveSearchModal')).show();
}

// Confirmar salvamento da busca
async function confirmSaveSearch() {
    const name = document.getElementById('searchName').value.trim();
    const emailNotifications = document.getElementById('emailNotifications').checked;
    
    if (!name) {
        showError('Por favor, insira um nome para a busca.');
        return;
    }
    
    try {
        await mockApiCall('/api/saved-searches', 'POST', {
            name,
            filters: currentSearch.filters,
            emailNotifications
        });
        
        bootstrap.Modal.getInstance(document.getElementById('saveSearchModal')).hide();
        showSuccess('Busca salva com sucesso!');
        
    } catch (error) {
        showError('Erro ao salvar busca. Tente novamente.');
    }
}

// Carregar resultados iniciais
function loadInitialResults() {
    handleAdvancedSearch({ preventDefault: () => {} });
}

// Restaurar busca da URL
function restoreSearchFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    // Restauração de filtros da URL implementada acima
}

// Atualizar URL com filtros
function updateURL(filters) {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== '' && filters[key] !== 0) {
            if (Array.isArray(filters[key])) {
                if (filters[key].length > 0) {
                    params.append(key, filters[key].join(','));
                }
            } else if (typeof filters[key] === 'object') {
                // Para searchIn object
                const activeSearchIn = Object.keys(filters[key]).filter(k => filters[key][k]);
                if (activeSearchIn.length > 0) {
                    params.append(key, activeSearchIn.join(','));
                }
            } else {
                params.append(key, filters[key]);
            }
        }
    });
    
    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newURL);
}

// Estado de carregamento
function showLoadingState() {
    document.getElementById('searchResults').innerHTML = `
        <div class="text-center py-5">
            <div class="loading-spinner"></div>
            <p class="mt-3 text-muted">Buscando serviços...</p>
        </div>
    `;
}

// Animar página
function animatePage() {
    const elements = document.querySelectorAll('.card, .form-group');
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        setTimeout(() => {
            element.style.transition = 'all 0.5s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

// Funções utilitárias
function viewServiceDetails(serviceId) {
    window.location.href = `/services/${serviceId}`;
}

function requestService(serviceId) {
    window.location.href = `/services/${serviceId}#request`;
}

function showSuccess(message) {
    showAlert('success', message);
}

function showError(message) {
    showAlert('danger', message);
}

function showAlert(type, message) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
    }, 5000);
}

function mockApiCall(url, method, data) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.1) {
                resolve({ success: true, data });
            } else {
                reject(new Error('Mock API error'));
            }
        }, 500);
    });
}

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
