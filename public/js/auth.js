document.addEventListener('DOMContentLoaded', function() {
    // Apenas animações e efeitos visuais
    animateFormFields();
    
    // Remover alertas automaticamente após 5 segundos
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.transition = 'opacity 0.5s ease';
            alert.style.opacity = '0';
            setTimeout(() => {
                alert.remove();
            }, 500);
        }, 5000);
    });
});

function animateFormFields() {
    const fields = document.querySelectorAll('.form-floating');
    fields.forEach((field, index) => {
        field.style.opacity = '0';
        field.style.transform = 'translateY(20px)';
        setTimeout(() => {
            field.style.transition = 'all 0.5s ease';
            field.style.opacity = '1';
            field.style.transform = 'translateY(0)';
        }, index * 100);
    });
}