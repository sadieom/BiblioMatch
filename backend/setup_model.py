import pandas as pd
import numpy as np
import pickle
from sklearn.neighbors import NearestNeighbors
from scipy.sparse import csr_matrix

print("--- 1. LOADING DATA ---")
books = pd.read_csv('data/books.csv', on_bad_lines='skip')
ratings = pd.read_csv('data/ratings.csv')

print("--- 2. CLEANING DATA ---")
# Select columns (Including average_rating for the stars)
books = books[['book_id', 'original_title', 'title', 'isbn', 'authors', 'image_url', 'average_rating']]
books['original_title'] = books['original_title'].fillna(books['title'])
books.drop(columns=['title'], inplace=True)
books.rename(columns={'original_title': 'title', 'image_url': 'img_url'}, inplace=True)
books.dropna(subset=['title', 'isbn'], inplace=True)

# Filter Users (Keep "Real" Readers)
user_counts = ratings['user_id'].value_counts()
active_users = user_counts[user_counts >= 10].index 
ratings = ratings[ratings['user_id'].isin(active_users)]

# Filter Books (Remove obscure ones to save RAM)
book_counts = ratings['book_id'].value_counts()
popular_books = book_counts[book_counts >= 10].index
ratings = ratings[ratings['book_id'].isin(popular_books)]

# Merge
ratings_with_books = ratings.merge(books, on='book_id')
ratings_with_books.drop_duplicates(['user_id', 'title'], inplace=True)

print("--- 3. COMPRESSING DATA ---")
# Create the Pivot Table (The Heavy Step)
book_pivot = ratings_with_books.pivot_table(columns='user_id', index='title', values='rating')
book_pivot.fillna(0, inplace=True)

# THE OPTIMIZATION: Convert to Sparse Matrix immediately
book_sparse = csr_matrix(book_pivot)
book_names = book_pivot.index.tolist() # Just save the list of names

print(f"Matrix Shape: {book_pivot.shape}")
print("Data compressed successfully.")

print("--- 4. TRAINING MODEL ---")
model = NearestNeighbors(algorithm='brute', metric='cosine')
model.fit(book_sparse)

print("--- 5. SAVING LIGHTWEIGHT ARTIFACTS ---")
# 1. Save the Compressed Matrix (Tiny)
with open('book_sparse.pkl', 'wb') as f:
    pickle.dump(book_sparse, f)

# 2. Save just the Names (Tiny)
with open('book_names.pkl', 'wb') as f:
    pickle.dump(book_names, f)

# 3. Save the Model
with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)

# 4. Save Metadata (for images/ISBNs)
with open('books_metadata.pkl', 'wb') as f:
    pickle.dump(books, f)

print("SUCCESS! Optimized files saved.")