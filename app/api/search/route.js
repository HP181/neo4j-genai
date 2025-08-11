// app/api/search/route.ts
import { getNeo4jDriver } from "@/lib/neo4j";
import { generateEmbedding, generateResponse } from "@/lib/openai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { query } = await req.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // 1) embedding
    const queryEmbedding = await generateEmbedding(query);
    console.log("Generated query embedding:", queryEmbedding);
    console.log("Generated query embedding length", queryEmbedding.length);

    // 2) neo4j query
    const driver = await getNeo4jDriver();               // ← await
    const session = driver.session({                     // set DB if needed
      database: process.env.NEO4J_DATABASE || "neo4j",
    });

    try {
      const cypher = `
        WITH $embedding AS embedding
        MATCH (m:Movie)
        WHERE m.embedding IS NOT NULL
        WITH m, gds.similarity.cosine(m.embedding, embedding) AS score
        ORDER BY score DESC
        LIMIT 5
        RETURN m { .title, .tagline, .released, score: score } AS m
      `;
      const result = await session.run(cypher, { embedding: queryEmbedding });
      const movies = result.records.map(r => r.get("m"));

      const context = movies
        .map(m => `${m.title} (${m.released}): ${m.tagline}`)
        .join("\n");

      const messages = [
        { role: "system", content: "You are a movie expert..." },
        { role: "user", content: `Based on these movies:\n${context}\n\nAnswer: ${query}` },
      ];
      const answer = await generateResponse(messages);

      return NextResponse.json({ answer, movies });
    } finally {
      await session.close();
    }
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "An error occurred while processing your request" }, { status: 500 });
  }
}
