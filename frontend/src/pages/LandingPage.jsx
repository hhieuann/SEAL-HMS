import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Anchor, ArrowRight, Users, Scale, LayoutTemplate, MapPin, Phone, Mail } from 'lucide-react';
import './LandingPage.css';
import apiClient from '../api/apiClient';

const LandingPage = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Public page: only the public events endpoint — never account data.
    apiClient.get('/api/v1/events')
      .then(res => {
        const data = res.data?.data || res.data || [];
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Failed to fetch events", err));
  }, []);

  const totalEvents = events.length;
  const totalTeams = events.reduce((sum, e) => sum + (e.currentTeams || 0), 0);
  const avgTeamsPerEvent = totalEvents > 0 ? Math.round(totalTeams / totalEvents) : 0;

  // Compute date range label from actual event dates
  const eventDateLabel = (() => {
    if (events.length === 0) return 'Upcoming';
    const dates = events
      .map(e => e.endDate ? new Date(e.endDate) : null)
      .filter(Boolean);
    if (dates.length === 0) return 'Upcoming';
    const maxDate = new Date(Math.max(...dates));
    const now = new Date();
    const diffDays = Math.ceil((maxDate - now) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `Next ${diffDays} days` : 'See all events';
  })();

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="landing-container animate-fade-in">
      {/* Navigation */}
      <nav className="landing-nav glass-panel-nav">
        <div className="landing-logo">
          <img src="/src/assets/FptLogo.png" alt="FPT" style={{ height: '100px', objectFit: 'contain', marginRight: '16px' }} />
          <Anchor size={24} className="text-primary" />
          <span className="logo-text">SEAL <span className="highlight">Hackathon</span></span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#events">Events</a>
          <a href="#contact">Contact</a>
          <a href="/register">Join Now</a>
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
                <a href="#features" className="btn btn-secondary lg-btn">Learn More</a>
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
                  <span className="stat-label">Teams competing</span>
                  <span className="stat-num">{totalTeams}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Average teams / event</span>
                  <span className="stat-num">{avgTeamsPerEvent}</span>
                </div>
              </div>
            </div>
          </div>

          <div id="events" className="hero-events glass-panel">
            <div className="events-header">
              <h3>Ongoing & Upcoming Events</h3>
              <span className="events-sub">{eventDateLabel}</span>
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
                        <span className="time-left" style={isLive ? { color: 'var(--success)', fontWeight: '600' } : {}}>
                          {isLive
                            ? `Ends ${formatDate(event.endDate)}`
                            : isUpcoming
                            ? `Starts ${formatDate(event.startDate)}`
                            : `Ended ${formatDate(event.endDate)}`
                          }
                        </span>
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
        <section id="features" className="highlights-section">
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
      <footer id="contact" className="landing-footer glass-panel">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="landing-logo">
              <Anchor size={24} color="#3b82f6" />
              <span className="logo-text">SEAL <span className="highlight">Hackathon</span></span>
            </div>
            <p>Run better hackathons with streamlined workflows, reliable judging, and inclusive team features.</p>
          </div>
          <div className="footer-contact-info">
            <h4>Đại học FPT - Campus TP. Hồ Chí Minh</h4>
            <div className="contact-item">
              <MapPin size={18} />
              <span>Lô E2a-7, Đường D1, Khu Công nghệ cao, Phường Tăng Nhơn Phú, TP. Hồ Chí Minh</span>
            </div>
            <div className="contact-item">
              <Phone size={18} />
              <span>(028) 7300 5588</span>
            </div>
            <div className="contact-item">
              <Mail size={18} />
              <a href="mailto:tuyensinhhcm@fpt.edu.vn">tuyensinhhcm@fpt.edu.vn</a>
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
