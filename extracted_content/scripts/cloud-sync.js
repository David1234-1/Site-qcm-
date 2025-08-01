// Service de synchronisation cloud StudyHub
class CloudSyncService {
  constructor() {
    this.syncInterval = null;
    this.lastSync = null;
    this.syncInProgress = false;
    
    this.init();
  }

  init() {
    // Démarrer la synchronisation automatique toutes les 5 minutes
    this.startAutoSync();
    
    // Synchroniser avant de quitter la page
    window.addEventListener('beforeunload', () => {
      this.syncData();
    });
  }

  startAutoSync() {
    this.syncInterval = setInterval(() => {
      if (window.AuthManager && window.AuthManager.isAuthenticated()) {
        this.syncData();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncData() {
    if (this.syncInProgress || !window.AuthManager || !window.AuthManager.isAuthenticated()) {
      return;
    }

    this.syncInProgress = true;
    
    try {
      const userData = this.collectUserData();
      await this.uploadToCloud(userData);
      this.lastSync = new Date().toISOString();
      localStorage.setItem('last_cloud_sync', this.lastSync);
      
      console.log('Synchronisation cloud réussie');
    } catch (error) {
      console.error('Erreur de synchronisation cloud:', error);
      NotificationManager.show('Erreur de synchronisation cloud', 'error');
    } finally {
      this.syncInProgress = false;
    }
  }

  collectUserData() {
    return {
      // Données de base
      subjects: JSON.parse(localStorage.getItem('subjects') || '[]'),
      
      // Données QCM
      qcm_data: JSON.parse(localStorage.getItem('qcm_data') || '{}'),
      qcm_results: JSON.parse(localStorage.getItem('qcm_results') || '{}'),
      
      // Données Flashcards
      flashcards: JSON.parse(localStorage.getItem('flashcards') || '{}'),
      
      // Données Résumés
      resumes: JSON.parse(localStorage.getItem('resumes') || '{}'),
      
      // Fichiers importés
      imported_files: JSON.parse(localStorage.getItem('imported_files') || '[]'),
      
      // Historique de chat
      chat_history: JSON.parse(localStorage.getItem('chat_history') || '{}'),
      
      // Statistiques
      statistics: JSON.parse(localStorage.getItem('statistics') || '{}'),
      
      // Métadonnées
      lastSync: new Date().toISOString(),
      appVersion: '1.0.0'
    };
  }

  async uploadToCloud(userData) {
    if (!window.Firebase || !window.AuthManager) {
      throw new Error('Firebase ou AuthManager non disponible');
    }

    const { db, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
    const userId = window.AuthManager.getCurrentUser().id;
    
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, userData, { merge: true });
  }

  async downloadFromCloud() {
    if (!window.Firebase || !window.AuthManager) {
      throw new Error('Firebase ou AuthManager non disponible');
    }

    const { db, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
    const userId = window.AuthManager.getCurrentUser().id;
    
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const cloudData = userDoc.data();
      const localLastSync = localStorage.getItem('last_cloud_sync');
      
      // Synchroniser seulement si les données cloud sont plus récentes
      if (!localLastSync || cloudData.lastSync > localLastSync) {
        this.mergeCloudData(cloudData);
        localStorage.setItem('last_cloud_sync', cloudData.lastSync);
        return true;
      }
    }
    
    return false;
  }

  mergeCloudData(cloudData) {
    // Fusionner les données cloud avec les données locales
    Object.keys(cloudData).forEach(key => {
      if (key !== 'lastSync' && key !== 'appVersion') {
        const localData = localStorage.getItem(key);
        const cloudValue = cloudData[key];
        
        if (localData) {
          // Fusion intelligente selon le type de données
          const mergedData = this.mergeData(JSON.parse(localData), cloudValue);
          localStorage.setItem(key, JSON.stringify(mergedData));
        } else {
          // Données locales inexistantes, utiliser les données cloud
          localStorage.setItem(key, JSON.stringify(cloudValue));
        }
      }
    });
  }

  mergeData(localData, cloudData) {
    // Fusion intelligente selon le type de données
    if (Array.isArray(localData) && Array.isArray(cloudData)) {
      // Fusion d'arrays : combiner et dédupliquer
      return [...new Set([...localData, ...cloudData])];
    } else if (typeof localData === 'object' && typeof cloudData === 'object') {
      // Fusion d'objets : combiner les propriétés
      return { ...localData, ...cloudData };
    } else {
      // Valeur simple : utiliser la plus récente
      return cloudData;
    }
  }

  async saveSpecificData(dataType, data) {
    if (!window.AuthManager || !window.AuthManager.isAuthenticated()) {
      return;
    }

    try {
      const { db, doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
      const userId = window.AuthManager.getCurrentUser().id;
      
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        [dataType]: data,
        lastSync: new Date().toISOString()
      });
      
      console.log(`Données ${dataType} sauvegardées dans le cloud`);
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de ${dataType}:`, error);
      throw error;
    }
  }

  async getCloudData(dataType) {
    if (!window.AuthManager || !window.AuthManager.isAuthenticated()) {
      return null;
    }

    try {
      const { db, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
      const userId = window.AuthManager.getCurrentUser().id;
      
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        return data[dataType] || null;
      }
      
      return null;
    } catch (error) {
      console.error(`Erreur lors de la récupération de ${dataType}:`, error);
      return null;
    }
  }

  // Méthodes spécifiques pour chaque type de données
  async saveQCMData(qcmData) {
    await this.saveSpecificData('qcm_data', qcmData);
  }

  async saveQCMResults(results) {
    await this.saveSpecificData('qcm_results', results);
  }

  async saveFlashcards(flashcards) {
    await this.saveSpecificData('flashcards', flashcards);
  }

  async saveResumes(resumes) {
    await this.saveSpecificData('resumes', resumes);
  }

  async saveImportedFiles(files) {
    await this.saveSpecificData('imported_files', files);
  }

  async saveChatHistory(history) {
    await this.saveSpecificData('chat_history', history);
  }

  async saveStatistics(stats) {
    await this.saveSpecificData('statistics', stats);
  }

  // Méthodes de récupération
  async getQCMData() {
    return await this.getCloudData('qcm_data');
  }

  async getQCMResults() {
    return await this.getCloudData('qcm_results');
  }

  async getFlashcards() {
    return await this.getCloudData('flashcards');
  }

  async getResumes() {
    return await this.getCloudData('resumes');
  }

  async getImportedFiles() {
    return await this.getCloudData('imported_files');
  }

  async getChatHistory() {
    return await this.getCloudData('chat_history');
  }

  async getStatistics() {
    return await this.getCloudData('statistics');
  }

  // Gestion des conflits
  resolveConflict(localData, cloudData, dataType) {
    // Stratégies de résolution selon le type de données
    switch (dataType) {
      case 'qcm_results':
        // Pour les résultats QCM, garder les deux et fusionner
        return this.mergeQCMResults(localData, cloudData);
      
      case 'statistics':
        // Pour les statistiques, additionner les valeurs
        return this.mergeStatistics(localData, cloudData);
      
      case 'imported_files':
        // Pour les fichiers, garder les plus récents
        return this.mergeImportedFiles(localData, cloudData);
      
      default:
        // Par défaut, utiliser la fusion intelligente
        return this.mergeData(localData, cloudData);
    }
  }

  mergeQCMResults(local, cloud) {
    const merged = { ...local };
    
    Object.keys(cloud).forEach(key => {
      if (merged[key]) {
        // Fusionner les résultats pour le même QCM
        merged[key] = {
          ...merged[key],
          attempts: (merged[key].attempts || 0) + (cloud[key].attempts || 0),
          bestScore: Math.max(merged[key].bestScore || 0, cloud[key].bestScore || 0),
          lastAttempt: new Date(Math.max(
            new Date(merged[key].lastAttempt || 0),
            new Date(cloud[key].lastAttempt || 0)
          )).toISOString()
        };
      } else {
        merged[key] = cloud[key];
      }
    });
    
    return merged;
  }

  mergeStatistics(local, cloud) {
    const merged = { ...local };
    
    Object.keys(cloud).forEach(key => {
      if (merged[key]) {
        // Additionner les valeurs numériques
        if (typeof merged[key] === 'number' && typeof cloud[key] === 'number') {
          merged[key] += cloud[key];
        } else if (typeof merged[key] === 'object' && typeof cloud[key] === 'object') {
          merged[key] = this.mergeStatistics(merged[key], cloud[key]);
        }
      } else {
        merged[key] = cloud[key];
      }
    });
    
    return merged;
  }

  mergeImportedFiles(local, cloud) {
    // Garder les fichiers les plus récents
    const allFiles = [...local, ...cloud];
    const fileMap = new Map();
    
    allFiles.forEach(file => {
      const existing = fileMap.get(file.id);
      if (!existing || new Date(file.uploadedAt) > new Date(existing.uploadedAt)) {
        fileMap.set(file.id, file);
      }
    });
    
    return Array.from(fileMap.values());
  }

  // Méthodes utilitaires
  getLastSyncTime() {
    return this.lastSync;
  }

  isSyncInProgress() {
    return this.syncInProgress;
  }

  async forceSync() {
    await this.syncData();
  }

  async resetSync() {
    this.lastSync = null;
    localStorage.removeItem('last_cloud_sync');
    await this.syncData();
  }
}

// Initialiser le service de synchronisation
window.CloudSyncService = new CloudSyncService();