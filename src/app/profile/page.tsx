'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Settings, 
  LogOut, 
  Code, 
  BookOpen, 
  Trophy, 
  Calendar,
  Clock,
  Zap,
  Target,
  TrendingUp,
  Star,
  Award,
  Brain,
  Coffee,
  ChevronRight,
  Plus,
  Edit3,
  BarChart3,
  Activity,
  CheckCircle,
  PlayCircle,
  Book,
  Lightbulb,
  Flame,
  Menu,
  X,
  Globe,
  Heart,
  Share2
} from 'lucide-react'

interface LearningStats {
  totalXP: number
  totalLessons: number
  completedLessons: number
  streak: number
  averageStudyTime: number
  level: number
  nextLevelXP: number
}

interface LanguageProgress {
  id: string
  name: string
  icon: string
  progress: number
  level: string
  xpEarned: number
  lessonsCompleted: number
  totalLessons: number
  lastStudied: string
  color: string
  description: string
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  earned: boolean
  earnedDate?: string
  category: 'learning' | 'streak' | 'milestone' | 'special'
}

interface StudySession {
  date: string
  duration: number
  xpEarned: number
  lessonsCompleted: number
  language: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<LearningStats | null>(null)
  const [languages, setLanguages] = useState<LanguageProgress[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'languages' | 'achievements' | 'analytics'>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/auth/login')
      return
    }

