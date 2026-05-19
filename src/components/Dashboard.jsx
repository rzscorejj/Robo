import React from 'react';
import MarketCard from './MarketCard';
import './Dashboard.css';

const Dashboard = ({ result, onReset }) => {
  const { teams, date, league, analysis } = result;

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high': return 'var(--success)';
      case 'medium': return 'var(--warning)';
      case 'low': return 'var(--danger)';
      default: return 'var(--text-primary)';
    }
  };

  const translateConfidence = (confidence) => {
    switch (confidence) {
      case 'high': return 'Alta Confiança';
      case 'medium': return 'Média Confiança';
      case 'low': return 'Baixa Confiança (Evitar)';
      default: return '';
    }
  };

  return (
    <div className="dashboard-container">
      <button className="back-btn" onClick={onReset}>&larr; Nova Análise</button>
      
      <div className="match-header glass">
        <div className="match-teams">
          <div className="team-info">
            {teams.teamA.logo ? <img src={teams.teamA.logo} alt={teams.teamA.name} className="team-logo" /> : null}
            <span className="team-name">{teams.teamA.name}</span>
          </div>
          <span className="vs">-</span>
          <div className="team-info">
            {teams.teamB.logo ? <img src={teams.teamB.logo} alt={teams.teamB.name} className="team-logo" /> : null}
            <span className="team-name">{teams.teamB.name}</span>
          </div>
        </div>
        <p className="match-meta">
          {new Date(date).toLocaleDateString('pt-BR')} {league && `| ${league}`}
        </p>
      </div>

      <div className="main-report glass">
        <h3 className="section-title">Relatório Principal</h3>
        
        <div className="report-grid">
          <div className="report-item highlight">
            <span className="label">Melhor Mercado</span>
            <span className="value" style={{ color: getConfidenceColor(analysis.confidence) }}>
              {analysis.bestMarket}
            </span>
          </div>
          <div className="report-item">
            <span className="label">Nível de Confiança</span>
            <span className="value">{translateConfidence(analysis.confidence)}</span>
          </div>
          <div className="report-item">
            <span className="label">Odd Mínima de Valor</span>
            <span className="value">@{analysis.minOdd}</span>
          </div>
          <div className="report-item highlight">
            <span className="label">Stake Sugerida</span>
            <span className="value">{analysis.stake} Unidade(s)</span>
          </div>
        </div>

        <div className="report-details">
          <div className="detail-box">
            <h4>Justificativa Estatística</h4>
            <p>{analysis.reasoning}</p>
          </div>
          <div className="detail-box warning-box">
            <h4>Pontos de Risco</h4>
            <p>{analysis.risks}</p>
          </div>
          <div className="detail-box action-box">
            <h4>Recomendação Final</h4>
            <p className="recommendation-text">{analysis.recommendation.toUpperCase()}</p>
          </div>
        </div>
      </div>

      <h3 className="section-title">Análise por Mercados</h3>
      <div className="markets-grid">
        {analysis.markets.map((market, idx) => (
          <MarketCard key={idx} market={market} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
