export const runAnalysis = (teamsData, last10A, last10B, odds) => {
  const calcTrends = (fixtures) => {
    let over15 = 0;
    let over25 = 0;
    let btts = 0;
    let goalsScored = 0;
    let goalsConceded = 0;
    
    let totalCorners = 0;
    let totalCards = 0;
    let gamesWithCorners = 0;
    let gamesWithCards = 0;

    fixtures.forEach(f => {
      const homeGoals = f.goals.home || 0;
      const awayGoals = f.goals.away || 0;
      const totalGoals = homeGoals + awayGoals;

      if (totalGoals > 1.5) over15++;
      if (totalGoals > 2.5) over25++;
      if (homeGoals > 0 && awayGoals > 0) btts++;

      if (f.teams.home.id === fixtures[0]?.teams?.home?.id || f.teams.home.id === fixtures[0]?.teams?.away?.id) {
         goalsScored += (f.teams.home.name === fixtures[0].teams.home.name) ? homeGoals : awayGoals;
         goalsConceded += (f.teams.home.name === fixtures[0].teams.home.name) ? awayGoals : homeGoals;
      }

      // Processar estatísticas (escanteios e cartões) se disponíveis
      if (f.statistics && f.statistics.length > 0) {
        let matchCorners = 0;
        let matchCards = 0;
        
        f.statistics.forEach(teamStat => {
          if (!teamStat.statistics) return;
          const cornerStat = teamStat.statistics.find(s => s.type === 'Corner Kicks');
          const yellowStat = teamStat.statistics.find(s => s.type === 'Yellow Cards');
          const redStat = teamStat.statistics.find(s => s.type === 'Red Cards');
          
          if (cornerStat && cornerStat.value) matchCorners += parseInt(cornerStat.value);
          if (yellowStat && yellowStat.value) matchCards += parseInt(yellowStat.value);
          if (redStat && redStat.value) matchCards += parseInt(redStat.value);
        });

        if (matchCorners > 0) {
          totalCorners += matchCorners;
          if (matchCorners > 8.5) gamesWithCorners++; // Acima de 8.5
        }
        if (matchCards > 0) {
          totalCards += matchCards;
          if (matchCards > 3.5) gamesWithCards++; // Acima de 3.5
        }
      }
    });

    return {
      over15Pct: (over15 / fixtures.length) * 100,
      over25Pct: (over25 / fixtures.length) * 100,
      bttsPct: (btts / fixtures.length) * 100,
      cornersOver85Pct: (gamesWithCorners / fixtures.length) * 100,
      cardsOver35Pct: (gamesWithCards / fixtures.length) * 100,
      avgScored: goalsScored / fixtures.length,
      avgConceded: goalsConceded / fixtures.length
    };
  };

  const statsA = calcTrends(last10A);
  const statsB = calcTrends(last10B);

  // Média combinada para o jogo
  const combinedOver15 = (statsA.over15Pct + statsB.over15Pct) / 2;
  const combinedOver25 = (statsA.over25Pct + statsB.over25Pct) / 2;
  const combinedBtts = (statsA.bttsPct + statsB.bttsPct) / 2;
  const combinedCorners = (statsA.cornersOver85Pct + statsB.cornersOver85Pct) / 2;
  const combinedCards = (statsA.cardsOver35Pct + statsB.cardsOver35Pct) / 2;

  // Analisar valor baseado na Odd inserida
  const markets = [];
  
  markets.push(evaluateMarket('Over 1.5 Gols', combinedOver15, odds.over25)); // Usando over25 odd fallback
  markets.push(evaluateMarket('Over 2.5 Gols', combinedOver25, odds.over25));
  markets.push(evaluateMarket('Ambas Marcam', combinedBtts, odds.bttsYes));
  markets.push(evaluateMarket('Mais de 8.5 Escanteios', combinedCorners, odds.cornersOver85));
  markets.push(evaluateMarket('Mais de 3.5 Cartões', combinedCards, odds.cardsOver35));

  // Definir o melhor mercado
  const bestMarket = markets.sort((a, b) => b.score - a.score)[0];

  return {
    bestMarket: bestMarket.name,
    confidence: bestMarket.confidence,
    minOdd: bestMarket.minOdd,
    reasoning: `As equipes apresentam uma tendência combinada de ${bestMarket.trend} para este mercado. O Time A marca em média ${statsA.avgScored.toFixed(1)} gols e o Time B ${statsB.avgScored.toFixed(1)} gols.`,
    risks: 'Fatores como desfalques de última hora e condições climáticas não estão totalmente refletidos nesta média.',
    recommendation: bestMarket.confidence === 'high' ? 'apostar' : (bestMarket.confidence === 'medium' ? 'aguardar escalações' : 'evitar'),
    stake: bestMarket.confidence === 'high' ? 1.0 : (bestMarket.confidence === 'medium' ? 0.5 : 0.25),
    markets: markets
  };
};

const evaluateMarket = (name, pct, oddStr) => {
  const odd = parseFloat(oddStr);
  const impliedProb = odd ? (1 / odd) * 100 : 0;
  
  let confidence = 'low';
  let desc = 'Evite apostar. Baixa probabilidade estatística.';
  let score = 0;

  if (pct >= 75) {
    confidence = 'high';
    desc = 'Alta probabilidade baseada nos últimos 10 jogos.';
    score = 3;
  } else if (pct >= 55) {
    confidence = 'medium';
    desc = 'Probabilidade moderada. Avalie outros fatores.';
    score = 2;
  }

  // Se a odd foi inserida, checar se há valor (probabilidade real > probabilidade implícita)
  if (odd && pct > impliedProb + 5) {
    score += 1;
    desc += ' +EV (Esperança Matemática Positiva encontrada na Odd!).';
  }

  const minOdd = (100 / (pct > 0 ? pct : 1)).toFixed(2);

  return {
    name,
    confidence,
    trend: `${pct.toFixed(0)}%`,
    desc,
    score,
    minOdd
  };
};
