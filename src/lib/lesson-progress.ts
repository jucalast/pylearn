import { prisma } from './db'

export interface LessonProgress {
  currentModule: number
  currentLesson: number
  completedLessons: Array<{
    module: number
    lesson: number
    completedAt: string
  }>
  totalCompletedLessons: number
  totalLessons: number
  progressPercentage: number
  xpEarned: number
  moduleProgress: Array<{
    moduleNumber: number
    completedLessons: number
    totalLessons: number
    isCompleted: boolean
  }>
  lessonCompleted: boolean
  userUnderstanding: 'poor' | 'fair' | 'good' | 'excellent'
  lastActivity: Date
}

export interface LessonContext {
  moduleName: string
  lessonName: string
  lessonContent: string
  exercise: {
    description: string
    codeTemplate: string
    expectedOutput?: string
    hints?: string[]
  }
  objectives: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  previousLessons: string[]
  nextLessons: string[]
}

/**
 * Calcula o progresso correto baseado no studyPlan e posição atual
 */
export function calculateCorrectProgress(
  studyPlan: any, 
  currentModule: number, 
  currentLesson: number,
  completedLessons: Array<{module: number, lesson: number, completedAt: string}> = []
): {
  totalLessons: number
  totalCompletedLessons: number
  progressPercentage: number
  currentPosition: string
  moduleProgress: Array<{
    moduleNumber: number
    completedLessons: number
    totalLessons: number
    isCompleted: boolean
  }>
} {
  if (!studyPlan?.modules || !Array.isArray(studyPlan.modules)) {
    return {
      totalLessons: 0,
      totalCompletedLessons: 0,
      progressPercentage: 0,
      currentPosition: '0 de 0',
      moduleProgress: []
    }
  }

  // Calcular total de lições
  const totalLessons = studyPlan.modules.reduce((total: number, module: any) => 
    total + (module.lessons?.length || 0), 0
  )

  // Calcular lições completadas baseado na posição atual
  let totalCompletedLessons = 0
  
  if (completedLessons && Array.isArray(completedLessons) && completedLessons.length > 0) {
    // Contar lições que foram explicitamente marcadas como completadas
    totalCompletedLessons = completedLessons.length
    
    console.log('📊 [PROGRESS-CALC] Completed lessons from array:', {
      completedCount: totalCompletedLessons,
      completedLessons: completedLessons.map(l => `M${l.module}L${l.lesson}`)
    })
  } else {
    // Calcular baseado na posição atual: todas as lições anteriores à atual estão completadas
    // Somar todas as lições dos módulos anteriores
    for (let m = 1; m < currentModule; m++) {
      const module = studyPlan.modules[m - 1]
      if (module?.lessons) {
        totalCompletedLessons += module.lessons.length
      }
    }
    
    // Adicionar lições completadas do módulo atual (excluindo a lição atual)
    if (currentLesson > 1) {
      totalCompletedLessons += currentLesson - 1
    }
    
    console.log('📊 [PROGRESS-CALC] Calculated from position:', {
      currentModule,
      currentLesson,
      totalCompletedLessons,
      calculation: `Módulos anteriores + (lição atual - 1) = ${totalCompletedLessons}`
    })
  }
  
  // CORREÇÃO: Se o array completedLessons está vazio ou incompleto,
  // mas a posição atual indica que deveria haver lições completadas,
  // usar o cálculo baseado na posição
  const expectedCompleted = (() => {
    let expected = 0
    // Contar lições de módulos anteriores
    for (let m = 1; m < currentModule; m++) {
      const module = studyPlan.modules[m - 1]
      if (module?.lessons) {
        expected += module.lessons.length
      }
    }
    // Adicionar lições anteriores do módulo atual
    if (currentLesson > 1) {
      expected += currentLesson - 1
    }
    return expected
  })()
  
  // Use o maior valor entre o calculado e o esperado
  totalCompletedLessons = Math.max(totalCompletedLessons, expectedCompleted)
  
  console.log('🔧 [PROGRESS-CALC] Final calculation:', {
    fromArray: completedLessons?.length || 0,
    expectedFromPosition: expectedCompleted,
    finalTotal: totalCompletedLessons
  })

  // Calcular progresso por módulo
  const moduleProgress = studyPlan.modules.map((module: any, index: number) => {
    const moduleNumber = index + 1
    const totalLessonsInModule = module.lessons?.length || 0
    
    let completedLessonsInModule = 0
    
    if (moduleNumber < currentModule) {
      // Módulos anteriores: todas as lições completadas
      completedLessonsInModule = totalLessonsInModule
    } else if (moduleNumber === currentModule) {
      // Módulo atual: lições anteriores à atual (não incluindo a atual)
      completedLessonsInModule = Math.max(0, currentLesson - 1)
    }
    // Módulos futuros: 0 lições completadas
    
    console.log(`📊 [MODULE-${moduleNumber}] Progress:`, {
      completed: completedLessonsInModule,
      total: totalLessonsInModule,
      isCurrent: moduleNumber === currentModule
    })
    
    return {
      moduleNumber,
      completedLessons: completedLessonsInModule,
      totalLessons: totalLessonsInModule,
      isCompleted: completedLessonsInModule >= totalLessonsInModule && totalLessonsInModule > 0
    }
  })

  const progressPercentage = totalLessons > 0 ? 
    Math.round((totalCompletedLessons / totalLessons) * 100) : 0

  return {
    totalLessons,
    totalCompletedLessons,
    progressPercentage,
    currentPosition: `${totalCompletedLessons + 1} de ${totalLessons}`, // +1 para incluir a lição atual
    moduleProgress
  }
}

