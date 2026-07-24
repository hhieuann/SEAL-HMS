import React, { useState, useEffect } from 'react';
import { UserX, Search, Plus, Eye, CheckCircle, XCircle, Clock, X, Save, AlertCircle, Loader2, Copy, KeyRound, UserPlus } from 'lucide-react';
import { adminApi } from '../../api/adminApi';

const AccountManagement = () => {
  const [tab, setTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roleToCreate, setRoleToCreate] = useState('LECTURER');
  const [newAccount, setNewAccount] = useState({ fullName: '', email: '', department: '', campus: '', phone: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [tempPassword, setTempPassword] = useState(null); // shown after successful creation
  const [copied, setCopied] = useState(false);

  const [pendingList, setPendingList] = useState([]);
  const [activeList, setActiveList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null); // Lưu ID của account cần reject
  const [showProofUrl, setShowProofUrl] = useState(null);
  const [profileAccount, setProfileAccount] = useState(null); // account being viewed in the profile modal
  const [suspendAccount, setSuspendAccount] = useState(null); // account pending suspend confirmation

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

  const confirmSuspend = async () => {
    if (!suspendAccount) return;
    const acc = suspendAccount;
    setSuspendAccount(null);
    setProcessingId(acc.id);
    try {
      await adminApi.updateAccountStatus(acc.id, 'DISABLED');
      loadData();
    } catch (err) {
      console.error('Failed to suspend account', err);
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError('');

    if (!newAccount.fullName.trim() || !newAccount.email.trim() || !newAccount.phone.trim()) {
      setError('Full Name, Email Address, and Phone are required.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAccount.email.trim())) {
      setError('Please enter a valid email address.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }

    const phoneRegex = /^\+?[0-9\s\-]{10,20}$/;
    if (!phoneRegex.test(newAccount.phone.trim())) {
      setError('Phone number must contain only 10-20 digits (spaces/hyphens allowed).');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }

    setIsCreating(true);
    try {
      let result;
      if (roleToCreate === 'STAFF') {
        result = await adminApi.createStaffAccount(newAccount);
      } else {
        result = await adminApi.createLecturerAccount(newAccount);
      }
      setTempPassword(result.tempPassword);
      // Also add to active list immediately
      setActiveList(prev => [{
        id: result.accountId,
        name: result.fullName,
        email: result.email,
        role: roleToCreate,
        status: 'active',
        joined: 'Just now'
      }, ...prev]);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create account';
      setError(msg);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setTempPassword(null);
    setCopied(false);
    setError('');
    setRoleToCreate('LECTURER');
    setNewAccount({ fullName: '', email: '', department: '', campus: '', phone: '' });
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roleColor = { 
    STUDENT: '#3b82f6', 
    LECTURER: '#10b981', 
    ADMIN: '#ef4444', 
    STAFF: '#f59e0b', 
    JUDGE: '#8b5cf6', 
    GUEST_JUDGE: '#d946ef', 
    MENTOR: '#06b6d4' 
  };

  const filteredPending = pendingList.filter(a => 
    (a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (roleFilter === 'ALL' || a.role === roleFilter || (a.role === undefined && roleFilter === 'STUDENT'))
  );
  
  const filteredActive = activeList.filter(a => 
    (a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (roleFilter === 'ALL' || a.role === roleFilter)
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Global Account Management</h1>
          <p className="subtitle">Manage user identities, approve participant registrations, and create expert accounts.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}><UserPlus size={18} /> Create Account</button>
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
          <div style={{ display: 'flex', gap: '16px', flex: 1, alignItems: 'center' }}>
            <div className="filter-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', padding: '0 16px', borderRadius: '10px', border: '1px solid var(--border-color)', width: '320px' }}>
              <Search size={16} color="var(--text-secondary)" />
              <input type="text" className="no-border-input" placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ color: 'var(--text-primary)', width: '100%', fontSize: '13px' }} />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="filter-select" style={{ borderRadius: '10px', border: '1px solid var(--border-color)', outline: 'none', background: '#FFFFFF', color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer' }}>
              <option value="ALL">All Roles</option>
              <option value="STUDENT">Student</option>
              <option value="LECTURER">Lecturer</option>
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
              <option value="JUDGE">Judge</option>
              <option value="GUEST_JUDGE">Guest Judge</option>
              <option value="MENTOR">Mentor</option>
            </select>
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
                ['User Info', 'Global Role', 'Joined Date', 'Actions'].map(h => (
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
                    <img 
                      src={u.avatarUrl ? `${import.meta.env.VITE_API_BASE_URL || ''}${u.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=3b82f6&color=fff`} 
                      alt={u.name} 
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} 
                    />
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
                  <span 
                    onClick={() => u.proofUrl && setShowProofUrl(u.proofUrl)}
                    style={{ 
                      fontSize: '12px', padding: '4px 10px', 
                      background: 'rgba(59,130,246,0.1)', color: 'var(--primary)', 
                      borderRadius: '10px', border: '1px solid rgba(59,130,246,0.2)',
                      cursor: u.proofUrl ? 'pointer' : 'default',
                      textDecoration: u.proofUrl ? 'underline' : 'none'
                    }}>
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
                    <img 
                      src={u.avatarUrl ? `${import.meta.env.VITE_API_BASE_URL || ''}${u.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=8b5cf6&color=fff`} 
                      alt={u.name} 
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} 
                    />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{u.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '10px', 
                    fontSize: '12px', 
                    fontWeight: '600',
                    color: roleColor[u.role] || '#64748b', 
                    background: `${roleColor[u.role] || '#64748b'}15`, 
                    border: `1px solid ${roleColor[u.role] || '#64748b'}30` 
                  }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>{u.joined}</td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setProfileAccount(u)} style={{ padding: '6px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }} title="View Profile"><Eye size={14} /></button>
                    <button onClick={() => setSuspendAccount(u)} disabled={processingId === u.id} style={{ padding: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: 'var(--danger)', cursor: 'pointer' }} title="Suspend Account"><UserX size={14} /></button>
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
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={handleCloseModal} />
          
          <div className="animate-fade-in" style={{ position: 'relative', width: '90%', maxWidth: '520px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '32px', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
            <button className="btn-icon" onClick={handleCloseModal} style={{ position: 'absolute', top: '24px', right: '24px', background: 'var(--bg-subtle)' }}>
              <X size={20} />
            </button>

            {tempPassword ? (
              /* Step 2: Show temp password */
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--success)' }}>
                  <CheckCircle size={28} />
                </div>
                <h2 style={{ fontSize: '22px', marginBottom: '8px', color: 'var(--text-primary)' }}>Account Created!</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                  Share this temporary password with the lecturer. <strong>It won't be shown again.</strong>
                </p>
                <div style={{ padding: '16px 20px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Temporary Password</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'monospace', color: 'var(--text-primary)', letterSpacing: '2px' }}>{tempPassword}</div>
                  </div>
                  <button onClick={handleCopyPassword} style={{ padding: '8px 16px', background: copied ? 'rgba(16,185,129,0.1)' : 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', color: copied ? 'var(--success)' : 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', flexShrink: 0 }}>
                    <Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', fontSize: '13px', color: 'var(--warning)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <KeyRound size={15} style={{ flexShrink: 0 }} /> User must change their password after first login.
                </div>
                <button onClick={handleCloseModal} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Done</button>
              </div>
            ) : (
              /* Step 1: Create form */
              <>
                <h2 style={{ fontSize: '24px', marginBottom: '8px', color: 'var(--text-primary)' }}>Create Account</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>Issue a new account. A temporary password will be generated.</p>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="radio" name="role" value="LECTURER" checked={roleToCreate === 'LECTURER'} onChange={(e) => setRoleToCreate(e.target.value)} />
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>Lecturer</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="radio" name="role" value="STAFF" checked={roleToCreate === 'STAFF'} onChange={(e) => setRoleToCreate(e.target.value)} />
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>Event Staff</span>
                  </label>
                </div>

                {error && (
                  <div className={shaking ? 'shake' : ''} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', marginBottom: '20px', animation: shaking ? 'shake 0.4s ease-in-out' : 'none' }}>
                    <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>{error}</span>
                  </div>
                )}

                <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Full Name *</label>
                    <input type="text" placeholder="e.g. Dr. Nguyen Van A" value={newAccount.fullName} onChange={e => setNewAccount({...newAccount, fullName: e.target.value})} required style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Email Address *</label>
                    <input type="email" placeholder="lecturer@example.com" value={newAccount.email} onChange={e => setNewAccount({...newAccount, email: e.target.value})} required style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-subtle)', border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'var(--border-color)'}`, borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Department</label>
                      <input type="text" placeholder="e.g. Software Engineering" value={newAccount.department} onChange={e => setNewAccount({...newAccount, department: e.target.value})} style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Campus</label>
                      <select value={newAccount.campus} onChange={e => setNewAccount({...newAccount, campus: e.target.value})} style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', appearance: 'none', boxSizing: 'border-box' }}>
                        <option value="">Select campus</option>
                        <option value="Hanoi">Hanoi (Hoa Lac)</option>
                        <option value="Ho Chi Minh">Ho Chi Minh</option>
                        <option value="Da Nang">Da Nang</option>
                        <option value="Can Tho">Can Tho</option>
                        <option value="Quy Nhon">Quy Nhon</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Phone *</label>
                    <input type="tel" placeholder="e.g. 0912345678" value={newAccount.phone} onChange={e => setNewAccount({...newAccount, phone: e.target.value})} required style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button type="button" style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer' }} onClick={handleCloseModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={isCreating}>
                      {isCreating ? <><Loader2 size={16} className="spin" /> Creating...</> : <><UserPlus size={16} /> Create Account</>}
                    </button>
                  </div>
                </form>
              </>
            )}
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

      {/* Verification Proof Image Modal */}
      {showProofUrl && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowProofUrl(null)} />
          
          <div className="animate-fade-in" style={{ position: 'relative', width: '90%', maxWidth: '600px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '24px', boxShadow: '0 24px 60px rgba(0,0,0,0.15)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', color: 'var(--text-primary)' }}>Verification Proof</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setShowProofUrl(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ background: 'var(--bg-subtle)', borderRadius: '12px', padding: '12px', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={showProofUrl} alt="Verification Proof" style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '8px' }} />
            </div>
          </div>
        </div>
      )}

      {/* View Profile Modal */}
      {profileAccount && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setProfileAccount(null)} />
          <div className="animate-fade-in" style={{ position: 'relative', width: '90%', maxWidth: '460px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '28px', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
            <button style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setProfileAccount(null)}><X size={20} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <img
                src={profileAccount.avatarUrl ? `${import.meta.env.VITE_API_BASE_URL || ''}${profileAccount.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(profileAccount.name)}&background=8b5cf6&color=fff`}
                alt={profileAccount.name}
                style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '4px' }}>{profileAccount.name}</h3>
                <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', color: roleColor[profileAccount.role] || '#64748b', background: `${roleColor[profileAccount.role] || '#64748b'}15`, border: `1px solid ${roleColor[profileAccount.role] || '#64748b'}30` }}>{profileAccount.role}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {[
                ['Email', profileAccount.email],
                ['Status', profileAccount.status],
                ['Student Code', profileAccount.studentCode],
                ['Campus', profileAccount.campus],
                ['Department', profileAccount.department],
                ['Phone', profileAccount.phone],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500', textTransform: label === 'Status' ? 'capitalize' : 'none' }}>{value}</span>
                </div>
              ))}
            </div>
            {profileAccount.proofUrl && (
              <button onClick={() => { const url = profileAccount.proofUrl; setProfileAccount(null); setShowProofUrl(url); }} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}>View Verification Proof</button>
            )}
            <button onClick={() => setProfileAccount(null)} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>Close</button>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {suspendAccount && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setSuspendAccount(null)} />
          <div className="animate-fade-in" style={{ position: 'relative', width: '90%', maxWidth: '420px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '28px', boxShadow: '0 24px 60px rgba(0,0,0,0.15)', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><UserX size={24} color="var(--danger)" /></div>
            <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>Suspend account?</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              <strong>{suspendAccount.name}</strong> ({suspendAccount.email}) will be disabled and can no longer log in until re-activated.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer' }} onClick={() => setSuspendAccount(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--danger)', borderColor: 'var(--danger)', padding: '10px' }} onClick={confirmSuspend}>Yes, Suspend</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
