// Gestionnaire principal des flashcards
class FlashcardManager {
  constructor() {
    this.currentSubject = null;
    this.currentCardIndex = 0;
    this.flashcards = [];
    this.subjects = [];
    this.studySession = {
      startTime: null,
      correctAnswers: 0,
      totalAnswers: 0
    };
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadSubjects();
    this.loadFlashcards();
    this.updateStats();
  }

  setupEventListeners() {
    // Gestion des onglets
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Gestion du formulaire de création
    document.getElementById('flashcard-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveFlashcards();
    });

    // Gestion du thème
    if (window.StudyHub && window.StudyHub.ThemeManager) {
      this.themeManager = new window.StudyHub.ThemeManager();
    }
  }

  switchTab(tabName) {
    // Mettre à jour les boutons d'onglets
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Mettre à jour le contenu des onglets
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Actions spécifiques par onglet
    if (tabName === 'stats') {
      this.updateStats();
    } else if (tabName === 'create') {
      this.loadSubjectsForCreation();
    }
  }

  // Gestion des matières
  loadSubjects() {
    this.subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    this.displaySubjects();
  }

  createSubject() {
    const subject = prompt('Nom de la nouvelle matière :');
    if (subject && subject.trim()) {
      if (!this.subjects.includes(subject)) {
        this.subjects.push(subject);
        localStorage.setItem('subjects', JSON.stringify(this.subjects));
        this.loadSubjects();
        
        if (window.StudyHub && window.StudyHub.NotificationManager) {
          window.StudyHub.NotificationManager.show(`Matière "${subject}" créée avec succès`, 'success');
        }
      }
    }
  }

  displaySubjects() {
    const container = document.getElementById('subjects-grid');
    container.innerHTML = '';
    
    if (this.subjects.length === 0) {
      container.innerHTML = '<p class="text-center">Aucune matière créée. Créez votre première matière pour commencer !</p>';
      return;
    }
    
    this.subjects.forEach(subject => {
      const subjectCard = this.createSubjectCard(subject);
      container.appendChild(subjectCard);
    });
  }

  createSubjectCard(subject) {
    const card = document.createElement('div');
    card.className = 'card subject-card';
    
    // Calculer les statistiques de la matière
    const subjectFlashcards = this.getFlashcardsForSubject(subject);
    const progress = this.calculateSubjectProgress(subject);
    
    card.innerHTML = `
      <div class="subject-card-header">
        <div class="subject-icon">
          <i class="fas fa-book"></i>
        </div>
        <div class="subject-info">
          <h4>${subject}</h4>
          <p>${subjectFlashcards.length} flashcards</p>
        </div>
        <div class="subject-progress">
          <div class="progress-circle">
            <span>${progress}%</span>
          </div>
        </div>
      </div>
      
      <div class="subject-actions">
        <button class="btn btn-primary" onclick="flashcardManager.startStudySession('${subject}')">
          <i class="fas fa-play"></i> Étudier
        </button>
        <button class="btn btn-secondary" onclick="flashcardManager.viewSubjectDetails('${subject}')">
          <i class="fas fa-eye"></i> Voir
        </button>
      </div>
    `;
    
    return card;
  }

  getFlashcardsForSubject(subject) {
    const allFlashcards = JSON.parse(localStorage.getItem('flashcards') || '[]');
    return allFlashcards.filter(card => card.subject === subject);
  }

  calculateSubjectProgress(subject) {
    const flashcards = this.getFlashcardsForSubject(subject);
    if (flashcards.length === 0) return 0;
    
    const totalStudied = flashcards.filter(card => card.studied).length;
    return Math.round((totalStudied / flashcards.length) * 100);
  }

  // Gestion des sessions d'étude
  startStudySession(subject) {
    this.currentSubject = subject;
    this.flashcards = this.getFlashcardsForSubject(subject);
    
    if (this.flashcards.length === 0) {
      if (window.StudyHub && window.StudyHub.NotificationManager) {
        window.StudyHub.NotificationManager.show('Aucune flashcard disponible pour cette matière', 'warning');
      }
      return;
    }
    
    this.currentCardIndex = 0;
    this.studySession = {
      startTime: Date.now(),
      correctAnswers: 0,
      totalAnswers: 0
    };
    
    // Afficher la section des flashcards
    document.getElementById('flashcards-container').classList.remove('hidden');
    document.getElementById('current-subject-title').textContent = subject;
    
    this.displayCurrentCard();
    this.updateProgress();
  }

  displayCurrentCard() {
    if (this.currentCardIndex >= this.flashcards.length) {
      this.finishStudySession();
      return;
    }
    
    const card = this.flashcards[this.currentCardIndex];
    const container = document.getElementById('flashcard-display');
    
    container.innerHTML = `
      <div class="flashcard" onclick="flashcardManager.flipCard()">
        <div class="front">
          <h4>Question</h4>
          <p>${card.front}</p>
        </div>
        <div class="back">
          <h4>Réponse</h4>
          <p>${card.back}</p>
        </div>
      </div>
    `;
    
    // Mettre à jour le compteur
    document.getElementById('card-counter').textContent = `${this.currentCardIndex + 1}/${this.flashcards.length}`;
    
    // Mettre à jour les boutons de navigation
    this.updateNavigationButtons();
  }

  flipCard() {
    const flashcard = document.querySelector('.flashcard');
    flashcard.classList.toggle('flipped');
  }

  nextCard() {
    if (this.currentCardIndex < this.flashcards.length - 1) {
      this.currentCardIndex++;
      this.displayCurrentCard();
      this.updateProgress();
    }
  }

  previousCard() {
    if (this.currentCardIndex > 0) {
      this.currentCardIndex--;
      this.displayCurrentCard();
      this.updateProgress();
    }
  }

  updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-card-btn');
    const nextBtn = document.getElementById('next-card-btn');
    
    prevBtn.disabled = this.currentCardIndex === 0;
    nextBtn.disabled = this.currentCardIndex === this.flashcards.length - 1;
  }

  updateProgress() {
    const progress = ((this.currentCardIndex + 1) / this.flashcards.length) * 100;
    document.getElementById('flashcard-progress').style.width = `${progress}%`;
    document.getElementById('progress-percentage').textContent = `${Math.round(progress)}%`;
  }

  markAsCorrect() {
    this.markAnswer(true);
  }

  markAsIncorrect() {
    this.markAnswer(false);
  }

  markAnswer(isCorrect) {
    const card = this.flashcards[this.currentCardIndex];
    
    // Mettre à jour les statistiques de la carte
    if (!card.stats) {
      card.stats = { correct: 0, incorrect: 0, lastStudied: null };
    }
    
    if (isCorrect) {
      card.stats.correct++;
      this.studySession.correctAnswers++;
    } else {
      card.stats.incorrect++;
    }
    
    card.stats.lastStudied = new Date().toISOString();
    card.studied = true;
    
    this.studySession.totalAnswers++;
    
    // Sauvegarder les modifications
    this.saveFlashcardStats();
    
    // Passer à la carte suivante
    this.nextCard();
  }

  saveFlashcardStats() {
    const allFlashcards = JSON.parse(localStorage.getItem('flashcards') || '[]');
    const cardIndex = allFlashcards.findIndex(card => 
      card.id === this.flashcards[this.currentCardIndex].id
    );
    
    if (cardIndex !== -1) {
      allFlashcards[cardIndex] = this.flashcards[this.currentCardIndex];
      localStorage.setItem('flashcards', JSON.stringify(allFlashcards));
    }
  }

  finishStudySession() {
    const duration = Date.now() - this.studySession.startTime;
    const accuracy = this.studySession.totalAnswers > 0 
      ? Math.round((this.studySession.correctAnswers / this.studySession.totalAnswers) * 100)
      : 0;
    
    // Sauvegarder la session
    this.saveStudySession(duration, accuracy);
    
    // Afficher les résultats
    this.showStudyResults(accuracy, duration);
    
    // Masquer la section des flashcards
    document.getElementById('flashcards-container').classList.add('hidden');
  }

  saveStudySession(duration, accuracy) {
    const sessions = JSON.parse(localStorage.getItem('study_sessions') || '[]');
    sessions.push({
      subject: this.currentSubject,
      date: new Date().toISOString(),
      duration,
      accuracy,
      correctAnswers: this.studySession.correctAnswers,
      totalAnswers: this.studySession.totalAnswers
    });
    localStorage.setItem('study_sessions', JSON.stringify(sessions));
  }

  showStudyResults(accuracy, duration) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Session terminée !</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="results-summary">
            <div class="score-display">
              <div class="score-circle">
                <span>${accuracy}%</span>
              </div>
              <p>Précision de votre session</p>
            </div>
            
            <div class="results-details">
              <div class="result-item">
                <span class="result-label">Réponses correctes:</span>
                <span class="result-value">${this.studySession.correctAnswers}/${this.studySession.totalAnswers}</span>
              </div>
              <div class="result-item">
                <span class="result-label">Temps:</span>
                <span class="result-value">${this.formatDuration(duration)}</span>
              </div>
              <div class="result-item">
                <span class="result-label">Matière:</span>
                <span class="result-value">${this.currentSubject}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="flashcardManager.startStudySession('${this.currentSubject}')">
            <i class="fas fa-redo"></i> Recommencer
          </button>
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
            <i class="fas fa-times"></i> Fermer
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Gestion de la création de flashcards
  loadSubjectsForCreation() {
    const select = document.getElementById('flashcard-subject');
    select.innerHTML = '<option value="">Sélectionner une matière</option>';
    
    this.subjects.forEach(subject => {
      const option = document.createElement('option');
      option.value = subject;
      option.textContent = subject;
      select.appendChild(option);
    });
  }

  addFlashcardField() {
    const container = document.getElementById('flashcards-creation-container');
    const flashcardId = Date.now() + Math.random();
    
    const flashcardHTML = `
      <div class="flashcard-creation-item card" data-flashcard-id="${flashcardId}">
        <div class="flashcard-creation-header">
          <h4>Flashcard ${container.children.length + 1}</h4>
          <button type="button" class="btn btn-error" onclick="flashcardManager.removeFlashcardField('${flashcardId}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        
        <div class="form-group">
          <label class="form-label">Question</label>
          <textarea class="form-textarea flashcard-front" placeholder="Entrez votre question..." required></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">Réponse</label>
          <textarea class="form-textarea flashcard-back" placeholder="Entrez votre réponse..." required></textarea>
        </div>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', flashcardHTML);
  }

  removeFlashcardField(flashcardId) {
    const element = document.querySelector(`[data-flashcard-id="${flashcardId}"]`);
    if (element) {
      element.remove();
      this.updateFlashcardNumbers();
    }
  }

  updateFlashcardNumbers() {
    const items = document.querySelectorAll('.flashcard-creation-item');
    items.forEach((item, index) => {
      const header = item.querySelector('h4');
      header.textContent = `Flashcard ${index + 1}`;
    });
  }

  saveFlashcards() {
    const subject = document.getElementById('flashcard-subject').value;
    
    if (!subject) {
      if (window.StudyHub && window.StudyHub.NotificationManager) {
        window.StudyHub.NotificationManager.show('Veuillez sélectionner une matière', 'error');
      }
      return;
    }

    const flashcardItems = document.querySelectorAll('.flashcard-creation-item');
    const flashcards = [];
    
    flashcardItems.forEach(item => {
      const front = item.querySelector('.flashcard-front').value;
      const back = item.querySelector('.flashcard-back').value;
      
      if (front && back) {
        flashcards.push({
          id: item.dataset.flashcardId,
          subject,
          front,
          back,
          createdAt: new Date().toISOString(),
          studied: false,
          stats: { correct: 0, incorrect: 0, lastStudied: null }
        });
      }
    });
    
    if (flashcards.length === 0) {
      if (window.StudyHub && window.StudyHub.NotificationManager) {
        window.StudyHub.NotificationManager.show('Ajoutez au moins une flashcard', 'error');
      }
      return;
    }

    // Sauvegarder dans localStorage
    const allFlashcards = JSON.parse(localStorage.getItem('flashcards') || '[]');
    allFlashcards.push(...flashcards);
    localStorage.setItem('flashcards', JSON.stringify(allFlashcards));

    if (window.StudyHub && window.StudyHub.NotificationManager) {
      window.StudyHub.NotificationManager.show(`${flashcards.length} flashcards sauvegardées avec succès !`, 'success');
    }

    this.clearFlashcardForm();
    this.loadFlashcards();
  }

  clearFlashcardForm() {
    document.getElementById('flashcard-form').reset();
    document.getElementById('flashcards-creation-container').innerHTML = '';
  }

  // Gestion des statistiques
  updateStats() {
    const allFlashcards = JSON.parse(localStorage.getItem('flashcards') || '[]');
    const sessions = JSON.parse(localStorage.getItem('study_sessions') || '[]');
    
    // Statistiques générales
    document.getElementById('total-flashcards').textContent = allFlashcards.length;
    
    const totalAccuracy = this.calculateTotalAccuracy(allFlashcards);
    document.getElementById('flashcard-accuracy').textContent = `${totalAccuracy}%`;
    
    const totalStudyTime = sessions.reduce((sum, session) => sum + session.duration, 0);
    const totalHours = Math.round(totalStudyTime / 3600000);
    document.getElementById('study-time').textContent = `${totalHours}h`;
    
    // Statistiques par matière
    this.displaySubjectStats();
  }

  calculateTotalAccuracy(flashcards) {
    const studiedCards = flashcards.filter(card => card.studied);
    if (studiedCards.length === 0) return 0;
    
    const totalCorrect = studiedCards.reduce((sum, card) => sum + (card.stats?.correct || 0), 0);
    const totalAttempts = studiedCards.reduce((sum, card) => sum + (card.stats?.correct || 0) + (card.stats?.incorrect || 0), 0);
    
    return totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  }

  displaySubjectStats() {
    const container = document.getElementById('subject-stats-flashcards');
    container.innerHTML = '';
    
    this.subjects.forEach(subject => {
      const subjectFlashcards = this.getFlashcardsForSubject(subject);
      const accuracy = this.calculateSubjectAccuracy(subjectFlashcards);
      const progress = this.calculateSubjectProgress(subject);
      
      const statCard = document.createElement('div');
      statCard.className = 'card';
      statCard.innerHTML = `
        <h4>${subject}</h4>
        <div class="subject-stats">
          <div class="stat-item">
            <span class="stat-label">Flashcards:</span>
            <span class="stat-value">${subjectFlashcards.length}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Précision:</span>
            <span class="stat-value">${accuracy}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Progression:</span>
            <span class="stat-value">${progress}%</span>
          </div>
        </div>
      `;
      container.appendChild(statCard);
    });
  }

  calculateSubjectAccuracy(flashcards) {
    const studiedCards = flashcards.filter(card => card.studied);
    if (studiedCards.length === 0) return 0;
    
    const totalCorrect = studiedCards.reduce((sum, card) => sum + (card.stats?.correct || 0), 0);
    const totalAttempts = studiedCards.reduce((sum, card) => sum + (card.stats?.correct || 0) + (card.stats?.incorrect || 0), 0);
    
    return totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  }

  // Autres méthodes utilitaires
  loadFlashcards() {
    // Cette méthode peut être utilisée pour charger les flashcards existantes
    // et les afficher dans l'interface
  }

  viewSubjectDetails(subject) {
    const flashcards = this.getFlashcardsForSubject(subject);
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${subject}</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="subject-details">
            <p><strong>Nombre de flashcards:</strong> ${flashcards.length}</p>
            <p><strong>Progression:</strong> ${this.calculateSubjectProgress(subject)}%</p>
            <p><strong>Précision:</strong> ${this.calculateSubjectAccuracy(flashcards)}%</p>
          </div>
          
          <div class="flashcards-list">
            <h4>Flashcards de cette matière</h4>
            ${flashcards.length > 0 ? flashcards.map((card, index) => `
              <div class="flashcard-item">
                <h5>Flashcard ${index + 1}</h5>
                <p><strong>Question:</strong> ${card.front}</p>
                <p><strong>Réponse:</strong> ${card.back}</p>
                ${card.studied ? `
                  <p><strong>Statistiques:</strong> ${card.stats?.correct || 0} correctes, ${card.stats?.incorrect || 0} incorrectes</p>
                ` : '<p><em>Pas encore étudiée</em></p>'}
              </div>
            `).join('') : '<p>Aucune flashcard dans cette matière</p>'}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
}

// Initialiser le gestionnaire de flashcards
let flashcardManager;

document.addEventListener('DOMContentLoaded', () => {
  flashcardManager = new FlashcardManager();
});

// Fonctions globales pour les appels depuis HTML
function createSubject() {
  if (flashcardManager) flashcardManager.createSubject();
}

function startStudySession(subject) {
  if (flashcardManager) flashcardManager.startStudySession(subject);
}

function viewSubjectDetails(subject) {
  if (flashcardManager) flashcardManager.viewSubjectDetails(subject);
}

function flipCard() {
  if (flashcardManager) flashcardManager.flipCard();
}

function nextCard() {
  if (flashcardManager) flashcardManager.nextCard();
}

function previousCard() {
  if (flashcardManager) flashcardManager.previousCard();
}

function markAsCorrect() {
  if (flashcardManager) flashcardManager.markAsCorrect();
}

function markAsIncorrect() {
  if (flashcardManager) flashcardManager.markAsIncorrect();
}

function addFlashcardField() {
  if (flashcardManager) flashcardManager.addFlashcardField();
}

function removeFlashcardField(flashcardId) {
  if (flashcardManager) flashcardManager.removeFlashcardField(flashcardId);
}

function clearFlashcardForm() {
  if (flashcardManager) flashcardManager.clearFlashcardForm();
}
