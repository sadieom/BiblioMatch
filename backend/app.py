from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
from thefuzz import process

app = Flask(__name__)
CORS(app)

print("Loading model artifacts...")
try:
    # Load the trained "Brain"
    model = pickle.load(open('model.pkl', 'rb'))
    # Load the "Map" (Pivot Table)
    book_pivot = pickle.load(open('book_pivot.pkl', 'rb'))
    # Load the "Library Card Catalog" (Metadata like ISBNs/Images)
    books_metadata = pickle.load(open('books_metadata.pkl', 'rb'))
    print("Model loaded successfully!")
except FileNotFoundError:
    print("CRITICAL ERROR: .pkl files not found. Run 'python setup_model.py' first!")

def get_recommendations(user_input):
    # 1. FUZZY MATCHING (Find the closest title)
    all_titles = book_pivot.index.tolist()
    match = process.extractOne(user_input, all_titles)
    
    # If match is weak (less than 50% similar), stop.
    if not match or match[1] < 50:
        return {"error": "Book not found"}

    actual_title = match[0]
    print(f"Matched '{user_input}' to '{actual_title}' ({match[1]}%)")

    # 2. FIND NEIGHBORS
    # Want to show the user the book we actually found first
    found_book_meta = books_metadata[books_metadata['title'] == actual_title].head(1)
    found_book_data = {}
    
    if not found_book_meta.empty:
        found_book_data = {
            "title": actual_title,
            "isbn": found_book_meta['isbn'].values[0],
            "author": found_book_meta['authors'].values[0],
            "original_img": found_book_meta['img_url'].values[0] # Dataset image fallback
        }

    # 3. ASK THE MODEL FOR NEIGHBORS
    try:
        # Find the row index of the book in the pivot table
        book_id = np.where(book_pivot.index == actual_title)[0][0]
        
        # Calculate the 6 nearest neighbors (1st one is the book itself)
        # .values.reshape(1,-1) ensures the shape is correct for the math
        distance, suggestion = model.kneighbors(book_pivot.iloc[book_id,:].values.reshape(1,-1), n_neighbors=6)
        
        recommended_books = []
        for i in range(len(suggestion)):
            # The model returns indices, we need to convert those back to Titles
            books = book_pivot.index[suggestion[i]]
            
            for j in books:
                if j == actual_title: continue # Don't recommend the book they just searched
                
                # Look up ISBN, Author, and Image in the metadata
                meta = books_metadata[books_metadata['title'] == j].head(1)
                
                if not meta.empty:
                    recommended_books.append({
                        "title": j,
                        "isbn": meta['isbn'].values[0],
                        "author": meta['authors'].values[0],
                        "original_img": meta['img_url'].values[0] # Crucial for your cover images!
                    })
        
        # Return both the Found Book and the Recommendations
        return {
            "found_book": found_book_data, 
            "recommendations": recommended_books
        }

    except IndexError:
        return {"error": "Error processing book data"}

@app.route('/api/recommend', methods=['POST'])
def recommend():
    # 1. Receive JSON data from React
    data = request.json
    user_input = data.get('book_name')
    
    if not user_input:
        return jsonify({"error": "No book name provided"}), 400

    # 2. Run logic
    results = get_recommendations(user_input)
    
    # 3. Handle errors gracefully
    if "error" in results:
        return jsonify([results["error"]]) 
        
    # 4. Return success JSON
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True, port=5000)