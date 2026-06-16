import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowLeft, Trophy, Medal, Gift, Award, Target, CheckCircle2 } from 'lucide-react';

const EventArchive = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const leaderboard = [
    { rank: 1, name: 'NeuroWeavers', track: 'EdTech AI', project: 'Accessible Learning Platform', score: 98.5 },
    { rank: 2, name: 'ByteForce', track: 'Fintech', project: 'Micro-lending DAO', score: 94.2 },
    { rank: 3, name: 'LogicGate', track: 'Security', project: 'Zero-Trust Validator', score: 91.0 },
    { rank: 4, name: 'DataSculpt', track: 'Big Data', project: 'Climate Predictor', score: 88.5 },
    { rank: 5, name: 'CloudNine', track: 'Cloud Native', project: 'Serverless Metrics', score: 87.0 },
    { rank: 6, name: 'SyntaxErrors', track: 'Fintech', project: 'Budget Tracker Pro', score: 85.5 },
  ];

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
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '16px' }}>Winter Codefest 2025</h1>
            <div style={{ display: 'flex', gap: '24px', color: 'var(--text-secondary)', fontSize: '15px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={18}/> Dec 1 - Dec 15, 2025</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={18}/> FPT University HN</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={18}/> 86 Teams Competed</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Prize Pool Distributed</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#ffd700' }}>$8,000</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--border-color)', marginBottom: '32px' }}>
        {['overview', 'leaderboard', 'prizes'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 0',
              background: 'none',
              border: 'none',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === tab ? '600' : '500',
              textTransform: 'capitalize',
              transition: 'var(--transition)'
            }}
          >
            {tab === 'overview' ? 'Overview & Tracks' : tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
            <div>
              <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Event Summary</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '15px', marginBottom: '24px' }}>
                Winter Codefest 2025 brought together over 300 students from all FPT University campuses to tackle pressing challenges in Financial Technology (Fintech), Educational Technology (EdTech), and Data Security. Over the course of two weeks, teams formed, brainstormed, and built fully functional prototypes evaluated by our expert judging panel.
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '15px' }}>
                The event concluded with an intense pitching session where the top 10 teams demonstrated their projects live. The creativity and technical execution displayed set a new benchmark for SEAL hackathons.
              </p>
            </div>
            
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={20} color="var(--primary)" /> Tracks Featured
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>EdTech AI</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>AI tools for accessible learning.</div>
                </div>
                <div style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: '12px', borderLeft: '4px solid var(--accent-1)' }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Fintech</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Next-gen finance & micro-lending.</div>
                </div>
                <div style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: '12px', borderLeft: '4px solid var(--success)' }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Data Security</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Zero-trust and cryptography.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Final Leaderboard</h2>
            <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-hover)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '500', width: '80px' }}>Rank</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '500' }}>Team Name</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '500' }}>Project</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '500' }}>Track</th>
                    <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'right' }}>Final Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((team, idx) => (
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
                      <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{team.project}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ padding: '4px 10px', background: 'var(--bg-hover)', borderRadius: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {team.track}
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
          </div>
        )}

        {/* Prizes Tab */}
        {activeTab === 'prizes' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Prize Distribution</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              
              <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
                  <Trophy size={150} color="#ffd700" />
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ color: '#ffd700', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '8px' }}>Grand Prize</div>
                  <h3 style={{ fontSize: '32px', marginBottom: '24px' }}>$5,000</h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-secondary)' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="#ffd700" /> Cash Prize (Equally split)</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="#ffd700" /> SEAL Labs Incubation Interview</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="#ffd700" /> 1-Year Pro Github Licenses</li>
                  </ul>
                  <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--bg-active)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Awarded to: </span>
                    <strong style={{ color: '#ffd700' }}>NeuroWeavers</strong>
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', border: '1px solid rgba(192, 192, 192, 0.3)' }}>
                <div style={{ color: '#c0c0c0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '8px' }}>Runner Up</div>
                <h3 style={{ fontSize: '32px', marginBottom: '24px' }}>$2,000</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-secondary)' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="#c0c0c0" /> Cash Prize</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="#c0c0c0" /> JetBrains All Products Pack</li>
                </ul>
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--bg-active)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Awarded to: </span>
                  <strong style={{ color: '#c0c0c0' }}>ByteForce</strong>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', border: '1px solid rgba(205, 127, 50, 0.3)' }}>
                <div style={{ color: '#cd7f32', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '8px' }}>Third Place</div>
                <h3 style={{ fontSize: '32px', marginBottom: '24px' }}>$1,000</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-secondary)' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="#cd7f32" /> Cash Prize</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="#cd7f32" /> $500 AWS Credits</li>
                </ul>
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--bg-active)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Awarded to: </span>
                  <strong style={{ color: '#cd7f32' }}>LogicGate</strong>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default EventArchive;
