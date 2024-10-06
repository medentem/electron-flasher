import type React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';

const App: React.FC = () => {
  return (
    <Router>
        <div className="bg-gray-800 min-h-screen min-w-screen">
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
            </Routes>
        </div>
    </Router>
  );
};

export default App;