import apiClient from './apiClient';

export const scoreService = {
  // Get all scores for a submission
  getScores: async (submissionId) => {
    const response = await apiClient.get(`/api/v1/submissions/${submissionId}/scores`);
    return response.data;
  },

  // Get scores submitted by a specific judge
  getScoresByJudge: async (submissionId, judgeAccountId) => {
    const response = await apiClient.get(`/api/v1/submissions/${submissionId}/scores/judge/${judgeAccountId}`);
    return response.data;
  },

  // Judge submits scores for a submission
  gradeSubmission: async (submissionId, judgeAccountId, scores) => {
    const response = await apiClient.post(`/api/v1/submissions/${submissionId}/scores/grade`, {
      judgeAccountId,
      scores,
    });
    return response.data;
  },
};

export const submissionService = {
  // Get submission for a team in a round
  getSubmission: async (roundId, teamId) => {
    const response = await apiClient.get(`/api/v1/rounds/${roundId}/teams/${teamId}/submissions`);
    return response.data;
  },

  // Submit or update team submission
  upsertSubmission: async (roundId, teamId, data) => {
    const response = await apiClient.put(`/api/v1/rounds/${roundId}/teams/${teamId}/submissions`, data);
    return response.data;
  },
};

export const criterionService = {
  // Get criteria for a round
  getCriteria: async (roundId) => {
    const response = await apiClient.get(`/api/v1/rounds/${roundId}/criteria`);
    return response.data;
  },

  // Create a criterion
  createCriterion: async (roundId, data) => {
    const response = await apiClient.post(`/api/v1/rounds/${roundId}/criteria`, data);
    return response.data;
  },

  // Update a criterion
  updateCriterion: async (criterionId, data) => {
    const response = await apiClient.put(`/api/v1/criteria/${criterionId}`, data);
    return response.data;
  },

  // Delete a criterion
  deleteCriterion: async (criterionId) => {
    const response = await apiClient.delete(`/api/v1/criteria/${criterionId}`);
    return response.data;
  },
};

export const standingsService = {
  // Get real standings for a round from DB
  getStandings: async (roundId) => {
    const response = await apiClient.get(`/api/v1/rounds/${roundId}/standings`);
    return response.data;
  },
  /**
   * Rank the round and promote the top N by score. Teams are never picked by hand — pass a
   * tieBreak only after the server has rejected the call because teams are tied across the
   * cut-off, and then only with teams from that tie.
   *
   * @param {{teamIds: number[], reason: string}} [tieBreak]
   */
  computeRoundRanking: async (roundId, tieBreak = null) => {
    const response = await apiClient.post(`/api/v1/rounds/${roundId}/ranking/compute`, tieBreak);
    return response.data;
  },
};
