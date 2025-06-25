'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Code, Zap, Target, ChevronRight, Sparkles } from 'lucide-react'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsLoggedIn(true)
      router.push('/dashboard')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-black backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-brand-primary/15 rounded-xl flex items-center justify-center">
                <Code className="w-6 h-6 text-brand-primary" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">PyLearn</span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                href="/help" 
                className="text-neutral-400 hover:text-white transition-colors"
              >
                Como Funciona
              </Link>
              <Link 
                href="/auth/login" 
                className="px-4 py-2 bg-neutral-900 border border-neutral-700 hover:border-neutral-600 text-white rounded-lg transition-colors"
              >
                Login
              </Link>
              <Link 
                href="/auth/register" 
                className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg transition-colors shadow-lg shadow-brand-primary/10"
              >
                Começar
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="w-6 h-6 text-brand-accent mr-2" />
            <span className="text-brand-accent font-medium">AI-Powered Learning</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
            Aprenda programação com
            <span className="block text-brand-primary">Inteligência Artificial</span>
          </h1>
          
          <p className="text-xl text-neutral-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Seu professor pessoal de programação. Aprenda no seu ritmo com feedback em tempo real 
            e exercícios personalizados para o seu nível.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/auth/register"
              className="px-8 py-3 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg transition-colors text-lg flex items-center gap-2 shadow-lg shadow-brand-primary/20"
            >
              Começar Gratuitamente
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              href="/help"
              className="px-8 py-3 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-white rounded-lg transition-colors text-lg"
            >
              Ver Demonstração
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
            Por que escolher PyLearn?
          </h2>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            Uma abordagem revolucionária para aprender programação
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 hover:border-neutral-700 shadow-lg group transition-all duration-300">
            <div className="w-12 h-12 bg-brand-primary/15 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-primary/20 transition-colors">
              <Zap className="w-6 h-6 text-brand-primary" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">IA Personalizada</h3>
            <p className="text-neutral-400 leading-relaxed">
              Nossa IA adapta o ensino ao seu nível de conhecimento e ritmo de aprendizagem, 
              criando uma experiência única para cada estudante.
            </p>
          </div>
          
          <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 hover:border-neutral-700 shadow-lg group transition-all duration-300">
            <div className="w-12 h-12 bg-brand-primary/15 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-primary/20 transition-colors">
              <Code className="w-6 h-6 text-brand-primary" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Editor Profissional</h3>
            <p className="text-neutral-400 leading-relaxed">
              Pratique com um editor de código profissional integrado, com syntax highlighting 
              e feedback instantâneo sobre seu código.
            </p>
          </div>
          
          <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 hover:border-neutral-700 shadow-lg group transition-all duration-300">
            <div className="w-12 h-12 bg-brand-primary/15 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-primary/20 transition-colors">
              <Target className="w-6 h-6 text-brand-primary" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Planos Personalizados</h3>
            <p className="text-neutral-400 leading-relaxed">
              Planos de estudo criados especificamente para seus objetivos e disponibilidade, 
              garantindo progresso constante.
            </p>
          </div>
        </div>
      </section>

      {/* Supported Languages */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
            Linguagens Suportadas
          </h2>
          <p className="text-neutral-400 text-lg">
            Aprenda as linguagens mais demandadas do mercado
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
          {['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust'].map((lang) => (
            <span
              key={lang}
              className="bg-neutral-900 text-white px-6 py-3 rounded-full border border-neutral-800 hover:border-brand-primary/50 hover:bg-neutral-800 transition-all duration-200"
            >
              {lang}
            </span>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-neutral-900 border-t border-neutral-800">
        <div className="container mx-auto px-6 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">
              Pronto para começar sua jornada?
            </h2>
            <p className="text-neutral-400 text-lg mb-8">
              Junte-se a milhares de estudantes que já estão aprendendo programação de forma inteligente.
            </p>
            <Link
              href="/auth/register"
              className="px-8 py-3 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg transition-colors text-lg inline-flex items-center gap-2 shadow-lg shadow-brand-primary/20"
            >
              Começar Agora
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-neutral-800 pb-12">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-brand-primary/15 rounded-lg flex items-center justify-center">
                <Code className="w-4 h-4 text-brand-primary" />
              </div>
              <span className="text-lg font-semibold text-white tracking-tight">PyLearn</span>
            </div>
            <p className="text-neutral-500 text-sm">
              © 2025 PyLearn. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
      
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
