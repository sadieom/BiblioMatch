import { useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

// --- STAR RATING COMPONENT ---
const StarRating = ({ rating }) => {
  const stars = Math.round(rating || 0); 
  return (
    <div className="star-rating" style={{color: '#d4af37', fontSize: '0.9rem', margin: '5px 0'}}>
      {[...Array(5)].map((_, i) => (
        <span key={i} style={{opacity: i < stars ? 1 : 0.3}}>★</span>
      ))}
      <span style={{fontSize: '0.7rem', color: '#888', marginLeft: '5px'}}>({rating})</span>
    </div>
  );
};

// --- BOOK CARD COMPONENT ---
const BookCard = ({ book, onClick, label }) => (
  <div className="card" onClick={onClick}>
    {label && <div style={{
        position:'absolute', top:-10, background:'#d4af37', color:'#000', 
        padding:'2px 10px', borderRadius:'10px', fontSize:'0.7rem', fontWeight:'bold', zIndex:10
    }}>{label}</div>}
    
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
      <StarRating rating={book.rating} />
    </div>
  </div>
)

function Search() {
  const [inputBook, setInputBook] = useState("")
  const [searchedBook, setSearchedBook] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Modal State
  const [selectedBook, setSelectedBook] = useState(null)
  const [bookDescription, setBookDescription] = useState("")

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!inputBook.trim()) return

    setLoading(true)
    setError("")
    setSearchedBook(null)
    setRecommendations([])

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/recommend', {
        book_name: inputBook
      })
      
      if (response.data.error) {
        setError(response.data.error)
      } else {
        setSearchedBook(response.data.found_book)
        setRecommendations(response.data.recommendations)
      }
    } catch (err) {
      setError("The library archives are currently unreachable.")
    } finally {
      setLoading(false)
    }
  }

  // Fetch Description from Open Library
  const openDetails = async (book) => {
    setSelectedBook(book);
    setBookDescription("Consulting the archives...");
    try {
        const res = await axios.get(`https://openlibrary.org/api/books?bibkeys=ISBN:${book.isbn}&jscmd=details&format=json`);
        const data = res.data[`ISBN:${book.isbn}`];
        if (data && data.details && data.details.description) {
            const desc = data.details.description;
            setBookDescription(typeof desc === 'string' ? desc : desc.value);
        } else {
            setBookDescription("No description available in the ancient texts.");
        }
    } catch (err) {
        setBookDescription("Could not decipher the scroll.");
    }
  }

  const closeModal = () => setSelectedBook(null);

  const addToBookshelf = (book) => {
    const currentShelf = JSON.parse(localStorage.getItem('myBookshelf')) || [];
    if (!currentShelf.some(b => b.title === book.title)) {
        const updatedShelf = [...currentShelf, book];
        localStorage.setItem('myBookshelf', JSON.stringify(updatedShelf));
        alert(`${book.title} has been added to your shelf!`);
    } else {
        alert("You already have this tome!");
    }
  }

  return (
    <div className="page-container">
      
      {/* --- STICKY HEADER --- */}
      {/* This Wrapper guarantees the search bar never disappears */}
      <div className="search-header">
        <nav className="navbar" style={{background: 'transparent', border: 'none', padding: 0}}>
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
            <button type="submit" disabled={loading} className="save-btn" style={{marginTop: '10px'}}>
              {loading ? "Searching..." : "Summon Books"}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="error-message" style={{marginTop: '20px', color: '#ff6b6b'}}>{error}</div>}

{/* --- THE FIX: INVISIBLE SPACER --- */}
      {/* This forces the content down 280 pixels no matter what CSS says */}
      <div style={{ height: '420px', width: '100%' }}></div>

      {/* --- RESULTS AREA --- */}
      <div className="results-container" style={{marginTop: '20px', width: '100%'}}>
        {(searchedBook || recommendations.length > 0) && (
            <div className="results-section">
                
                {/* 1. FOUND BOOK */}
                {searchedBook && (
                    <div className="found-section">
                        <h2 className="section-title">Result Found</h2>
                        <div className="grid" style={{justifyContent: 'center', marginBottom: '3rem'}}>
                            <BookCard 
                                book={searchedBook} 
                                label="Matched Book" 
                                onClick={() => openDetails(searchedBook)}
                            />
                        </div>
                    </div>
                )}

                {/* 2. RECOMMENDATIONS */}
                {recommendations.length > 0 && (
                    <div className="rec-section">
                        <h2 className="section-title">Similar Tomes</h2>
                        <div className="grid">
                            {recommendations.map((book, index) => (
                                <BookCard 
                                    key={index} 
                                    book={book} 
                                    onClick={() => openDetails(book)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* --- DETAILS MODAL --- */}
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
                <StarRating rating={selectedBook.rating} />
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