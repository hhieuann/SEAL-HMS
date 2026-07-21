const fs = require('fs');

const filePath = 'src/pages/Admin/TrackDraw.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update state declarations
content = content.replace(
  /const \[step, setStep\] = useState\(1\); \/\/ 1 = sub-topic draw, 2 = team assignment\n  const \[unassignedTeams, setUnassignedTeams\] = useState\(\[\]\);\n  const \[activeTeamsList, setActiveTeamsList\] = useState\(\[\]\);\n  const \[topicDrawn, setTopicDrawn\] = useState\(false\);/,
  `const [step, setStep] = useState(1); // 1 = team assignment, 2 = confirm\n  const [unassignedTeams, setUnassignedTeams] = useState([]);\n  const [activeTeamsList, setActiveTeamsList] = useState([]);`
);

// 2. Update fetchData logic
content = content.replace(
  /let realSubTopics = \[\];\n        try \{\n           const tracksRes = await trackService\.getTracksByEvent\(parsedEventId\);\n           const tracks = tracksRes\.data \|\| \[\];\n           const topicsPromises = tracks\.map\(t => trackService\.getTopicsByTrack\(t\.id\)\.then\(res => res\.data \|\| \[\]\)\);\n           const allTopics = await Promise\.all\(topicsPromises\);\n           realSubTopics = allTopics\.flat\(\);\n        \} catch \(e\) \{\n           console\.error\("Failed to load tracks\/topics", e\);\n        \}\n\n        if \(realSubTopics\.length === 0\) \{\n          setIsConfigured\(false\);\n          return;\n        \}/,
  `let realSubTopics = [];\n        let realTracks = [];\n        try {\n           const tracksRes = await trackService.getTracksByEvent(parsedEventId);\n           realTracks = tracksRes.data || [];\n        } catch (e) {\n           console.error("Failed to load tracks", e);\n        }\n\n        if (realTracks.length === 0) {\n          setIsConfigured(false);\n          return;\n        }\n\n        try {\n           const topicsPromises = realTracks.map(t => trackService.getTopicsByTrack(t.id).then(res => res.data || []));\n           const allTopics = await Promise.all(topicsPromises);\n           realSubTopics = allTopics.flat();\n        } catch (e) {}`
);

content = content.replace(
  /setTopicDrawn\(true\);\n            setTeamsAssigned\(true\);/,
  `setTeamsAssigned(true);`
);

content = content.replace(
  /const initTracks = realSubTopics\.map\(\(st, i\) => \(\{\n          id: `T\$\{i\}`, \n          name: `Track \$\{String\.fromCharCode\(65 \+ i\)\}`, \n          \.\.\.trackColors\[i % trackColors\.length\], \n          subTopic: null, \n          teams: \[\] \n        \}\)\);/,
  `const initTracks = realTracks.map((dbTrack, i) => {\n          const trackTopic = realSubTopics.find(st => st.trackId === dbTrack.id) || null;\n          return {\n            id: dbTrack.id, \n            name: dbTrack.name || \`Unnamed Track (ID: \${dbTrack.id})\`, \n            ...trackColors[i % trackColors.length], \n            subTopic: trackTopic, \n            teams: [] \n          };\n        });`
);

