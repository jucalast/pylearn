import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seed() {
  try {
    // Create demo exercises
    const pythonExercises = [
      {
        language: 'Python',
        level: 'beginner',
        title: 'Olá Mundo',
        description: 'Escreva um programa que imprima "Olá, mundo!" na tela.',
        codeTemplate: '# Escreva seu código aqui\nprint("___")',
        solution: 'print("Olá, mundo!")',
        testCases: [
          {
            input: null,
            expectedOutput: 'Olá, mundo!',
            description: 'Deve imprimir a mensagem correta'
          }
        ],
        hints: [
          'Use a função print() para imprimir texto',
          'Lembre-se de usar aspas para delimitar strings'
        ],
        metadata: {
          topic: 'sintaxe básica',
          difficulty: 'beginner'
        }
      },
      {
        language: 'Python',
        level: 'beginner',
        title: 'Soma de dois números',
        description: 'Crie um programa que some dois números e imprima o resultado.',
        codeTemplate: '# Defina duas variáveis\na = 5\nb = 3\n\n# Calcule a soma\nresultado = ___\n\n# Imprima o resultado\nprint(resultado)',
        solution: 'a = 5\nb = 3\nresultado = a + b\nprint(resultado)',
        testCases: [
          {
            input: null,
            expectedOutput: '8',
            description: 'Deve imprimir a soma correta'
          }
        ],
        hints: [
          'Use o operador + para somar',
          'Atribua o resultado da soma à variável resultado'
        ],
        metadata: {
          topic: 'operadores aritméticos',
          difficulty: 'beginner'
        }
      }
    ]

    for (const exercise of pythonExercises) {
      await prisma.exercise.create({
        data: exercise
      })
    }

    // Create learning paths
    const pythonBeginnerPath = {
      language: 'Python',
      level: 'beginner',
      title: 'Python para Iniciantes',
      description: 'Aprenda os fundamentos da programação Python do zero',
      modules: [
        {
          title: 'Introdução ao Python',
          description: 'Conceitos básicos e sintaxe',
          topics: ['Variáveis', 'Tipos de dados', 'Print', 'Input'],
          estimatedHours: 4
        },
        {
          title: 'Estruturas de Controle',
          description: 'If/else, loops e condições',
          topics: ['If/else', 'While', 'For', 'Break/continue'],
          estimatedHours: 6
        },
        {
          title: 'Estruturas de Dados',
          description: 'Listas, dicionários e tuplas',
          topics: ['Listas', 'Dicionários', 'Tuplas', 'Sets'],
          estimatedHours: 8
        }
      ],
      estimatedHours: 18
    }

    await prisma.learningPath.create({
      data: pythonBeginnerPath
    })

    console.log('✅ Dados de exemplo criados com sucesso!')

  } catch (error) {
    console.error('❌ Erro ao criar dados de exemplo:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seed()