export class LessonProgressManager {
  async getCurrentLesson(userId: string): Promise<{ progress: LessonProgress; context: LessonContext } | null> {
    try {
      const profile = await prisma.learningProfile.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      if (!profile) return null

      const currentProgress = profile.currentProgress as any
      const studyPlan = profile.studyPlan as any

      if (!currentProgress || !studyPlan) return null

      const currentModule = studyPlan.modules?.[currentProgress.currentModule - 1]
      const currentLessonData = currentModule?.lessons?.[currentProgress.currentLesson - 1]

      if (!currentLessonData) return null

      // Calcular progresso correto
      const progressCalculation = calculateCorrectProgress(
        studyPlan,
        currentProgress.currentModule || 1,
        currentProgress.currentLesson || 1,
        currentProgress.completedLessons || []
      )

      // Obter lições anteriores e próximas para contexto
      const previousLessons: string[] = []
      const nextLessons: string[] = []
      
      // Adicionar lições completadas como contexto
      if (currentProgress.completedLessons && Array.isArray(currentProgress.completedLessons)) {
        currentProgress.completedLessons.forEach((completed: any) => {
          const module = studyPlan.modules?.[completed.module - 1]
          const lesson = module?.lessons?.[completed.lesson - 1]
          if (lesson?.name) {
            previousLessons.push(lesson.name)
          }
        })
      }

      // Adicionar próximas lições do módulo atual
      const currentModuleData = studyPlan.modules?.[currentProgress.currentModule - 1]
      if (currentModuleData?.lessons) {
        for (let i = currentProgress.currentLesson; i < currentModuleData.lessons.length; i++) {
          const lesson = currentModuleData.lessons[i]
          if (lesson?.name) {
            nextLessons.push(lesson.name)
          }
        }
      }

      const progress: LessonProgress = {
        currentModule: currentProgress.currentModule || 1,
        currentLesson: currentProgress.currentLesson || 1,
        completedLessons: currentProgress.completedLessons || [],
        totalCompletedLessons: progressCalculation.totalCompletedLessons,
        totalLessons: progressCalculation.totalLessons,
        progressPercentage: progressCalculation.progressPercentage,
        xpEarned: currentProgress.xpEarned || 0,
        moduleProgress: progressCalculation.moduleProgress,
        lessonCompleted: currentProgress.lessonCompleted || false,
        userUnderstanding: currentProgress.userUnderstanding || 'fair',
        lastActivity: new Date(currentProgress.lastActivity || Date.now())
      }

      const context: LessonContext = {
        moduleName: currentModule.name,
        lessonName: currentLessonData.name,
        lessonContent: currentLessonData.content,
        exercise: {
          description: currentLessonData.exercise?.description || '',
          codeTemplate: currentLessonData.exercise?.codeTemplate || '',
          expectedOutput: currentLessonData.exercise?.expectedOutput,
          hints: currentLessonData.exercise?.hints || []
        },
        objectives: currentLessonData.objectives || [],
        difficulty: profile.knowledgeLevel as any || 'beginner',
        previousLessons,
        nextLessons
      }

      return { progress, context }
    } catch (error) {
      console.error('Error getting current lesson:', error)
      return null
    }
  }

