'use client'

import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Editor from '@monaco-editor/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { calculateCorrectProgress } from '@/lib/lesson-progress'
import { 
  MessageCircle, 
  Code, 
  Play, 
  Send, 
  User, 
  Bot, 
  Menu, 
  X, 
  Book, 
  Target, 
  Award,
  Loader2,
  Settings,
  LogOut,
  CheckCircle,
  Circle,
  ChevronRight,
  Zap,
  TrendingUp,
  Star,
  Calendar,
  Timer,
  Trophy
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Exercise {
  id: string
  title: string
  description: string
  codeTemplate: string
  language: string
  level: string
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [studyPlan, setStudyPlan] = useState<any>(null)
  const [lessonContext, setLessonContext] = useState<any>(null) // Estado unificado para contexto da lição
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set()) // Estado para módulos expandidos
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [code, setCode] = useState('# Escreva seu código aqui\\nprint("Olá, mundo!")')
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null)
  const [currentLesson, setCurrentLesson] = useState<any>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'exercise' | 'plan' | 'stats'>('chat')
  const [chatWidth, setChatWidth] = useState(288) // 72 * 4 = 288px (w-72)
  const [isResizing, setIsResizing] = useState(false)
  
  // Gamification States
  const [userStats, setUserStats] = useState<any>(null)
  const [achievements, setAchievements] = useState<any[]>([])
  const [recentAchievements, setRecentAchievements] = useState<any[]>([])
  const [studySessions, setStudySessions] = useState<any[]>([])
  const [weeklyXP, setWeeklyXP] = useState<number[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Função para gerar IDs únicos para mensagens
  const generateUniqueId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/auth/login')
      return
    }

    setUser(JSON.parse(userData))
    
    // Buscar contexto atualizado da API ao invés de usar localStorage
    fetchUpdatedProfile()
  }, [router])

  const fetchUpdatedProfile = async () => {
    const token = localStorage.getItem('token')
    
    try {
      const response = await fetch('/api/learning-profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📊 [DASHBOARD] Learning profile response:', data)
        
        if (data.currentContext) {
          // Usar contexto atualizado da API
          const { profile, progress, context, studyPlan } = data.currentContext
          console.log('✅ [DASHBOARD] Using currentContext:', { 
            hasProfile: !!profile, 
            hasStudyPlan: !!studyPlan, 
            modulesCount: studyPlan?.modules?.length 
          })
          setCurrentProfile(profile)
          setStudyPlan(studyPlan)
          setLessonContext({
            ...context,
            progressPercentage: progress.progressPercentage,
            totalLessons: progress.totalLessons,
            completedLessons: progress.totalCompletedLessons,
            xpEarned: progress.xpEarned
          })
        } else if (data.profiles?.length > 0) {
          // Fallback para formato antigo
          const profile = data.profiles[0]
          console.log('📦 [DASHBOARD] Using profiles fallback:', { 
            hasProfile: !!profile, 
            hasStudyPlan: !!profile.studyPlan, 
            modulesCount: profile.studyPlan?.modules?.length 
          })
          setCurrentProfile(profile)
          setStudyPlan(profile.studyPlan)
          setLessonContext(profile.currentProgress)
        } else {
          console.log('❌ [DASHBOARD] No profiles or currentContext found')
        }
      } else {
        console.error('❌ [DASHBOARD] API response not ok:', response.status)
      }
    } catch (error) {
      console.error('❌ [DASHBOARD] Error fetching updated profile:', error)
    }
    
    // Fetch gamification data after loading profile
    await fetchGamificationData()
    
    // Start a study session when dashboard loads
    await startStudySession()
    
    // Inicializar lição após carregar dados
    initializeWithCurrentLesson()
  }

  // Fetch all gamification data
  const fetchGamificationData = async () => {
    const token = localStorage.getItem('token')
    
    try {
      // Fetch user stats
      const statsResponse = await fetch('/api/user-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setUserStats(statsData)
        
        // Extract data for components
        setWeeklyXP(statsData.weeklyXP || Array(7).fill(0))
        setRecentAchievements(statsData.achievements?.slice(0, 3) || [])
        setStudySessions(statsData.recentSessions || [])
      }
    } catch (error) {
      console.error('❌ [GAMIFICATION] Failed to fetch data:', error)
    }
  }

  // Start a new study session
  const startStudySession = async () => {
    const token = localStorage.getItem('token')
    
    try {
      const response = await fetch('/api/study-sessions/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          language: currentProfile?.language || 'Python'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentSessionId(data.sessionId)
        setSessionStartTime(new Date(data.startTime))
        console.log('🎯 [SESSION] Started new study session:', data.sessionId)
      }
    } catch (error) {
      console.error('❌ [SESSION] Failed to start session:', error)
    }
  }

  // Update active study session
  const updateStudySession = async (xpEarned = 0, lessonsCompleted = 0) => {
    if (!currentSessionId) return

    const token = localStorage.getItem('token')
    
    try {
      await fetch('/api/study-sessions/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          xpEarned,
          lessonsCompleted
        })
      })
    } catch (error) {
      console.error('❌ [SESSION] Failed to update session:', error)
    }
  }

  // End current study session
  const endStudySession = async () => {
    if (!currentSessionId) return

    const token = localStorage.getItem('token')
    
    try {
      const response = await fetch('/api/study-sessions/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: currentSessionId
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('🏁 [SESSION] Ended study session:', {
          duration: Math.round(data.session.duration / 60) + ' minutes',
          xpEarned: data.session.xpEarned
        })
        setCurrentSessionId(null)
        setSessionStartTime(null)
        
        // Refresh gamification data
        await fetchGamificationData()
      }
    } catch (error) {
      console.error('❌ [SESSION] Failed to end session:', error)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // Handlers para redimensionamento
  const startResize = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsResizing(true)
    e.preventDefault()
  }, [])
  
  const stopResize = useCallback(() => {
    setIsResizing(false)
  }, [])
  
  const resize = useCallback((e: MouseEvent | TouchEvent) => {
    if (isResizing) {
      // Limitar a largura mínima e máxima
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const newWidth = Math.max(200, Math.min(600, clientX))
      setChatWidth(newWidth)
    }
  }, [isResizing])
  
  // Função para resetar o tamanho do chat para o padrão
  const resetChatWidth = useCallback(() => {
    setChatWidth(288) // 288px é o tamanho padrão (w-72)
  }, [])
  
  // Adicionar e remover event listeners para arrastar
  useEffect(() => {
    if (isResizing) {
      // Mouse events
      window.addEventListener('mousemove', resize)
      window.addEventListener('mouseup', stopResize)
      
      // Touch events
      window.addEventListener('touchmove', resize)
      window.addEventListener('touchend', stopResize)
      window.addEventListener('touchcancel', stopResize)
    }
    
    return () => {
      // Mouse events
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResize)
      
      // Touch events
      window.removeEventListener('touchmove', resize)
      window.removeEventListener('touchend', stopResize)
      window.removeEventListener('touchcancel', stopResize)
    }
  }, [isResizing, resize, stopResize])

  // Cleanup session when leaving dashboard
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentSessionId) {
        // Use sendBeacon for more reliable cleanup on page unload
        const token = localStorage.getItem('token')
        navigator.sendBeacon('/api/study-sessions/end', JSON.stringify({
          sessionId: currentSessionId
        }))
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // End session when component unmounts
      if (currentSessionId) {
        endStudySession()
      }
    }
  }, [currentSessionId])

  // Calcular progresso correto baseado no studyPlan atual
  const correctProgress = useMemo(() => {
    if (!currentProfile?.studyPlan) return null
    
    // Use lessonContext as primary source (more reliable), fallback to currentProfile
    const currentModule = lessonContext?.currentModule || currentProfile.currentProgress?.currentModule || 1
    const currentLesson = lessonContext?.currentLesson || currentProfile.currentProgress?.currentLesson || 1
    const completedLessons = currentProfile.currentProgress?.completedLessons || []
    
    return calculateCorrectProgress(
      currentProfile.studyPlan,
      currentModule,
      currentLesson,
      completedLessons
    )
  }, [currentProfile, lessonContext])

  const initializeWithCurrentLesson = async () => {
    const token = localStorage.getItem('token')
    
    try {
      // Primeiro, buscar o contexto mais recente do backend
      const profileResponse = await fetch('/api/learning-profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setLessonContext(profileData.context)
        
        // Atualizar perfil local
        setCurrentProfile((prev: any) => prev ? {
          ...prev,
          currentProgress: profileData.context
        } : null)
      }

      // Usar nova API de ensino proativo
      const response = await fetch('/api/proactive-teaching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'start_lesson',
          userCode: code
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.success && result.type === 'lesson_start') {
          const data = result.data
          
          // Armazenar contexto da lição
          setLessonContext(data.lessonContext)
          
          // Atualizar editor com código do exercício
          if (data.codeToSet) {
            setCode(data.codeToSet)
          }

          // Mensagem proativa da IA
          const proactiveMessage: Message = {
            id: generateUniqueId(),
            role: 'assistant',
            content: data.chatMessage,
            timestamp: new Date()
          }
          
          setMessages([proactiveMessage])
          
          // Iniciar monitoramento do código
          startCodeMonitoring()
        }
      } else {
        const errorData = await response.json()
        console.error('Proactive teaching error:', errorData)
        
        // Handle authentication and profile errors
        if (errorData.type === 'user_not_found' || response.status === 401) {
          const errorMessage: Message = {
            id: generateUniqueId(),
            role: 'assistant',
            content: `🔐 **Token Inválido:** Sua sessão expirou ou é inválida.\n\n🔄 **Solução:** Faça login novamente para continuar.`,
            timestamp: new Date()
          }
          setMessages([errorMessage])
          
          // Clear invalid token and redirect to login
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          
          setTimeout(() => {
            router.push('/auth/login')
          }, 3000)
          
        } else if (errorData.type === 'profile_not_found') {
          const errorMessage: Message = {
            id: generateUniqueId(),
            role: 'assistant',
            content: `❌ **Configuração Necessária:** Seu perfil de aprendizado não foi encontrado ou está inválido.\n\n🔧 **Solução:** Vou te redirecionar para completar sua configuração inicial.`,
            timestamp: new Date()
          }
          setMessages([errorMessage])
          
          // Redirecionar para onboarding após 3 segundos
          setTimeout(() => {
            router.push('/onboarding')
          }, 3000)
          
        } else if (errorData.error && (
          errorData.error.includes('Plano de estudos inválido') || 
          errorData.error.includes('Learning profile not found') ||
          errorData.error.includes('Perfil de aprendizado não encontrado')
        )) {
          const errorMessage: Message = {
            id: generateUniqueId(),
            role: 'assistant',
            content: `❌ **Configuração Necessária:** Seu perfil de aprendizado não foi encontrado ou está inválido.\n\n🔧 **Solução:** Vou te redirecionar para completar sua configuração inicial.`,
            timestamp: new Date()
          }
          setMessages([errorMessage])
          
          // Redirecionar para onboarding após 3 segundos
          setTimeout(() => {
            router.push('/onboarding')
          }, 3000)
        } else {
          // Handle specific error types from backend
          let errorMessage = '❌ **Erro Desconhecido**'
          
          switch (errorData.type) {
            case 'invalid_api_key':
              errorMessage = '🔧 **Configuração do Sistema**\n\nO serviço de IA não está configurado corretamente.\n\n📞 **Solução:** Entre em contato com o administrador do sistema.'
              break
            case 'quota_exceeded':
              errorMessage = '⏰ **Limite de Uso Atingido**\n\nO limite diário do serviço de IA foi atingido.\n\n🕐 **Solução:** Tente novamente mais tarde ou entre em contato com o suporte.'
              break
            case 'service_unavailable':
              errorMessage = '🌐 **Serviço Temporariamente Indisponível**\n\nO serviço de IA está temporariamente indisponível.\n\n🔄 **Solução:** Aguarde alguns minutos e recarregue a página.'
              break
            case 'api_error':
              errorMessage = '🤖 **Erro do Serviço de IA**\n\nOcorreu um erro no processamento pela IA.\n\n🔄 **Solução:** Tente novamente ou entre em contato com o suporte.'
              break
            default:
              errorMessage = `❌ **Erro:** ${errorData.error || 'Erro desconhecido'}\n\n🔄 **Solução:** Recarregue a página ou tente novamente.`
          }
          
          const message: Message = {
            id: generateUniqueId(),
            role: 'assistant',
            content: errorMessage,
            timestamp: new Date()
          }
          setMessages([message])
        }
      }
    } catch (error) {
      console.error('Error starting proactive lesson:', error)
      
      // Mostrar erro de rede ao usuário
      const errorMessage: Message = {
        id: generateUniqueId(),
        role: 'assistant',
        content: '🌐 **Erro de Conexão**\n\nNão foi possível inicializar sua lição.\n\n🔧 **Possíveis causas:**\n• Conexão com a internet instável\n• Servidor temporariamente indisponível\n• API do Google Gemini sobrecarregada\n\n🔄 **Solução:** Aguarde alguns segundos e recarregue a página.',
        timestamp: new Date()
      }
      setMessages([errorMessage])
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || loading) return

    const userMessage: Message = {
      id: generateUniqueId(),
      role: 'user',
      content: newMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setNewMessage('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const requestBody = {
        message: newMessage,
        sessionId,
        language: currentProfile?.language || 'Python',
        level: currentProfile?.knowledgeLevel || 'beginner',
        codeContext: code
      }
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (response.ok) {
        const aiMessage: Message = {
          id: data.messageId || Date.now().toString(),
          role: 'assistant',
          content: data.message || 'Resposta não recebida',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
        setSessionId(data.sessionId)
      } else {
        console.error('API Error:', data)
        
        // Tratar diferentes tipos de erro
        let errorContent = ''
        if (data.type === 'invalid_api_key') {
          errorContent = `🔧 **Configuração do Sistema**\n\n${data.error}\n\n📞 **Solução:** Entre em contato com o administrador do sistema.`
        } else if (data.type === 'service_unavailable') {
          errorContent = `⚠️ **Serviço Temporariamente Indisponível**\n\n${data.error}\n\n💡 **Dica:** A API do Google Gemini está sobrecarregada. Aguarde alguns minutos e tente novamente.`
        } else if (data.type === 'quota_exceeded') {
          errorContent = `📊 **Limite de Uso Atingido**\n\n${data.error}\n\n⏰ **Solução:** Aguarde um momento antes de fazer nova pergunta.`
        } else if (data.type === 'safety_filter') {
          errorContent = `🛡️ **Filtro de Segurança**\n\n${data.error}\n\n✏️ **Dica:** Reformule sua pergunta de forma mais clara e educativa.`
        } else if (data.type === 'api_error') {
          errorContent = `🤖 **Erro do Serviço de IA**\n\n${data.error}\n\n🔄 **Solução:** Tente novamente ou entre em contato com o suporte.`
        } else {
          errorContent = `❌ **Erro:** ${data.error || 'Erro desconhecido'}\n\n🔄 **Sugestão:** Tente novamente ou reformule sua pergunta.`
        }
        
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: errorContent,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '🌐 **Erro de Conexão**\n\nNão foi possível conectar com o servidor.\n\n🔧 **Verifique:**\n• Sua conexão com a internet\n• Se o servidor está funcionando\n\n🔄 Tente novamente em alguns segundos.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const runCode = async () => {
    if (!code.trim()) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/code-submission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code,
          language: currentProfile?.language || 'Python',
          exerciseId: currentExercise?.id
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        const resultMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `🔧 **Resultado da Execução:**\n\n\`\`\`\n${data.output}\n\`\`\`\n\n${data.feedback}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, resultMessage])
      }
    } catch (error) {
      console.error('Error running code:', error)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('currentProfile')
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    router.push('/')
  }

  // Componente otimizado para renderizar mensagens
  const MessageComponent = memo(({ message }: { message: Message }) => {
    const formattedContent = useMemo(() => {
      if (!message.content) return null
      
      if (typeof message.content !== 'string') {
        console.error('Message content is not a string:', message.content)
        return <span className="text-rose-500">Formato de mensagem inválido</span>
      }
      
      try {
        const content = message.content
          .replace(/\\n/g, '\n')
          .replace(/\\\\/g, '\\')
          .replace(/\\"/g, '"')
          .trim()
        
        // Para mensagens da IA, renderizar como Markdown
        if (message.role === 'assistant') {
          return (
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Parágrafos com espaçamento elegante
                  p: ({children}) => (
                    <p className="mb-4 last:mb-0 leading-relaxed text-neutral-100 text-sm">
                      {children}
                    </p>
                  ),
                  
                  // Texto em destaque
                  strong: ({children}) => (
                    <strong className="font-semibold text-white bg-gradient-to-r from-white to-neutral-200 bg-clip-text">
                      {children}
                    </strong>
                  ),
                  
                  // Texto em itálico
                  em: ({children}) => (
                    <em className="italic text-neutral-200 font-medium">
                      {children}
                    </em>
                  ),
                  
                  // Listas não ordenadas
                  ul: ({children}) => (
                    <ul className="mb-4 space-y-2 text-neutral-100">
                      {children}
                    </ul>
                  ),
                  
                  // Listas ordenadas
                  ol: ({children}) => (
                    <ol className="mb-4 space-y-2 text-neutral-100 list-decimal list-inside">
                      {children}
                    </ol>
                  ),
                  
                  // Itens de lista com ícones customizados
                  li: ({children}) => (
                    <li className="flex items-start group">
                      <span className="text-brand-primary mr-3 font-bold text-base group-hover:scale-110 transition-transform">
                        ✨
                      </span>
                      <span className="flex-1 text-sm leading-relaxed">
                        {children}
                      </span>
                    </li>
                  ),
                  
                  // Títulos principais
                  h1: ({children}) => (
                    <h1 className="text-xl font-bold text-white mb-4 pb-2 border-b-2 border-gradient-to-r from-brand-primary to-transparent bg-gradient-to-r from-white to-neutral-300 bg-clip-text">
                      {children}
                    </h1>
                  ),
                  
                  // Subtítulos
                  h2: ({children}) => (
                    <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <span className="w-2 h-2 bg-brand-primary rounded-full mr-3"></span>
                      {children}
                    </h2>
                  ),
                  
                  // Títulos menores
                  h3: ({children}) => (
                    <h3 className="text-base font-medium text-white mb-2 flex items-center">
                      <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full mr-2"></span>
                      {children}
                    </h3>
                  ),
                  
                  // Código inline e blocos
                  code: ({node, className, children, ...props}) => {
                    const isInline = !className
                    
                    if (isInline) {
                      return (
                        <code 
                          className="px-2 py-1 bg-gradient-to-r from-neutral-800 to-neutral-900 text-brand-primary rounded-md text-sm font-mono border border-neutral-700 shadow-inner"
                          {...props}
                        >
                          {children}
                        </code>
                      )
                    } else {
                      return (
                        <code 
                          className="block p-4 bg-gradient-to-br from-black to-neutral-950 rounded-xl text-green-400 font-mono text-sm border border-neutral-800 overflow-x-auto shadow-lg relative"
                          {...props}
                        >
                          <div className="absolute top-2 right-2 flex space-x-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          </div>
                          <div className="pt-4">
                            {children}
                          </div>
                        </code>
                      )
                    }
                  },
                  
                  // Blocos de código com container
                  pre: ({children}) => (
                    <div className="mb-4 rounded-xl overflow-hidden border border-neutral-800 shadow-xl">
                      <div className="bg-neutral-900 px-4 py-2 text-xs text-neutral-400 font-mono border-b border-neutral-800 flex items-center justify-between">
                        <span>Python</span>
                        <span className="text-green-400">⚡ Executável</span>
                      </div>
                      <pre className="p-0 m-0 bg-transparent overflow-x-auto">
                        {children}
                      </pre>
                    </div>
                  ),
                  
                  // Citações destacadas
                  blockquote: ({children}) => (
                    <blockquote className="border-l-4 border-gradient-to-b from-brand-primary to-blue-500 pl-4 py-2 my-4 bg-gradient-to-r from-brand-primary/5 to-transparent rounded-r-lg">
                      <div className="text-neutral-300 italic text-sm flex items-start">
                        <span className="text-brand-primary mr-2 text-lg">💡</span>
                        <div>{children}</div>
                      </div>
                    </blockquote>
                  ),
                  
                  // Links interativos
                  a: ({href, children}) => (
                    <a 
                      href={href} 
                      className="text-brand-primary hover:text-white underline decoration-brand-primary decoration-2 underline-offset-2 hover:decoration-white transition-all duration-200 hover:bg-brand-primary/10 px-1 py-0.5 rounded"
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {children}
                      <span className="ml-1 text-xs">↗</span>
                    </a>
                  ),
                  
                  // Divisores horizontais
                  hr: () => (
                    <hr className="my-6 border-0 h-px bg-gradient-to-r from-transparent via-neutral-600 to-transparent" />
                  ),
                  
                  // Tabelas (se necessário)
                  table: ({children}) => (
                    <div className="overflow-x-auto mb-4 rounded-lg border border-neutral-800">
                      <table className="w-full text-sm">
                        {children}
                      </table>
                    </div>
                  ),
                  
                  thead: ({children}) => (
                    <thead className="bg-neutral-900 text-neutral-300">
                      {children}
                    </thead>
                  ),
                  
                  tbody: ({children}) => (
                    <tbody className="bg-black/40 text-neutral-100">
                      {children}
                    </tbody>
                  ),
                  
                  tr: ({children}) => (
                    <tr className="border-b border-neutral-800 hover:bg-neutral-900/30 transition-colors">
                      {children}
                    </tr>
                  ),
                  
                  td: ({children}) => (
                    <td className="px-4 py-2 text-sm">
                      {children}
                    </td>
                  ),
                  
                  th: ({children}) => (
                    <th className="px-4 py-3 text-left font-medium">
                      {children}
                    </th>
                  )
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )
        } else {
          // Para mensagens do usuário, renderizar como texto simples
          return content.split('\n').map((line, index) => (
            <span key={index}>
              {line}
              {index < content.split('\n').length - 1 && <br />}
            </span>
          ))
        }
      } catch (error) {
        console.error('Error formatting message:', error)
        return <span className="text-rose-500">Erro ao formatar mensagem</span>
      }
    }, [message.content, message.role])

    return (
      <div
        className={`flex items-start space-x-3 ${
          message.role === 'user' ? 'justify-end' : 'justify-start'
        } group`}
      >
        {message.role === 'assistant' && (
          <div className="w-8 h-8 bg-brand-primary/15 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-brand-primary/10 transition-all duration-300 group-hover:scale-105">
            <Bot className="w-4 h-4 text-brand-primary" />
          </div>
        )}
        
        <div
          className={`max-w-[85%] p-4 ${
            message.role === 'user'
              ? 'bg-brand-primary text-white ml-auto rounded-2xl rounded-tr-sm shadow-lg shadow-brand-primary/10'
              : 'bg-neutral-900 text-white rounded-2xl rounded-tl-sm border border-neutral-800 shadow-lg'
          } transition-all duration-300 hover:shadow-xl`}
        >
          <div className="text-sm">
            {formattedContent}
          </div>
          <div className="mt-2 pt-2 border-t border-neutral-800/30 text-xs text-neutral-500 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span>{new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            {message.role === 'assistant' && <span className="flex items-center"><Code className="w-3 h-3 mr-1" /> PyLearn AI</span>}
          </div>
        </div>

        {message.role === 'user' && (
          <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-neutral-700 transition-all duration-300 group-hover:scale-105">
            <User className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    )
  })

  const handleEvaluateUnderstanding = async () => {
    if (loading) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/evaluate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code,
          lessonId: currentProfile?.currentProgress?.currentLessonId || 
                   (currentProfile?.studyPlan?.lessons?.[0]?.id) || 
                   'lesson-1',
          chatHistory: messages.slice(-10) // Últimas 10 mensagens para contexto
        })
      })

      if (!response.ok) {
        const result = await response.json()
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `❌ **Erro:** ${result.error}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
        return
      }

      const result = await response.json()
      
      if (result.success) {
        // Adicionar resposta conversacional da IA
        const aiResponse: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: result.data.message,
          timestamp: new Date()
        }
        
        setMessages(prev => [...prev, aiResponse])
      }
    } catch (error) {
      console.error('Error evaluating understanding:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '❌ **Erro:** Não foi possível avaliar sua compreensão no momento. Tente novamente.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleRequestNewExercise = async () => {
    if (loading) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/proactive-teaching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'get_next_exercise'
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.success && result.type === 'next_exercise') {
          const exerciseMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `🎯 **Novo exercício para você!**\n\n${result.data.exercise}\n\n💡 **Dica:** Experimente no editor ao lado. Vou monitorar seu progresso e dar feedback em time real!`,
            timestamp: new Date()
          }
          
          setMessages(prev => [...prev, exerciseMessage])
          
          // Reiniciar monitoramento
          setPreviousCode(code)
          setCodeMonitoringEnabled(true)
        }
      }
    } catch (error) {
      console.error('Error requesting new exercise:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Não consegui gerar um novo exercício no momento. Que tal continuar praticando com o código atual?',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleMarkCompleted = async () => {
    if (!currentProfile || loading) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      // Avaliar compreensão do usuário baseado nas mensagens recentes
      const userMessages = messages.filter(m => m.role === 'user').slice(-3)
      const userResponse = userMessages.map(m => m.content).join(' ')
      
      let understanding: 'poor' | 'fair' | 'good' | 'excellent' = 'fair'
      
      if (userResponse.length > 200) understanding = 'good'
      if (userResponse.length > 400) understanding = 'excellent'
      if (userResponse.length < 50) understanding = 'poor'

      // Obter posição atual da lição baseada no contexto correto
      const progress = currentProfile.currentProgress
      
      // Prioridade: lessonContext (mais confiável) > currentProgress > valores padrão
      let currentModule = lessonContext?.currentModule || progress?.currentModule || 1
      let currentLesson = lessonContext?.currentLesson || progress?.currentLesson || 1
      
      // Verificação adicional: se não há contexto de lição, buscar do progress atualizado
      if (!lessonContext && progress) {
        currentModule = progress.currentModule || 1
        currentLesson = progress.currentLesson || 1
      }
      
      console.log('🎯 [MARK-COMPLETED] Attempting to complete lesson:', {
        module: currentModule,
        lesson: currentLesson,
        understanding,
        lessonContext: lessonContext ? {
          currentModule: lessonContext.currentModule,
          currentLesson: lessonContext.currentLesson,
          lessonName: lessonContext.lessonName,
          moduleName: lessonContext.moduleName
        } : 'null',
        progressContext: progress ? {
          currentModule: progress.currentModule,
          currentLesson: progress.currentLesson
        } : 'null'
      })
      
      const response = await fetch('/api/learning-profile/mark-completed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          module: currentModule,
          lesson: currentLesson,
          understanding 
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Verificar se a lição já estava concluída
        if (result.alreadyCompleted) {
          const aiMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `ℹ️ **Esta lição já foi concluída!**\n\nParece que você já completou esta lição anteriormente. Não se preocupe, seu progresso já foi registrado!\n\n💡 **Dica:** Clique em "Próxima Lição" para continuar com o próximo conteúdo, ou use o chat para tirar dúvidas sobre o material atual.\n\n📚 Você pode revisar o conteúdo quantas vezes quiser para reforçar seu aprendizado!`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
          return
        }
        
        // Atualizar contexto local com os dados retornados
        if (result.context) {
          setLessonContext(result.context)
          
          // Atualizar perfil com progresso atualizado
          const updatedProfile = {
            ...currentProfile,
            currentProgress: result.context
          }
          setCurrentProfile(updatedProfile)
        }
        
        // Refresh gamification data after lesson completion
        await fetchGamificationData()
        
        // Update study session with lesson completion
        await updateStudySession(result.gamification?.xpEarned || 15, 1)
        
        // Check for new achievements
        if (result.gamification?.newAchievements && result.gamification.newAchievements.length > 0) {
          const achievementText = result.gamification.newAchievements
            .map((a: any) => `🏆 **${a.name}**: ${a.description}`)
            .join('\n\n')
          
          const aiMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `🎉 **Parabéns!** Você concluiu esta lição com sucesso!\n\n✅ **Compreensão avaliada:** ${understanding === 'excellent' ? 'Excelente' : understanding === 'good' ? 'Boa' : understanding === 'fair' ? 'Satisfatória' : 'Precisa melhorar'}\n\n🏆 **XP Ganho:** +${result.gamification?.xpEarned || 15} XP\n\n${result.gamification?.leveledUp ? `🎊 **LEVEL UP!** Você agora é nível ${result.gamification.level}!\n\n` : ''}🎊 **Novas Conquistas Desbloqueadas!**\n\n${achievementText}\n\n🚀 **Próximo passo:** Quando estiver pronto, clique em "Próxima Lição" para continuar sua jornada de aprendizado!`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
        } else {
          const aiMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `🎉 **Parabéns!** Você concluiu esta lição com sucesso!\n\n✅ **Compreensão avaliada:** ${understanding === 'excellent' ? 'Excelente' : understanding === 'good' ? 'Boa' : understanding === 'fair' ? 'Satisfatória' : 'Precisa melhorar'}\n\n🏆 **XP Ganho:** +${result.gamification?.xpEarned || 15} XP\n\n${result.gamification?.leveledUp ? `🎊 **LEVEL UP!** Você agora é nível ${result.gamification.level}!\n\n` : ''}🚀 **Próximo passo:** Quando estiver pronto, clique em "Próxima Lição" para continuar sua jornada de aprendizado!`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
        }
      } else {
        const errorData = await response.json()
        console.error('Error marking lesson completed:', errorData)
      }
    } catch (error) {
      console.error('Error marking lesson completed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNextLesson = async () => {
    if (!currentProfile || loading) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/learning-profile/next-lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.courseCompleted) {
          const aiMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `🎊 **PARABÉNS!** Você completou todo o curso!\n\n🏆 **Conquista desbloqueada:** Mestre em ${currentProfile.language}\n\n✨ **O que você aprendeu:**\n• Fundamentos sólidos de programação\n• Resolução de problemas práticos\n• Boas práticas de desenvolvimento\n\nContinue praticando e explorando novos desafios! 🚀`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
        } else {
          // Atualizar contexto local com os dados retornados
          if (data.context) {
            setLessonContext(data.context)
            
            // Atualizar perfil com progresso atualizado
            const updatedProfile = {
              ...currentProfile,
              currentProgress: data.context
            }
            setCurrentProfile(updatedProfile)
          }
          
          // Carregar nova lição
          await initializeWithCurrentLesson()
          
          const aiMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `🎯 **Nova lição carregada!**\n\nVamos continuar nossa jornada de aprendizado. Estou aqui para te ajudar com qualquer dúvida!\n\n💡 **Dica:** Leia atentamente o exercício e não hesite em perguntar se precisar de esclarecimentos.`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
        }
      } else {
        const errorData = await response.json()
        console.error('Error moving to next lesson:', errorData)
      }
    } catch (error) {
      console.error('Error moving to next lesson:', error)
    } finally {
      setLoading(false)
    }
  }

  // Função para alternar expansão de módulos
  const toggleModuleExpansion = useCallback((moduleIndex: number) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleIndex)) {
        newSet.delete(moduleIndex)
      } else {
        newSet.add(moduleIndex)
      }
      return newSet
    })
  }, [])

  // Sistema de monitoramento proativo do código
  const [previousCode, setPreviousCode] = useState<string>('')
  const [codeMonitoringEnabled, setCodeMonitoringEnabled] = useState(false)

  const startCodeMonitoring = useCallback(() => {
    setCodeMonitoringEnabled(true)
  }, [])

  const stopCodeMonitoring = useCallback(() => {
    setCodeMonitoringEnabled(false)
  }, [])

  // Monitorar mudanças no código em tempo real
  useEffect(() => {
    if (!codeMonitoringEnabled || !code || code === previousCode) {
      return
    }

    const monitorCode = async () => {
      const token = localStorage.getItem('token')
      
      try {
        const response = await fetch('/api/proactive-teaching', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'monitor_code',
            userCode: code,
            previousCode: previousCode
          })
        })

        if (response.ok) {
          const result = await response.json()
          
          if (result.success && result.type === 'code_monitoring') {
            const monitoring = result.data
            
            // Se há feedback importante, adicionar mensagem da IA
            if (monitoring.feedback && monitoring.progressAssessment !== 'improving') {
              const feedbackMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: `💡 **Feedback do seu código:**\n\n${monitoring.feedback}\n\n🎯 **Próximo passo:** ${monitoring.nextSuggestion}`,
                timestamp: new Date()
              }
              
              setMessages(prev => [...prev, feedbackMessage])
            }
          }
        }
      } catch (error) {
        console.error('Error monitoring code:', error)
      }
    }

    // Debounce para não fazer muitas chamadas
    const timeoutId = setTimeout(monitorCode, 2000)
    setPreviousCode(code)

    return () => clearTimeout(timeoutId)
  }, [code, previousCode, codeMonitoringEnabled])

  return (
    <div className="h-screen bg-black flex overflow-hidden pb-6 relative">
      {/* Sidebar - Chat Container */}
      <div 
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 bg-neutral-900 border-r border-neutral-800 flex flex-col transition-property-none shadow-xl shadow-black/30`}
        style={{ width: `${chatWidth}px` }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800/70 backdrop-blur-sm bg-black/30">
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-brand-primary bg-brand-primary/10 p-0.5 rounded" />
            <span className="text-lg font-semibold text-white tracking-tight">PyLearn</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={resetChatWidth}
              className="hidden lg:flex p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              title="Redefinir tamanho do painel"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 pt-4 pb-2 bg-neutral-900/50 backdrop-blur-sm">
          <div className="bg-neutral-800/40 rounded-xl p-1 flex gap-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 px-3 py-2.5 text-sm font-medium flex items-center justify-center space-x-2 transition-all duration-200 rounded-lg ${
                activeTab === 'chat' 
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
              }`}
            >
              <MessageCircle className={`w-4 h-4 ${activeTab === 'chat' ? 'text-white' : 'text-neutral-400'}`} />
              <span>Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('plan')}
              className={`flex-1 px-3 py-2.5 text-sm font-medium flex items-center justify-center space-x-2 transition-all duration-200 rounded-lg ${
                activeTab === 'plan' 
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
              }`}
            >
              <Target className={`w-4 h-4 ${activeTab === 'plan' ? 'text-white' : 'text-neutral-400'}`} />
              <span>Plano</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 px-3 py-2.5 text-sm font-medium flex items-center justify-center space-x-2 transition-all duration-200 rounded-lg ${
                activeTab === 'stats' 
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
              }`}
            >
              <TrendingUp className={`w-4 h-4 ${activeTab === 'stats' ? 'text-white' : 'text-neutral-400'}`} />
              <span>Stats</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'chat' && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {messages.map((message) => (
                  <MessageComponent key={message.id} message={message} />
                ))}
                
                {loading && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-brand-primary/15 rounded-full flex items-center justify-center ring-2 ring-brand-primary/10">
                      <Bot className="w-4 h-4 text-brand-primary" />
                    </div>
                    <div className="bg-neutral-900/70 backdrop-blur-sm p-4 rounded-xl shadow-lg animate-pulse border border-neutral-800">
                      <div className="flex space-x-3 items-center">
                        <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                        <p className="text-xs text-neutral-500">PyLearn está digitando...</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-neutral-800/50 bg-black/20">
                <div className="flex space-x-2 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Digite sua mensagem para o PyLearn..."
                    className="w-full px-4 py-3 rounded-xl bg-neutral-900 text-white border border-neutral-800 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:outline-none transition-all shadow-inner placeholder:text-neutral-500"
                    disabled={loading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !newMessage.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-primary text-white rounded-lg disabled:opacity-50 disabled:bg-neutral-700 disabled:cursor-not-allowed transition-all hover:bg-brand-primary-dark"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-neutral-500 mt-2 flex justify-center">
                  <span className="px-2 py-1 rounded-full bg-neutral-900/50">Tab ↹ para autocompletar | ⏎ Enter para enviar</span>
                </div>
              </div>

              <div className="py-3 px-4 border-t border-neutral-800/50 bg-gradient-to-b from-transparent to-black/20">
                <div className="grid grid-cols-2 gap-2 md:flex md:items-center md:space-x-2">
                  <button
                    onClick={handleMarkCompleted}
                    disabled={loading}
                    className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl flex items-center justify-center space-x-2 transition-all hover:bg-neutral-800 hover:border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-white">Concluir Lição</span>
                  </button>

                  <button
                    onClick={handleRequestNewExercise}
                    disabled={loading}
                    className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl flex items-center justify-center space-x-2 transition-all hover:bg-neutral-800 hover:border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
                  >
                    <Code className="w-4 h-4 text-sky-500" />
                    <span className="text-white">Novo Exercício</span>
                  </button>

                  <button
                    onClick={handleEvaluateUnderstanding}
                    disabled={loading}
                    className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl flex items-center justify-center space-x-2 transition-all hover:bg-neutral-800 hover:border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm col-span-2 md:col-span-1"
                  >
                    <Bot className="w-4 h-4 text-violet-500" />
                    <span className="text-white">Conversar com Professor</span>
                  </button>
                  
                  <button
                    onClick={handleNextLesson}
                    disabled={loading}
                    className="px-3 py-2 bg-brand-primary rounded-xl flex items-center justify-center space-x-2 transition-all hover:bg-brand-primary-dark disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm"
                  >
                    <ChevronRight className="w-4 h-4 text-white" />
                    <span className="text-white">Próxima Lição</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'plan' && (
            <div className="flex-1 p-4 overflow-y-auto bg-black">
              {(() => {
                console.log('🔍 [PLAN-TAB] Rendering plan tab:', { 
                  hasStudyPlan: !!studyPlan, 
                  studyPlanType: typeof studyPlan,
                  modulesCount: studyPlan?.modules?.length,
                  studyPlan: studyPlan 
                })
                return null
              })()}
              {studyPlan ? (
                <div className="space-y-6">
                  {/* Current Progress */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <div className="w-8 h-8 bg-brand-primary/15 rounded-full flex items-center justify-center mr-3">
                        <Award className="w-4 h-4 text-brand-primary" />
                      </div>
                      Progresso Atual
                    </h3>
                    <div className="space-y-5">
                      <div className="flex flex-col p-3 bg-black/40 rounded-lg border border-neutral-800">
                        <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Módulo Atual</p>
                        <p className="font-medium text-white">
                          {lessonContext?.moduleName || 'Carregando...'}
                        </p>
                      </div>
                      <div className="flex flex-col p-3 bg-black/40 rounded-lg border border-neutral-800">
                        <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Lição</p>
                        <p className="font-medium text-white">
                          {lessonContext?.lessonName || 'Carregando...'}
                        </p>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs uppercase tracking-wider text-neutral-500">Progresso Total</p>
                          <span className="text-sm font-medium text-white">
                            {correctProgress?.progressPercentage || lessonContext?.progressPercentage || 0}%
                          </span>
                        </div>
                        <div className="mt-1 bg-neutral-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-400 h-2 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${correctProgress?.progressPercentage || lessonContext?.progressPercentage || 38}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-2">
                          <p className="text-xs text-neutral-500">
                            <span className="font-semibold text-white">{correctProgress?.totalCompletedLessons || lessonContext?.completedLessons || 0}</span> de {correctProgress?.totalLessons || lessonContext?.totalLessons || 0} lições
                          </p>
                          <div className="flex items-center text-xs">
                            <Zap className="w-3 h-3 text-amber-400 mr-1" />
                            <span className="text-amber-400">+{(lessonContext?.xpEarned || 0)} XP</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Study Plan */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <div className="w-8 h-8 bg-brand-primary/15 rounded-full flex items-center justify-center mr-3">
                        <Book className="w-4 h-4 text-brand-primary" />
                      </div>
                      Plano de Estudos
                    </h3>
                    <div className="space-y-3">
                      {studyPlan.modules?.map((module: any, moduleIndex: number) => {
                        const isExpanded = expandedModules.has(moduleIndex)
                        
                        // Usar os dados pré-calculados do correctProgress ao invés de calcular manualmente
                        const moduleProgressData = correctProgress?.moduleProgress?.[moduleIndex] || {
                          completedLessons: 0,
                          totalLessons: module.lessons?.length || 0,
                          isCompleted: false
                        }
                        
                        // Use lessonContext as primary source, fallback to currentProfile
                        const currentModuleNum = lessonContext?.currentModule || currentProfile?.currentProgress?.currentModule || 1
                        const currentLessonNum = lessonContext?.currentLesson || currentProfile?.currentProgress?.currentLesson || 1
                        const completedLessonsArray = currentProfile?.currentProgress?.completedLessons || []
                        
                        // Usar dados do correctProgress (dados já corrigidos e calculados)
                        const completedLessonsCount = moduleProgressData.completedLessons
                        const totalLessons = moduleProgressData.totalLessons
                        const progressPercentage = totalLessons > 0 ? (completedLessonsCount / totalLessons) * 100 : 0
                        
                        return (
                          <div key={moduleIndex} className="bg-black/40 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-all hover:shadow-lg overflow-hidden">
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-white flex items-center">
                                  {moduleProgressData.isCompleted ? (
                                    <div className="w-3 h-3 mr-2 bg-green-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">✓</span>
                                    </div>
                                  ) : (
                                    <Circle className="w-3 h-3 mr-2 text-brand-primary" />
                                  )}
                                  {module.name}
                                </h4>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs py-0.5 px-2 bg-neutral-800 rounded-full text-neutral-400">
                                    {completedLessonsCount}/{totalLessons} concluídas
                                  </span>
                                  <button 
                                    onClick={() => toggleModuleExpansion(moduleIndex)}
                                    className="text-xs text-brand-primary transition-all flex items-center hover:text-brand-primary-light"
                                  >
                                    Ver detalhes
                                    <ChevronRight className={`w-3 h-3 ml-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-neutral-400 mt-2">{module.description}</p>
                              
                              {/* Progress bar */}
                              <div className="mt-3">
                                <div className="w-full bg-neutral-800 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      moduleProgressData.isCompleted 
                                        ? 'bg-green-500' 
                                        : 'bg-amber-400'
                                    }`}
                                    style={{ width: `${progressPercentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Expanded lessons list */}
                            {isExpanded && module.lessons && (
                              <div className="border-t border-neutral-800 bg-neutral-900/50">
                                <div className="p-4">
                                  <h5 className="text-sm font-medium text-neutral-300 mb-3">Lições do módulo:</h5>
                                  <div className="space-y-2">
                                    {module.lessons.map((lesson: any, lessonIndex: number) => {
                                      const lessonKey = `${moduleIndex}-${lessonIndex}`
                                      
                                      // Verificar se a lição está completada
                                      let isCompleted = false
                                      if (moduleIndex + 1 < currentModuleNum) {
                                        // Módulo anterior: todas as lições completadas
                                        isCompleted = true
                                      } else if (moduleIndex + 1 === currentModuleNum) {
                                        // Módulo atual: apenas lições anteriores à atual
                                        isCompleted = lessonIndex + 1 < currentLessonNum
                                      }
                                      
                                      // Verificar se é a lição atual
                                      const isCurrent = (moduleIndex + 1) === currentModuleNum && (lessonIndex + 1) === currentLessonNum
                                      
                                      return (
                                        <div 
                                          key={lessonIndex}
                                          className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                                            isCurrent 
                                              ? 'bg-brand-primary/20 border border-brand-primary/30' 
                                              : isCompleted 
                                                ? 'bg-green-500/10 border border-green-500/20'
                                                : 'bg-neutral-800/50 border border-neutral-700'
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                              isCompleted 
                                                ? 'bg-green-500 text-white'
                                                : isCurrent
                                                  ? 'bg-brand-primary text-white'
                                                  : 'bg-neutral-600 text-neutral-300'
                                            }`}>
                                              {isCompleted ? '✓' : lessonIndex + 1}
                                            </div>
                                            <div>
                                              <h6 className="font-medium text-sm text-white">
                                                {lesson.title || lesson.name || `Lição ${lessonIndex + 1}`}
                                              </h6>
                                              <p className="text-xs text-neutral-400">
                                                {lesson.description || lesson.content || `Lição ${lessonIndex + 1} do módulo ${module.name || `Módulo ${moduleIndex + 1}`}`}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {isCurrent && (
                                              <span className="text-xs bg-brand-primary text-white px-2 py-1 rounded-full">
                                                Atual
                                              </span>
                                            )}
                                            {isCompleted && (
                                              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                                                Concluída
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-neutral-900 rounded-xl border border-neutral-800 py-12">
                  <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Target className="w-10 h-10 text-neutral-500" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">Plano de Estudos não encontrado</h3>
                  <p className="text-neutral-400 text-center max-w-sm mb-8">Você precisa configurar seu perfil de aprendizado antes de começar</p>
                  <button
                    className="px-5 py-3 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl transition-colors shadow-lg"
                    onClick={() => router.push('/onboarding')}
                  >
                    Configurar Perfil
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="flex-1 p-4 overflow-y-auto bg-black">
              <div className="space-y-6">
                {/* XP and Level */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <div className="w-8 h-8 bg-brand-primary/15 rounded-full flex items-center justify-center mr-3">
                      <Trophy className="w-4 h-4 text-brand-primary" />
                    </div>
                    Nível e Experiência
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 rounded-lg p-4 border border-neutral-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Nível Atual</p>
                          <p className="text-2xl font-bold text-white">{userStats?.level || 1}</p>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                          <Star className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-4 border border-neutral-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Total XP</p>
                          <p className="text-2xl font-bold text-white">{userStats?.totalXP || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Level Progress */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs uppercase tracking-wider text-neutral-500">Progresso para Próximo Nível</p>
                      <span className="text-sm font-medium text-white">
                        {userStats?.xpToNextLevel ? `${userStats.xpToNextLevel} XP restantes` : 'Max Level'}
                      </span>
                    </div>
                    <div className="bg-neutral-800 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-amber-400 to-orange-500 h-3 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${userStats?.levelProgress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Study Stats */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <div className="w-8 h-8 bg-brand-primary/15 rounded-full flex items-center justify-center mr-3">
                      <Calendar className="w-4 h-4 text-brand-primary" />
                    </div>
                    Estatísticas de Estudo
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 rounded-lg p-4 border border-neutral-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Sequência Atual</p>
                          <p className="text-2xl font-bold text-white flex items-center">
                            {userStats?.currentStreak || 0}
                            <span className="text-orange-400 ml-1">🔥</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-4 border border-neutral-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Tempo Total</p>
                          <p className="text-2xl font-bold text-white">{Math.round((userStats?.totalStudyTime || 0) / 60)}h</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-4 border border-neutral-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Lições Concluídas</p>
                          <p className="text-2xl font-bold text-white">{userStats?.completedLessons || 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-4 border border-neutral-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Média XP/Dia</p>
                          <p className="text-2xl font-bold text-white">{Math.round((userStats?.averageXPPerDay || 0))}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Achievements */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <div className="w-8 h-8 bg-brand-primary/15 rounded-full flex items-center justify-center mr-3">
                      <Award className="w-4 h-4 text-brand-primary" />
                    </div>
                    Conquistas Recentes
                  </h3>
                  {recentAchievements.length > 0 ? (
                    <div className="space-y-3">
                      {recentAchievements.map((achievement: any, index: number) => (
                        <div key={index} className="bg-black/40 rounded-lg p-4 border border-neutral-800 flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Trophy className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-white">{achievement.name}</h4>
                            <p className="text-sm text-neutral-400">{achievement.description}</p>
                            <p className="text-xs text-amber-400 mt-1">+{achievement.xpReward} XP</p>
                          </div>
                          <div className="text-xs text-neutral-500">
                            {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trophy className="w-8 h-8 text-neutral-500" />
                      </div>
                      <p className="text-neutral-400">Nenhuma conquista desbloqueada ainda</p>
                      <p className="text-sm text-neutral-500 mt-1">Continue estudando para desbloquear suas primeiras conquistas!</p>
                    </div>
                  )}
                </div>

                {/* Progress Chart */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <div className="w-8 h-8 bg-brand-primary/15 rounded-full flex items-center justify-center mr-3">
                      <TrendingUp className="w-4 h-4 text-brand-primary" />
                    </div>
                    Progresso Semanal
                  </h3>
                  <div className="flex items-center justify-between gap-2 md:gap-4">
                    {weeklyXP.map((xp, index) => {
                      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
                      const hasStudied = xp > 0
                      
                      return (
                        <div key={index} className="flex flex-col items-center gap-3 group">
                          {/* Nome do dia */}
                          <div className={`text-xs font-semibold transition-colors duration-300 ${
                            hasStudied 
                              ? 'text-green-400' 
                              : 'text-neutral-500'
                          }`}>
                            {days[index]}
                          </div>
                          
                          {/* Ícone do status */}
                          <div className="relative">
                            {hasStudied ? (
                              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-400 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-green-500/25 group-hover:shadow-green-500/40">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {/* Efeito de brilho */}
                                <div className="absolute inset-0 bg-white opacity-20 rounded-xl animate-pulse"></div>
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-neutral-700 border-2 border-neutral-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:border-neutral-500 group-hover:bg-neutral-600">
                                <svg className="w-5 h-5 text-neutral-500" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" opacity="0.3"/>
                                  <path d="M12 4c4.41 0 8 3.59 8 8s-3.59 8-8 8-8-3.59-8-8 3.59-8 8-8m0-2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          {/* XP ganho */}
                          <div className="text-xs text-center min-w-[40px]">
                            <div className={`font-bold transition-colors duration-300 ${
                              hasStudied 
                                ? 'text-green-400' 
                                : 'text-neutral-500'
                            }`}>
                              {xp} XP
                            </div>
                            {hasStudied && (
                              <div className="w-full h-1 bg-green-500/30 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full animate-pulse"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-6 pt-4 border-t border-neutral-800">
                    <div className="flex items-center justify-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-400 rounded-lg shadow-sm"></div>
                        <span className="text-neutral-400 font-medium">Estudou</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-neutral-700 border border-neutral-600 rounded-lg"></div>
                        <span className="text-neutral-400 font-medium">Não estudou</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Sessions */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <div className="w-8 h-8 bg-brand-primary/15 rounded-full flex items-center justify-center mr-3">
                      <Timer className="w-4 h-4 text-brand-primary" />
                    </div>
                    Sessões Recentes
                  </h3>
                  {studySessions.length > 0 ? (
                    <div className="space-y-3">
                      {studySessions.map((session: any, index: number) => (
                        <div key={index} className="bg-black/40 rounded-lg p-4 border border-neutral-800 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{session.language}</p>
                            <p className="text-sm text-neutral-400">{Math.round(session.duration / 60)} minutos de estudo</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-amber-400">+{session.xpEarned} XP</p>
                            <p className="text-xs text-neutral-500">
                              {new Date(session.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Timer className="w-8 h-8 text-neutral-500" />
                      </div>
                      <p className="text-neutral-400">Nenhuma sessão de estudo registrada</p>
                      <p className="text-sm text-neutral-500 mt-1">Comece a estudar para ver suas sessões aqui!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-neutral-800 bg-black/30 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/10 relative">
                <User className="w-5 h-5 text-white" />
                {userStats && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-xs font-bold text-black">
                    {userStats.level}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <p className="text-xs text-neutral-400">{currentProfile?.language || 'Python'} • {currentProfile?.knowledgeLevel || 'Iniciante'}</p>
                  {userStats && (
                    <>
                      <span className="text-neutral-600">•</span>
                      <span className="text-xs text-amber-400 font-medium">{userStats.totalXP} XP</span>
                    </>
                  )}
                </div>
                {userStats && userStats.currentStreak > 0 && (
                  <div className="flex items-center mt-1">
                    <span className="text-orange-400 text-xs mr-1">🔥</span>
                    <span className="text-xs text-neutral-400">{userStats.currentStreak} dias de sequência</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => router.push('/profile')}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                title="Meu Perfil"
              >
                <User className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push('/help')}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                title="Ajuda"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={logout}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className={`hidden lg:flex w-1 hover:w-3 cursor-col-resize bg-neutral-800 hover:bg-brand-primary active:bg-brand-primary transition-all ${isResizing ? 'bg-brand-primary w-3' : ''} relative group`}
        onMouseDown={startResize}
        onTouchStart={startResize}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-1 h-20 rounded-full bg-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-black border-b border-neutral-800 p-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-brand-primary/15 rounded-lg flex items-center justify-center">
                <Code className="w-4 h-4 text-brand-primary" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-white tracking-tight">Editor de Código</h1>
                <p className="text-xs text-neutral-500">{currentProfile?.language || 'Python'}</p>
              </div>
            </div>
          </div>

          {/* Gamification Widget */}
          <div className="hidden lg:flex items-center space-x-4">
            {userStats && (
              <>
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-neutral-900/80 rounded-lg border border-neutral-800">
                  <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <Star className="w-3 h-3 text-white" />
                  </div>
                  <div className="text-xs">
                    <p className="text-neutral-400">Nível</p>
                    <p className="font-semibold text-white">{userStats.level}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-neutral-900/80 rounded-lg border border-neutral-800">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                  <div className="text-xs">
                    <p className="text-neutral-400">XP</p>
                    <p className="font-semibold text-white">{userStats.totalXP}</p>
                  </div>
                </div>
                
                {userStats.currentStreak > 0 && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-neutral-900/80 rounded-lg border border-neutral-800">
                    <span className="text-orange-400">🔥</span>
                    <div className="text-xs">
                      <p className="text-neutral-400">Sequência</p>
                      <p className="font-semibold text-white">{userStats.currentStreak}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={runCode}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center space-x-2 transition-colors shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span className="font-medium">Executar Código</span>
            </button>

            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={handleMarkCompleted}
                disabled={loading}
                className="px-3 py-2 bg-neutral-900 border border-neutral-700 hover:border-neutral-600 text-white rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Concluir</span>
              </button>
              
              <button
                onClick={handleNextLesson}
                disabled={loading}
                className="px-3 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg flex items-center space-x-2 transition-colors shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
                <span>Próxima</span>
              </button>
            </div>
          </div>
        </div>

        {/* Editor Content - Always Shown */}
        <div className="flex-1 bg-[#0d0d0d] flex flex-col">
          {/* Show mobile chat when screen is small and chat tab is active */}
          {activeTab === 'chat' && (
            <div className="flex flex-col flex-1 lg:hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-black">
                {messages.map((message) => (
                  <MessageComponent key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Code editor - Always visible on desktop */}
          <div className={`${activeTab === 'chat' ? 'hidden lg:flex' : 'flex'} flex-col flex-1`}>
              <div className="flex items-center px-2 py-1 bg-[#121212] border-b border-neutral-800 text-xs gap-3">
                <div className="flex items-center px-3 py-1 bg-[#1a1a1a] text-white rounded-t border-t border-x border-neutral-800/80">
                  <span className="text-neutral-300">main.py</span>
                  <button className="ml-2 text-neutral-500 hover:text-neutral-300">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-neutral-500 hover:text-neutral-300 cursor-pointer">
                  + Novo Arquivo
                </div>
              </div>
              
              <div className="flex-1 relative ring-1 ring-neutral-800/50 shadow-inner">
                <div className="absolute z-10 top-3 right-3 flex space-x-1">
                  <div className="px-2 py-1 bg-neutral-800/50 backdrop-blur-md rounded text-xs flex items-center gap-1.5 text-neutral-400">
                    <span>Python</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  </div>
                </div>
                
                <Editor
                  height="100%"
                  defaultLanguage="python"
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: 'var(--font-geist-mono), "SF Mono", Monaco, Menlo, "Ubuntu Mono", monospace',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: 'on',
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                cursorStyle: 'line',
                cursorBlinking: 'smooth',
                smoothScrolling: true,
                padding: { top: 16 },
                glyphMargin: false,
                contextmenu: true,
                suggest: {
                  showMethods: true,
                  showFunctions: true,
                  showConstructors: true,
                  showFields: true,
                  showVariables: true,
                  showClasses: true,
                  showStructs: true,
                  showInterfaces: true,
                  showModules: true,
                  showProperties: true,
                  showEvents: true,
                  showOperators: true,
                  showUnits: true,
                  showValues: true,
                  showConstants: true,
                  showEnums: true,
                  showEnumMembers: true,
                  showKeywords: true,
                  showWords: true,
                  showColors: true,
                  showFiles: true,
                  showReferences: true,
                  showFolders: true,
                  showTypeParameters: true,
                  showIssues: true,
                  showUsers: true,
                  showSnippets: true
                },
              }}
            />
            
            <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm text-xs py-1 px-3 text-neutral-500 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span>Linha 1, Coluna 1</span>
                <span>UTF-8</span>
              </div>
              <div className="flex items-center gap-3">
                <button className="hover:text-neutral-300 transition-colors">
                  <Loader2 className="w-3 h-3" />
                </button>
                <button className="hover:text-neutral-300 transition-colors">
                  <Bot className="w-3 h-3" />
                </button>
              </div>
            </div>
              </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Status Bar - Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 h-6 bg-black/90 border-t border-neutral-800 px-4 flex items-center justify-between text-xs text-neutral-400 z-50 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-emerald-200/90">Conectado</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse"></div>
            <span className="text-blue-200/90">AI: Online</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-neutral-500 font-mono">PyLearn v1.0.0</span>
          <span className="text-neutral-400 font-mono">{new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}
