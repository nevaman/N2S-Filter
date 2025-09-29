export class NorthStarManager {
    constructor(state) {
        this.state = state;
    }

    setNorthStar(header, goal) {
        this.state.set('northStar.header', header);
        this.state.set('northStar.goal', goal);
        this.state.set('northStar.isEditing', false);
    }

    editNorthStar() {
        this.state.set('northStar.isEditing', true);
    }

    saveNorthStar(header, goal) {
        this.setNorthStar(header, goal);
    }

    lockNorthStar() {
        const isLocked = this.state.get('northStar.isLocked');
        this.state.set('northStar.isLocked', !isLocked);
    }

    getNorthStar() {
        return this.state.get('northStar');
    }

    isNorthStarSet() {
        const goal = this.state.get('northStar.goal');
        return goal && goal.trim() !== '';
    }

    validateNorthStar(goal) {
        if (!goal || goal.trim().length < 10) {
            return { valid: false, message: 'North Star goal should be at least 10 characters long.' };
        }
        
        if (goal.length > 500) {
            return { valid: false, message: 'North Star goal should be less than 500 characters.' };
        }
        
        return { valid: true };
    }

    suggestNorthStarImprovements(goal) {
        const suggestions = [];
        
        if (!goal.toLowerCase().includes('measurable') && !goal.match(/\d+/)) {
            suggestions.push('Consider adding measurable metrics to your goal.');
        }
        
        if (!goal.toLowerCase().match(/\b(by|before|within|until)\b/)) {
            suggestions.push('Consider adding a time frame to your goal.');
        }
        
        if (goal.split(' ').length < 5) {
            suggestions.push('Your goal might benefit from more specific details.');
        }
        
        return suggestions;
    }

    getProgressTowardsNorthStar() {
        const signalTasks = this.state.get('signalTasks') || [];
        const completedSignalTasks = signalTasks.filter(t => t.completed);
        
        return {
            totalSignalTasks: signalTasks.length,
            completedSignalTasks: completedSignalTasks.length,
            progressPercentage: signalTasks.length > 0 ? Math.round((completedSignalTasks.length / signalTasks.length) * 100) : 0
        };
    }
}