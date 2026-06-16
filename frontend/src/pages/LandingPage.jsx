import React from 'react';
import { Link } from 'react-router-dom';
import { Anchor, ArrowRight, Users, Scale, LayoutTemplate } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
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
                  <span className="stat-num">12</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Participants</span>
                  <span className="stat-num">4,823</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Average submissions / event</span>
                  <span className="stat-num">186</span>
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
              <div className="event-item active-event" style={{ border: '1px solid rgba(59, 130, 246, 0.4)', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
                <div className="event-info" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="status-badge live" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', animation: 'pulse 2s infinite' }}>Live Now</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Qualifying Round</span>
                  </div>
                  <h4 style={{ fontSize: '18px', margin: 0 }}>SEAL Hackathon Spring 2026</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Apr 11 - Apr 12 • Offline • FPT University HCM</p>
                </div>
                <div className="event-action" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                  <span className="time-left" style={{ color: 'var(--success)', fontWeight: '600' }}>Qualifying Phase</span>
                  <Link to="/participant/events" className="btn btn-primary sm-btn">Enter Event</Link>
                </div>
              </div>

              <div className="event-item">
                <div className="event-img bg-cyan"></div>
                <div className="event-info">
                  <h4>Summer DevFest 2026</h4>
                  <p>Jul 1 - Jul 7 • FPT University HCM</p>
                  <span className="status-badge open">Open</span>
                </div>
                <div className="event-action">
                  <span className="time-left">Ends in 45d</span>
                  <Link to="/register" className="btn btn-primary sm-btn">Register</Link>
                </div>
              </div>
              
              <div className="event-item">
                <div className="event-img bg-purple"></div>
                <div className="event-info">
                  <h4>ByteWave University Cup</h4>
                  <p>June 2 • Onsite • FPT University Da Nang</p>
                  <span className="status-badge app-only">Applications</span>
                </div>
                <div className="event-action">
                  <span className="time-left">Starts in 19d</span>
                  <button className="btn btn-secondary sm-btn">Details</button>
                </div>
              </div>

              <div className="event-item">
                <div className="event-img bg-blue"></div>
                <div className="event-info">
                  <h4>Open Source Sprint</h4>
                  <p>July 8 • FPT University HN</p>
                  <span className="status-badge open">Open</span>
                </div>
                <div className="event-action">
                  <span className="time-left">Starts in 55d</span>
                  <Link to="/register" className="btn btn-primary sm-btn">Register</Link>
                </div>
              </div>
            </div>
            
            <button className="btn btn-text full-width mt-4">View All Events <ArrowRight size={16}/></button>
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
