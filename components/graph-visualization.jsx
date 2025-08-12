"use client"

import { useEffect, useRef } from "react"

export default function GraphVisualization({ movies }) {
  const svgRef = useRef()

  useEffect(() => {
    if (!movies || movies.length === 0) return

    // Clear previous content
    const svg = svgRef.current
    svg.innerHTML = ""

    const width = svg.clientWidth || 600
    const height = svg.clientHeight || 400

    // Create simple network visualization
    const nodes = movies.map((movie, i) => ({
      id: movie.title,
      x: Math.random() * (width - 100) + 50,
      y: Math.random() * (height - 100) + 50,
      radius: 20 + (movie.score || 0) * 30,
      movie,
    }))

    // Create SVG elements
    svg.setAttribute("width", width)
    svg.setAttribute("height", height)

    // Add nodes
    nodes.forEach((node) => {
      // Create circle for movie
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      circle.setAttribute("cx", node.x)
      circle.setAttribute("cy", node.y)
      circle.setAttribute("r", node.radius)
      circle.setAttribute("fill", "#3b82f6")
      circle.setAttribute("stroke", "#1e40af")
      circle.setAttribute("stroke-width", "2")
      circle.setAttribute("opacity", "0.8")
      svg.appendChild(circle)

      // Add movie title
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
      text.setAttribute("x", node.x)
      text.setAttribute("y", node.y + node.radius + 15)
      text.setAttribute("text-anchor", "middle")
      text.setAttribute("font-size", "12")
      text.setAttribute("fill", "#374151")
      text.textContent = node.movie.title
      svg.appendChild(text)

      // Add year
      const yearText = document.createElementNS("http://www.w3.org/2000/svg", "text")
      yearText.setAttribute("x", node.x)
      yearText.setAttribute("y", node.y + node.radius + 30)
      yearText.setAttribute("text-anchor", "middle")
      yearText.setAttribute("font-size", "10")
      yearText.setAttribute("fill", "#6b7280")
      yearText.textContent = `(${node.movie.released})`
      svg.appendChild(yearText)
    })
  }, [movies])

  return (
    <div className="w-full h-full">
      <svg ref={svgRef} className="w-full h-full border rounded" />
    </div>
  )
}
