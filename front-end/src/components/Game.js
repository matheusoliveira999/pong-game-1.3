import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Game = ({ settings, onGameEnd }) => {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const animationRef = useRef(null);
  
  const [gameState, setGameState] = useState('playing'); // playing, paused, game_over
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [winner, setWinner] = useState(null);
  const [gameStartTime] = useState(Date.now());

  // Game configuration
  const config = {
    canvas: {
      width: 800,
      height: 400
    },
    paddle: {
      width: 12,
      height: 80,
      speed: 6
    },
    ball: {
      size: 12,
      initialSpeed: 4,
      maxSpeed: 8
    },
    winningScore: 5
  };

  // Bot difficulty settings
  const botSettings = {
    easy: { speed: 0.8, accuracy: 0.6, reactionDelay: 300 },
    medium: { speed: 1.0, accuracy: 0.8, reactionDelay: 200 },
    hard: { speed: 1.2, accuracy: 0.95, reactionDelay: 100 }
  };

  // Initialize game objects
  const initializeGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    // Adjust canvas size for mobile
    const isMobile = window.innerWidth <= 768;
    const canvasWidth = isMobile ? Math.min(350, window.innerWidth - 40) : config.canvas.width;
    const canvasHeight = isMobile ? canvasWidth * 0.6 : config.canvas.height;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Scale factors for responsive gameplay
    const scaleX = canvasWidth / config.canvas.width;
    const scaleY = canvasHeight / config.canvas.height;

    return {
      canvas,
      ctx: canvas.getContext('2d'),
      scaleX,
      scaleY,
      paddle1: {
        x: 20 * scaleX,
        y: canvasHeight / 2 - (config.paddle.height * scaleY) / 2,
        width: config.paddle.width * scaleX,
        height: config.paddle.height * scaleY,
        dy: 0
      },
      paddle2: {
        x: canvasWidth - (20 + config.paddle.width) * scaleX,
        y: canvasHeight / 2 - (config.paddle.height * scaleY) / 2,
        width: config.paddle.width * scaleX,
        height: config.paddle.height * scaleY,
        dy: 0
      },
      ball: {
        x: canvasWidth / 2,
        y: canvasHeight / 2,
        dx: (Math.random() > 0.5 ? 1 : -1) * config.ball.initialSpeed * scaleX,
        dy: (Math.random() - 0.5) * config.ball.initialSpeed * scaleY,
        size: config.ball.size * Math.min(scaleX, scaleY)
      },
      keys: {},
      lastBotMove: 0,
      botTarget: canvasHeight / 2
    };
  }, []);

  // Game loop
  const gameLoop = useCallback(() => {
    const game = gameRef.current;
    if (!game || gameState !== 'playing') return;

    const { ctx, canvas, paddle1, paddle2, ball, keys, scaleX, scaleY } = game;

    // Clear canvas
    ctx.fillStyle = '#0a0f1c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Update paddle1 (player 1)
    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
      paddle1.dy = -config.paddle.speed * scaleY;
    } else if (keys['ArrowDown'] || keys['s'] || keys['S']) {
      paddle1.dy = config.paddle.speed * scaleY;
    } else {
      paddle1.dy = 0;
    }

    paddle1.y += paddle1.dy;
    paddle1.y = Math.max(0, Math.min(canvas.height - paddle1.height, paddle1.y));

    // Update paddle2 (player 2 or bot)
    if (settings.mode === 'multiplayer') {
      // Player 2 controls
      if (keys['i'] || keys['I']) {
        paddle2.dy = -config.paddle.speed * scaleY;
      } else if (keys['k'] || keys['K']) {
        paddle2.dy = config.paddle.speed * scaleY;
      } else {
        paddle2.dy = 0;
      }
    } else {
      // Bot AI
      const botConfig = botSettings[settings.botDifficulty] || botSettings.medium;
      const now = Date.now();
      
      if (now - game.lastBotMove > botConfig.reactionDelay) {
        const ballCenterY = ball.y;
        const paddleCenterY = paddle2.y + paddle2.height / 2;
        
        // Add some randomness based on accuracy
        const accuracy = botConfig.accuracy;
        const randomFactor = (1 - accuracy) * (Math.random() - 0.5) * 100;
        game.botTarget = ballCenterY + randomFactor;
        game.lastBotMove = now;
      }
      
      const targetDiff = game.botTarget - (paddle2.y + paddle2.height / 2);
      if (Math.abs(targetDiff) > 5) {
        paddle2.dy = targetDiff > 0 ? 
          config.paddle.speed * scaleY * botConfig.speed : 
          -config.paddle.speed * scaleY * botConfig.speed;
      } else {
        paddle2.dy = 0;
      }
    }

    paddle2.y += paddle2.dy;
    paddle2.y = Math.max(0, Math.min(canvas.height - paddle2.height, paddle2.y));

    // Update ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with top and bottom walls
    if (ball.y <= ball.size || ball.y >= canvas.height - ball.size) {
      ball.dy = -ball.dy;
    }

    // Ball collision with paddles
    // Left paddle
    if (ball.x - ball.size <= paddle1.x + paddle1.width &&
        ball.y >= paddle1.y &&
        ball.y <= paddle1.y + paddle1.height &&
        ball.dx < 0) {
      ball.dx = -ball.dx;
      ball.dx *= 1.05; // Increase speed slightly
      ball.dx = Math.min(ball.dx, config.ball.maxSpeed * scaleX);
      
      // Add spin based on where the ball hit the paddle
      const hitPos = (ball.y - paddle1.y) / paddle1.height;
      ball.dy = (hitPos - 0.5) * 6 * scaleY;
    }

    // Right paddle
    if (ball.x + ball.size >= paddle2.x &&
        ball.y >= paddle2.y &&
        ball.y <= paddle2.y + paddle2.height &&
        ball.dx > 0) {
      ball.dx = -ball.dx;
      ball.dx *= 1.05;
      ball.dx = Math.max(ball.dx, -config.ball.maxSpeed * scaleX);
      
      const hitPos = (ball.y - paddle2.y) / paddle2.height;
      ball.dy = (hitPos - 0.5) * 6 * scaleY;
    }

    // Ball out of bounds (scoring)
    if (ball.x < 0) {
      // Player 2 scores
      setScores(prev => {
        const newScores = { ...prev, player2: prev.player2 + 1 };
        if (newScores.player2 >= config.winningScore) {
          setWinner(settings.mode === 'multiplayer' ? settings.player2Name : 'Bot');
          setGameState('game_over');
        }
        return newScores;
      });
      resetBall();
    } else if (ball.x > canvas.width) {
      // Player 1 scores
      setScores(prev => {
        const newScores = { ...prev, player1: prev.player1 + 1 };
        if (newScores.player1 >= config.winningScore) {
          setWinner(settings.player1Name);
          setGameState('game_over');
        }
        return newScores;
      });
      resetBall();
    }

    function resetBall() {
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
      ball.dx = (Math.random() > 0.5 ? 1 : -1) * config.ball.initialSpeed * scaleX;
      ball.dy = (Math.random() - 0.5) * config.ball.initialSpeed * scaleY;
    }

    // Draw paddles
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);
    ctx.fillRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);

    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    ctx.fillStyle = '#f1f5f9';
    ctx.fill();
    
    // Add glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#06b6d4';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, settings, config]);

  // Save game result to database
  const saveGameResult = async (gameData) => {
    try {
      await axios.post(`${API}/games`, gameData);
    } catch (error) {
      console.error('Failed to save game result:', error);
    }
  };

  // Handle game over
  useEffect(() => {
    if (gameState === 'game_over' && winner) {
      const gameData = {
        mode: settings.mode,
        player1_name: settings.player1Name,
        player2_name: settings.mode === 'multiplayer' ? settings.player2Name : null,
        winner: winner,
        player1_score: scores.player1,
        player2_score: scores.player2,
        bot_difficulty: settings.mode === 'single_player' ? settings.botDifficulty : null,
        game_duration: Math.floor((Date.now() - gameStartTime) / 1000)
      };
      saveGameResult(gameData);
    }
  }, [gameState, winner, scores, settings, gameStartTime]);

  // Touch controls for mobile
  const handleTouchStart = (player, direction) => {
    gameRef.current.keys[player === 1 ? (direction === 'up' ? 'w' : 's') : (direction === 'up' ? 'i' : 'k')] = true;
  };

  const handleTouchEnd = (player, direction) => {
    gameRef.current.keys[player === 1 ? (direction === 'up' ? 'w' : 's') : (direction === 'up' ? 'i' : 'k')] = false;
  };

  // Initialize game and start game loop
  useEffect(() => {
    gameRef.current = initializeGame();
    
    if (gameRef.current) {
      gameLoop();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initializeGame, gameLoop]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameRef.current) {
        gameRef.current.keys[e.key] = true;
      }
    };

    const handleKeyUp = (e) => {
      if (gameRef.current) {
        gameRef.current.keys[e.key] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handlePause = () => {
    setGameState(gameState === 'paused' ? 'playing' : 'paused');
  };

  const handleRestart = () => {
    setScores({ player1: 0, player2: 0 });
    setWinner(null);
    setGameState('playing');
    gameRef.current = initializeGame();
  };

  return (
    <div className="game-screen" data-testid="game-screen">
      <div className="game-hud">
        <div className="score" data-testid="player1-score">
          <h3>{settings.player1Name}</h3>
          <div className="score-value">{scores.player1}</div>
        </div>
        <div className="score" data-testid="player2-score">
          <h3>{settings.mode === 'multiplayer' ? settings.player2Name : 'Bot'}</h3>
          <div className="score-value">{scores.player2}</div>
        </div>
      </div>

      <div className="game-canvas-container">
        <canvas ref={canvasRef} className="game-canvas" data-testid="game-canvas" />
      </div>

      <div className="game-controls">
        <button 
          className="control-btn" 
          onClick={handlePause}
          data-testid="pause-btn"
        >
          {gameState === 'paused' ? 'Resume' : 'Pause'}
        </button>
        <button 
          className="control-btn" 
          onClick={handleRestart}
          data-testid="restart-btn"
        >
          Restart
        </button>
        <button 
          className="control-btn" 
          onClick={onGameEnd}
          data-testid="back-to-menu-btn"
        >
          Back to Menu
        </button>
      </div>

      {/* Mobile Controls */}
      {window.innerWidth <= 768 && (
        <div className="mobile-controls">
          <div className="player-controls">
            <div 
              className="touch-area"
              onTouchStart={() => handleTouchStart(1, 'up')}
              onTouchEnd={() => handleTouchEnd(1, 'up')}
              data-testid="player1-up-btn"
            >
              {settings.player1Name}<br/>UP
            </div>
            <div 
              className="touch-area"
              onTouchStart={() => handleTouchStart(1, 'down')}
              onTouchEnd={() => handleTouchEnd(1, 'down')}
              data-testid="player1-down-btn"
            >
              {settings.player1Name}<br/>DOWN
            </div>
          </div>
          {settings.mode === 'multiplayer' && (
            <div className="player-controls">
              <div 
                className="touch-area"
                onTouchStart={() => handleTouchStart(2, 'up')}
                onTouchEnd={() => handleTouchEnd(2, 'up')}
                data-testid="player2-up-btn"
              >
                {settings.player2Name}<br/>UP
              </div>
              <div 
                className="touch-area"
                onTouchStart={() => handleTouchStart(2, 'down')}
                onTouchEnd={() => handleTouchEnd(2, 'down')}
                data-testid="player2-down-btn"
              >
                {settings.player2Name}<br/>DOWN
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game Over Modal */}
      {gameState === 'game_over' && (
        <div className="game-over-modal" data-testid="game-over-modal">
          <div className="game-over-content">
            <h2>Game Over!</h2>
            <p data-testid="winner-text">
              🏆 {winner} Wins!<br/>
              Final Score: {scores.player1} - {scores.player2}
            </p>
            <div className="menu-buttons">
              <button className="menu-btn" onClick={handleRestart} data-testid="play-again-btn">
                Play Again
              </button>
              <button className="menu-btn secondary" onClick={onGameEnd} data-testid="back-to-menu-from-gameover-btn">
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Instructions */}
      <div style={{ 
        position: 'absolute', 
        bottom: '0.5rem', 
        left: '50%', 
        transform: 'translateX(-50%)',
        fontSize: '0.8rem', 
        color: '#64748b', 
        textAlign: 'center',
        display: window.innerWidth > 768 ? 'block' : 'none'
      }}>
        Player 1: W/S or ↑/↓ keys {settings.mode === 'multiplayer' && '| Player 2: I/K keys'}
      </div>
    </div>
  );
};

export default Game;