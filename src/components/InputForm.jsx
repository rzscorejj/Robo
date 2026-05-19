import React, { useState } from 'react';
import './InputForm.css';

// Chave da API chumbada para uso automático
const FIXED_API_KEY = '83aa63a8ca56c3bb44dcf13023dd3a20';

const InputForm = ({ onAnalysisComplete }) => {
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [date, setDate] = useState('');
  const [league, setLeague] = useState('');
  const [odds, setOdds] = useState({
    home: '',
    draw: '',
    away: '',
    over25: '',
    under25: '',
    bttsYes: '',
    cornersOver85: '',
    cardsOver35: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOddsChange = (e) => {
    const { name, value } = e.target;
    setOdds(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { validateAndFetchTeams, getTeamLast10 } = await import('../services/apiFootball.js');
      const { runAnalysis } = await import('../services/analysisEngine.js');

      // 1. Validar e buscar times
      const { teamA: tA, teamB: tB } = await validateAndFetchTeams(FIXED_API_KEY, teamA, teamB);

      // 2. Buscar últimos 10 jogos de cada time
      const [last10A, last10B] = await Promise.all([
        getTeamLast10(FIXED_API_KEY, tA.id),
        getTeamLast10(FIXED_API_KEY, tB.id)
      ]);

      if (!last10A || last10A.length === 0 || !last10B || last10B.length === 0) {
        throw new Error('Jogos insuficientes para análise confiável.');
      }

      // 3. Rodar Motor de Análise
      const analysisData = runAnalysis(
        { teamA: tA, teamB: tB },
        last10A,
        last10B,
        odds
      );

      setLoading(false);
      onAnalysisComplete({
        teams: { 
          teamA: { name: tA.name, logo: tA.logo }, 
          teamB: { name: tB.name, logo: tB.logo } 
        },
        date,
        league,
        odds,
        analysis: analysisData
      });

    } catch (err) {
      setError(err.message || 'Dados insuficientes para análise confiável.');
      setLoading(false);
    }
  };

  return (
    <div className="input-form-container glass">
      <h2>Nova Análise</h2>
      {error && <div className="error-alert">{error}</div>}
      
      <form onSubmit={handleSubmit} className="analysis-form">
        <div className="form-row">
          <div className="form-group">
            <label>Time Mandante (A)</label>
            <input type="text" value={teamA} onChange={(e) => setTeamA(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Time Visitante (B)</label>
            <input type="text" value={teamB} onChange={(e) => setTeamB(e.target.value)} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Data do Jogo</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Campeonato</label>
            <input type="text" value={league} onChange={(e) => setLeague(e.target.value)} placeholder="Opcional" />
          </div>
        </div>

        <h3 className="section-title">Odds Disponíveis</h3>
        
        <div className="odds-grid">
          <div className="form-group">
            <label>Mandante (1)</label>
            <input type="number" step="0.01" name="home" value={odds.home} onChange={handleOddsChange} />
          </div>
          <div className="form-group">
            <label>Empate (X)</label>
            <input type="number" step="0.01" name="draw" value={odds.draw} onChange={handleOddsChange} />
          </div>
          <div className="form-group">
            <label>Visitante (2)</label>
            <input type="number" step="0.01" name="away" value={odds.away} onChange={handleOddsChange} />
          </div>
          
          <div className="form-group">
            <label>Over 2.5</label>
            <input type="number" step="0.01" name="over25" value={odds.over25} onChange={handleOddsChange} />
          </div>
          <div className="form-group">
            <label>Under 2.5</label>
            <input type="number" step="0.01" name="under25" value={odds.under25} onChange={handleOddsChange} />
          </div>
          <div className="form-group">
            <label>Ambas Marcam</label>
            <input type="number" step="0.01" name="bttsYes" value={odds.bttsYes} onChange={handleOddsChange} />
          </div>
          
          <div className="form-group">
            <label>Mais de 8.5 Escanteios</label>
            <input type="number" step="0.01" name="cornersOver85" value={odds.cornersOver85} onChange={handleOddsChange} />
          </div>
          <div className="form-group">
            <label>Mais de 3.5 Cartões</label>
            <input type="number" step="0.01" name="cardsOver35" value={odds.cardsOver35} onChange={handleOddsChange} />
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Analisando dados...' : 'Analisar Jogo'}
        </button>
      </form>
    </div>
  );
};

export default InputForm;
