import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { BarChart3, PlusCircle, Home } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import PollView from './pages/PollView';
import CreatePoll from './pages/CreatePoll';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors">
              <BarChart3 className="w-6 h-6" />
              <span className="font-bold text-xl tracking-tight">QuizSync</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/" className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-sm font-medium">
                <Home className="w-4 h-4" />
                <span>Accueil</span>
              </Link>
              <Link to="/create" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm">
                <PlusCircle className="w-4 h-4" />
                <span>Nouveau Sondage</span>
              </Link>
            </nav>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/poll/:id" element={<PollView />} />
            <Route path="/create" element={<CreatePoll />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
