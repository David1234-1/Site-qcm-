// Gestionnaire principal des QCM
class QCMManager {
  constructor() {
    this.currentQCM = null;
    this.currentQuestionIndex = 0;
    this.userAnswers = [];
    this.startTime = null;
    this.questionCounter = 0;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadSubjects();
    this.loadQCMs();
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
    document.getElementById('qcm-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveQCM();
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
    } else if (tabName === 'practice') {
      this.loadQCMsForPractice();
    }
  }

  // Gestion des matières
  loadSubjects() {
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    const subjectSelects = ['subject-select', 'practice-subject'];
    
    subjectSelects.forEach(selectId => {
      const select = document.getElementById(selectId);
      if (select) {
        // Garder l'option par défaut
        select.innerHTML = '<option value="">Sélectionner une matière</option>';
        
        subjects.forEach(subject => {
          const option = document.createElement('option');
          option.value = subject;
          option.textContent = subject;
          select.appendChild(option);
        });
      }
    });
  }

  createNewSubject() {
    const subject = prompt('Nom de la nouvelle matière :');
    if (subject && subject.trim()) {
      const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
      if (!subjects.includes(subject)) {
        subjects.push(subject);
        localStorage.setItem('subjects', JSON.stringify(subjects));
        this.loadSubjects();
        
        if (window.StudyHub && window.StudyHub.NotificationManager) {
          window.StudyHub.NotificationManager.show(`Matière "${subject}" créée avec succès`, 'success');
        }
      }
    }
  }

