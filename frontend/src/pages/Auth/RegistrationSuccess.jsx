import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const RegistrationSuccess = () => {
  return (
    <div className="auth-card glass-panel animate-fade-in" style={{ textAlign: 'center', padding: '48px 32px' }}>
      <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 24px' }} />
      <h2>Registration Successful!</h2>
      <p className="auth-subtitle" style={{ marginTop: '16px', lineHeight: '1.6' }}>
        Your account has been created successfully. <br/>
        Please wait for the administrator to approve your account before you can log in.
      </p>
      
      <div className="status-indicator" style={{ justifyContent: 'center', margin: '32px 0' }}>
        <span className="dot live" style={{ background: 'var(--warning)', boxShadow: '0 0 10px var(--warning)' }}></span> 
        Status: Pending Approval
      </div>

      <Link to="/" className="btn btn-secondary full-width">Return to Home</Link>
    </div>
  );
};

export default RegistrationSuccess;