// 3. Remove topic draw functions
content = content.replace(
  /const handleDrawTopics = \(\) => \{[\s\S]*?const handleRedrawTopics = \(\) => \{[\s\S]*?\}\s*;\s*\/\//,
  `//`
);

// 4. Update handleConfirm
content = content.replace(
  /const handleConfirm = async \(\) => \{\n    if \(\!topicDrawn\) \{ triggerError\('Sub-topics have not been drawn for Tracks\.'\); return; \}\n    if \(\!teamsAssigned \|\| unassignedTeams\.length > 0\) \{ triggerError\('There are teams not assigned to a Track\.'\); return; \}\n    \n    setDrawing\(true\);\n    try \{\n      const targetEventId = eventId === 'seal-sp26' \? 1 : \(parseInt\(eventId\) \|\| 1\);\n      for \(const track of tracks\) \{\n        \/\/ 1\. Create track in DB\n        const trackPayload = \{ trackName: track\.name \};\n        let dbTrack;\n        try \{\n          const created = await trackService\.createTrack\(targetEventId, trackPayload\);\n          dbTrack = created\.data;\n        \} catch \(e\) \{\n          \/\/ If already exists or error, try fetching or skip gracefully for demo\n          const existing = await trackService\.getTracksByEvent\(eventId\);\n          dbTrack = existing\.data\?\.find\(t => t\.name === track\.name\);\n          if \(\!dbTrack\) throw e;\n        \}\n\n        \/\/ 2\. Assign teams to track in DB\n        if \(dbTrack && dbTrack\.id\) \{\n          track\.id = dbTrack\.id; \/\/ update client id\n          for \(const team of track\.teams\) \{\n            if \(team\.id\) \{\n              await teamService\.assignTrack\(team\.id, dbTrack\.id\);\n            \}\n          \}\n        \}\n      \}/,
  `const handleConfirm = async () => {\n    if (!teamsAssigned || unassignedTeams.length > 0) { triggerError('There are teams not assigned to a Track.'); return; }\n    \n    setDrawing(true);\n    try {\n      const targetEventId = eventId === 'seal-sp26' ? 1 : (parseInt(eventId) || 1);\n      for (const track of tracks) {\n        if (!track.id || track.id.toString().startsWith('T')) continue;\n        for (const team of track.teams) {\n          if (team.id) {\n            await teamService.assignTrack(team.id, track.id);\n          }\n        }\n      }`
);

content = content.replace(
  /triggerError\('Failed to save to database: ' \+ \(e\?\.response\?\.data\?\.message \|\| e\.message\)\);/,
  `let errMsg = e?.response?.data?.message || e.message;\n      if (errMsg.includes('still open') || errMsg.includes('registration first')) {\n         errMsg = "Cannot assign tracks while Event is PLANNED/UPCOMING. Please lock registration (change status to ONGOING) first.";\n      }\n      triggerError('Failed to save to database: ' + errMsg);`
);

// 5. Update reset draw
content = content.replace(
  /setTopicDrawn\(false\);\n    setTeamsAssigned\(false\);/,
  `setTeamsAssigned(false);`
);

// 6. Update step indicators
content = content.replace(
  /\{\[\n                \{ n: 1, label: 'Sub-topic Draw' \},\n                \{ n: 2, label: 'Team Assignment' \},\n                \{ n: 3, label: 'Confirm & Publish' \},\n              \]\.map/,
  `{[\n                { n: 1, label: 'Team Assignment' },\n                { n: 2, label: 'Confirm & Publish' },\n              ].map`
);
content = content.replace(
  /i === 2 \? '0 10px 10px 0'/g,
  `i === 1 ? '0 10px 10px 0'`
);
content = content.replace(
  /\(s\.n === 1 && topicDrawn\) \|\| \(s\.n === 2 && teamsAssigned\) \|\| \(s\.n === 3 && confirmed\)/g,
  `(s.n === 1 && teamsAssigned) || (s.n === 2 && confirmed)`
);
content = content.replace(
  /\{i < 2 && <div/g,
  `{i < 1 && <div`
);

// 7. Remove Step 1 UI completely
content = content.replace(
  /\{\/\* ── STEP 1: Sub-topic Draw ── \*\/\}\n      \{\!confirmed && step === 1 && \([\s\S]*?\{\/\* ── STEP 2: Team Assignment ── \*\/\}/,
  `{/* ── STEP 1: Team Assignment ── */}`
);

// 8. Change Step 2 UI to Step 1
content = content.replace(
  /\{\!confirmed && step === 2 && \(/,
  `{!confirmed && step === 1 && (`
);

content = content.replace(
  /onClick=\{\(\) => setStep\(3\)\}/,
  `onClick={() => setStep(2)}`
);

// 9. Change Step 3 UI to Step 2
content = content.replace(
  /\{\/\* ── STEP 3: Confirm ── \*\/\}\n      \{\(confirmed \|\| step === 3\) && \(/,
  `{/* ── STEP 2: Confirm ── */}\n      {(confirmed || step === 2) && (`
);

fs.writeFileSync(filePath, content);
console.log('Update complete!');
