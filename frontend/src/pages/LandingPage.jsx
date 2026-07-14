import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Anchor, ArrowRight, Users, Scale, LayoutTemplate } from 'lucide-react';
import './LandingPage.css';
import apiClient from '../api/apiClient';

const LandingPage = () => {
  const [events, setEvents] = useState([]);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    apiClient.get('/api/v1/events')
      .then(res => {
        const data = res.data?.data || res.data || [];
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Failed to fetch events", err));

    apiClient.get('/api/v1/accounts')
      .then(res => {
        const data = res.data?.data || res.data || [];
        setAccounts(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Failed to fetch accounts", err));
  }, []);

  const totalEvents = events.length;
  const totalParticipants = accounts.filter(a => a.role === 'STUDENT').length;
  const totalTeams = events.reduce((sum, e) => sum + (e.teams || 0), 0);
  const avgSubmissions = totalEvents > 0 ? Math.round(totalTeams / totalEvents) : 0;

  return (
    <div className="landing-container animate-fade-in">
      {/* Navigation */}
      <nav className="landing-nav glass-panel-nav">
        <div className="landing-logo">
          <Anchor size={24} className="text-primary" />
          <span className="logo-text">SEAL <span className="highlight">Hackathon</span></span>
        </div>
        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#events">Events</a>
          <a href="#sponsors">Sponsors</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="nav-actions">
          <Link to="/login" className="btn btn-secondary">Login</Link>
          <Link to="/register" className="btn btn-primary">Sign Up</Link>
        </div>
      </nav>

      <main className="landing-main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-text-block glass-panel">
              <h1 className="hero-title">SEAL — Streamlined Hackathon Management</h1>
              <p className="hero-subtitle">
                Run inclusive, fair, and scalable hackathons with powerful role controls, automated judging pipelines, and intuitive team management — all in one platform.
              </p>
              <div className="hero-buttons">
                <Link to="/register" className="btn btn-primary lg-btn">Register</Link>
                <Link to="#learn-more" className="btn btn-secondary lg-btn">Learn More</Link>
              </div>
              
              <div className="hero-tags">
                <span className="tag">Automated Judging</span>
                <span className="tag">Multi-role Support</span>
                <span className="tag">Team Management</span>
              </div>

              <div className="hero-stats">
                <div className="stat-box">
                  <span className="stat-label">Active events</span>
                  <span className="stat-num">{totalEvents}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Participants</span>
                  <span className="stat-num">{totalParticipants}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Average teams / event</span>
                  <span className="stat-num">{avgSubmissions}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-events glass-panel">
            <div className="events-header">
              <h3>Ongoing & Upcoming Events</h3>
              <span className="events-sub">Next 60 days</span>
            </div>
            
            <div className="event-list">
              {events.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No active events at the moment. Stay tuned!
                </div>
              ) : (
                events.slice(0, 4).map(event => {
                  const isLive = event.status?.toLowerCase() === 'live' || event.status?.toLowerCase() === 'ongoing';
                  const isUpcoming = event.status?.toLowerCase() === 'upcoming' || event.status?.toLowerCase() === 'planned';
                  const isCompleted = event.status?.toLowerCase() === 'completed';

                  return (
                    <div key={event.id} className={`event-item ${isLive ? 'active-event' : ''}`} style={isLive ? { border: '1px solid rgba(59, 130, 246, 0.4)', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', padding: '16px', marginBottom: '12px' } : {}}>
                      {!isLive && <div className="event-img bg-cyan" style={{ background: isUpcoming ? 'var(--warning)' : 'var(--bg-active)' }}></div>}
                      <div className="event-info" style={isLive ? { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 } : {}}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: isLive ? 0 : '4px' }}>
                          {isLive && <span className="status-badge live" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', animation: 'pulse 2s infinite' }}>Live Now</span>}
                          {!isLive && isUpcoming && <span className="status-badge open">Upcoming</span>}
                          {!isLive && isCompleted && <span className="status-badge app-only">Completed</span>}
                          {isLive && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ongoing Event</span>}
                        </div>
                        <h4 style={isLive ? { fontSize: '18px', margin: 0 } : {}}>{event.name}</h4>
                        <p style={isLive ? { margin: 0, fontSize: '13px', color: 'var(--text-secondary)' } : {}}>{event.type || 'Hackathon'}</p>
                      </div>
                      <div className="event-action" style={isLive ? { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' } : {}}>
                        <span className="time-left" style={isLive ? { color: 'var(--success)', fontWeight: '600' } : {}}>{isLive ? 'In Progress' : (isUpcoming ? 'Starts soon' : 'Ended')}</span>
                        {isLive ? (
                          <Link to="/participant/events" className="btn btn-primary sm-btn">Enter Event</Link>
                        ) : (
                          <Link to={isUpcoming ? "/register" : "/login"} className={isUpcoming ? "btn btn-primary sm-btn" : "btn btn-secondary sm-btn"}>{isUpcoming ? 'Register' : 'Details'}</Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {events.length > 4 && (
              <button className="btn btn-text full-width mt-4">View All Events <ArrowRight size={16}/></button>
            )}
          </div>
        </section>

        {/* Highlights Section */}
        <section className="highlights-section">
          <h2>Platform Highlights</h2>
          <div className="highlights-grid">
            <div className="highlight-card glass-panel">
              <div className="icon-wrapper"><Users size={24} className="text-primary"/></div>
              <h3>Multi-role Support</h3>
              <p className="card-desc">Fine-grained permissions for admins, organizers, judges, and participants with custom role templates.</p>
              <ul className="feature-list">
                <li>Custom role creation & invite flows</li>
                <li>Role-based dashboards and access</li>
                <li>Audit logs for activity tracking</li>
              </ul>
            </div>
            
            <div className="highlight-card glass-panel">
              <div className="icon-wrapper"><Scale size={24} className="text-primary"/></div>
              <h3>Automated Judging</h3>
              <p className="card-desc">Combine automated checks, peer review, and judge scoring with customizable rubrics and blind judging.</p>
              <ul className="feature-list">
                <li>Pluggable CI-style validators</li>
                <li>Rubrics, weights, and metadata</li>
                <li>Conflict-of-interest handling</li>
              </ul>
            </div>

            <div className="highlight-card glass-panel">
              <div className="icon-wrapper"><LayoutTemplate size={24} className="text-primary"/></div>
              <h3>Team Management</h3>
              <p className="card-desc">Seamless team creation, invites, merging, and role assignments with roster control for organizers.</p>
              <ul className="feature-list">
                <li>Invite links & approvals</li>
                <li>Sub-team support and mentors</li>
                <li>Project ownership and transfers</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="landing-footer glass-panel">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="landing-logo">
              <Anchor size={24} color="#3b82f6" />
              <span className="logo-text">SEAL <span className="highlight">Hackathon</span></span>
            </div>
            <p>Run better hackathons with streamlined workflows, reliable judging, and inclusive team features.</p>
          </div>
          <div className="footer-links">
            <div className="link-group">
              <h4>Product</h4>
              <a href="#">Events</a>
              <a href="#">Judging</a>
              <a href="#">Teams</a>
            </div>
            <div className="link-group">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 SEAL Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
