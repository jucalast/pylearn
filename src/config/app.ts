// Global configuration for PyLearn application

export const APP_CONFIG = {
  name: 'PyLearn',
  description: 'Professor de Programação com IA',
  version: '1.0.0',
  
  // Supported programming languages
  supportedLanguages: [
    'Python',
    'JavaScript', 
    'TypeScript',
    'Java',
    'C++',
    'C#',
    'Go',
    'Rust',
    'PHP',
    'Ruby'
  ],
  
  // Knowledge levels
  knowledgeLevels: [
    { id: 'beginner', name: 'Iniciante', description: 'Nunca programei antes' },
    { id: 'intermediate', name: 'Intermediário', description: 'Conheço alguns conceitos' },
    { id: 'advanced', name: 'Avançado', description: 'Tenho experiência significativa' }
  ],
  
  // Assessment questions per language
  assessmentQuestions: {
    Python: [
      'O que você sabe sobre Python? Descreva brevemente.',
      'Como você criaria uma lista com os números de 1 a 10 em Python?',
      'Explique a diferença entre uma lista e um dicionário em Python.',
      'O que são funções em Python e como você definiria uma?',
      'Você já trabalhou com bibliotecas Python? Quais conhece?'
    ],
    JavaScript: [
      'O que você sabe sobre JavaScript? Descreva brevemente.',
      'Como você declararia uma variável em JavaScript?',
      'Explique a diferença entre var, let e const.',
      'O que são funções em JavaScript e como você definiria uma?',
      'Você já trabalhou com frameworks JavaScript? Quais conhece?'
    ],
    TypeScript: [
      'O que você sabe sobre TypeScript? Como ele se relaciona com JavaScript?',
      'Como você definiria tipos em TypeScript?',
      'O que são interfaces em TypeScript?',
      'Como você lidaria com tipos opcionais?',
      'Você já usou TypeScript em projetos? Conte sobre sua experiência.'
    ],
    Java: [
      'O que você sabe sobre Java? Descreva brevemente.',
      'Como você declararia uma classe em Java?',
      'Explique os conceitos de herança e polimorfismo.',
      'O que são packages em Java?',
      'Você já trabalhou com frameworks Java? Quais conhece?'
    ]
  },
  
  // UI Configuration
  ui: {
    theme: {
      primary: '#3B82F6', // blue-600
      secondary: '#10B981', // green-500
      accent: '#8B5CF6', // purple-500
      background: '#F9FAFB', // gray-50
      surface: '#FFFFFF', // white
      error: '#EF4444', // red-500
      warning: '#F59E0B', // amber-500
      success: '#10B981', // green-500
    },
    
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    }
  },
  
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '',
    timeout: 30000, // 30 seconds
    retries: 3
  },
  
  // Features flags
  features: {
    realTimeChat: true,
    codeExecution: true,
    multiLanguageSupport: true,
    progressTracking: true,
    exerciseGeneration: true,
    aiAssessment: true,
    gamification: false, // Future feature
    collaboration: false, // Future feature
    videoLessons: false, // Future feature
  },
  
  // Limits and constraints
  limits: {
    maxMessageLength: 2000,
    maxCodeLength: 10000,
    maxSessionDuration: 3600000, // 1 hour in milliseconds
    maxDailyExercises: 50,
    maxChatMessagesPerSession: 100
  },
  
  // Default values
  defaults: {
    language: 'Python',
    level: 'beginner',
    theme: 'light',
    codeTemplate: {
      Python: '# Escreva seu código aqui\nprint("Olá, mundo!")',
      JavaScript: '// Escreva seu código aqui\nconsole.log("Olá, mundo!");',
      TypeScript: '// Escreva seu código aqui\nconsole.log("Olá, mundo!");',
      Java: '// Escreva seu código aqui\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Olá, mundo!");\n    }\n}'
    }
  }
}

export type Language = typeof APP_CONFIG.supportedLanguages[number]
export type KnowledgeLevel = typeof APP_CONFIG.knowledgeLevels[number]['id']
