import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Users, ArrowLeft, Trophy, Medal, Target, CheckCircle2 } from 'lucide-react';
import { eventService } from '../../api/eventService';
import { standingsService } from '../../api/scoreService';
import { teamService } from '../../api/teamService';
import { trackService } from '../../api/trackService';

const EventArchive = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  
  const [eventData, setEventData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [allRoundsData, setAllRoundsData] = useState({});
  const [selectedRoundTab, setSelectedRoundTab] = useState('final');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArchive = async () => {
      try {
        const eventsRes = await eventService.getEvents();
        const evts = eventsRes.data || [];
        const evt = evts.find(e => String(e.id) === String(eventId));
        
        if (evt) {
          const [roundsRes, teamsRes, topicsRes, tracksRes] = await Promise.all([
            eventService.getEventRounds(evt.id),
            teamService.getTeamsByEvent(evt.id),
            trackService.getTopicsByEvent(evt.id),
            trackService.getTracksByEvent(evt.id)
          ]);
          evt.rounds = roundsRes.data || [];
          const teams = teamsRes.data || teamsRes || [];
          const topics = topicsRes.data || topicsRes || [];
          const tracks = tracksRes.data || tracksRes || [];
          setEventData(evt);

          const trackIdMap = {};
          tracks.forEach(tr => {
            trackIdMap[tr.id] = tr.name;
          });

          const trackToTopicMap = {};
          topics.forEach(tp => {
            trackToTopicMap[tp.trackId] = tp.name;
          });

          const teamTrackMap = {};
          const teamTopicMap = {};
          teams.forEach(t => {
            teamTrackMap[t.id] = trackIdMap[t.trackId] || 'Global';
            // map topic from direct topicId, or fallback to the topic linked to the track
            const topicByDirectId = topics.find(tp => tp.id === t.topicId);
            teamTopicMap[t.id] = topicByDirectId?.name || trackToTopicMap[t.trackId] || 'No Topic';
          });

          if (evt.rounds && evt.rounds.length > 0) {
             const standingsPromises = evt.rounds.map(r => standingsService.getStandings(r.id));
             const allStandingsRes = await Promise.all(standingsPromises);
             
             const roundsDataMap = {};
             
             evt.rounds.forEach((r, idx) => {
               const dbStandings = allStandingsRes[idx]?.data || allStandingsRes[idx] || [];
               
               const formattedBoard = dbStandings.map(s => ({
                   teamId: s.teamId,
                   name: s.teamName,
                   score: s.score || 0,
                   promoted: !!s.promoted,
                   trackName: teamTrackMap[s.teamId] || 'Global',
                   topicName: teamTopicMap[s.teamId] || 'No Topic'
               }));
               formattedBoard.sort((a, b) => b.score - a.score);
               
               const byTrack = {};
               formattedBoard.forEach(item => {
                 if (!byTrack[item.trackName]) byTrack[item.trackName] = [];
                 byTrack[item.trackName].push(item);
               });
               
               Object.keys(byTrack).forEach(track => {
                 byTrack[track].forEach((item, i) => {
                   item.rank = i + 1;
                 });
               });
               
               roundsDataMap[r.id] = byTrack;
             });
             
             setAllRoundsData(roundsDataMap);

             // Fallback final leaderboard is just a flat list of the final round
             const finalStandings = allStandingsRes[allStandingsRes.length - 1]?.data || allStandingsRes[allStandingsRes.length - 1] || [];
             finalStandings.sort((a, b) => (b.score || 0) - (a.score || 0));
             const formattedFinal = finalStandings.map((s, idx) => ({
                 rank: idx + 1,
                 name: s.teamName,
                 score: s.score || 0,
                 trackName: teamTrackMap[s.teamId] || 'Global',
                 topicName: teamTopicMap[s.teamId] || 'No Topic'
             }));
             setLeaderboard(formattedFinal);
          }
        }
      } catch (err) {
        console.error("Failed to load archive data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (eventId) {
      loadArchive();
    } else {
      setLoading(false);
    }
  }, [eventId]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading results...
      </div>
    );
  }

  if (!eventData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <button onClick={() => navigate('/participant/events')} className="btn btn-text" style={{ marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={20} /> Back to Events
        </button>
        <p>Event not found.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '0 20px', paddingBottom: '60px' }}>
      <button onClick={() => navigate('/participant/events')} className="btn btn-text" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', padding: 0 }}>
        <ArrowLeft size={20} /> Back to Events
      </button>

      {/* Header */}
      <div className="glass-panel" style={{ padding: '40px', borderRadius: '16px', position: 'relative', overflow: 'hidden', marginBottom: '32px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--text-secondary), transparent)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span className="status-badge" style={{ background: 'var(--bg-active)', color: 'var(--text-secondary)' }}>Archived Event</span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} /> {eventData.startDate} - {eventData.endDate}
              </span>
            </div>
            <h1 style={{ fontSize: '42px', fontWeight: '800', marginBottom: '16px', background: 'linear-gradient(90deg, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {eventData.name}
            </h1>
            {/* The event's own description only — no filler when it has none. */}
            {eventData.description && (
              <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: '1.6' }}>
                {eventData.description}
              </p>
            )}
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--primary)', opacity: 0.1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Users size={20} />
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700' }}>{leaderboard.length}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Finalist Teams</div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ minHeight: '400px' }}>
        <div className="animate-fade-in">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
              <button 
                className={`btn ${selectedRoundTab === 'final' ? 'btn-primary' : 'btn-secondary'}`} 
                onClick={() => setSelectedRoundTab('final')}
                style={{ borderRadius: '20px', padding: '6px 16px', fontSize: '14px', flexShrink: 0 }}
              >
                Final Overall Ranking
              </button>
              {eventData.rounds && eventData.rounds.map((r, idx) => (
                <button 
                  key={r.id}
                  className={`btn ${selectedRoundTab === r.id ? 'btn-primary' : 'btn-secondary'}`} 
                  onClick={() => setSelectedRoundTab(r.id)}
                  style={{ borderRadius: '20px', padding: '6px 16px', fontSize: '14px', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  Round {idx + 1}: {r.name}
                </button>
              ))}
            </div>

            {selectedRoundTab === 'final' ? (
              <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-hover)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '500', width: '100px' }}>Rank</th>
                      <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '500' }}>Team Name</th>
                      <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '500' }}>Track</th>
                      <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '500' }}>Topic</th>
                      <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'right' }}>Final Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          No results available yet.
                        </td>
                      </tr>
                    ) : leaderboard.map((team) => (
                      <tr key={team.rank} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s ease', cursor: 'default' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '16px 24px' }}>
                          {team.rank === 1 && <Trophy size={20} color="#ffd700" />}
                          {team.rank === 2 && <Medal size={20} color="#c0c0c0" />}
                          {team.rank === 3 && <Medal size={20} color="#cd7f32" />}
                          {team.rank > 3 && <span style={{ color: 'var(--text-secondary)', fontWeight: '600', marginLeft: '8px' }}>#{team.rank}</span>}
                        </td>
                        <td style={{ padding: '16px 24px', fontWeight: team.rank <= 3 ? '700' : '500', color: team.rank === 1 ? '#ffd700' : 'var(--text-primary)' }}>
                          {team.name}
                        </td>
                        <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                          {team.trackName}
                        </td>
                        <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                          <span style={{ padding: '4px 8px', background: 'var(--bg-hover)', borderRadius: '6px', fontSize: '12px', fontWeight: '500' }}>
                            {team.topicName}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: '700', color: team.rank <= 3 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {team.score.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {allRoundsData[selectedRoundTab] && Object.keys(allRoundsData[selectedRoundTab]).length > 0 ? (
                  Object.keys(allRoundsData[selectedRoundTab]).map(trackName => (
                    <div key={trackName} className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                      <div style={{ padding: '16px 24px', background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Target size={18} color="var(--primary)" />
                        <h3 style={{ margin: 0, fontSize: '16px' }}>{trackName}</h3>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500', width: '80px' }}>Rank</th>
                            <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>Team Name</th>
                            <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>Topic</th>
                            <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500', width: '120px' }}>Status</th>
                            <th style={{ padding: '12px 24px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500', textAlign: 'right', width: '100px' }}>Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allRoundsData[selectedRoundTab][trackName].map((team) => (
                            <tr key={team.teamId} style={{ 
                              borderBottom: '1px solid var(--border-color)', 
                              background: team.promoted ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
                              transition: 'background 0.2s ease', 
                              cursor: 'default' 
                            }}>
                              <td style={{ padding: '16px 24px' }}>
                                <span style={{ color: team.rank <= 3 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: '600' }}>#{team.rank}</span>
                              </td>
                              <td style={{ padding: '16px 24px', fontWeight: team.promoted ? '700' : '500' }}>
                                {team.name}
                              </td>
                              <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                                <span style={{ padding: '4px 8px', background: 'var(--bg-hover)', borderRadius: '6px', fontSize: '12px', fontWeight: '500' }}>
                                  {team.topicName}
                                </span>
                              </td>
                              <td style={{ padding: '16px 24px' }}>
                                {team.promoted ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--success)', background: 'rgba(34, 197, 94, 0.1)', padding: '4px 8px', borderRadius: '12px', fontWeight: '600' }}>
                                    <CheckCircle2 size={14} /> Advanced
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>-</span>
                                )}
                              </td>
                              <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: '700' }}>
                                {team.score.toFixed(1)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))
                ) : (
                  <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No results available for this round yet.
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default EventArchive;
