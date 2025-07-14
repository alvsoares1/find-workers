document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupValidation();
    animateForm();
    setupAutoAlerts();
});

// Verificar se está editando baseado na URL
function isEditing() {
    return window.location.pathname.includes('/edit') || 
           window.location.pathname.includes('/update') ||
           document.querySelector('[data-editing="true"]');
}

// Inicializar formulário
function initializeForm() {
    const form = document.getElementById('serviceForm');
    
    if (form) {
        form.addEventListener('submit', handleSubmit);
    } else {
        }

    // Configurar tags input
    setupTagsInput();
    
    // Configurar preview de preço
    setupPricePreview();
    
    // Auto-save draft (mock)
    setupAutoSave();
}

// Configurar validação em tempo real
function setupValidation() {
    const form = document.getElementById('serviceForm');
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearValidationError);
    });
}

// Validar campo individual
function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    // Limpar estado anterior
    field.classList.remove('is-valid', 'is-invalid');
    
    // Validar campo
    if (!value && field.hasAttribute('required')) {
        field.classList.add('is-invalid');
        return false;
    }
    
    // Validações específicas
    if (field.id === 'servicePrice') {
        const price = parseFloat(value);
        if (isNaN(price) || price <= 0) {
            field.classList.add('is-invalid');
            return false;
        }
    }
    
    if (field.id === 'serviceTitle') {
        if (value.length < 5) {
            field.classList.add('is-invalid');
            field.parentElement.querySelector('.invalid-feedback').textContent = 
                'O título deve ter pelo menos 5 caracteres.';
            return false;
        }
    }
    
    if (field.id === 'serviceDescription') {
        if (value.length < 20) {
            field.classList.add('is-invalid');
            field.parentElement.querySelector('.invalid-feedback').textContent = 
                'A descrição deve ter pelo menos 20 caracteres.';
            return false;
        }
    }
    
    field.classList.add('is-valid');
    return true;
}

// Limpar erro de validação
function clearValidationError(e) {
    const field = e.target;
    if (field.classList.contains('is-invalid')) {
        field.classList.remove('is-invalid');
    }
}

// Configurar input de tags
function setupTagsInput() {
    const tagsInput = document.getElementById('serviceTags');
    if (!tagsInput) return;
    
    tagsInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Adicionar vírgula se não houver
            if (!this.value.endsWith(',') && this.value.trim()) {
                this.value += ', ';
            }
        }
    });
    
    tagsInput.addEventListener('blur', function() {
        // Limpar tags vazias e normalizar
        const tags = this.value.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag)
            .slice(0, 10); // Máximo 10 tags
        
        this.value = tags.join(', ');
        
        // Mostrar preview das tags
        showTagsPreview(tags);
    });
}

// Mostrar preview das tags
function showTagsPreview(tags) {
    let preview = document.getElementById('tagsPreview');
    if (!preview) {
        preview = document.createElement('div');
        preview.id = 'tagsPreview';
        preview.className = 'mt-2';
        document.getElementById('serviceTags').parentElement.appendChild(preview);
    }
    
    if (tags.length > 0) {
        preview.innerHTML = tags.map(tag => 
            `<span class="badge bg-primary me-1">#${tag}</span>`
        ).join('');
    } else {
        preview.innerHTML = '';
    }
}

// Configurar preview de preço
function setupPricePreview() {
    const priceInput = document.getElementById('servicePrice');
    const urgencyInput = document.getElementById('urgencyMultiplier');
    
    if (priceInput) {
        priceInput.addEventListener('input', updatePricePreview);
    }
    
    if (urgencyInput) {
        urgencyInput.addEventListener('input', updatePricePreview);
    }
}

// Atualizar preview de preço
function updatePricePreview() {
    const price = parseFloat(document.getElementById('servicePrice').value) || 0;
    const urgency = parseFloat(document.getElementById('urgencyMultiplier')?.value) || 0;
    
    let preview = document.getElementById('pricePreview');
    if (!preview) {
        preview = document.createElement('div');
        preview.id = 'pricePreview';
        preview.className = 'mt-2 p-2 bg-light rounded';
        document.getElementById('servicePrice').parentElement.appendChild(preview);
    }
    
    if (price > 0) {
        const urgentPrice = price * (1 + urgency / 100);
        preview.innerHTML = `
            <small>
                <strong>Preço normal:</strong> R$ ${price.toFixed(2)}<br>
                ${urgency > 0 ? `<strong>Preço urgente:</strong> R$ ${urgentPrice.toFixed(2)} (+${urgency}%)` : ''}
            </small>
        `;
    } else {
        preview.innerHTML = '';
    }
}

function setupAutoSave() {
    let autoSaveTimeout;
    const form = document.getElementById('serviceForm');
    
    form.addEventListener('input', function() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            saveAsDraft();
        }, 30000); // Auto-save a cada 30 segundosa
    });
}

function saveAsDraft() {
    const formData = getFormData();
    
    // Mock - em produção salvaria no localStorage ou servidor
    localStorage.setItem('serviceFormDraft', JSON.stringify(formData));
    
    showTempMessage('Rascunho salvo automaticamente', 'info');
}

