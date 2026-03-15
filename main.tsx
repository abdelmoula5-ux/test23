import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { socket } from '../lib/socket';
import { Clock, Users, ArrowRight } from 'lucide-react';

interface Poll {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

export default function Dashboard() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/polls')
      .then(res => res.json())
      .then(data => {
        setPolls(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching polls:', err);
        setLoading(false);
      });

    const handlePollCreated = (newPoll: Poll) => {
      setPolls(prev => [newPoll, ...prev]);
    };

    socket.on('poll_created', handlePollCreated);

    return () => {
      socket.off('poll_created', handlePollCreated);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sondages Récents</h1>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-medium text-slate-900">Aucun sondage</h3>
          <p className="mt-2 text-sm text-slate-500">Commencez par créer votre premier sondage.</p>
          <div className="mt-6">
            <Link to="/create" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
              Créer un sondage
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <Link
              key={poll.id}
              to={`/poll/${poll.id}`}
              className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all overflow-hidden flex flex-col h-full"
            >
              <div className="p-6 flex-1">
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {poll.title}
                </h3>
                <p className="mt-2 text-sm text-slate-500 line-clamp-3">
                  {poll.description}
                </p>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(poll.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-1 text-indigo-600 font-medium">
                  <span>Participer</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
