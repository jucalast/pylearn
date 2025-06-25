import { prisma } from './db'

export interface LessonProgress {
  currentModule: number
  currentLesson: number
  completedLessons: number
  totalLessons: number
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

      const progress: LessonProgress = {
        currentModule: currentProgress.currentModule || 1,
        currentLesson: currentProgress.currentLesson || 1,
        completedLessons: currentProgress.completedLessons || 0,
        totalLessons: studyPlan.modules?.reduce((total: number, module: any) => 
          total + (module.lessons?.length || 0), 0) || 0,
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
        difficulty: profile.knowledgeLevel as any || 'beginner'
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
      if (!currentModuleData || nextLesson > (currentModuleData.lessons?.length || 0)) {
        // Mover para o próximo módulo
        nextModule += 1
        nextLesson = 1

        // Verificar se há mais módulos
        if (nextModule > studyPlan.modules.length) {
          // Curso completo
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
