// Configuration StudyHub
window.StudyHubConfig = {
  // Configuration Firebase (à remplacer par vos propres clés)
  firebase: {
    apiKey: "AIzaSyBvX9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X",
    authDomain: "studyhub-app.firebaseapp.com",
    projectId: "studyhub-app",
    storageBucket: "studyhub-app.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdefghijklmnop"
  },
  
  // Configuration IA
  ai: {
    // Clé API OpenAI (optionnelle - l'IA fonctionnera en mode simulation sans clé)
    openaiApiKey: null, // À remplacer par votre clé API OpenAI
    
    // Modèle IA à utiliser
    model: 'gpt-3.5-turbo',
    
    // Nombre maximum de tokens par réponse
    maxTokens: 1000,
    
    // Température pour la génération (0 = déterministe, 1 = créatif)
    temperature: 0.7
  },
  
  // Configuration de l'application
  app: {
    name: 'StudyHub',
    version: '1.0.0',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedFileTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ],
    syncInterval: 5 * 60 * 1000, // 5 minutes
    maxQCMQuestions: 50,
    maxFlashcards: 100
  },
  
  // Configuration des notifications
  notifications: {
    enabled: true,
    duration: 5000, // 5 secondes
    position: 'top-right'
  },
  
  // Configuration du thème
  theme: {
    default: 'light',
    autoDetect: true
  }
};

// Instructions pour configurer Firebase :
/*
1. Allez sur https://console.firebase.google.com/
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Dans les paramètres du projet, allez dans "Vos applications"
4. Cliquez sur l'icône Web (</>) pour ajouter une application web
5. Enregistrez votre application et copiez la configuration
6. Remplacez les valeurs dans StudyHubConfig.firebase ci-dessus

Exemple de configuration Firebase :
firebase: {
  apiKey: "AIzaSyC2X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
}
*/

// Instructions pour configurer OpenAI :
/*
1. Allez sur https://platform.openai.com/
2. Créez un compte ou connectez-vous
3. Allez dans "API Keys" et créez une nouvelle clé
4. Copiez la clé et remplacez StudyHubConfig.ai.openaiApiKey

Note : L'application fonctionnera sans clé OpenAI en mode simulation,
mais les réponses seront moins sophistiquées.
*/