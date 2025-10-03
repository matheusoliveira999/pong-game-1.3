import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Leaderboard = ({ onBackToMenu }) => {
  const [activeTab, setActiveTab] = useState('consecutive');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async (type = 'consecutive') => {
    try {
      setLoading(true);
      const endpoint = type === 'consecutive' ? '/leaderboard' : '/leaderboard/best-streaks';
      const response = await axios.get(`${API}${endpoint}`);
      setLeaderboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setLeaderboardData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const getStreakValue = (player) => {
    return activeTab === 'consecutive' ? player.consecutive_wins : player.best_streak;
  };

  const getStreakLabel = () => {
    return activeTab === 'consecutive' ? 'Current Streak' : 'Best Streak';
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  return (
    <div className="leaderboard fade-in" data-testid="leaderboard">
      <h2>Leaderboard</h2>
      
      <div className="leaderboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'consecutive' ? 'active' : ''}`}
          onClick={() => handleTabChange('consecutive')}
          data-testid="consecutive-wins-tab"
        >
          Current Streaks
        </button>
        <button 
          className={`tab-btn ${activeTab === 'best' ? 'active' : ''}`}
          onClick={() => handleTabChange('best')}
          data-testid="best-streaks-tab"
        >
          Best Streaks
        </button>
      </div>

      <div className="leaderboard-list" data-testid="leaderboard-list">
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#cbd5e1', 
            padding: '2rem',
            fontSize: '1.1rem'
          }}>
            <div className="pulse">Loading...</div>
          </div>
        ) : leaderboardData.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#cbd5e1', 
            padding: '2rem',
            fontSize: '1.1rem'
          }}>
            No players yet. Be the first to play!
          </div>
        ) : (
          leaderboardData.map((player, index) => (
            <div 
              key={`${player.name}-${index}`} 
              className="leaderboard-item"
              data-testid={`leaderboard-item-${index}`}
            >
              <div className="rank" data-testid={`rank-${index}`}>
                {getRankIcon(index)}
              </div>
              <div className="player-info">
                <div className="player-name" data-testid={`player-name-${index}`}>
                  {player.name}
                </div>
                <div className="player-stats" data-testid={`player-stats-${index}`}>
                  {player.total_wins}/{player.total_games} wins
                  {player.total_games > 0 && 
                    ` (${Math.round((player.total_wins / player.total_games) * 100)}%)`
                  }
                </div>
              </div>
              <div className="streak-info" style={{ textAlign: 'right' }}>
                <div className="streak-value" data-testid={`streak-value-${index}`}>
                  {getStreakValue(player)}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {getStreakLabel()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button 
          className="menu-btn secondary" 
          onClick={onBackToMenu}
          data-testid="back-to-menu-btn"
        >
          Back to Menu
        </button>
      </div>

      {/* Leaderboard Stats Summary */}
      {!loading && leaderboardData.length > 0 && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(30, 41, 59, 0.3)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '0.9rem',
          color: '#94a3b8',
          textAlign: 'center'
        }}>
          <p>
            Total Players: {leaderboardData.length} • 
            Top Streak: {Math.max(...leaderboardData.map(p => getStreakValue(p)))} wins
          </p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;