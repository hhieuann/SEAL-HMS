import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, FileCode2, CheckSquare, AlertTriangle, ArrowUp, ArrowRight, Activity, UserPlus, MessageSquare, Ban, Lock } from 'lucide-react';
import './EventDashboard.css';

const EventDashboard = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>System Overview</h1>
          <p className="subtitle">Track the status of SEAL Hackathon Spring 2026</p>
        </div>
        <div className="status-indicator">
          <span className="dot live"></span> Ongoing (Qualifying Round)
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon gradient-1"><Users size={24} /></div>
          <div className="stat-details">
            <h3>Total Teams</h3>
            <p className="stat-value">124</p>
            <p className="stat-trend positive"><ArrowUp size={14} /> 12% vs last season</p>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon gradient-2"><FileCode2 size={24} /></div>
          <div className="stat-details">
            <h3>Pending Reviews</h3>
            <p className="stat-value">45</p>
            <p className="stat-trend neutral">Deadline: 23:59 today</p>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon gradient-3"><CheckSquare size={24} /></div>
          <div className="stat-details">
            <h3>Scored Submissions</h3>
            <p className="stat-value">82%</p>
            <p className="stat-trend warning">7 judges pending</p>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon gradient-4"><AlertTriangle size={24} /></div>
          <div className="stat-details">
            <h3>Violations & Reports</h3>
            <p className="stat-value">2</p>
            <p className="stat-trend negative">Action required</p>
          </div>
        </div>
      </div>

      <div className="dashboard-bottom-grid">
        <div className="panel glass-panel">
          <div className="panel-header">
            <h2>Top Performing Teams</h2>
            <button className="btn btn-text" onClick={() => navigate(`/admin/event/${eventId}/teams`)}>View all <ArrowRight size={16}/></button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Team</th>
                  <th>Track</th>
                  <th>Avg Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><div className="rank-badge gold">1</div></td>
                  <td><strong>DeepMind Innovators</strong><br/><small>4 members</small></td>
                  <td>Track A - AI Agent</td>
                  <td><span className="score-text">95.0</span></td>
                  <td><span className="status-tag status-success">Scored</span></td>
                </tr>
                <tr>
                  <td><div className="rank-badge silver">2</div></td>
                  <td><strong>EduNova</strong><br/><small>4 members</small></td>
                  <td>Track C - EduTech</td>
                  <td><span className="score-text">96.0</span></td>
                  <td><span className="status-tag status-success">Scored</span></td>
                </tr>
                <tr>
                  <td><div className="rank-badge bronze">3</div></td>
                  <td><strong>NullPointerException</strong><br/><small>3 members</small></td>
                  <td>Track B - Medical RAG</td>
                  <td><span className="score-text">89.5</span></td>
                  <td><span className="status-tag status-success">Scored</span></td>
                </tr>
                <tr>
                  <td><div className="rank-badge" style={{ background: 'var(--bg-active)', color: 'white' }}>4</div></td>
                  <td><strong>CodeCraft</strong><br/><small>3 members</small></td>
                  <td>Track A - AI Agent</td>
                  <td><span className="score-text">91.0</span></td>
                  <td><span className="status-tag status-warning">In Progress (2/3)</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel glass-panel">
          <div className="panel-header">
            <h2>Event Timeline</h2>
          </div>
          <div className="timeline">
            <div className="timeline-item completed">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <h4>Registration & Team Formation</h4>
                <p>Closed on May 10, 2026</p>
              </div>
            </div>
            <div className="timeline-item completed">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <h4>Qualifying Round - Submissions</h4>
                <p>Approved 120/124 teams</p>
              </div>
            </div>
            <div className="timeline-item active">
              <div className="timeline-dot pulse-dot"></div>
              <div className="timeline-content">
                <h4>Final Round - Judging</h4>
                <p>Judges are evaluating projects</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <h4>Winner Announcement</h4>
                <p>Expected: May 22, 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="glass-panel" style={{ marginTop: '28px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} color="var(--accent-3)" /> Recent Activity
          </h2>
          <button className="btn btn-text" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>View full audit log <ArrowRight size={14} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            { icon: <CheckSquare size={15} />, color: 'var(--success)', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', user: 'Judge Alan Turing', action: 'submitted final score for', target: 'NullPointerException', detail: '89.5 / 100 — AI Track', time: '2 min ago' },
            { icon: <UserPlus size={15} />, color: 'var(--primary)', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', user: 'Coordinator', action: 'approved account for', target: 'Nguyen Van An', detail: 'Participant — FPT University', time: '15 min ago' },
            { icon: <AlertTriangle size={15} />, color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', user: 'Coordinator', action: 'applied penalty to', target: 'DataSculpt', detail: '-5 pts — Late submission (12 min)', time: '1 hour ago' },
            { icon: <MessageSquare size={15} />, color: 'var(--accent-3)', bg: 'rgba(20,184,166,0.1)', border: 'rgba(20,184,166,0.25)', user: 'Mentor Sarah Nguyen', action: 'resolved ticket from', target: 'ByteStrike', detail: '"How to deploy backend to AWS?"', time: '2 hours ago' },
            { icon: <Ban size={15} />, color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', user: 'Coordinator', action: 'disqualified team', target: 'ByteStrike', detail: 'Code plagiarism detected (92% similarity)', time: '1 day ago' },
            { icon: <Lock size={15} />, color: 'var(--accent-1)', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)', user: 'Coordinator', action: 'published results for', target: 'Qualifying Round', detail: 'Scores now visible to all participants', time: '1 day ago' },
          ].map((item, i, arr) => (
            <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
              <div style={{ width: '34px', height: '34px', minWidth: '34px', borderRadius: '10px', background: item.bg, border: `1px solid ${item.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                {item.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', lineHeight: '1.5', marginBottom: '2px' }}>
                  <strong>{item.user}</strong>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '400' }}> {item.action} </span>
                  <strong style={{ color: item.color }}>{item.target}</strong>
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.detail}</p>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--bg-active)', whiteSpace: 'nowrap' }}>{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventDashboard;
