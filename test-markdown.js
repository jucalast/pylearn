// Script para testar a renderização de Markdown no dashboard
// Para executar: node test-markdown.js

const testMarkdownContent = `
# Lição: Fundamentos do Python

Bem-vindo à sua primeira lição! Vamos começar com os **conceitos básicos** do Python.

## Variáveis

Em Python, você pode criar variáveis facilmente:

\`\`\`python
nome = "João"
idade = 25
altura = 1.75
\`\`\`

### Tipos de Dados

Python tem vários tipos de dados:

- **String**: Para textos como \`"Olá mundo"\`
- **Integer**: Para números inteiros como \`42\`
- **Float**: Para números decimais como \`3.14\`
- **Boolean**: Para valores verdadeiro/falso como \`True\` ou \`False\`

> **Dica**: Use \`type(variavel)\` para descobrir o tipo de uma variável!

## Próximos Passos

1. Pratique criando diferentes variáveis
2. Experimente usar \`print()\` para exibir valores
3. Teste o comando \`type()\` com suas variáveis

**Exercício**: Crie uma variável com seu nome e outra com sua idade, depois imprima ambas!

*Boa sorte com seus estudos!* 🚀
`

console.log('=== CONTEÚDO MARKDOWN PARA TESTE ===')
console.log(testMarkdownContent)
console.log('\n=== ESTE CONTEÚDO DEVE SER RENDERIZADO COM FORMATAÇÃO RICA NO DASHBOARD ===')
console.log('- Títulos em diferentes tamanhos')
console.log('- Texto em **negrito** e *itálico*')
console.log('- Listas com marcadores')
console.log('- Blocos de código com syntax highlighting')
console.log('- Citações em destaque')
console.log('- Links funcionais')
