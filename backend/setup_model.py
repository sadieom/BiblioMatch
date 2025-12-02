import pandas as pd
import numpy as np
import pickle
import os

# 1. Load the Data
print("Loading data...")
books = pd.read_csv('data/Books.csv', low_memory=False)
ratings = pd.read_csv('data/Ratings.csv')
users = pd.read_csv('data/Users.csv')

# 2. Data Cleaning (Crucial for Speed)
print("Cleaning data...")
# Renaming columns for easier access
books.rename(columns={'Book-Title': 'title', 'Book-Author': 'author', 'Year-Of-Publication': 'year', 'Publisher': 'publisher', 'Image-URL-L': 'img_url'}, inplace=True)
users.rename(columns={'User-ID': 'user_id', 'Location': 'location', 'Age': 'age'}, inplace=True)
ratings.rename(columns={'User-ID': 'user_id', 'Book-Rating': 'rating'}, inplace=True)

# Filter: Only keep users who have rated > 200 books (The "Super Users")
# This reduces the dataset size significantly and improves recommendation quality
x = ratings['user_id'].value_counts() > 200
y = x[x].index
ratings = ratings[ratings['user_id'].isin(y)]

# Filter: Merge ratings with books
ratings_with_books = ratings.merge(books, on='ISBN')

# Filter: Only keep books that have > 50 ratings
number_rating = ratings_with_books.groupby('title')['rating'].count().reset_index()
number_rating.rename(columns={'rating': 'num_of_rating'}, inplace=True)
final_rating = ratings_with_books.merge(number_rating, on='title')
final_rating = final_rating[final_rating['num_of_rating'] >= 50]

# Deduplicate
final_rating.drop_duplicates(['user_id', 'title'], inplace=True)

# 3. Create the Pivot Table (The Matrix)
# Rows = Titles, Columns = User IDs, Values = Ratings
print("Creating pivot table...")
book_pivot = final_rating.pivot_table(columns='user_id', index='title', values='rating')
book_pivot.fillna(0, inplace=True)

# 4. Train the Model
from sklearn.neighbors import NearestNeighbors
print("Training model...")
model = NearestNeighbors(algorithm='brute')
model.fit(book_pivot) # This is the sparse matrix

# 5. Save the "Brain" (Serialization)
print("Saving artifacts...")

# We need the pivot table to look up book names later
with open('book_pivot.pkl', 'wb') as f:
    pickle.dump(book_pivot, f)

# We need the actual trained model to find neighbors
with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)

# We need the list of books to display covers
with open('books_metadata.pkl', 'wb') as f:
    pickle.dump(books, f)

print("Done! Model and data saved successfully.")