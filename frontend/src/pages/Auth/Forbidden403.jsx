import { Link, useNavigate } from 'react-router-dom';
import { AlertOctagon, ArrowLeft } from 'lucide-react';

const Forbidden403 = () => {
  const navigate = useNavigate();
  
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-main)',
      color: 'var(--text-primary)',
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        padding: '60px 40px',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto'
        }}>
          <AlertOctagon size={40} color="#ef4444" />
        </div>
        
        <h1 style={{ fontSize: '36px', marginBottom: '12px', color: '#ef4444' }}>403 Forbidden</h1>
        <h2 style={{ fontSize: '20px', marginBottom: '24px', color: 'var(--text-secondary)' }}>Access Denied</h2>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.6' }}>
          You do not have the required permissions to view this page. If you believe this is an error, please contact the system administrator.
        </p>
        
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} /> Go Back
          </button>
          <Link to="/" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Forbidden403;
