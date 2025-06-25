'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { APP_CONFIG } from '@/config/app'
import { Code, ChevronRight, Loader2, Sparkles, Target, AlertTriangle } from 'lucide-react'

const PROGRAMMING_LANGUAGES = APP_CONFIG.supportedLanguages
const ASSESSMENT_QUESTIONS = APP_CONFIG.assessmentQuestions

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [answers, setAnswers] = useState<string[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{message: string, type: string} | null>(null)
  const router = useRouter()

  const questions = selectedLanguage ? ASSESSMENT_QUESTIONS[selectedLanguage as keyof typeof ASSESSMENT_QUESTIONS] || [] : []

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language)
    setStep(2)
  }

  const handleAnswerSubmit = () => {
    const newAnswers = [...answers, currentAnswer]
    setAnswers(newAnswers)
    setCurrentAnswer('')

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1)
    } else {
      createLearningProfile(newAnswers)
    }
  }

  const createLearningProfile = async (allAnswers: string[]) => {
    setLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/learning-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          language: selectedLanguage,
          answers: allAnswers
        })
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('currentProfile', JSON.stringify(data.profile))
        router.push('/dashboard')
      } else {
        // Display specific error message from backend
        setError({
          message: data.error || 'Erro desconhecido occurred',
          type: data.type || 'unknown'
        })
      }
    } catch (error) {
      // Network or other unexpected errors
      setError({
        message: 'Erro de conexão. Verifique sua internet e tente novamente.',
        type: 'network_error'
      })
    } finally {
      setLoading(false)
    }
  }

  const getErrorComponent = () => {
    if (!error) return null

    let title = 'Erro no Processamento'
    let description = error.message
    let actionText = 'Tentar Novamente'
    let actionHandler = () => {
      setError(null)
      createLearningProfile(answers)
    }

    // Customize error display based on error type
    switch (error.type) {
      case 'invalid_api_key':
        title = 'Configuração do Sistema'
        description = 'O serviço de IA não está configurado corretamente. Entre em contato com o administrador do sistema.'
        actionText = 'Voltar'
        actionHandler = () => {
          setError(null)
          setStep(1)
        }
        break
      case 'quota_exceeded':
        title = 'Limite de Uso Atingido'
        description = 'O limite diário do serviço de IA foi atingido. Tente novamente mais tarde ou entre em contato com o suporte.'
        actionText = 'Voltar'
        actionHandler = () => {
          setError(null)
          setStep(1)
        }
        break
      case 'service_unavailable':
        title = 'Serviço Temporariamente Indisponível'
        description = 'O serviço de IA está temporariamente indisponível. Tente novamente em alguns minutos.'
        break
      case 'api_error':
        title = 'Erro do Serviço de IA'
        description = 'Ocorreu um erro no processamento pela IA. Tente novamente ou entre em contato com o suporte.'
        break
      case 'internal_error':
        title = 'Processamento Incompleto'
        description = 'A IA está gerando uma resposta muito extensa. Isso pode acontecer ocasionalmente. Tente novamente - geralmente funciona na segunda tentativa.'
        break
      case 'network_error':
        title = 'Erro de Conexão'
        description = 'Verifique sua conexão com a internet e tente novamente.'
        break
      default:
        title = 'Erro Inesperado'
        description = error.message || 'Ocorreu um erro inesperado. Tente novamente.'
    }

    return (
      <div className="bg-neutral-900 p-6 rounded-xl border border-red-500/30 shadow-lg">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/15 rounded-xl flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">{title}</h3>
          <p className="text-neutral-400 mb-6">{description}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={actionHandler}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-lg"
            >
              {actionText}
            </button>
            <button
              onClick={() => setError(null)}
              className="px-4 py-2 bg-neutral-800 border border-neutral-700 hover:border-neutral-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6">
            <Loader2 className="w-16 h-16 animate-spin text-brand-primary" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2 tracking-tight">
            Criando seu plano personalizado
          </h2>
          <p className="text-neutral-400">
            Nossa IA está analisando suas respostas...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8 flex flex-col pb-12">
      <div className="flex-1 max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-brand-primary/15 rounded-xl flex items-center justify-center mr-3">
              <Sparkles className="w-6 h-6 text-brand-primary" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Configuração Personalizada
            </h1>
          </div>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Vamos criar um plano de estudos perfeito para você com algumas perguntas rápidas
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-neutral-400 mb-2">
            <span>Progresso</span>
            <span>{step}/2</span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-2">
            <div 
              className="bg-brand-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8">
            {getErrorComponent()}
          </div>
        )}

        {!error && step === 1 && (
          <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 shadow-lg">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-brand-primary/15 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-brand-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">
                Escolha sua linguagem de programação
              </h2>
              <p className="text-neutral-400">
                Qual linguagem você gostaria de aprender ou aprimorar?
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {PROGRAMMING_LANGUAGES.map((language) => (
                <button
                  key={language}
                  onClick={() => handleLanguageSelect(language)}
                  className="group p-6 border border-neutral-800 rounded-lg hover:border-brand-primary/50 hover:bg-black transition-all duration-200 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-white group-hover:text-brand-primary transition-colors">
                        {language}
                      </h3>
                      <p className="text-sm text-neutral-400 mt-1">
                        {language === 'Python' && 'Ideal para iniciantes e ciência de dados'}
                        {language === 'JavaScript' && 'Desenvolvimento web moderno'}
                        {language === 'TypeScript' && 'JavaScript com tipagem estática'}
                        {language === 'Java' && 'Programação orientada a objetos'}
                        {language === 'C++' && 'Performance e programação de sistemas'}
                        {language === 'C#' && 'Desenvolvimento Microsoft'}
                        {language === 'Go' && 'Linguagem moderna do Google'}
                        {language === 'Rust' && 'Segurança e performance'}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-brand-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!error && step === 2 && questions.length > 0 && (
          <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 shadow-lg">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  Avaliação de Conhecimento
                </h2>
                <span className="text-sm text-neutral-400">
                  {questionIndex + 1} de {questions.length}
                </span>
              </div>
              
              <div className="w-full bg-neutral-800 rounded-full h-2 mb-6">
                <div 
                  className="bg-brand-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              
                <h3 className="text-lg font-medium text-white mb-4">
                  {questions[questionIndex]}
                </h3>
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Digite sua resposta aqui..."
                  className="w-full bg-black border border-neutral-800 focus:border-neutral-700 rounded-lg py-3 px-4 text-white h-32 resize-none outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => {
                    if (questionIndex > 0) {
                      setQuestionIndex(questionIndex - 1)
                      setCurrentAnswer(answers[questionIndex - 1] || '')
                    } else {
                      setStep(1)
                    }
                  }}
                  className="px-4 py-2 bg-neutral-800 border border-neutral-700 hover:border-neutral-600 text-white rounded-lg transition-colors"
                >
                  Voltar
                </button>
                
                <button
                  onClick={handleAnswerSubmit}
                  disabled={!currentAnswer.trim()}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20"
                >
                  <span>
                    {questionIndex === questions.length - 1 ? 'Finalizar' : 'Próxima'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

        )}
      </div>
      
      {/* Status Bar (Fixed) */}
      <div className="fixed bottom-0 left-0 right-0 h-6 bg-neutral-900 border-t border-neutral-800 text-neutral-500 px-4 flex items-center justify-between text-xs z-50 font-mono">
        <div className="flex items-center">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="hidden md:inline">Pronto</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2">
            <span>PyLearn v1.0.0</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Gemini AI</span>
          </div>
        </div>
      </div>
    </div>
  )
}
           