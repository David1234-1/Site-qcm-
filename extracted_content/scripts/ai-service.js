// Service IA pour StudyHub
class AIService {
  constructor() {
    this.apiKey = null;
    this.baseURL = 'https://api.openai.com/v1';
    this.model = 'gpt-3.5-turbo';
    this.maxTokens = 1000;
    
    this.init();
  }

  init() {
    // Essayer de récupérer la clé API depuis la configuration, localStorage ou les variables d'environnement
    this.apiKey = window.StudyHubConfig?.ai?.openaiApiKey || 
                  localStorage.getItem('openai_api_key') || 
                  process.env.OPENAI_API_KEY;
    
    // Utiliser la configuration pour les paramètres IA
    if (window.StudyHubConfig?.ai) {
      this.model = window.StudyHubConfig.ai.model || this.model;
      this.maxTokens = window.StudyHubConfig.ai.maxTokens || this.maxTokens;
    }
    
    if (!this.apiKey) {
      console.warn('Clé API OpenAI non trouvée. L\'IA fonctionnera en mode simulation.');
    }
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
    localStorage.setItem('openai_api_key', apiKey);
  }

  async generateResponse(prompt, context = null) {
    if (!this.apiKey) {
      return this.generateMockResponse(prompt, context);
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: this.buildMessages(prompt, context),
          max_tokens: this.maxTokens,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Erreur lors de la génération de réponse IA:', error);
      return this.generateMockResponse(prompt, context);
    }
  }

  buildMessages(prompt, context) {
    const messages = [
      {
        role: 'system',
        content: `Tu es un assistant pédagogique spécialisé dans l'aide aux étudiants. 
        Tu dois répondre de manière claire, pédagogique et adaptée au niveau de l'étudiant.
        Si un contexte de cours est fourni, utilise-le pour donner des réponses précises et pertinentes.
        Réponds toujours en français.`
      }
    ];

    if (context) {
      messages.push({
        role: 'system',
        content: `Contexte du cours: ${JSON.stringify(context)}`
      });
    }

    messages.push({
      role: 'user',
      content: prompt
    });

    return messages;
  }

  generateMockResponse(prompt, context) {
    const lowerPrompt = prompt.toLowerCase();
    
    // Réponses contextuelles basées sur le contenu
    if (context && context.subject) {
      if (lowerPrompt.includes('concept') || lowerPrompt.includes('princip')) {
        return `Voici les **concepts principaux** de ${context.subject} :

• **Concept 1** : Définition et explication détaillée
• **Concept 2** : Autre notion importante à maîtriser
• **Concept 3** : Point clé pour la compréhension

Ces concepts sont essentiels pour bien comprendre la matière. Je recommande de les revoir régulièrement !`;
      }
      
      if (lowerPrompt.includes('formule') || lowerPrompt.includes('calcul')) {
        return `Voici les **formules importantes** à retenir pour ${context.subject.name} :

• **Formule 1** : A = B × C (explication de son utilisation)
• **Formule 2** : D = E² + F (quand l'utiliser)
• **Formule 3** : G = H/I (cas d'application)

N'oubliez pas de bien comprendre quand et comment utiliser chaque formule !`;
      }
      
      if (lowerPrompt.includes('exemple') || lowerPrompt.includes('pratique')) {
        return `Voici quelques **exemples pratiques** pour ${context.subject.name} :

• **Exemple 1** : Application concrète du concept principal dans une situation réelle
• **Exemple 2** : Cas d'usage typique dans la pratique professionnelle
• **Exemple 3** : Situation où ces connaissances sont particulièrement utiles

Ces exemples vous aideront à mieux comprendre l'application pratique des concepts théoriques.`;
      }
    }

    // Réponses générales
    if (lowerPrompt.includes('aide') || lowerPrompt.includes('comment')) {
      return `Je suis là pour vous aider dans vos études ! Voici quelques conseils :

• **Révisez régulièrement** : La répétition espacée est plus efficace
• **Posez des questions** : N'hésitez pas à demander des clarifications
• **Pratiquez** : Faites des exercices et des QCM pour tester vos connaissances
• **Organisez-vous** : Utilisez les flashcards et résumés pour structurer vos révisions

Que souhaitez-vous approfondir ?`;
    }

    if (lowerPrompt.includes('difficile') || lowerPrompt.includes('compliqué')) {
      return `Je comprends que certains points peuvent sembler difficiles. Voici mes conseils :

• **Décomposez** : Divisez les concepts complexes en parties plus simples
• **Cherchez des exemples** : Les cas concrets aident à la compréhension
• **Pratiquez** : L'entraînement rend tout plus facile
• **Demandez de l'aide** : N'hésitez pas à poser des questions spécifiques

Sur quel point particulier avez-vous des difficultés ?`;
    }

    // Réponse par défaut
    return `Merci pour votre question ! Je suis votre assistant pédagogique et je suis là pour vous aider dans vos études.

Pour vous donner une réponse plus précise et personnalisée, pourriez-vous :
• Me donner plus de détails sur votre question ?
• Me préciser le contexte de votre cours ?
• Me dire sur quelle matière vous travaillez ?

Je peux vous aider avec les concepts, les formules, les exemples pratiques, et bien plus encore !`;
  }

