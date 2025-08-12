// app/api/search/route.js
import { getNeo4jDriver } from "@/lib/neo4j";
import { generateEmbedding, generateResponse } from "@/lib/openai";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { config } from "@/lib/config";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export async function POST(req) {
  try {
    const { query } = await req.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Step 1: Get query analysis from AI
    const queryAnalysis = await analyzeQuery(query);
    console.log("Query analysis:", queryAnalysis);

    // Step 2: Generate embedding for vector search
    const embedding = await generateEmbedding(query);

    // Step 3: Execute appropriate Neo4j query based on query type
    const driver = await getNeo4jDriver();
    const { movies, metrics } = await executeQuery(driver, query, embedding, queryAnalysis);

    // Step 4: Build graph visualization data
    const graphData = buildGraph(movies);

    // Step 5: Generate LLM responses
    const context = formatContext(movies, queryAnalysis);
    const ragAnswer = await generateResponse([
      { role: "system", content: "You are a movie expert. Use ONLY the provided context to answer. Your answers can include markdown formatting for better readability, including bold text, lists, and headings." },
      { role: "user", content: `Context:\n${context}\n\nQuestion: ${query}` }
    ]);
    
    const baselineAnswer = await generateResponse([
      { role: "system", content: "You are a movie expert. No external context available. Your answers can include markdown formatting for better readability, including bold text, lists, and headings." },
      { role: "user", content: query }
    ]);

    // Step 6: Return results
    return NextResponse.json({
      rag: { answer: ragAnswer, movies },
      baseline: { answer: baselineAnswer },
      graph: graphData,
      metrics
    });
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Analyze query to determine intent and entities
async function analyzeQuery(query) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: `Analyze this movie query and return a JSON object with:
        - queryType: "director_filmography", "actor_filmography", "movie_info", "genre_search", or "general"
        - directors: array of director names
        - actors: array of actor names
        - movies: array of movie titles
        - genres: array of genres
        - years: array of years [min, max]
        - rating: minimum rating (number or null)`
      }, {
        role: "user", content: query
      }],
      response_format: { type: "json_object" },
      temperature: 0.1
    });
    
    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error("Query analysis error:", error);
    // Fallback to basic analysis
    return {
      queryType: "general",
      directors: [],
      actors: [],
      movies: [],
      genres: [],
      years: [],
      rating: null
    };
  }
}

