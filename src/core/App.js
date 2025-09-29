import { StateManager } from './StateManager.js';
import { TaskManager } from './TaskManager.js';
import { UIManager } from './UIManager.js';
import { NorthStarManager } from './NorthStarManager.js';
import { WizardManager } from './WizardManager.js';
import { AnalyticsManager } from './AnalyticsManager.js';

export class App {
    constructor() {
        this.state = new StateManager();
        this.taskManager = new TaskManager(this.state);
        this.northStar = new NorthStarManager(this.state);
        this.wizard = new WizardManager(this.state, this.taskManager);
        this.analytics = new AnalyticsManager(this.state);
        this.ui = new UIManager(this.state, {
            taskManager: this.taskManager,
            northStar: this.northStar,
            wizard: this.wizard,
            analytics: this.analytics
        });
    }

    init() {
        this.state.loadFromStorage();
        this.ui.init();
        this.setupEventListeners();
        this.determineInitialScreen();
    }

    setupEventListeners() {
        // Global error handling
        window.addEventListener('error', (e) => {
            console.error('Application error:', e.error);
            this.ui.showError('Something went wrong. Please try again.');
        });

        // Auto-save on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.state.saveToStorage();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.ui.focusNewTask();
                        break;
                    case 's':
                        e.preventDefault();
                        this.state.saveToStorage();
                        break;
                }
            }
        });
    }

    determineInitialScreen() {
        const hasNorthStar = this.state.get('northStar.goal');
        if (!hasNorthStar) {
            this.ui.showScreen('northStar');
        } else {
            this.ui.showScreen('taskInput');
        }
    }
}