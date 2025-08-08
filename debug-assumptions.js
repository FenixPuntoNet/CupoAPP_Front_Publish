// Debug script to test assumptions functionality
// Run this in the browser console of your app

async function testAssumptions() {
  console.log('🔍 Testing Assumptions Functions...');
  
  try {
    // Test 1: Get current assumptions
    console.log('\n=== Test 1: Get Assumptions ===');
    const assumptions = await window.configService.getAssumptions();
    console.log('Assumptions result:', assumptions);
    
    if (assumptions) {
      console.log('✅ Urban price per km:', assumptions.urban_price_per_km);
      console.log('✅ Interurban price per km:', assumptions.interurban_price_per_km);
      console.log('✅ Price limit percentage:', assumptions.price_limit_percentage);
    } else {
      console.log('❌ No assumptions found');
    }
    
    // Test 2: Calculate urban price (20km)
    console.log('\n=== Test 2: Calculate Urban Price (20km) ===');
    const urbanResult = await window.configService.calculateSuggestedPrice('20 km');
    console.log('Urban calculation result:', urbanResult);
    
    if (urbanResult) {
      console.log('✅ Distance:', urbanResult.distance_km, 'km');
      console.log('✅ Is urban:', urbanResult.is_urban);
      console.log('✅ Price per km:', urbanResult.price_per_km);
      console.log('✅ Suggested price per seat:', urbanResult.suggested_price_per_seat);
    }
    
    // Test 3: Calculate interurban price (50km)
    console.log('\n=== Test 3: Calculate Interurban Price (50km) ===');
    const interurbanResult = await window.configService.calculateSuggestedPrice('50 km');
    console.log('Interurban calculation result:', interurbanResult);
    
    if (interurbanResult) {
      console.log('✅ Distance:', interurbanResult.distance_km, 'km');
      console.log('✅ Is urban:', interurbanResult.is_urban);
      console.log('✅ Price per km:', interurbanResult.price_per_km);
      console.log('✅ Suggested price per seat:', interurbanResult.suggested_price_per_seat);
      
      if (!interurbanResult.is_urban) {
        console.log('🎉 SUCCESS: Interurban trip correctly identified!');
      } else {
        console.log('❌ ERROR: 50km trip should be interurban, not urban');
      }
    }
    
    // Test 4: Ensure assumptions exist
    console.log('\n=== Test 4: Ensure Assumptions Exist ===');
    const ensuredAssumptions = await window.configService.ensureAssumptionsExist();
    console.log('Ensured assumptions result:', ensuredAssumptions);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Export functions to window for easy access
if (typeof window !== 'undefined') {
  // Import config service functions
  import('./src/services/config.js').then(configService => {
    window.configService = configService;
    window.testAssumptions = testAssumptions;
    
    console.log('🔧 Debug functions loaded. Run testAssumptions() to test.');
  }).catch(error => {
    console.error('Failed to load config service:', error);
  });
}

export { testAssumptions };
