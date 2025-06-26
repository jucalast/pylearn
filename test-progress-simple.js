#!/usr/bin/env node

// Teste simples das APIs usando curl
const { spawn } = require('child_process');

const BASE_URL = 'http://localhost:3002';

async function runCurl(method, endpoint, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const curlArgs = [
      '-X', method,
      '-H', 'Content-Type: application/json',
      '-H', 'Cookie: token=test-token',
      '-s'  // silent mode
    ];

    // Add custom headers
    Object.entries(headers).forEach(([key, value]) => {
      curlArgs.push('-H', `${key}: ${value}`);
    });

    // Add data for POST requests
    if (data) {
      curlArgs.push('-d', JSON.stringify(data));
    }

    curlArgs.push(`${BASE_URL}${endpoint}`);

    const curl = spawn('curl', curlArgs);
    let output = '';
    let error = '';

    curl.stdout.on('data', (data) => {
      output += data.toString();
    });

    curl.stderr.on('data', (data) => {
      error += data.toString();
    });

    curl.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          resolve({ error: 'Invalid JSON response', raw: output });
        }
      } else {
        reject(new Error(`Curl failed with code ${code}: ${error}`));
      }
    });
  });
}

async function testProgressAPIs() {
  console.log('🧪 TESTE SIMPLES DAS APIS DE PROGRESSO');
  console.log('=====================================');

  try {
    // 1. Testar API de learning profile
    console.log('\n📊 1. Testando GET /api/learning-profile...');
    
    const profileData = await runCurl('GET', '/api/learning-profile');
    
    if (profileData.error) {
      console.log('❌ Erro ao buscar perfil:', profileData.error);
      return;
    }

    if (profileData.profiles && profileData.profiles.length > 0) {
      const profile = profileData.profiles[0];
      const progress = profile.currentProgress;
      
      console.log('✅ Learning Profile encontrado');
      console.log(`📈 Progresso atual:`);
      console.log(`   - Módulo: ${progress?.currentModule || 'N/A'}`);
      console.log(`   - Lição: ${progress?.currentLesson || 'N/A'}`);
      console.log(`   - Lições completadas: ${progress?.completedLessons?.length || 0}`);
      console.log(`   - Progresso total: ${progress?.totalProgress || 0}%`);
      console.log(`   - XP: ${progress?.xpEarned || 0}`);
      
      // 2. Testar start_lesson
      console.log('\n🎯 2. Testando POST /api/proactive-teaching (start_lesson)...');
      
      const lessonData = await runCurl('POST', '/api/proactive-teaching', {
        action: 'start_lesson',
        userCode: 'print("Hello, World!")'
      });
      
      if (lessonData.success) {
        console.log('✅ Start lesson funcionando');
        console.log(`   - Tipo: ${lessonData.type}`);
        console.log(`   - Sucesso: ${lessonData.success}`);
        
        if (lessonData.data && lessonData.data.chatMessage) {
          console.log(`   - Mensagem IA: ${lessonData.data.chatMessage.substring(0, 100)}...`);
        }
      } else {
        console.log('❌ Erro no start_lesson:', lessonData.error);
      }
      
      // 3. Testar mark-completed
      console.log('\n✅ 3. Testando POST /api/learning-profile/mark-completed...');
      
      const completedData = await runCurl('POST', '/api/learning-profile/mark-completed', {
        module: progress?.currentModule || 1,
        lesson: progress?.currentLesson || 1,
        understanding: 'good'
      });
      
      if (completedData.success) {
        console.log('✅ Mark completed funcionando');
        console.log(`   - Sucesso: ${completedData.success}`);
        
        if (completedData.progress) {
          console.log(`   - Novo módulo: ${completedData.progress.currentModule}`);
          console.log(`   - Nova lição: ${completedData.progress.currentLesson}`);
          console.log(`   - Novo progresso: ${completedData.progress.progressPercentage}%`);
          console.log(`   - XP ganho: ${completedData.progress.xpEarned}`);
        }
      } else {
        console.log('❌ Erro no mark-completed:', completedData.error);
      }
      
    } else {
      console.log('❌ Nenhum perfil de aprendizado encontrado');
      console.log('💡 Crie um perfil primeiro acessando o dashboard e fazendo login');
    }
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
    
    if (error.message.includes('Connection refused') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 DICA: Certifique-se de que o servidor Next.js está rodando');
      console.log(`   Deveria estar em: ${BASE_URL}`);
    }
  }
  
  console.log('\n✨ Teste das APIs concluído!');
}

// Executar teste
testProgressAPIs();
