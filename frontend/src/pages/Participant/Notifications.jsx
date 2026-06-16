import React from 'react';
import { Bell, Calendar, MessageSquare, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import './Workspace.css';

const Notifications = () => {
  return (
    <div className="animate-fade-in" style={{ padding: '0 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Notifications</h1>
          <p className="subtitle">Stay updated with important announcements and alerts.</p>
        </div>
        <button className="btn btn-text" style={{ color: 'var(--text-secondary)' }}>Mark all as read</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Unread Notification: Alert/Important */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '20px', borderLeft: '4px solid var(--danger)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '50%', height: 'fit-content' }}>
            <AlertTriangle size={24} color="var(--danger)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Deadline Extension & System Maintenance</h3>
              <span style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: '600' }}>New • 2 hours ago</span>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Due to technical difficulties on the main server yesterday, the project submission deadline has been extended by <strong>24 hours</strong>. Please note that the platform will undergo a brief 30-minute maintenance tonight at 2:00 AM.
            </p>
          </div>
        </div>

        {/* Unread Notification: Event Update */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '20px', borderLeft: '4px solid var(--primary)', background: 'rgba(59, 130, 246, 0.05)' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '50%', height: 'fit-content' }}>
            <Calendar size={24} color="var(--primary)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Upcoming Workshop: Mastering AI APIs</h3>
              <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>New • 5 hours ago</span>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Join our exclusive workshop with Google Cloud engineers on integrating advanced AI APIs into your hackathon projects. The session starts tomorrow at 10:00 AM on Zoom. Link has been added to your Workspace resources.
            </p>
          </div>
        </div>

        {/* Read Notification: Mentor Message */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '20px', borderLeft: '4px solid transparent', opacity: 0.8 }}>
          <div style={{ background: 'var(--bg-hover)', padding: '12px', borderRadius: '50%', height: 'fit-content' }}>
            <MessageSquare size={24} color="var(--text-secondary)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>New message from Mentor Sarah</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>1 day ago</span>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              "Hi NullPointerException team! I've reviewed your initial Figma designs and left some comments regarding the user flow. Let's sync up this afternoon if you have time."
            </p>
          </div>
        </div>

        {/* Read Notification: System Status */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '20px', borderLeft: '4px solid transparent', opacity: 0.8 }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '50%', height: 'fit-content' }}>
            <CheckCircle size={24} color="var(--success)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Team Registration Approved</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>3 days ago</span>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Congratulations! Your team <strong>NullPointerException</strong> has been officially approved for the Spring Innovation Hackathon 2026. You can now access your Team Workspace.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Notifications;
