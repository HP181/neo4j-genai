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
    console.log("Embedding generated successfully:", response);
    return response.data[0].embedding
  } catch (error) {
    console.error("Error generating embedding:", error)
    throw new Error("Failed to generate embedding")
  }
}

export async function generateResponse(messages) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.2,
    })
    return completion.choices[0].message.content || "No response generated"
  } catch (error) {
    console.error("Error generating response:", error)
    throw new Error("Failed to generate response")
  }
}
