import { useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

function Search() {
  const [inputBook, setInputBook] = useState("") 
  const [recommendations, setRecommendations] = useState([]) 
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // --- SAVE TO LOCAL STORAGE (The Bookshelf Logic) ---
  const addToBookshelf = (book) => {
    // 1. Get existing books
    const existing = JSON.parse(localStorage.getItem('myBookshelf')) || [];
    // 2. Add new book (if not already there)
    if (!existing.some(b => b.title === book.title)) {
        const updated = [...existing, book];
        localStorage.setItem('myBookshelf', JSON.stringify(updated));
        alert(`Saved "${book.title}" to your shelf!`);
    } else {
        alert("You already have this book saved!");
    }
  }

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

      if (Array.isArray(data) && typeof data[0] === "string") {
         setError("We couldn't find a book close to that title. Check spelling!")
      } else if (data.found_title) {
        setRecommendations(data.recommendations)
      }
    } catch (err) {
      console.error(err)
      setError("Server connection failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <nav className="navbar">
        <Link to="/" className="nav-link">← Back to Home</Link>
      </nav>

      <h1 className="small-title">Find Your Next Read</h1>

      <form onSubmit={handleSearch} className="search-section">
        <div className="input-group">
          <input 
            type="text" 
            placeholder="e.g. The Hobbit"
            value={inputBook}
            onChange={(e) => setInputBook(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Summon Books"}
          </button>
        </div>
      </form>

      {error && <div className="error-message">{error}</div>}

      {recommendations.length > 0 && (
        <div className="results-section">
          <div className="grid">
            {recommendations.map((book, index) => (
              <div key={index} className="card">
                <img 
                  src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg?default=false`} 
                  alt={book.title}
                  onError={(e) => {
                    // 1. If Open Library fails, try the Goodreads URL from the dataset
                    if (book.original_img && e.target.src !== book.original_img) {
                        e.target.src = book.original_img;
                    } else {
                        // 2. If that fails too, show the text placeholder
                        e.target.onerror = null; 
                        e.target.src="https://placehold.co/150x240/2d2d2d/d4af37?text=No+Cover"
                    }
                  }}
                />
                <div className="card-info">
                  <h3>{book.title}</h3>
                  {/* NEW SAVE BUTTON */}
                  <button 
                    className="save-btn" 
                    onClick={() => addToBookshelf(book)}
                  >
                    + Save to Shelf
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Search