import React, { useState, useEffect } from 'react';
import { UserX, Search, Plus, Mail, Eye, CheckCircle, XCircle, Clock, X, Save, AlertCircle, Loader2 } from 'lucide-react';
import { adminApi } from '../../api/adminApi';

const AccountManagement = () => {
  const [tab, setTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: 'Dr. John Doe', email: 'johndoe@gmail.com', role: 'Judge' });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);

  const [pendingList, setPendingList] = useState([]);
  const [activeList, setActiveList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null); // Lưu ID của account cần reject

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pending, active] = await Promise.all([
        adminApi.getPendingAccounts(),
        adminApi.getActiveAccounts()
      ]);
      setPendingList(pending);
      setActiveList(active);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await adminApi.approveAccount(id);
      loadData(); // Tải lại danh sách
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (id) => {
    setShowRejectModal(id);
  };

  const confirmReject = async () => {
    if (!showRejectModal) return;
    const id = showRejectModal;
    setShowRejectModal(null); // Đóng modal ngay lập tức
    setProcessingId(id);
    
    try {
      await adminApi.rejectAccount(id);
      loadData(); // Tải lại danh sách
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateAccount = (e) => {
    e.preventDefault();
    if (!newAccount.name || !newAccount.email) return;
    
    setError('');
    if (newAccount.email.includes('error')) {
      setError('SMTP Error: Unable to send invitation email to this address.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }

    setIsCreating(true);

    setTimeout(() => {
      const account = {
        id: Date.now(),
        name: newAccount.name,
        email: newAccount.email,
        role: newAccount.role,
        status: 'active',
        joined: 'Just now'
      };
      
      setActiveList([account, ...activeList]);
      setIsCreating(false);
      setShowCreateModal(false);
      setNewAccount({ name: 'Dr. John Doe', email: 'johndoe@gmail.com', role: 'Judge' });
    }, 1500);
  };

  const roleColor = { Participant: 'var(--primary)', Judge: 'var(--warning)', Mentor: 'var(--accent-3)', Admin: 'var(--danger)' };

  const filteredPending = pendingList.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.email.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredActive = activeList.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Global Account Management</h1>
          <p className="subtitle">Manage user identities, approve participant registrations, and create expert accounts.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}><Plus size={18} /> Create Expert Account</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', background: '#F1F5F9', borderRadius: '12px', padding: '4px', width: 'fit-content', border: '1px solid var(--border-color)' }}>
        {['pending', 'active'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', background: tab === t ? 'var(--primary)' : 'transparent', color: tab === t ? 'white' : 'var(--text-secondary)', transition: 'var(--transition)', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {t === 'pending' ? <Clock size={15} /> : <CheckCircle size={15} />}
            {t === 'pending' ? `Pending Approvals (${pendingList.length})` : `Active Accounts (${activeList.length})`}
          </button>
        ))}
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', width: '320px' }}>
            <Search size={16} color="var(--text-secondary)" />
            <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '13px' }} />
          </div>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-subtle)' }}>
              {tab === 'pending' ? (
                ['User Info', 'Campus & Student ID', 'Verification Proof', 'Registered', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>{h}</th>
                ))
              ) : (
                ['User Info', 'Global Role', 'Joined Date', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>{h}</th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {tab === 'pending' && filteredPending.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=3b82f6&color=fff`} alt={u.name} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{u.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <div>{u.campus} Campus</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>{u.studentId}</div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ fontSize: '12px', padding: '4px 10px', background: 'rgba(59,130,246,0.1)', color: 'var(--primary)', borderRadius: '10px', cursor: 'pointer', border: '1px solid rgba(59,130,246,0.2)' }}>
                    {u.proof}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>{u.registered}</td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleApprove(u.id)}
                      disabled={processingId === u.id}
                      style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: 'var(--success)', fontSize: '12px', cursor: processingId === u.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', opacity: processingId === u.id ? 0.5 : 1 }}>
                      {processingId === u.id ? <Loader2 size={14} className="spin" /> : <CheckCircle size={14} />} Approve
                    </button>
                    <button 
                      onClick={() => handleRejectClick(u.id)}
                      disabled={processingId === u.id}
                      style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: 'var(--danger)', fontSize: '12px', cursor: processingId === u.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', opacity: processingId === u.id ? 0.5 : 1 }}>
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            
            {tab === 'active' && filteredActive.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=8b5cf6&color=fff`} alt={u.name} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{u.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '12px', color: roleColor[u.role] || 'white', background: 'var(--bg-hover)' }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>{u.joined}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', fontWeight: '600', background: u.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: u.status === 'active' ? 'var(--success)' : 'var(--danger)', textTransform: 'capitalize' }}>
                    {u.status}
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ padding: '6px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }} title="View Profile"><Eye size={14} /></button>
                    <button style={{ padding: '6px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Send Email"><Mail size={14} /></button>
                    <button style={{ padding: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: 'var(--danger)', cursor: 'pointer' }} title="Suspend Account"><UserX size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            
            {isLoading ? (
              <tr>
                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Loader2 size={24} className="spin" style={{ margin: '0 auto', display: 'block', marginBottom: '8px' }} />
                  Loading accounts...
                </td>
              </tr>
            ) : ((tab === 'pending' && filteredPending.length === 0) || (tab === 'active' && filteredActive.length === 0)) && (
              <tr>
                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={() => setShowCreateModal(false)} />
          
          <div className="animate-fade-in" style={{ position: 'relative', width: '90%', maxWidth: '500px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '32px', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
            <button className="btn-icon" onClick={() => setShowCreateModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'var(--bg-subtle)' }}>
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '24px', marginBottom: '8px', color: 'var(--text-primary)' }}>Create Expert Account</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>Issue a new account for Mentors or Judges directly.</p>

            {/* Error Message UI */}
            {error && (
              <div
                className={shaking ? 'shake' : ''}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '10px', marginBottom: '20px',
                  animation: shaking ? 'shake 0.4s ease-in-out' : 'none',
                }}
              >
                <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Full Name</label>
                <input type="text" placeholder="e.g. Dr. Nguyen Van A" value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} required style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Email Address</label>
                <input type="email" placeholder="email@example.com" value={newAccount.email} onChange={e => setNewAccount({...newAccount, email: e.target.value})} required style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-subtle)', border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'var(--border-color)'}`, borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Assign Role</label>
                <select value={newAccount.role} onChange={e => setNewAccount({...newAccount, role: e.target.value})} style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                  <option value="Judge" style={{ color: 'black' }}>Judge</option>
                  <option value="Mentor" style={{ color: 'black' }}>Mentor</option>
                  <option value="Admin" style={{ color: 'black' }}>Admin</option>
                </select>
              </div>

              <div style={{ marginTop: '8px', padding: '16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '13px', color: 'var(--success)', fontWeight: '500' }}>An email will be sent automatically with a secure login link and temporary password.</div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer' }} onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={isCreating}>
                  <Save size={18} /> {isCreating ? 'Processing...' : 'Issue Account'}
                </button>
              </div>
            </form>
          </div>
          
          <style>{`
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              20% { transform: translateX(-8px); }
              40% { transform: translateX(8px); }
              60% { transform: translateX(-6px); }
              80% { transform: translateX(6px); }
            }
          `}</style>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setShowRejectModal(null)} />
          
          <div className="animate-fade-in" style={{ position: 'relative', width: '90%', maxWidth: '400px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '24px', boxShadow: '0 24px 60px rgba(0,0,0,0.15)', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--danger)' }}>
              <AlertCircle size={24} />
            </div>
            
            <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text-primary)' }}>Reject Account</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Are you sure you want to reject this registration? The user will be notified via email and must re-upload their verification proof.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer' }} onClick={() => setShowRejectModal(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--danger)', borderColor: 'var(--danger)', padding: '10px' }} onClick={confirmReject}>
                Yes, Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