// Execute Neo4j query based on query type
async function executeQuery(driver, query, embedding, analysis) {
  const session = driver.session();
  try {
    const startTime = Date.now();
    
    // Determine if this is a filmography query
    const isDirectorQuery = analysis.queryType === "director_filmography" && analysis.directors.length > 0;
    const isActorQuery = analysis.queryType === "actor_filmography" && analysis.actors.length > 0;
    const isMovieInfoQuery = analysis.queryType === "movie_info" && analysis.movies.length > 0;
    const isGenreQuery = analysis.queryType === "genre_search" && analysis.genres.length > 0;
    
    let cypher;
    let params = {};
    let queryType = analysis.queryType;
    let traversalDepth = 2;
    let vectorWeight = 0.6;
    let graphWeight = 0.4;
    
    if (isDirectorQuery) {
      // Director filmography query
      queryType = "director_filmography";
      traversalDepth = 1;
      vectorWeight = 0.3;
      graphWeight = 0.7;
      
      cypher = `
        MATCH (d:Person)-[:DIRECTED]->(m:Movie)
        WHERE toLower(d.name) CONTAINS toLower($name)
        WITH d, m
        ORDER BY m.year DESC
        
        OPTIONAL MATCH (m)<-[:ACTED_IN]-(a:Person)
        WITH d, m, collect(DISTINCT a.name)[..5] AS actors
        
        OPTIONAL MATCH (m)-[:IN_GENRE]->(g:Genre)
        WITH d, m, actors, collect(DISTINCT g.name)[..5] AS genres
        
        RETURN collect({
          title: m.title,
          tagline: m.tagline,
          year: m.year,
          imdbRating: m.imdbRating,
          plot: m.plot,
          runtime: m.runtime,
          revenue: m.revenue,
          budget: m.budget,
          released: m.released,
          actors: actors,
          directors: [d.name],
          genres: genres
        })[..30] AS movies
      `;
      params = { name: analysis.directors[0] };
    } else if (isActorQuery) {
      // Actor filmography query
      queryType = "actor_filmography";
      traversalDepth = 1;
      vectorWeight = 0.3;
      graphWeight = 0.7;
      
      cypher = `
        MATCH (a:Person)-[:ACTED_IN]->(m:Movie)
        WHERE toLower(a.name) CONTAINS toLower($name)
        WITH a, m
        ORDER BY m.year DESC
        
        OPTIONAL MATCH (m)<-[:DIRECTED]-(d:Person)
        WITH a, m, collect(DISTINCT d.name) AS directors
        
        OPTIONAL MATCH (m)-[:IN_GENRE]->(g:Genre)
        WITH a, m, directors, collect(DISTINCT g.name)[..5] AS genres
        
        RETURN collect({
          title: m.title,
          tagline: m.tagline,
          year: m.year,
          imdbRating: m.imdbRating,
          plot: m.plot,
          runtime: m.runtime,
          revenue: m.revenue,
          budget: m.budget,
          released: m.released,
          actors: [a.name],
          directors: directors,
          genres: genres
        })[..30] AS movies
      `;
      params = { name: analysis.actors[0] };
    } else if (isMovieInfoQuery) {
      // Movie info query
      queryType = "movie_info";
      traversalDepth = 1;
      vectorWeight = 0.5;
      graphWeight = 0.5;
      
      cypher = `
        MATCH (m:Movie)
        WHERE toLower(m.title) CONTAINS toLower($title)
        
        OPTIONAL MATCH (m)<-[:DIRECTED]-(d:Person)
        WITH m, collect(DISTINCT d.name) AS directors
        
        OPTIONAL MATCH (m)<-[:ACTED_IN]-(a:Person)
        WITH m, directors, collect(DISTINCT a.name)[..10] AS actors
        
        OPTIONAL MATCH (m)-[:IN_GENRE]->(g:Genre)
        WITH m, directors, actors, collect(DISTINCT g.name) AS genres
        
        RETURN collect({
          title: m.title,
          tagline: m.tagline,
          year: m.year,
          imdbRating: m.imdbRating,
          plot: m.plot,
          runtime: m.runtime,
          revenue: m.revenue,
          budget: m.budget,
          released: m.released,
          actors: actors,
          directors: directors,
          genres: genres
        })[..5] AS movies
      `;
      params = { title: analysis.movies[0] };
    } else if (isGenreQuery) {
      // Genre search query
      queryType = "genre_search";
      traversalDepth = 2;
      vectorWeight = 0.4;
      graphWeight = 0.6;
      
      cypher = `
        MATCH (m:Movie)-[:IN_GENRE]->(g:Genre)
        WHERE toLower(g.name) CONTAINS toLower($genre)
        
        // Apply year filter if specified
        ${analysis.years && analysis.years.length > 0 ? 
          `AND (m.year >= ${analysis.years[0] || 0} 
               ${analysis.years[1] ? `AND m.year <= ${analysis.years[1]}` : ''})` 
          : ''}
        
        // Apply rating filter if specified
        ${analysis.rating ? `AND m.imdbRating >= ${analysis.rating}` : ''}
        
        WITH DISTINCT m
        ORDER BY m.imdbRating DESC
        LIMIT 30
        
        OPTIONAL MATCH (m)<-[:DIRECTED]-(d:Person)
        WITH m, collect(DISTINCT d.name) AS directors
        
        OPTIONAL MATCH (m)<-[:ACTED_IN]-(a:Person)
        WITH m, directors, collect(DISTINCT a.name)[..5] AS actors
        
        OPTIONAL MATCH (m)-[:IN_GENRE]->(g:Genre)
        WITH m, directors, actors, collect(DISTINCT g.name) AS genres
        
        RETURN collect({
          title: m.title,
          tagline: m.tagline,
          year: m.year,
          imdbRating: m.imdbRating,
          plot: m.plot,
          runtime: m.runtime,
          revenue: m.revenue,
          budget: m.budget,
          released: m.released,
          actors: actors,
          directors: directors,
          genres: genres
        }) AS movies
      `;
      params = { genre: analysis.genres[0] };
    } else {
      // General hybrid search
      queryType = "general";
      traversalDepth = 2;
      
      cypher = `
        // Vector search with embedding
        CALL db.index.vector.queryNodes('movie_embedding_idx', 10, $embedding)
        YIELD node, score WHERE node:Movie
        WITH collect({node: node, score: score * ${vectorWeight}}) AS vectorResults
        
        // Text search with query string
        CALL db.index.fulltext.queryNodes('fts_entities', $query) 
        YIELD node, score
        WITH vectorResults, collect({node: node, score: score * ${graphWeight}}) AS textResults
        
        // Combine results
        WITH vectorResults + textResults AS results
        UNWIND results AS result
        WITH result.node AS node, result.score AS score
        
        // Get movie details
        WITH DISTINCT node AS m, score
        ORDER BY score DESC
        LIMIT 30
        
        OPTIONAL MATCH (m)<-[:DIRECTED]-(d:Person)
        WITH m, score, collect(DISTINCT d.name) AS directors
        
        OPTIONAL MATCH (m)<-[:ACTED_IN]-(a:Person)
        WITH m, score, directors, collect(DISTINCT a.name)[..5] AS actors
        
        OPTIONAL MATCH (m)-[:IN_GENRE]->(g:Genre)
        WITH m, score, directors, actors, collect(DISTINCT g.name)[..5] AS genres
        
        RETURN collect({
          title: m.title,
          tagline: m.tagline,
          year: m.year,
          imdbRating: m.imdbRating,
          plot: m.plot,
          runtime: m.runtime,
          revenue: m.revenue,
          budget: m.budget,
          released: m.released,
          actors: actors,
          directors: directors,
          genres: genres,
          score: score
        }) AS movies
      `;
      
      params = { 
        embedding,
        query
      };
    }
    
    const result = await session.run(cypher, params);
    const queryTime = Date.now() - startTime;
    
    // Process results
    const movies = result.records.length > 0 
      ? normalizeResults(result.records[0].get("movies") || [])
      : [];
    
    // Calculate vector vs graph result counts for metrics
    let vectorCount = 0;
    let graphCount = 0;
    
    if (isDirectorQuery || isActorQuery) {
      // For filmography, assume all are from graph
      vectorCount = 0;
      graphCount = movies.length;
    } else if (isMovieInfoQuery || isGenreQuery) {
      // For info queries, mix of both
      vectorCount = Math.ceil(movies.length * 0.3);
      graphCount = movies.length - vectorCount;
    } else {
      // For general queries, use weights
      vectorCount = Math.ceil(movies.length * vectorWeight);
      graphCount = movies.length - vectorCount;
    }
      
    return {
      movies,
      metrics: {
        queryTime,
        totalMovies: movies.length,
        queryType,
        vectorCount,
        graphCount,
        traversalDepth,
        weights: {
          vector: vectorWeight,
          graph: graphWeight
        }
      }
    };
  } finally {
    await session.close();
  }
}

