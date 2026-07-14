import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { UserCheck, Shield, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { eventService } from '../../api/eventService';
import apiClient from '../../api/apiClient';
import './EventDashboard.css';

const EventStaffManagement = () => {
  const { eventId } = useParams();
  const [staff, setStaff] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [staffRes, accountsRes] = await Promise.all([
        eventService.getAssignedStaff(eventId),
        apiClient.get('/api/v1/accounts')
      ]);
      setStaff(staffRes.data || staffRes || []);
      
      // Filter only accounts that are STAFF
      const accounts = accountsRes.data?.data || accountsRes.data || [];
      setAllAccounts(accounts.filter(a => a.role === 'STAFF'));
    } catch (err) {
      console.error(err);
      setError("Failed to load staff data.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAccountId) return;
    setAssigning(true);
    setError(null);
    try {
      await eventService.assignStaff(eventId, selectedAccountId);
      setSelectedAccountId('');
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign staff.");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (accountId) => {
    if (!window.confirm("Are you sure you want to remove this staff member from the event?")) return;
    setRemovingId(accountId);
    setError(null);
    try {
      await eventService.removeStaff(eventId, accountId);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove staff.");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Loader2 className="spinner" size={40} style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  // Find staff that are not yet assigned
  const assignedIds = new Set(staff.map(s => s.accountId));
  const availableStaff = allAccounts.filter(a => !assignedIds.has(a.id));

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1>Event Staff Management</h1>
          <p className="subtitle">Assign staff members to help manage this event</p>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '20px' }}>
          <AlertCircle size={18} />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{error}</span>
        </div>
      )}

      <div className="panel glass-panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
          <h2>Assign New Staff</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Select Staff Account
            </label>
            <select 
              className="input-field" 
              value={selectedAccountId} 
              onChange={e => setSelectedAccountId(e.target.value)}
              disabled={assigning || availableStaff.length === 0}
            >
              <option value="">{availableStaff.length === 0 ? "No available staff to assign" : "Select a staff member..."}</option>
              {availableStaff.map(s => (
                <option key={s.id} value={s.id}>{s.fullName || s.email} ({s.email})</option>
              ))}
            </select>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleAssign} 
            disabled={!selectedAccountId || assigning}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', height: '42px' }}
          >
            {assigning ? <Loader2 size={16} className="spinner" /> : <Plus size={16} />}
            Assign Staff
          </button>
        </div>
      </div>

      <div className="panel glass-panel">
        <div className="panel-header" style={{ marginBottom: '16px' }}>
          <h2>Assigned Staff ({staff.length})</h2>
        </div>

        {staff.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Shield size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>No staff assigned to this event.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Department</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.accountId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.fullName || s.email)}&background=F26F21&color=fff`} 
                          alt="avatar" 
                          style={{ width: '36px', height: '36px', borderRadius: '50%' }} 
                        />
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px' }}>{s.fullName || 'No Name'}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{s.department || '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn-icon" 
                        title="Remove Staff"
                        onClick={() => handleRemove(s.accountId)}
                        disabled={removingId === s.accountId}
                        style={{ color: 'var(--danger)', padding: '6px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}
                      >
                        {removingId === s.accountId ? <Loader2 size={16} className="spinner" /> : <Trash2 size={16} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventStaffManagement;
