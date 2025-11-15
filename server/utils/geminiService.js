import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * Generate personalized AI suggestions for reducing carbon emissions
 * @param {Object} tenantData - Tenant and unit data
 * @returns {Promise<Array>} Array of suggestion objects
 */
export async function generateAISuggestions(tenantData) {
  // If no API key is configured, return empty array
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.log('Gemini API key not configured');
    return [];
  }
  
  if (!genAI) {
    console.log('Gemini AI client not initialized');
    return [];
  }
  
  console.log('Generating AI suggestions with Google Gemini API...');

  try {
    const {
      tenant,
      unit,
      summary,
      usageBreakdown
    } = tenantData;

    // Build context for the AI
    const context = `
You are an energy efficiency expert helping a tenant reduce their carbon emissions and save money on rent.

Tenant Information:
- Name: ${tenant.name}
- Unit: ${unit.id} (${unit.buildingType})
- Unit Size: ${unit.area} sqft
- Occupancy: ${unit.occupancy} ${unit.occupancy === 1 ? 'person' : 'people'}
- Medical Accommodation: ${unit.medicalFlag ? 'Yes' : 'No'}

Current Performance:
- Eco Score (CPI): ${summary.cpi}/100
- Current Monthly Emissions: ${summary.currentKgCO2e.toFixed(2)} kg CO₂e
- Monthly Quota: ${summary.quota.toFixed(2)} kg CO₂e
- Usage vs Quota: ${summary.progress.toFixed(1)}%
- Current Discount: ${(summary.discount * 100).toFixed(1)}%

Energy Breakdown:
- HVAC: ${usageBreakdown.hvac.toFixed(2)} kg CO₂e (${((usageBreakdown.hvac / summary.currentKgCO2e) * 100).toFixed(1)}%)
- Lighting: ${usageBreakdown.lights.toFixed(2)} kg CO₂e (${((usageBreakdown.lights / summary.currentKgCO2e) * 100).toFixed(1)}%)
- Water: ${usageBreakdown.water.toFixed(2)} kg CO₂e (${((usageBreakdown.water / summary.currentKgCO2e) * 100).toFixed(1)}%)
- Appliances: ${usageBreakdown.appliances.toFixed(2)} kg CO₂e (${((usageBreakdown.appliances / summary.currentKgCO2e) * 100).toFixed(1)}%)
- Other: ${usageBreakdown.other.toFixed(2)} kg CO₂e (${((usageBreakdown.other / summary.currentKgCO2e) * 100).toFixed(1)}%)

Generate 3-4 personalized, actionable suggestions to help this tenant reduce their emissions. Focus on:
1. The highest impact areas (largest percentage of emissions)
2. Specific, actionable steps they can take today
3. Realistic goals based on their current performance
4. Potential savings in both emissions and rent discount

Format each suggestion as a JSON object with:
- title: Short, catchy title (max 60 characters)
- description: Detailed explanation (2-3 sentences)
- category: One of: "HVAC", "Lighting", "Water", "Appliances", "Other", "Behavior"
- impact: Estimated emissions reduction in kg CO₂e/month
- difficulty: "Easy", "Medium", or "Hard"
- xp: XP reward (10-25 points)

Return ONLY a valid JSON array of suggestion objects, no other text.
`;

    // Get the Gemini model (using gemini-2.0-flash for best performance)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent(context);
    const response = await result.response;
    const responseText = response.text().trim();
    
    // Parse JSON response (handle potential markdown code blocks)
    let suggestions;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Response text:', responseText);
      return [];
    }

    // Validate and format suggestions
    if (!Array.isArray(suggestions)) {
      return [];
    }

    // Add unique IDs and ensure required fields
    return suggestions.map((suggestion, index) => ({
      id: `ai_suggestion_${Date.now()}_${index}`,
      title: suggestion.title || 'Energy Saving Tip',
      description: suggestion.description || '',
      category: suggestion.category || 'Other',
      impact: suggestion.impact || 0,
      difficulty: suggestion.difficulty || 'Medium',
      xp: suggestion.xp || 15,
      source: 'ai'
    }));

  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    console.error('Error details:', error.message);
    
    // Check for specific error types
    if (error.status === 429) {
      if (error.message?.includes('quota') || error.message?.includes('Quota')) {
        console.error('⚠️  Gemini API quota exceeded. Please check your billing and add credits to your Google Cloud account.');
      } else {
        console.error('⚠️  Gemini API rate limit exceeded. Please try again later.');
      }
    } else if (error.status === 401 || error.status === 403) {
      console.error('⚠️  Gemini API key is invalid or unauthorized. Please check your API key in server/.env');
    }
    
    // Return empty array on error (graceful degradation)
    return [];
  }
}

