// Gestionnaire principal de l'import de fichiers
class ImportManager {
  constructor() {
    this.selectedFile = null;
    this.uploadQueue = [];
    this.processingQueue = [];
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadSubjects();
    this.loadImportedFiles();
    this.setupDragAndDrop();
  }

  setupEventListeners() {
    // Gestion des onglets
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Gestion du formulaire d'upload
    document.getElementById('upload-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.uploadFile();
    });

    // Gestion de la sélection de fichier
    document.getElementById('file-input').addEventListener('change', (e) => {
      this.handleFileSelect(e.target.files[0]);
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
    if (tabName === 'files') {
      this.loadImportedFiles();
    } else if (tabName === 'processing') {
      this.updateProcessingQueue();
    }
  }

  // Gestion des matières
  loadSubjects() {
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    const subjectSelects = ['file-subject', 'filter-subject'];
    
    subjectSelects.forEach(selectId => {
      const select = document.getElementById(selectId);
      if (select) {
        // Garder l'option par défaut
        const defaultOption = selectId === 'filter-subject' ? 'Toutes les matières' : 'Sélectionner une matière';
        select.innerHTML = `<option value="">${defaultOption}</option>`;
        
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

  // Gestion du drag & drop
  setupDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    // Clic sur la zone de drop
    dropZone.addEventListener('click', () => {
      fileInput.click();
    });

    // Drag over
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    // Drag leave
    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    });

    // Drop
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFileSelect(files[0]);
      }
    });
  }

  handleFileSelect(file) {
    if (!file) return;

    // Vérifier le type de fichier
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      if (window.StudyHub && window.StudyHub.NotificationManager) {
        window.StudyHub.NotificationManager.show('Format de fichier non supporté. Utilisez PDF, DOC ou DOCX.', 'error');
      }
      return;
    }

    // Vérifier la taille (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      if (window.StudyHub && window.StudyHub.NotificationManager) {
        window.StudyHub.NotificationManager.show('Fichier trop volumineux. Taille maximum: 10MB.', 'error');
      }
      return;
    }

    this.selectedFile = file;
    this.showFilePreview(file);
    document.getElementById('upload-btn').disabled = false;
  }

  showFilePreview(file) {
    const preview = document.getElementById('file-preview');
    const dropZone = document.getElementById('drop-zone');
    const name = document.getElementById('preview-name');
    const size = document.getElementById('preview-size');

    name.textContent = file.name;
    size.textContent = this.formatFileSize(file.size);

    dropZone.classList.add('hidden');
    preview.classList.remove('hidden');
  }

  removeFile() {
    this.selectedFile = null;
    document.getElementById('file-preview').classList.add('hidden');
    document.getElementById('drop-zone').classList.remove('hidden');
    document.getElementById('file-input').value = '';
    document.getElementById('upload-btn').disabled = true;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Upload et traitement
  async uploadFile() {
    if (!this.selectedFile) {
      NotificationManager.show('Veuillez sélectionner un fichier', 'error');
      return;
    }

    const subject = document.getElementById('file-subject').value;
    const title = document.getElementById('file-title').value;
    const description = document.getElementById('file-description').value;

    if (!subject || !title) {
      NotificationManager.show('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    // Valider le fichier
    try {
      window.DocumentProcessor.validateFile(this.selectedFile);
    } catch (error) {
      NotificationManager.show(error.message, 'error');
      return;
    }

    // Récupérer les options de traitement
    const options = {
      generateSummary: document.getElementById('generate-summary').checked,
      generateQCM: document.getElementById('generate-qcm').checked,
      generateFlashcards: document.getElementById('generate-flashcards').checked
    };

    // Sauvegarder le fichier
    const fileData = {
      id: Date.now().toString(),
      name: this.selectedFile.name,
      title,
      description,
      subject,
      size: this.selectedFile.size,
      type: this.selectedFile.type,
      uploadedAt: new Date().toISOString(),
      processingOptions: options,
      status: 'uploaded',
      content: null
    };

    // Sauvegarder dans localStorage
    const files = JSON.parse(localStorage.getItem('imported_files') || '[]');
    files.push(fileData);
    localStorage.setItem('imported_files', JSON.stringify(files));

    // Traiter le fichier avec le vrai processeur
    await this.processFile(fileData);

    NotificationManager.show('Fichier importé avec succès !', 'success');
    this.clearForm();
    this.loadImportedFiles();
  }

  async processFile(fileData) {
    // Ajouter à la queue de traitement
    this.processingQueue.push(fileData);
    this.updateProcessingQueue();

    // Afficher la modal de progression
    this.showProgressModal();
    
    try {
      // Étape 1: Upload (25%)
      this.updateProgress(25, 'upload');
      
      // Étape 2: Extraction du texte (50%)
      this.updateProgress(50, 'extract');
      const extractedData = await window.DocumentProcessor.processDocument(this.selectedFile);
      
      // Étape 3: Traitement IA (75%)
      this.updateProgress(75, 'process');
      const processedContent = await window.DocumentProcessor.generateStructuredContent(
        extractedData.text,
        {
          generateSummary: true,
          generateQCM: true,
          generateFlashcards: true,
          qcmCount: 15,
          flashcardCount: 20,
          subject: fileData.subject
        }
      );
      
      // Étape 4: Sauvegarde automatique du contenu généré (90%)
      this.updateProgress(90, 'save');
      const savedContent = await window.DocumentProcessor.saveGeneratedContent(
        processedContent,
        fileData.file.name
      );
      
      // Étape 5: Finalisation (100%)
      this.updateProgress(100, 'save');
      
      // Marquer comme terminé
      fileData.status = 'completed';
      fileData.content = {
        ...processedContent,
        extractedData,
        processedAt: new Date().toISOString(),
        savedContent: savedContent
      };
      
      // Mettre à jour le localStorage
      const files = JSON.parse(localStorage.getItem('imported_files') || '[]');
      const fileIndex = files.findIndex(f => f.id === fileData.id);
      if (fileIndex !== -1) {
        files[fileIndex] = fileData;
        localStorage.setItem('imported_files', JSON.stringify(files));
      }

      // Sauvegarder dans le cloud si l'utilisateur est connecté
      if (window.AuthManager && window.AuthManager.isAuthenticated()) {
        await window.AuthManager.saveUserDataToCloud({
          imported_files: files,
          flashcards: JSON.parse(localStorage.getItem('flashcards') || '[]'),
          qcm_data: JSON.parse(localStorage.getItem('qcm_data') || '{}'),
          resumes: JSON.parse(localStorage.getItem('resumes') || '{}'),
          subjects: JSON.parse(localStorage.getItem('subjects') || '[]')
        });
      }

      // Fermer la modal après un délai
      setTimeout(() => {
        this.hideProgressModal();
        this.updateProcessingQueue();
        this.loadImportedFiles();
        NotificationManager.show(`Traitement terminé ! ${savedContent.flashcards} flashcards, ${savedContent.qcm} QCM et ${savedContent.summary} résumé générés.`, 'success');
      }, 1000);
      
    } catch (error) {
      console.error('Erreur lors du traitement:', error);
      fileData.status = 'error';
      fileData.error = error.message;
      
      // Mettre à jour le localStorage
      const files = JSON.parse(localStorage.getItem('imported_files') || '[]');
      const fileIndex = files.findIndex(f => f.id === fileData.id);
      if (fileIndex !== -1) {
        files[fileIndex] = fileData;
        localStorage.setItem('imported_files', JSON.stringify(files));
      }
      
      this.hideProgressModal();
      this.updateProcessingQueue();
      this.loadImportedFiles();
      NotificationManager.show('Erreur lors du traitement: ' + error.message, 'error');
    }
  }

  updateProgress(percentage, step) {
    // Mettre à jour la barre de progression
    const progressFill = document.getElementById('modal-progress-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressPercentage) progressPercentage.textContent = `${percentage}%`;

    // Mettre à jour l'étape active
    const steps = ['upload', 'extract', 'process', 'save'];
    document.querySelectorAll('.step').forEach(stepEl => stepEl.classList.remove('active'));
    const currentStepEl = document.getElementById(`step-${step}`);
    if (currentStepEl) currentStepEl.classList.add('active');
  }

  generateMockContent(fileData) {
    // Générer du contenu fictif pour la démonstration
    const content = {
      summary: `Résumé automatique du document "${fileData.title}" généré par l'IA. Ce document traite de ${fileData.subject} et contient des informations importantes pour la révision.`,
      qcm: [
        {
          question: `Question générée automatiquement sur ${fileData.subject}`,
          answers: ['Réponse A', 'Réponse B', 'Réponse C', 'Réponse D'],
          correctAnswer: 0
        },
        {
          question: `Autre question sur ${fileData.subject}`,
          answers: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          correctAnswer: 2
        }
      ],
      flashcards: [
        {
          front: `Concept clé 1 - ${fileData.subject}`,
          back: 'Définition et explication du concept'
        },
        {
          front: `Concept clé 2 - ${fileData.subject}`,
          back: 'Autre définition importante'
        }
      ]
    };

    return content;
  }

  showProgressModal() {
    document.getElementById('progress-modal').classList.remove('hidden');
  }

  hideProgressModal() {
    document.getElementById('progress-modal').classList.add('hidden');
    // Reset des étapes
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    document.getElementById('step-upload').classList.add('active');
    document.getElementById('modal-progress-fill').style.width = '0%';
    document.getElementById('progress-percentage').textContent = '0%';
  }

  // Gestion des fichiers importés
  loadImportedFiles() {
    const files = JSON.parse(localStorage.getItem('imported_files') || '[]');
    const container = document.getElementById('files-list');
    
    if (files.length === 0) {
      container.innerHTML = '<p class="text-center">Aucun fichier importé</p>';
      return;
    }

    container.innerHTML = '';
    
    files.forEach(file => {
      const fileCard = this.createFileCard(file);
      container.appendChild(fileCard);
    });
  }

  createFileCard(file) {
    const card = document.createElement('div');
    card.className = 'card file-card';
    
    const statusClass = this.getStatusClass(file.status);
    const statusIcon = this.getStatusIcon(file.status);
    
    card.innerHTML = `
      <div class="file-card-header">
        <div class="file-icon">
          <i class="fas fa-file-${this.getFileIcon(file.type)}"></i>
        </div>
        <div class="file-info">
          <h4>${file.title}</h4>
          <p>${file.description || 'Aucune description'}</p>
          <div class="file-meta">
            <span><i class="fas fa-book"></i> ${file.subject}</span>
            <span><i class="fas fa-calendar"></i> ${new Date(file.uploadedAt).toLocaleDateString('fr-FR')}</span>
            <span><i class="fas fa-weight-hanging"></i> ${this.formatFileSize(file.size)}</span>
          </div>
        </div>
        <div class="file-status ${statusClass}">
          <i class="${statusIcon}"></i>
          <span>${this.getStatusText(file.status)}</span>
        </div>
      </div>
      
      <div class="file-actions">
        <button class="btn btn-primary" onclick="importManager.viewFile('${file.id}')">
          <i class="fas fa-eye"></i> Voir
        </button>
        <button class="btn btn-secondary" onclick="importManager.downloadFile('${file.id}')">
          <i class="fas fa-download"></i> Télécharger
        </button>
        <button class="btn btn-error" onclick="importManager.deleteFile('${file.id}')">
          <i class="fas fa-trash"></i> Supprimer
        </button>
      </div>
    `;
    
    return card;
  }

  getFileIcon(type) {
    if (type.includes('pdf')) return 'pdf';
    if (type.includes('word') || type.includes('document')) return 'word';
    return 'alt';
  }

  getStatusClass(status) {
    switch (status) {
      case 'uploaded': return 'status-uploaded';
      case 'processing': return 'status-processing';
      case 'completed': return 'status-completed';
      case 'error': return 'status-error';
      default: return '';
    }
  }

  getStatusIcon(status) {
    switch (status) {
      case 'uploaded': return 'fas fa-upload';
      case 'processing': return 'fas fa-cogs fa-spin';
      case 'completed': return 'fas fa-check-circle';
      case 'error': return 'fas fa-exclamation-circle';
      default: return 'fas fa-question-circle';
    }
  }

  getStatusText(status) {
    switch (status) {
      case 'uploaded': return 'Importé';
      case 'processing': return 'En cours';
      case 'completed': return 'Terminé';
      case 'error': return 'Erreur';
      default: return 'Inconnu';
    }
  }

  filterFiles() {
    const subject = document.getElementById('filter-subject').value;
    const files = JSON.parse(localStorage.getItem('imported_files') || '[]');
    const container = document.getElementById('files-list');
    
    container.innerHTML = '';
    
    const filteredFiles = subject ? files.filter(file => file.subject === subject) : files;
    
    if (filteredFiles.length === 0) {
      container.innerHTML = '<p class="text-center">Aucun fichier trouvé</p>';
      return;
    }
    
    filteredFiles.forEach(file => {
      const fileCard = this.createFileCard(file);
      container.appendChild(fileCard);
    });
  }

  viewFile(fileId) {
    const files = JSON.parse(localStorage.getItem('imported_files') || '[]');
    const file = files.find(f => f.id === fileId);
    
    if (!file) return;
    
    // Afficher les détails du fichier dans une modal
    this.showFileDetails(file);
  }

  showFileDetails(file) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${file.title}</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="file-details">
            <p><strong>Matière:</strong> ${file.subject}</p>
            <p><strong>Description:</strong> ${file.description || 'Aucune description'}</p>
            <p><strong>Date d'import:</strong> ${new Date(file.uploadedAt).toLocaleString('fr-FR')}</p>
            <p><strong>Taille:</strong> ${this.formatFileSize(file.size)}</p>
            <p><strong>Statut:</strong> ${this.getStatusText(file.status)}</p>
          </div>
          
          ${file.content ? `
            <div class="generated-content">
              <h4>Contenu généré</h4>
              
              <div class="content-section">
                <h5>Résumé</h5>
                <p>${file.content.summary}</p>
              </div>
              
              <div class="content-section">
                <h5>QCM générés (${file.content.qcm.length})</h5>
                ${file.content.qcm.map((qcm, index) => `
                  <div class="qcm-item">
                    <p><strong>Question ${index + 1}:</strong> ${qcm.question}</p>
                    <ul>
                      ${qcm.answers.map((answer, i) => `
                        <li>${String.fromCharCode(65 + i)}. ${answer}</li>
                      `).join('')}
                    </ul>
                  </div>
                `).join('')}
              </div>
              
              <div class="content-section">
                <h5>Flashcards générées (${file.content.flashcards.length})</h5>
                ${file.content.flashcards.map((card, index) => `
                  <div class="flashcard-item">
                    <p><strong>${index + 1}.</strong> ${card.front}</p>
                    <p><em>Réponse:</em> ${card.back}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : '<p>Aucun contenu généré pour le moment.</p>'}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  downloadFile(fileId) {
    // Simulation de téléchargement
    if (window.StudyHub && window.StudyHub.NotificationManager) {
      window.StudyHub.NotificationManager.show('Téléchargement simulé - fonctionnalité en développement', 'info');
    }
  }

  deleteFile(fileId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      const files = JSON.parse(localStorage.getItem('imported_files') || '[]');
      const updatedFiles = files.filter(f => f.id !== fileId);
      localStorage.setItem('imported_files', JSON.stringify(updatedFiles));
      
      this.loadImportedFiles();
      
      if (window.StudyHub && window.StudyHub.NotificationManager) {
        window.StudyHub.NotificationManager.show('Fichier supprimé avec succès', 'success');
      }
    }
  }

  updateProcessingQueue() {
    const queue = document.getElementById('processing-queue');
    const processingFiles = this.processingQueue.filter(f => f.status === 'processing');
    
    if (processingFiles.length === 0) {
      queue.innerHTML = '<p>Aucun fichier en cours de traitement</p>';
      return;
    }
    
    queue.innerHTML = '';
    processingFiles.forEach(file => {
      const queueItem = document.createElement('div');
      queueItem.className = 'queue-item';
      queueItem.innerHTML = `
        <div class="queue-file-info">
          <i class="fas fa-file-alt"></i>
          <span>${file.title}</span>
        </div>
        <div class="queue-status">
          <i class="fas fa-cogs fa-spin"></i>
          <span>En cours...</span>
        </div>
      `;
      queue.appendChild(queueItem);
    });
  }

  clearForm() {
    document.getElementById('upload-form').reset();
    this.removeFile();
  }
}

// Initialiser le gestionnaire d'import
let importManager;

document.addEventListener('DOMContentLoaded', () => {
  importManager = new ImportManager();
});

// Fonctions globales pour les appels depuis HTML
function createNewSubject() {
  if (importManager) importManager.createNewSubject();
}

function removeFile() {
  if (importManager) importManager.removeFile();
}

function filterFiles() {
  if (importManager) importManager.filterFiles();
}

function viewFile(fileId) {
  if (importManager) importManager.viewFile(fileId);
}

function downloadFile(fileId) {
  if (importManager) importManager.downloadFile(fileId);
}

function deleteFile(fileId) {
  if (importManager) importManager.deleteFile(fileId);
}