import React, { useState } from 'react';
import { Search, Filter, Users, Star, TrendingUp, Code, Zap, Globe, Shield, ChevronRight, X, ExternalLink, Monitor } from 'lucide-react';

const mockTeams = [
  { id: 1, name: 'DeepMind Innovators', project: 'NeuralNet Optimizer', track: 'Track A - AI Agent', status: 'Active', score: 95.0, members: 4, icon: <Zap size={24} color="#3b82f6" />, description: 'An advanced AI tool that optimizes neural network structures for edge devices.', repo: 'github.com/bytestrike/nn-opt', demo: 'bytestrike-demo.vercel.app', membersList: [{name: 'Alice Chen', role: 'Team Lead'}, {name: 'Bob Smith', role: 'ML Engineer'}] },
  { id: 2, name: 'NullPointerException', project: 'Medical RAG System', track: 'Track B - Medical RAG', status: 'Active', score: 89.5, members: 3, icon: <Star size={24} color="#10b981" />, description: 'A domain-specific RAG system for medical literature that enables healthcare professionals to query complex medical knowledge bases.', repo: 'github.com/nullpointer/medical-rag', demo: 'medical-rag-demo.vercel.app', membersList: [{name: 'Eve Johnson', role: 'Full Stack'}, {name: 'Frank Castle', role: 'Hardware'}, {name: 'Grace Hopper', role: 'Designer'}] },
  { id: 3, name: 'BeaconAnalytics', project: 'Predictive Sales Tool', track: 'Track C - EduTech', status: 'Active', score: 85.5, members: 5, icon: <TrendingUp size={24} color="#8b5cf6" />, description: 'Predictive analytics platform for B2B sales teams to identify high-value leads using historical data.', repo: 'github.com/beacon/sales-tool', demo: 'beacon-analytics.io', membersList: [{name: 'Harry Potter', role: 'Data Scientist'}, {name: 'Iris West', role: 'Data Engineer'}, {name: 'John Doe', role: 'UI/UX'}] },
  { id: 4, name: 'QuantumLeap', project: 'Crypto Wallet Pro', track: 'Track D - Blockchain', status: 'Eliminated', score: 71.0, members: 4, icon: <Globe size={24} color="#f59e0b" />, description: 'A decentralized, non-custodial multi-chain wallet with integrated swapping capabilities.', repo: 'github.com/quantum/wallet-pro', demo: 'quantum-wallet.eth', membersList: [{name: 'Mike Ross', role: 'Smart Contracts'}, {name: 'Nina Dobrev', role: 'Frontend'}] },
  { id: 5, name: 'CyberShield', project: 'Zero-Trust Authenticator', track: 'Track A - AI Agent', status: 'Active', score: 88.0, members: 2, icon: <Shield size={24} color="#ef4444" />, description: 'A seamless zero-trust authentication protocol for enterprise applications.', repo: 'github.com/cybershield/zta', demo: 'cybershield.dev', membersList: [{name: 'Quinn Fabray', role: 'Security Architect'}, {name: 'Rachel Berry', role: 'Developer'}] },
  { id: 6, name: 'CodeCrafters', project: 'No-Code Website Builder', track: 'Track B - Medical RAG', status: 'Active', score: 90.0, members: 3, icon: <Code size={24} color="#ec4899" />, description: 'Drag and drop website builder that outputs clean, production-ready React code.', repo: 'github.com/codecrafters/builder', demo: 'codecrafters.app', membersList: [{name: 'Samwise Gamgee', role: 'Frontend'}, {name: 'Tony Stark', role: 'Full Stack'}, {name: 'Uma Thurman', role: 'Designer'}] },
];

