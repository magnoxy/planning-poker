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
  onAddTask: (task: Task) => void;
  onEditTask: (index: number, task: Task) => void;
  onRemoveTask: (index: number) => void;
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
  onAddTask,
  onEditTask,
  onRemoveTask,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddingTask, setIsAddingTask] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [taskForm, setTaskForm] = React.useState<Task>({ title: '', description: '' });

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

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    if (editingIndex !== null) {
      onEditTask(editingIndex, taskForm);
      setEditingIndex(null);
    } else {
      onAddTask(taskForm);
      setIsAddingTask(false);
    }
    setTaskForm({ title: '', description: '' });
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setTaskForm(session.tasks[index]);
    setIsAddingTask(false);
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Tasks ({session.tasks.length})</h2>
            {isAdmin && (
              <button 
                onClick={() => { setIsAddingTask(true); setEditingIndex(null); setTaskForm({ title: '', description: '' }); }}
                className="secondary-btn"
                style={{ padding: '4px 8px', fontSize: '12px' }}
              >
                + Add
              </button>
            )}
          </div>

          {isAdmin && (isAddingTask || editingIndex !== null) && (
            <form onSubmit={handleSaveTask} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
              <h3>{editingIndex !== null ? 'Edit Task' : 'New Task'}</h3>
              <input
                type="text"
                placeholder="Title"
                value={taskForm.title}
                onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                required
                style={{ width: '100%', marginBottom: '0.5rem' }}
              />
              <textarea
                placeholder="Description"
                value={taskForm.description}
                onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                style={{ width: '100%', marginBottom: '0.5rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" style={{ flex: 1, padding: '0.5rem' }}>Save</button>
                <button type="button" onClick={() => { setIsAddingTask(false); setEditingIndex(null); }} className="secondary-btn" style={{ flex: 1, padding: '0.5rem' }}>Cancel</button>
              </div>
            </form>
          )}

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
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ flex: 1, marginRight: '10px' }}>
                <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</strong>
                {task.points && <span className="status-badge voted" style={{ fontSize: '10px' }}>{task.points} pts</span>}
              </div>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    onClick={() => startEdit(index)}
                    className="secondary-btn"
                    style={{ padding: '2px 6px', fontSize: '10px' }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => { if(confirm('Remove this task?')) onRemoveTask(index); }}
                    className="secondary-btn"
                    style={{ padding: '2px 6px', fontSize: '10px', color: '#ff4d4d' }}
                  >
                    Remove
                  </button>
                </div>
              )}
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
