import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  // 1. A variable to hold the data from Python
  const [message, setMessage] = useState("Waiting for backend...")

  // 2. The function that talks to Flask
  const fetchMessage = async () => {
    try {
      // This URL must match your Flask terminal URL exactly
      const response = await axios.get('http://127.0.0.1:5000/api/test')
      
      // Update the variable with the data from Python
      setMessage(response.data.message)
    } catch (error) {
      console.error("Error connecting:", error)
      setMessage("Error: Is the backend running?")
    }
  }

  return (
    <>
      <h1>BiblioMatch R&D</h1>
      <div className="card">
        <p>Current Status:</p>
        
        {/* 3. Display the message */}
        <h3>{message}</h3>

        {/* 4. The Trigger Button */}
        <button onClick={fetchMessage} style={{marginTop: '20px'}}>
          Test Connection
        </button>
      </div>
    </>
  )
}

export default App