  // Gestion de la création de QCM
  addQuestion() {
    const container = document.getElementById('questions-container');
    const questionId = Date.now() + Math.random();
    
    const questionHTML = `
      <div class="question-item card" data-question-id="${questionId}">
        <div class="question-header">
          <h4>Question ${container.children.length + 1}</h4>
          <button type="button" class="btn btn-error" onclick="qcmManager.removeQuestion('${questionId}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        
        <div class="form-group">
          <label class="form-label">Question</label>
          <textarea class="form-textarea question-text" placeholder="Entrez votre question..." required></textarea>
        </div>
        
        <div class="answers-container">
          <div class="form-group">
            <label class="form-label">Réponse A</label>
            <input type="text" class="form-input answer-input" placeholder="Première réponse" required>
          </div>
          <div class="form-group">
            <label class="form-label">Réponse B</label>
            <input type="text" class="form-input answer-input" placeholder="Deuxième réponse" required>
          </div>
          <div class="form-group">
            <label class="form-label">Réponse C</label>
            <input type="text" class="form-input answer-input" placeholder="Troisième réponse" required>
          </div>
          <div class="form-group">
            <label class="form-label">Réponse D</label>
            <input type="text" class="form-input answer-input" placeholder="Quatrième réponse" required>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Bonne réponse</label>
          <select class="form-select correct-answer">
            <option value="0">A</option>
            <option value="1">B</option>
            <option value="2">C</option>
            <option value="3">D</option>
          </select>
        </div>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', questionHTML);
  }

  removeQuestion(questionId) {
    const questionElement = document.querySelector(`[data-question-id="${questionId}"]`);
    if (questionElement) {
      questionElement.remove();
      this.updateQuestionNumbers();
    }
  }

  updateQuestionNumbers() {
    const questions = document.querySelectorAll('.question-item');
    questions.forEach((question, index) => {
      const header = question.querySelector('h4');
      header.textContent = `Question ${index + 1}`;
    });
  }

  saveQCM() {
    const subject = document.getElementById('subject-select').value;
    const title = document.getElementById('qcm-title').value;
    const description = document.getElementById('qcm-description').value;
    
    if (!subject || !title) {
      if (window.StudyHub && window.StudyHub.NotificationManager) {
        window.StudyHub.NotificationManager.show('Veuillez remplir tous les champs obligatoires', 'error');
      }
      return;
    }

    const questions = this.collectQuestions();
    if (questions.length === 0) {
      if (window.StudyHub && window.StudyHub.NotificationManager) {
        window.StudyHub.NotificationManager.show('Ajoutez au moins une question', 'error');
      }
      return;
    }

    const qcm = {
      id: Date.now().toString(),
      title,
      description,
      subject,
      questions,
      createdAt: new Date().toISOString(),
      attempts: 0,
      avgScore: 0
    };

    // Sauvegarder dans localStorage
    const qcmData = JSON.parse(localStorage.getItem('qcm_data') || '{}');
    if (!qcmData[subject]) {
      qcmData[subject] = [];
    }
    qcmData[subject].push(qcm);
    localStorage.setItem('qcm_data', JSON.stringify(qcmData));

    if (window.StudyHub && window.StudyHub.NotificationManager) {
      window.StudyHub.NotificationManager.show('QCM sauvegardé avec succès !', 'success');
    }

    this.clearForm();
    this.loadQCMs();
  }

  collectQuestions() {
    const questions = [];
    const questionElements = document.querySelectorAll('.question-item');
    
    questionElements.forEach(element => {
      const questionText = element.querySelector('.question-text').value;
      const answers = Array.from(element.querySelectorAll('.answer-input')).map(input => input.value);
      const correctAnswer = parseInt(element.querySelector('.correct-answer').value);
      
      if (questionText && answers.every(answer => answer.trim())) {
        questions.push({
          id: element.dataset.questionId,
          text: questionText,
          answers,
          correctAnswer
        });
      }
    });
    
    return questions;
  }

  clearForm() {
    document.getElementById('qcm-form').reset();
    document.getElementById('questions-container').innerHTML = '';
  }

  // Gestion de la pratique des QCM
  loadQCMsForPractice() {
    const subject = document.getElementById('practice-subject').value;
    if (!subject) return;

    const qcmData = JSON.parse(localStorage.getItem('qcm_data') || '{}');
    const qcms = qcmData[subject] || [];
    
    const qcmList = document.getElementById('qcm-list');
    qcmList.innerHTML = '';
    
    if (qcms.length === 0) {
      qcmList.innerHTML = '<p class="text-center">Aucun QCM disponible pour cette matière</p>';
      return;
    }
    
    qcms.forEach(qcm => {
      const qcmCard = document.createElement('div');
      qcmCard.className = 'card qcm-card';
      qcmCard.innerHTML = `
        <h4>${qcm.title}</h4>
        <p>${qcm.description || 'Aucune description'}</p>
        <div class="qcm-meta">
          <span><i class="fas fa-question-circle"></i> ${qcm.questions.length} questions</span>
          <span><i class="fas fa-play"></i> ${qcm.attempts} tentatives</span>
          <span><i class="fas fa-percentage"></i> ${qcm.avgScore}%</span>
        </div>
        <button class="btn btn-primary" onclick="qcmManager.startQCM('${qcm.id}', '${subject}')">
          <i class="fas fa-play"></i> Commencer
        </button>
      `;
      qcmList.appendChild(qcmCard);
    });
  }

  startQCM(qcmId, subject) {
    const qcmData = JSON.parse(localStorage.getItem('qcm_data') || '{}');
    const qcm = qcmData[subject].find(q => q.id === qcmId);
    
    if (!qcm) return;
    
    this.currentQCM = qcm;
    this.currentQuestionIndex = 0;
    this.userAnswers = new Array(qcm.questions.length).fill(null);
    this.startTime = Date.now();
    
    document.getElementById('qcm-practice-container').classList.remove('hidden');
    document.getElementById('current-qcm-title').textContent = qcm.title;
    
    this.showQuestion();
  }

  showQuestion() {
    const question = this.currentQCM.questions[this.currentQuestionIndex];
    const container = document.getElementById('question-container');
    
    container.innerHTML = `
      <div class="question-card">
        <div class="question-text">${question.text}</div>
        <div class="answer-options">
          ${question.answers.map((answer, index) => `
            <div class="answer-option" onclick="qcmManager.selectAnswer(${index})">
              <span class="answer-letter">${String.fromCharCode(65 + index)}</span>
              <span class="answer-text">${answer}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    // Mettre à jour la progression
    this.updateProgress();
    
    // Mettre à jour les boutons
    this.updateNavigationButtons();
  }

  selectAnswer(answerIndex) {
    // Retirer la sélection précédente
    document.querySelectorAll('.answer-option').forEach(option => {
      option.classList.remove('selected');
    });
    
    // Sélectionner la nouvelle réponse
    const selectedOption = document.querySelectorAll('.answer-option')[answerIndex];
    selectedOption.classList.add('selected');
    
    // Sauvegarder la réponse
    this.userAnswers[this.currentQuestionIndex] = answerIndex;
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.currentQCM.questions.length - 1) {
      this.currentQuestionIndex++;
      this.showQuestion();
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.showQuestion();
    }
  }

  updateProgress() {
    const progress = ((this.currentQuestionIndex + 1) / this.currentQCM.questions.length) * 100;
    document.getElementById('qcm-progress-fill').style.width = `${progress}%`;
    document.getElementById('question-counter').textContent = 
      `Question ${this.currentQuestionIndex + 1}/${this.currentQCM.questions.length}`;
  }

  updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const finishBtn = document.getElementById('finish-btn');
    
    prevBtn.disabled = this.currentQuestionIndex === 0;
    nextBtn.style.display = this.currentQuestionIndex === this.currentQCM.questions.length - 1 ? 'none' : 'inline-flex';
    finishBtn.style.display = this.currentQuestionIndex === this.currentQCM.questions.length - 1 ? 'inline-flex' : 'none';
  }

  finishQCM() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    // Calculer le score
    let correctAnswers = 0;
    this.userAnswers.forEach((answer, index) => {
      if (answer === this.currentQCM.questions[index].correctAnswer) {
        correctAnswers++;
      }
    });
    
    const score = Math.round((correctAnswers / this.currentQCM.questions.length) * 100);
    
    // Sauvegarder le résultat
    this.saveResult(score, correctAnswers, duration);
    
    // Afficher les résultats
    this.showResults(score, correctAnswers, duration);
  }

  saveResult(score, correctAnswers, duration) {
    const result = {
      qcmId: this.currentQCM.id,
      qcmTitle: this.currentQCM.title,
      subject: this.currentQCM.subject,
      score,
      correctAnswers,
      totalQuestions: this.currentQCM.questions.length,
      duration,
      date: new Date().toISOString(),
      answers: this.userAnswers
    };
    
    // Sauvegarder dans les résultats
    const results = JSON.parse(localStorage.getItem('qcm_results') || '{}');
    if (!results[this.currentQCM.subject]) {
      results[this.currentQCM.subject] = [];
    }
    results[this.currentQCM.subject].push(result);
    localStorage.setItem('qcm_results', JSON.stringify(results));
    
    // Mettre à jour les statistiques du QCM
    this.updateQCMStats(score);
  }

  updateQCMStats(score) {
    const qcmData = JSON.parse(localStorage.getItem('qcm_data') || '{}');
    const qcm = qcmData[this.currentQCM.subject].find(q => q.id === this.currentQCM.id);
    
    if (qcm) {
      qcm.attempts++;
      qcm.avgScore = Math.round(((qcm.avgScore * (qcm.attempts - 1)) + score) / qcm.attempts);
      localStorage.setItem('qcm_data', JSON.stringify(qcmData));
    }
  }

  showResults(score, correctAnswers, duration) {
    const modal = document.getElementById('results-modal');
    const finalScore = document.getElementById('final-score');
    const scoreMessage = document.getElementById('score-message');
    const correctAnswersSpan = document.getElementById('correct-answers');
    const completionTime = document.getElementById('completion-time');
    const completionDate = document.getElementById('completion-date');
    
    finalScore.textContent = `${score}%`;
    correctAnswersSpan.textContent = `${correctAnswers}/${this.currentQCM.questions.length}`;
    completionTime.textContent = this.formatDuration(duration);
    completionDate.textContent = new Date().toLocaleDateString('fr-FR');
    
    // Message selon le score
    if (score >= 90) {
      scoreMessage.textContent = 'Excellent travail !';
    } else if (score >= 70) {
      scoreMessage.textContent = 'Bon travail !';
    } else if (score >= 50) {
      scoreMessage.textContent = 'Pas mal, continuez !';
    } else {
      scoreMessage.textContent = 'À améliorer, ne vous découragez pas !';
    }
    
    // Afficher la révision des questions
    this.showQuestionReview();
    
    modal.classList.remove('hidden');
  }

  showQuestionReview() {
    const reviewList = document.getElementById('question-review-list');
    reviewList.innerHTML = '';
    
    this.currentQCM.questions.forEach((question, index) => {
      const userAnswer = this.userAnswers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      
      const reviewItem = document.createElement('div');
      reviewItem.className = `review-item ${isCorrect ? 'correct' : 'incorrect'}`;
      reviewItem.innerHTML = `
        <div class="review-question">
          <h5>Question ${index + 1}</h5>
          <p>${question.text}</p>
        </div>
        <div class="review-answers">
          ${question.answers.map((answer, answerIndex) => `
            <div class="review-answer ${answerIndex === question.correctAnswer ? 'correct' : ''} ${answerIndex === userAnswer ? 'selected' : ''}">
              <span class="answer-letter">${String.fromCharCode(65 + answerIndex)}</span>
              <span class="answer-text">${answer}</span>
            </div>
          `).join('')}
        </div>
      `;
      reviewList.appendChild(reviewItem);
    });
  }

  formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  closeResultsModal() {
    document.getElementById('results-modal').classList.add('hidden');
    document.getElementById('qcm-practice-container').classList.add('hidden');
    this.currentQCM = null;
  }

  retryQCM() {
    this.closeResultsModal();
    this.startQCM(this.currentQCM.id, this.currentQCM.subject);
  }

  // Gestion des statistiques
  updateStats() {
    const results = JSON.parse(localStorage.getItem('qcm_results') || '{}');
    
    let totalAttempts = 0;
    let totalScore = 0;
    let totalTime = 0;
    
    Object.values(results).forEach(subjectResults => {
      totalAttempts += subjectResults.length;
      subjectResults.forEach(result => {
        totalScore += result.score;
        totalTime += result.duration;
      });
    });
    
    const avgScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;
    const totalHours = Math.round(totalTime / 3600000);
    
    document.getElementById('total-attempts').textContent = totalAttempts;
    document.getElementById('avg-score-qcm').textContent = `${avgScore}%`;
    document.getElementById('total-time').textContent = `${totalHours}h`;
    
    this.showSubjectStats();
    this.showRecentResults();
  }

  showSubjectStats() {
    const results = JSON.parse(localStorage.getItem('qcm_results') || '{}');
    const container = document.getElementById('subject-stats');
    container.innerHTML = '';
    
    Object.entries(results).forEach(([subject, subjectResults]) => {
      const avgScore = Math.round(subjectResults.reduce((sum, result) => sum + result.score, 0) / subjectResults.length);
      const totalTime = subjectResults.reduce((sum, result) => sum + result.duration, 0);
      
      const statCard = document.createElement('div');
      statCard.className = 'card';
      statCard.innerHTML = `
        <h4>${subject}</h4>
        <div class="subject-stats">
          <div class="stat-item">
            <span class="stat-label">Tentatives:</span>
            <span class="stat-value">${subjectResults.length}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Score moyen:</span>
            <span class="stat-value">${avgScore}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Temps total:</span>
            <span class="stat-value">${Math.round(totalTime / 60000)}min</span>
          </div>
        </div>
      `;
      container.appendChild(statCard);
    });
  }

  showRecentResults() {
    const results = JSON.parse(localStorage.getItem('qcm_results') || '{}');
    const allResults = [];
    
    Object.entries(results).forEach(([subject, subjectResults]) => {
      subjectResults.forEach(result => {
        allResults.push({ ...result, subject });
      });
    });
    
    // Trier par date (plus récent en premier)
    allResults.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const container = document.getElementById('recent-results-list');
    container.innerHTML = '';
    
    allResults.slice(0, 10).forEach(result => {
      const resultItem = document.createElement('div');
      resultItem.className = 'card result-item';
      resultItem.innerHTML = `
        <div class="result-header">
          <h5>${result.qcmTitle}</h5>
          <span class="result-score ${result.score >= 70 ? 'good' : result.score >= 50 ? 'average' : 'poor'}">${result.score}%</span>
        </div>
        <div class="result-details">
          <span><i class="fas fa-book"></i> ${result.subject}</span>
          <span><i class="fas fa-clock"></i> ${this.formatDuration(result.duration)}</span>
          <span><i class="fas fa-calendar"></i> ${new Date(result.date).toLocaleDateString('fr-FR')}</span>
        </div>
      `;
      container.appendChild(resultItem);
    });
  }

  loadQCMs() {
    // Cette méthode peut être utilisée pour charger les QCM existants
    // et les afficher dans l'interface
  }
}

// Initialiser le gestionnaire de QCM
let qcmManager;

document.addEventListener('DOMContentLoaded', () => {
  qcmManager = new QCMManager();
});

// Fonctions globales pour les appels depuis HTML
function createNewSubject() {
  if (qcmManager) qcmManager.createNewSubject();
}

function addQuestion() {
  if (qcmManager) qcmManager.addQuestion();
}

function clearForm() {
  if (qcmManager) qcmManager.clearForm();
}

function loadQCMsForSubject() {
  if (qcmManager) qcmManager.loadQCMsForPractice();
}

function selectAnswer(index) {
  if (qcmManager) qcmManager.selectAnswer(index);
}

function nextQuestion() {
  if (qcmManager) qcmManager.nextQuestion();
}

function previousQuestion() {
  if (qcmManager) qcmManager.previousQuestion();
}

function finishQCM() {
  if (qcmManager) qcmManager.finishQCM();
}

function closeResultsModal() {
  if (qcmManager) qcmManager.closeResultsModal();
}

function retryQCM() {
  if (qcmManager) qcmManager.retryQCM();
}