  async markLessonCompleted(userId: string, understanding: 'poor' | 'fair' | 'good' | 'excellent'): Promise<boolean> {
    try {
      const profile = await prisma.learningProfile.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      if (!profile) return false

      const currentProgress = profile.currentProgress as any || {}
      const studyPlan = profile.studyPlan as any

      // Atualizar progresso
      const updatedProgress = {
        ...currentProgress,
        lessonCompleted: true,
        userUnderstanding: understanding,
        completedLessons: (currentProgress.completedLessons || 0) + 1,
        lastActivity: new Date().toISOString()
      }

      await prisma.learningProfile.update({
        where: { id: profile.id },
        data: { currentProgress: updatedProgress }
      })

      return true
    } catch (error) {
      console.error('Error marking lesson completed:', error)
      return false
    }
  }

  async moveToNextLesson(userId: string): Promise<boolean> {
    try {
      const profile = await prisma.learningProfile.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      if (!profile) return false

      const currentProgress = profile.currentProgress as any || {}
      const studyPlan = profile.studyPlan as any

      if (!studyPlan?.modules) return false

      let nextModule = currentProgress.currentModule || 1
      let nextLesson = (currentProgress.currentLesson || 1) + 1

      // Verificar se há mais lições no módulo atual
      const currentModuleData = studyPlan.modules[nextModule - 1]
      
      console.log('📊 [NEXT-LESSON] Current state:', {
        currentModule: nextModule,
        currentLesson: currentProgress.currentLesson || 1,
        nextLesson,
        moduleData: currentModuleData ? {
          name: currentModuleData.name,
          totalLessons: currentModuleData.lessons?.length || 0
        } : null
      })
      
      if (!currentModuleData || nextLesson > (currentModuleData.lessons?.length || 0)) {
        // Mover para o próximo módulo apenas se não há mais lições no módulo atual
        nextModule += 1
        nextLesson = 1

        console.log('🔄 [NEXT-LESSON] Moving to next module:', { nextModule, nextLesson })

        // Verificar se há mais módulos
        if (nextModule > studyPlan.modules.length) {
          // Curso completo
          console.log('🎊 [NEXT-LESSON] Course completed!')
          const updatedProgress = {
            ...currentProgress,
            courseCompleted: true,
            completionDate: new Date().toISOString(),
            lastActivity: new Date().toISOString()
          }

          await prisma.learningProfile.update({
            where: { id: profile.id },
            data: { currentProgress: updatedProgress }
          })

          return false // Indica que o curso foi concluído
        }
      } else {
        console.log('➡️ [NEXT-LESSON] Staying in current module:', { nextModule, nextLesson })
      }

      // Atualizar para a próxima lição
      const updatedProgress = {
        ...currentProgress,
        currentModule: nextModule,
        currentLesson: nextLesson,
        lessonCompleted: false,
        lastActivity: new Date().toISOString()
      }

      await prisma.learningProfile.update({
        where: { id: profile.id },
        data: { currentProgress: updatedProgress }
      })

      return true
    } catch (error) {
      console.error('Error moving to next lesson:', error)
      return false
    }
  }

