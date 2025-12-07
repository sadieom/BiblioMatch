from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
from thefuzz import process

app = Flask(__name__)
CORS(app)

print("Loading model artifacts...")
try:
    model = pickle.load(open('model.pkl', 'rb'))
    book_pivot = pickle.load(open('book_pivot.pkl', 'rb'))
    books_metadata = pickle.load(open('books_metadata.pkl', 'rb'))
    print("Model loaded successfully!")
except FileNotFoundError:
    print("ERROR: Run setup_model.py first!")

def get_recommendations(user_input):
    # 1. FUZZY MATCHING (Find the closest title)
    all_titles = book_pivot.index.tolist()
    match = process.extractOne(user_input, all_titles)
    
    if not match or match[1] < 50:
        return {"error": "Book not found"}

    actual_title = match[0]
    print(f"Matched '{user_input}' to '{actual_title}' ({match[1]}%)")

    # 2. FIND NEIGHBORS
    try:
        book_id = np.where(book_pivot.index == actual_title)[0][0]
        distance, suggestion = model.kneighbors(book_pivot.iloc[book_id,:].values.reshape(1,-1), n_neighbors=6)
        
        recommended_books = []
        for i in range(len(suggestion)):
            books = book_pivot.index[suggestion[i]]
            for j in books:
                if j == actual_title: continue 
                
                # Fetch ISBN and Authors from metadata
                # Use .head(1) because sometimes duplicates exist in metadata
                meta = books_metadata[books_metadata['title'] == j].head(1)
                
                if not meta.empty:
                    recommended_books.append({
                        "title": j,
                        "isbn": meta['isbn'].values[0],
                        "author": meta['authors'].values[0],
                        "original_img": meta['img_url'].values[0]
                    })
        
        return {
            "found_title": actual_title,
            "recommendations": recommended_books
        }

    except IndexError:
        return {"error": "Error processing book data"}

@app.route('/api/recommend', methods=['POST'])
def recommend():
    data = request.json
    user_input = data.get('book_name')
    if not user_input:
        return jsonify({"error": "No book name provided"}), 400

    results = get_recommendations(user_input)
    if "error" in results:
        return jsonify([results["error"]]) 
        
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True, port=5000)