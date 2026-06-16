import React from 'react';
import { Trophy, Star, Award, MessageSquare, Target, TrendingUp, Medal } from 'lucide-react';
import './Workspace.css';

const Scores = () => {
  return (
    <div className="animate-fade-in" style={{ padding: '0 20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Scores & Results</h1>
          <p className="subtitle">Track: Track B - Medical Knowledge RAG | Phase: Qualifying Round</p>
        </div>
        <div style={{ textAlign: 'right' }}>
           <div className="status-badge open" style={{ display: 'inline-block', fontSize: '14px', padding: '6px 16px', borderRadius: '20px' }}>
             Results Published
           </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }}>
        {/* Team Score Card */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Target size={20} color="var(--primary)" /> Your Team Score</h2>
            <div style={{ background: '#F8FAFC', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--success)' }}>89.5</span>
              <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>/100</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span>Innovation & Creativity</span>
                <strong>22 / 25</strong>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-active)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '88%', height: '100%', background: 'var(--primary)' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span>Technical Complexity</span>
                <strong>25 / 30</strong>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-active)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '83%', height: '100%', background: 'var(--accent-1)' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span>UX/UI & Usability</span>
                <strong>18 / 20</strong>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-active)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '90%', height: '100%', background: 'var(--success)' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span>Business Potential</span>
                <strong>24.5 / 25</strong>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-active)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '98%', height: '100%', background: 'var(--warning)' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Judge Feedback Card */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}><MessageSquare size={20} color="var(--accent-2)" /> Judges' Feedback</h2>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '12px', borderLeft: '3px solid var(--primary)' }}>
              <p style={{ fontSize: '14px', lineHeight: '1.6', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                "Excellent architecture and use of modern AI models. The business model is highly viable. However, to win the final round, the team needs to optimize the database read speed and polish the mobile responsiveness of the Dashboard."
              </p>
              <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>— Judge Alan Turing (Lead AI Engineer)</div>
            </div>
            <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '12px', borderLeft: '3px solid var(--accent-1)' }}>
              <p style={{ fontSize: '14px', lineHeight: '1.6', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                "The pitch deck was very convincing. Great teamwork! Pay attention to edge cases in user input."
              </p>
              <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>— Judge Ada Lovelace</div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}><Trophy size={24} color="var(--warning)" /> Track B Leaderboard</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981' }}></div>
            Top 2 advance to Final Round
          </div>
        </div>

        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Rank</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Team Name</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>University</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Total Score</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Top 3 - Promoted */}
              <tr style={{ background: 'rgba(16, 185, 129, 0.05)', borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '16px' }}><div className="rank-badge gold" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: '#000', fontWeight: 'bold' }}>1</div></td>
                <td style={{ padding: '16px', fontWeight: '600' }}>DeepMind Innovators</td>
                <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>MIT</td>
                <td style={{ padding: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>95.0</td>
                <td style={{ padding: '16px' }}><span style={{ padding: '4px 12px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderRadius: '12px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}><TrendingUp size={14}/> Promoted</span></td>
              </tr>
              
              <tr style={{ background: 'rgba(16, 185, 129, 0.05)', borderBottom: '1px solid var(--border-color)', borderLeft: '3px solid var(--primary)' }}>
                <td style={{ padding: '16px' }}><div className="rank-badge silver" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #cbd5e1, #94a3b8)', color: '#000', fontWeight: 'bold' }}>2</div></td>
                <td style={{ padding: '16px', fontWeight: '600', color: 'var(--primary)' }}>NullPointerException (You)</td>
                <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>FPT University</td>
                <td style={{ padding: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>89.5</td>
                <td style={{ padding: '16px' }}><span style={{ padding: '4px 12px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderRadius: '12px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}><TrendingUp size={14}/> Promoted</span></td>
              </tr>

              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '16px' }}><div className="rank-badge bronze" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #f87171, #b91c1c)', color: '#fff', fontWeight: 'bold' }}>3</div></td>
                <td style={{ padding: '16px', fontWeight: '600' }}>Byte Me</td>
                <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>Stanford</td>
                <td style={{ padding: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>88.0</td>
                <td style={{ padding: '16px' }}><span style={{ padding: '4px 12px', background: 'var(--bg-hover)', color: 'var(--text-secondary)', borderRadius: '12px', fontSize: '12px', fontWeight: '500', width: 'fit-content' }}>Eliminated</span></td>
              </tr>

              {/* Not Promoted */}
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '16px', fontWeight: '600', paddingLeft: '24px' }}>4</td>
                <td style={{ padding: '16px', fontWeight: '500' }}>404 Brain Not Found</td>
                <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>RMIT</td>
                <td style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>85.5</td>
                <td style={{ padding: '16px' }}><span style={{ padding: '4px 12px', background: 'var(--bg-hover)', color: 'var(--text-secondary)', borderRadius: '12px', fontSize: '12px', fontWeight: '500', width: 'fit-content' }}>Eliminated</span></td>
              </tr>
              <tr>
                <td style={{ padding: '16px', fontWeight: '600', paddingLeft: '24px' }}>5</td>
                <td style={{ padding: '16px', fontWeight: '500' }}>Syntax Terrors</td>
                <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>HUST</td>
                <td style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>82.0</td>
                <td style={{ padding: '16px' }}><span style={{ padding: '4px 12px', background: 'var(--bg-hover)', color: 'var(--text-secondary)', borderRadius: '12px', fontSize: '12px', fontWeight: '500', width: 'fit-content' }}>Eliminated</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Scores;
