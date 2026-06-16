import React, { useState } from 'react';
import { Clock, Code, LayoutGrid, FileText, CheckCircle, AlertCircle, Video, AlignLeft, Mail, Layers } from 'lucide-react';
import './Workspace.css';

const MySubmission = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    projectName: 'Medical Knowledge RAG System',
    description: 'A domain-specific RAG system for medical literature that enables healthcare professionals to query complex medical knowledge bases with high accuracy. Built with LangGraph for agent orchestration and Pinecone for vector storage.',
    techStack: 'LangGraph, OpenAI SDK, Pinecone, FastAPI, React',
    contact: 'team@nullpointer.ai',
    repo: 'https://github.com/nullpointer/medical-rag',
    demo: 'https://medical-rag-demo.vercel.app',
    slides: 'https://www.canva.com/design/medical-rag-presentation/edit',
    video: 'https://youtube.com/watch?v=dQw4w9WgXcQ'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Unhappy Case Simulation
    if (formData.repo.includes('error') || formData.projectName.includes('error')) {
      setError('Invalid Repository URL. Please provide a valid public Github link.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }
    
    if (formData.repo.includes('drive.google.com')) {
      setError('Google Drive is not allowed for source code. Please use GitHub, Jira, Confluence, or Notion.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitted(true);
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>My Submission</h1>
          <p className="subtitle">Team: NullPointerException | Track B - Medical Knowledge RAG</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', background: isSubmitted ? 'rgba(16, 185, 129, 0.05)' : 'rgba(59, 130, 246, 0.05)', border: `1px solid ${isSubmitted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isSubmitted ? (
            <CheckCircle size={32} color="var(--success)" />
          ) : (
            <Clock size={32} color="var(--primary)" />
          )}
          <div>
            <h3 style={{ fontSize: '18px', marginBottom: '4px', color: isSubmitted ? 'var(--success)' : 'var(--text-primary)' }}>
              {isSubmitted ? 'Submission Received' : 'Awaiting Submission'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {isSubmitted ? 'You can still update your links before the deadline.' : 'Please provide all required links before the deadline.'}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Deadline</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--danger)' }}>12d : 08h : 45m</div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '24px' }}>Project Details</h2>
          
          {/* Error Message UI */}
          {error && (
            <div
              className={shaking ? 'shake' : ''}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px', marginBottom: '24px',
                animation: shaking ? 'shake 0.4s ease-in-out' : 'none',
              }}
            >
              <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>{error}</span>
            </div>
          )}
          
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-secondary)' }}>
              <FileText size={18} color="var(--text-primary)" /> Project Name *
            </label>
            <input 
              type="text" 
              className="task-input" 
              placeholder="e.g. Real-time Resource Forecasting" 
              value={formData.projectName}
              onChange={(e) => setFormData({...formData, projectName: e.target.value})}
              required 
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-secondary)' }}>
              <AlignLeft size={18} color="var(--text-primary)" /> Project Description *
            </label>
            <textarea 
              className="task-input" 
              placeholder="Briefly describe what your project does, how it works, and the problem it solves..." 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              style={{ minHeight: '120px', resize: 'vertical', paddingTop: '12px' }}
              required 
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-secondary)' }}>
              <Layers size={18} color="var(--text-primary)" /> Tech Stack *
            </label>
            <input 
              type="text" 
              className="task-input" 
              placeholder="e.g. Python, TensorFlow, Postgres, React" 
              value={formData.techStack}
              onChange={(e) => setFormData({...formData, techStack: e.target.value})}
              required 
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-secondary)' }}>
              <Mail size={18} color="var(--text-primary)" /> Primary Contact Email *
            </label>
            <input 
              type="email" 
              className="task-input" 
              placeholder="e.g. team@null.ai" 
              value={formData.contact}
              onChange={(e) => setFormData({...formData, contact: e.target.value})}
              required 
            />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '24px' }}>Project Links</h2>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-secondary)' }}>
              <Code size={18} color="var(--text-primary)" /> Source Code / Platform *
            </label>
            <div style={{ fontSize: '12px', color: 'var(--warning)', marginBottom: '8px' }}>Only GitHub, Jira, Confluence, and Notion are accepted. Personal Google Drive links are strictly prohibited.</div>
            <input 
              type="url" 
              className="task-input" 
              placeholder="https://github.com/..." 
              value={formData.repo}
              onChange={(e) => setFormData({...formData, repo: e.target.value})}
              required 
              style={error ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-secondary)' }}>
              <LayoutGrid size={18} color="var(--text-primary)" /> Live Demo URL (Optional)
            </label>
            <input 
              type="url" 
              className="task-input" 
              placeholder="https://your-project.vercel.app" 
              value={formData.demo}
              onChange={(e) => setFormData({...formData, demo: e.target.value})}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-secondary)' }}>
              <FileText size={18} color="var(--text-primary)" /> Presentation Slides *
            </label>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Live presentation via Slides is required (Canva, Google Slides, PowerPoint Online). PDF is not allowed.</div>
            <input 
              type="url" 
              className="task-input" 
              placeholder="Google Slides / Canva link" 
              value={formData.slides}
              onChange={(e) => setFormData({...formData, slides: e.target.value})}
              required 
            />
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : isSubmitted ? 'Update Submission' : 'Submit Project'}
            </button>
          </div>
        </div>
      </form>

      {isSubmitted && (
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <AlertCircle size={20} color="var(--warning)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            <strong style={{ color: 'var(--warning)' }}>Important:</strong> Make sure your Github repository is public or you have granted access to the judging panel. Demo links must remain active for at least 30 days after the event concludes.
          </p>
        </div>
      )}

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
  );
};

export default MySubmission;
