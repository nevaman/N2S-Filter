export class AnalyticsManager {
    constructor(state) {
        this.state = state;
    }

    updateStreakData() {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 864e5).toDateString();
        const signalTasks = this.state.get('signalTasks') || [];
        const streakData = this.state.get('streakData');
        
        const allSignalCompleted = signalTasks.length > 0 && signalTasks.every(t => t.completed);
        
        if (allSignalCompleted && streakData.lastCompletedDate !== today) {
            if (streakData.lastCompletedDate === yesterday) {
                streakData.count++;
            } else {
                streakData.count = 1;
            }
            streakData.lastCompletedDate = today;
            
            // Update streak record
            const currentRecord = this.state.get('analytics.streakRecord') || 0;
            if (streakData.count > currentRecord) {
                this.state.set('analytics.streakRecord', streakData.count);
            }
            
            this.state.set('streakData', streakData);
        }
    }

    getProductivityStats() {
        const analytics = this.state.get('analytics');
        const signalTasks = this.state.get('signalTasks') || [];
        const noiseTasks = this.state.get('noiseTasks') || [];
        const streakData = this.state.get('streakData');
        
        return {
            totalTasksCreated: analytics.totalTasksCreated || 0,
            signalTasksCompleted: analytics.signalTasksCompleted || 0,
            currentStreak: streakData.count || 0,
            streakRecord: analytics.streakRecord || 0,
            signalToNoiseRatio: signalTasks.length > 0 ? 
                Math.round((signalTasks.length / (signalTasks.length + noiseTasks.length)) * 100) : 0,
            averageSignalTasks: analytics.averageSignalTasks || 0,
            completionRate: signalTasks.length > 0 ? 
                Math.round((signalTasks.filter(t => t.completed).length / signalTasks.length) * 100) : 0
        };
    }

    updateAverageSignalTasks() {
        const signalTasks = this.state.get('signalTasks') || [];
        const currentAverage = this.state.get('analytics.averageSignalTasks') || 0;
        const totalDays = this.state.get('analytics.totalDays') || 0;
        
        const newAverage = totalDays > 0 ? 
            ((currentAverage * totalDays) + signalTasks.length) / (totalDays + 1) :
            signalTasks.length;
        
        this.state.set('analytics.averageSignalTasks', Math.round(newAverage * 10) / 10);
        this.state.set('analytics.totalDays', totalDays + 1);
    }

    getWeeklyReport() {
        // This would typically fetch data from a backend
        // For now, return current session data
        const stats = this.getProductivityStats();
        
        return {
            weeklySignalTasks: stats.signalTasksCompleted,
            weeklyCompletionRate: stats.completionRate,
            weeklyStreak: stats.currentStreak,
            weeklyFocus: stats.signalToNoiseRatio,
            insights: this.generateInsights(stats)
        };
    }

    generateInsights(stats) {
        const insights = [];
        
        if (stats.signalToNoiseRatio < 30) {
            insights.push("Consider being more selective with your tasks. Focus on what truly matters.");
        }
        
        if (stats.completionRate < 70) {
            insights.push("Try reducing the number of signal tasks to improve completion rate.");
        }
        
        if (stats.currentStreak === 0) {
            insights.push("Start building momentum by completing all your signal tasks today.");
        } else if (stats.currentStreak >= 7) {
            insights.push("Amazing streak! You're building excellent productivity habits.");
        }
        
        if (stats.averageSignalTasks > 7) {
            insights.push("You might be overcommitting. Consider limiting signal tasks to 5 or fewer.");
        }
        
        return insights;
    }

    exportAnalytics() {
        return {
            stats: this.getProductivityStats(),
            weeklyReport: this.getWeeklyReport(),
            exportDate: new Date().toISOString()
        };
    }
}