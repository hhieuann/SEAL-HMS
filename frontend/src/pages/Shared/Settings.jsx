import { useState, useEffect, useCallback } from 'react';
import { User, Lock, AlertCircle, CheckCircle, Save } from 'lucide-react';
import { profileApi } from '../../api/profileApi';
import { authApi } from '../../api/auth';
import './Settings.css';

const Settings = () => {
  const [role] = useState(localStorage.getItem('userRole') || '');
  
  // Profile State
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    campus: '',
    studentCode: '',
    fullName: '',
    department: '',
    phone: '',
    email: ''
  });
  // Kept only as a setter: the loaded profile is stored for future dirty-checking,
  // the form itself always renders from `profile`.
  const [, setInitialProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Security State
  const [security, setSecurity] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [securitySaving, setSecuritySaving] = useState(false);
  const [securityMessage, setSecurityMessage] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      let data = null;
      if (role === 'STUDENT') {
        const res = await profileApi.getStudentProfile();
        data = res.data?.data || res.data;
      } else if (['LECTURER', 'JUDGE', 'MENTOR', 'GUEST_JUDGE'].includes(role)) {
        const res = await profileApi.getLecturerProfile();
        data = res.data?.data || res.data;
      } else if (role === 'STAFF') {
        const res = await profileApi.getStaffProfile();
        data = res.data?.data || res.data;
      }
      
      if (data) {
        const profileData = {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          campus: data.campus || '',
          studentCode: data.studentCode || '',
          fullName: data.fullName || '',
          department: data.department || '',
          phone: data.phone || '',
          email: data.email || localStorage.getItem('userEmail') || '',
          avatarUrl: data.avatarUrl || ''
        };
        setProfile(profileData);
        setInitialProfile(profileData);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
      // Fallback to local storage data if API fails or is not implemented yet
      const fallbackEmail = localStorage.getItem('userEmail') || '';
      let fallbackName = '';
      try {
        const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        fallbackName = storedUser.name || '';
      } catch { /* ignored on purpose */ }
      
      if (!fallbackName && fallbackEmail) {
        fallbackName = fallbackEmail.split('@')[0];
      }
      if (!fallbackName) {
        fallbackName = role === 'STUDENT' ? 'Student User' : 'Lecturer User';
      }

      const nameParts = fallbackName.trim().split(/\s+/);
      const fName = nameParts[0];
      const lName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

      const profileData = {
        firstName: fName,
        lastName: lName,
        campus: '',
        studentCode: '',
        fullName: fallbackName,
        department: '',
        phone: '',
        email: fallbackEmail,
        avatarUrl: ''
      };
      setProfile(profileData);
      setInitialProfile(profileData);

      if (err.response?.status !== 404) {
        setProfileMessage({ type: 'error', text: 'Could not load profile data from server.' });
      }
    } finally {
      setProfileLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Just set it for preview, wait for Save Changes to upload
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setSecurity(prev => ({ ...prev, [name]: value }));
  };

  const validateStudentCode = (code) => {
    return /^SE\d{6}$/i.test(code);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage(null);
    
    if (role === 'STUDENT' && !validateStudentCode(profile.studentCode)) {
      setProfileMessage({ type: 'error', text: 'Student ID must be in format SEXXXXXX (e.g. SE204911).' });
      return;
    }

    const isConfirmed = window.confirm("Are you sure you want to save these changes?");
    if (!isConfirmed) return;

    try {
      setProfileSaving(true);
      
      let finalAvatarUrl = profile.avatarUrl;
      if (avatarFile) {
        const res = await profileApi.uploadAvatar(avatarFile);
        finalAvatarUrl = res.data.data;
        setProfile(prev => ({ ...prev, avatarUrl: finalAvatarUrl }));
      }

      if (role === 'STUDENT') {
        await profileApi.updateStudentProfile(profile);
      } else if (['LECTURER', 'JUDGE', 'MENTOR', 'GUEST_JUDGE'].includes(role)) {
        await profileApi.updateLecturerProfile(profile);
      } else if (role === 'STAFF') {
        await profileApi.updateStaffProfile(profile);
      }
      
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
      setInitialProfile(profile);
      setAvatarFile(null);
      setAvatarPreview(null);
      
      const newName = role === 'STUDENT' ? `${profile.firstName} ${profile.lastName}`.trim() : profile.fullName;
      try {
        const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        storedUser.name = newName;
        if (finalAvatarUrl) storedUser.avatarUrl = finalAvatarUrl;
        localStorage.setItem('currentUser', JSON.stringify(storedUser));
        window.dispatchEvent(new Event('participant_state_updated'));
      } catch { /* ignored on purpose */ }

    } catch (err) {
      if (err.response?.status === 404) {
        setProfileMessage({ type: 'success', text: 'Profile updated locally! (Backend API not ready)' });
        setInitialProfile(profile);
        const newName = role === 'STUDENT' ? `${profile.firstName} ${profile.lastName}`.trim() : profile.fullName;
        try {
          const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
          storedUser.name = newName;
          localStorage.setItem('currentUser', JSON.stringify(storedUser));
          window.dispatchEvent(new Event('participant_state_updated'));
        } catch { /* ignored on purpose */ }
      } else {
        const msg = err.response?.data?.message || 'Failed to update profile. Please try again.';
        setProfileMessage({ type: 'error', text: msg });
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setSecurityMessage(null);

    if (security.newPassword !== security.confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    
    if (security.newPassword.length < 6) {
      setSecurityMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    try {
      setSecuritySaving(true);
      await authApi.changePassword(security.oldPassword, security.newPassword);
      setSecurityMessage({ type: 'success', text: 'Password changed successfully!' });
      setSecurity({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password. Please check your old password.';
      setSecurityMessage({ type: 'error', text: msg });
    } finally {
      setSecuritySaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="settings-page" style={{ padding: '24px' }}>
        <div className="settings-header">
          <h2>My Settings</h2>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="settings-header" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '8px' }}>My Settings</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your account profile and security preferences.</p>
      </div>

      {/* PROFILE SECTION */}
      <div className="settings-card" style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
          <User size={24} color="var(--primary)" />
          <h3 style={{ margin: 0, fontSize: '18px' }}>Profile Information</h3>
        </div>

        {profileMessage && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', background: profileMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: profileMessage.type === 'error' ? '#ef4444' : '#22c55e' }}>
            {profileMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{profileMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
            <div style={{ position: 'relative' }}>
              <img 
                src={avatarPreview || (profile.avatarUrl ? `${import.meta.env.VITE_API_BASE_URL || ''}${profile.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName || profile.email || 'User')}&background=random`)} 
                alt="Profile Avatar" 
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }}
              />
              <label 
                htmlFor="avatar-upload" 
                style={{ position: 'absolute', bottom: -5, right: -5, background: 'var(--primary)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid white' }}
                title="Change Avatar"
              >
                <User size={14} />
              </label>
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleAvatarChange} 
              />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>Profile Picture</h4>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>JPG, GIF or PNG. Max size of 800K</p>
            </div>
          </div>

          {role === 'STUDENT' ? (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Email Address</label>
                <input type="email" name="email" value={profile.email} onChange={handleProfileChange} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>First Name</label>
                  <input type="text" name="firstName" value={profile.firstName} onChange={handleProfileChange} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Last Name</label>
                  <input type="text" name="lastName" value={profile.lastName} onChange={handleProfileChange} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Student ID</label>
                  <input type="text" name="studentCode" value={profile.studentCode} onChange={handleProfileChange} required placeholder="e.g. SE204911" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Campus</label>
                  <select name="campus" value={profile.campus} onChange={handleProfileChange} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'white' }}>
                    <option value="" disabled>Select Campus</option>
                    <option value="Hanoi">Hanoi (Hoa Lac)</option>
                    <option value="Ho Chi Minh">Ho Chi Minh</option>
                    <option value="Da Nang">Da Nang</option>
                    <option value="Can Tho">Can Tho</option>
                    <option value="Quy Nhon">Quy Nhon</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Email Address</label>
                <input type="email" name="email" value={profile.email} onChange={handleProfileChange} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Full Name</label>
                  <input type="text" name="fullName" value={profile.fullName} onChange={handleProfileChange} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Department</label>
                  <input type="text" name="department" value={profile.department} onChange={handleProfileChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Phone</label>
                  <input type="text" name="phone" value={profile.phone} onChange={handleProfileChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Campus</label>
                  <select name="campus" value={profile.campus} onChange={handleProfileChange} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'white' }}>
                    <option value="" disabled>Select Campus</option>
                    <option value="Hanoi">Hanoi</option>
                    <option value="Ho Chi Minh">Ho Chi Minh</option>
                    <option value="Da Nang">Da Nang</option>
                    <option value="Can Tho">Can Tho</option>
                    <option value="Quy Nhon">Quy Nhon</option>
                  </select>
                </div>
              </div>
            </>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={profileSaving} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', opacity: profileSaving ? 0.7 : 1 }}>
              <Save size={18} />
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* SECURITY SECTION */}
      <div className="settings-card" style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
          <Lock size={24} color="#ef4444" />
          <h3 style={{ margin: 0, fontSize: '18px' }}>Security & Password</h3>
        </div>

        {securityMessage && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', background: securityMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: securityMessage.type === 'error' ? '#ef4444' : '#22c55e' }}>
            {securityMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{securityMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSecuritySubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Current Password</label>
            <input type="password" name="oldPassword" value={security.oldPassword} onChange={handleSecurityChange} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>New Password</label>
              <input type="password" name="newPassword" value={security.newPassword} onChange={handleSecurityChange} required minLength="6" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Confirm New Password</label>
              <input type="password" name="confirmPassword" value={security.confirmPassword} onChange={handleSecurityChange} required minLength="6" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={securitySaving} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ef4444', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', opacity: securitySaving ? 0.7 : 1 }}>
              <Lock size={18} />
              {securitySaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default Settings;
