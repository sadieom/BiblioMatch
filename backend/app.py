from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np

app = Flask(__name__)
CORS(app) # Allow React to talk to us

# --- LOAD THE BRAIN (The .pkl files) ---
print("Loading model artifacts...")
model = pickle.load(open('model.pkl', 'rb'))
book_pivot = pickle.load(open('book_pivot.pkl', 'rb'))
books_metadata = pickle.load(open('books_metadata.pkl', 'rb'))
print("Model loaded successfully!")

# --- THE RECOMMENDATION LOGIC ---
def get_recommendations(book_name):
    # 1. Find the book in our matrix (getting the Index ID)
    # This assumes exact spelling match for now (R&D limitation)
    try:
        book_id = np.where(book_pivot.index == book_name)[0][0]
    except IndexError:
        return ["Book not found in database"]

    # 2. Ask the model: "Who are the 6 nearest neighbors to this ID?"
    # We ask for 6 because the 1st one is always the book itself
    distance, suggestion = model.kneighbors(book_pivot.iloc[book_id,:].values.reshape(1,-1), n_neighbors=6)
    
    # 3. Translate the neighbor IDs back into Book Titles and Image URLs
    recommended_books = []
    for i in range(len(suggestion)):
        books = book_pivot.index[suggestion[i]]
        for j in books:
            if j == book_name: continue # Skip the original book
            
            # Find the cover URL in the metadata
            # We use the first matching row we find
            book_info = books_metadata[books_metadata['title'] == j].iloc[0]
            cover_url = book_info['img_url']
            
            recommended_books.append({
                "title": j,
                "image": cover_url
            })
            
    return recommended_books

# --- THE API ENDPOINT ---
@app.route('/api/recommend', methods=['POST'])
def recommend():
    data = request.json
    user_input = data.get('book_name')
    
    if not user_input:
        return jsonify({"error": "No book name provided"}), 400

    print(f"User asked for: {user_input}")
    results = get_recommendations(user_input)
    
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True, port=5000)