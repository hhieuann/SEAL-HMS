import React, { useState } from 'react';
import { Check, Info, Shield, BookOpen, ChevronDown } from 'lucide-react';

const events = ['SEAL Hackathon Spring 2026', 'Summer DevFest 2026', 'Winter Codefest 2025'];
const tracks = ['Track A - AI Agent', 'Track B - Medical RAG', 'Track C - EduTech'];
const people = [
  { id: 1, name: 'Alan Turing', avatar: 'https://ui-avatars.com/api/?name=Alan+Turing&background=f59e0b&color=fff' },
  { id: 2, name: 'Ada Lovelace', avatar: 'https://ui-avatars.com/api/?name=Ada+Lovelace&background=ec4899&color=fff' },
  { id: 3, name: 'Sarah Nguyen', avatar: 'https://ui-avatars.com/api/?name=Sarah+Nguyen&background=14b8a6&color=fff' },
  { id: 4, name: 'David Kim', avatar: 'https://ui-avatars.com/api/?name=David+Kim&background=8b5cf6&color=fff' },
  { id: 5, name: 'Dr. Pham Hung', avatar: 'https://ui-avatars.com/api/?name=Pham+Hung&background=3b82f6&color=fff' },
];

const AssignmentMatrix = () => {
  const [selectedEvent, setSelectedEvent] = useState(events[0]);
  
  const [judgeAssignments, setJudgeAssignments] = useState({
    1: { 'Track A - AI Agent': true },
    2: { 'Track C - EduTech': true },
    3: { 'Track B - Medical RAG': true } 
  });

  const [mentorAssignments, setMentorAssignments] = useState({
    3: { 'Track B - Medical RAG': true },
    4: { 'Track B - Medical RAG': true }
  });

  const toggleJudge = (pid, track) => {
    setJudgeAssignments(prev => ({
      ...prev,
      [pid]: { ...prev[pid], [track]: !(prev[pid] && prev[pid][track]) }
    }));
  };

  const toggleMentor = (pid, track) => {
    setMentorAssignments(prev => ({
      ...prev,
      [pid]: { ...prev[pid], [track]: !(prev[pid] && prev[pid][track]) }
    }));
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1>Mentors & Judges Assignment</h1>
          <p className="subtitle">Assign experts to specific tracks for the selected event.</p>
        </div>
        <div style={{ position: 'relative' }}>
          <select 
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="btn btn-secondary" 
            style={{ appearance: 'none', paddingRight: '36px', width: '320px', textAlign: 'left', fontWeight: '600' }}
          >
            {events.map(ev => <option key={ev} value={ev}>{ev}</option>)}
          </select>
          <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '32px', padding: '14px 20px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px' }}>
        <Info size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '1px' }} />
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
          You are configuring assignments for <strong style={{ color: 'white' }}>{selectedEvent}</strong>. 
          We have separated the tables to make dual-roles clear. If a person is assigned in the <strong style={{ color: '#f59e0b' }}>Judge Panel</strong>, they will have scoring access. If they are in the <strong style={{ color: '#14b8a6' }}>Mentor Panel</strong>, they will receive support tickets. A person can be both.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* JUDGES TABLE */}
        <div>
          <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#f59e0b' }}>
            <Shield size={20} /> Judge Assignments
          </h2>
          <div className="glass-panel" style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(245,158,11,0.05)' }}>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', width: '240px' }}>Expert Name</th>
                  {tracks.map(t => (
                    <th key={t} style={{ padding: '16px 20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {people.map((person) => (
                  <tr key={person.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'var(--transition)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={person.avatar} alt={person.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{person.name}</div>
                      </div>
                    </td>
                    {tracks.map(t => {
                      const isAssigned = judgeAssignments[person.id]?.[t];
                      return (
                        <td key={t} style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <div onClick={() => toggleJudge(person.id, t)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: `2px solid ${isAssigned ? '#f59e0b' : 'var(--border-color)'}`, background: isAssigned ? 'rgba(245,158,11,0.2)' : 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)' }}>
                            {isAssigned && <Check size={16} color="#f59e0b" />}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MENTORS TABLE */}
        <div>
          <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#14b8a6' }}>
            <BookOpen size={20} /> Mentor Assignments
          </h2>
          <div className="glass-panel" style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(20,184,166,0.05)' }}>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', width: '240px' }}>Expert Name</th>
                  {tracks.map(t => (
                    <th key={t} style={{ padding: '16px 20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {people.map((person) => (
                  <tr key={person.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'var(--transition)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={person.avatar} alt={person.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{person.name}</div>
                      </div>
                    </td>
                    {tracks.map(t => {
                      const isAssigned = mentorAssignments[person.id]?.[t];
                      return (
                        <td key={t} style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <div onClick={() => toggleMentor(person.id, t)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: `2px solid ${isAssigned ? '#14b8a6' : 'var(--border-color)'}`, background: isAssigned ? 'rgba(20,184,166,0.2)' : 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)' }}>
                            {isAssigned && <Check size={16} color="#14b8a6" />}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button className="btn btn-secondary">Discard Changes</button>
        <button className="btn btn-primary">Save Assignments</button>
      </div>
    </div>
  );
};

export default AssignmentMatrix;
