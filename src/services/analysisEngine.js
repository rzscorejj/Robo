// Motor Estatístico Quantitativo Premium

const calculateAverages = (fixtures) => {
  let goalsFor = 0;
  let goalsAgainst = 0;
  let cornersFor = 0;
  let cornersAgainst = 0;
  let cardsFor = 0;
  let cardsAgainst = 0;

  if (!fixtures || fixtures.length === 0) return { goalsFor: 0, goalsAgainst: 0, cornersFor: 0, cornersAgainst: 0, cardsFor: 0, cardsAgainst: 0 };

  fixtures.forEach(item => {
    const isHome = item.teams?.home?.id === item.teamId; // We need to pass teamId context or infer it
    // Actually, we can just sum all goals in the fixture if we are measuring "Match Over/Under"
    // But for team-specific metrics, we need to know which team it is.
  });

  return {}; // Placeholder for complex logic below
};

// Nova abordagem mais limpa
const extractTeamStats = (fixtures, teamId) => {
  let gf = 0, ga = 0, cornersFor = 0, cornersAgainst = 0, cardsFor = 0, cardsAgainst = 0;
  let over05ht = 0, over15 = 0, over25 = 0, btts = 0;
  let cornersTotal = [], cardsTotal = [];
  let wins = 0, draws = 0, losses = 0;

  if (!fixtures || fixtures.length === 0) return null;

  fixtures.forEach(item => {
    const f = item.fixture;
    const isHome = item.teams.home.id === teamId;
    const teamStats = isHome ? item.teams.home : item.teams.away;
    const oppStats = isHome ? item.teams.away : item.teams.home;
    const scoreHome = item.goals.home;
    const scoreAway = item.goals.away;
    
    const scoreFor = isHome ? scoreHome : scoreAway;
    const scoreAgainst = isHome ? scoreAway : scoreHome;

    gf += scoreFor;
    ga += scoreAgainst;

    if (scoreFor > scoreAgainst) wins++;
    else if (scoreFor === scoreAgainst) draws++;
    else losses++;

    const totalGoals = scoreHome + scoreAway;
    const htGoals = item.score.halftime.home + item.score.halftime.away;

    if (htGoals > 0) over05ht++;
    if (totalGoals > 1) over15++;
    if (totalGoals > 2) over25++;
    if (scoreHome > 0 && scoreAway > 0) btts++;

    // Statistics might be null if not fetched or API free tier empty
    let matchCornersFor = 0, matchCornersAgainst = 0;
    let matchCardsFor = 0, matchCardsAgainst = 0;

    if (item.statistics && item.statistics.length === 2) {
      const myStats = item.statistics.find(s => s.team.id === teamId);
      const theirStats = item.statistics.find(s => s.team.id !== teamId);

      if (myStats && theirStats) {
        const getStat = (arr, type) => {
          const s = arr.statistics.find(x => x.type === type);
          return s && s.value ? parseInt(s.value) : 0;
        };
        matchCornersFor = getStat(myStats, 'Corner Kicks');
        matchCornersAgainst = getStat(theirStats, 'Corner Kicks');
        matchCardsFor = getStat(myStats, 'Yellow Cards') + getStat(myStats, 'Red Cards');
        matchCardsAgainst = getStat(theirStats, 'Yellow Cards') + getStat(theirStats, 'Red Cards');
      }
    } else {
      // Falback básico se não houver stats
      matchCornersFor = 4; matchCornersAgainst = 4;
      matchCardsFor = 2; matchCardsAgainst = 2;
    }

    cornersFor += matchCornersFor;
    cornersAgainst += matchCornersAgainst;
    cardsFor += matchCardsFor;
    cardsAgainst += matchCardsAgainst;

    cornersTotal.push(matchCornersFor + matchCornersAgainst);
    cardsTotal.push(matchCardsFor + matchCardsAgainst);
  });

  const len = fixtures.length;
  return {
    matches: len,
    gfAvg: gf / len,
    gaAvg: ga / len,
    winRate: wins / len,
    drawRate: draws / len,
    lossRate: losses / len,
    over05htRate: over05ht / len,
    over15Rate: over15 / len,
    over25Rate: over25 / len,
    bttsRate: btts / len,
    cornersForAvg: cornersFor / len,
    cornersAgainstAvg: cornersAgainst / len,
    cornersTotalAvg: (cornersFor + cornersAgainst) / len,
    cardsForAvg: cardsFor / len,
    cardsAgainstAvg: cardsAgainst / len,
    cardsTotalAvg: (cardsFor + cardsAgainst) / len,
    cornersTotal,
    cardsTotal
  };
};

const calcProb = (statsA10, statsA5, statsB10, statsB5, h2hStats, metric) => {
  // Pesos: Recente (30%), Casa/Fora (25%), Stats/Pressão (20%), Contexto (10%), H2H (5%), EV não entra aqui na prob real
  // Ajustando pra somar 100% da métrica matemática:
  // 40% Casa/Fora, 40% Last10, 20% H2H
  
  const w10 = 0.40;
  const w5 = 0.40;
  const wH2H = 0.20;

  let val10 = (statsA10[metric] + statsB10[metric]) / 2;
  let val5 = (statsA5[metric] + statsB5[metric]) / 2;
  let valH2H = h2hStats ? h2hStats[metric] : val10; // fallback se n houver h2h

  return (val10 * w10) + (val5 * w5) + (valH2H * wH2H);
};

