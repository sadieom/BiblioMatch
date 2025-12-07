import { useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

function Search() {
  // --- STATE VARIABLES ---
  const [inputBook, setInputBook] = useState("") 
  const [recommendations, setRecommendations] = useState([]) 
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Modal State
  const [selectedBook, setSelectedBook] = useState(null)
  const [bookDescription, setBookDescription] = useState("")

  // --- 1. SAVE TO BOOKSHELF (Local Storage) ---
  const addToBookshelf = (book) => {
    const existing = JSON.parse(localStorage.getItem('myBookshelf')) || [];
    
    // Check for duplicates
    if (!existing.some(b => b.title === book.title)) {
        const updated = [...existing, book];
        localStorage.setItem('myBookshelf', JSON.stringify(updated));
        alert(`Saved "${book.title}" to your shelf!`);
    } else {
        alert("You already have this book saved!");
    }
  }

  // --- 2. SEARCH LOGIC (Call Flask) ---
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

      // Handle Errors vs Success
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

  // --- 3. FETCH BOOK DETAILS (Open Library API) ---
  const handleBookClick = async (book) => {
    setSelectedBook(book); // Open the modal immediately
    setBookDescription("Loading details from the archives..."); 
    
    try {
        // Step A: Get the specific 'Work' ID using the ISBN
        const response = await axios.get(`https://openlibrary.org/isbn/${book.isbn}.json`);
        // The API returns a 'works' array, we need the first key (e.g. "/works/OL12345W")
        const workId = response.data.works[0].key; 
        
        // Step B: Fetch the actual Description using the Work ID
        const workResponse = await axios.get(`https://openlibrary.org${workId}.json`);
        
        // Step C: extract description (sometimes it's a string, sometimes an object)
        let desc = workResponse.data.description;
        if (typeof desc === 'object' && desc.value) {
            desc = desc.value;
        }
        
        setBookDescription(desc || "No description available in the archives.");
        
    } catch (err) {
        console.error("Error fetching details:", err);
        setBookDescription("The archives are silent on this tome. (No description found)");
    }
  }

  const closeModal = () => {
    setSelectedBook(null);
    setBookDescription("");
  }

  // --- RENDER ---
  return (
    <div className="page-container">
      {/* NAVIGATION */}
      <nav className="navbar">
        <Link to="/" className="nav-link">← Back to Home</Link>
      </nav>

      <h1 className="small-title">Find Your Next Read</h1>

      {/* SEARCH FORM */}
      <form onSubmit={handleSearch} className="search-section">
        <div className="input-group">
          <input 
            type="text" 
            placeholder="e.g. The Hunger Games"
            value={inputBook}
            onChange={(e) => setInputBook(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Summon Books"}
          </button>
        </div>
      </form>

      {/* ERROR MESSAGE */}
      {error && <div className="error-message" style={{color: '#e74c3c'}}>{error}</div>}

      {/* RESULTS GRID */}
      {recommendations.length > 0 && (
        <div className="results-section">
          <div className="grid">
            {recommendations.map((book, index) => (
              <div key={index} className="card" onClick={() => handleBookClick(book)}>
                <img 
                  src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg?default=false`} 
                  alt={book.title}
                  onError={(e) => {
                    // Fallback logic: Open Library -> Goodreads Dataset -> Placeholder
                    if (book.original_img && e.target.src !== book.original_img) {
                        e.target.src = book.original_img;
                    } else {
                        e.target.onerror = null; 
                        e.target.src="https://placehold.co/150x240/2d2d2d/d4af37?text=No+Cover"
                    }
                  }}
                />
                <div className="card-info">
                  <h3>{book.title}</h3>
                  {/* StopPropagation prevents the Modal from opening when you just want to Save */}
                  <button 
                    className="save-btn" 
                    onClick={(e) => {
                        e.stopPropagation(); 
                        addToBookshelf(book);
                    }}
                  >
                    + Save to Shelf
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- BOOK DETAILS MODAL --- */}
      {selectedBook && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            
            <div className="modal-body">
              <div className="modal-image-container">
                 <img 
                   className="modal-image"
                   src={`https://covers.openlibrary.org/b/isbn/${selectedBook.isbn}-L.jpg?default=false`} 
                   alt={selectedBook.title}
                   onError={(e) => e.target.src=selectedBook.original_img || "https://placehold.co/300x450?text=No+Cover"}
                 />
              </div>
              
              <div className="modal-info">
                <h2 className="modal-title">{selectedBook.title}</h2>
                <p className="modal-meta">
                    Written by {selectedBook.author} <br/>
                    ISBN: {selectedBook.isbn}
                </p>
                
                <div className="modal-description">
                    {bookDescription}
                </div>

                <button 
                    className="cta-button" 
                    onClick={() => {
                        addToBookshelf(selectedBook);
                        closeModal();
                    }}
                >
                    + Add to Shelf
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Search