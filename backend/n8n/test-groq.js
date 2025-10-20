/**
 * TEST GROQ TRANSLATION SERVICE
 */

const { detectLanguage, translateArticle } = require('./translation-service');

async function testGroq() {
  console.log('🧪 TEST GROQ TRANSLATION SERVICE');
  console.log('=====================================');
  
  const testText = "How to fix Windows errors and troubleshooting guides";
  
  try {
    // Test détection langue
    console.log('🔍 Test détection langue...');
    const detectedLang = await detectLanguage(testText);
    console.log(`✅ Langue détectée: ${detectedLang}`);
    
    // Test traduction
    console.log('🔄 Test traduction...');
    const translatedText = await translateArticle(testText, 'en', 'fr');
    console.log(`✅ Traduction: ${translatedText}`);
    
  } catch (error) {
    console.error('❌ Erreur test Groq:', error.message);
    if (error.response) {
      console.error('📄 Réponse API:', error.response.data);
    }
  }
}

testGroq();