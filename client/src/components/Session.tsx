import React, { useRef } from 'react';
import type { Session as SessionType, Task } from '../types';
import Papa from 'papaparse';

interface SessionProps {
  session: SessionType;
  socketId?: string;
  onVote: (value: string) => void;
  onReveal: () => void;
  onReset: () => void;
  onImport: (tasks: Task[]) => void;
  onNext: (points?: string) => void;
  onPrev: () => void;
}

const CARDS = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'];

export const Session: React.FC<SessionProps> = ({
  session,
  socketId,
  onVote,
  onReveal,
  onReset,
  onImport,
  onNext,
  onPrev,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const tasks = results.data.map((row: any) => ({
            title: row.Title || row.title || 'Untitled Task',
            description: row.Description || row.description || '',
          }));
          onImport(tasks);
        },
      });
    }
  };

  const handleExport = () => {
    const csv = Papa.unparse(session.tasks);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `session-${session.id}-results.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentTask = session.tasks[session.currentTaskIndex];
  const isAdmin = session.adminId === socketId;
  const myVote = session.votes[socketId || ''];

  const calculateConsensus = () => {
    const votes = Object.values(session.votes).filter(v => v !== '?' && v !== '☕');
    if (votes.length === 0) return null;
    
    const counts: Record<string, number> = {};
    let maxCount = 0;
    let mostFrequent = '';

    votes.forEach(v => {
      counts[v] = (counts[v] || 0) + 1;
      if (counts[v] > maxCount) {
        maxCount = counts[v];
        mostFrequent = v;
      }
    });

    return mostFrequent;
  };

  const consensusValue = session.showVotes ? calculateConsensus() : null;

  return (
    <div className="container">
      <header className="session-header">
        <div>
          <h1>Session: {session.id}</h1>
          <p>Admin: {session.participants.find(p => p.id === session.adminId)?.name}</p>
        </div>
        <div>
          <button className="secondary-btn" onClick={() => {
            navigator.clipboard.writeText(session.id);
            alert('Room ID copied to clipboard!');
          }}>Copy Room ID</button>
        </div>
      </header>

      <div className="session-main">
        <aside className="task-list">
          <h2>Tasks ({session.tasks.length})</h2>
          {isAdmin && (
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <button onClick={() => fileInputRef.current?.click()} style={{ width: '100%', marginBottom: '10px' }}>
                Import CSV
              </button>
              <button onClick={handleExport} className="secondary-btn" style={{ width: '100%' }}>
                Export Results
              </button>
            </div>
          )}
          {session.tasks.map((task, index) => (
            <div
              key={index}
              className={`task-item ${index === session.currentTaskIndex ? 'active' : ''}`}
            >
              <strong>{task.title}</strong>
              {task.points && <span className="status-badge voted" style={{ marginLeft: '10px' }}>{task.points} pts</span>}
            </div>
          ))}
        </aside>

        <main>
          <section className="current-task">
            {currentTask ? (
              <>
                <h2>{currentTask.title}</h2>
                <p>{currentTask.description}</p>
                {session.showVotes && (
                  <div className="consensus">
                    Consensus: {consensusValue || 'No consensus'}
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <h3>No tasks imported yet</h3>
                {isAdmin && <p>Please import a CSV to start voting</p>}
              </div>
            )}
          </section>

          <section className="deck">
            {CARDS.map(card => (
              <div
                key={card}
                className={`deck-card ${myVote === card ? 'selected' : ''}`}
                onClick={() => onVote(card)}
              >
                {card}
              </div>
            ))}
          </section>

          {isAdmin && currentTask && (
            <div className="admin-controls">
              <button onClick={onReveal} disabled={session.showVotes}>Reveal Votes</button>
              <button onClick={onReset} className="secondary-btn">Reset Votes</button>
              <button onClick={() => onPrev()} disabled={session.currentTaskIndex === 0}>Prev Task</button>
              <button onClick={() => onNext(consensusValue || undefined)} disabled={session.currentTaskIndex === session.tasks.length - 1}>
                Next Task
              </button>
            </div>
          )}
        </main>

        <aside className="participant-list">
          <h2>Participants</h2>
          {session.participants.map(p => (
            <div key={p.id} className="participant-item">
              <span>{p.name} {p.id === socketId ? '(You)' : ''}</span>
              <span className={`status-badge ${session.votes[p.id] ? 'voted' : ''}`}>
                {session.showVotes 
                  ? (session.votes[p.id] || '...') 
                  : (session.votes[p.id] ? 'Voted' : 'Voting...')}
              </span>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
};