  async updateUserUnderstanding(userId: string, understanding: 'poor' | 'fair' | 'good' | 'excellent'): Promise<void> {
    try {
      const profile = await prisma.learningProfile.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      if (!profile) return

      const currentProgress = profile.currentProgress as any || {}
      const updatedProgress = {
        ...currentProgress,
        userUnderstanding: understanding,
        lastActivity: new Date().toISOString()
      }

      await prisma.learningProfile.update({
        where: { id: profile.id },
        data: { currentProgress: updatedProgress }
      })
    } catch (error) {
      console.error('Error updating user understanding:', error)
    }
  }

  async resetToCurrentLesson(userId: string): Promise<void> {
    try {
      const profile = await prisma.learningProfile.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      if (!profile) return

      const currentProgress = profile.currentProgress as any || {}
      const updatedProgress = {
        ...currentProgress,
        lessonCompleted: false,
        lastActivity: new Date().toISOString()
      }

      await prisma.learningProfile.update({
        where: { id: profile.id },
        data: { currentProgress: updatedProgress }
      })
    } catch (error) {
      console.error('Error resetting lesson:', error)
    }
  }
}

export const lessonProgressManager = new LessonProgressManager()

/**
 * Busca contexto completo e atualizado do usuário diretamente do banco
 */
export async function getUserCurrentContext(userId: string): Promise<{
  profile: any
  progress: LessonProgress
  context: LessonContext
  studyPlan: any
} | null> {
  try {
    // Buscar perfil atualizado do banco
    const profile = await prisma.learningProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    if (!profile || !profile.studyPlan) {
      console.log('❌ Profile or study plan not found for user:', userId)
      return null
    }

    const studyPlan = profile.studyPlan as any
    const currentProgressData = profile.currentProgress as any || {}
    
    const currentModule = currentProgressData.currentModule || 1
    const currentLesson = currentProgressData.currentLesson || 1
    const completedLessons = currentProgressData.completedLessons as any[] || []

    console.log('🔍 [CONTEXT] Current state from DB:', {
      currentModule,
      currentLesson,
      completedLessonsCount: completedLessons.length,
      studyPlanModules: studyPlan.modules?.length || 0
    })

    // Calcular progresso correto
    const progressData = calculateCorrectProgress(
      studyPlan,
      currentModule,
      currentLesson,
      completedLessons
    )

    // Buscar informações da lição atual
    const currentModuleData = studyPlan.modules?.[currentModule - 1]
    const currentLessonData = currentModuleData?.lessons?.[currentLesson - 1]

    if (!currentModuleData || !currentLessonData) {
      console.log('❌ Current lesson data not found:', {
        moduleIndex: currentModule - 1,
        lessonIndex: currentLesson - 1,
        availableModules: studyPlan.modules?.length || 0
      })
      return null
    }

    // Montar contexto da lição
    const lessonContext: LessonContext = {
      moduleName: currentModuleData.name || `Módulo ${currentModule}`,
      lessonName: currentLessonData.name || `Lição ${currentLesson}`,
      lessonContent: currentLessonData.content || '',
      exercise: {
        description: currentLessonData.exercise?.description || 'Exercício prático',
        codeTemplate: currentLessonData.exercise?.codeTemplate || '# Escreva seu código aqui\nprint("Hello, World!")',
        expectedOutput: currentLessonData.exercise?.expectedOutput,
        hints: currentLessonData.exercise?.hints || []
      },
      objectives: currentLessonData.objectives || [],
      difficulty: currentLessonData.difficulty || 'beginner',
      previousLessons: getPreviousLessons(studyPlan, currentModule, currentLesson),
      nextLessons: getNextLessons(studyPlan, currentModule, currentLesson)
    }

    // Montar progresso completo
    const progress: LessonProgress = {
      currentModule,
      currentLesson,
      completedLessons,
      totalCompletedLessons: progressData.totalCompletedLessons,
      totalLessons: progressData.totalLessons,
      progressPercentage: progressData.progressPercentage,
      xpEarned: currentProgressData.xpEarned || 0,
      moduleProgress: progressData.moduleProgress,
      lessonCompleted: false,
      userUnderstanding: 'fair',
      lastActivity: profile.updatedAt
    }

    console.log('✅ [CONTEXT] Complete context built:', {
      moduleName: lessonContext.moduleName,
      lessonName: lessonContext.lessonName,
      progress: `${progress.progressPercentage}% (${progress.totalCompletedLessons}/${progress.totalLessons})`,
      xp: progress.xpEarned
    })

    return {
      profile,
      progress,
      context: lessonContext,
      studyPlan
    }

  } catch (error) {
    console.error('❌ Error getting user context:', error)
    return null
  }
}

