// app/api/search/route.js
import { getNeo4jDriver } from "@/lib/neo4j"
import { generateEmbedding, generateResponse } from "@/lib/openai"
import { NextResponse } from "next/server"

// ——— simple optional constraint parser ———
function parseConstraints(q) {
  const quoted = [...q.matchAll(/"([^"]+)"/g)].map(m => m[1]) // names in quotes
  const knownGenres = ["Action", "Drama", "Comedy", "Thriller", "Sci-Fi", "Romance", "Crime", "Fantasy", "War", "Adventure", "Animation", "Mystery", "Documentary"]
  const byGenre = knownGenres.filter(g => new RegExp(`\\b${g}\\b`, "i").test(q))
  return { byActor: quoted, byDirector: [], byGenre }
}

// ——— sanitize fulltext query for Lucene (unbalanced quotes & special chars) ———
function sanitizeFulltext(q) {
  let s = q.replace(/[“”]/g, '"') // normalize smart quotes
  const quotes = (s.match(/"/g) || []).length
  if (quotes % 2 === 1) s = s.replace(/"/g, "") // drop all quotes if unbalanced
  s = s.replace(/(\&\&)|(\|\|)/g, " ")
  s = s.replace(/[+\-!(){}\[\]^~*?:\\\/]/g, " ")
  s = s.replace(/\s+/g, " ").trim()
  return s
}

export async function POST(req) {
  try {
    const { query } = await req.json()
    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // 1) Embed the user query (for vector KNN on Movie.embedding)
    const embedding = await generateEmbedding(query)
    const { byActor, byDirector, byGenre } = parseConstraints(query)
    const qfts = sanitizeFulltext(query) // sanitized fulltext string

    // 2) Hybrid retrieval
    const driver = await getNeo4jDriver()
    const session = driver.session({ database: process.env.NEO4J_DATABASE || "neo4j" })

    let movies = []
    let entities = []
    let graphData = { nodes: [], links: [] }

    try {
      const cypher = `
// params: $embedding, $qfts, $k, $byActor, $byDirector, $byGenre, $minYear, $minRating

// (A) Seeds: vector on movies + fulltext on all
CALL db.index.vector.queryNodes('movie_embedding_idx', coalesce($k,12), $embedding)
YIELD node, score
WITH collect({seed: node, src:'vector', rawScore: score}) AS vSeeds

CALL db.index.fulltext.queryNodes('fts_entities', $qfts) YIELD node, score
WITH vSeeds, collect({seed: node, src:'fulltext', rawScore: score}) AS fSeeds

// (B) Merge + squash scores (fulltext -> score/(score+1))
WITH vSeeds + fSeeds AS seeds
UNWIND seeds AS s
WITH s.seed AS seed,
     (CASE WHEN s.src='vector' THEN s.rawScore ELSE s.rawScore/(s.rawScore+1.0) END) AS score
ORDER BY score DESC
WITH collect({entity: seed, score: score})[..15] AS topSeeds

// (C1) Return seed ENTITIES with ALL properties
CALL {
  WITH topSeeds
  UNWIND topSeeds AS ts
  WITH ts.entity AS e, ts.score AS score
  RETURN collect({
    labels: labels(e),
    id: id(e),
    name: coalesce(e.title, e.name),
    props: properties(e),
    score: score
  }) AS entities
}

// (C2) Also build MOVIES for RAG context (bounded, lightweight)
CALL {
  WITH topSeeds
  UNWIND topSeeds AS ts
  WITH ts.entity AS seed, ts.score AS score
  OPTIONAL MATCH (seed)-[]-(nbr:Movie)
  WITH seed, score, collect(DISTINCT nbr)[..5] AS ms
  WITH (CASE WHEN seed:Movie THEN [seed] ELSE ms END) AS movies, score
  UNWIND movies AS m
  WITH m, max(score) AS seedScore
  OPTIONAL MATCH (m)<-[:ACTED_IN]-(a:Person)
  WITH m, seedScore, collect(DISTINCT a.name)[..5] AS actors
  OPTIONAL MATCH (m)<-[:DIRECTED]-(d:Person)
  WITH m, seedScore, actors, collect(DISTINCT d.name)[..3] AS directors
  OPTIONAL MATCH (m)-[:IN_GENRE]->(g:Genre)
  WITH m, seedScore, actors, directors, collect(DISTINCT g.name)[..3] AS genres
  WHERE ($byActor    = [] OR any(x IN $byActor    WHERE x IN actors))
    AND ($byDirector = [] OR any(x IN $byDirector WHERE x IN directors))
    AND ($byGenre    = [] OR any(x IN $byGenre    WHERE x IN genres))
    AND ($minYear    IS NULL OR m.year >= $minYear)
    AND ($minRating  IS NULL OR coalesce(m.imdbRating,0.0) >= $minRating)
  RETURN collect(DISTINCT m {
    .title, .tagline, .released, .imdbRating, .year, .revenue, .budget,
    actors: actors, directors: directors, genres: genres,
    score: seedScore
  })[..12] AS movies
}

RETURN entities, movies;
      `

      const res = await session.run(cypher, {
        embedding,
        qfts,
        k: 12,
        byActor,
        byDirector,
        byGenre,
        minYear: null,
        minRating: null
      })

      if (res.records.length > 0) {
        const row = res.records[0]
        entities = row.get("entities") || []
        movies = row.get("movies") || []
      }

      // Build graph data (from movies)
      const nodeSet = new Map()
      const linkList = []
      movies.forEach((m) => {
        const mid = `movie-${m.title}`
        if (!nodeSet.has(mid)) nodeSet.set(mid, { id: mid, name: m.title, type: "Movie" })

        ;(m.actors || []).forEach((actor) => {
          const id = `actor-${actor}`
          if (!nodeSet.has(id)) nodeSet.set(id, { id, name: actor, type: "Actor" })
          linkList.push({ source: id, target: mid, label: "ACTED_IN" })
        })

        ;(m.directors || []).forEach((dir) => {
          const id = `director-${dir}`
          if (!nodeSet.has(id)) nodeSet.set(id, { id, name: dir, type: "Director" })
          linkList.push({ source: id, target: mid, label: "DIRECTED" })
        })

        ;(m.genres || []).forEach((genre) => {
          const id = `genre-${genre}`
          if (!nodeSet.has(id)) nodeSet.set(id, { id, name: genre, type: "Genre" })
          linkList.push({ source: mid, target: id, label: "IN_GENRE" })
        })
      })

      graphData = { nodes: Array.from(nodeSet.values()), links: linkList }
    } finally {
      await session.close()
    }

    // 3) RAG Answer (context strictly from graph facts we just fetched)
    const context = movies
      .map((m) => {
        const facts = [
          `Title: ${m.title}`,
          m.year ? `Year: ${m.year}` : "",
          m.released ? `Released: ${m.released}` : "",
          m.imdbRating ? `IMDb: ${m.imdbRating}` : "",
          m.tagline ? `Tagline: ${m.tagline}` : "",
          m.revenue != null ? `Revenue: ${m.revenue}` : "",
          m.budget != null ? `Budget: ${m.budget}` : "",
          m.actors?.length ? `Actors: ${m.actors.join(", ")}` : "",
          m.directors?.length ? `Directors: ${m.directors.join(", ")}` : "",
          m.genres?.length ? `Genres: ${m.genres.join(", ")}` : ""
        ].filter(Boolean).join("\n")
        return facts
      })
      .join("\n\n")

    const ragMessages = [
      { role: "system", content: "You are a careful movie expert. Use ONLY the provided context; if missing, say you don't know." },
      { role: "user", content: `Context:\n${context}\n\nQuestion: ${query}` }
    ]
    const ragAnswer = await generateResponse(ragMessages)

    // 4) Baseline Answer (no context)
    const baselineMessages = [
      { role: "system", content: "You are a knowledgeable movie expert. No external context available." },
      { role: "user", content: query }
    ]
    const baselineAnswer = await generateResponse(baselineMessages)

    // 5) Return both + graph data (+ entities for raw properties)
    return NextResponse.json({
      rag: { answer: ragAnswer, movies },
      baseline: { answer: baselineAnswer },
      graph: graphData,
      entities // <- full properties for matched nodes of any label
    })
  } catch (err) {
    console.error("API Error:", err)
    return NextResponse.json({ error: "An error occurred while processing your request" }, { status: 500 })
  }
}
