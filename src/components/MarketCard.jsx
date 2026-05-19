import React from 'react';
import './MarketCard.css';

const MarketCard = ({ market }) => {
  const getConfidenceClass = (confidence) => {
    switch (confidence) {
      case 'high': return 'card-high';
      case 'medium': return 'card-medium';
      case 'low': return 'card-low';
      default: return '';
    }
  };

  const getConfidenceText = (confidence) => {
    switch (confidence) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return 'Desconhecida';
    }
  };

  return (
    <div className={`glass glass-card market-card ${getConfidenceClass(market.confidence)}`}>
      <div className="market-info">
        <div className="market-header">
          <h4>{market.name}</h4>
          <span className="confidence-badge">{getConfidenceText(market.confidence)}</span>
        </div>
        <p className="market-desc">{market.desc}</p>
      </div>
      
      <div className="trend-container">
        <div className="trend-bar-wrapper">
          <div 
            className="trend-bar-fill" 
            style={{ width: market.trend }}
          ></div>
        </div>
        <span className="trend-value">{market.trend}</span>
      </div>
    </div>
  );
};

export default MarketCard;
