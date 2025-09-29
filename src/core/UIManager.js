export class UIManager {
    constructor(state, managers) {
        this.state = state;
        this.managers = managers;
        this.currentScreen = null;
        this.elements = {};
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupStateSubscriptions();
        this.renderNorthStar();
    }

    cacheElements() {
        this.elements = {
            appHeader: document.getElementById('app-header'),
            northStarContent: document.getElementById('north-star-content'),
            northStarControls: document.getElementById('north-star-controls'),
            screens: {
                screen0: document.getElementById('screen0'),
                screen1: document.getElementById('screen1'),
                screen2: document.getElementById('screen2'),
                screen3: document.getElementById('screen3'),
                screen4: document.getElementById('screen4')
            },
            taskList: document.getElementById('task-list'),
            sortDayBtn: document.getElementById('sort-day-btn'),
            signalList: document.getElementById('signal-list'),
            noiseList: document.getElementById('noise-list'),
            progressBar: document.getElementById('signal-progress-bar'),
            progressPercentage: document.getElementById('signal-percentage')
        };
    }

    setupEventListeners() {
        // North Star setup
        document.getElementById('set-north-star-btn')?.addEventListener('click', () => {
            this.handleSetNorthStar();
        });

        // Task sorting
        this.elements.sortDayBtn?.addEventListener('click', () => {
            if (!this.elements.sortDayBtn.classList.contains('disabled')) {
                this.startWizard();
            }
        });

        // Wizard navigation
        document.getElementById('categorize-btn')?.addEventListener('click', () => {
            this.managers.wizard.categorizeCurrentTask();
        });

        // Signal locking
        document.getElementById('lock-signal-btn')?.addEventListener('click', () => {
            this.lockSignalTasks();
        });

        // Day completion
        document.getElementById('finish-day-btn')?.addEventListener('click', () => {
            this.showRecapScreen();
        });

        // New day
        document.getElementById('start-new-day-btn')?.addEventListener('click', () => {
            this.startNewDay();
        });

        // Task input handling
        this.elements.taskList?.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('task-input')) {
                this.handleTaskInput(e);
            }
        });

        // Signal task completion
        this.elements.signalList?.addEventListener('change', (e) => {
            if (e.target.classList.contains('signal-checkbox')) {
                this.handleSignalTaskToggle(e);
            }
        });
    }

    setupStateSubscriptions() {
        this.state.subscribe('northStar', () => this.renderNorthStar());
        this.state.subscribe('signalTasks', () => this.renderSignalTasks());
        this.state.subscribe('noiseTasks', () => this.renderNoiseTasks());
        this.state.subscribe('tasks', () => this.updateSortButtonState());
    }

    showScreen(screenName) {
        // Hide all screens
        Object.values(this.elements.screens).forEach(screen => {
            screen?.classList.add('hidden');
        });

        // Show target screen
        const targetScreen = this.elements.screens[`screen${this.getScreenNumber(screenName)}`];
        if (targetScreen) {
            setTimeout(() => {
                targetScreen.classList.remove('hidden');
            }, 50);
        }

        this.currentScreen = screenName;

        // Handle header visibility
        if (screenName === 'northStar') {
            this.elements.appHeader?.classList.add('hidden');
        } else {
            this.elements.appHeader?.classList.remove('hidden');
        }
    }

    getScreenNumber(screenName) {
        const screenMap = {
            'northStar': '0',
            'taskInput': '1',
            'wizard': '2',
            'sorted': '3',
            'recap': '4'
        };
        return screenMap[screenName] || '1';
    }

    renderNorthStar() {
        const northStar = this.state.get('northStar');
        if (!northStar || !this.elements.northStarContent) return;

        if (northStar.isEditing) {
            this.elements.northStarContent.innerHTML = `
                <input type="text" id="north-star-header-input" class="north-star-input font-bold text-lg mb-2" value="${northStar.header}">
                <textarea id="north-star-goal-input" class="north-star-input text-gray-600" rows="2">${northStar.goal}</textarea>
            `;
            this.elements.northStarControls.innerHTML = `
                <button id="save-north-star-btn" class="north-star-btn">
                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </button>
            `;
        } else {
            this.elements.northStarContent.innerHTML = `
                <h2 class="text-lg font-bold text-indigo-800">${northStar.header}</h2>
                <p class="text-gray-600">${northStar.goal}</p>
            `;
            
            if (!northStar.isLocked) {
                this.elements.northStarControls.innerHTML = `
                    <button id="edit-north-star-btn" class="north-star-btn">
                        <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"></path>
                        </svg>
                    </button>
                `;
            }
        }
    }

    handleSetNorthStar() {
        const headerInput = document.getElementById('initial-goal-header');
        const goalInput = document.getElementById('initial-goal-content');
        
        if (!goalInput?.value.trim()) {
            this.showError('Please define your goal before continuing.');
            return;
        }

        this.state.set('northStar.header', headerInput.value);
        this.state.set('northStar.goal', goalInput.value);
        
        this.showScreen('taskInput');
        this.createInitialTaskInput();
    }

    createInitialTaskInput() {
        if (!this.elements.taskList) return;
        
        this.elements.taskList.innerHTML = '';
        this.createNewTaskInput(true);
        this.updateSortButtonState();
    }

    createNewTaskInput(isFirst = false) {
        const taskItems = this.elements.taskList.querySelectorAll('.task-item');
        const newIndex = taskItems.length + 1;

        const taskItem = document.createElement('div');
        taskItem.className = 'task-item flex items-center space-x-3';
        taskItem.innerHTML = `
            <span class="text-gray-400 font-bold text-lg w-6 text-right">${newIndex}.</span>
            <div class="task-input-container flex-grow">
                <input type="text" class="task-input" placeholder="Type a task and press Enter..." autocomplete="off">
            </div>
            <button class="task-delete-btn text-gray-400 hover:text-red-500 opacity-0 transition-opacity" title="Delete task">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;
        
        this.elements.taskList.appendChild(taskItem);

        const input = taskItem.querySelector('input');
        const deleteBtn = taskItem.querySelector('.task-delete-btn');
        
        if (isFirst) {
            input.focus();
        }

        // Show delete button on hover
        taskItem.addEventListener('mouseenter', () => {
            deleteBtn.classList.remove('opacity-0');
        });
        
        taskItem.addEventListener('mouseleave', () => {
            deleteBtn.classList.add('opacity-0');
        });

        // Delete task
        deleteBtn.addEventListener('click', () => {
            taskItem.remove();
            this.renumberTasks();
            this.updateSortButtonState();
        });
    }

    handleTaskInput(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const currentInput = e.target;
            const allInputs = Array.from(document.querySelectorAll('.task-input'));
            const currentIndex = allInputs.indexOf(currentInput);

            if (currentInput.value.trim() !== '' && currentIndex === allInputs.length - 1) {
                this.createNewTaskInput();
            }
            
            const newInputs = document.querySelectorAll('.task-input');
            if (newInputs[currentIndex + 1]) {
                newInputs[currentIndex + 1].focus();
            }
        } else if (e.key === 'Backspace' && e.target.value === '') {
            this.cleanupEmptyTasks();
        }
    }

    cleanupEmptyTasks() {
        const taskItems = document.querySelectorAll('.task-item');
        taskItems.forEach((item, index) => {
            const input = item.querySelector('input');
            if (taskItems.length > 1 && input.value.trim() === '' && index !== taskItems.length - 1) {
                item.remove();
            }
        });
        this.renumberTasks();
        this.updateSortButtonState();
    }

    renumberTasks() {
        const taskItems = document.querySelectorAll('.task-item');
        taskItems.forEach((item, index) => {
            item.querySelector('span').textContent = `${index + 1}.`;
        });
    }

    updateSortButtonState() {
        const hasTasks = Array.from(document.querySelectorAll('.task-input')).some(input => input.value.trim() !== '');
        this.elements.sortDayBtn?.classList.toggle('disabled', !hasTasks);
    }

    startWizard() {
        const tasks = Array.from(document.querySelectorAll('.task-input'))
            .map(input => input.value.trim())
            .filter(task => task !== '');
        
        if (tasks.length === 0) return;

        // Create task objects and store them
        const taskObjects = tasks.map(text => this.managers.taskManager.createTask(text));
        this.state.set('tasks', taskObjects);
        
        this.managers.wizard.start(taskObjects);
        this.showScreen('wizard');
    }

    renderSignalTasks() {
        const signalTasks = this.state.get('signalTasks') || [];
        if (!this.elements.signalList) return;

        this.elements.signalList.innerHTML = '';
        
        signalTasks.forEach((task) => {
            const taskEl = document.createElement('div');
            taskEl.className = 'flex items-center justify-between p-3 bg-slate-100 rounded-xl';
            taskEl.innerHTML = `
                <div class="flex items-center space-x-3">
                    <input type="checkbox" id="signal-task-${task.id}" class="signal-checkbox wizard-checkbox" ${task.completed ? 'checked' : ''}>
                    <label for="signal-task-${task.id}" class="text-gray-800 font-medium cursor-pointer ${task.completed ? 'line-through opacity-60' : ''}">${task.text}</label>
                </div>
                <div class="duration-chip" data-id="${task.id}">${task.duration} min</div>
            `;
            this.elements.signalList.appendChild(taskEl);
        });

        this.updateSignalProgress();
    }

    renderNoiseTasks() {
        const noiseTasks = this.state.get('noiseTasks') || [];
        if (!this.elements.noiseList) return;

        this.elements.noiseList.innerHTML = '';
        
        noiseTasks.forEach((task) => {
            const taskEl = document.createElement('div');
            taskEl.className = 'flex items-center space-x-3 p-3 bg-slate-100 rounded-xl';
            taskEl.innerHTML = `
                <input type="text" value="${task.text}" class="noise-input task-input text-gray-500 line-through p-0" readonly>
                <button class="delegate-noise-btn text-gray-400 hover:text-indigo-500" title="Schedule or delegate">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                </button>
            `;
            this.elements.noiseList.appendChild(taskEl);
        });
    }

    handleSignalTaskToggle(e) {
        const taskId = Number(e.target.id.replace('signal-task-', ''));
        const signalTasks = this.state.get('signalTasks') || [];
        const taskIndex = signalTasks.findIndex(t => t.id === taskId);
        
        if (taskIndex !== -1) {
            signalTasks[taskIndex].completed = e.target.checked;
            this.state.set('signalTasks', signalTasks);
            
            // Update task in main tasks array
            this.managers.taskManager.updateTask(taskId, { completed: e.target.checked });
        }
    }

    updateSignalProgress() {
        const signalTasks = this.state.get('signalTasks') || [];
        if (signalTasks.length === 0) {
            this.elements.progressBar.style.width = '0%';
            this.elements.progressPercentage.textContent = '0%';
            return;
        }

        const completedCount = signalTasks.filter(t => t.completed).length;
        const percentage = Math.round((completedCount / signalTasks.length) * 100);
        
        this.elements.progressBar.style.width = `${percentage}%`;
        this.elements.progressPercentage.textContent = `${percentage}%`;
    }

    lockSignalTasks() {
        this.state.set('isLocked', true);
        document.getElementById('lock-signal-btn')?.classList.add('hidden');
        document.getElementById('integration-buttons')?.classList.remove('hidden');
        
        // Update UI text
        document.getElementById('screen3-header').textContent = "Signal Locked.";
        document.getElementById('screen3-subheader').textContent = "No more thinking — just execution.";
    }

    showRecapScreen() {
        this.managers.analytics.updateStreakData();
        this.showScreen('recap');
        this.renderRecapData();
    }

    renderRecapData() {
        const streakData = this.state.get('streakData');
        const signalTasks = this.state.get('signalTasks') || [];
        
        document.getElementById('recap-streak-count').textContent = `${streakData.count} Day${streakData.count === 1 ? '' : 's'}`;
        
        const completedCount = signalTasks.filter(t => t.completed).length;
        document.getElementById('recap-signal-completed').textContent = `${completedCount}/${signalTasks.length}`;
    }

    startNewDay() {
        this.state.reset();
        this.createInitialTaskInput();
        this.showScreen('taskInput');
    }

    focusNewTask() {
        const lastInput = document.querySelector('.task-input:last-of-type');
        if (lastInput && lastInput.value.trim() === '') {
            lastInput.focus();
        } else {
            this.createNewTaskInput();
            setTimeout(() => {
                const newInput = document.querySelector('.task-input:last-of-type');
                newInput?.focus();
            }, 50);
        }
    }

    showError(message) {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-x-full');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-x-full');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}