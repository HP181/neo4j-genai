"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export default function Home() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Neo4j + GenAI Movie Search</h1>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Ask about movies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
        <Button onClick={handleSearch} disabled={loading || !query.trim()}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      {error && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold mb-2">AI Answer:</h2>
            <p className="mb-4 whitespace-pre-wrap">{result.answer}</p>

            {result.movies && result.movies.length > 0 && (
              <>
                <h3 className="font-semibold mb-2">Relevant Movies:</h3>
                <ul className="list-disc ml-5 space-y-1">
                  {result.movies.map((m, idx) => (
                    <li key={idx}>
                      <strong>{m.title}</strong> ({m.released}) — {m.tagline}
                      {m.score && (
                        <span className="text-sm text-gray-500 ml-2">(Score: {(m.score * 100).toFixed(1)}%)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  )
}
