import React, { useState } from 'react';
import './InputForm.css';

// Chave da API chumbada para uso automático
const FIXED_API_KEY = '83aa63a8ca56c3bb44dcf13023dd3a20';

const InputForm = ({ onAnalysisComplete }) => {
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [date, setDate] = useState('');
  const [league, setLeague] = useState('');
  const [sofascoreLink, setSofascoreLink] = useState('https://www.sofascore.com/pt');
  const [odds, setOdds] = useState({
    home: '',
    draw: '',
    away: '',
    over05ht: '',
    over15: '',
    over25: '',
    bttsYes: '',
    corners85: '',
    corners95: '',
    corners105: '',
    cards35: '',
    cards45: '',
    dc1x: '',
    dc12: '',
    dcx2: '',
    ahHome: '',
    ahAway: '',
    ahLine: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
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
      const { validateAndFetchTeams, getTeamAdvancedStats, getH2H } = await import('../services/apiFootball.js');
      const { runAnalysis } = await import('../services/analysisEngine.js');

      setLoadingText('Validando times...');
      const { teamA: tA, teamB: tB } = await validateAndFetchTeams(FIXED_API_KEY, teamA, teamB);

      setLoadingText('Buscando histórico e contexto H2H...');
      const [statsA, statsB, h2h] = await Promise.all([
        getTeamAdvancedStats(FIXED_API_KEY, tA.id, 'home'),
        getTeamAdvancedStats(FIXED_API_KEY, tB.id, 'away'),
        getH2H(FIXED_API_KEY, tA.id, tB.id)
      ]);

      if (!statsA.last10 || statsA.last10.length === 0 || !statsB.last10 || statsB.last10.length === 0) {
        throw new Error('Jogos insuficientes para análise quantitativa confiável.');
      }

      setLoadingText('Processando Algoritmos de EV+ e Odd Justa...');
      const analysisData = runAnalysis(
        { teamA: tA, teamB: tB },
        statsA,
        statsB,
        h2h,
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
      <div className="form-header-pro">
        <h2>QUANTITATIVE ENGINE</h2>
        <span className="badge-pro">PRO</span>
      </div>
      
      {error && <div className="error-alert">{error}</div>}
      
      <form onSubmit={handleSubmit} className="analysis-form">
        <div className="form-group">
          <label>Link Sofascore (Referência)</label>
          <input type="url" value={sofascoreLink} onChange={(e) => setSofascoreLink(e.target.value)} placeholder="https://www.sofascore.com/..." />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Mandante (A) *</label>
            <input type="text" value={teamA} onChange={(e) => setTeamA(e.target.value)} required placeholder="Ex: Flamengo" />
          </div>
          <div className="form-group">
            <label>Visitante (B) *</label>
            <input type="text" value={teamB} onChange={(e) => setTeamB(e.target.value)} required placeholder="Ex: Vasco" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Data *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Campeonato</label>
            <input type="text" value={league} onChange={(e) => setLeague(e.target.value)} placeholder="Opcional" />
          </div>
        </div>

        <h3 className="section-title">ODDS DA CASA DE APOSTAS</h3>
        
        <div className="odds-grid pro-grid">
          <div className="odds-section">
            <h4>Match Odds (1X2)</h4>
            <input type="number" step="0.01" name="home" placeholder="1 (Mandante)" value={odds.home} onChange={handleOddsChange} />
            <input type="number" step="0.01" name="draw" placeholder="X (Empate)" value={odds.draw} onChange={handleOddsChange} />
            <input type="number" step="0.01" name="away" placeholder="2 (Visitante)" value={odds.away} onChange={handleOddsChange} />
          </div>

          <div className="odds-section">
            <h4>Dupla Chance</h4>
            <input type="number" step="0.01" name="dc1x" placeholder="1X" value={odds.dc1x} onChange={handleOddsChange} />
            <input type="number" step="0.01" name="dc12" placeholder="12" value={odds.dc12} onChange={handleOddsChange} />
            <input type="number" step="0.01" name="dcx2" placeholder="X2" value={odds.dcx2} onChange={handleOddsChange} />
          </div>

          <div className="odds-section">
            <h4>Handicap Asiático</h4>
            <input type="number" step="0.25" name="ahLine" placeholder="Linha (ex: -0.5)" value={odds.ahLine} onChange={handleOddsChange} />
            <input type="number" step="0.01" name="ahHome" placeholder="AH Mandante" value={odds.ahHome} onChange={handleOddsChange} />
            <input type="number" step="0.01" name="ahAway" placeholder="AH Visitante" value={odds.ahAway} onChange={handleOddsChange} />
          </div>

          <div className="odds-section">
            <h4>Gols (Over)</h4>
            <input type="number" step="0.01" name="over05ht" placeholder="Over 0.5 HT" value={odds.over05ht} onChange={handleOddsChange} />
            <input type="number" step="0.01" name="over15" placeholder="Over 1.5" value={odds.over15} onChange={handleOddsChange} />
            <input type="number" step="0.01" name="over25" placeholder="Over 2.5" value={odds.over25} onChange={handleOddsChange} />
            <input type="number" step="0.01" name="bttsYes" placeholder="Ambas Marcam" value={odds.bttsYes} onChange={handleOddsChange} />
          </div>

          <div className="odds-section">
            <h4>Escanteios (Over)</h4>
            <input type="number" step="0.01" name="corners85" placeholder="Over 8.5" value={odds.corners85} onChange={handleOddsChange} />
            <input type="number" step="0.01" name="corners95" placeholder="Over 9.5" value={odds.corners95} onChange={handleOddsChange} />
            <input type="number" step="0.01" name="corners105" placeholder="Over 10.5" value={odds.corners105} onChange={handleOddsChange} />
          </div>

          <div className="odds-section">
            <h4>Cartões (Over)</h4>
            <input type="number" step="0.01" name="cards35" placeholder="Over 3.5" value={odds.cards35} onChange={handleOddsChange} />
            <input type="number" step="0.01" name="cards45" placeholder="Over 4.5" value={odds.cards45} onChange={handleOddsChange} />
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? (
            <span className="loading-state">
              <span className="spinner"></span> {loadingText}
            </span>
          ) : 'EXECUTAR ANÁLISE'}
        </button>
      </form>
    </div>
  );
};

export default InputForm;