const PerformingTeams = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedTeam, setSelectedTeam] = useState(null);

  const filteredTeams = mockTeams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          team.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || team.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Performing Teams</h1>
          <p className="page-subtitle">Monitor and manage all participating teams</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary">
            <Filter size={18} /> Export Data
          </button>
        </div>
      </div>

      <div className="filters-bar glass-panel" style={{ display: 'flex', gap: '16px', padding: '16px', marginBottom: '24px', alignItems: 'center', borderRadius: '16px' }}>
        <div className="search-input-wrapper" style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search teams or projects..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 16px 12px 44px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['All', 'Active', 'Eliminated'].map(status => (
            <button 
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`btn ${filterStatus === status ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px' }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="teams-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredTeams.map(team => (
          <div key={team.id} className="team-card glass-panel" style={{ padding: '24px', borderRadius: '16px', transition: 'transform 0.2s ease, box-shadow 0.2s ease', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: team.status === 'Active' ? 'var(--primary)' : 'var(--text-secondary)' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {team.icon}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{team.name}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '2px 8px', background: 'var(--bg-hover)', borderRadius: '12px', marginTop: '4px', display: 'inline-block' }}>{team.track}</span>
                </div>
              </div>
              <div style={{ background: team.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: team.status === 'Active' ? '#10b981' : '#ef4444', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                {team.status}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Project Name</div>
              <div style={{ fontSize: '15px', fontWeight: '500' }}>{team.project}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                <Users size={16} /> {team.members} Members
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: team.score >= 90 ? '#3b82f6' : 'var(--text-primary)' }}>
                Score: {team.score}
              </div>
            </div>

            <button onClick={() => setSelectedTeam(team)} style={{ width: '100%', marginTop: '16px', padding: '10px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--primary)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'background 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-active)'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}>
              View Details <ChevronRight size={16} />
            </button>
          </div>
        ))}
        {filteredTeams.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3>No teams found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* Team Detail Modal */}
      {selectedTeam && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Backdrop */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={() => setSelectedTeam(null)} />
          
          {/* Modal Content */}
          <div className="animate-fade-in" style={{ position: 'relative', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '32px', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
            <button className="btn-icon" onClick={() => setSelectedTeam(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'var(--bg-hover)' }}>
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '32px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selectedTeam.icon}
              </div>
              <div>
                <h2 style={{ fontSize: '24px', margin: '0 0 8px 0' }}>{selectedTeam.name}</h2>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', padding: '4px 12px', background: 'rgba(59,130,246,0.1)', color: 'var(--primary)', borderRadius: '20px', fontWeight: '600' }}>{selectedTeam.track}</span>
                  <span style={{ fontSize: '13px', padding: '4px 12px', background: selectedTeam.status === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: selectedTeam.status === 'Active' ? 'var(--success)' : 'var(--danger)', borderRadius: '20px', fontWeight: '600' }}>{selectedTeam.status}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
              {/* Left Column: Project Info */}
              <div>
                <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Project Submission</h4>
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{selectedTeam.project}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>{selectedTeam.description}</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <a href={`https://${selectedTeam.repo}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)', textDecoration: 'none', transition: 'var(--transition)' }} onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background='var(--bg-subtle)'}>
                      <Code size={18} />
                      <div style={{ flex: 1, fontSize: '14px' }}>GitHub Repository</div>
                      <ExternalLink size={14} color="var(--text-secondary)" />
                    </a>
                    <a href={`https://${selectedTeam.demo}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', color: 'var(--primary)', textDecoration: 'none', transition: 'var(--transition)' }} onMouseEnter={e => e.currentTarget.style.background='rgba(59,130,246,0.15)'} onMouseLeave={e => e.currentTarget.style.background='rgba(59,130,246,0.1)'}>
                      <Monitor size={18} />
                      <div style={{ flex: 1, fontSize: '14px' }}>Live Demo Link</div>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column: Members & Scores */}
              <div>
                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Team Members ({selectedTeam.members})</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedTeam.membersList.map((member, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'var(--bg-subtle)', borderRadius: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, hsl(${i * 60}, 70%, 50%), hsl(${i * 60 + 40}, 70%, 50%))` }} />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500' }}>{member.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{member.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Evaluation</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Current Score</div>
                      <div style={{ fontSize: '32px', fontWeight: '700', color: selectedTeam.score >= 90 ? '#3b82f6' : 'var(--text-primary)' }}>{selectedTeam.score}</div>
                    </div>
                    <div style={{ width: '1px', height: '40px', background: 'var(--border-color)' }} />
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setSelectedTeam(null); }}>
                        View Audit Log
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformingTeams;
