from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # This allows the React frontend to talk to this backend

@app.route('/api/test', methods=['GET'])
def test_connection():
    return jsonify({"message": "Hello from Flask! The backend is connected."})

if __name__ == '__main__':
    app.run(debug=True, port=5000)