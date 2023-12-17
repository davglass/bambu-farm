// Tooltips
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));


//Theme Selector
document.querySelector(`header .wrapper select`).addEventListener('change', (e) => {
    const target = e.target;
    const value = target.options[target.selectedIndex].value;
    location.href = `${location.pathname}?theme=${value}`;
});

