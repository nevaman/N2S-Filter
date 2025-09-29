import { formatDistanceToNow, addDays, isToday, isPast } from 'date-fns';

export class TaskManager {
    constructor(state) {
        this.state = state;
    }

    createTask(text, options = {}) {
        const task = {
            id: Date.now() + Math.random(),
            text: text.trim(),
            completed: false,
            createdAt: new Date().toISOString(),
            dueDate: options.dueDate || null,
            priority: options.priority || 'medium',
            duration: options.duration || 30,
            tags: options.tags || [],
            project: options.project || null,
            recurring: options.recurring || null,
            notes: options.notes || '',
            subtasks: [],
            timeTracked: 0,
            estimatedTime: options.estimatedTime || null
        };

        const tasks = this.state.get('tasks') || [];
        tasks.push(task);
        this.state.set('tasks', tasks);
        
        // Update analytics
        const totalCreated = this.state.get('analytics.totalTasksCreated') || 0;
        this.state.set('analytics.totalTasksCreated', totalCreated + 1);

        return task;
    }

    updateTask(taskId, updates) {
        const tasks = this.state.get('tasks') || [];
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) return null;

        tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
        this.state.set('tasks', tasks);
        
        return tasks[taskIndex];
    }

    deleteTask(taskId) {
        const tasks = this.state.get('tasks') || [];
        const filteredTasks = tasks.filter(t => t.id !== taskId);
        this.state.set('tasks', filteredTasks);
    }

    completeTask(taskId) {
        const task = this.updateTask(taskId, { 
            completed: true, 
            completedAt: new Date().toISOString() 
        });
        
        if (task) {
            // Update analytics for signal tasks
            const signalTasks = this.state.get('signalTasks') || [];
            if (signalTasks.some(st => st.id === taskId)) {
                const completed = this.state.get('analytics.signalTasksCompleted') || 0;
                this.state.set('analytics.signalTasksCompleted', completed + 1);
            }
        }
        
        return task;
    }

    getTasksByFilter(filter = {}) {
        const tasks = this.state.get('tasks') || [];
        
        return tasks.filter(task => {
            if (filter.completed !== undefined && task.completed !== filter.completed) {
                return false;
            }
            
            if (filter.dueToday && (!task.dueDate || !isToday(new Date(task.dueDate)))) {
                return false;
            }
            
            if (filter.overdue && (!task.dueDate || !isPast(new Date(task.dueDate)) || task.completed)) {
                return false;
            }
            
            if (filter.project && task.project !== filter.project) {
                return false;
            }
            
            if (filter.priority && task.priority !== filter.priority) {
                return false;
            }
            
            if (filter.search) {
                const searchTerm = filter.search.toLowerCase();
                return task.text.toLowerCase().includes(searchTerm) ||
                       task.notes.toLowerCase().includes(searchTerm) ||
                       task.tags.some(tag => tag.toLowerCase().includes(searchTerm));
            }
            
            return true;
        });
    }

    getTaskStats() {
        const tasks = this.state.get('tasks') || [];
        const signalTasks = this.state.get('signalTasks') || [];
        const noiseTasks = this.state.get('noiseTasks') || [];
        
        return {
            total: tasks.length,
            completed: tasks.filter(t => t.completed).length,
            signal: signalTasks.length,
            noise: noiseTasks.length,
            signalCompleted: signalTasks.filter(t => t.completed).length,
            overdue: tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && !t.completed).length,
            dueToday: tasks.filter(t => t.dueDate && isToday(new Date(t.dueDate)) && !t.completed).length
        };
    }

    createRecurringTasks() {
        const tasks = this.state.get('tasks') || [];
        const today = new Date();
        
        tasks.forEach(task => {
            if (task.recurring && task.completed) {
                const lastCompleted = new Date(task.completedAt);
                const shouldCreateNew = this.shouldCreateRecurringTask(task.recurring, lastCompleted, today);
                
                if (shouldCreateNew) {
                    const newTask = {
                        ...task,
                        id: Date.now() + Math.random(),
                        completed: false,
                        createdAt: new Date().toISOString(),
                        completedAt: null,
                        dueDate: this.calculateNextDueDate(task.recurring, task.dueDate)
                    };
                    
                    const updatedTasks = this.state.get('tasks') || [];
                    updatedTasks.push(newTask);
                    this.state.set('tasks', updatedTasks);
                }
            }
        });
    }

    shouldCreateRecurringTask(recurring, lastCompleted, today) {
        const daysSinceCompleted = Math.floor((today - lastCompleted) / (1000 * 60 * 60 * 24));
        
        switch (recurring.type) {
            case 'daily':
                return daysSinceCompleted >= 1;
            case 'weekly':
                return daysSinceCompleted >= 7;
            case 'monthly':
                return daysSinceCompleted >= 30;
            default:
                return false;
        }
    }

    calculateNextDueDate(recurring, currentDueDate) {
        if (!currentDueDate) return null;
        
        const current = new Date(currentDueDate);
        
        switch (recurring.type) {
            case 'daily':
                return addDays(current, 1).toISOString();
            case 'weekly':
                return addDays(current, 7).toISOString();
            case 'monthly':
                return addDays(current, 30).toISOString();
            default:
                return null;
        }
    }

    exportTasks(format = 'json') {
        const tasks = this.state.get('tasks') || [];
        
        switch (format) {
            case 'json':
                return JSON.stringify(tasks, null, 2);
            case 'csv':
                return this.tasksToCSV(tasks);
            default:
                return tasks;
        }
    }

    tasksToCSV(tasks) {
        const headers = ['Text', 'Completed', 'Created', 'Due Date', 'Priority', 'Duration', 'Tags'];
        const rows = tasks.map(task => [
            task.text,
            task.completed,
            task.createdAt,
            task.dueDate || '',
            task.priority,
            task.duration,
            task.tags.join(';')
        ]);
        
        return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }
}