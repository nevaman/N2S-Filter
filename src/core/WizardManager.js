export class WizardManager {
    constructor(state, taskManager) {
        this.state = state;
        this.taskManager = taskManager;
        this.questions = [
            "Does this move you toward your #1 goal?",
            "Would today still be a win if this was all you finished?",
            "Does this require your brain, creativity, or leadership?",
            "Will there be a real cost if this isn't done today?"
        ];
    }

    start(tasks) {
        this.state.set('tasks', tasks);
        this.state.set('currentTaskIndex', 0);
        this.state.set('signalTasks', []);
        this.state.set('noiseTasks', []);
        this.setupCurrentTask();
    }

    setupCurrentTask() {
        const tasks = this.state.get('tasks') || [];
        const currentIndex = this.state.get('currentTaskIndex');
        
        if (currentIndex >= tasks.length) {
            this.completeWizard();
            return;
        }

        const currentTask = tasks[currentIndex];
        this.renderWizardQuestion(currentTask, currentIndex, tasks.length);
    }

    renderWizardQuestion(task, index, total) {
        const progressBanner = document.getElementById('progress-banner');
        const currentTaskText = document.getElementById('current-task-text');
        const checkboxContainer = document.querySelector('#screen2 .space-y-4');
        
        if (progressBanner) {
            progressBanner.textContent = `TASK ${index + 1} / ${total}`;
        }
        
        if (currentTaskText) {
            currentTaskText.textContent = task.text;
        }
        
        if (checkboxContainer) {
            checkboxContainer.innerHTML = '';
            this.questions.forEach((question, i) => {
                const label = document.createElement('label');
                label.className = 'wizard-checkbox-label';
                label.innerHTML = `
                    <input type="checkbox" class="wizard-checkbox">
                    <span>${question}</span>
                `;
                checkboxContainer.appendChild(label);
                
                label.querySelector('input').addEventListener('change', () => {
                    label.classList.toggle('checked', label.querySelector('input').checked);
                    this.updateCategorizeButton();
                });
            });
        }
        
        this.updateCategorizeButton();
    }

    updateCategorizeButton() {
        const categorizeBtn = document.getElementById('categorize-btn');
        const checkedCount = document.querySelectorAll('#screen2 .wizard-checkbox:checked').length;
        
        if (!categorizeBtn) return;
        
        if (checkedCount >= 3) {
            categorizeBtn.textContent = '✓ Mark as SIGNAL';
            categorizeBtn.className = 'btn-primary w-full md:w-auto';
            categorizeBtn.style.backgroundImage = 'linear-gradient(to right, #22c55e, #10b981)';
            categorizeBtn.style.borderColor = '#047857';
        } else {
            categorizeBtn.textContent = '✘ Mark as NOISE';
            categorizeBtn.className = 'btn-primary w-full md:w-auto';
            categorizeBtn.style.backgroundImage = 'linear-gradient(to right, #ef4444, #f97316)';
            categorizeBtn.style.borderColor = '#b91c1c';
        }
    }

    categorizeCurrentTask() {
        const tasks = this.state.get('tasks') || [];
        const currentIndex = this.state.get('currentTaskIndex');
        const currentTask = tasks[currentIndex];
        
        if (!currentTask) return;
        
        const checkedCount = document.querySelectorAll('#screen2 .wizard-checkbox:checked').length;
        const signalTasks = this.state.get('signalTasks') || [];
        const noiseTasks = this.state.get('noiseTasks') || [];
        
        if (checkedCount >= 3) {
            signalTasks.push(currentTask);
            this.state.set('signalTasks', signalTasks);
        } else {
            noiseTasks.push(currentTask);
            this.state.set('noiseTasks', noiseTasks);
        }
        
        this.state.set('currentTaskIndex', currentIndex + 1);
        this.setupCurrentTask();
    }

    completeWizard() {
        const signalTasks = this.state.get('signalTasks') || [];
        const noiseTasks = this.state.get('noiseTasks') || [];
        
        if (signalTasks.length === 0 && noiseTasks.length > 0) {
            this.showZeroSignalModal();
        } else {
            // Navigate to sorted screen
            const uiManager = window.app?.ui;
            if (uiManager) {
                uiManager.showScreen('sorted');
            }
        }
    }

    showZeroSignalModal() {
        const modal = document.getElementById('zero-signal-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    rethinkTasks() {
        this.state.set('currentTaskIndex', 0);
        this.state.set('signalTasks', []);
        this.state.set('noiseTasks', []);
        
        const modal = document.getElementById('zero-signal-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        // Return to task input
        const uiManager = window.app?.ui;
        if (uiManager) {
            uiManager.showScreen('taskInput');
        }
    }

    getWizardProgress() {
        const tasks = this.state.get('tasks') || [];
        const currentIndex = this.state.get('currentTaskIndex');
        
        return {
            current: currentIndex + 1,
            total: tasks.length,
            percentage: tasks.length > 0 ? Math.round(((currentIndex + 1) / tasks.length) * 100) : 0
        };
    }

    skipCurrentTask() {
        const noiseTasks = this.state.get('noiseTasks') || [];
        const tasks = this.state.get('tasks') || [];
        const currentIndex = this.state.get('currentTaskIndex');
        const currentTask = tasks[currentIndex];
        
        if (currentTask) {
            noiseTasks.push(currentTask);
            this.state.set('noiseTasks', noiseTasks);
        }
        
        this.state.set('currentTaskIndex', currentIndex + 1);
        this.setupCurrentTask();
    }
}