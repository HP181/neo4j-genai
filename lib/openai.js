// lib/openai.js
import OpenAI from "openai"
import { config } from "./config.js"

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
})

export async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    })
    console.log("Embedding generated successfully")
    return response.data[0].embedding
  } catch (error) {
    console.error("Error generating embedding:", error)
    throw new Error("Failed to generate embedding")
  }
}

export async function generateResponse(messages, options = {}) {
  const { temperature = 0.2, maxTokens = 1000 } = options
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature,
      max_tokens: maxTokens,
    })
    return completion.choices[0].message.content || "No response generated"
  } catch (error) {
    console.error("Error generating response:", error)
    throw new Error("Failed to generate response")
  }
}

/**
 * Analyzes the query to determine user intent and query characteristics
 * @param {string} query - User's search query
 * @returns {Promise<string[]>} - Array of intent categories
 */
export async function analyzeQueryIntent(query) {
  // Keywords based analysis
  const intents = []
  
  // Check for factual intent
  if (/\b(what is|who is|when|where|facts|information|details about|tell me about)\b/i.test(query)) {
    intents.push('factual')
  }
  
  // Check for recommendation intent
  if (/\b(recommend|suggestion|similar to|like|good|best|top|great)\b/i.test(query)) {
    intents.push('recommendation')
  }
  
  // Check for comparison intent
  if (/\b(compare|versus|vs|difference|better|worse|against)\b/i.test(query)) {
    intents.push('comparison')
  }
  
  // Check for thematic intent
  if (/\b(theme|style|mood|tone|aesthetic|cinematography|visual|thematic|artistic)\b/i.test(query)) {
    intents.push('thematic')
  }
  
  // Check for explore intent
  if (/\b(explore|browse|find|search|discover)\b/i.test(query)) {
    intents.push('explore')
  }
  
  // Check for connection intent
  if (/\b(connect|relationship|between|link|common|shared|worked with|collaborated|together)\b/i.test(query)) {
    intents.push('connections')
  }
  
  // Check for temporal intent
  if (/\b(year|decade|era|period|century|recent|old|classic|modern|contemporary)\b/i.test(query) || 
      /\b(19\d0s|20\d0s|\d{4})\b/i.test(query)) {
    intents.push('temporal')
  }
  
  // Use API if keyword detection found nothing or for more complex queries
  if (intents.length === 0 || query.length > 50) {
    try {
      const messages = [
        {
          role: "system",
          content: `Analyze the movie search query and identify the user's intent categories.
Return ONLY an array of intent categories as a JSON array with NO additional text.
Choose from these categories (include ALL that apply):
- factual (seeking specific facts about movies, directors, actors, etc.)
- recommendation (looking for movie suggestions)
- comparison (wanting to compare movies, directors, actors, etc.)
- thematic (interested in themes, motifs, or style)
- explore (broadly exploring a category or genre)
- discover (looking to find new or lesser-known content)
- financial (interested in budget, box office, or commercial aspects)
- connections (looking for relationships between entities)
- temporal (focused on time periods, eras, or years)
- technical (interested in production details, techniques)
- critical (focused on reviews, reception, or ratings)
- biographical (interested in details about people)

Example responses:
["recommendation", "thematic", "explore"]
["factual", "financial", "temporal"]
["connections", "biographical"]`
        },
        {
          role: "user",
          content: query
        }
      ]
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
      
      const responseText = completion.choices[0].message.content || "[]"
      
      // Parse the JSON array and handle any potential errors
      try {
        const parsed = JSON.parse(responseText)
        const apiIntents = Array.isArray(parsed) ? parsed : (parsed.categories || [])
        
        // Merge with keyword-detected intents and remove duplicates
        const combinedIntents = [...new Set([...intents, ...apiIntents])]
        
        console.log("Intent analysis successful:", combinedIntents)
        return combinedIntents
      } catch (e) {
        console.error("Error parsing intent categories:", e)
        // Use regex as fallback if JSON parsing fails
        const matches = responseText.match(/\[(.*?)\]/s)
        if (matches && matches[1]) {
          const apiIntents = matches[1]
            .split(',')
            .map(s => s.trim().replace(/"/g, ''))
            .filter(Boolean)
          
          // Merge with keyword-detected intents and remove duplicates
          const combinedIntents = [...new Set([...intents, ...apiIntents])]
          
          return combinedIntents
        }
      }
    } catch (error) {
      console.error("Error analyzing query intent with API:", error)
      // Fall back to keyword-based intents
    }
  }
  
  // If we have no intents (API failed and no keywords matched), add default
  if (intents.length === 0) {
    intents.push("recommendation")
  }
  
  console.log("Intent analysis (keyword-based):", intents)
  return intents
}