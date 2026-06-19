export const mockService = {
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  getStoredEvents: () => {
    const stored = localStorage.getItem('mock_events');
    if (stored) return JSON.parse(stored);
    
    // Khởi tạo mảng rỗng tinh tươm
    return [];
  },

  saveStoredEvents: (events) => {
    localStorage.setItem('mock_events', JSON.stringify(events));
  },

  createEvent: async (eventData) => {
    await mockService.delay(800);
    const events = mockService.getStoredEvents();
    const existing = events.findIndex(e => e.id === eventData.id);
    let saved;
    if (existing >= 0) {
      events[existing] = { ...events[existing], ...eventData };
      saved = events[existing];
    } else {
      saved = { ...eventData, id: eventData.id || Date.now() };
      events.push(saved);
    }
    mockService.saveStoredEvents(events);
    return { status: 201, data: saved };
  },

  updateEvent: async (eventId, patch) => {
    await mockService.delay(400);
    const events = mockService.getStoredEvents();
    const idx = events.findIndex(e => e.id === eventId);
    if (idx < 0) throw { status: 404, message: 'Event not found' };
    events[idx] = { ...events[idx], ...patch };
    mockService.saveStoredEvents(events);
    return { status: 200, data: events[idx] };
  },

  getEvents: async () => {
    await mockService.delay(300);
    return {
      status: 200,
      data: mockService.getStoredEvents()
    };
  },

  // --- TEAM FORMATION MOCK APIs ---
  getStoredTeams: () => {
    const stored = localStorage.getItem('mock_teams');
    return stored ? JSON.parse(stored) : [];
  },

  getTeams: async () => {
    await mockService.delay(300);
    return {
      status: 200,
      data: mockService.getStoredTeams()
    };
  },

  saveStoredTeams: (teams) => {
    localStorage.setItem('mock_teams', JSON.stringify(teams));
  },

  createTeam: async (teamName, leaderName = 'Current User') => {
    await mockService.delay(800);
    const teams = mockService.getStoredTeams();
    
    // Validate team name uniqueness
    if (teams.some(t => t.name.toLowerCase() === teamName.toLowerCase())) {
      throw { status: 400, message: 'Team name already exists' };
    }

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newTeam = {
      id: Date.now().toString(),
      name: teamName,
      inviteCode: inviteCode,
      members: [{ id: 'u1', name: leaderName, role: 'Leader', status: 'Active' }],
      pendingRequests: [],
      status: 'Pending',
      track: null // Track will be drawn randomly later by Admin
    };

    teams.push(newTeam);
    mockService.saveStoredTeams(teams);
    return { status: 201, data: newTeam };
  },

  joinTeam: async (inviteCode, userName = 'Current User') => {
    await mockService.delay(800);
    const teams = mockService.getStoredTeams();
    const teamIndex = teams.findIndex(t => t.inviteCode === inviteCode);

    if (teamIndex === -1) {
      throw { status: 404, message: 'Invalid invite code' };
    }

    const team = teams[teamIndex];
    if (team.members.length >= 5) {
      throw { status: 400, message: 'Team is already full (max 5 members)' };
    }

    // Add to pending requests
    const request = { id: Date.now().toString(), name: userName, status: 'Pending' };
    team.pendingRequests.push(request);
    
    mockService.saveStoredTeams(teams);
    return { status: 200, message: 'Request sent to Team Leader' };
  },

  getTeamDetails: async (teamId) => {
    await mockService.delay(300);
    const teams = mockService.getStoredTeams();
    const team = teams.find(t => t.id === teamId);
    if (!team) throw { status: 404, message: 'Team not found' };
    return { status: 200, data: team };
  },

  handleJoinRequest: async (teamId, requestId, action) => {
    await mockService.delay(500);
    const teams = mockService.getStoredTeams();
    const team = teams.find(t => t.id === teamId);
    if (!team) throw { status: 404, message: 'Team not found' };

    const requestIndex = team.pendingRequests.findIndex(r => r.id === requestId);
    if (requestIndex === -1) throw { status: 404, message: 'Request not found' };

    const request = team.pendingRequests[requestIndex];
    team.pendingRequests.splice(requestIndex, 1);

    if (action === 'Approve') {
      if (team.members.length >= 5) throw { status: 400, message: 'Team full' };
      team.members.push({ id: request.id, name: request.name, role: 'Member', status: 'Active' });
    }

    mockService.saveStoredTeams(teams);
    return { status: 200, data: team };
  },

  updateTeamStatus: async (teamId, newStatus) => {
    await mockService.delay(300);
    const teams = mockService.getStoredTeams();
    const teamIndex = teams.findIndex(t => t.id === teamId);
    if (teamIndex === -1) throw { status: 404, message: 'Team not found' };
    
    teams[teamIndex].status = newStatus;
    mockService.saveStoredTeams(teams);
    return { status: 200, data: teams[teamIndex] };
  },

  // --- SUBMISSION MOCK APIs ---
  submitProject: async (teamId, roundId, submissionData) => {
    await mockService.delay(600);
    const key = `submissions_${roundId}`;
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    all[teamId] = {
      ...submissionData,
      teamId,
      roundId,
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
    };
    localStorage.setItem(key, JSON.stringify(all));
    return { status: 200, data: all[teamId] };
  },

  getSubmission: async (teamId, roundId) => {
    await mockService.delay(200);
    const key = `submissions_${roundId}`;
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    return { status: 200, data: all[teamId] || null };
  },

  getSubmissions: async (roundId) => {
    await mockService.delay(300);
    const key = `submissions_${roundId}`;
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    return { status: 200, data: all };
  },

  // --- SCORING MOCK APIs ---
  saveScore: async (judgeId, teamId, roundId, criteriaScores, total, feedback) => {
    await mockService.delay(500);
    const key = `scores_${roundId}`;
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    if (!all[teamId]) all[teamId] = {};
    all[teamId][judgeId] = {
      criteriaScores,
      total,
      feedback,
      submittedAt: new Date().toISOString(),
      judgeId,
    };
    localStorage.setItem(key, JSON.stringify(all));

    // Also update team score (average of all judges)
    const teamScores = Object.values(all[teamId]).map(s => s.total);
    const avg = teamScores.reduce((a, b) => a + b, 0) / teamScores.length;
    const teams = mockService.getStoredTeams();
    const teamIdx = teams.findIndex(t => t.id === teamId);
    if (teamIdx >= 0) {
      teams[teamIdx].score = Math.round(avg * 10) / 10;
      mockService.saveStoredTeams(teams);
    }

    return { status: 200, data: all[teamId] };
  },

  getScores: async (teamId, roundId) => {
    await mockService.delay(200);
    const key = `scores_${roundId}`;
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    return { status: 200, data: all[teamId] || {} };
  },

  getAllScores: async (roundId) => {
    await mockService.delay(300);
    const key = `scores_${roundId}`;
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    return { status: 200, data: all };
  },

  // --- CONFIG / STATE MOCK APIs ---
  getTrackDraw: async (eventId) => {
    await mockService.delay(200);
    const targetEventId = eventId || 1;
    const stored = localStorage.getItem(`trackDraw_${targetEventId}`);
    return { status: 200, data: stored ? JSON.parse(stored) : null };
  },

  saveTrackDraw: async (eventId, drawData) => {
    await mockService.delay(300);
    const targetEventId = eventId || 1;
    localStorage.setItem(`trackDraw_${targetEventId}`, JSON.stringify(drawData));
    localStorage.setItem(`trackDrawConfirmed_${targetEventId}`, 'true');
    return { status: 200, data: drawData };
  },

  getCurrentRoundIndex: async () => {
    await mockService.delay(100);
    const idx = parseInt(localStorage.getItem('currentRoundIndex') || '0');
    return { status: 200, data: idx };
  },

  setCurrentRoundIndex: async (index) => {
    await mockService.delay(300);
    localStorage.setItem('currentRoundIndex', index.toString());
    return { status: 200, data: index };
  }
};
