# 🎓 PyLearn - Professor de Programação com IA

Uma aplicação web avançada que combina **Google Gemini AI** com interface híbrida de **chat + editor de código**, funcionando como um professor personalizado de programação que cria planos de estudo, ensina passo a passo e acompanha seu progresso.

## ✨ **Funcionalidades Completas Implementadas**

### � **Ensino Inteligente Estruturado**
- ✅ **Avaliação Automática**: IA avalia nível através de perguntas contextuais
- ✅ **Planos Personalizados**: IA cria planos detalhados com módulos e lições
- ✅ **Ensino Sequencial**: IA ensina seguindo plano estruturado passo a passo
- ✅ **Feedback Inteligente**: IA analisa código e dá feedback construtivo
- ✅ **Progresso Automático**: Sistema avança automaticamente conforme progresso

### 🎯 **Interface Híbrida (ChatGPT + VS Code)**
- ✅ **Chat Contextual**: IA conhece seu progresso e lição atual sempre
- ✅ **Editor Profissional**: Monaco Editor com syntax highlighting completo
- ✅ **Sincronização**: Chat e editor trabalham juntos simultaneamente
- ✅ **Execução**: Simula execução de código e mostra resultados
- ✅ **Responsivo**: Interface adaptável para desktop e mobile

### � **Sistema Completo de Progresso**
- ✅ **Plano Visual**: Interface mostra módulos, lições e objetivos
- ✅ **Tracking Real**: Progresso salvo automaticamente no banco
- ✅ **Continuidade**: IA sempre sabe onde você parou
- ✅ **Conquistas**: Sistema de marcos e milestones motivacionais

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática para JavaScript
- **Tailwind CSS** - Framework CSS utilitário
- **Monaco Editor** - Editor de código profissional
- **Lucide React** - Ícones modernos

### Backend
- **Next.js API Routes** - Backend integrado
- **Prisma ORM** - Object-Relational Mapping
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação baseada em tokens

### IA e Integração
- **Google Gemini AI** - Modelo de linguagem para ensino
- **bcryptjs** - Criptografia de senhas

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL 14+
- Chave da API do Google Gemini AI
- npm ou yarn

## 🚀 Instalação e Configuração

### 1. Instale as dependências
```bash
npm install
```

### 2. Configure as variáveis de ambiente
O arquivo `.env` já está configurado com as credenciais necessárias.

### 3. Configure o banco de dados
```bash
# Gerar o cliente Prisma
npx prisma generate

# Aplicar as migrações
npx prisma db push

# (Opcional) Visualizar o banco de dados
npx prisma studio
```

### 4. Execute a aplicação
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## Como Usar

1. **Registro**: Crie uma conta na página inicial
2. **Avaliação**: Responda às perguntas para que a IA determine seu nível
3. **Aprendizado**: Use o chat para tirar dúvidas e o editor para praticar
4. **Exercícios**: Gere exercícios personalizados e receba feedback instantâneo
5. **Progresso**: Acompanhe sua evolução através do sistema

## 🎯 Funcionalidades Implementadas

- ✅ Sistema de autenticação completo
- ✅ Avaliação de conhecimento com IA
- ✅ Chat inteligente com professor IA
- ✅ Editor de código integrado (Monaco Editor)
- ✅ Geração de exercícios personalizados
- ✅ Feedback automático de código
- ✅ Interface responsiva e moderna
- ✅ Banco de dados PostgreSQL com Prisma
- ✅ Sistema de perfis de aprendizado

Desenvolvido com ❤️ e IA para revolucionar o ensino de programação.
