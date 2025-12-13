from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
from thefuzz import process

app = Flask(__name__)
CORS(app)

print("Loading optimized artifacts...")
try:
    model = pickle.load(open('model.pkl', 'rb'))
    # NEW: Load the compressed matrix and the name list
    book_sparse = pickle.load(open('book_sparse.pkl', 'rb'))
    book_names = pickle.load(open('book_names.pkl', 'rb'))
    books_metadata = pickle.load(open('books_metadata.pkl', 'rb'))
    print("Model loaded (Fast Mode)!")
except FileNotFoundError:
    print("CRITICAL ERROR: Run 'python setup_model.py' first!")

def get_recommendations(user_input):
    # 1. FUZZY MATCHING (Using the simple list of names)
    match = process.extractOne(user_input, book_names)
    
    if not match or match[1] < 60: # Lowered slightly for better UX
        return {"error": "Book not found"}

    actual_title = match[0]
    
    # 2. GET METADATA
    found_book_meta = books_metadata[books_metadata['title'] == actual_title].head(1)
    found_book_data = {}
    
    if not found_book_meta.empty:
        found_book_data = {
            "title": actual_title,
            "isbn": found_book_meta['isbn'].values[0],
            "author": found_book_meta['authors'].values[0],
            "original_img": found_book_meta['img_url'].values[0],
            "rating": found_book_meta['average_rating'].values[0]
        }

    # 3. FIND NEIGHBORS (Using Sparse Logic)
    try:
        # Find the index in the list
        book_id = book_names.index(actual_title)
        
        # Pass the SPARSE row to the model
        distance, suggestion = model.kneighbors(book_sparse[book_id], n_neighbors=6)
        
        recommended_books = []
        for i in range(len(suggestion[0])): # Notice suggestion[0]
            idx = suggestion[0][i]
            recommended_title = book_names[idx]
            
            if recommended_title == actual_title: continue 
            
            meta = books_metadata[books_metadata['title'] == recommended_title].head(1)
            
            if not meta.empty:
                recommended_books.append({
                    "title": recommended_title,
                    "isbn": meta['isbn'].values[0],
                    "author": meta['authors'].values[0],
                    "original_img": meta['img_url'].values[0],
                    "rating": meta['average_rating'].values[0]
                })
        
        return {
            "found_book": found_book_data, 
            "recommendations": recommended_books
        }

    except IndexError:
        return {"error": "Error processing book data"}

@app.route('/api/recommend', methods=['POST'])
def recommend():
    data = request.json
    user_input = data.get('book_name')
    if not user_input: return jsonify({"error": "No book name provided"}), 400
    results = get_recommendations(user_input)
    if "error" in results: return jsonify(results) 
    return jsonify(results)

@app.route('/api/taste_test', methods=['POST'])
def taste_test():
    data = request.json
    book_list = data.get('books', [])
    if not book_list: return jsonify({"error": "No books provided"}), 400
    
    aggregated_recommendations = {} 
    
    for book_name in book_list:
        result = get_recommendations(book_name)
        if "error" in result: continue
        for rec in result['recommendations']:
            title = rec['title']
            if title in aggregated_recommendations:
                aggregated_recommendations[title]['score'] += 1
            else:
                aggregated_recommendations[title] = {"data": rec, "score": 1}

    final_list = sorted(aggregated_recommendations.values(), key=lambda x: x['score'], reverse=True)
    clean_list = [item['data'] for item in final_list]
    return jsonify(clean_list[:10])

if __name__ == '__main__':
    app.run(debug=True, port=5000)