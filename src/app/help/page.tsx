'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  BookOpen, 
  Code, 
  MessageCircle, 
  Target, 
  Award, 
  Play, 
  ArrowLeft,
  Lightbulb,
  Zap,
  CheckCircle,
  Users,
  Sparkles
} from 'lucide-react'

export default function Help() {
  const [activeSection, setActiveSection] = useState('getting-started')

  const sections = [
    { id: 'getting-started', title: 'Primeiros Passos', icon: BookOpen },
    { id: 'chat', title: 'Chat com IA', icon: MessageCircle },
    { id: 'editor', title: 'Editor de Código', icon: Code },
    { id: 'exercises', title: 'Exercícios', icon: Target },
    { id: 'progress', title: 'Progresso', icon: Award }
  ]

  const content = {
    'getting-started': (
      <div>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center tracking-tight">
          <BookOpen className="w-7 h-7 text-brand-primary mr-3" />
          Primeiros Passos
        </h2>
        <div className="space-y-6">
          <div className="bg-brand-primary/5 border border-brand-primary/20 p-6 rounded-xl">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-brand-primary font-bold text-sm">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Avaliação Inicial</h3>
                <p className="text-neutral-400">
                  Ao se registrar, você passará por uma avaliação para determinar seu nível de conhecimento 
                  e criar um plano personalizado.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-500/5 border border-green-500/20 p-6 rounded-xl">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-500/15 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-green-500 font-bold text-sm">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Plano Personalizado</h3>
                <p className="text-neutral-400">
                  Nossa IA criará um plano de estudos específico para você, adaptado ao seu ritmo 
                  e objetivos de aprendizagem.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-400/5 border border-blue-400/20 p-6 rounded-xl">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-brand-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-brand-accent font-bold text-sm">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Aprendizado Interativo</h3>
                <p className="text-neutral-400">
                  Use o chat para tirar dúvidas, o editor para praticar e receba feedback 
                  instantâneo sobre seu progresso.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    'chat': (
      <div>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center tracking-tight">
          <MessageCircle className="w-7 h-7 text-brand-primary mr-3" />
          Chat com IA
        </h2>
        <div className="space-y-6">
          <p className="text-neutral-400 text-lg">
            O chat com IA é seu professor pessoal disponível 24/7. Você pode:
          </p>
          
          <div className="grid gap-4">
            <div className="flex items-start space-x-3 p-4 bg-black rounded-lg border border-neutral-800">
              <MessageCircle className="w-5 h-5 text-brand-primary mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-white">Fazer perguntas sobre conceitos</h4>
                <p className="text-sm text-neutral-400">Esclareça dúvidas sobre programação</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-black rounded-lg border border-neutral-800">
              <Code className="w-5 h-5 text-brand-primary mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-white">Pedir explicações sobre códigos</h4>
                <p className="text-sm text-neutral-400">Entenda como funciona qualquer código</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-black rounded-lg border border-neutral-800">
              <Target className="w-5 h-5 text-brand-primary mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-white">Solicitar exercícios específicos</h4>
                <p className="text-sm text-neutral-400">Pratique tópicos específicos</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-black rounded-lg border border-neutral-800">
              <Lightbulb className="w-5 h-5 text-brand-primary mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-white">Obter dicas e sugestões</h4>
                <p className="text-sm text-neutral-400">Melhore suas habilidades com dicas profissionais</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-xl">
            <div className="flex items-center space-x-3">
              <Lightbulb className="w-6 h-6 text-yellow-500 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-white">💡 Dica</h4>
                <p className="text-neutral-400">
                  Seja específico em suas perguntas para obter respostas mais precisas e úteis!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    'editor': (
      <div>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center tracking-tight">
          <Code className="w-7 h-7 text-brand-primary mr-3" />
          Editor de Código
        </h2>
        <div className="space-y-6">
          <p className="text-neutral-400 text-lg">
            Nosso editor profissional oferece uma experiência de codificação completa:
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700">
              <h4 className="font-semibold text-white mb-3 flex items-center">
                <Sparkles className="w-5 h-5 text-brand-primary mr-2" />
                Recursos Principais
              </h4>
              <ul className="space-y-2 text-neutral-400">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-vscode-success" />
                  <span>Syntax highlighting para múltiplas linguagens</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-vscode-success" />
                  <span>Autocompletar de código inteligente</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-vscode-success" />
                  <span>Detecção de erros em tempo real</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-vscode-success" />
                  <span>Tema escuro profissional</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700">
              <h4 className="font-semibold text-white mb-3 flex items-center">
                <Zap className="w-5 h-5 text-brand-primary mr-2" />
                Atalhos Úteis
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-black rounded">
                  <span className="text-white">Executar código</span>
                  <kbd className="bg-neutral-900 px-2 py-1 rounded text-xs border border-neutral-700 text-neutral-300">F5</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-black rounded">
                  <span className="text-white">Comentar linha</span>
                  <kbd className="bg-neutral-900 px-2 py-1 rounded text-xs border border-neutral-700 text-neutral-300">Ctrl+/</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-black rounded">
                  <span className="text-white">Desfazer</span>
                  <kbd className="bg-neutral-900 px-2 py-1 rounded text-xs border border-neutral-700 text-neutral-300">Ctrl+Z</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-black rounded">
                  <span className="text-white">Salvar</span>
                  <kbd className="bg-neutral-900 px-2 py-1 rounded text-xs border border-neutral-700 text-neutral-300">Ctrl+S</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    'exercises': (
      <div>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center tracking-tight">
          <Target className="w-7 h-7 text-brand-primary mr-3" />
          Exercícios
        </h2>
        <div className="space-y-6">
          <p className="text-neutral-400 text-lg">
            Os exercícios são gerados pela IA baseados no seu progresso e adaptados ao seu nível:
          </p>
          
          <div className="grid gap-6">
            <div className="bg-neutral-800 p-6 rounded-xl border-l-4 border-green-500">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-green-500/15 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Exercícios Adaptativos</h4>
                  <p className="text-neutral-400">
                    A dificuldade é automaticamente ajustada conforme você progride, 
                    garantindo sempre o desafio ideal.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-neutral-800 p-6 rounded-xl border-l-4 border-brand-primary">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-brand-primary/15 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Feedback Instantâneo</h4>
                  <p className="text-neutral-400">
                    Receba avaliação detalhada e sugestões de melhoria imediatamente 
                    após submeter seu código.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-neutral-800 p-6 rounded-xl border-l-4 border-blue-400">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-400/15 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Múltiplas Tentativas</h4>
                  <p className="text-neutral-400">
                    Tente quantas vezes precisar. Cada tentativa é uma oportunidade 
                    de aprender e melhorar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    'progress': (
      <div>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center tracking-tight">
          <Award className="w-7 h-7 text-brand-primary mr-3" />
          Acompanhamento de Progresso
        </h2>
        <div className="space-y-6">
          <p className="text-neutral-400 text-lg">
            Monitore seu desenvolvimento através de ferramentas avançadas de acompanhamento:
          </p>
          
          <div className="grid gap-6">
            <div className="bg-gradient-to-r from-brand-primary/5 to-brand-primary/10 border border-brand-primary/20 p-6 rounded-xl">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-brand-primary/15 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">📊 Estatísticas Detalhadas</h4>
                  <p className="text-neutral-400">
                    Exercícios completados, tempo de estudo, pontuação e análise de desempenho 
                    para identificar áreas de melhoria.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500/5 to-green-500/10 border border-green-500/20 p-6 rounded-xl">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-green-500/15 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">🎯 Metas Personalizadas</h4>
                  <p className="text-neutral-400">
                    Objetivos de aprendizado adaptados ao seu ritmo e disponibilidade, 
                    com acompanhamento automático de progresso.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-400/5 to-blue-400/10 border border-blue-400/20 p-6 rounded-xl">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-400/15 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">🏆 Sistema de Conquistas</h4>
                  <p className="text-neutral-400">
                    Badges e marcos especiais para celebrar suas conquistas e 
                    manter a motivação alta durante o aprendizado.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col pb-12">
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800">
        <div className="container mx-auto px-6 py-6">
          <Link 
            href="/"
            className="inline-flex items-center text-brand-primary hover:text-brand-accent mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para início
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center tracking-tight">
            <div className="w-10 h-10 bg-brand-primary/15 rounded-xl flex items-center justify-center mr-3">
              <Code className="w-6 h-6 text-brand-primary" />
            </div>
            Central de Ajuda
          </h1>
          <p className="text-neutral-400 mt-2 text-lg">
            Aprenda como usar todas as funcionalidades do PyLearn
          </p>
        </div>
      </div>
      <div className="container mx-auto px-6 py-8 flex-1">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                        : 'bg-neutral-900 text-white border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {section.title}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 shadow-lg">
              {content[activeSection as keyof typeof content]}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 bg-neutral-900 p-6 rounded-xl border border-neutral-800 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center tracking-tight">
            <div className="w-8 h-8 bg-brand-primary/15 rounded-lg flex items-center justify-center mr-3">
              <Zap className="w-5 h-5 text-brand-primary" />
            </div>
            Ações Rápidas
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/auth/register"
              className="group p-6 border border-neutral-800 rounded-xl hover:border-brand-primary/50 hover:bg-black transition-all duration-200"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-brand-primary/15 rounded-xl flex items-center justify-center mr-4 group-hover:bg-brand-primary/20 transition-colors">
                  <Play className="h-6 w-6 text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-brand-primary transition-colors">
                    Começar Agora
                  </h3>
                  <p className="text-sm text-neutral-400">
                    Crie sua conta e inicie o aprendizado
                  </p>
                </div>
              </div>
            </Link>
            
            <Link
              href="/auth/login"
              className="group p-6 border border-neutral-800 rounded-xl hover:border-green-500/30 hover:bg-black transition-all duration-200"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-500/15 rounded-xl flex items-center justify-center mr-4 group-hover:bg-green-500/20 transition-colors">
                  <MessageCircle className="h-6 w-6 text-vscode-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-green-500 transition-colors">
                    Fazer Login
                  </h3>
                  <p className="text-sm text-neutral-400">
                    Acesse sua conta existente
                  </p>
                </div>
              </div>
            </Link>
            
            <div className="group p-6 border border-neutral-800 rounded-xl hover:border-blue-400/30 hover:bg-black transition-all duration-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-400/15 rounded-xl flex items-center justify-center mr-4 group-hover:bg-blue-400/20 transition-colors">
                  <Users className="h-6 w-6 text-brand-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                    Suporte
                  </h3>
                  <p className="text-sm text-neutral-400">
                    Entre em contato conosco
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
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