export const runAnalysis = (teamsInfo, statsA, statsB, h2hRaw, odds) => {
  const { teamA, teamB } = teamsInfo;

  const a10 = extractTeamStats(statsA.last10, teamA.id);
  const a5 = extractTeamStats(statsA.roleSpecific, teamA.id); // Home
  const b10 = extractTeamStats(statsB.last10, teamB.id);
  const b5 = extractTeamStats(statsB.roleSpecific, teamB.id); // Away
  const h2h = extractTeamStats(h2hRaw, teamA.id);

  const markets = [];

  const addMarket = (key, name, trueProb, bookieOdd) => {
    if (!bookieOdd) return; // Só analisa se o usuário botou a odd
    
    const oddCasa = parseFloat(bookieOdd);
    if (isNaN(oddCasa) || oddCasa <= 1.0) return;

    // Limites lógicos de probabilidade entre 0.05 e 0.95
    trueProb = Math.max(0.05, Math.min(0.95, trueProb));
    
    const fairOdd = 1 / trueProb;
    const ev = (trueProb * oddCasa) - 1; // Expected Value: (Prob * Lucro) - ((1-Prob) * 1) -> Prob * Odd - 1
    
    // EV positivo se EV > 0
    let confidence = 'low';
    let stake = 0.25;
    if (ev > 0.05) { confidence = 'medium'; stake = 0.5; }
    if (ev > 0.15) { confidence = 'high'; stake = 1; }

    markets.push({
      key,
      name,
      trueProb: trueProb * 100,
      fairOdd,
      bookieOdd: oddCasa,
      ev: ev * 100,
      confidence,
      stake,
      isEVPositive: ev > 0
    });
  };

  // 1. OVER 0.5 HT
  const prob05ht = calcProb(a10, a5, b10, b5, h2h, 'over05htRate');
  addMarket('over05ht', 'Over 0.5 HT', prob05ht, odds.over05ht);

  // 2. OVER 1.5
  const prob15 = calcProb(a10, a5, b10, b5, h2h, 'over15Rate');
  addMarket('over15', 'Over 1.5 Gols', prob15, odds.over15);

  // 3. OVER 2.5
  const prob25 = calcProb(a10, a5, b10, b5, h2h, 'over25Rate');
  addMarket('over25', 'Over 2.5 Gols', prob25, odds.over25);

  // 4. BTTS
  const probBtts = calcProb(a10, a5, b10, b5, h2h, 'bttsRate');
  addMarket('bttsYes', 'Ambas Marcam', probBtts, odds.bttsYes);

  // 5. Match Odds 1X2
  // true prob 1:
  const prob1 = (a10.winRate * 0.4) + (a5.winRate * 0.4) + ((1 - b10.winRate) * 0.1) + ((1 - b5.winRate) * 0.1);
  addMarket('home', `Vitória ${teamA.name}`, prob1, odds.home);

  const prob2 = (b10.winRate * 0.4) + (b5.winRate * 0.4) + ((1 - a10.winRate) * 0.1) + ((1 - a5.winRate) * 0.1);
  addMarket('away', `Vitória ${teamB.name}`, prob2, odds.away);

  // Draw prob fallback
  const probX = 1 - prob1 - prob2;
  addMarket('draw', 'Empate', probX > 0 ? probX : 0.1, odds.draw);

  // Dupla Chance
  addMarket('dc1x', 'Dupla Chance 1X', prob1 + probX, odds.dc1x);
  addMarket('dc12', 'Dupla Chance 12', prob1 + prob2, odds.dc12);
  addMarket('dcx2', 'Dupla Chance X2', prob2 + probX, odds.dcx2);

  // Escanteios
  const avgCorners = calcProb(a10, a5, b10, b5, h2h, 'cornersTotalAvg');
  // Usando distribuição de poisson simples/estimativa linear para calcular prob de passar a linha
  const probOver85C = avgCorners > 8.5 ? Math.min(0.9, (avgCorners / 8.5) * 0.6) : 0.2;
  const probOver95C = avgCorners > 9.5 ? Math.min(0.85, (avgCorners / 9.5) * 0.5) : 0.15;
  const probOver105C = avgCorners > 10.5 ? Math.min(0.8, (avgCorners / 10.5) * 0.4) : 0.1;
  
  addMarket('corners85', 'Mais de 8.5 Escanteios', probOver85C, odds.corners85);
  addMarket('corners95', 'Mais de 9.5 Escanteios', probOver95C, odds.corners95);
  addMarket('corners105', 'Mais de 10.5 Escanteios', probOver105C, odds.corners105);

  // Cartões
  const avgCards = calcProb(a10, a5, b10, b5, h2h, 'cardsTotalAvg');
  const probOver35Cards = avgCards > 3.5 ? Math.min(0.9, (avgCards / 3.5) * 0.6) : 0.3;
  const probOver45Cards = avgCards > 4.5 ? Math.min(0.85, (avgCards / 4.5) * 0.5) : 0.2;

  addMarket('cards35', 'Mais de 3.5 Cartões', probOver35Cards, odds.cards35);
  addMarket('cards45', 'Mais de 4.5 Cartões', probOver45Cards, odds.cards45);

  markets.sort((a, b) => b.ev - a.ev);

  return {
    metrics: {
      teamA_gf: (a10.gfAvg).toFixed(2),
      teamA_ga: (a10.gaAvg).toFixed(2),
      teamB_gf: (b10.gfAvg).toFixed(2),
      teamB_ga: (b10.gaAvg).toFixed(2),
      cornersAvg: avgCorners.toFixed(1),
      cardsAvg: avgCards.toFixed(1)
    },
    markets
  };
};
