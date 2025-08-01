// Système de statistiques StudyHub
class StatisticsManager {
  constructor() {
    this.currentFilters = {
      subject: '',
      period: 'all',
      type: 'all'
    };
    
    // Éléments DOM
    this.subjectFilter = document.getElementById('subject-filter');
    this.periodFilter = document.getElementById('period-filter');
    this.typeFilter = document.getElementById('type-filter');
    this.subjectsStats = document.getElementById('subjects-stats');
    this.activityTimeline = document.getElementById('activity-timeline');
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadSubjects();
    this.updateOverviewStats();
    this.generateSubjectStats();
    this.generateActivityTimeline();
    this.generateRecommendations();
  }

  setupEventListeners() {
    // Filtres
    this.subjectFilter?.addEventListener('change', (e) => {
      this.currentFilters.subject = e.target.value;
      this.updateStats();
    });

    this.periodFilter?.addEventListener('change', (e) => {
      this.currentFilters.period = e.target.value;
      this.updateStats();
    });

    this.typeFilter?.addEventListener('change', (e) => {
      this.currentFilters.type = e.target.value;
      this.updateStats();
    });

    // Boutons d'export
    document.getElementById('export-pdf')?.addEventListener('click', () => this.exportPDF());
    document.getElementById('export-csv')?.addEventListener('click', () => this.exportCSV());
    document.getElementById('share-stats')?.addEventListener('click', () => this.shareStats());

    // Boutons de graphiques
    document.addEventListener('click', (e) => {
      if (e.target.closest('.chart-btn')) {
        const btn = e.target.closest('.chart-btn');
        const chartType = btn.dataset.chart;
        this.switchChartType(btn, chartType);
      }
    });
  }

  loadSubjects() {
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    
    this.subjectFilter.innerHTML = '<option value="">Toutes les matières</option>';
    subjects.forEach(subject => {
      const option = document.createElement('option');
      option.value = subject.id;
      option.textContent = subject.name;
      this.subjectFilter.appendChild(option);
    });
  }

  updateOverviewStats() {
    const stats = this.calculateOverallStats();
    
    document.getElementById('total-subjects').textContent = stats.totalSubjects;
    document.getElementById('total-questions').textContent = stats.totalQuestions;
    document.getElementById('avg-score').textContent = `${stats.avgScore}%`;
    document.getElementById('study-time').textContent = `${stats.studyTime}h`;
  }

  calculateOverallStats() {
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    const qcmData = JSON.parse(localStorage.getItem('qcm_data') || '{}');
    const qcmResults = JSON.parse(localStorage.getItem('qcm_results') || '{}');
    const flashcards = JSON.parse(localStorage.getItem('flashcards') || '{}');

    let totalQuestions = 0;
    let totalScore = 0;
    let totalAttempts = 0;
    let studyTime = 0;

    subjects.forEach(subject => {
      const subjectQCM = qcmData[subject.id] || { questions: [] };
      const subjectResults = qcmResults[subject.id] || { scores: [] };
      const subjectFlashcards = flashcards[subject.id] || [];

      totalQuestions += subjectQCM.questions.length;
      totalQuestions += subjectFlashcards.length;

      if (subjectResults.scores && subjectResults.scores.length > 0) {
        totalScore += subjectResults.scores.reduce((a, b) => a + b, 0);
        totalAttempts += subjectResults.scores.length;
      }

      // Estimation du temps d'étude (2 minutes par question/réponse)
      studyTime += (subjectQCM.questions.length + subjectFlashcards.length) * 2;
    });

    const avgScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;
    const studyHours = Math.round(studyTime / 60);

    return {
      totalSubjects: subjects.length,
      totalQuestions,
      avgScore,
      studyTime: studyHours
    };
  }

  generateSubjectStats() {
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    const qcmData = JSON.parse(localStorage.getItem('qcm_data') || '{}');
    const qcmResults = JSON.parse(localStorage.getItem('qcm_results') || '{}');
    const flashcards = JSON.parse(localStorage.getItem('flashcards') || '{}');

    this.subjectsStats.innerHTML = '';

    subjects.forEach(subject => {
      const subjectStats = this.calculateSubjectStats(subject, qcmData, qcmResults, flashcards);
      const subjectCard = this.createSubjectStatsCard(subject, subjectStats);
      this.subjectsStats.appendChild(subjectCard);
    });
  }

