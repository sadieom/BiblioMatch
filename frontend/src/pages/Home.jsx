import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function Home() {
  const [savedBooks, setSavedBooks] = useState([])

  // Load books from local storage when page opens
  useEffect(() => {
    const books = JSON.parse(localStorage.getItem('myBookshelf')) || [];
    setSavedBooks(books);
  }, [])

  // Remove book function
  const removeBook = (title) => {
    const updated = savedBooks.filter(b => b.title !== title);
    setSavedBooks(updated);
    localStorage.setItem('myBookshelf', JSON.stringify(updated));
  }

  return (
    <div className="page-container home-layout">
      
      {/* HERO SECTION */}
      <header className="home-hero">
        <h1 className="main-title">BiblioMatch</h1>
        <p className="subtitle">Your enchanted gateway to literary discovery.</p>
        
        {/* NAVIGATION BUTTONS */}
        <div className="button-row" style={{display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '2rem'}}>
            <Link to="/search">
              <button className="cta-button">Quick Search</button>
            </Link>
            
            <Link to="/taste-test">
              <button className="cta-button" style={{borderColor: '#e3dac9', color: '#e3dac9'}}>
                 Taste Test
              </button>
            </Link>
        </div>
      </header>

      {/* BOOKSHELF SECTION */}
      <section className="bookshelf-section">
        <h2 className="section-title">Your Bookshelf</h2>
        
        {savedBooks.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(227, 218, 201, 0.6)', marginTop: '2rem' }}>
            <p style={{ fontSize: '1.5rem', fontFamily: 'Cinzel, serif' }}>Your shelf is gathering dust...</p>
            <p>Go to the search page to add your first tome.</p>
          </div>
        ) : (
          <div className="shelf-grid">
            {savedBooks.map((book, index) => (
              <div key={index} className="shelf-book">
                <div className="book-spine">
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
                </div>
                <button className="remove-btn" onClick={() => removeBook(book.title)}>x</button>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}

export default Home