// Système de chat IA StudyHub
class AIChatManager {
  constructor() {
    this.currentSubject = null;
    this.chatHistory = [];
    this.isTyping = false;
    
    // Éléments DOM
    this.subjectSelect = document.getElementById('chat-subject');
    this.chatMessages = document.getElementById('chat-messages');
    this.chatInput = document.getElementById('chat-input');
    this.sendButton = document.getElementById('send-message');
    this.clearButton = document.getElementById('clear-chat');
    this.exportButton = document.getElementById('export-chat');
    this.voiceButton = document.getElementById('voice-input');
    this.subjectInfo = document.getElementById('subject-info');
    this.contextContent = document.getElementById('context-content');
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadSubjects();
    this.loadChatHistory();
  }

  setupEventListeners() {
    // Sélection de matière
    this.subjectSelect?.addEventListener('change', (e) => {
      this.selectSubject(e.target.value);
    });

    // Saisie de message
    this.chatInput?.addEventListener('input', (e) => {
      this.handleInputChange(e.target.value);
    });

    this.chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Boutons d'action
    this.sendButton?.addEventListener('click', () => this.sendMessage());
    this.clearButton?.addEventListener('click', () => this.clearChat());
    this.exportButton?.addEventListener('click', () => this.exportChat());
    this.voiceButton?.addEventListener('click', () => this.startVoiceInput());

    // Questions suggérées
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('question-chip')) {
        const question = e.target.dataset.question;
        this.chatInput.value = question;
        this.handleInputChange(question);
      }
    });
  }

  loadSubjects() {
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    this.subjectSelect.innerHTML = '<option value="">Choisir une matière...</option>';
    
    subjects.forEach(subject => {
      const option = document.createElement('option');
      option.value = subject;
      option.textContent = subject;
      this.subjectSelect.appendChild(option);
    });
  }

  selectSubject(subjectName) {
    if (!subjectName) {
      this.currentSubject = null;
      this.subjectInfo.classList.add('hidden');
      this.contextContent.innerHTML = `
        <div class="empty-context">
          <i class="fas fa-info-circle"></i>
          <p>Sélectionnez une matière pour voir le contexte</p>
        </div>
      `;
      return;
    }

    this.currentSubject = { name: subjectName };
    
    this.updateSubjectInfo();
    this.updateContextContent();
    this.subjectInfo.classList.remove('hidden');
  }

  updateSubjectInfo() {
    if (!this.currentSubject) return;

    const qcmData = JSON.parse(localStorage.getItem('qcm_data') || '{}');
    const flashcards = JSON.parse(localStorage.getItem('flashcards') || '{}');
    const resumes = JSON.parse(localStorage.getItem('resumes') || '{}');

    const subjectQCM = qcmData[this.currentSubject.id] || { questions: [] };
    const subjectFlashcards = flashcards[this.currentSubject.id] || [];
    const subjectResumes = resumes[this.currentSubject.id] || [];

    document.getElementById('doc-count').textContent = subjectResumes.length;
    document.getElementById('qcm-count').textContent = subjectQCM.questions.length;
    document.getElementById('flashcard-count').textContent = subjectFlashcards.length;
  }

  updateContextContent() {
    if (!this.currentSubject) return;

    const qcmData = JSON.parse(localStorage.getItem('qcm_data') || '{}');
    const flashcards = JSON.parse(localStorage.getItem('flashcards') || '{}');
    const resumes = JSON.parse(localStorage.getItem('resumes') || '{}');

    const subjectQCM = qcmData[this.currentSubject.id] || { questions: [] };
    const subjectFlashcards = flashcards[this.currentSubject.id] || [];
    const subjectResumes = resumes[this.currentSubject.id] || [];

    let contextHTML = `
      <div class="context-section">
        <h5>Résumés disponibles</h5>
        <div class="context-items">
    `;

    subjectResumes.forEach(resume => {
      contextHTML += `
        <div class="context-item">
          <i class="fas fa-file-alt"></i>
          <span>${resume.title}</span>
        </div>
      `;
    });

    contextHTML += `
        </div>
      </div>
      <div class="context-section">
        <h5>Concepts clés (QCM)</h5>
        <div class="context-items">
    `;

    // Extraire les concepts des questions QCM
    const concepts = new Set();
    subjectQCM.questions.forEach(q => {
      const words = q.question.split(' ').filter(word => 
        word.length > 4 && /^[A-Za-zÀ-ÿ]+$/.test(word)
      );
      words.slice(0, 3).forEach(word => concepts.add(word.toLowerCase()));
    });

    Array.from(concepts).slice(0, 10).forEach(concept => {
      contextHTML += `
        <div class="context-item">
          <i class="fas fa-lightbulb"></i>
          <span>${concept}</span>
        </div>
      `;
    });

    contextHTML += `
        </div>
      </div>
    `;

    this.contextContent.innerHTML = contextHTML;
  }

  handleInputChange(value) {
    const isValid = value.trim().length > 0 && this.currentSubject;
    this.sendButton.disabled = !isValid;
  }

  async sendMessage() {
    const message = this.chatInput.value.trim();
    if (!message || !this.currentSubject) return;

    // Ajouter le message utilisateur
    this.addMessage(message, 'user');
    this.chatInput.value = '';
    this.handleInputChange('');

    // Simuler la réponse de l'IA
    await this.generateAIResponse(message);
  }

  addMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const timestamp = new Date().toLocaleTimeString();
    
    messageDiv.innerHTML = `
      <div class="message-avatar">
        <i class="fas fa-${sender === 'user' ? 'user' : 'robot'}"></i>
      </div>
      <div class="message-content">
        <div class="message-text">${this.formatMessage(content)}</div>
        <div class="message-time">${timestamp}</div>
      </div>
    `;

    this.chatMessages.appendChild(messageDiv);
    this.scrollToBottom();

    // Sauvegarder dans l'historique
    this.chatHistory.push({
      content,
      sender,
      timestamp: new Date().toISOString(),
      subject: this.currentSubject?.id
    });

    this.saveChatHistory();
  }

  formatMessage(content) {
    // Formater le message avec support pour le markdown basique
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  async generateAIResponse(userQuestion) {
    this.isTyping = true;
    this.showTypingIndicator();

    try {
      // Récupérer le contexte du cours
      const context = this.getCourseContext();
      
      // Utiliser le vrai service IA
      const response = await window.AIService.generateResponse(userQuestion, context);
      
      // Supprimer l'indicateur de frappe
      this.hideTypingIndicator();
      
      // Ajouter la réponse
      this.addMessage(response, 'ai');
      
    } catch (error) {
      this.hideTypingIndicator();
      this.addMessage('Désolé, je n\'ai pas pu traiter votre question. Veuillez réessayer.', 'ai');
      console.error('Erreur lors de la génération de la réponse:', error);
    }

    this.isTyping = false;
  }

  getCourseContext() {
    if (!this.currentSubject) return {};

    const qcmData = JSON.parse(localStorage.getItem('qcm_data') || '{}');
    const flashcards = JSON.parse(localStorage.getItem('flashcards') || '{}');
    const resumes = JSON.parse(localStorage.getItem('resumes') || '{}');

    return {
      subject: this.currentSubject,
      qcm: qcmData[this.currentSubject.id] || {},
      flashcards: flashcards[this.currentSubject.id] || [],
      resumes: resumes[this.currentSubject.id] || []
    };
  }

  async processAIResponse(question, context) {
    // Cette méthode n'est plus utilisée, remplacée par window.AIService.generateResponse
    // Gardée pour compatibilité
    return window.AIService.generateResponse(question, context);
  }

  generateContextualResponse(question, context) {
    const lowerQuestion = question.toLowerCase();
    
    // Réponses basées sur le type de question
    if (lowerQuestion.includes('concept') || lowerQuestion.includes('princip')) {
      return this.generateConceptsResponse(context);
    } else if (lowerQuestion.includes('formule') || lowerQuestion.includes('calcul')) {
      return this.generateFormulasResponse(context);
    } else if (lowerQuestion.includes('exemple') || lowerQuestion.includes('pratique')) {
      return this.generateExamplesResponse(context);
    } else if (lowerQuestion.includes('difficile') || lowerQuestion.includes('compliqué')) {
      return this.generateDifficultPointsResponse(context);
    } else {
      return this.generateGeneralResponse(question, context);
    }
  }

  generateConceptsResponse(context) {
    const concepts = this.extractConcepts(context);
    return `Voici les **concepts principaux** de ${context.subject.name} :

${concepts.map(concept => `• **${concept}** : Concept fondamental à maîtriser`).join('\n')}

Ces concepts sont essentiels pour bien comprendre la matière. Je recommande de les revoir régulièrement !`;
  }

  generateFormulasResponse(context) {
    const formulas = this.extractFormulas(context);
    if (formulas.length > 0) {
      return `Voici les **formules importantes** à retenir :

${formulas.map(formula => `• ${formula}`).join('\n')}

N'oubliez pas de bien comprendre quand et comment utiliser chaque formule !`;
    } else {
      return `Pour cette matière, il n'y a pas de formules mathématiques spécifiques identifiées. L'accent est mis sur la compréhension des concepts et la logique.`;
    }
  }

  generateExamplesResponse(context) {
    return `Voici quelques **exemples pratiques** pour ${context.subject.name} :

• **Exemple 1** : Application concrète du concept principal
• **Exemple 2** : Cas d'usage typique dans la pratique
• **Exemple 3** : Situation réelle où ces connaissances sont utiles

Ces exemples vous aideront à mieux comprendre l'application pratique des concepts théoriques.`;
  }

  generateDifficultPointsResponse(context) {
    return `Les **points difficiles** de ${context.subject.name} sont généralement :

• **Compréhension des concepts abstraits** : Prenez le temps de bien assimiler
• **Application pratique** : Entraînez-vous avec des exercices
• **Connexions entre les notions** : Essayez de faire des liens

Mon conseil : concentrez-vous sur ces points et n'hésitez pas à me poser des questions spécifiques !`;
  }

  generateGeneralResponse(question, context) {
    return `Excellente question sur ${context.subject.name} ! 

Basé sur le contenu de vos cours, voici ce que je peux vous dire :

**Contexte** : Votre cours contient ${context.qcm.questions?.length || 0} questions QCM et ${context.flashcards.length} flashcards, ce qui indique une bonne couverture du sujet.

**Ma réponse** : ${this.generateInsightfulResponse(question)}

N'hésitez pas à me poser des questions plus spécifiques pour approfondir !`;
  }

  generateInsightfulResponse(question) {
    const responses = [
      "Cette question touche à un aspect important de la matière. Je recommande de revoir les concepts de base avant d'aborder ce point.",
      "C'est une excellente question qui montre une bonne compréhension du sujet. Continuez dans cette direction !",
      "Ce point est souvent source de confusion. Laissez-moi vous expliquer de manière simple...",
      "Votre question révèle une curiosité intellectuelle intéressante. Voici comment aborder ce sujet...",
      "Cette question fait le lien entre plusieurs concepts. C'est exactement le type de réflexion qui mène à la maîtrise du sujet."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  extractConcepts(context) {
    const concepts = new Set();
    
    // Extraire des questions QCM
    context.qcm.questions?.forEach(q => {
      const words = q.question.split(' ').filter(word => 
        word.length > 4 && /^[A-Za-zÀ-ÿ]+$/.test(word)
      );
      words.slice(0, 2).forEach(word => concepts.add(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()));
    });

    // Extraire des flashcards
    context.flashcards.forEach(card => {
      const words = card.question.split(' ').filter(word => 
        word.length > 4 && /^[A-Za-zÀ-ÿ]+$/.test(word)
      );
      words.slice(0, 2).forEach(word => concepts.add(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()));
    });

    return Array.from(concepts).slice(0, 5);
  }

  extractFormulas(context) {
    const formulas = [];
    
    // Chercher des formules dans les questions et réponses
    const allText = [
      ...context.qcm.questions?.map(q => q.question + ' ' + q.answers.join(' ')) || [],
      ...context.flashcards.map(card => card.question + ' ' + card.answer) || []
    ].join(' ');

    // Regex pour détecter des formules simples
    const formulaPatterns = [
      /[A-Za-z]\s*=\s*[A-Za-z0-9+\-*/()]+/g,
      /[A-Za-z]\s*\+\s*[A-Za-z]/g,
      /[A-Za-z]\s*\*\s*[A-Za-z]/g
    ];

    formulaPatterns.forEach(pattern => {
      const matches = allText.match(pattern);
      if (matches) {
        formulas.push(...matches.slice(0, 3));
      }
    });

    return formulas.slice(0, 5);
  }

  showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai-message typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    typingDiv.innerHTML = `
      <div class="message-avatar">
        <i class="fas fa-robot"></i>
      </div>
      <div class="message-content">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;

    this.chatMessages.appendChild(typingDiv);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  scrollToBottom() {
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  clearChat() {
    if (confirm('Êtes-vous sûr de vouloir effacer toute la conversation ?')) {
      this.chatMessages.innerHTML = `
        <div class="welcome-message">
          <div class="ai-avatar">
            <i class="fas fa-robot"></i>
          </div>
          <div class="message-content">
            <h4>Conversation effacée</h4>
            <p>Nouvelle conversation démarrée. Posez vos questions !</p>
          </div>
        </div>
      `;
      this.chatHistory = [];
      this.saveChatHistory();
    }
  }

  exportChat() {
    if (this.chatHistory.length === 0) {
      NotificationManager.show('Aucune conversation à exporter', 'info');
      return;
    }

    const chatText = this.chatHistory.map(msg => 
      `[${new Date(msg.timestamp).toLocaleString()}] ${msg.sender.toUpperCase()}: ${msg.content}`
    ).join('\n\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-studyhub-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    NotificationManager.show('Conversation exportée avec succès', 'success');
  }

  startVoiceInput() {
    NotificationManager.show('Fonctionnalité de saisie vocale en cours de développement', 'info');
  }

  loadChatHistory() {
    const savedHistory = localStorage.getItem('studyhub_chat_history');
    if (savedHistory) {
      try {
        this.chatHistory = JSON.parse(savedHistory);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique:', error);
        this.chatHistory = [];
      }
    }
  }

  saveChatHistory() {
    // Garder seulement les 50 derniers messages
    if (this.chatHistory.length > 50) {
      this.chatHistory = this.chatHistory.slice(-50);
    }
    
    localStorage.setItem('studyhub_chat_history', JSON.stringify(this.chatHistory));
  }
}

// Initialisation du gestionnaire de chat IA
const aiChatManager = new AIChatManager();

// Export pour utilisation dans d'autres modules
window.AIChatManager = AIChatManager;
window.aiChatManager = aiChatManager;