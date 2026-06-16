import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Info, ShieldAlert, BookOpen, Terminal } from 'lucide-react';
import './Workspace.css';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      category: 'Hackathon Rules',
      icon: <ShieldAlert size={20} color="var(--danger)" />,
      items: [
        { q: 'Can I use code written before the hackathon?', a: 'No. All code for your project must be written during the hackathon period. You may use open-source libraries, frameworks, and publicly available APIs, but the core logic must be developed within the timeline.' },
        { q: 'How many members can be in a team?', a: 'Teams must consist of a minimum of 3 and a maximum of 5 members. All members must be registered on the SEAL platform.' },
        { q: 'Can we switch tracks after registering?', a: 'Yes, you can switch tracks up to 24 hours before the submission deadline by contacting the Coordinator through a support ticket.' }
      ]
    },
    {
      category: 'Submission Guidelines',
      icon: <BookOpen size={20} color="var(--warning)" />,
      items: [
        { q: 'What needs to be submitted?', a: 'You must provide a public GitHub/GitLab repository link, a presentation slide (Google Slides/Canva), and optionally a Live Demo URL.' },
        { q: 'Do we need to record a demo video?', a: 'A demo video (max 3 minutes) is highly recommended for the initial judging phase, especially if your live demo URL is unstable.' }
      ]
    },
    {
      category: 'Technical Support',
      icon: <Terminal size={20} color="var(--primary)" />,
      items: [
        { q: 'Is there a limit on API usage provided by sponsors?', a: 'Yes. If you are using the sponsored Google Cloud or OpenAI credits, there is a rate limit applied per team. Check the Resources tab in your Workspace for exact limits.' },
        { q: 'How do I contact a mentor?', a: 'Use the "Contact Mentor" tab in the sidebar to open a support ticket. Mentors are available from 8 AM to 10 PM daily.' }
      ]
    }
  ];

  return (
    <div className="animate-fade-in" style={{ padding: '0 20px', maxWidth: '900px', margin: '0 auto', paddingBottom: '60px' }}>
      <div className="page-header" style={{ marginBottom: '40px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', marginBottom: '16px' }}>
          <HelpCircle size={40} color="var(--primary)" />
        </div>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>FAQ & Rules</h1>
        <p className="subtitle">Everything you need to know about participating in the SEAL Hackathon.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {faqs.map((section, sIdx) => (
          <div key={sIdx} className="glass-panel" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              {section.icon} {section.category}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {section.items.map((item, iIdx) => {
                const index = `${sIdx}-${iIdx}`;
                const isOpen = openIndex === index;
                return (
                  <div key={index} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: isOpen ? 'var(--bg-subtle)' : 'transparent', transition: 'var(--transition)' }}>
                    <div 
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: '500' }}
                    >
                      <span>{item.q}</span>
                      {isOpen ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
                    </div>
                    {isOpen && (
                      <div style={{ padding: '0 20px 20px 20px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
