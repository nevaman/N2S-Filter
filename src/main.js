import { App } from './core/App.js';
import './styles/main.css';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});