  calculateSubjectStats(subject, qcmData, qcmResults, flashcards) {
    const subjectQCM = qcmData[subject.id] || { questions: [] };
    const subjectResults = qcmResults[subject.id] || { scores: [] };
    const subjectFlashcards = flashcards[subject.id] || [];

    const totalQuestions = subjectQCM.questions.length;
    const totalFlashcards = subjectFlashcards.length;
    
    let avgScore = 0;
    let bestScore = 0;
    let totalAttempts = 0;

    if (subjectResults.scores && subjectResults.scores.length > 0) {
      avgScore = Math.round(subjectResults.scores.reduce((a, b) => a + b, 0) / subjectResults.scores.length);
      bestScore = Math.max(...subjectResults.scores);
      totalAttempts = subjectResults.scores.length;
    }

    const progress = totalQuestions > 0 ? Math.round((totalAttempts / totalQuestions) * 100) : 0;

    return {
      totalQuestions,
      totalFlashcards,
      avgScore,
      bestScore,
      totalAttempts,
      progress
    };
  }

  createSubjectStatsCard(subject, stats) {
    const card = document.createElement('div');
    card.className = 'subject-stats-card';
    
    const progressColor = this.getProgressColor(stats.avgScore);
    const progressClass = this.getProgressClass(stats.avgScore);

    card.innerHTML = `
      <div class="subject-stats-header">
        <div class="subject-info">
          <h4>${subject.name}</h4>
          <p>${stats.totalQuestions} questions, ${stats.totalFlashcards} flashcards</p>
        </div>
        <div class="subject-score ${progressClass}">
          <span class="score-number">${stats.avgScore}%</span>
          <span class="score-label">Score moyen</span>
        </div>
      </div>
      
      <div class="subject-stats-details">
        <div class="stat-item">
          <i class="fas fa-trophy"></i>
          <span>Meilleur score: <strong>${stats.bestScore}%</strong></span>
        </div>
        <div class="stat-item">
          <i class="fas fa-play"></i>
          <span>Tentatives: <strong>${stats.totalAttempts}</strong></span>
        </div>
        <div class="stat-item">
          <i class="fas fa-chart-line"></i>
          <span>Progression: <strong>${stats.progress}%</strong></span>
        </div>
      </div>
      
      <div class="subject-progress">
        <div class="progress-bar">
          <div class="progress-bar-fill" style="width: ${stats.progress}%; background-color: ${progressColor}"></div>
        </div>
      </div>
      
      <div class="subject-actions">
        <button class="btn btn-secondary btn-sm" onclick="window.location.href='qcm.html?subject=${subject.id}'">
          <i class="fas fa-question-circle"></i> QCM
        </button>
        <button class="btn btn-secondary btn-sm" onclick="window.location.href='flashcards.html?subject=${subject.id}'">
          <i class="fas fa-layer-group"></i> Flashcards
        </button>
      </div>
    `;

    return card;
  }

  getProgressColor(score) {
    if (score >= 80) return '#10b981'; // Vert
    if (score >= 60) return '#f59e0b'; // Orange
    return '#ef4444'; // Rouge
  }

  getProgressClass(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    return 'needs-improvement';
  }

  generateActivityTimeline() {
    const activities = this.getRecentActivities();
    
    this.activityTimeline.innerHTML = '';

    if (activities.length === 0) {
      this.activityTimeline.innerHTML = `
        <div class="empty-timeline">
          <i class="fas fa-clock"></i>
          <p>Aucune activité récente</p>
        </div>
      `;
      return;
    }

    activities.forEach(activity => {
      const activityItem = this.createActivityItem(activity);
      this.activityTimeline.appendChild(activityItem);
    });
  }

  getRecentActivities() {
    const activities = [];
    const qcmResults = JSON.parse(localStorage.getItem('qcm_results') || '{}');
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');

    // Générer des activités basées sur les résultats QCM
    Object.entries(qcmResults).forEach(([subjectId, results]) => {
      const subject = subjects.find(s => s.id === subjectId);
      if (subject && results.scores && results.scores.length > 0) {
        const lastScore = results.scores[results.scores.length - 1];
        const lastDate = results.dates ? results.dates[results.dates.length - 1] : new Date().toISOString();
        
        activities.push({
          type: 'qcm',
          subject: subject.name,
          score: lastScore,
          date: lastDate,
          icon: 'fas fa-question-circle'
        });
      }
    });

    // Trier par date (plus récent en premier)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    return activities.slice(0, 10); // Limiter à 10 activités
  }

  createActivityItem(activity) {
    const item = document.createElement('div');
    item.className = 'activity-item';
    
    const date = new Date(activity.date);
    const timeAgo = this.getTimeAgo(date);
    const scoreClass = this.getProgressClass(activity.score);

    item.innerHTML = `
      <div class="activity-icon">
        <i class="${activity.icon}"></i>
      </div>
      <div class="activity-content">
        <h5>${activity.type.toUpperCase()} - ${activity.subject}</h5>
        <p>Score: <span class="${scoreClass}">${activity.score}%</span></p>
        <span class="activity-time">${timeAgo}</span>
      </div>
    `;

    return item;
  }

  getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return 'À l\'instant';
  }

  generateRecommendations() {
    const recommendations = this.calculateRecommendations();
    const recommendationsList = document.getElementById('recommendations-list');
    
    if (!recommendationsList) return;

    recommendationsList.innerHTML = '';

    recommendations.forEach(rec => {
      const recItem = document.createElement('div');
      recItem.className = 'recommendation-item';
      
      recItem.innerHTML = `
        <i class="${rec.icon}"></i>
        <div class="recommendation-content">
          <h4>${rec.title}</h4>
          <p>${rec.description}</p>
        </div>
      `;

      recommendationsList.appendChild(recItem);
    });
  }

  calculateRecommendations() {
    const recommendations = [];
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    const qcmResults = JSON.parse(localStorage.getItem('qcm_results') || '{}');

    // Analyser les performances par matière
    subjects.forEach(subject => {
      const results = qcmResults[subject.id];
      if (results && results.scores && results.scores.length > 0) {
        const recentScores = results.scores.slice(-3); // 3 derniers scores
        const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        
        if (avgRecent < 60) {
          recommendations.push({
            icon: 'fas fa-exclamation-triangle',
            title: `Améliorer en ${subject.name}`,
            description: `Votre score moyen est de ${Math.round(avgRecent)}%. Concentrez-vous sur cette matière.`
          });
        } else if (avgRecent > 85) {
          recommendations.push({
            icon: 'fas fa-star',
            title: `Excellent travail en ${subject.name}`,
            description: `Continuez comme ça ! Votre score de ${Math.round(avgRecent)}% est remarquable.`
          });
        }
      }
    });

    // Recommandation générale
    if (recommendations.length === 0) {
      recommendations.push({
        icon: 'fas fa-lightbulb',
        title: 'Commencez à étudier',
        description: 'Importez vos premiers documents pour commencer votre apprentissage !'
      });
    }

    return recommendations.slice(0, 3); // Limiter à 3 recommandations
  }

  updateStats() {
    this.updateOverviewStats();
    this.generateSubjectStats();
    this.generateActivityTimeline();
    this.generateRecommendations();
  }

  switchChartType(button, chartType) {
    // Supprimer la classe active de tous les boutons du même groupe
    const chartGroup = button.closest('.chart-actions');
    chartGroup.querySelectorAll('.chart-btn').forEach(btn => btn.classList.remove('active'));
    
    // Ajouter la classe active au bouton cliqué
    button.classList.add('active');
    
    // Ici, vous pourriez changer le type de graphique
    console.log(`Changement vers le graphique: ${chartType}`);
  }

  exportPDF() {
    NotificationManager.show('Export PDF en cours de développement', 'info');
  }

  exportCSV() {
    const data = this.getExportData();
    const csv = this.convertToCSV(data);
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistiques-studyhub-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    NotificationManager.show('Statistiques exportées en CSV', 'success');
  }

  getExportData() {
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    const qcmData = JSON.parse(localStorage.getItem('qcm_data') || '{}');
    const qcmResults = JSON.parse(localStorage.getItem('qcm_results') || '{}');
    const flashcards = JSON.parse(localStorage.getItem('flashcards') || '{}');

    const data = [
      ['Matière', 'Questions QCM', 'Flashcards', 'Score moyen', 'Meilleur score', 'Tentatives']
    ];

    subjects.forEach(subject => {
      const stats = this.calculateSubjectStats(subject, qcmData, qcmResults, flashcards);
      data.push([
        subject.name,
        stats.totalQuestions,
        stats.totalFlashcards,
        `${stats.avgScore}%`,
        `${stats.bestScore}%`,
        stats.totalAttempts
      ]);
    });

    return data;
  }

  convertToCSV(data) {
    return data.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
  }

  shareStats() {
    const stats = this.calculateOverallStats();
    const shareText = `Mes statistiques StudyHub :
📚 ${stats.totalSubjects} matières étudiées
❓ ${stats.totalQuestions} questions répondues
📊 Score moyen: ${stats.avgScore}%
⏱️ Temps d'étude: ${stats.studyTime}h

#StudyHub #Apprentissage`;

    if (navigator.share) {
      navigator.share({
        title: 'Mes statistiques StudyHub',
        text: shareText,
        url: window.location.href
      });
    } else {
      // Fallback: copier dans le presse-papiers
      navigator.clipboard.writeText(shareText).then(() => {
        NotificationManager.show('Statistiques copiées dans le presse-papiers', 'success');
      });
    }
  }
}

// Initialisation du gestionnaire de statistiques
const statisticsManager = new StatisticsManager();

// Export pour utilisation dans d'autres modules
window.StatisticsManager = StatisticsManager;
window.statisticsManager = statisticsManager;