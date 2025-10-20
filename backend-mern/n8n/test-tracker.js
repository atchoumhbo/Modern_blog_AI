/**
 * TEST DU SYSTÈME DE TRACKING REDDIT
 */

const RedditTracker = require('./reddit-tracker');

async function testTracker() {
  console.log('🧪 TEST REDDIT TRACKER');
  console.log('======================');
  
  const tracker = new RedditTracker();
  
  try {
    // Test posts factices
    const testPosts = [
      {
        id: 'test1',
        title: 'How to debug JavaScript errors',
        subreddit: 'r/AskProgramming',
        url: 'https://reddit.com/r/AskProgramming/test1'
      },
      {
        id: 'test2', 
        title: 'Python best practices for beginners',
        subreddit: 'r/learnpython',
        url: 'https://reddit.com/r/learnpython/test2'
      }
    ];

    // 1. Vérifier posts non traités (première fois)
    console.log('\n🔍 Test 1: Posts non traités');
    let unprocessed = await tracker.filterUnprocessedPosts(testPosts);
    console.log(`Résultat: ${unprocessed.length}/${testPosts.length} posts non traités`);

    // 2. Marquer le premier comme traité
    console.log('\n✅ Test 2: Marquer post comme traité');
    await tracker.markPostAsProcessed(testPosts[0], { fr: 100, en: 101 });

    // 3. Vérifier à nouveau
    console.log('\n🔍 Test 3: Vérification après marquage');
    unprocessed = await tracker.filterUnprocessedPosts(testPosts);
    console.log(`Résultat: ${unprocessed.length}/${testPosts.length} posts non traités`);

    // 4. Statistiques
    console.log('\n📊 Test 4: Statistiques');
    const stats = await tracker.getStats();
    console.log('Statistiques:', stats);

  } catch (error) {
    console.error('❌ Erreur test:', error.message);
  } finally {
    tracker.close();
  }
}

testTracker();