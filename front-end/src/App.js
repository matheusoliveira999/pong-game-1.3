import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Game from "./components/Game";
import Menu from "./components/Menu";
import Leaderboard from "./components/Leaderboard";

function App() {
  const [currentView, setCurrentView] = useState('menu');
  const [gameSettings, setGameSettings] = useState({
    mode: 'single_player',
    player1Name: 'Player 1',
    player2Name: 'Player 2',
    botDifficulty: 'medium'
  });

  const handleStartGame = (settings) => {
    setGameSettings(settings);
    setCurrentView('game');
  };

  const handleGameEnd = () => {
    setCurrentView('menu');
  };

  const handleShowLeaderboard = () => {
    setCurrentView('leaderboard');
  };

  const handleBackToMenu = () => {
    setCurrentView('menu');
  };

  return (
    <div className="App">
      <div className="game-container">
        {currentView === 'menu' && (
          <Menu 
            onStartGame={handleStartGame}
            onShowLeaderboard={handleShowLeaderboard}
          />
        )}
        {currentView === 'game' && (
          <Game 
            settings={gameSettings}
            onGameEnd={handleGameEnd}
          />
        )}
        {currentView === 'leaderboard' && (
          <Leaderboard 
            onBackToMenu={handleBackToMenu}
          />
        )}
      </div>
    </div>
  );
}

export default App;