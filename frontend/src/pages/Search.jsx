import { useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

function Search() {
  const [inputBook, setInputBook] = useState("") 
  const [recommendations, setRecommendations] = useState([]) 
  const [searchedBook, setSearchedBook] = useState(null) // NEW: Stores the book you looked for
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Modal State
  const [selectedBook, setSelectedBook] = useState(null)
  const [bookDescription, setBookDescription] = useState("")

  // --- SAVE TO SHELF ---
  const addToBookshelf = (book) => {
    const existing = JSON.parse(localStorage.getItem('myBookshelf')) || [];
    if (!existing.some(b => b.title === book.title)) {
        const updated = [...existing, book];
        localStorage.setItem('myBookshelf', JSON.stringify(updated));
        alert(`Saved "${book.title}" to your shelf!`);
    } else {
        alert("You already have this book saved!");
    }
  }

  // --- SEARCH ---
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!inputBook.trim()) return

    setLoading(true)
    setError("")
    setRecommendations([])
    setSearchedBook(null)

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/recommend', {
        book_name: inputBook
      })
      const data = response.data

      if (Array.isArray(data) && typeof data[0] === "string") {
         setError("We couldn't find a book close to that title. Check spelling!")
      } else if (data.found_book) {
        setSearchedBook(data.found_book) // Set the found book
        setRecommendations(data.recommendations) // Set the neighbors
      }
    } catch (err) {
      console.error(err)
      setError("Server connection failed.")
    } finally {
      setLoading(false)
    }
  }

  // --- FETCH DESCRIPTION (The Fix) ---
  const handleBookClick = async (book) => {
    setSelectedBook(book);
    setBookDescription("Consulting the archives..."); 
    
    try {
        let workId = null;

        // STRATEGY A: Try to find Work ID via ISBN
        try {
            const isbnRes = await axios.get(`https://openlibrary.org/isbn/${book.isbn}.json`);
            if (isbnRes.data.works && isbnRes.data.works.length > 0) {
                workId = isbnRes.data.works[0].key;
            }
        } catch (e) {
            console.log("ISBN lookup failed, switching to Title Search...");
        }

        // STRATEGY B: If ISBN failed, Search by Title (Fallback)
        if (!workId) {
            const searchRes = await axios.get(`https://openlibrary.org/search.json?title=${encodeURIComponent(book.title)}&limit=1`);
            if (searchRes.data.docs && searchRes.data.docs.length > 0) {
                workId = searchRes.data.docs[0].key; // This returns "/works/OL..."
            }
        }

        // FETCH DESCRIPTION using the Work ID
        if (workId) {
            const workRes = await axios.get(`https://openlibrary.org${workId}.json`);
            let desc = workRes.data.description;
            
            // Handle different description formats
            if (typeof desc === 'object' && desc.value) desc = desc.value;
            if (!desc) desc = "No written summary exists for this edition.";
            
            setBookDescription(desc);
        } else {
            setBookDescription("The archives contain no record of this specific tome.");
        }
        
    } catch (err) {
        console.error("Error fetching details:", err);
        setBookDescription("Connection lost to the archives.");
    }
  }

  const closeModal = () => {
    setSelectedBook(null);
    setBookDescription("");
  }

  // --- HELPER COMPONENT FOR CARDS ---
  const BookCard = ({ book, label }) => (
    <div className="card" onClick={() => handleBookClick(book)}>
      {label && <div className="card-badge">{label}</div>}
      <img 
        src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg?default=false`} 
        alt={book.title}
        onError={(e) => {
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
        <button className="save-btn" onClick={(e) => { e.stopPropagation(); addToBookshelf(book); }}>
          + Save
        </button>
      </div>
    </div>
  );

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

      {/* RESULTS AREA */}
      {(searchedBook || recommendations.length > 0) && (
        <div className="results-section">
            
            {/* 1. THE FOUND BOOK */}
            {searchedBook && (
                <div className="found-section">
                    <h2 style={{color: '#d4af37', borderBottom: '1px solid #333', paddingBottom: '10px'}}>Result Found</h2>
                    <div className="grid" style={{justifyContent: 'center', marginBottom: '3rem'}}>
                        <BookCard book={searchedBook} label="Matched Book" />
                    </div>
                </div>
            )}

            {/* 2. THE RECOMMENDATIONS */}
            {recommendations.length > 0 && (
                <div className="rec-section">
                     <h2 style={{color: '#d4af37', borderBottom: '1px solid #333', paddingBottom: '10px'}}>Similar Tomes</h2>
                    <div className="grid">
                        {recommendations.map((book, index) => (
                            <BookCard key={index} book={book} />
                        ))}
                    </div>
                </div>
            )}
        </div>
      )}

      {/* DETAILS MODAL */}
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
                <p className="modal-meta">Written by {selectedBook.author}</p>
                <div className="modal-description">{bookDescription}</div>
                <button className="cta-button" onClick={() => { addToBookshelf(selectedBook); closeModal(); }}>
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