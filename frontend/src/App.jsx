import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Forbidden403 from './pages/Auth/Forbidden403';
import AdminLayout from './layouts/AdminLayout';
import GlobalDashboard from './pages/Admin/GlobalDashboard';
import EventDashboard from './pages/Admin/EventDashboard';
import EventForm from './pages/Admin/EventForm';
import PerformingTeams from './pages/Admin/PerformingTeams';
import EventsConfig from './pages/Admin/EventsConfig';
import AccountManagement from './pages/Admin/AccountManagement';
import AssignmentMatrix from './pages/Admin/AssignmentMatrix';
import Courtroom from './pages/Admin/Courtroom';
import RoundTransition from './pages/Admin/RoundTransition';
import AnalyticsLog from './pages/Admin/AnalyticsLog';
import AdminBroadcast from './pages/Admin/AdminBroadcast';
import TrackDraw from './pages/Admin/TrackDraw';
import CriteriaManager from './pages/Admin/CriteriaManager';
import LandingPage from './pages/LandingPage';
import AuthLayout from './layouts/AuthLayout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import RegistrationSuccess from './pages/Auth/RegistrationSuccess';
import ExpertDashboard from './pages/Auth/ExpertDashboard';

import ParticipantLayout from './layouts/ParticipantLayout';
import EventSelection from './pages/Participant/EventSelection';
import TeamFormation from './pages/Participant/TeamFormation';
import TeamManagement from './pages/Participant/TeamManagement';
import Workspace from './pages/Participant/Workspace';
import MySubmission from './pages/Participant/MySubmission';
import Scores from './pages/Participant/Scores';
import Notifications from './pages/Participant/Notifications';
import ContactMentor from './pages/Participant/ContactMentor';
import FAQ from './pages/Participant/FAQ';
import EventArchive from './pages/Participant/EventArchive';

import JudgeLayout from './layouts/JudgeLayout';
import JudgePanel from './pages/Judge/JudgePanel';
import ScoringHistory from './pages/Judge/ScoringHistory';

import MentorLayout from './layouts/MentorLayout';
import MentorTickets from './pages/Mentor/MentorTickets';

function App() {
  useEffect(() => {
    const sealSettingsStr = localStorage.getItem('event_settings_seal_sp26');
    if (sealSettingsStr && (sealSettingsStr.includes('Sơ Loại') || sealSettingsStr.includes('Sự phù hợp') || sealSettingsStr.includes('Chất lượng Xử lý'))) {
      localStorage.removeItem('event_settings_seal_sp26');
      console.log('Cleared old Vietnamese settings from localStorage');
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        
        <Route path="/403" element={<Forbidden403 />} />

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/registration-success" element={<RegistrationSuccess />} />
        </Route>

        {/* Participant Routes */}
        <Route path="/participant" element={<ProtectedRoute allowedRoles={['STUDENT']}><ParticipantLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="events" replace />} />
          <Route path="events" element={<EventSelection />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="team-formation" element={<TeamFormation />} />
          <Route path="team-management" element={<TeamManagement />} />
          <Route path="workspace" element={<Workspace />} />
          <Route path="submission" element={<MySubmission />} />
          <Route path="scores" element={<Scores />} />
          <Route path="mentor" element={<ContactMentor />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="archive" element={<EventArchive />} />
        </Route>

        {/* Admin/Coordinator Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<GlobalDashboard />} />
          <Route path="events">
            <Route index element={<EventsConfig />} />
            <Route path="create" element={<EventForm />} />
            <Route path="edit/:eventId" element={<EventForm />} />
          </Route>
          <Route path="accounts" element={<AccountManagement />} />
          <Route path="activity-log" element={<AnalyticsLog />} />
          
          {/* Event-specific Admin Routes */}
          <Route path="event/:eventId">
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<EventDashboard />} />
            <Route path="teams" element={<PerformingTeams />} />
            <Route path="assignments" element={<AssignmentMatrix />} />
            <Route path="courtroom" element={<Courtroom />} />
            <Route path="transition" element={<RoundTransition />} />
            <Route path="analytics" element={<AnalyticsLog />} />
            <Route path="broadcast" element={<AdminBroadcast />} />
            <Route path="track-draw" element={<TrackDraw />} />
            <Route path="criteria" element={<CriteriaManager />} />
          </Route>
        </Route>

        {/* Judge Routes */}
        <Route path="/expert/dashboard" element={<ProtectedRoute allowedRoles={['JUDGE', 'MENTOR']}><ExpertDashboard /></ProtectedRoute>} />
        
        <Route path="/judge" element={<ProtectedRoute allowedRoles={['JUDGE']}><JudgeLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="panel" replace />} />
          <Route path="panel" element={<JudgePanel />} />
          <Route path="history" element={<ScoringHistory />} />
          <Route path="announcements" element={<Notifications />} />
        </Route>

        {/* Mentor Routes */}
        <Route path="/mentor" element={<ProtectedRoute allowedRoles={['MENTOR']}><MentorLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="tickets" replace />} />
          <Route path="tickets" element={<MentorTickets />} />
          <Route path="announcements" element={<Notifications />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
