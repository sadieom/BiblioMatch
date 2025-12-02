import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [inputBook, setInputBook] = useState("Harry Potter and the Chamber of Secrets (Book 2)")
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleRecommend = async () => {
    setLoading(true)
    setError("")
    setRecommendations([])

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/recommend', {
        book_name: inputBook
      })

      // Check if the backend returned a "Book not found" message
      if (response.data[0] === "Book not found in database") {
        setError("Book not found! Try another one.")
      } else {
        setRecommendations(response.data)
      }
      
    } catch (err) {
      console.error(err)
      setError("Failed to connect to backend.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>BiblioMatch 📚</h1>
      <p>R&D Prototype: Collaborative Filtering</p>

      <div className="input-group">
        <label>Enter a Book Title (Exact Match Required):</label>
        <input 
          type="text" 
          value={inputBook}
          onChange={(e) => setInputBook(e.target.value)}
          style={{width: '300px', padding: '10px'}}
        />
        <button onClick={handleRecommend} disabled={loading}>
          {loading ? "Thinking..." : "Get Recommendations"}
        </button>
      </div>

      {error && <p style={{color: 'red'}}>{error}</p>}

      <div className="grid">
        {recommendations.map((book, index) => (
          <div key={index} className="card">
            <img src={book.image} alt={book.title} style={{width: '100px'}} />
            <p><strong>{book.title}</strong></p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App