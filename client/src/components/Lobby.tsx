import React, { useState } from 'react';

interface LobbyProps {
  onCreate: (name: string) => void;
  onJoin: (sessionId: string, name: string) => void;
  error: string | null;
}

export const Lobby: React.FC<LobbyProps> = ({ onCreate, onJoin, error }) => {
  const [name, setName] = useState('');
  const [sessionId, setSessionId] = useState('');

  return (
    <div className="lobby-container">
      <div className="card">
        <h1>Planning Poker</h1>
        {error && <div className="error-message">{error}</div>}
        <div className="input-group">
          <label>Your Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h2>Create a Room</h2>
          <button
            onClick={() => onCreate(name)}
            disabled={!name}
            style={{ width: '100%' }}
          >
            Create New Room
          </button>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h2>Join a Room</h2>
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter Room ID"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
            />
          </div>
          <button
            className="secondary-btn"
            onClick={() => onJoin(sessionId, name)}
            disabled={!name || !sessionId}
            style={{ width: '100%' }}
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
};
