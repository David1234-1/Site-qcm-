# StudyHub - Plateforme de Révision Intelligente 🧠

Une plateforme complète de révision avec IA intégrée, authentification Firebase, et synchronisation cloud pour les étudiants.

## ✨ Fonctionnalités Principales

### 🔐 Authentification Complète
- **Création de compte** par email/mot de passe
- **Connexion Google OAuth2** intégrée
- **Sauvegarde sécurisée** avec Firebase Auth
- **Synchronisation** des données sur tous les appareils

### 📄 Analyse Intelligente des Documents
- **Import PDF/Word** avec extraction automatique du texte
- **Génération automatique** de QCM, flashcards et résumés
- **Analyse IA** du contenu pour identifier les concepts clés
- **Traitement en temps réel** avec barre de progression

### 🤖 IA Assistant Intégrée
- **Chat contextuel** basé sur vos documents
- **Réponses personnalisées** selon le contenu de vos cours
- **Support OpenAI** (optionnel) pour des réponses avancées
- **Mode simulation** si aucune clé API n'est configurée

### 📚 Outils de Révision
- **QCM dynamiques** avec 10 questions générées automatiquement
- **Flashcards interactives** avec système de progression
- **Résumés intelligents** générés par IA
- **Statistiques détaillées** de vos progrès

### ☁️ Synchronisation Cloud
- **Sauvegarde automatique** dans Firebase Firestore
- **Synchronisation en temps réel** entre appareils
- **Gestion des conflits** intelligente
- **Données liées** à votre compte utilisateur

## 🚀 Installation

### Prérequis
- Node.js 14+ (pour le développement)
- Navigateur moderne (Chrome, Firefox, Safari, Edge)
- Compte Firebase (gratuit)
- Clé API OpenAI (optionnelle)

### 1. Cloner le projet
```bash
git clone https://github.com/votre-username/studyhub.git
cd studyhub
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration Firebase

#### Créer un projet Firebase
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Dans les paramètres du projet, allez dans "Vos applications"
4. Cliquez sur l'icône Web (</>) pour ajouter une application web
5. Enregistrez votre application et copiez la configuration

#### Configurer l'authentification
1. Dans Firebase Console, allez dans "Authentication"
2. Activez "Email/Password" et "Google" comme méthodes de connexion
3. Pour Google, configurez l'OAuth consent screen

#### Configurer Firestore
1. Dans Firebase Console, allez dans "Firestore Database"
2. Créez une base de données en mode test
3. Configurez les règles de sécurité (voir section Sécurité)

#### Mettre à jour la configuration
Éditez le fichier `config.js` et remplacez la configuration Firebase :

```javascript
firebase: {
  apiKey: "VOTRE_API_KEY",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
}
```

### 4. Configuration OpenAI (Optionnelle)

#### Obtenir une clé API
1. Allez sur [OpenAI Platform](https://platform.openai.com/)
2. Créez un compte ou connectez-vous
3. Allez dans "API Keys" et créez une nouvelle clé

#### Configurer la clé
Dans `config.js`, ajoutez votre clé API :

```javascript
ai: {
  openaiApiKey: "sk-votre-cle-api-openai",
  // ... autres paramètres
}
```

**Note :** L'application fonctionne parfaitement sans clé OpenAI en mode simulation.

### 5. Lancer l'application
```bash
npm start
```

L'application sera disponible sur `http://localhost:8000`

## 🔧 Configuration Avancée

### Variables d'environnement
Vous pouvez aussi configurer les clés API via des variables d'environnement :

```bash
export OPENAI_API_KEY="sk-votre-cle-api-openai"
export FIREBASE_API_KEY="votre-api-key-firebase"
```

### Personnalisation
Modifiez `config.js` pour personnaliser :
- Taille maximale des fichiers
- Types de fichiers supportés
- Intervalle de synchronisation
- Paramètres IA
- Configuration des notifications

## 🛡️ Sécurité

### Règles Firestore
Configurez les règles de sécurité dans Firebase Console :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Authentification
- Toutes les données sont liées à l'utilisateur connecté
- Validation côté client et serveur
- Protection contre les injections XSS
- Chiffrement des données sensibles

## 📱 Utilisation

### 1. Créer un compte
- Cliquez sur "Se connecter" puis "Inscription"
- Ou utilisez "Continuer avec Google"

### 2. Importer des documents
- Allez dans "Importer"
- Sélectionnez un fichier PDF ou Word
- Choisissez les options de génération (QCM, flashcards, résumé)
- Le traitement se fait automatiquement

### 3. Utiliser l'IA Assistant
- Allez dans "IA Assistant"
- Sélectionnez une matière
- Posez vos questions sur le contenu de vos cours

### 4. Réviser avec les outils
- **QCM** : Testez vos connaissances
- **Flashcards** : Mémorisez les concepts
- **Résumés** : Revoyez les points clés
- **Statistiques** : Suivez vos progrès

## 🔄 Synchronisation

### Automatique
- Synchronisation toutes les 5 minutes
- Sauvegarde avant fermeture de la page
- Gestion intelligente des conflits

### Manuel
- Cliquez sur l'icône de synchronisation
- Ou utilisez Ctrl+S pour forcer la synchronisation

## 🐛 Dépannage

### Problèmes d'authentification
- Vérifiez la configuration Firebase
- Assurez-vous que l'authentification est activée
- Vérifiez les règles Firestore

### Problèmes d'IA
- Vérifiez votre clé API OpenAI
- L'application fonctionne en mode simulation sans clé
- Consultez les logs de la console

### Problèmes de synchronisation
- Vérifiez votre connexion internet
- Assurez-vous d'être connecté
- Vérifiez les règles Firestore

## 📊 Structure du Projet

```
studyhub/
├── index.html              # Page principale
├── config.js               # Configuration
├── package.json            # Dépendances
├── assets/                 # Ressources statiques
│   ├── style.css          # Styles CSS
│   └── logo.png           # Logo
├── pages/                  # Pages de l'application
│   ├── import.html        # Import de documents
│   ├── flashcards.html    # Gestion des flashcards
│   ├── qcm.html          # Gestion des QCM
│   ├── resumes.html      # Résumés
│   ├── ai-chat.html      # Chat IA
│   └── statistics.html   # Statistiques
└── scripts/               # Scripts JavaScript
    ├── main.js           # Script principal
    ├── auth.js           # Authentification
    ├── ai-service.js     # Service IA
    ├── document-processor.js # Traitement documents
    ├── cloud-sync.js     # Synchronisation cloud
    ├── flashcards.js     # Gestion flashcards
    ├── qcm.js           # Gestion QCM
    ├── resumes.js       # Gestion résumés
    ├── import.js        # Import documents
    ├── ai-chat.js       # Chat IA
    └── statistics.js    # Statistiques
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour obtenir de l'aide :
- Ouvrez une issue sur GitHub
- Consultez la documentation Firebase
- Vérifiez les logs de la console

## 🎯 Roadmap

- [ ] Support pour plus de formats de documents
- [ ] Mode hors ligne
- [ ] Application mobile
- [ ] Collaboration entre étudiants
- [ ] Intégration avec d'autres services éducatifs
- [ ] Support multilingue
- [ ] Export des données
- [ ] Thèmes personnalisables

---

**StudyHub** - Transformez vos révisions avec l'IA ! 🚀