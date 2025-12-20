import { useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

// Star Rating Component
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

function TasteTest() {
  const [input, setInput] = useState("")
  const [favorites, setFavorites] = useState([]) 
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)
  const [bookDescription, setBookDescription] = useState("")

  const addIngredient = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    if (favorites.length >= 5) { alert("The potion is full!"); return; }

    try {
        const response = await axios.post('http://127.0.0.1:5000/api/recommend', { book_name: input });
        if (response.data.found_book) {
            const foundTitle = response.data.found_book.title;
            if (!favorites.includes(foundTitle)) {
                setFavorites([...favorites, foundTitle]);
                setInput(""); 
            } else { alert(`You already added "${foundTitle}"!`); }
        } else { alert("We couldn't find that book. Check your spelling!"); }
    } catch (err) { alert("Connection failed."); }
  }

  const removeIngredient = (book) => setFavorites(favorites.filter(b => b !== book));

  const castSpell = async () => {
    if (favorites.length < 1) return;
    setLoading(true);
    document.body.classList.add('loading-cursor');

    try {
        const response = await axios.post('http://127.0.0.1:5000/api/taste_test', { books: favorites });
        setResults(response.data);
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    } catch (err) { alert("The spell backfired."); } 
    finally {
        setLoading(false);
        document.body.classList.remove('loading-cursor');
    }
  }

  // Reset Function to go back to search
  const resetPotion = () => {
    setResults([]);     
    setFavorites([]);   
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const openDetails = async (book) => {
    setSelectedBook(book);
    setBookDescription("Consulting the archives...");
    try {
        let response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${book.isbn}`);
        if (!response.data.items || response.data.items.length === 0) {
            response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(book.title)}`);
        }
        if (response.data.items && response.data.items.length > 0) {
            setBookDescription(response.data.items[0].volumeInfo.description || "No summary available.");
        } else { setBookDescription("The archives are silent."); }
    } catch (err) { setBookDescription("Connection Error."); }
  }

  const closeModal = () => setSelectedBook(null);

  const addToBookshelf = (book) => {
    const existing = JSON.parse(localStorage.getItem('myBookshelf')) || [];
    if (!existing.some(b => b.title === book.title)) {
        localStorage.setItem('myBookshelf', JSON.stringify([...existing, book]));
        alert(`Saved "${book.title}"!`);
    } else { alert("Already saved!"); }
  }

  return (
    <div className="page-container">
      
      {/* --- HEADER --- */}
      <div className="taste-header">
        <nav className="navbar" style={{width: 'auto', padding: 0, border: 'none', background: 'transparent'}}>
            <Link to="/" className="nav-link">← Back to Home</Link>
        </nav>
        <h1 className="small-title">The Taste Test</h1>
      </div>
      {/* --- 1. GLOBAL SPACER (Small) --- */}
      <div style={{ height: '160px', width: '100%', flexShrink: 0 }}></div>

      {/* --- MODE 1: BUILDER --- */}
      {results.length === 0 && (
        <>
            <p style={{marginBottom: '2rem'}}>Add up to 5 favorite books to brew a personalized recommendation.</p>
            
            <div className="potion-builder" style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
                <form onSubmit={addIngredient} className="input-group" style={{marginBottom: '2rem'}}>
                    <input 
                        type="text" 
                        placeholder="Add a favorite book..." 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button type="submit" className="save-btn" style={{marginTop: '10px'}}>+ Add Ingredient</button>
                </form>

                <div className="ingredients-list">
                    {favorites.map((book, index) => (
                        <div key={index} className="ingredient-tag">
                            {book} <span onClick={() => removeIngredient(book)}> &times;</span>
                        </div>
                    ))}
                </div>

                {favorites.length > 0 && (
                    <button className="cta-button" onClick={castSpell} disabled={loading}>
                        {loading ? "Brewing..." : "Reveal My Destiny"}
                    </button>
                )}
            </div>
        </>
      )}

      {/* --- MODE 2: RESULTS --- */}
      {results.length > 0 && (
        <div className="results-section" style={{ width: '100%' }}>
            {/* --- 2. EXTRA SPACER FOR RESULTS ONLY --- */}
          <div style={{ height: '150px' }}></div>

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
             <button onClick={resetPotion} className="cta-button" style={{ fontSize: '0.8rem', padding: '10px 20px' }}>
                ↻ Brew Another Potion
             </button>
          </div>

          <h2 className="section-title">Your Personalized Reading List</h2>
          <div className="grid">
            {results.map((book, index) => (
              <div key={index} className="card" onClick={() => openDetails(book)}>
                <img 
                  src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg?default=false`} 
                  alt={book.title}
                  onError={(e) => { e.target.src=book.original_img || "https://placehold.co/150x240?text=No+Cover" }}
                />
                <div className="card-info">
                  <h3>{book.title}</h3>
                  <StarRating rating={book.rating} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- MODAL --- */}
      {selectedBook && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <div className="modal-body">
              <div className="modal-image-container">
                 <img className="modal-image" src={`https://covers.openlibrary.org/b/isbn/${selectedBook.isbn}-L.jpg`} onError={(e) => e.target.src="https://placehold.co/300x450?text=No+Cover"} />
              </div>
              <div className="modal-info">
                <h2 className="modal-title">{selectedBook.title}</h2>
                <StarRating rating={selectedBook.rating} />
                <p className="modal-meta">By {selectedBook.author}</p>
                <div className="modal-description">{bookDescription}</div>
                <button className="cta-button" onClick={() => { addToBookshelf(selectedBook); closeModal(); }}>+ Add to Shelf</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- NEW MAGICAL LOADING OVERLAY --- */}
      {loading && (
        <div className="loading-overlay">
          <div className="magic-spinner"></div>
          <p className="loading-text">Brewing your destiny...</p>
        </div>
      )}

    </div>
  )
}

export default TasteTest