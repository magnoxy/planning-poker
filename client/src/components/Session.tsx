import React, { useRef } from 'react';
import type { Session as SessionType, Task } from '../types';
import Papa from 'papaparse';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SessionProps {
  session: SessionType;
  userId: string;
  onVote: (value: string) => void;
  onReveal: () => void;
  onReset: () => void;
  onImport: (tasks: Task[]) => void;
  onNext: (points?: string) => void;
  onPrev: () => void;
  onAddTask: (task: Task) => void;
  onEditTask: (index: number, task: Task) => void;
  onRemoveTask: (index: number) => void;
  onProposeAdminTransfer: (targetUserId: string) => void;
  onAcceptAdminTransfer: () => void;
  onDeclineAdminTransfer: () => void;
  onSaveTaskPoints: (index: number, points: string) => void;
  onSetCurrentTask: (index: number) => void;
  onReorderTasks: (oldIndex: number, newIndex: number) => void;
}

const CARDS = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'];

interface SortableTaskItemProps {
  task: Task;
  id: string;
  isActive: boolean;
  isAdmin: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

const SortableTaskItem: React.FC<SortableTaskItemProps> = ({
  task,
  id,
  isActive,
  isAdmin,
  onSelect,
  onEdit,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isAdmin });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: isAdmin ? (isDragging ? 'grabbing' : 'grab') : 'default',
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-item ${isActive ? 'active' : ''}`}
      onClick={(e) => {
        if ((e.target as HTMLElement).tagName !== 'BUTTON') {
          onSelect();
        }
      }}
      {...attributes}
      {...(isAdmin ? listeners : {})}
    >
      <div style={{ flex: 1, marginRight: '10px' }}>
        <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</strong>
        {task.points && <span className="status-badge voted" style={{ fontSize: '10px' }}>{task.points} pts</span>}
      </div>
      {isAdmin && (
        <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
          <button 
            onClick={onEdit}
            className="secondary-btn"
            style={{ padding: '2px 6px', fontSize: '10px', marginTop: 0 }}
          >
            Edit
          </button>
          <button 
            onClick={onRemove}
            className="secondary-btn"
            style={{ padding: '2px 6px', fontSize: '10px', color: '#ff4d4d', marginTop: 0 }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
};

export const Session: React.FC<SessionProps> = ({
  session,
  userId,
  onVote,
  onReveal,
  onReset,
  onImport,
  onNext,
  onPrev,
  onAddTask,
  onEditTask,
  onRemoveTask,
  onProposeAdminTransfer,
  onAcceptAdminTransfer,
  onDeclineAdminTransfer,
  onSaveTaskPoints,
  onSetCurrentTask,
  onReorderTasks,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddingTask, setIsAddingTask] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [taskForm, setTaskForm] = React.useState<Task>({ title: '', description: '' });
  const [pendingTransferTarget, setPendingTransferTarget] = React.useState<{ id: string, name: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id as string, 10);
      const newIndex = parseInt(over.id as string, 10);
      onReorderTasks(oldIndex, newIndex);
    }
  };

  const isAdmin = session.adminId === userId;

  const calculateConsensus = () => {
    const numericVotes = Object.values(session.votes)
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v));
      
    if (numericVotes.length === 0) return null;
    
    const sum = numericVotes.reduce((acc, curr) => acc + curr, 0);
    const average = sum / numericVotes.length;
    
    const fibValues = [0, 1, 2, 3, 5, 8, 13, 21];
    const closest = fibValues.reduce((prev, curr) => {
      return (Math.abs(curr - average) < Math.abs(prev - average) ? curr : prev);
    });

    return closest.toString();
  };

  const consensusValue = session.showVotes ? calculateConsensus() : null;

  // Automatically save points when votes are revealed
  React.useEffect(() => {
    if (isAdmin && session.showVotes && consensusValue) {
      onSaveTaskPoints(session.currentTaskIndex, consensusValue);
    }
  }, [session.showVotes, isAdmin, session.currentTaskIndex]);

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
  const myVote = session.votes[userId];

  return (
    <div className="container">
      {session.countdown !== undefined && (
        <div className="countdown-overlay">
          <div className="countdown-number">{session.countdown}</div>
        </div>
      )}

      {session.pendingAdminId === userId && (
        <div className="modal-overlay">
          <div className="card" style={{ textAlign: 'center' }}>
            <h2>Admin Transfer Request</h2>
            <p>The current admin wants to transfer room ownership to you. Do you accept?</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={onAcceptAdminTransfer} style={{ flex: 1 }}>Accept</button>
              <button onClick={onDeclineAdminTransfer} className="secondary-btn" style={{ flex: 1 }}>Decline</button>
            </div>
          </div>
        </div>
      )}

      {pendingTransferTarget && (
        <div className="modal-overlay">
          <div className="card" style={{ textAlign: 'center' }}>
            <h2>Confirm Transfer</h2>
            <p>Are you sure you want to transfer room ownership to <strong>{pendingTransferTarget.name}</strong>?</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={() => { onProposeAdminTransfer(pendingTransferTarget.id); setPendingTransferTarget(null); }} style={{ flex: 1 }}>Confirm</button>
              <button onClick={() => setPendingTransferTarget(null)} className="secondary-btn" style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

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
                style={{ padding: '4px 8px', fontSize: '12px', marginTop: 0 }}
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
                <button type="button" onClick={() => { setIsAddingTask(false); setEditingIndex(null); }} className="secondary-btn" style={{ flex: 1, padding: '0.5rem', marginTop: 0 }}>Cancel</button>
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
              <button onClick={handleExport} className="secondary-btn" style={{ width: '100%', marginTop: 0 }}>
                Export Results
              </button>
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={session.tasks.map((_, index) => index.toString())}
              strategy={verticalListSortingStrategy}
            >
              {session.tasks.map((task, index) => (
                <SortableTaskItem
                  key={index}
                  id={index.toString()}
                  task={task}
                  isActive={index === session.currentTaskIndex}
                  isAdmin={isAdmin}
                  onSelect={() => isAdmin && onSetCurrentTask(index)}
                  onEdit={() => startEdit(index)}
                  onRemove={() => { if(confirm('Remove this task?')) onRemoveTask(index); }}
                />
              ))}
            </SortableContext>
          </DndContext>
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
              <button onClick={onReset} className="secondary-btn" style={{ marginTop: 0 }}>Reset Votes</button>
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
            <div key={p.id} className="participant-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span>{p.name} {p.id === userId ? '(You)' : ''}</span>
                <span className={`status-badge ${session.votes[p.id] ? 'voted' : ''}`}>
                  {session.showVotes 
                    ? (session.votes[p.id] || '...') 
                    : (session.votes[p.id] ? 'Voted' : 'Voting...')}
                </span>
              </div>
              {isAdmin && p.id !== userId && (
                <button 
                  onClick={() => setPendingTransferTarget({ id: p.id, name: p.name })}
                  className="secondary-btn"
                  style={{ padding: '2px 6px', fontSize: '10px', marginTop: '4px', width: '100%' }}
                >
                  Make Admin
                </button>
              )}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
};
