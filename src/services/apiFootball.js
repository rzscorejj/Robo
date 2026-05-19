const API_BASE = '/api';

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
  const [resA, resB] = await Promise.all([
    fetchApi(`/teams?search=${encodeURIComponent(teamA)}`, apiKey),
    fetchApi(`/teams?search=${encodeURIComponent(teamB)}`, apiKey)
  ]);

  if (!resA || resA.length === 0) throw new Error(`Time não encontrado: ${teamA}`);
  if (!resB || resB.length === 0) throw new Error(`Time não encontrado: ${teamB}`);

  return {
    teamA: resA[0].team,
    teamB: resB[0].team
  };
};

export const getTeamAdvancedStats = async (apiKey, teamId, role) => {
  const allowedSeason = 2024; // Atualizar conforme necessário
  const fixtures = await fetchApi(`/fixtures?team=${teamId}&season=${allowedSeason}&status=FT`, apiKey);
  
  const sorted = fixtures.sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));
  
  const last10 = sorted.slice(0, 10);
  
  // Filtrar os últimos 5 em casa ou fora dependendo do papel (home / away)
  const roleFiltered = sorted.filter(f => {
    if (role === 'home') return f.teams.home.id === teamId;
    return f.teams.away.id === teamId;
  }).slice(0, 5);

  // Unir para buscar estatísticas sem duplicação
  const uniqueFixturesMap = new Map();
  last10.forEach(f => uniqueFixturesMap.set(f.fixture.id, f));
  roleFiltered.forEach(f => uniqueFixturesMap.set(f.fixture.id, f));

  const fixturesToFetch = Array.from(uniqueFixturesMap.values());

  const fixturesWithStats = await Promise.all(fixturesToFetch.map(async (item) => {
    try {
      const stats = await fetchApi(`/fixtures/statistics?fixture=${item.fixture.id}`, apiKey);
      return { ...item, statistics: stats };
    } catch (e) {
      return { ...item, statistics: null };
    }
  }));

  // Re-separar
  const enrichedLast10 = last10.map(f => fixturesWithStats.find(fs => fs.fixture.id === f.fixture.id));
  const enrichedRole = roleFiltered.map(f => fixturesWithStats.find(fs => fs.fixture.id === f.fixture.id));

  return {
    last10: enrichedLast10,
    roleSpecific: enrichedRole
  };
};

export const getH2H = async (apiKey, teamAid, teamBid) => {
  const fixtures = await fetchApi(`/fixtures/headtohead?h2h=${teamAid}-${teamBid}&status=FT`, apiKey);
  const sorted = fixtures.sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));
  const last5 = sorted.slice(0, 5);
  // H2H statistics consumes too many API requests, so we skip deep stats for H2H to preserve free tier.
  // We'll just use the match outcomes and basic goals for H2H weight.
  return last5;
};
