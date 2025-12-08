import { useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

function TasteTest() {
  const [input, setInput] = useState("")
  const [favorites, setFavorites] = useState([]) // The "Ingredients"
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

 // 1. ADD BOOK TO POTION
  const addIngredient = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    if (favorites.length >= 5) {
        alert("The potion is full! Remove a book first.");
        return;
    }

    try {
        const response = await axios.post('http://127.0.0.1:5000/api/recommend', { book_name: input });
        
        // CHECK 1: Did we find a book?
        if (response.data.found_book) {
            const foundTitle = response.data.found_book.title;
            
            // CHECK 2: Is it already in the list?
            if (favorites.includes(foundTitle)) {
                alert(`You already added "${foundTitle}"!`);
                return;
            }

            // CHECK 3: Confirm with user if the title changed significantly
            // (Optional, but helps with the "Randomness" feeling)
            if (foundTitle.toLowerCase() !== input.toLowerCase()) {
                const confirm = window.confirm(`We found "${foundTitle}" in the archives. Is this what you meant?`);
                if (!confirm) return;
            }

            setFavorites([...favorites, foundTitle]);
            setInput(""); // Clear input
            
        } else {
            // Backend returned an error (Score < 80)
            alert("We couldn't find that exact book in our pre-2018 archives. Try checking the spelling or using an older classic!");
        }
    } catch (err) {
        console.error(err);
        alert("Connection failed.");
    }
  }

  // 2. REMOVE INGREDIENT
  const removeIngredient = (book) => {
    setFavorites(favorites.filter(b => b !== book));
  }

  // 3. CAST SPELL (Get Recommendations)
  const castSpell = async () => {
    if (favorites.length < 1) return;
    setLoading(true);
    
    try {
        const response = await axios.post('http://127.0.0.1:5000/api/taste_test', {
            books: favorites
        });
        setResults(response.data);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <nav className="navbar">
        <Link to="/" className="nav-link">← Back to Home</Link>
      </nav>

      <h1 className="small-title">The Taste Test</h1>
      <p style={{marginBottom: '2rem'}}>Add up to 5 favorite books to brew a personalized recommendation.</p>

      {/* --- INGREDIENT BUILDER --- */}
      <div className="potion-builder">
        
        {/* INPUT FORM */}
        <form onSubmit={addIngredient} className="input-group" style={{marginBottom: '2rem'}}>
            <input 
                type="text" 
                placeholder="Add a favorite book..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="save-btn" style={{marginTop: '10px'}}>
                + Add Ingredient
            </button>
        </form>

        {/* SELECTED INGREDIENTS LIST */}
        <div className="ingredients-list">
            {favorites.map((book, index) => (
                <div key={index} className="ingredient-tag">
                    {book}
                    <span onClick={() => removeIngredient(book)}> &times;</span>
                </div>
            ))}
        </div>

        {/* CAST BUTTON */}
        {favorites.length > 0 && (
            <button className="cta-button" onClick={castSpell} disabled={loading}>
                {loading ? "Brewing..." : "Reveal My Destiny"}
            </button>
        )}
      </div>

      {/* --- RESULTS --- */}
      {results.length > 0 && (
        <div className="results-section">
          <h2 className="section-title">Your Personalized Reading List</h2>
          <div className="grid">
            {results.map((book, index) => (
              <div key={index} className="card">
                <img 
                  src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg?default=false`} 
                  alt={book.title}
                  onError={(e) => {
                    if (book.original_img) e.target.src = book.original_img;
                    else e.target.src="https://placehold.co/150x240/2d2d2d/d4af37?text=No+Cover";
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

export default TasteTest