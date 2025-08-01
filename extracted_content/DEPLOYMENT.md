# Guide de Déploiement StudyHub 🚀

Ce guide vous explique comment déployer StudyHub sur Firebase Hosting avec toutes les fonctionnalités.

## 📋 Prérequis

1. **Compte Firebase** : [Créer un compte](https://console.firebase.google.com/)
2. **Node.js** : Version 14+ installée
3. **Firebase CLI** : Installé globalement
4. **Git** : Pour la gestion du code

## 🔧 Installation de Firebase CLI

```bash
npm install -g firebase-tools
```

## 🏗️ Configuration du Projet

### 1. Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur "Ajouter un projet"
3. Donnez un nom à votre projet (ex: `studyhub-app`)
4. Suivez les étapes de configuration

### 2. Configurer l'authentification

1. Dans Firebase Console, allez dans "Authentication"
2. Cliquez sur "Commencer"
3. Activez les méthodes de connexion :
   - **Email/Mot de passe** : Activé
   - **Google** : Activé (configurez l'OAuth consent screen)

### 3. Configurer Firestore

1. Dans Firebase Console, allez dans "Firestore Database"
2. Cliquez sur "Créer une base de données"
3. Choisissez "Mode test" pour commencer
4. Sélectionnez l'emplacement de votre base de données

### 4. Configurer le projet local

```bash
# Se connecter à Firebase
firebase login

# Initialiser le projet Firebase
firebase init

# Sélectionner les services :
# - Firestore
# - Hosting
# - Sélectionner votre projet
```

### 5. Mettre à jour la configuration

Éditez le fichier `config.js` avec vos vraies clés Firebase :

```javascript
firebase: {
  apiKey: "VOTRE_VRAIE_API_KEY",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
}
```

## 🚀 Déploiement

### Déploiement complet

```bash
# Déployer tout (Firestore + Hosting)
npm run deploy
```

### Déploiement partiel

```bash
# Déployer seulement les règles Firestore
npm run deploy:firestore

# Déployer seulement l'application web
npm run deploy:hosting
```

### Vérification du déploiement

1. Allez dans Firebase Console > Hosting
2. Votre site sera disponible à l'URL fournie
3. Testez toutes les fonctionnalités

## 🔒 Configuration de la Sécurité

### Règles Firestore

Les règles sont déjà configurées dans `firestore.rules`. Vérifiez qu'elles sont déployées :

```bash
firebase deploy --only firestore:rules
```

### Authentification

1. Dans Firebase Console > Authentication > Settings
2. Ajoutez votre domaine de production dans "Authorized domains"
3. Configurez l'OAuth consent screen pour Google

## 🌐 Configuration du Domaine Personnalisé (Optionnel)

### 1. Ajouter un domaine personnalisé

1. Dans Firebase Console > Hosting
2. Cliquez sur "Ajouter un domaine personnalisé"
3. Suivez les instructions pour configurer les DNS

### 2. Configuration SSL

Firebase gère automatiquement les certificats SSL pour les domaines personnalisés.

## 📊 Monitoring et Analytics

### 1. Activer Google Analytics

1. Dans Firebase Console > Project Settings
2. Allez dans l'onglet "Integrations"
3. Activez Google Analytics

### 2. Monitoring des performances

1. Dans Firebase Console > Performance
2. Activez le monitoring automatique

## 🔧 Configuration Avancée

### Variables d'environnement

Pour la production, utilisez des variables d'environnement :

```bash
# Dans votre serveur de production
export FIREBASE_API_KEY="votre-api-key"
export OPENAI_API_KEY="votre-openai-key"
```

### Optimisation des performances

1. **Compression** : Firebase Hosting compresse automatiquement
2. **Cache** : Configurez les headers de cache dans `firebase.json`
3. **CDN** : Firebase utilise un CDN global

### Sécurité renforcée

1. **CSP Headers** : Ajoutez dans `firebase.json` :

```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://firestore.googleapis.com;"
          }
        ]
      }
    ]
  }
}
```

## 🐛 Dépannage

### Problèmes courants

#### Erreur de déploiement
```bash
# Vérifier la configuration
firebase projects:list

# Reconnecter
firebase logout
firebase login
```

#### Erreur d'authentification
- Vérifiez que l'authentification est activée dans Firebase Console
- Vérifiez les domaines autorisés
- Vérifiez les règles Firestore

#### Erreur de synchronisation
- Vérifiez les règles Firestore
- Vérifiez la configuration dans `config.js`
- Consultez les logs dans Firebase Console

### Logs et debugging

```bash
# Voir les logs de déploiement
firebase hosting:channel:list

# Debugger les règles Firestore
firebase firestore:rules:debug
```

## 📈 Maintenance

### Mises à jour

1. **Code** : Déployez avec `npm run deploy`
2. **Dépendances** : Mettez à jour `package.json`
3. **Configuration** : Modifiez `config.js` et redéployez

### Sauvegarde

Firebase Firestore fait des sauvegardes automatiques, mais vous pouvez exporter manuellement :

```bash
# Exporter les données
firebase firestore:export ./backup

# Importer les données
firebase firestore:import ./backup
```

### Monitoring

1. **Firebase Console** : Surveillez l'utilisation
2. **Google Analytics** : Suivez les utilisateurs
3. **Logs** : Consultez les logs d'erreur

## 🎯 Bonnes Pratiques

### Performance
- Optimisez les images
- Minimisez les requêtes Firestore
- Utilisez la pagination pour les grandes listes

### Sécurité
- Ne stockez jamais de clés API dans le code client
- Utilisez les règles Firestore appropriées
- Validez toutes les données côté serveur

### Maintenance
- Faites des sauvegardes régulières
- Surveillez l'utilisation des ressources
- Mettez à jour les dépendances régulièrement

## 📞 Support

En cas de problème :
1. Consultez la [documentation Firebase](https://firebase.google.com/docs)
2. Vérifiez les [logs Firebase](https://console.firebase.google.com/)
3. Ouvrez une issue sur GitHub
4. Contactez le support Firebase si nécessaire

---

**Votre StudyHub est maintenant déployé et prêt à être utilisé ! 🎉**