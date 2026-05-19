import React from 'react';
import './MarketCard.css';

const MarketCard = ({ market }) => {
  const isEVPositive = market.ev > 0;
  const statusClass = isEVPositive ? 'ev-positive' : 'ev-negative';

  return (
    <div className={`market-card-pro glass-pro ${statusClass}`}>
      <div className="mc-header">
        <h4>{market.name}</h4>
        {isEVPositive && <span className="mc-badge">COM VALOR</span>}
      </div>
      
      <div className="mc-body">
        <div className="mc-metrics">
          <div className="mc-metric">
            <span>Prob Real</span>
            <strong>{market.trueProb.toFixed(1)}%</strong>
          </div>
          <div className="mc-metric">
            <span>Odd Justa</span>
            <strong>{market.fairOdd.toFixed(2)}</strong>
          </div>
          <div className="mc-metric">
            <span>Odd Casa</span>
            <strong>{market.bookieOdd.toFixed(2)}</strong>
          </div>
        </div>
        
        <div className="mc-ev-box">
          <span>Expected Value (EV)</span>
          <strong className={isEVPositive ? 'text-success' : 'text-danger'}>
            {market.ev > 0 ? '+' : ''}{market.ev.toFixed(2)}%
          </strong>
        </div>
      </div>
    </div>
  );
};

export default MarketCard;
