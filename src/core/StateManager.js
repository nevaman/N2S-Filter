export class StateManager {
    constructor() {
        this.state = {
            northStar: {
                header: "Goal of the Week",
                goal: "",
                isLocked: false,
                isEditing: false
            },
            tasks: [],
            signalTasks: [],
            noiseTasks: [],
            currentTaskIndex: 0,
            isLocked: false,
            streakData: {
                count: 0,
                lastCompletedDate: null
            },
            settings: {
                theme: 'light',
                notifications: true,
                autoSave: true
            },
            analytics: {
                totalTasksCreated: 0,
                signalTasksCompleted: 0,
                streakRecord: 0,
                averageSignalTasks: 0
            }
        };
        this.listeners = new Map();
    }

    get(path) {
        return this.getNestedValue(this.state, path);
    }

    set(path, value) {
        this.setNestedValue(this.state, path, value);
        this.notifyListeners(path, value);
        if (this.get('settings.autoSave')) {
            this.saveToStorage();
        }
    }

    subscribe(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, []);
        }
        this.listeners.get(path).push(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(path);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    notifyListeners(path, value) {
        // Notify exact path listeners
        if (this.listeners.has(path)) {
            this.listeners.get(path).forEach(callback => callback(value, path));
        }

        // Notify parent path listeners
        const pathParts = path.split('.');
        for (let i = pathParts.length - 1; i > 0; i--) {
            const parentPath = pathParts.slice(0, i).join('.');
            if (this.listeners.has(parentPath)) {
                this.listeners.get(parentPath).forEach(callback => 
                    callback(this.get(parentPath), parentPath)
                );
            }
        }
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!(key in current)) current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    }

    saveToStorage() {
        try {
            localStorage.setItem('s2n-app-state', JSON.stringify(this.state));
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('s2n-app-state');
            if (saved) {
                const parsedState = JSON.parse(saved);
                this.state = { ...this.state, ...parsedState };
            }
        } catch (error) {
            console.error('Failed to load state:', error);
        }
    }

    reset() {
        this.state.tasks = [];
        this.state.signalTasks = [];
        this.state.noiseTasks = [];
        this.state.currentTaskIndex = 0;
        this.state.isLocked = false;
        this.saveToStorage();
    }
}