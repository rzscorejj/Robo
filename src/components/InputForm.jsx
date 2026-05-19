import React, { useState, useEffect } from 'react';
import './InputForm.css';

const InputForm = ({ onAnalysisComplete }) => {
  const [apiKey, setApiKey] = useState('');
  const [isKeyIntegrated, setIsKeyIntegrated] = useState(false);
  
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

  useEffect(() => {
    // Tenta pegar a chave do .env primeiro, depois do localStorage
    const savedKey = import.meta.env.VITE_API_KEY || localStorage.getItem('api_football_key');
    if (savedKey && savedKey.trim() !== '') {
      setApiKey(savedKey);
      setIsKeyIntegrated(true);
    }
  }, []);

  const handleOddsChange = (e) => {
    const { name, value } = e.target;
    setOdds(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!apiKey) {
      setError('A Chave da API é obrigatória. Por favor, configure o arquivo .env ou insira abaixo.');
      return;
    }
    
    if (!isKeyIntegrated) {
      localStorage.setItem('api_football_key', apiKey);
      setIsKeyIntegrated(true);
    }
    
    setLoading(true);
    setError(null);

    try {
      // Import dynamic to avoid top-level issues if not needed yet
      const { validateAndFetchTeams, getTeamLast10 } = await import('../services/apiFootball.js');
      const { runAnalysis } = await import('../services/analysisEngine.js');

      // 1. Validar e buscar times
      const { teamA: tA, teamB: tB } = await validateAndFetchTeams(apiKey, teamA, teamB);

      // 2. Buscar últimos 10 jogos de cada time
      const [last10A, last10B] = await Promise.all([
        getTeamLast10(apiKey, tA.id),
        getTeamLast10(apiKey, tB.id)
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
        {!isKeyIntegrated && (
          <div className="form-group">
            <label>API Key (API-Football)</label>
            <input 
              type="password" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)} 
              placeholder="Insira sua chave da API"
              required={!isKeyIntegrated} 
            />
            <small>Sua chave será salva localmente no navegador.</small>
          </div>
        )}

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
            <label>Ambas Marcam (Sim)</label>
            <input type="number" step="0.01" name="bttsYes" value={odds.bttsYes} onChange={handleOddsChange} />
          </div>
          
          <div className="form-group">
            <label>Over 8.5 Escanteios</label>
            <input type="number" step="0.01" name="cornersOver85" value={odds.cornersOver85} onChange={handleOddsChange} />
          </div>
          <div className="form-group">
            <label>Over 3.5 Cartões</label>
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
