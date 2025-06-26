'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  LogOut, 
  Trophy, 
  Calendar,
  Clock,
  Zap,
  Target,
  TrendingUp,
  Star,
  Award,
  Flame,
  BarChart3,
  Activity,
  CheckCircle,
  Book,
  ChevronRight,
  Crown,
  Medal,
  Settings,
  Menu,
  X,
  Code,
  BookOpen,
  Coffee,
  Brain
} from 'lucide-react'

interface UserStats {
  user: {
    id: string
    name: string
    email: string
    totalXP: number
    level: number
    streak: number
    lastStudyDate: Date
    createdAt: Date
    progressToNextLevel: number
    studiedToday: boolean
  }
  learningProfiles: {
    id: string
    language: string
    knowledgeLevel: string
    xp: number
    lessonsCompleted: number
    totalLessons: number
    progressPercentage: number
    studyPlan: any
  }[]
  studyTime: {
    total: number
    thisWeek: number
    sessions: number
  }
  achievements: {
    unlocked: {
      id: string
      name: string
      description: string
      icon: string
      xpReward: number
      unlockedAt: Date
    }[]
    totalUnlocked: number
  }
  recentSessions: {
    id: string
    language: string
    startTime: Date
    endTime: Date
    duration: number
    xpEarned: number
  }[]
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  xpReward: number
  unlocked: boolean
  unlockedAt?: Date
}

