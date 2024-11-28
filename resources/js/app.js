import './bootstrap';
import Alpine from 'alpinejs';

window.Alpine = Alpine;
Alpine.start();

document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('dark-mode-toggle');
    const darkModeEnabled = localStorage.getItem('dark-mode') === 'true';
    toggle.checked = darkModeEnabled; 
    document.documentElement.classList.toggle('dark', darkModeEnabled); 

    toggle.addEventListener('change', function() {
        const isChecked = this.checked;
        document.documentElement.classList.toggle('dark', isChecked);
        localStorage.setItem('dark-mode', isChecked);
    });
});