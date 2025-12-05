from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
from thefuzz import process # <--- NEW LIBRARY

app = Flask(__name__)
CORS(app) # Allow React to talk to us


# --- LOAD THE BRAIN (The .pkl files) ---

print("Loading model artifacts...")
model = pickle.load(open('model.pkl', 'rb'))
book_pivot = pickle.load(open('book_pivot.pkl', 'rb'))
books_metadata = pickle.load(open('books_metadata.pkl', 'rb'))
print("Model loaded successfully!")

def get_recommendations(user_input):
    # 1. FUZZY MATCHING
    # Ask: "What is the closest book title in our database to what the user typed?"
    # process.extractOne returns: ('Actual Title', Score)
    all_titles = book_pivot.index.tolist()
    match = process.extractOne(user_input, all_titles)
    
    # If the match is too weak (less than 50% similar), give up
    if not match or match[1] < 50:
        return {"error": "Book not found"}

    actual_title = match[0]
    print(f"User typed '{user_input}', matched with '{actual_title}' (Score: {match[1]})")

    # 2. FIND NEIGHBORS
    try:
        book_id = np.where(book_pivot.index == actual_title)[0][0]
        distance, suggestion = model.kneighbors(book_pivot.iloc[book_id,:].values.reshape(1,-1), n_neighbors=6)
        
        recommended_books = []
        for i in range(len(suggestion)):
            books = book_pivot.index[suggestion[i]]
            for j in books:
                if j == actual_title: continue 

                # Fetch Metadata
                book_info = books_metadata[books_metadata['title'] == j].iloc[0]
                
                recommended_books.append({
                    "title": j,
                    "isbn": book_info['ISBN'],
                    "original_img": book_info['img_url'] # Backup image from dataset
                })
        
        # Return both the recommendations AND the book we actually found
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
    
    # Check if we returned an error dict
    if "error" in results:
        return jsonify([results["error"]]) # Return as list to keep frontend happy-ish
        
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True, port=5000)