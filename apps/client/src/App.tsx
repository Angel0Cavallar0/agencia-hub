import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Agência Hub - Client App</h1>
            <p>Aplicação client em desenvolvimento</p>
          </div>
        } />
      </Routes>
    </Router>
  )
}

export default App