// Manipular envio do formulário
async function handleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    // Validar formulário
    if (!validateForm()) {
        showAlert('danger', 'Por favor, corrija os erros no formulário.');
        return;
    }
    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Salvando...';
        
        const formData = getFormData();
        const isEdit = isEditing();
        // Chamada real para o backend
        const url = isEdit ? `/services/${getServiceId()}` : '/services';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
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
        showAlert('success', `Serviço ${isEdit ? 'atualizado' : 'criado'} com sucesso!`);
        
        // Limpar rascunho
        localStorage.removeItem('serviceFormDraft');
        
        // Redirecionar após sucesso
        setTimeout(() => {
            window.location.href = '/services';
        }, 2000);
        
    } catch (error) {
        showAlert('danger', `Erro ao ${isEditing() ? 'atualizar' : 'criar'} serviço. Tente novamente.`);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

// Validar formulário completo
function validateForm() {
    const form = document.getElementById('serviceForm');
    if (!form) {
        return false;
    }
    
    const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    requiredFields.forEach((field, index) => {
        const fieldValid = validateField({ target: field });
        if (!fieldValid) {
            isValid = false;
        }
    });
    
    return isValid;
}

// Coletar dados do formulário
function getFormData() {
    const tagsElement = document.getElementById('serviceTags');
    const tags = tagsElement ? tagsElement.value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag) : [];
    
    const formData = {
        title: document.getElementById('serviceTitle')?.value.trim() || '',
        description: document.getElementById('serviceDescription')?.value.trim() || '',
        category: document.getElementById('serviceCategory')?.value || '',
        price: parseFloat(document.getElementById('servicePrice')?.value) || 0,
        duration: document.getElementById('serviceDuration')?.value.trim() || 'A combinar',
        tags: tags,
        status: document.getElementById('serviceAvailable')?.checked ? 'disponível' : 'indisponível',
        serviceArea: document.getElementById('serviceArea')?.value.trim() || '',
        urgencyMultiplier: parseFloat(document.getElementById('urgencyMultiplier')?.value) || 0,
        acceptsNegotiation: document.getElementById('acceptsNegotiation')?.checked || false,
        allowsScheduling: document.getElementById('allowsScheduling')?.checked || true
    };
    
    // Verificar elementos ausentes
    const elementsToCheck = [
        'serviceTitle', 'serviceDescription', 'serviceCategory', 'servicePrice',
        'serviceDuration', 'serviceTags', 'serviceAvailable', 'serviceArea',
        'urgencyMultiplier', 'acceptsNegotiation', 'allowsScheduling'
    ];
    
    elementsToCheck.forEach(id => {
        const element = document.getElementById(id);
        if (!element) {
            }
    });
    
    return formData;
}

// Obter ID do serviço (quando editando)
function getServiceId() {
    // Extrair ID do URL /services/{id}/edit ou /services/{id}
    const pathParts = window.location.pathname.split('/');
    const serviceIndex = pathParts.indexOf('services');
    
    if (serviceIndex !== -1 && pathParts[serviceIndex + 1]) {
        return pathParts[serviceIndex + 1];
    }
    
    return null;
}

// Deletar serviço
async function deleteService() {
    if (!confirm('Tem certeza que deseja excluir este serviço?\n\nEsta ação não pode ser desfeita e todas as solicitações relacionadas serão canceladas.')) {
        return;
    }
    
    try {
        const serviceId = getServiceId();
        
        const response = await fetch(`/services/${serviceId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        showAlert('success', 'Serviço excluído com sucesso!');
        
        setTimeout(() => {
            window.location.href = '/services';
        }, 2000);
        
    } catch (error) {
        showAlert('danger', 'Erro ao excluir serviço. Tente novamente.');
    }
}

// Animação do formulário
function animateForm() {
    const sections = document.querySelectorAll('.card, .form-group, .mb-3');
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        setTimeout(() => {
            section.style.transition = 'all 0.5s ease';
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, index * 50);
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

// Mostrar mensagem temporária
function showTempMessage(message, type = 'info') {
    const tempAlert = document.createElement('div');
    tempAlert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    tempAlert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    tempAlert.innerHTML = `
        <i class="fas fa-${type === 'info' ? 'info-circle' : 'check-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(tempAlert);
    
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(tempAlert);
        bsAlert.close();
    }, 3000);
}

// Mock de chamada da API
function mockApiCall(url, method, data) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simular 95% de sucesso
            if (Math.random() > 0.05) {
                resolve({ success: true, data });
            } else {
                reject(new Error('Mock API error'));
            }
        }, 1500 + Math.random() * 1000);
    });
}

// Restaurar rascunho ao carregar página
window.addEventListener('load', function() {
    const draft = localStorage.getItem('serviceFormDraft');
    if (draft && !isEditing()) {
        try {
            const data = JSON.parse(draft);
            if (confirm('Encontramos um rascunho salvo. Deseja restaurá-lo?')) {
                restoreFormData(data);
                showAlert('info', 'Rascunho restaurado com sucesso!');
            }
        } catch (e) {
            }
    }
});

// Restaurar dados no formulário
function restoreFormData(data) {
    Object.keys(data).forEach(key => {
        const element = document.getElementById(`service${key.charAt(0).toUpperCase() + key.slice(1)}`);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = data[key];
            } else if (key === 'tags' && Array.isArray(data[key])) {
                element.value = data[key].join(', ');
            } else {
                element.value = data[key];
            }
        }
    });
}