    setUser(JSON.parse(userData))
    fetchProfileData()
  }, [router])

  const fetchProfileData = async () => {
    const token = localStorage.getItem('token')
    
    try {
      // Fetch user profile and stats
      const profileResponse = await fetch('/api/learning-profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        
        // Mock data - in real app, this would come from your API
        setStats({
          totalXP: 2847,
          totalLessons: 45,
          completedLessons: 23,
          streak: 12,
          averageStudyTime: 35,
          level: 7,
          nextLevelXP: 3000
        })

        setLanguages([
          {
            id: 'python',
            name: 'Python',
            icon: '🐍',
            progress: 65,
            level: 'Intermediário',
            xpEarned: 1580,
            lessonsCompleted: 18,
            totalLessons: 28,
            lastStudied: '2025-06-25',
            color: 'from-blue-500 to-cyan-500',
            description: 'Linguagem versátil para ciência de dados e desenvolvimento web'
          },
          {
            id: 'javascript',
            name: 'JavaScript',
            icon: '⚡',
            progress: 40,
            level: 'Iniciante',
            xpEarned: 890,
            lessonsCompleted: 8,
            totalLessons: 20,
            lastStudied: '2025-06-20',
            color: 'from-yellow-500 to-orange-500',
            description: 'Essencial para desenvolvimento web moderno'
          },
          {
            id: 'java',
            name: 'Java',
            icon: '☕',
            progress: 25,
            level: 'Iniciante',
            xpEarned: 377,
            lessonsCompleted: 5,
            totalLessons: 20,
            lastStudied: '2025-06-18',
            color: 'from-red-500 to-pink-500',
            description: 'Robusta e amplamente usada em empresas'
          }
        ])

        setAchievements([
          {
            id: 'first-lesson',
            title: 'Primeira Lição',
            description: 'Complete sua primeira lição',
            icon: '🎯',
            earned: true,
            earnedDate: '2025-06-10',
            category: 'milestone'
          },
          {
            id: 'week-streak',
            title: 'Semana Consistente',
            description: 'Estude por 7 dias consecutivos',
            icon: '🔥',
            earned: true,
            earnedDate: '2025-06-22',
            category: 'streak'
          },
          {
            id: 'python-master',
            title: 'Mestre Python',
            description: 'Complete o curso básico de Python',
            icon: '🐍',
            earned: false,
            category: 'learning'
          },
          {
            id: 'night-owl',
            title: 'Coruja Noturna',
            description: 'Estude após 22h por 5 dias',
            icon: '🦉',
            earned: true,
            earnedDate: '2025-06-15',
            category: 'special'
          }
        ])

        setRecentSessions([
          {
            date: '2025-06-25',
            duration: 45,
            xpEarned: 120,
            lessonsCompleted: 2,
            language: 'Python'
          },
          {
            date: '2025-06-24',
            duration: 30,
            xpEarned: 80,
            lessonsCompleted: 1,
            language: 'Python'
          },
          {
            date: '2025-06-23',
            duration: 60,
            xpEarned: 150,
            lessonsCompleted: 3,
            language: 'JavaScript'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
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

  const progressToNextLevel = useMemo(() => {
    if (!stats || !stats.nextLevelXP) return 0
    const currentLevelXP = (stats.level - 1) * 500
    const progress = ((stats.totalXP - currentLevelXP) / (stats.nextLevelXP - currentLevelXP)) * 100
    return Math.min(progress, 100)
  }, [stats])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-brand-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
            <Code className="w-8 h-8 text-brand-primary" />
          </div>
          <p className="text-white">Carregando seu perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Header */}
      <div className="lg:hidden bg-neutral-900 border-b border-neutral-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-brand-primary/15 rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-brand-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-white">Meu Perfil</h1>
            <p className="text-xs text-neutral-400">{user?.name}</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-80 bg-neutral-900 border-r border-neutral-800 flex flex-col transition-transform lg:transition-none shadow-xl lg:shadow-none`}>
          {/* Sidebar Header */}
          <div className="p-6 border-b border-neutral-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Code className="w-6 h-6 text-brand-primary" />
                <span className="text-xl font-bold text-white">PyLearn</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-primary-dark rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{user?.name}</h3>
                <p className="text-sm text-neutral-400">Nível {stats?.level || 1}</p>
                <div className="flex items-center mt-1">
                  <Zap className="w-3 h-3 text-amber-400 mr-1" />
                  <span className="text-xs text-amber-400">{stats?.totalXP || 0} XP</span>
                </div>
              </div>
            </div>

            {/* Level Progress */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-neutral-500">Progresso do Nível</span>
                <span className="text-xs text-neutral-400">{Math.round(progressToNextLevel)}%</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-brand-primary to-brand-primary-light h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressToNextLevel}%` }}
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                {stats && stats.nextLevelXP && stats.totalXP ? Math.max(0, stats.nextLevelXP - stats.totalXP) : 0} XP para o próximo nível
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-6">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  activeTab === 'overview' 
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Activity className="w-5 h-5" />
                <span>Visão Geral</span>
              </button>
              
              <button
                onClick={() => setActiveTab('languages')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  activeTab === 'languages' 
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Code className="w-5 h-5" />
                <span>Linguagens</span>
              </button>
              
              <button
                onClick={() => setActiveTab('achievements')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  activeTab === 'achievements' 
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Trophy className="w-5 h-5" />
                <span>Conquistas</span>
              </button>
              
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  activeTab === 'analytics' 
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span>Estatísticas</span>
              </button>
            </nav>

            {/* Quick Actions */}
            <div className="mt-8">
              <h4 className="text-sm font-medium text-neutral-400 mb-4">Ações Rápidas</h4>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <PlayCircle className="w-5 h-5" />
                  <span>Continuar Estudando</span>
                </button>
                
                <button
                  onClick={() => router.push('/onboarding')}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Nova Linguagem</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-6 border-t border-neutral-800">
            <div className="flex space-x-2">
              <button
                onClick={() => router.push('/help')}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                title="Configurações"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={logout}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Header */}
                <div className="hidden lg:block">
                  <h1 className="text-3xl font-bold text-white mb-2">Olá, {user?.name}! 👋</h1>
                  <p className="text-neutral-400">Continue sua jornada de aprendizado em programação</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-amber-500/15 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-amber-500" />
                      </div>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{stats?.totalXP}</h3>
                    <p className="text-sm text-neutral-400">XP Total</p>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-500/15 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                      </div>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{stats?.completedLessons}</h3>
                    <p className="text-sm text-neutral-400">Lições Concluídas</p>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-orange-500/15 rounded-lg flex items-center justify-center">
                        <Flame className="w-5 h-5 text-orange-500" />
                      </div>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{stats?.streak}</h3>
                    <p className="text-sm text-neutral-400">Dias Consecutivos</p>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-purple-500/15 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-purple-500" />
                      </div>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{stats?.averageStudyTime}min</h3>
                    <p className="text-sm text-neutral-400">Média de Estudo</p>
                  </div>
                </div>

                {/* Current Languages */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Suas Linguagens</h2>
                    <button
                      onClick={() => setActiveTab('languages')}
                      className="text-brand-primary hover:text-brand-primary-light transition-colors text-sm flex items-center"
                    >
                      Ver todas <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                  <div className="grid gap-4">
                    {languages.slice(0, 2).map((language) => (
                      <div key={language.id} className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{language.icon}</span>
                            <div>
                              <h3 className="font-medium text-white">{language.name}</h3>
                              <p className="text-xs text-neutral-400">{language.level}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => router.push('/dashboard')}
                            className="px-3 py-1.5 bg-brand-primary hover:bg-brand-primary-dark text-white text-sm rounded-lg transition-colors"
                          >
                            Continuar
                          </button>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-400">Progresso</span>
                            <span className="text-white">{language.progress}%</span>
                          </div>
                          <div className="w-full bg-neutral-700 rounded-full h-2">
                            <div 
                              className={`bg-gradient-to-r ${language.color} h-2 rounded-full transition-all duration-500`}
                              style={{ width: `${language.progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-neutral-500">
                            <span>{language.lessonsCompleted}/{language.totalLessons} lições</span>
                            <span>{language.xpEarned} XP</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Achievements */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Conquistas Recentes</h2>
                    <button
                      onClick={() => setActiveTab('achievements')}
                      className="text-brand-primary hover:text-brand-primary-light transition-colors text-sm flex items-center"
                    >
                      Ver todas <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.filter(a => a.earned).slice(0, 4).map((achievement) => (
                      <div key={achievement.id} className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-amber-500/15 rounded-lg flex items-center justify-center">
                            <span className="text-xl">{achievement.icon}</span>
                          </div>
                          <div>
                            <h3 className="font-medium text-white">{achievement.title}</h3>
                            <p className="text-xs text-neutral-400">{achievement.description}</p>
                            <p className="text-xs text-amber-500 mt-1">
                              {new Date(achievement.earnedDate!).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Languages Tab */}
            {activeTab === 'languages' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Suas Linguagens</h1>
                    <p className="text-neutral-400">Gerencie e acompanhe seu progresso em cada linguagem</p>
                  </div>
                  <button
                    onClick={() => router.push('/onboarding')}
                    className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nova Linguagem</span>
                  </button>
                </div>

                <div className="grid gap-6">
                  {languages.map((language) => (
                    <div key={language.id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                      <div className={`h-2 bg-gradient-to-r ${language.color}`} />
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-neutral-800 rounded-xl flex items-center justify-center">
                              <span className="text-3xl">{language.icon}</span>
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-white">{language.name}</h3>
                              <p className="text-neutral-400">{language.description}</p>
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="text-sm text-neutral-500">Nível: {language.level}</span>
                                <span className="text-sm text-amber-500">{language.xpEarned} XP</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => router.push('/dashboard')}
                              className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg transition-colors"
                            >
                              Continuar
                            </button>
                            <button className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors">
                              <Settings className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-neutral-400">Progresso Geral</span>
                                <span className="text-white">{language.progress}%</span>
                              </div>
                              <div className="w-full bg-neutral-800 rounded-full h-3">
                                <div 
                                  className={`bg-gradient-to-r ${language.color} h-3 rounded-full transition-all duration-500`}
                                  style={{ width: `${language.progress}%` }}
                                />
                              </div>
                            </div>
                            
                            <div className="text-sm text-neutral-400">
                              Último estudo: {new Date(language.lastStudied).toLocaleDateString('pt-BR')}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                              <div className="text-lg font-semibold text-white">{language.lessonsCompleted}</div>
                              <div className="text-xs text-neutral-400">Lições Concluídas</div>
                            </div>
                            <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                              <div className="text-lg font-semibold text-white">{language.totalLessons}</div>
                              <div className="text-xs text-neutral-400">Total de Lições</div>
                            </div>
                          </div>

                          <div className="flex items-center justify-center">
                            <div className="bg-neutral-800/50 rounded-lg p-3 text-center w-full">
                              <div className="text-lg font-semibold text-amber-500">{language.xpEarned}</div>
                              <div className="text-xs text-neutral-400">XP Conquistado</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === 'achievements' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Conquistas</h1>
                  <p className="text-neutral-400">Suas conquistas e marcos de aprendizado</p>
                </div>

                <div className="grid gap-6">
                  {['milestone', 'learning', 'streak', 'special'].map((category) => (
                    <div key={category} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                      <h2 className="text-lg font-semibold text-white mb-4 capitalize">
                        {category === 'milestone' && '🎯 Marcos'}
                        {category === 'learning' && '📚 Aprendizado'}
                        {category === 'streak' && '🔥 Consistência'}
                        {category === 'special' && '⭐ Especiais'}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {achievements.filter(a => a.category === category).map((achievement) => (
                          <div 
                            key={achievement.id} 
                            className={`border rounded-lg p-4 transition-all ${
                              achievement.earned 
                                ? 'bg-neutral-800/50 border-amber-500/30 shadow-lg shadow-amber-500/5' 
                                : 'bg-neutral-800/20 border-neutral-700'
                            }`}
                          >
                            <div className="flex items-center space-x-3 mb-3">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                achievement.earned ? 'bg-amber-500/15' : 'bg-neutral-700/50'
                              }`}>
                                <span className={`text-xl ${achievement.earned ? '' : 'grayscale opacity-50'}`}>
                                  {achievement.icon}
                                </span>
                              </div>
                              <div>
                                <h3 className={`font-medium ${achievement.earned ? 'text-white' : 'text-neutral-500'}`}>
                                  {achievement.title}
                                </h3>
                                {achievement.earned && achievement.earnedDate && (
                                  <p className="text-xs text-amber-500">
                                    {new Date(achievement.earnedDate).toLocaleDateString('pt-BR')}
                                  </p>
                                )}
                              </div>
                              {achievement.earned && (
                                <CheckCircle className="w-5 h-5 text-amber-500 ml-auto" />
                              )}
                            </div>
                            <p className={`text-sm ${achievement.earned ? 'text-neutral-400' : 'text-neutral-600'}`}>
                              {achievement.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Estatísticas</h1>
                  <p className="text-neutral-400">Análise detalhada do seu progresso e desempenho</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-blue-500/15 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">23</h3>
                    <p className="text-sm text-neutral-400">Dias Estudando</p>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-green-500/15 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-6 h-6 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">12h</h3>
                    <p className="text-sm text-neutral-400">Tempo Total</p>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-purple-500/15 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Target className="w-6 h-6 text-purple-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">89%</h3>
                    <p className="text-sm text-neutral-400">Taxa de Sucesso</p>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-orange-500/15 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-6 h-6 text-orange-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">3</h3>
                    <p className="text-sm text-neutral-400">Linguagens</p>
                  </div>
                </div>

                {/* Recent Sessions */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Sessões Recentes</h2>
                  <div className="space-y-4">
                    {recentSessions.map((session, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-brand-primary/15 rounded-lg flex items-center justify-center">
                            <Code className="w-5 h-5 text-brand-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium text-white">{session.language}</h3>
                            <p className="text-sm text-neutral-400">
                              {new Date(session.date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-white">{session.duration} min</div>
                          <div className="text-sm text-amber-500">+{session.xpEarned} XP</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Study Streak */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Sequência de Estudos</h2>
                  <div className="flex items-center justify-center space-x-8 py-8">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Flame className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-2">{stats?.streak}</h3>
                      <p className="text-sm text-neutral-400">Dias Consecutivos</p>
                    </div>
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Star className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-2">23</h3>
                      <p className="text-sm text-neutral-400">Melhor Sequência</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
    </div>
  )
}
