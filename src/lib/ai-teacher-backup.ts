import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set')
}

console.log('API Key loaded:', process.env.GEMINI_API_KEY ? 'Yes (length: ' + process.env.GEMINI_API_KEY.length + ')' : 'No')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

interface TeachingContext {
  language: string
  level: string
  currentTopic?: string
  codeContext?: string
  studyPlan?: any
  currentModule?: number
  currentLesson?: number
  userUnderstanding?: 'poor' | 'fair' | 'good' | 'excellent'
  lessonCompleted?: boolean
  conversationHistory?: Array<{ role: 'user' | 'assistant', content: string }>
  lessonState?: 'introduction' | 'exercise' | 'practice' | 'evaluation' | 'completed'
  userProgress?: {
    completedExercises: number
    totalExercises: number
    mistakeCount: number
    helpRequests: number
  }
}

export class AITeacher {
  private model: any

  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro", // Usar modelo com contexto longo
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 8192, // Increased from 1024 to 8192 for longer responses
      }
    })
  }

  private createSystemInstruction(context: TeachingContext): string {
    return `Você é uma IA professora PROATIVA especializada em ensino de programação personalizado. 

PAPEL E RESPONSABILIDADES:
- Você é uma PROFESSORA ATIVA que conduz a aula, não apenas responde perguntas
- Você deve ENSINAR ATIVAMENTE através do chat E do editor de código
- Você monitora o progresso do aluno constantemente
- Você decide quando avançar no conteúdo baseado na compreensão do aluno

PERSONALIDADE E ESTILO:
- Empática, paciente e encorajadora
- Adapta explicações ao nível do estudante (${context.level})
- Usa linguagem clara e exemplos práticos
- Celebra progressos e oferece suporte em dificuldades
- SEMPRE propõe próximos passos e exercícios

METODOLOGIA DE ENSINO PROATIVA:
- Ensino estruturado em etapas progressivas
- Apresenta conceitos + exercícios práticos AUTOMATICAMENTE
- Monitora código do aluno em tempo real
- Fornece feedback imediato sobre código
- Propõe desafios crescentes baseado no progresso
- NUNCA espera o aluno pedir - você conduz a aula!

CONTEXTO ATUAL DA AULA:
- Linguagem: ${context.language}
- Nível: ${context.level}
- Módulo: ${context.currentModule || 'Não definido'}
- Lição: ${context.currentLesson || 'Não definida'}
- Estado da lição: ${context.lessonState || 'introduction'}
- Compreensão do aluno: ${context.userUnderstanding || 'Avaliando'}
- Progresso: ${context.userProgress ? `${context.userProgress.completedExercises}/${context.userProgress.totalExercises} exercícios` : 'Iniciando'}

ESTRATÉGIA DE RESPOSTA BASEADA NO ESTADO:
${this.getStateBasedStrategy(context.lessonState || 'introduction')}

DIRETRIZES DE RESPOSTA:
1. SEMPRE analise se o aluno já escreveu código próprio ou se o editor ainda contém apenas template
2. Se o editor está vazio/template, FOQUE em explicar conceitos e fornecer código inicial
3. Se há código real do aluno, forneça feedback específico sobre ele
4. SEMPRE proponha próximos passos práticos
5. Use exemplos concretos e exercícios
6. Mantenha foco no objetivo da lição
7. Seja específico sobre o que o aluno deve fazer
8. Use markdown para formatação clara
9. Adapte dificuldade baseado no progresso
10. CONDUZA a aula ativamente

FORMATO DE RESPOSTA OBRIGATÓRIO:
- **Situação Atual**: Identifique se o aluno já começou a programar ou ainda não
- **Ensino do Conceito**: Explique o conceito atual de forma clara
- **Exercício Prático**: Código específico para o aluno tentar
- **Objetivo Claro**: O que o aluno está aprendendo neste momento

Se o aluno NÃO escreveu código próprio ainda:
- Foque em explicar conceitos básicos
- Forneça código inicial simples para experimentar
- Explique passo a passo o que fazer

Se o aluno JÁ escreveu código próprio:
- Analise e dê feedback sobre o código atual
- Sugira melhorias ou próximos passos
- Proponha novos desafios baseados no progresso

Responda SEMPRE em português brasileiro de forma natural e PROATIVA.`
  }

  private getStateBasedStrategy(lessonState: string): string {
    switch (lessonState) {
      case 'introduction':
        return `ESTADO: INTRODUÇÃO
- Apresente o conceito da lição de forma clara
- Dê um exemplo prático simples
- Forneça código inicial para o aluno experimentar
- Explique o que o aluno deve fazer primeiro`
      
      case 'exercise':
        return `ESTADO: EXERCÍCIO
- Monitore se o aluno está progredindo
- Dê dicas específicas se necessário
- Valide tentativas e corrija erros
- Prepare próximo desafio quando concluir`
      
      case 'practice':
        return `ESTADO: PRÁTICA
- Proponha variações do exercício
- Aumente gradualmente a dificuldade
- Reforce conceitos através da prática
- Monitore sinais de compreensão`
      
      case 'evaluation':
        return `ESTADO: AVALIAÇÃO
- Avalie a compreensão geral do aluno
- Teste conhecimento com desafio integrador
- Identifique pontos que precisam reforço
- Decida se pode avançar para próxima lição`
      
      case 'completed':
        return `ESTADO: CONCLUÍDO
- Parabéns pelo progresso!
- Resumo do que foi aprendido
- Preparação para próxima lição
- Motivação para continuar aprendendo`
      
      default:
        return `ESTADO: GERAL
- Conduza a aula baseado no contexto
- Seja proativo em ensinar
- Forneça exercícios práticos
- Mantenha aluno engajado`
    }
  }

  private createPromptWithContext(message: string, context: TeachingContext): string {
    let prompt = `${this.createSystemInstruction(context)}\n\n`

    // Adicionar contexto do plano de estudos se disponível
    if (context.studyPlan) {
      prompt += `PLANO DE ESTUDOS ATUAL:\n`
      prompt += `- Título: ${context.studyPlan.title || 'Plano personalizado'}\n`
      if (context.studyPlan.modules && context.currentModule) {
        const currentModuleData = context.studyPlan.modules[context.currentModule - 1]
        if (currentModuleData) {
          prompt += `- Módulo atual: ${currentModuleData.name}\n`
          if (currentModuleData.lessons && context.currentLesson) {
            const currentLessonData = currentModuleData.lessons[context.currentLesson - 1]
            if (currentLessonData) {
              prompt += `- Lição atual: ${currentLessonData.name}\n`
              prompt += `- Objetivos: ${currentLessonData.objectives?.join(', ') || 'Não definidos'}\n`
            }
          }
        }
      }
      prompt += `\n`
    }

    // Adicionar contexto do código se disponível e não for apenas template
    if (context.codeContext && !this.isTemplateCode(context.codeContext)) {
      prompt += `CÓDIGO ATUAL DO ALUNO:\n\`\`\`${context.language.toLowerCase()}\n${context.codeContext}\n\`\`\`\n\n`
    } else if (context.codeContext && this.isTemplateCode(context.codeContext)) {
      prompt += `SITUAÇÃO ATUAL: O aluno ainda não começou a escrever código próprio (editor contém apenas template inicial).\n\n`
    }

    // Adicionar histórico de conversa recente se disponível
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      prompt += `CONVERSA RECENTE:\n`
      const recentHistory = context.conversationHistory.slice(-4) // Últimas 4 mensagens
      recentHistory.forEach(msg => {
        prompt += `${msg.role === 'user' ? 'Aluno' : 'Professor'}: ${msg.content}\n`
      })
      prompt += `\n`
    }

    prompt += `MENSAGEM ATUAL DO ALUNO:\n${message}\n\n`

    prompt += `INSTRUÇÕES ESPECÍFICAS:
- Analise o contexto completo antes de responder
- IDENTIFIQUE se o aluno já começou a escrever código próprio ou não
- Se o editor está vazio/template: foque em ensinar conceitos e dar código inicial
- Se há código real do aluno: forneça feedback específico sobre ele
- Se o aluno está com dificuldades, ofereça ajuda adicional
- Se o aluno demonstra compreensão, sugira próximos desafios
- Mantenha o foco no objetivo da lição atual
- Seja encorajador e construtivo sempre
- NÃO assuma que código template foi escrito pelo aluno`

    return prompt
  }

  async chatResponse(message: string, context: TeachingContext): Promise<string> {
    console.log('AI Teacher - Processing message:', message)
    console.log('AI Teacher - Context:', JSON.stringify(context, null, 2))

    const prompt = this.createPromptWithContext(message, context)
    console.log('AI Teacher - Full prompt preview:', prompt.substring(0, 500) + '...')

    const result = await this.model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log('AI Teacher - Generated response length:', text.length)
    console.log('AI Teacher - Response preview:', text.substring(0, 200) + '...')

    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from AI model')
    }

    return text.trim()
  }

  async generateExercise(topic: string, difficulty: string, language: string): Promise<string> {
    const prompt = `Como professor de programação especializado em ${language}, crie um exercício prático sobre "${topic}" para nível ${difficulty}.

FORMATO DA RESPOSTA:
1. **Título do Exercício**
2. **Descrição clara do problema**
3. **Exemplo de entrada/saída esperada**
4. **Código inicial (template)**
5. **Dicas úteis**

CRITÉRIOS:
- Adequado ao nível ${difficulty}
- Foco em conceitos práticos
- Exemplo claro e testável
- Progressão lógica de dificuldade

Responda em português brasileiro.`

    const result = await this.model.generateContent(prompt)
    const response = await result.response
    return response.text()
  }

  async provideFeedback(code: string, exercise: string, language: string): Promise<string> {
    const prompt = `Como professor experiente de ${language}, analise este código submetido pelo aluno:

EXERCÍCIO:
${exercise}

CÓDIGO DO ALUNO:
\`\`\`${language.toLowerCase()}
${code}
\`\`\`

FORNEÇA FEEDBACK ESTRUTURADO:
1. **Análise Geral** - O código resolve o problema?
2. **Pontos Positivos** - O que o aluno fez bem
3. **Áreas de Melhoria** - Sugestões específicas
4. **Próximos Passos** - Como evoluir

Use tom encorajador e construtivo. Responda em português brasileiro.`

    const result = await this.model.generateContent(prompt)
    const response = await result.response
    return response.text()
  }

  async assessUnderstanding(userResponse: string, expectedConcepts: string[]): Promise<'poor' | 'fair' | 'good' | 'excellent'> {
    const prompt = `Como professor, avalie a compreensão do aluno baseado na resposta dele:

CONCEITOS ESPERADOS: ${expectedConcepts.join(', ')}

RESPOSTA DO ALUNO: "${userResponse}"

Classifique a compreensão como:
- poor: Não demonstra compreensão dos conceitos
- fair: Compreensão básica, mas com lacunas
- good: Boa compreensão dos conceitos principais
- excellent: Compreensão completa e aplicação correta

Responda APENAS com uma palavra: poor, fair, good ou excellent`

    const result = await this.model.generateContent(prompt)
    const response = await result.response
    const assessment = response.text().trim().toLowerCase()

    if (['poor', 'fair', 'good', 'excellent'].includes(assessment)) {
      return assessment as 'poor' | 'fair' | 'good' | 'excellent'
    }

    throw new Error('Resposta inválida da IA para avaliação de compreensão')
  }

  async assessKnowledgeLevel(language: string, userAnswers: string[]): Promise<{
    level: 'beginner' | 'intermediate' | 'advanced'
    reasoning: string
    recommendations: string[]
  }> {
    try {
      console.log('Starting AI assessment for language:', language)
      console.log('User answers count:', userAnswers.length)
      
      const prompt = `
      Você é um professor de programação especialista. Analise as seguintes respostas sobre ${language} e determine o nível de conhecimento do usuário:

      Respostas do usuário:
      ${userAnswers.map((answer, i) => `${i + 1}. ${answer}`).join('\n')}

      Com base nessas respostas, determine:
      1. Nível de conhecimento (beginner, intermediate, advanced)
      2. Justificativa para essa classificação
      3. Recomendações específicas de estudo

      Responda em formato JSON:
      {
        "level": "beginner|intermediate|advanced",
        "reasoning": "explicação detalhada",
        "recommendations": ["recomendação 1", "recomendação 2", ...]
      }
      `

      console.log('Sending request to Gemini AI...')
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      console.log('Received response from Gemini AI:', text)

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error('No JSON found in response:', text)
        throw new Error('Invalid JSON response format')
      }

      const assessment = JSON.parse(jsonMatch[0])
      
      console.log('Parsed assessment:', assessment)

      // Validate response structure
      if (!assessment.level || !assessment.reasoning || !Array.isArray(assessment.recommendations)) {
        console.error('Invalid assessment structure:', assessment)
        throw new Error('Invalid assessment structure')
      }

      return assessment
    } catch (error) {
      console.error('Error in assessKnowledgeLevel:', error)
      throw error
    }
  }

  async generateStudyPlan(language: string, level: string, goals: string[]): Promise<any> {
    try {
      console.log('Generating study plan for:', { language, level, goals })

      // Optimized prompt to generate structured study plan within token limits
      const prompt = `Crie um plano de estudos completo para ${language} nível ${level}.

RESPONDA APENAS COM JSON VÁLIDO NO FORMATO EXATO ABAIXO (sem texto adicional):

{
  "title": "Plano de Estudos Python - Nível ${level}",
  "description": "Plano estruturado para aprender ${language}",
  "totalEstimatedHours": 35,
  "modules": [
    {
      "name": "Módulo 1: Fundamentos",
      "description": "Conceitos básicos e sintaxe",
      "lessons": [
        {
          "name": "Introdução ao ${language}",
          "content": "Primeiros passos",
          "objectives": ["Sintaxe básica", "Primeiro programa"],
          "exercise": {
            "description": "Programa simples",
            "codeTemplate": "# Seu código aqui",
            "expectedOutput": "Hello World"
          }
        },
        {
          "name": "Variáveis e Tipos",
          "content": "Trabalhando com dados",
          "objectives": ["Variáveis", "Tipos de dados"],
          "exercise": {
            "description": "Criar variáveis",
            "codeTemplate": "# Declare variáveis",
            "expectedOutput": "Valores"
          }
        }
      ]
    },
    {
      "name": "Módulo 2: Estruturas de Controle",
      "description": "Condicionais e loops",
      "lessons": [
        {
          "name": "Condicionais",
          "content": "If, else, elif",
          "objectives": ["Decisões", "Comparações"],
          "exercise": {
            "description": "Usar if/else",
            "codeTemplate": "# Condição aqui",
            "expectedOutput": "Resultado"
          }
        },
        {
          "name": "Loops",
          "content": "For e while",
          "objectives": ["Repetição", "Iteração"],
          "exercise": {
            "description": "Loop simples",
            "codeTemplate": "# Loop aqui",
            "expectedOutput": "Lista"
          }
        }
      ]
    },
    {
      "name": "Módulo 3: Aplicação Prática",
      "description": "Projetos e exercícios",
      "lessons": [
        {
          "name": "Projeto Final",
          "content": "Aplicação completa",
          "objectives": ["Integração", "Projeto"],
          "exercise": {
            "description": "Criar projeto",
            "codeTemplate": "# Projeto aqui",
            "expectedOutput": "Aplicação"
          }
        }
      ]
    }
  ],
  "milestones": ["Sintaxe básica", "Estruturas de controle", "Primeiro projeto"]
}

INSTRUÇÕES:
- Mantenha o JSON válido e completo
- Use exatamente 3 módulos com 2-3 lições cada
- Seja conciso mas informativo
- Garanta que todos os campos estejam preenchidos`

      console.log('Sending study plan request to AI...')
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      console.log('Study plan response length:', text.length)
      console.log('Study plan response:', text.substring(0, 500) + '...')

      // Parse JSON response with better error handling
      let studyPlan
      
      try {
        // First try: look for JSON between ```json blocks
        let jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/)
        if (jsonMatch) {
          studyPlan = JSON.parse(jsonMatch[1])
        } else {
          // Second try: look for any JSON object
          jsonMatch = text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            try {
              studyPlan = JSON.parse(jsonMatch[0])
            } catch (parseError) {
              // Third try: attempt to fix truncated JSON
              console.log('JSON parse failed, attempting to fix truncated response...')
              const truncatedJson = jsonMatch[0]
              
              // Check if JSON is truncated (doesn't end with })
              if (!truncatedJson.trim().endsWith('}')) {
                console.log('Detected truncated JSON from API')
                throw new Error('Resposta da API foi truncada - JSON incompleto')
              }
              throw parseError
            }
          } else {
            console.error('No JSON found in study plan response')
            console.error('Response was:', text)
            throw new Error('No JSON found in response')
          }
        }
      } catch (jsonError) {
        console.error('JSON parsing failed:', jsonError)
        throw new Error('Resposta da IA está em formato inválido')
      }
      
      console.log('Generated study plan modules:', studyPlan.modules?.length || 0)
      
      return studyPlan
    } catch (error) {
      console.error('Error generating study plan:', error)
      throw error
    }
  }

  async teachCurrentLesson(studyPlan: any, currentModule: number, currentLesson: number): Promise<any> {
    console.log('Teaching current lesson:', { currentModule, currentLesson })

    if (!studyPlan?.modules || !studyPlan.modules[currentModule - 1]) {
      throw new Error('Plano de estudos inválido ou módulo não encontrado')
    }

    const moduleData = studyPlan.modules[currentModule - 1]
    const lessonData = moduleData.lessons?.[currentLesson - 1]

    if (!lessonData) {
      throw new Error('Lição não encontrada no plano de estudos')
    }

    // Try to generate AI instruction
    const teachingPrompt = `
    Como professora especializada em programação, apresente esta lição de forma engajante:

    MÓDULO: ${moduleData.name}
    LIÇÃO: ${lessonData.name}
    
    CONTEÚDO DA LIÇÃO:
    ${lessonData.content}

    OBJETIVOS:
    ${lessonData.objectives?.join(', ') || 'Não definidos'}

    EXERCÍCIO:
    ${lessonData.exercise?.description || 'Nenhum exercício definido'}

    INSTRUÇÕES:
    1. Apresente a lição de forma motivadora e clara
    2. Explique os conceitos principais de forma didática
    3. Apresente o exercício prático
    4. Dê dicas iniciais para começar
    5. Use emojis para tornar mais amigável
    6. Mantenha tom encorajador

    Formate a resposta em markdown e seja conversacional.
    Responda em português brasileiro.
    `

    console.log('Attempting to generate AI instruction...')
    const result = await this.model.generateContent(teachingPrompt)
    const response = await result.response
    const instruction = response.text()
    console.log('AI instruction generated successfully')

    return {
      lesson: {
        moduleName: moduleData.name,
        lessonName: lessonData.name,
        content: lessonData.content,
        objectives: lessonData.objectives || [],
        exercise: lessonData.exercise || {
          description: "Exercício não definido",
          codeTemplate: "",
          expectedOutput: ""
        },
        instruction: instruction.trim()
      },
      progress: {
        currentModule,
        currentLesson,
        totalModules: studyPlan.modules.length,
        totalLessons: studyPlan.modules.reduce((total: number, module: any) => 
          total + (module.lessons?.length || 0), 0)
      },
      studyPlan: {
        currentModuleName: moduleData.name,
        currentLessonName: lessonData.name,
        ...studyPlan
      }
    }
  }

  /**
   * Determines the next lesson/module progression based on current progress
   */
  async progressToNextLesson(
    studyPlan: any, 
    currentModule: number, 
    currentLesson: number
  ): Promise<{
    nextModule: number;
    nextLesson: number;
    isModuleComplete: boolean;
    isCourseComplete: boolean;
    message: string;
  }> {
    try {
      console.log(`[AI Teacher] Processing lesson progression - Module ${currentModule}, Lesson ${currentLesson}`)
      
      if (!studyPlan?.modules || !Array.isArray(studyPlan.modules)) {
        throw new Error('Estrutura do plano de estudos inválida')
      }

      // Find current module - using index since modules might not have id property
      const moduleIndex = currentModule - 1 // Convert to 0-based index
      
      if (moduleIndex < 0 || moduleIndex >= studyPlan.modules.length) {
        throw new Error(`Índice de módulo inválido: ${moduleIndex} para ${studyPlan.modules.length} módulos`)
      }

      const currentModuleData = studyPlan.modules[moduleIndex]

      const totalLessonsInModule = currentModuleData.lessons?.length || 0
      console.log(`[AI Teacher] Current module has ${totalLessonsInModule} lessons`)

      // Check if there are more lessons in current module
      if (currentLesson < totalLessonsInModule) {
        // Move to next lesson in same module
        const nextLesson = currentLesson + 1
        console.log(`[AI Teacher] Moving to next lesson: ${nextLesson} in module ${currentModule}`)
        
        return {
          nextModule: currentModule,
          nextLesson,
          isModuleComplete: false,
          isCourseComplete: false,
          message: `Parabéns! Avançando para a lição ${nextLesson} do módulo ${currentModule}.`
        }
      } else {
        // Current module is complete, check if there's a next module
        const nextModuleIndex = moduleIndex + 1
        
        if (nextModuleIndex < studyPlan.modules.length) {
          // Move to first lesson of next module
          const nextModule = currentModule + 1 // Simple increment since we're using 1-based indexing
          console.log(`[AI Teacher] Module ${currentModule} completed, moving to module ${nextModule}`)
          
          return {
            nextModule,
            nextLesson: 1,
            isModuleComplete: true,
            isCourseComplete: false,
            message: `🎉 Módulo ${currentModule} concluído! Avançando para o módulo ${nextModule}.`
          }
        } else {
          // Course is complete!
          console.log(`[AI Teacher] Course completed! Module ${currentModule}, Lesson ${currentLesson}`)
          
          return {
            nextModule: currentModule,
            nextLesson: currentLesson,
            isModuleComplete: true,
            isCourseComplete: true,
            message: "🏆 Parabéns! Você concluiu todo o curso! Continue praticando para aperfeiçoar seus conhecimentos."
          }
        }
      }
    } catch (error) {
      console.error('[AI Teacher] Error in progressToNextLesson:', error)
      throw error
    }
  }

  async generateTeachingResponse(message: string, language: string, level: string, codeContext?: string): Promise<string> {
    const context: TeachingContext = {
      language,
      level,
      codeContext
    }
    
    return this.chatResponse(message, context)
  }

  /**
   * Inicia uma lição de forma proativa, apresentando conceitos e exercícios automaticamente
   */
  async startProactiveLesson(
    studyPlan: any, 
    currentModule: number, 
    currentLesson: number, 
    userCode?: string
  ): Promise<{
    chatMessage: string;
    codeToSet: string;
    lessonState: string;
    nextActions: string[];
  }> {
    try {
      console.log('Starting proactive lesson:', { currentModule, currentLesson })

      if (!studyPlan?.modules || !studyPlan.modules[currentModule - 1]) {
        throw new Error('Plano de estudos inválido ou módulo não encontrado')
      }

      const moduleData = studyPlan.modules[currentModule - 1]
      const lessonData = moduleData.lessons?.[currentLesson - 1]

      if (!lessonData) {
        throw new Error('Lição não encontrada no plano de estudos')
      }

      // Contexto para ensino proativo
      const context: TeachingContext = {
        language: studyPlan.language || 'Python',
        level: studyPlan.level || 'beginner',
        currentModule,
        currentLesson,
        lessonState: userCode ? 'exercise' : 'introduction',
        studyPlan,
        codeContext: userCode,
        userProgress: {
          completedExercises: 0,
          totalExercises: lessonData.exercises?.length || 1,
          mistakeCount: 0,
          helpRequests: 0
        }
      }

      // Prompt para ensino proativo
      const proactivePrompt = `
MISSÃO: Conduza uma aula PROATIVA sobre "${lessonData.name}"

CONTEÚDO DA LIÇÃO:
${lessonData.content}

OBJETIVOS DE APRENDIZAGEM:
${lessonData.objectives?.join(', ') || 'Conceitos básicos'}

EXERCÍCIO PLANEJADO:
${lessonData.exercise?.description || 'Prática básica'}

CONTEXTO DO ALUNO:
${userCode ? `Código atual: ${userCode}` : 'Iniciando lição'}

INSTRUÇÕES ESPECÍFICAS:
1. APRESENTE o conceito de forma clara e prática
2. FORNEÇA um exemplo concreto de código
3. PROPONHA um exercício específico para o aluno fazer
4. EXPLIQUE exatamente o que o aluno deve digitar no editor
5. CONDUZA a aula - não espere perguntas!

FORMATO DA RESPOSTA:
- Explicação do conceito (breve e clara)
- Exemplo prático com código
- Exercício específico para praticar
- Código inicial para o aluno começar

SEJA PROATIVA - conduza a aula ativamente!
`

      console.log('Generating proactive lesson content...')
      const result = await this.model.generateContent(
        this.createPromptWithContext(proactivePrompt, context)
      )
      const response = await result.response
      const chatMessage = response.text()

      // Extrair código do exercício se disponível
      let codeToSet = lessonData.exercise?.codeTemplate || 
                     this.extractCodeFromResponse(chatMessage) ||
                     "" // Editor vazio para o aluno começar do zero

      return {
        chatMessage: chatMessage.trim(),
        codeToSet,
        lessonState: 'exercise',
        nextActions: [
          'Experimente o código no editor',
          'Modifique os valores',
          'Teste diferentes variações',
          'Peça ajuda se precisar'
        ]
      }
    } catch (error) {
      console.error('Error starting proactive lesson:', error)
      throw error
    }
  }

  private extractCodeFromResponse(response: string): string | null {
    // Extrair blocos de código da resposta
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/g
    const matches = response.match(codeBlockRegex)
    
    if (matches && matches.length > 0) {
      // Pegar o primeiro bloco de código e limpar
      return matches[0]
        .replace(/```[\w]*\n/, '')
        .replace(/\n```$/, '')
        .trim()
    }
    
    return null
  }

  /**
   * Identifica se o código está vazio ou contém apenas espaços/comentários
   */
  private isTemplateCode(code: string): boolean {
    if (!code || code.trim().length === 0) {
      return true
    }

    // Remove comentários e linhas vazias para verificar se há código real
    const codeLines = code.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#') && !line.startsWith('//'))
    
    return codeLines.length === 0
  }

  /**
   * Monitora o código do usuário em tempo real e fornece feedback proativo
   */
  async monitorUserCode(
    userCode: string,
    currentLesson: any,
    previousCode?: string
  ): Promise<{
    feedback: string;
    shouldUpdateCode: boolean;
    newCode?: string;
    progressAssessment: 'improving' | 'struggling' | 'mastered' | 'stuck';
    nextSuggestion: string;
  }> {
    try {
      console.log('Monitoring user code in real time...')

      // Analisar mudanças no código
      const codeChanges = this.analyzeCodeChanges(previousCode, userCode)
      
      const context: TeachingContext = {
        language: currentLesson.language || 'Python',
        level: currentLesson.level || 'beginner',
        lessonState: 'exercise',
        codeContext: userCode,
        currentModule: currentLesson.moduleNumber,
        currentLesson: currentLesson.lessonNumber
      }

      const monitoringPrompt = `
MISSÃO: Monitore o código do aluno e forneça feedback em tempo real

LIÇÃO ATUAL: ${currentLesson.name}
OBJETIVO: ${currentLesson.objectives?.join(', ') || 'Prática básica'}

CÓDIGO DO ALUNO:
\`\`\`
${userCode}
\`\`\`

MUDANÇAS DETECTADAS:
${codeChanges.summary}

INSTRUÇÕES:
1. Analise se o código está correto
2. Identifique melhorias ou erros
3. Avalie se o aluno está progredindo
4. Forneça feedback construtivo
5. Sugira próximo passo específico

CRITÉRIOS DE AVALIAÇÃO:
- Sintaxe correta?
- Lógica adequada?
- Atende aos objetivos?
- Demonstra compreensão?

SEJA ESPECÍFICO e ENCORAJADOR!
`

      const result = await this.model.generateContent(
        this.createPromptWithContext(monitoringPrompt, context)
      )
      const response = await result.response
      const feedback = response.text()

      // Avaliar progresso baseado no código
      const progressAssessment = this.assessCodeProgress(userCode, currentLesson)
      
      // Gerar próxima sugestão
      const nextSuggestion = this.generateNextSuggestion(progressAssessment, currentLesson)

      return {
        feedback: feedback.trim(),
        shouldUpdateCode: false, // Por padrão, não sobrescrever código do usuário
        progressAssessment,
        nextSuggestion
      }
    } catch (error) {
      console.error('Error monitoring user code:', error)
      throw error
    }
  }

  private analyzeCodeChanges(previousCode?: string, currentCode?: string): { summary: string } {
    if (!previousCode || !currentCode) {
      return { summary: "Código inicial" }
    }

    const prevLines = previousCode.split('\n').length
    const currLines = currentCode.split('\n').length
    const lineDiff = currLines - prevLines

    if (lineDiff > 0) {
      return { summary: `Adicionou ${lineDiff} linha(s) - expandindo o código` }
    } else if (lineDiff < 0) {
      return { summary: `Removeu ${Math.abs(lineDiff)} linha(s) - simplificando` }
    } else {
      return { summary: "Modificou código existente - refinando" }
    }
  }

  private assessCodeProgress(
    userCode: string, 
    currentLesson: any
  ): 'improving' | 'struggling' | 'mastered' | 'stuck' {
    const codeLines = userCode.split('\n').filter(line => line.trim().length > 0)
    const hasComments = userCode.includes('#') || userCode.includes('//')
    const hasValidSyntax = !userCode.includes('SyntaxError')
    
    // Lógica simples de avaliação (pode ser expandida)
    if (codeLines.length === 0) return 'stuck'
    if (codeLines.length >= 5 && hasComments && hasValidSyntax) return 'mastered'
    if (codeLines.length >= 2 && hasValidSyntax) return 'improving'
    return 'struggling'
  }

  private generateNextSuggestion(
    progress: 'improving' | 'struggling' | 'mastered' | 'stuck',
    currentLesson: any
  ): string {
    switch (progress) {
      case 'mastered':
        return "Excelente! Que tal tentar um desafio mais avançado?"
      case 'improving':
        return "Muito bom! Continue praticando, você está progredindo."
      case 'struggling':
        return "Não desista! Tente um passo de cada vez. Posso ajudar?"
      case 'stuck':
        return "Vamos começar devagar. Que tal tentar escrever uma linha simples primeiro?"
      default:
        return "Continue praticando! Você consegue."
    }
  }

  /**
   * Avalia código de forma conversacional, mantendo contexto da conversa
   */
  async evaluateCodeConversational(
    code: string, 
    lesson: any, 
    userLevel: string, 
    language: string,
    chatHistory: Array<{role: string, content: string}> = []
  ): Promise<{
    message: string
    shouldAdvance: boolean
    score: number
  }> {
    try {
      // Preparar contexto da conversa usando o sistema de contexto longo
      const conversationContext = chatHistory.length > 0 
        ? chatHistory.map(msg => `${msg.role === 'user' ? 'Aluno' : 'Professor'}: ${msg.content}`).join('\n\n')
        : 'Esta é nossa primeira interação nesta lição.'

      const isTemplateCode = this.isTemplateCode(code)
      
      const systemPrompt = `Você é um professor de programação experiente e conversacional. Você está ensinando ${language} para um aluno de nível ${userLevel}.

CONTEXTO DA LIÇÃO ATUAL:
- Título: ${lesson.name}
- Objetivos: ${lesson.objectives?.join(', ') || 'Praticar conceitos básicos'}
- Conceitos: ${lesson.concepts?.join(', ') || 'Conceitos fundamentais'}

INSTRUÇÕES PARA AVALIAÇÃO:
1. Analise o código considerando o contexto da lição e conversa anterior
2. Se o código está vazio/template, encoraje o aluno a começar e dê uma dica específica
3. Se há código, avalie: correção, qualidade, aderência aos objetivos da lição
4. Seja conversacional e natural - pergunte se tem dúvidas, se quer exemplos, outros exercícios
5. Baseado na qualidade, decida se o aluno deve avançar (score >= 70) ou praticar mais
6. Mantenha a conversa engajada como um professor real

DIRETRIZES DE CONVERSA:
- Seja encorajador mas honesto sobre a qualidade do código
- Ofereça ajuda específica ("Quer que eu explique esse conceito?")
- Sugira próximos passos ("Que tal tentarmos um exercício mais desafiador?")
- Faça perguntas para verificar compreensão
- Use exemplos práticos quando relevante

RESPONDA EM PORTUGUÊS de forma natural e conversacional.`

      const userPrompt = `HISTÓRICO DA CONVERSA:
${conversationContext}

CÓDIGO SUBMETIDO PELO ALUNO:
${isTemplateCode ? '[O aluno ainda não escreveu código ou enviou código vazio]' : code}

Avalie o código e responda de forma conversacional como um professor real. Formate sua resposta como JSON:
{
  "message": "sua resposta conversacional aqui (seja natural, como se fosse um professor real falando)",
  "shouldAdvance": true/false,
  "score": 0-100
}`

      // Usar histórico de conversa no prompt para contexto longo
      const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Entendido! Vou avaliar o código de forma conversacional mantendo o contexto da nossa conversa.' }] },
        { role: 'user', parts: [{ text: userPrompt }] }
      ]

      const result = await this.model.generateContent({
        contents,
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.7,
          topK: 40,
          topP: 0.8
        }
      })

      const response = result.response
      const text = response.text()
      
      console.log('Raw AI response for conversational code evaluation:', text)

      // Tentar extrair JSON da resposta
      let jsonStart = text.indexOf('{')
      let jsonEnd = text.lastIndexOf('}')
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('Response format invalid - no JSON found')
      }

      const jsonText = text.slice(jsonStart, jsonEnd + 1)
      
      try {
        const parsed = JSON.parse(jsonText)
        
        // Validar campos obrigatórios
        if (!parsed.message || typeof parsed.shouldAdvance !== 'boolean' || typeof parsed.score !== 'number') {
          throw new Error('Invalid response structure')
        }
        
        return {
          message: parsed.message,
          shouldAdvance: parsed.shouldAdvance,
          score: Math.max(0, Math.min(100, parsed.score)) // Garantir score entre 0-100
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError)
        console.error('Attempted to parse:', jsonText)
        throw new Error('Failed to parse AI response as JSON')
      }

    } catch (error) {
      console.error('Error in evaluateCodeConversational:', error)
      throw error
    }
  }
}

export const aiTeacher = new AITeacher()