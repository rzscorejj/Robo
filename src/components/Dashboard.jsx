import React from 'react';
import './Dashboard.css';
import MarketCard from './MarketCard';

const Dashboard = ({ data, onReset }) => {
  const { teams, date, league, analysis } = data;
  const { metrics, markets } = analysis;

  const evPositiveMarkets = markets.filter(m => m.isEVPositive);
  const bestMarket = evPositiveMarkets.length > 0 ? evPositiveMarkets[0] : null;

  return (
    <div className="dashboard-pro">
      <button className="back-btn-pro" onClick={onReset}>
        &larr; NOVA ANÁLISE
      </button>

      <div className="match-header-pro">
        <div className="match-meta-top">
          <span className="league-badge">{league || 'Amistoso/Copa'}</span>
          <span className="date-badge">{new Date(date).toLocaleDateString('pt-BR')}</span>
        </div>
        <div className="teams-display-pro">
          <div className="team-pro">
            {teams.teamA.logo ? <img src={teams.teamA.logo} alt={teams.teamA.name} className="team-logo-pro" /> : <div className="logo-placeholder">A</div>}
            <span className="team-name-pro">{teams.teamA.name}</span>
          </div>
          <div className="vs-pro">
            <span>VS</span>
          </div>
          <div className="team-pro">
            {teams.teamB.logo ? <img src={teams.teamB.logo} alt={teams.teamB.name} className="team-logo-pro" /> : <div className="logo-placeholder">B</div>}
            <span className="team-name-pro">{teams.teamB.name}</span>
          </div>
        </div>
      </div>

      {bestMarket && (
        <div className="highlight-report glass-pro">
          <div className="highlight-badge">💎 MELHOR ENTRADA (+EV)</div>
          <div className="highlight-content">
            <h3>{bestMarket.name}</h3>
            <div className="ev-stats">
              <div className="ev-stat-box">
                <span>True Prob.</span>
                <strong>{bestMarket.trueProb.toFixed(1)}%</strong>
              </div>
              <div className="ev-stat-box">
                <span>Odd Justa</span>
                <strong>{bestMarket.fairOdd.toFixed(2)}</strong>
              </div>
              <div className="ev-stat-box highlight-odd">
                <span>Odd Oferecida</span>
                <strong>{bestMarket.bookieOdd.toFixed(2)}</strong>
              </div>
              <div className="ev-stat-box success">
                <span>Valor (EV)</span>
                <strong>+{bestMarket.ev.toFixed(2)}%</strong>
              </div>
            </div>
            <div className="stake-recommendation">
              Recomendação de Stake: <strong>{bestMarket.stake} Unidade(s)</strong>
            </div>
          </div>
        </div>
      )}

      <div className="stats-grid-pro">
        <div className="stat-card glass-pro">
          <span className="stat-label">Média Gols Feitos (A)</span>
          <strong className="stat-value">{metrics.teamA_gf}</strong>
        </div>
        <div className="stat-card glass-pro">
          <span className="stat-label">Média Gols Sofridos (A)</span>
          <strong className="stat-value">{metrics.teamA_ga}</strong>
        </div>
        <div className="stat-card glass-pro">
          <span className="stat-label">Média Gols Feitos (B)</span>
          <strong className="stat-value">{metrics.teamB_gf}</strong>
        </div>
        <div className="stat-card glass-pro">
          <span className="stat-label">Média Gols Sofridos (B)</span>
          <strong className="stat-value">{metrics.teamB_ga}</strong>
        </div>
        <div className="stat-card glass-pro">
          <span className="stat-label">Média Total Escanteios</span>
          <strong className="stat-value">{metrics.cornersAvg}</strong>
        </div>
        <div className="stat-card glass-pro">
          <span className="stat-label">Média Total Cartões</span>
          <strong className="stat-value">{metrics.cardsAvg}</strong>
        </div>
      </div>

      <h3 className="section-title-pro">Todos os Mercados Analisados</h3>
      
      <div className="markets-grid-pro">
        {markets.length === 0 && (
          <div className="no-data">Nenhuma odd foi preenchida para análise.</div>
        )}
        {markets.map((m, idx) => (
          <MarketCard key={idx} market={m} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
