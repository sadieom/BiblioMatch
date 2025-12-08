import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Search from './pages/Search'
import TasteTest from './pages/TasteTest'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/taste-test" element={<TasteTest />} /> {/* <--- ADD THIS */}
      </Routes>
    </Router>
  )
}

export default App