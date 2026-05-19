const API_BASE = 'https://v3.football.api-sports.io';

const fetchApi = async (endpoint, apiKey) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: {
      'x-apisports-key': apiKey,
    }
  });
  
  if (!response.ok) {
    throw new Error('Falha ao comunicar com a API-Sports.');
  }

  const data = await response.json();
  
  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(Object.values(data.errors)[0]);
  }
  
  return data.response;
};

export const validateAndFetchTeams = async (apiKey, teamA, teamB) => {
  // Buscar os dois times
  const [resA, resB] = await Promise.all([
    fetchApi(`/teams?search=${encodeURIComponent(teamA)}`, apiKey),
    fetchApi(`/teams?search=${encodeURIComponent(teamB)}`, apiKey)
  ]);

  if (!resA || resA.length === 0) throw new Error(`Time não encontrado: ${teamA}`);
  if (!resB || resB.length === 0) throw new Error(`Time não encontrado: ${teamB}`);

  // Pegar o ID do time que mais se aproxima (o primeiro resultado geralmente é o melhor match)
  return {
    teamA: resA[0].team,
    teamB: resB[0].team
  };
};

export const getTeamLast10 = async (apiKey, teamId) => {
  const allowedSeason = 2024;
  const fixtures = await fetchApi(`/fixtures?team=${teamId}&season=${allowedSeason}&status=FT`, apiKey);
  
  const sorted = fixtures.sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));
  const last10 = sorted.slice(0, 10);

  // Busca estatísticas detalhadas (escanteios e cartões) para cada jogo
  const fixturesWithStats = await Promise.all(last10.map(async (item) => {
    try {
      const stats = await fetchApi(`/fixtures/statistics?fixture=${item.fixture.id}`, apiKey);
      return { ...item, statistics: stats };
    } catch (e) {
      return { ...item, statistics: null };
    }
  }));

  return fixturesWithStats;
};

// Se precisar buscar detalhes específicos de uma partida
export const getFixtureStatistics = async (apiKey, fixtureId) => {
  const stats = await fetchApi(`/fixtures/statistics?fixture=${fixtureId}`, apiKey);
  return stats;
};