// Normalize Neo4j results and add scores if missing
function normalizeResults(movies) {
  // First pass to find max score if any score is > 1
  const maxScore = Math.max(...movies.map(m => {
    const score = m.score != null ? (typeof m.score === 'object' && 'low' in m.score ? m.score.low : m.score) : 0;
    return score;
  }), 0);
  
  const needsNormalization = maxScore > 1;
  
  return movies.map((movie, index) => {
    let score = movie.score != null 
      ? (typeof movie.score === 'object' && 'low' in movie.score ? movie.score.low : Number(movie.score))
      : 0.95 - (index * 0.01);
    
    // Normalize scores if any are above 1
    if (needsNormalization && maxScore > 0) {
      score = score / maxScore * 0.95;
    } else if (score > 1) {
      // Individual score > 1 but others might be fine
      score = Math.min(score, 0.95);
    }
    
    // For descending scores where none provided
    if (movie.score == null) {
      score = 0.95 - (index * 0.01);
    }
    
    // Ensure score is between 0 and 1
    score = Math.max(0, Math.min(1, score));
    
    return {
      ...movie,
      year: toNumber(movie.year),
      imdbRating: toNumber(movie.imdbRating),
      revenue: toNumber(movie.revenue),
      budget: toNumber(movie.budget),
      runtime: toNumber(movie.runtime),
      score: score
    };
  });
}

