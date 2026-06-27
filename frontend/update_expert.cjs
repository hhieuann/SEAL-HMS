const fs = require('fs');

const filePath = 'src/pages/Auth/ExpertDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add import for apiClient
if (!content.includes("import apiClient")) {
  content = content.replace("import { eventService }", "import apiClient from '../../api/apiClient';\nimport { eventService }");
}

// Replace fetchEvents logic
const oldFetchEvents = `const response = await eventService.getAssignedEvents();
        const events = response.data || [];
        
        const dynamicAssignments = [];
        
        for (const evt of events) {`;

const newFetchEvents = `const [eventsRes, assignmentsRes] = await Promise.all([
          eventService.getAssignedEvents(),
          apiClient.get('/api/v1/users/me/assignments').catch(() => ({ data: { data: [] } }))
        ]);
        const events = eventsRes.data || [];
        const myAssignments = assignmentsRes.data?.data || [];
        
        const dynamicAssignments = [];
        
        for (const evt of events) {
          // Find all tracks for this event that the user is assigned to.
          // Wait, we don't have all tracks fetched here... But we do know the event.
          // We can fetch tracks for the event to map trackId to trackName.
          let eventTracks = [];
          try {
             const { trackService } = await import('../../api/trackService.js');
             const tr = await trackService.getTracksByEvent(evt.id);
             eventTracks = tr.data || [];
          } catch(e) {}
          
          // Filter my assignments that match this event's tracks
          const eventTrackIds = eventTracks.map(t => t.id);
          const myAssignmentsForEvent = myAssignments.filter(a => eventTrackIds.includes(a.trackId));
          
          if (myAssignmentsForEvent.length === 0) {
             // Fallback just in case
             myAssignmentsForEvent.push({ role: currentUser.roles.includes('Judge') ? 'JUDGE' : 'MENTOR', trackId: null });
          }

          for (const assignment of myAssignmentsForEvent) {
            const trackObj = eventTracks.find(t => t.id === assignment.trackId);
            const trackName = trackObj ? trackObj.name : 'All Tracks';
            const trackId = trackObj ? trackObj.id : null;
            const assignmentRole = assignment.role === 'JUDGE' ? 'Judge' : 'Mentor';
            
            // Only show cards for roles the user actually has
            if (!currentUser.roles.includes(assignmentRole)) continue;`;

content = content.replace(oldFetchEvents, newFetchEvents);

// Now fix the dynamicAssignments.push inside the loop
// Currently it's:
/*
          if (currentUser.roles.includes('Judge')) {
            dynamicAssignments.push({
              id: \`judge-\${evt.id}\`,
              eventId: evt.id,
              event: evt.name,
              role: 'Judge',
              track: 'General',
*/
const oldPushJudge = `          if (currentUser.roles.includes('Judge')) {
            dynamicAssignments.push({
              id: \`judge-\${evt.id}\`,
              eventId: evt.id,
              event: evt.name,
              role: 'Judge',
              track: 'General',
              path: '/judge/panel',`;

const newPushJudge = `          if (assignmentRole === 'Judge') {
            dynamicAssignments.push({
              id: \`judge-\${evt.id}-\${trackId || 'any'}\`,
              eventId: evt.id,
              event: evt.name,
              role: 'Judge',
              track: trackName,
              trackId: trackId,
              path: '/judge/panel',`;

content = content.replace(oldPushJudge, newPushJudge);

const oldPushMentor = `          if (currentUser.roles.includes('Mentor')) {
            dynamicAssignments.push({
              id: \`mentor-\${evt.id}\`,
              eventId: evt.id,
              event: evt.name,
              role: 'Mentor',
              track: 'General',
              path: '/mentor/tickets',`;

const newPushMentor = `          if (assignmentRole === 'Mentor') {
            dynamicAssignments.push({
              id: \`mentor-\${evt.id}-\${trackId || 'any'}\`,
              eventId: evt.id,
              event: evt.name,
              role: 'Mentor',
              track: trackName,
              trackId: trackId,
              path: '/mentor/tickets',`;

content = content.replace(oldPushMentor, newPushMentor);

// Close the inner loop
const oldCloseLoop = `          }
        }
        
        setAssignments(dynamicAssignments);`;
const newCloseLoop = `          }
        }
        
        setAssignments(dynamicAssignments);`;
// We need to add a closing brace for the inner loop. 
// Wait, the inner loop was `for (const assignment of myAssignmentsForEvent) {`
content = content.replace(`          if (assignmentRole === 'Mentor') {
            dynamicAssignments.push({
              id: \`mentor-\${evt.id}-\${trackId || 'any'}\`,
              eventId: evt.id,
              event: evt.name,
              role: 'Mentor',
              track: trackName,
              trackId: trackId,
              path: '/mentor/tickets',
              stats: { openTickets: '-', urgentTickets: '-', resolved: '-' },
              status: evt.status === 'CREATED' ? 'upcoming' : 'active'
            });
          }
        }`, `          if (assignmentRole === 'Mentor') {
            dynamicAssignments.push({
              id: \`mentor-\${evt.id}-\${trackId || 'any'}\`,
              eventId: evt.id,
              event: evt.name,
              role: 'Mentor',
              track: trackName,
              trackId: trackId,
              path: '/mentor/tickets',
              stats: { openTickets: '-', urgentTickets: '-', resolved: '-' },
              status: evt.status === 'CREATED' ? 'upcoming' : 'active'
            });
          }
          }
        }`);

fs.writeFileSync(filePath, content);
console.log('ExpertDashboard updated successfully');
