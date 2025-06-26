import { prisma } from '../src/lib/db'

const achievements = [
  // Milestone Achievements
  {
    key: 'first_lesson',
    name: 'Primeiros Passos',
    description: 'Complete sua primeira lição',
    icon: '🎯',
    category: 'milestone',
    condition: { type: 'lessons_completed', value: 1 },
    xpReward: 50
  },
  {
    key: 'fifth_lesson',
    name: 'Ganhando Momentum',
    description: 'Complete 5 lições',
    icon: '🚀',
    category: 'milestone',
    condition: { type: 'lessons_completed', value: 5 },
    xpReward: 100
  },
  {
    key: 'tenth_lesson',
    name: 'Dedicação',
    description: 'Complete 10 lições',
    icon: '💪',
    category: 'milestone',
    condition: { type: 'lessons_completed', value: 10 },
    xpReward: 200
  },
  {
    key: 'twentieth_lesson',
    name: 'Comprometimento',
    description: 'Complete 20 lições',
    icon: '🏆',
    category: 'milestone',
    condition: { type: 'lessons_completed', value: 20 },
    xpReward: 300
  },
  
  // XP Achievements
  {
    key: 'first_1000_xp',
    name: 'Mil Pontos',
    description: 'Ganhe 1,000 XP total',
    icon: '⭐',
    category: 'xp',
    condition: { type: 'total_xp', value: 1000 },
    xpReward: 100
  },
  {
    key: 'first_5000_xp',
    name: 'Cinco Mil Pontos',
    description: 'Ganhe 5,000 XP total',
    icon: '🌟',
    category: 'xp',
    condition: { type: 'total_xp', value: 5000 },
    xpReward: 250
  },
  
  // Level Achievements
  {
    key: 'level_5',
    name: 'Nível Cinco',
    description: 'Alcance o nível 5',
    icon: '🔥',
    category: 'level',
    condition: { type: 'level', value: 5 },
    xpReward: 200
  },
  {
    key: 'level_10',
    name: 'Nível Dez',
    description: 'Alcance o nível 10',
    icon: '⚡',
    category: 'level',
    condition: { type: 'level', value: 10 },
    xpReward: 400
  },
  
  // Streak Achievements
  {
    key: 'streak_3',
    name: 'Três Dias Seguidos',
    description: 'Estude por 3 dias consecutivos',
    icon: '🔥',
    category: 'streak',
    condition: { type: 'streak', value: 3 },
    xpReward: 150
  },
  {
    key: 'week_streak',
    name: 'Semana Consistente',
    description: 'Estude por 7 dias consecutivos',
    icon: '📅',
    category: 'streak',
    condition: { type: 'streak', value: 7 },
    xpReward: 300
  },
  {
    key: 'month_streak',
    name: 'Um Mês',
    description: 'Estude por 30 dias consecutivos',
    icon: '📆',
    category: 'streak',
    condition: { type: 'streak', value: 30 },
    xpReward: 1000
  },

  // Study Time Achievements
  {
    key: 'study_1_hour',
    name: 'Uma Hora de Estudo',
    description: 'Estude por pelo menos 1 hora total',
    icon: '⏰',
    category: 'time',
    condition: { type: 'study_time_minutes', value: 60 },
    xpReward: 100
  },
  {
    key: 'study_10_hours',
    name: 'Dez Horas de Estudo',
    description: 'Estude por pelo menos 10 horas total',
    icon: '⏱️',
    category: 'time',
    condition: { type: 'study_time_minutes', value: 600 },
    xpReward: 300
  },

  // Special Achievements
  {
    key: 'excellent_understanding',
    name: 'Compreensão Excelente',
    description: 'Complete uma lição com compreensão excelente',
    icon: '🧠',
    category: 'special',
    condition: { type: 'excellent_lesson', value: 1 },
    xpReward: 100
  },
  {
    key: 'early_bird',
    name: 'Madrugador',
    description: 'Estude antes das 8:00 da manhã',
    icon: '🌅',
    category: 'special',
    condition: { type: 'early_study', value: 1 },
    xpReward: 150
  },
  {
    key: 'night_owl',
    name: 'Coruja Noturna',
    description: 'Estude depois das 22:00',
    icon: '🦉',
    category: 'special',
    condition: { type: 'late_study', value: 1 },
    xpReward: 150
  },
  
  // Language Achievements
  {
    key: 'python_beginner',
    name: 'Python Iniciante',
    description: 'Complete 5 lições de Python',
    icon: '🐍',
    category: 'language',
    condition: { type: 'language_lessons', language: 'Python', value: 5 },
    xpReward: 150
  },
  {
    key: 'javascript_beginner',
    name: 'JavaScript Iniciante',
    description: 'Complete 5 lições de JavaScript',
    icon: '⚡',
    category: 'language',
    condition: { type: 'language_lessons', language: 'JavaScript', value: 5 },
    xpReward: 150
  },
  {
    key: 'module_master',
    name: 'Mestre do Módulo',
    description: 'Complete um módulo inteiro',
    icon: '📚',
    category: 'milestone',
    condition: { type: 'modules_completed', value: 1 },
    xpReward: 300
  },
  {
    key: 'coding_marathon',
    name: 'Maratona de Código',
    description: 'Estude por mais de 2 horas em um dia',
    icon: '🏃‍♂️',
    category: 'time',
    condition: { type: 'daily_minutes', value: 120 },
    xpReward: 200
  },
  {
    key: 'perfect_week',
    name: 'Semana Perfeita',
    description: 'Complete pelo menos 1 lição todos os dias da semana',
    icon: '⭐',
    category: 'streak',
    condition: { type: 'perfect_week', value: 1 },
    xpReward: 400
  },
  {
    key: 'speed_learner',
    name: 'Aprendiz Veloz',
    description: 'Complete 3 lições em menos de 30 minutos',
    icon: '⚡',
    category: 'milestone',
    condition: { type: 'fast_lessons', value: 3, time_limit: 30 },
    xpReward: 150
  }
]

async function seedAchievements() {
  console.log('🏆 Seeding achievements...')
  
  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: achievement,
      create: achievement
    })
    console.log(`✅ Created/Updated achievement: ${achievement.name}`)
  }
  
  console.log('🎉 Achievements seeded successfully!')
}

seedAchievements()
  .catch((e) => {
    console.error('❌ Error seeding achievements:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