export default function ProfilePage() {
  const router = useRouter()
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetchUserStats()
    fetchAchievements()
  }, [])

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user-stats')
      if (response.ok) {
        const data = await response.json()
        setUserStats(data)
      } else {
        console.error('Failed to fetch user stats')
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const fetchAchievements = async () => {
    try {
      const response = await fetch('/api/achievements')
      if (response.ok) {
        const data = await response.json()
        setAchievements(data.achievements)
      }
    } catch (error) {
      console.error('Error fetching achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
      router.push('/auth/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (loading || !userStats) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-primary"></div>
      </div>
    )
  }

  const nextLevelXP = (userStats.user.level) * 1000
  const currentLevelXP = (userStats.user.level - 1) * 1000
  const progressToNextLevel = ((userStats.user.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100

  const unlockedAchievements = achievements.filter(a => a.unlocked)
  const lockedAchievements = achievements.filter(a => !a.unlocked)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header with Menu Toggle */}
      <div className="lg:hidden bg-neutral-900 border-b border-neutral-800 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Perfil</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-80 bg-neutral-900 border-r border-neutral-800 flex flex-col transition-transform lg:transition-none shadow-xl lg:shadow-none`}>
          {/* User Profile Header */}
          <div className="p-6 border-b border-neutral-800">
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h2 className="text-lg font-semibold text-white">Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{userStats.user.name}</h3>
                <p className="text-sm text-neutral-400">{userStats.user.email}</p>
              </div>
            </div>

            {/* Level Progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-white">Nível {userStats.user.level}</span>
                </div>
                <span className="text-xs text-neutral-400">{userStats.user.totalXP} XP</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-brand-primary to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, progressToNextLevel))}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>{userStats.user.totalXP} XP</span>
                <span>{nextLevelXP} XP</span>
              </div>
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
                <BarChart3 className="w-5 h-5" />
                <span>Visão Geral</span>
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
                onClick={() => setActiveTab('languages')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  activeTab === 'languages' 
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Book className="w-5 h-5" />
                <span>Linguagens</span>
              </button>
              
              <button
                onClick={() => setActiveTab('activity')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  activeTab === 'activity' 
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Activity className="w-5 h-5" />
                <span>Atividade</span>
              </button>
            </nav>

            {/* Quick Actions */}
            <div className="mt-8">
              <h4 className="text-sm font-medium text-neutral-400 mb-4">Ações Rápidas</h4>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <Code className="w-4 h-4" />
                  <span className="text-sm">Ir para Dashboard</span>
                </button>
                <button
                  onClick={() => router.push('/help')}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Configurações</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-6 border-t border-neutral-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
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
                  <h1 className="text-3xl font-bold text-white mb-2">Olá, {userStats.user.name}! 👋</h1>
                  <p className="text-neutral-400">Acompanhe seu progresso e conquistas na programação</p>
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
                    <h3 className="text-2xl font-bold text-white">{userStats.user.totalXP}</h3>
                    <p className="text-sm text-neutral-400">XP Total</p>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-orange-500/15 rounded-lg flex items-center justify-center">
                        <Flame className="w-5 h-5 text-orange-500" />
                      </div>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{userStats.user.streak}</h3>
                    <p className="text-sm text-neutral-400">Dias Consecutivos</p>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-purple-500/15 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-purple-500" />
                      </div>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{userStats.studyTime.total}min</h3>
                    <p className="text-sm text-neutral-400">Tempo Total</p>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-500/15 rounded-lg flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-blue-500" />
                      </div>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{userStats.achievements.totalUnlocked}</h3>
                    <p className="text-sm text-neutral-400">Conquistas</p>
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
                    {userStats.learningProfiles.slice(0, 2).map((profile) => (
                      <div key={profile.id} className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-purple-600 rounded-lg flex items-center justify-center">
                              <Code className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-medium text-white capitalize">{profile.language}</h3>
                              <p className="text-xs text-neutral-400 capitalize">{profile.knowledgeLevel}</p>
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
                            <span className="text-white">{profile.progressPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-neutral-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-brand-primary to-purple-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${profile.progressPercentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-neutral-500">
                            <span>{profile.lessonsCompleted}/{profile.totalLessons} lições</span>
                            <span>{profile.xp} XP</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Achievements */}
                {userStats.achievements.unlocked.length > 0 && (
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userStats.achievements.unlocked.slice(0, 6).map((achievement) => (
                        <div key={achievement.id} className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-amber-500/15 rounded-lg flex items-center justify-center">
                              <span className="text-xl">{achievement.icon}</span>
                            </div>
                            <div>
                              <h3 className="font-medium text-white">{achievement.name}</h3>
                              <p className="text-xs text-neutral-400">{achievement.description}</p>
                              <p className="text-xs text-amber-500 mt-1">
                                +{achievement.xpReward} XP
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                    <span>Nova Linguagem</span>
                  </button>
                </div>

                <div className="grid gap-6">
                  {userStats.learningProfiles.map((profile) => (
                    <div key={profile.id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                      <div className="h-2 bg-gradient-to-r from-brand-primary to-purple-600" />
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-neutral-800 rounded-xl flex items-center justify-center">
                              <Code className="w-8 h-8 text-brand-primary" />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-white capitalize">{profile.language}</h3>
                              <p className="text-neutral-400 capitalize">Nível {profile.knowledgeLevel}</p>
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="text-sm text-amber-500">{profile.xp} XP</span>
                                <span className="text-sm text-neutral-500">{profile.lessonsCompleted} lições completas</span>
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
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-neutral-400">Progresso Geral</span>
                                <span className="text-white">{profile.progressPercentage.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-neutral-800 rounded-full h-3">
                                <div 
                                  className="bg-gradient-to-r from-brand-primary to-purple-600 h-3 rounded-full transition-all duration-500"
                                  style={{ width: `${profile.progressPercentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                              <div className="text-lg font-semibold text-white">{profile.lessonsCompleted}</div>
                              <div className="text-xs text-neutral-400">Lições Concluídas</div>
                            </div>
                            <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                              <div className="text-lg font-semibold text-white">{profile.totalLessons}</div>
                              <div className="text-xs text-neutral-400">Total de Lições</div>
                            </div>
                          </div>

                          <div className="flex items-center justify-center">
                            <div className="bg-neutral-800/50 rounded-lg p-3 text-center w-full">
                              <div className="text-lg font-semibold text-amber-500">{profile.xp}</div>
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

                {/* Unlocked Achievements */}
                {unlockedAchievements.length > 0 && (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Trophy className="w-5 h-5 text-amber-500 mr-2" />
                      Conquistas Desbloqueadas ({unlockedAchievements.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {unlockedAchievements.map((achievement) => (
                        <div key={achievement.id} className="bg-neutral-800/50 rounded-lg p-4 border border-amber-500/30">
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-amber-500/15 rounded-lg flex items-center justify-center">
                              <span className="text-xl">{achievement.icon}</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-white">{achievement.name}</h4>
                              <p className="text-sm text-neutral-400 mt-1">{achievement.description}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs font-medium text-amber-500">+{achievement.xpReward} XP</span>
                                {achievement.unlockedAt && (
                                  <span className="text-xs text-neutral-500">
                                    {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <CheckCircle className="w-5 h-5 text-amber-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Locked Achievements */}
                {lockedAchievements.length > 0 && (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Target className="w-5 h-5 text-neutral-400 mr-2" />
                      Conquistas Bloqueadas ({lockedAchievements.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {lockedAchievements.map((achievement) => (
                        <div key={achievement.id} className="bg-neutral-800/20 rounded-lg p-4 border border-neutral-700 opacity-60">
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-neutral-700/50 rounded-lg flex items-center justify-center">
                              <span className="text-xl grayscale">{achievement.icon}</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-neutral-500">{achievement.name}</h4>
                              <p className="text-sm text-neutral-600 mt-1">{achievement.description}</p>
                              <span className="text-xs font-medium text-neutral-600 mt-2 inline-block">+{achievement.xpReward} XP</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Atividade</h1>
                  <p className="text-neutral-400">Histórico de sessões e estatísticas detalhadas</p>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-blue-500/15 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">{userStats.studyTime.sessions}</h3>
                    <p className="text-sm text-neutral-400">Sessões de Estudo</p>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-green-500/15 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-6 h-6 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">{userStats.studyTime.total}min</h3>
                    <p className="text-sm text-neutral-400">Tempo Total</p>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-orange-500/15 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Flame className="w-6 h-6 text-orange-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">{userStats.user.streak}</h3>
                    <p className="text-sm text-neutral-400">Sequência Atual</p>
                  </div>
                </div>

                {/* Recent Sessions */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Activity className="w-5 h-5 text-blue-500 mr-2" />
                    Sessões Recentes
                  </h3>
                  {userStats.recentSessions.length > 0 ? (
                    <div className="space-y-4">
                      {userStats.recentSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-brand-primary/15 rounded-lg flex items-center justify-center">
                              <Code className="w-5 h-5 text-brand-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium text-white capitalize">{session.language}</h4>
                              <p className="text-sm text-neutral-400">
                                {new Date(session.startTime).toLocaleDateString('pt-BR')} • {session.duration}min
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
                  ) : (
                    <div className="text-center py-8">
                      <Coffee className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                      <p className="text-neutral-400">Nenhuma sessão recente encontrada</p>
                      <p className="text-sm text-neutral-500 mt-2">Comece estudando para ver suas estatísticas aqui!</p>
                    </div>
                  )}
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
 