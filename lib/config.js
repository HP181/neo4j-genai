export const config = {
  neo4j: {
    uri: process.env.NEXT_PUBLIC_NEO4J_URI,
    user: process.env.NEXT_PUBLIC_NEO4J_USER,
    password: process.env.NEXT_PUBLIC_NEO4J_PASSWORD,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
}

// Validate that all required environment variables are set
function validateConfig() {
  const required = ["NEO4J_URI", "NEO4J_USER", "NEO4J_PASSWORD", "OPENAI_API_KEY"]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }
}

// Only validate on server side
if (typeof window === "undefined") {
  validateConfig()
}
