import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token not provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const userId = decoded.userId

    console.log('🔧 [DEBUG-RESET] Reset progress request for user:', userId)

    const body = await request.json()
    const { module = 1, lesson = 1, clearCompleted = false } = body

    // Buscar perfil do usuário
    const profile = await prisma.learningProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const currentProgress = profile.currentProgress as any || {}
    
    console.log('🔍 [DEBUG-RESET] Current progress before reset:', {
      currentModule: currentProgress.currentModule,
      currentLesson: currentProgress.currentLesson,
      completedLessons: currentProgress.completedLessons?.length || 0,
      xpEarned: currentProgress.xpEarned || 0
    })

    // Criar novo progresso resetado
    const resetProgress = {
      ...currentProgress,
      currentModule: module,
      currentLesson: lesson,
      ...(clearCompleted && { 
        completedLessons: [],
        xpEarned: 0
      }),
      lessonCompleted: false,
      lastUpdated: new Date().toISOString()
    }

    // Atualizar no banco
    await prisma.learningProfile.update({
      where: { id: profile.id },
      data: {
        currentProgress: resetProgress,
        updatedAt: new Date()
      }
    })

    console.log('✅ [DEBUG-RESET] Progress reset to:', {
      module,
      lesson,
      clearedCompleted: clearCompleted
    })

    return NextResponse.json({
      success: true,
      message: `Progress reset to Module ${module}, Lesson ${lesson}`,
      newProgress: {
        currentModule: module,
        currentLesson: lesson,
        completedLessons: clearCompleted ? [] : currentProgress.completedLessons,
        xpEarned: clearCompleted ? 0 : currentProgress.xpEarned
      }
    })

  } catch (error) {
    console.error('❌ [DEBUG-RESET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
