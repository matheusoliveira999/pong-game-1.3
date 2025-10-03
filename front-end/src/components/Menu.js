import React, { useState } from 'react';

const Menu = ({ onStartGame, onShowLeaderboard }) => {
  const [mode, setMode] = useState('single_player');
  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('Player 2');
  const [botDifficulty, setBotDifficulty] = useState('medium');

  const handleStartGame = () => {
    const settings = {
      mode,
      player1Name,
      player2Name: mode === 'multiplayer' ? player2Name : 'Bot',
      botDifficulty: mode === 'single_player' ? botDifficulty : null
    };
    onStartGame(settings);
  };

  return (
    <div className="menu fade-in" data-testid="main-menu">
      <h1>PING PONG</h1>
      <p className="menu-subtitle">Masters Tournament</p>
      
      <div className="menu-section">
        <h3>Game Mode</h3>
        <div className="mode-selector">
          <button 
            className={`mode-btn ${mode === 'single_player' ? 'active' : ''}`}
            onClick={() => setMode('single_player')}
            data-testid="single-player-mode-btn"
          >
            vs Bot
          </button>
          <button 
            className={`mode-btn ${mode === 'multiplayer' ? 'active' : ''}`}
            onClick={() => setMode('multiplayer')}
            data-testid="multiplayer-mode-btn"
          >
            2 Players
          </button>
        </div>
      </div>

      <div className="menu-section">
        <h3>Players</h3>
        <div className="input-group">
          <label>Player 1 Name</label>
          <input
            type="text"
            value={player1Name}
            onChange={(e) => setPlayer1Name(e.target.value)}
            placeholder="Enter player 1 name"
            data-testid="player1-name-input"
          />
        </div>
        
        {mode === 'multiplayer' && (
          <div className="input-group">
            <label>Player 2 Name</label>
            <input
              type="text"
              value={player2Name}
              onChange={(e) => setPlayer2Name(e.target.value)}
              placeholder="Enter player 2 name"
              data-testid="player2-name-input"
            />
          </div>
        )}
        
        {mode === 'single_player' && (
          <div className="input-group">
            <label>Bot Difficulty</label>
            <select
              value={botDifficulty}
              onChange={(e) => setBotDifficulty(e.target.value)}
              data-testid="bot-difficulty-select"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        )}
      </div>

      <div className="menu-buttons">
        <button 
          className="menu-btn" 
          onClick={handleStartGame}
          data-testid="start-game-btn"
        >
          Start Game
        </button>
        <button 
          className="menu-btn secondary" 
          onClick={onShowLeaderboard}
          data-testid="show-leaderboard-btn"
        >
          View Leaderboard
        </button>
      </div>
    </div>
  );
};

export default Menu;