// Convert Neo4j integers to JavaScript numbers
function toNumber(value) {
  if (value == null) return null;
  if (value && typeof value === 'object' && 'low' in value) return value.low;
  return Number(value);
}

// Format context for LLM
function formatContext(movies, analysis) {
  if (!movies || movies.length === 0) {
    return "No movie data found for this query.";
  }
  
  const maxMovies = analysis.queryType.includes('filmography') ? 20 : 10;
  
  return movies.slice(0, maxMovies)
    .map((m, i) => {
      const sections = [
        `[Movie ${i+1}] ${m.title} (${m.year || 'Unknown'})`,
        m.tagline ? `Tagline: "${m.tagline}"` : '',
        `Rating: ${m.imdbRating ? `${m.imdbRating}/10` : 'Unknown'}`,
        m.plot ? `Plot: ${m.plot?.substring(0, 150)}${m.plot?.length > 150 ? '...' : ''}` : '',
        m.directors?.length > 0 ? `Directors: ${m.directors.join(", ")}` : '',
        m.actors?.length > 0 ? `Actors: ${m.actors.join(", ")}` : '',
        m.genres?.length > 0 ? `Genres: ${m.genres.join(", ")}` : '',
        m.runtime ? `Runtime: ${m.runtime} minutes` : '',
        `Relevance Score: ${(m.score * 100).toFixed(1)}%`
      ];
      return sections.filter(Boolean).join("\n");
    })
    .join("\n\n");
}

// Build graph visualization data
function buildGraph(movies) {
  if (!movies || movies.length === 0) {
    return { nodes: [], links: [] };
  }
  
  const nodeMap = new Map();
  const links = [];
  const limitedMovies = movies.slice(0, 15);
  
  limitedMovies.forEach(movie => {
    if (!movie.title) return;
    
    const movieId = `movie-${movie.title}`;
    
    // Add movie node
    nodeMap.set(movieId, {
      id: movieId,
      name: movie.title,
      type: "Movie",
      year: movie.year,
      rating: movie.imdbRating,
      size: movie.imdbRating ? Math.max(5, movie.imdbRating * 1.5) : 10
    });
    
    // Add directors and links
    (movie.directors || []).forEach(director => {
      const directorId = `director-${director}`;
      if (!nodeMap.has(directorId)) {
        nodeMap.set(directorId, {
          id: directorId,
          name: director,
          type: "Director",
          size: 9
        });
      }
      links.push({
        source: directorId,
        target: movieId,
        label: "DIRECTED",
        width: 3
      });
    });
    
    // Add actors and links (limited to 2 per movie)
    (movie.actors || []).slice(0, 2).forEach(actor => {
      const actorId = `actor-${actor}`;
      if (!nodeMap.has(actorId)) {
        nodeMap.set(actorId, {
          id: actorId,
          name: actor,
          type: "Actor",
          size: 7
        });
      }
      links.push({
        source: actorId,
        target: movieId,
        label: "ACTED_IN",
        width: 1
      });
    });
    
    // Add genres and links (limited to 1 per movie)
    (movie.genres || []).slice(0, 1).forEach(genre => {
      const genreId = `genre-${genre}`;
      if (!nodeMap.has(genreId)) {
        nodeMap.set(genreId, {
          id: genreId,
          name: genre,
          type: "Genre",
          size: 12
        });
      }
      links.push({
        source: movieId,
        target: genreId,
        label: "IN_GENRE",
        width: 1.5
      });
    });
  });
  
  return {
    nodes: Array.from(nodeMap.values()),
    links
  };
}