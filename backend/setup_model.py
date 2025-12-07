import pandas as pd
import numpy as np
import pickle
from sklearn.neighbors import NearestNeighbors

print("--- 1. LOADING DATA ---")
books = pd.read_csv('data/books.csv', on_bad_lines='skip')
ratings = pd.read_csv('data/ratings.csv')

print(f"Raw Data: {len(books)} books, {len(ratings)} ratings.")

print("--- 2. CLEANING DATA ---")

# A. SELECT COLUMNS
# We need both 'original_title' and 'title' momentarily to fill gaps
books = books[['book_id', 'original_title', 'title', 'isbn', 'authors', 'image_url']]

# B. HANDLE MISSING TITLES
# If 'original_title' is missing, use 'title' to fill the gap
books['original_title'] = books['original_title'].fillna(books['title'])

# --- THE FIX IS HERE ---
# We must DROP the old 'title' column before renaming 'original_title'
# Otherwise, we end up with two columns named 'title' and Pandas crashes
books.drop(columns=['title'], inplace=True)

# NOW we can safely rename
books.rename(columns={'original_title': 'title', 'image_url': 'img_url'}, inplace=True)
books.dropna(subset=['title', 'isbn'], inplace=True)

# C. FILTER USERS (Crucial for RAM)
# Only keep users who have rated at least 50 books
user_counts = ratings['user_id'].value_counts()
active_users = user_counts[user_counts >= 50].index
ratings = ratings[ratings['user_id'].isin(active_users)]
print(f"Filtered to {len(ratings)} ratings from active users.")

# D. MERGE
ratings_with_books = ratings.merge(books, on='book_id')

# E. DEDUPLICATE
ratings_with_books.drop_duplicates(['user_id', 'title'], inplace=True)

print(f"Final Interaction Count: {len(ratings_with_books)}")

print("--- 3. CREATING MATRIX ---")
# Rows = Book Titles, Columns = User IDs
book_pivot = ratings_with_books.pivot_table(columns='user_id', index='title', values='rating')
book_pivot.fillna(0, inplace=True)

print(f"Matrix Shape: {book_pivot.shape}")

print("--- 4. TRAINING MODEL ---")
model = NearestNeighbors(algorithm='brute', metric='cosine')
model.fit(book_pivot)

print("--- 5. SAVING ARTIFACTS ---")
with open('book_pivot.pkl', 'wb') as f:
    pickle.dump(book_pivot, f)

with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)

with open('books_metadata.pkl', 'wb') as f:
    pickle.dump(books, f)

print("SUCCESS! Dataset Cleaned & Model Trained.")