  async generateQCM(content, count = 10) {
    const prompt = `Génère ${count} questions de QCM basées sur ce contenu de cours. 
    Les questions doivent être variées (définitions, applications, calculs, etc.).
    Chaque question doit avoir 4 réponses possibles avec une seule bonne réponse.
    Format JSON attendu :
    {
      "questions": [
        {
          "question": "Question text",
          "answers": ["A", "B", "C", "D"],
          "correctAnswer": 0,
          "explanation": "Explication détaillée de la réponse",
          "difficulty": "easy|medium|hard"
        }
      ]
    }
    
    Contenu du cours : ${content.substring(0, 3000)}`;

    try {
      const response = await this.generateResponse(prompt);
      
      // Essayer de parser la réponse JSON
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const qcm = JSON.parse(jsonMatch[0]);
          // Valider que chaque question a la structure attendue
          if (qcm.questions && Array.isArray(qcm.questions)) {
            return qcm.questions.filter(q => q.question && q.answers && q.answers.length === 4 && typeof q.correctAnswer === 'number');
          }
        }
      } catch (e) {
        console.warn('Impossible de parser la réponse JSON, génération de QCM mock');
      }
      
      // Fallback vers des QCM générés automatiquement
      return this.generateMockQCM(content, count);
    } catch (error) {
      console.error('Erreur lors de la génération de QCM:', error);
      return this.generateMockQCM(content, count);
    }
  }

  generateMockQCM(content, count) {
    const questions = [];
    const subjects = ['Mathématiques', 'Physique', 'Chimie', 'Biologie', 'Histoire', 'Géographie'];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    
    for (let i = 0; i < count; i++) {
      questions.push({
        question: `Question ${i + 1} sur ${subject} : ${this.generateQuestionText(subject)}`,
        answers: [
          `Réponse A - Option ${i + 1}`,
          `Réponse B - Option ${i + 1}`,
          `Réponse C - Option ${i + 1}`,
          `Réponse D - Option ${i + 1}`
        ],
        correctAnswer: Math.floor(Math.random() * 4),
        explanation: `Explication de la réponse pour la question ${i + 1}`,
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)]
      });
    }
    
    return questions;
  }

  generateQuestionText(subject) {
    const questions = {
      'Mathématiques': 'Quelle est la valeur de x dans l\'équation ?',
      'Physique': 'Quel est le principe fondamental ?',
      'Chimie': 'Quelle est la formule moléculaire ?',
      'Biologie': 'Quel est le processus cellulaire ?',
      'Histoire': 'Quel événement historique ?',
      'Géographie': 'Quelle caractéristique géographique ?'
    };
    
    return questions[subject] || 'Question sur le sujet étudié';
  }

  async generateSummary(content) {
    const prompt = `Génère un résumé clair et structuré de ce contenu de cours. 
    Le résumé doit inclure :
    - Les points clés principaux
    - Les concepts importants
    - Une structure logique
    - Maximum 300 mots
    
    Contenu : ${content}`;

    try {
      const response = await this.generateResponse(prompt);
      return response;
    } catch (error) {
      console.error('Erreur lors de la génération du résumé:', error);
      return this.generateMockSummary(content);
    }
  }

  generateMockSummary(content) {
    return `Résumé automatique du contenu de cours :

**Points clés :**
• Concept principal 1 : Explication concise
• Concept principal 2 : Définition importante
• Concept principal 3 : Notion fondamentale

**Concepts importants :**
Ce cours couvre les aspects essentiels de la matière étudiée, avec un focus sur la compréhension pratique et théorique des concepts présentés.

**Structure :**
Le contenu est organisé de manière logique pour faciliter l'apprentissage et la révision.`;
  }

  async generateFlashcards(content, count = 10) {
    const prompt = `Génère ${count} flashcards basées sur ce contenu de cours.
    Les flashcards doivent couvrir les concepts clés, définitions, formules importantes.
    Chaque flashcard doit avoir une question claire et une réponse détaillée.
    Format JSON attendu :
    {
      "flashcards": [
        {
          "question": "Question claire et précise",
          "answer": "Réponse détaillée et pédagogique",
          "category": "definition|formula|concept|application"
        }
      ]
    }
    
    Contenu : ${content.substring(0, 3000)}`;

    try {
      const response = await this.generateResponse(prompt);
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const flashcards = JSON.parse(jsonMatch[0]);
          // Valider que chaque flashcard a la structure attendue
          if (flashcards.flashcards && Array.isArray(flashcards.flashcards)) {
            return flashcards.flashcards.filter(f => f.question && f.answer);
          }
        }
      } catch (e) {
        console.warn('Impossible de parser la réponse JSON, génération de flashcards mock');
      }
      
      return this.generateMockFlashcards(content, count);
    } catch (error) {
      console.error('Erreur lors de la génération de flashcards:', error);
      return this.generateMockFlashcards(content, count);
    }
  }

  generateMockFlashcards(content, count) {
    const flashcards = [];
    const concepts = ['Définition', 'Principe', 'Formule', 'Théorème', 'Loi', 'Processus'];
    
    for (let i = 0; i < count; i++) {
      const concept = concepts[i % concepts.length];
      flashcards.push({
        question: `${concept} ${i + 1} : ${this.generateFlashcardQuestion(concept)}`,
        answer: `Réponse détaillée pour ${concept} ${i + 1} : Explication complète du concept avec des exemples et des applications pratiques.`,
        category: concept.toLowerCase()
      });
    }
    
    return flashcards;
  }

  generateFlashcardQuestion(concept) {
    const questions = {
      'Définition': 'Qu\'est-ce que ce concept ?',
      'Principe': 'Quel est le principe fondamental ?',
      'Formule': 'Quelle est la formule associée ?',
      'Théorème': 'Que dit ce théorème ?',
      'Loi': 'Quelle est cette loi ?',
      'Processus': 'Comment fonctionne ce processus ?'
    };
    
    return questions[concept] || 'Question sur le concept';
  }
}

// Initialiser le service IA
if (typeof window !== 'undefined') {
  window.AIService = new AIService();
}