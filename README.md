Bibliomatch is an intelligent book recommendation engine that uses machine learning to help users discover their next favorite read. 
By analyzing a dataset of over 5,000 books, the application provides personalized recommendations based on title similarity and "taste profiles."

Features
•	AI-Powered Recommendations: Uses Cosine Similarity to find books mathematically like your favorites.
•	The Taste Test: A multi-book input system that blends up to 5 different titles to create a unique "flavor profile" for recommendations.
•	Dynamic Data: Fetches real-time book covers via Open Library and detailed plot summaries via Google Books API.
•	My Bookshelf: Local storage implementation allowing users to save books to a personal reading list.
•	Responsive UI: A "Glassmorphism" design featuring a sticky header, magical loading states, and a fully responsive grid layout.

Tech Stack
Backend (Python & Flask)
•	Flask: Serves the REST API.
•	Scikit-Learn: Handles the TF-IDF Vectorization and Cosine Similarity calculations.
•	Pandas: Manages dataset manipulation.
•	Pickle: Serializes the trained model for fast loading.
Frontend (React & Vite)
•	React.js: Component-based UI architecture.
•	Vite: Fast build tool and development server.
•	Axios: Handles HTTP requests to the backend.
•	CSS3: Custom animations (spinners, glass effects) and responsive Flexbox/Grid layouts.

How to Run Locally
1. Clone the Repository
git clone https://github.com/YOUR_USERNAME/Bibliomatch.git
cd Bibliomatch

3. Set Up the Backend
Navigate to the backend folder and install the dependencies.
cd backend
pip install -r requirements.txt
(Note: If you don't have a requirements.txt, install manually: pip install flask flask-cors pandas scikit-learn numpy)
Run the Server:
python app.py
The backend will start on http://127.0.0.1:5000

5. Set Up the Frontend
Open a new terminal window, navigate to the frontend folder, and install dependencies.
cd frontend
npm install
Run the Client:
npm run dev
The application will start on http://localhost:5173

How the AI Works
Bibliomatch does not just look for matching genres. It uses Natural Language Processing (NLP) to analyze the content of books.
1.	TF-IDF Vectorization: The system converts book titles, authors, and genres into mathematical vectors.
2.	Cosine Similarity: When a user searches for a book (e.g., "The Hobbit"), the model calculates the angle between that book's vector and every other book in the 5,000-book dataset.
3.	Ranking: The books with the smallest angular distance (highest similarity score) are returned as recommendations.
For the Taste Test, the system averages the vectors of all 5 input books to create a central vector, effectively finding the mathematical center of the user's reading taste.

npm run dev
The application will start on http://localhost:5173
