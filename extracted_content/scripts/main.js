// Gestion du thème clair/sombre
class ThemeManager {
  constructor() {
    this.themeSwitch = document.getElementById('theme-switch');
    this.html = document.documentElement;
    this.currentTheme = localStorage.getItem('theme') || 'light';
    
    this.init();
  }

  init() {
    this.setTheme(this.currentTheme);
    this.themeSwitch.addEventListener('click', () => this.toggleTheme());
  }

  setTheme(theme) {
    this.html.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
    
    // Mise à jour de l'icône
    const icon = this.themeSwitch.querySelector('i');
    if (theme === 'dark') {
      icon.className = 'fas fa-moon';
    } else {
      icon.className = 'fas fa-sun';
    }
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }
}

// Gestionnaire des statistiques
class StatsManager {
  constructor() {
    this.totalSubjectsElement = document.getElementById('total-subjects');
    this.totalQuestionsElement = document.getElementById('total-questions');
    this.avgScoreElement = document.getElementById('avg-score');
    
    this.init();
  }

  init() {
    this.updateStats();
  }

  updateStats() {
    const subjects = this.getSubjects();
    const questions = this.getAllQuestions();
    const avgScore = this.calculateAverageScore();

    this.totalSubjectsElement.textContent = subjects.length;
    this.totalQuestionsElement.textContent = questions.length;
    this.avgScoreElement.textContent = `${avgScore}%`;
  }

  getSubjects() {
    return JSON.parse(localStorage.getItem('subjects') || '[]');
  }

  getAllQuestions() {
    const qcmData = JSON.parse(localStorage.getItem('qcm_data') || '{}');
    let allQuestions = [];
    
    Object.values(qcmData).forEach(subjectData => {
      if (subjectData.questions) {
        allQuestions = allQuestions.concat(subjectData.questions);
      }
    });
    
    return allQuestions;
  }

  calculateAverageScore() {
    const results = JSON.parse(localStorage.getItem('qcm_results') || '{}');
    let totalScore = 0;
    let totalAttempts = 0;
    
    Object.values(results).forEach(subjectResults => {
      if (subjectResults.scores && subjectResults.scores.length > 0) {
        const avgSubjectScore = subjectResults.scores.reduce((a, b) => a + b, 0) / subjectResults.scores.length;
        totalScore += avgSubjectScore;
        totalAttempts++;
      }
    });
    
    return totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;
  }
}

// Gestionnaire des animations
class AnimationManager {
  constructor() {
    this.init();
  }

  init() {
    this.observeElements();
  }

  observeElements() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Observer les éléments avec animation
    const animatedElements = document.querySelectorAll('.stat-card, .feature-card, .action-card');
    animatedElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }
}

// Gestionnaire des notifications
class NotificationManager {
  static show(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.textContent = message;
    
    // Style pour position fixe
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '10000';
    notification.style.minWidth = '300px';
    notification.style.maxWidth = '400px';
    notification.style.padding = '1rem';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = 'var(--shadow-lg)';
    notification.style.transform = 'translateX(100%)';
    notification.style.transition = 'transform 0.3s ease';
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-suppression
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, duration);
  }
}

// Gestionnaire du localStorage avec validation
class StorageManager {
  static get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Erreur lors de la lecture de ${key}:`, error);
      return defaultValue;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Erreur lors de l'écriture de ${key}:`, error);
      return false;
    }
  }

  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression de ${key}:`, error);
      return false;
    }
  }

  static clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Erreur lors du nettoyage du localStorage:', error);
      return false;
    }
  }
}

// Gestionnaire des utilitaires
class Utils {
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static formatDate(date) {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  static validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  static sanitizeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialisation de l'application
class App {
  constructor() {
    this.themeManager = null;
    this.statsManager = null;
    this.animationManager = null;
    
    this.init();
  }

  init() {
    // Attendre que le DOM soit chargé
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    try {
      // Initialiser les gestionnaires
      this.themeManager = new ThemeManager();
      this.statsManager = new StatsManager();
      this.animationManager = new AnimationManager();

      // Ajouter les écouteurs d'événements globaux
      this.setupGlobalEventListeners();

      // Initialiser les fonctionnalités spécifiques à la page
      this.setupPageSpecificFeatures();

      console.log('StudyHub initialisé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
    }
  }

  setupGlobalEventListeners() {
    // Gestion des erreurs globales
    window.addEventListener('error', (event) => {
      console.error('Erreur globale:', event.error);
      NotificationManager.show('Une erreur est survenue', 'error');
    });

    // Gestion de la visibilité de la page
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Rafraîchir les statistiques quand la page redevient visible
        if (this.statsManager) {
          this.statsManager.updateStats();
        }
      }
    });

    // Gestion du stockage
    window.addEventListener('storage', (event) => {
      if (event.key === 'theme') {
        this.themeManager.setTheme(event.newValue || 'light');
      }
    });
  }

  setupPageSpecificFeatures() {
    // Fonctionnalités spécifiques à la page d'accueil
    if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
      this.setupHomePageFeatures();
    }
  }

  setupHomePageFeatures() {
    // Ajouter des interactions aux cartes d'action
    const actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Ajouter un effet de ripple
        this.createRippleEffect(e);
      });
    });

    // Ajouter des interactions aux cartes de statistiques
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
      card.addEventListener('click', () => {
        // Afficher plus de détails sur les statistiques
        this.showStatsDetails();
      });
    });
  }

  createRippleEffect(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  showStatsDetails() {
    const subjects = this.statsManager.getSubjects();
    const questions = this.statsManager.getAllQuestions();
    const avgScore = this.statsManager.calculateAverageScore();

    const details = `
      <div class="stats-details">
        <h4>Détails des statistiques</h4>
        <p><strong>Matières:</strong> ${subjects.join(', ') || 'Aucune matière'}</p>
        <p><strong>Questions totales:</strong> ${questions.length}</p>
        <p><strong>Score moyen:</strong> ${avgScore}%</p>
      </div>
    `;

    NotificationManager.show('Statistiques mises à jour', 'info', 2000);
  }
}

// Styles CSS pour les effets
const additionalStyles = `
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: scale(0);
    animation: ripple-animation 0.6s linear;
    pointer-events: none;
  }

  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }

  .stats-details {
    background: var(--bg-secondary);
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    margin-top: 1rem;
  }

  .stats-details h4 {
    margin-bottom: 0.5rem;
    color: var(--text-primary);
  }

  .stats-details p {
    margin-bottom: 0.25rem;
    color: var(--text-secondary);
  }
`;

// Ajouter les styles au document
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialiser l'application
const app = new App();

// Exporter les classes pour utilisation dans d'autres scripts
window.StudyHub = {
  ThemeManager,
  StatsManager,
  AnimationManager,
  NotificationManager,
  StorageManager,
  Utils,
  App
};