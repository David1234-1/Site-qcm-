/**
 * Gestionnaire des résumés
 * Gère la création, l'affichage et la gestion des résumés
 */
class ResumesManager {
    constructor() {
        this.currentTab = 'browse';
        this.currentResume = null;
        this.subjects = [];
        this.resumes = [];
        this.importedResumes = [];
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.displayResumes();
        this.loadSubjects();
    }

    loadData() {
        // Charger les matières
        this.subjects = StudyHub.StorageManager.get('subjects') || [];
        
        // Charger les résumés manuels
        this.resumes = StudyHub.StorageManager.get('resumes') || [];
        
        // Charger les résumés importés (générés automatiquement)
        this.importedResumes = StudyHub.StorageManager.get('imported_resumes') || [];
    }

    setupEventListeners() {
        // Gestion des onglets
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Filtres
        const subjectFilter = document.getElementById('subject-filter');
        const searchFilter = document.getElementById('search-filter');
        
        if (subjectFilter) {
            subjectFilter.addEventListener('change', () => this.filterResumes());
        }
        
        if (searchFilter) {
            searchFilter.addEventListener('input', StudyHub.Utils.debounce(() => this.filterResumes(), 300));
        }

        // Formulaire de création
        const resumeForm = document.getElementById('resume-form');
        if (resumeForm) {
            resumeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveResume();
            });
        }

        // Boutons d'action
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-add-field')) {
                this.addTagField();
            } else if (e.target.classList.contains('btn-remove-field')) {
                this.removeTagField(e.target);
            } else if (e.target.classList.contains('btn-view-resume')) {
                this.viewResume(e.target.dataset.id);
            } else if (e.target.classList.contains('btn-edit-resume')) {
                this.editResume(e.target.dataset.id);
            } else if (e.target.classList.contains('btn-delete-resume')) {
                this.deleteResume(e.target.dataset.id);
            } else if (e.target.classList.contains('btn-export-resume')) {
                this.exportResume(e.target.dataset.id);
            }
        });
    }

    switchTab(tabName) {
        // Mettre à jour les onglets actifs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Afficher le contenu correspondant
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;

        // Charger le contenu approprié
        switch (tabName) {
            case 'browse':
                this.displayResumes();
                break;
            case 'create':
                this.loadSubjects();
                break;
            case 'imported':
                this.displayImportedResumes();
                break;
        }
    }

    loadSubjects() {
        const subjectSelect = document.getElementById('resume-subject');
        if (!subjectSelect) return;

        // Vider les options existantes
        subjectSelect.innerHTML = '<option value="">Sélectionner une matière</option>';

        // Ajouter les matières existantes
        this.subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.name;
            option.textContent = subject.name;
            subjectSelect.appendChild(option);
        });

        // Ajouter l'option pour créer une nouvelle matière
        const newOption = document.createElement('option');
        newOption.value = 'new';
        newOption.textContent = '+ Créer une nouvelle matière';
        subjectSelect.appendChild(newOption);
    }

    addTagField() {
        const tagsContainer = document.getElementById('tags-container');
        const tagIndex = tagsContainer.children.length;
        
        const tagDiv = document.createElement('div');
        tagDiv.className = 'form-group tag-field';
        tagDiv.innerHTML = `
            <div class="input-group">
                <input type="text" 
                       class="form-input" 
                       name="tag-${tagIndex}" 
                       placeholder="Tag ${tagIndex + 1}"
                       maxlength="50">
                <button type="button" class="btn btn-secondary btn-remove-field">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        tagsContainer.appendChild(tagDiv);
    }

    removeTagField(button) {
        button.closest('.tag-field').remove();
        this.updateTagNumbers();
    }

    updateTagNumbers() {
        const tagFields = document.querySelectorAll('.tag-field');
        tagFields.forEach((field, index) => {
            const input = field.querySelector('input');
            input.name = `tag-${index}`;
            input.placeholder = `Tag ${index + 1}`;
        });
    }

    saveResume() {
        const form = document.getElementById('resume-form');
        const formData = new FormData(form);

        // Validation
        const subject = formData.get('subject');
        const title = formData.get('title').trim();
        const content = formData.get('content').trim();

        if (!subject || subject === 'new') {
            StudyHub.NotificationManager.show('Veuillez sélectionner une matière', 'warning');
            return;
        }

        if (!title) {
            StudyHub.NotificationManager.show('Veuillez saisir un titre', 'warning');
            return;
        }

        if (!content) {
            StudyHub.NotificationManager.show('Veuillez saisir le contenu du résumé', 'warning');
            return;
        }

        // Récupérer les tags
        const tags = [];
        const tagInputs = form.querySelectorAll('input[name^="tag-"]');
        tagInputs.forEach(input => {
            const tag = input.value.trim();
            if (tag) {
                tags.push(tag);
            }
        });

        // Créer le résumé
        const resume = {
            id: StudyHub.Utils.generateId(),
            subject: subject,
            title: title,
            description: formData.get('description').trim(),
            content: content,
            tags: tags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            type: 'manual'
        };

        // Sauvegarder
        this.resumes.push(resume);
        StudyHub.StorageManager.set('resumes', this.resumes);

        // Réinitialiser le formulaire
        form.reset();
        document.getElementById('tags-container').innerHTML = '';

        StudyHub.NotificationManager.show('Résumé créé avec succès !', 'success');

        // Revenir à l'onglet de consultation
        this.switchTab('browse');
    }

    displayResumes() {
        const container = document.getElementById('resumes-grid');
        if (!container) return;

        container.innerHTML = '';

        if (this.resumes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-alt empty-icon"></i>
                    <h3>Aucun résumé créé</h3>
                    <p>Créez votre premier résumé pour commencer à organiser vos connaissances.</p>
                    <button class="btn btn-primary" onclick="resumesManager.switchTab('create')">
                        <i class="fas fa-plus"></i> Créer un résumé
                    </button>
                </div>
            `;
            return;
        }

        this.resumes.forEach(resume => {
            const card = this.createResumeCard(resume);
            container.appendChild(card);
        });
    }

    displayImportedResumes() {
        const container = document.getElementById('imported-resumes-grid');
        if (!container) return;

        container.innerHTML = '';

        if (this.importedResumes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-import empty-icon"></i>
                    <h3>Aucun résumé importé</h3>
                    <p>Les résumés générés automatiquement à partir de vos fichiers importés apparaîtront ici.</p>
                    <button class="btn btn-primary" onclick="resumesManager.switchTab('browse')">
                        <i class="fas fa-file-alt"></i> Voir tous les résumés
                    </button>
                </div>
            `;
            return;
        }

        this.importedResumes.forEach(resume => {
            const card = this.createResumeCard(resume, true);
            container.appendChild(card);
        });
    }

    createResumeCard(resume, isImported = false) {
        const card = document.createElement('div');
        card.className = 'resume-card card';
        card.dataset.id = resume.id;

        const tagsHtml = resume.tags && resume.tags.length > 0 
            ? resume.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
            : '';

        const date = new Date(resume.createdAt).toLocaleDateString('fr-FR');

        card.innerHTML = `
            <div class="resume-header">
                <div class="resume-meta">
                    <span class="resume-subject">${resume.subject}</span>
                    <span class="resume-date">${date}</span>
                </div>
                ${isImported ? '<span class="imported-badge"><i class="fas fa-robot"></i> Auto-généré</span>' : ''}
            </div>
            <h3 class="resume-title">${resume.title}</h3>
            ${resume.description ? `<p class="resume-description">${resume.description}</p>` : ''}
            ${tagsHtml ? `<div class="resume-tags">${tagsHtml}</div>` : ''}
            <div class="resume-actions">
                <button class="btn btn-primary btn-view-resume" data-id="${resume.id}">
                    <i class="fas fa-eye"></i> Voir
                </button>
                <button class="btn btn-secondary btn-edit-resume" data-id="${resume.id}">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button class="btn btn-secondary btn-export-resume" data-id="${resume.id}">
                    <i class="fas fa-download"></i> Exporter
                </button>
                <button class="btn btn-error btn-delete-resume" data-id="${resume.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        return card;
    }

    filterResumes() {
        const subjectFilter = document.getElementById('subject-filter');
        const searchFilter = document.getElementById('search-filter');
        
        const selectedSubject = subjectFilter ? subjectFilter.value : '';
        const searchTerm = searchFilter ? searchFilter.value.toLowerCase() : '';

        const container = document.getElementById('resumes-grid');
        if (!container) return;

        const cards = container.querySelectorAll('.resume-card');
        
        cards.forEach(card => {
            const subject = card.querySelector('.resume-subject').textContent;
            const title = card.querySelector('.resume-title').textContent.toLowerCase();
            const description = card.querySelector('.resume-description')?.textContent.toLowerCase() || '';

            const subjectMatch = !selectedSubject || subject === selectedSubject;
            const searchMatch = !searchTerm || 
                title.includes(searchTerm) || 
                description.includes(searchTerm);

            card.style.display = subjectMatch && searchMatch ? 'block' : 'none';
        });
    }

    viewResume(id) {
        const resume = this.resumes.find(r => r.id === id) || 
                      this.importedResumes.find(r => r.id === id);
        
        if (!resume) return;

        this.currentResume = resume;
        this.showResumeModal();
    }

    showResumeModal() {
        const modal = document.getElementById('resume-modal');
        if (!modal || !this.currentResume) return;

        const resume = this.currentResume;
        const date = new Date(resume.createdAt).toLocaleDateString('fr-FR');
        const updatedDate = new Date(resume.updatedAt).toLocaleDateString('fr-FR');

        const tagsHtml = resume.tags && resume.tags.length > 0 
            ? resume.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
            : '';

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${resume.title}</h2>
                    <button class="modal-close" onclick="resumesManager.hideResumeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="resume-info">
                        <div class="info-row">
                            <span class="info-label">Matière:</span>
                            <span class="info-value">${resume.subject}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Créé le:</span>
                            <span class="info-value">${date}</span>
                        </div>
                        ${resume.updatedAt !== resume.createdAt ? `
                            <div class="info-row">
                                <span class="info-label">Modifié le:</span>
                                <span class="info-value">${updatedDate}</span>
                            </div>
                        ` : ''}
                        ${resume.type === 'imported' ? `
                            <div class="info-row">
                                <span class="info-label">Type:</span>
                                <span class="info-value"><i class="fas fa-robot"></i> Généré automatiquement</span>
                            </div>
                        ` : ''}
                    </div>
                    ${resume.description ? `
                        <div class="resume-description-full">
                            <h3>Description</h3>
                            <p>${resume.description}</p>
                        </div>
                    ` : ''}
                    ${tagsHtml ? `
                        <div class="resume-tags-full">
                            <h3>Tags</h3>
                            <div class="tags-container">${tagsHtml}</div>
                        </div>
                    ` : ''}
                    <div class="resume-content">
                        <h3>Contenu</h3>
                        <div class="content-text">${resume.content}</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="resumesManager.editResume('${resume.id}')">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-secondary" onclick="resumesManager.exportResume('${resume.id}')">
                        <i class="fas fa-download"></i> Exporter
                    </button>
                    <button class="btn btn-error" onclick="resumesManager.deleteResume('${resume.id}')">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </div>
        `;

        modal.classList.add('active');
    }

    hideResumeModal() {
        const modal = document.getElementById('resume-modal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.currentResume = null;
    }

    editResume(id) {
        const resume = this.resumes.find(r => r.id === id);
        if (!resume) {
            StudyHub.NotificationManager.show('Résumé introuvable', 'error');
            return;
        }

        // Remplir le formulaire
        const form = document.getElementById('resume-form');
        form.querySelector('[name="subject"]').value = resume.subject;
        form.querySelector('[name="title"]').value = resume.title;
        form.querySelector('[name="description"]').value = resume.description;
        form.querySelector('[name="content"]').value = resume.content;

        // Ajouter les tags
        const tagsContainer = document.getElementById('tags-container');
        tagsContainer.innerHTML = '';
        
        if (resume.tags && resume.tags.length > 0) {
            resume.tags.forEach((tag, index) => {
                this.addTagField();
                const lastTagField = tagsContainer.lastElementChild;
                lastTagField.querySelector('input').value = tag;
            });
        }

        // Aller à l'onglet de création
        this.switchTab('create');
        
        // Marquer le formulaire comme étant en mode édition
        form.dataset.editId = id;
        
        StudyHub.NotificationManager.show('Résumé chargé pour modification', 'info');
    }

    deleteResume(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce résumé ?')) {
            return;
        }

        // Supprimer des résumés manuels
        this.resumes = this.resumes.filter(r => r.id !== id);
        StudyHub.StorageManager.set('resumes', this.resumes);

        // Supprimer des résumés importés
        this.importedResumes = this.importedResumes.filter(r => r.id !== id);
        StudyHub.StorageManager.set('imported_resumes', this.importedResumes);

        // Fermer le modal si ouvert
        this.hideResumeModal();

        // Recharger l'affichage
        if (this.currentTab === 'browse') {
            this.displayResumes();
        } else if (this.currentTab === 'imported') {
            this.displayImportedResumes();
        }

        StudyHub.NotificationManager.show('Résumé supprimé avec succès', 'success');
    }

    exportResume(id) {
        const resume = this.resumes.find(r => r.id === id) || 
                      this.importedResumes.find(r => r.id === id);
        
        if (!resume) {
            StudyHub.NotificationManager.show('Résumé introuvable', 'error');
            return;
        }

        // Créer le contenu du fichier
        const content = `
RÉSUMÉ - ${resume.title.toUpperCase()}
=====================================

Matière: ${resume.subject}
Créé le: ${new Date(resume.createdAt).toLocaleDateString('fr-FR')}
${resume.description ? `Description: ${resume.description}\n` : ''}
${resume.tags && resume.tags.length > 0 ? `Tags: ${resume.tags.join(', ')}\n` : ''}

CONTENU:
--------
${resume.content}
        `.trim();

        // Créer et télécharger le fichier
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${resume.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        StudyHub.NotificationManager.show('Résumé exporté avec succès', 'success');
    }

    // Méthode pour ajouter un résumé importé (appelée depuis import.js)
    addImportedResume(resumeData) {
        const resume = {
            id: StudyHub.Utils.generateId(),
            subject: resumeData.subject,
            title: resumeData.title,
            description: resumeData.description || '',
            content: resumeData.content,
            tags: resumeData.tags || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            type: 'imported',
            sourceFile: resumeData.sourceFile
        };

        this.importedResumes.push(resume);
        StudyHub.StorageManager.set('imported_resumes', this.importedResumes);

        // Recharger l'affichage si on est sur l'onglet des résumés importés
        if (this.currentTab === 'imported') {
            this.displayImportedResumes();
        }
    }
}

// Initialisation
let resumesManager;

document.addEventListener('DOMContentLoaded', () => {
    resumesManager = new ResumesManager();
});

// Fonctions globales pour les gestionnaires d'événements HTML
window.resumesManager = resumesManager;