/**
 * Atualiza o progresso no banco e retorna contexto atualizado
 */
export async function updateUserProgress(
  userId: string,
  updates: {
    currentModule?: number
    currentLesson?: number
    completedLessons?: Array<{module: number, lesson: number, completedAt: string}>
    xpEarned?: number
  }
): Promise<any> {
  try {
    // Primeiro, buscar o perfil atual para preservar outros dados do currentProgress
    const existingProfile = await prisma.learningProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    if (!existingProfile) {
      throw new Error('Learning profile not found')
    }

    const currentProgressData = existingProfile.currentProgress as any || {}

    // Atualizar apenas os campos fornecidos, preservando o resto
    const updatedCurrentProgress = {
      ...currentProgressData,
      ...(updates.currentModule !== undefined && { currentModule: updates.currentModule }),
      ...(updates.currentLesson !== undefined && { currentLesson: updates.currentLesson }),
      ...(updates.completedLessons !== undefined && { completedLessons: updates.completedLessons }),
      ...(updates.xpEarned !== undefined && { xpEarned: updates.xpEarned }),
      lastUpdated: new Date().toISOString()
    }

    const updated = await prisma.learningProfile.update({
      where: { id: existingProfile.id },
      data: {
        currentProgress: updatedCurrentProgress,
        updatedAt: new Date()
      }
    })

    console.log('✅ [PROGRESS] User progress updated:', updates)
    return updated
  } catch (error) {
    console.error('❌ Error updating progress:', error)
    throw error
  }
}

function getPreviousLessons(studyPlan: any, currentModule: number, currentLesson: number): string[] {
  const lessons: string[] = []
  
  // Adicionar lições dos módulos anteriores
  for (let m = 1; m < currentModule; m++) {
    const module = studyPlan.modules?.[m - 1]
    if (module?.lessons) {
      module.lessons.forEach((lesson: any) => {
        lessons.push(`${module.name} - ${lesson.name}`)
      })
    }
  }
  
  // Adicionar lições anteriores do módulo atual
  const currentModuleData = studyPlan.modules?.[currentModule - 1]
  if (currentModuleData?.lessons) {
    for (let l = 1; l < currentLesson; l++) {
      const lesson = currentModuleData.lessons[l - 1]
      if (lesson) {
        lessons.push(`${currentModuleData.name} - ${lesson.name}`)
      }
    }
  }
  
  return lessons
}

function getNextLessons(studyPlan: any, currentModule: number, currentLesson: number): string[] {
  const lessons: string[] = []
  
  // Adicionar próximas lições do módulo atual
  const currentModuleData = studyPlan.modules?.[currentModule - 1]
  if (currentModuleData?.lessons) {
    for (let l = currentLesson + 1; l <= currentModuleData.lessons.length; l++) {
      const lesson = currentModuleData.lessons[l - 1]
      if (lesson) {
        lessons.push(`${currentModuleData.name} - ${lesson.name}`)
      }
    }
  }
  
  // Adicionar lições dos próximos módulos (limitado a 3)
  for (let m = currentModule + 1; m <= Math.min(currentModule + 2, studyPlan.modules?.length || 0); m++) {
    const module = studyPlan.modules?.[m - 1]
    if (module?.lessons) {
      module.lessons.forEach((lesson: any) => {
        if (lessons.length < 3) {
          lessons.push(`${module.name} - ${lesson.name}`)
        }
      })
    }
  }
  
  return lessons
}
