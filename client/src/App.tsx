import { Lobby } from './components/Lobby';
import { Session } from './components/Session';
import { useSocket } from './hooks/useSocket';
import './App.css';

function App() {
  const {
    socketId,
    session,
    error,
    createRoom,
    joinRoom,
    vote,
    revealVotes,
    resetVotes,
    importTasks,
    nextTask,
    prevTask,
  } = useSocket();

  return (
    <div className="App">
      {!session ? (
        <Lobby
          onCreate={(name) => createRoom(name)}
          onJoin={(sessionId, name) => joinRoom(sessionId, name)}
          error={error}
        />
      ) : (
        <Session
          session={session}
          socketId={socketId}
          onVote={(value) => vote(session.id, value)}
          onReveal={() => revealVotes(session.id)}
          onReset={() => resetVotes(session.id)}
          onImport={(tasks) => importTasks(session.id, tasks)}
          onNext={(points) => nextTask(session.id, points)}
          onPrev={() => prevTask(session.id)}
        />
      )}
    </div>
  );
}

export default App;
