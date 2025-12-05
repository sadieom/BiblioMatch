import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  // --- STATE VARIABLES ---
  const [inputBook, setInputBook] = useState("") 
  const [recommendations, setRecommendations] = useState([]) 
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // --- THE SEARCH LOGIC ---
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!inputBook.trim()) return

    setLoading(true)
    setError("")
    setRecommendations([])

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/recommend', {
        book_name: inputBook
      })

      const data = response.data

      // Case 1: The backend returned an error string (e.g. "Book not found")
      if (Array.isArray(data) && typeof data[0] === "string") {
         setError("We couldn't find a book close to that title. Try checking the spelling!")
      } 
      // Case 2: The backend returned our "Found + Recommendations" object
      else if (data.found_title) {
        setRecommendations(data.recommendations)
      }

    } catch (err) {
      console.error(err)
      setError("Server connection failed. Is the Python backend running?")
    } finally {
      setLoading(false)
    }
  }

  // --- THE UI RENDER ---
  return (
    <div className="container">
      
      {/* HERO SECTION */}
      <header className="hero">
        <h1>BiblioMatch</h1>
        <p>Break your reading slump. Enter a book you loved to find your next obsession.</p>
      </header>

      {/* SEARCH FORM */}
      <form onSubmit={handleSearch} className="search-section">
        <div className="input-group">
          <input 
            type="text" 
            placeholder="e.g. The Great Gatsby"
            value={inputBook}
            onChange={(e) => setInputBook(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Discover"}
          </button>
        </div>
      </form>

      {/* ERROR MESSAGE */}
      {error && <div className="error-message" style={{color: '#8c2f39', marginTop: '1rem', fontWeight: 'bold'}}>{error}</div>}

      {/* RESULTS GRID */}
      {recommendations.length > 0 && (
        <div className="results-section">
          <p style={{marginTop: '2rem', fontSize: '0.9rem', color: '#888'}}>
            Based on your interest in <strong>{inputBook}</strong>...
          </p>
          
          <div className="grid">
            {recommendations.map((book, index) => (
              <div key={index} className="card">
                {/* DYNAMIC IMAGE FROM OPEN LIBRARY + FALLBACK */}
                <img 
                  src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg?default=false`} 
                  alt={book.title}
                  onError={(e) => {
                    // Try the backup image from the dataset first
                    if (book.original_img && e.target.src !== book.original_img) {
                        e.target.src = book.original_img;
                    } else {
                        // If that fails too, show placeholder
                        e.target.onerror = null; 
                        e.target.src="https://placehold.co/150x240?text=No+Cover"
                    }
                  }}
                />
                <div className="card-info">
                  <h3>{book.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
    </div>
  )
}

export default App