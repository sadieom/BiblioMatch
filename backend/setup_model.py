import pandas as pd
import numpy as np
import pickle
from sklearn.neighbors import NearestNeighbors
from scipy.sparse import csr_matrix

print("--- 1. LOADING DATA ---")
books = pd.read_csv('data/books.csv', on_bad_lines='skip')
ratings = pd.read_csv('data/ratings.csv')

print(f"Raw Data: {len(books)} books, {len(ratings)} ratings.")

print("--- 2. CLEANING DATA ---")

# A. Handle Columns
books = books[['book_id', 'original_title', 'title', 'isbn', 'authors', 'image_url']]
books['original_title'] = books['original_title'].fillna(books['title'])
books.drop(columns=['title'], inplace=True)
books.rename(columns={'original_title': 'title', 'image_url': 'img_url'}, inplace=True)
books.dropna(subset=['title', 'isbn'], inplace=True)

# B. Filter Users (OPEN THE GATES)
# Relax filter: Keep users who rated > 10 books (was 80)
# This lets in "normal" readers, increasing the variety of books significantly.
user_counts = ratings['user_id'].value_counts()
active_users = user_counts[user_counts >= 10].index 
ratings = ratings[ratings['user_id'].isin(active_users)]

# C. Filter Books
# Also ensure we only keep books that have at least 10 ratings total
# This removes typos and obscure books that break the math
book_counts = ratings['book_id'].value_counts()
popular_books = book_counts[book_counts >= 10].index
ratings = ratings[ratings['book_id'].isin(popular_books)]

print(f"Filtered to {len(ratings)} ratings (More variety!).")

# D. Merge & Deduplicate
ratings_with_books = ratings.merge(books, on='book_id')
ratings_with_books.drop_duplicates(['user_id', 'title'], inplace=True)

# E. Create Pivot Table
print("--- 3. CREATING MATRIX ---")
book_pivot = ratings_with_books.pivot_table(columns='user_id', index='title', values='rating')
book_pivot.fillna(0, inplace=True)

# CONVERT TO SPARSE (Crucial for handling this many books)
book_sparse = csr_matrix(book_pivot)

print(f"Matrix Shape: {book_pivot.shape}")

# F. Train Model
print("--- 4. TRAINING MODEL ---")
# We use Cosine because it works on Sparse Matrices (Large Datasets)
model = NearestNeighbors(algorithm='brute', metric='cosine')
model.fit(book_sparse)

print("--- 5. SAVING ARTIFACTS ---")
with open('book_pivot.pkl', 'wb') as f:
    pickle.dump(book_pivot, f)

with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)

with open('books_metadata.pkl', 'wb') as f:
    pickle.dump(books, f)

print("SUCCESS! Model retrained with a larger library.")