const fs = require('fs');

const filePath = 'src/pages/Admin/EventForm.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update load logic to use getTopicsByEvent
content = content.replace(
  /const allTopics = await Promise\.all\(tracks\.map\(t => trackService\.getTopicsByTrack\(t\.id\)\.then\(r => r\.data \|\| \[\]\)\)\);\n        const subTopics = allTopics\.flat\(\)\.map\(\(t, i\) => \(\{ id: t\.id \|\| i, name: t\.name, desc: t\.description \}\)\);/,
  `const topicsRes = await trackService.getTopicsByEvent(eventId);\n        const subTopics = (topicsRes.data || []).map((t, i) => ({ id: t.id || i, name: t.name, desc: t.description }));`
);

// Update save logic for isEditMode
content = content.replace(
  /const tr = await trackService\.getTracksByEvent\(eventId\);\n        let gt = tr\.data\?\.find\(t => t\.name === 'General Track'\);\n        if \(\!gt\) \{ const nt = await trackService\.createTrack\(eventId, \{ name: 'General Track', description: 'Default' \}\); gt = nt\.data; \}\n        if \(gt\?\.id\) \{\n          const ctids = formData\.subTopics\.map\(t => t\.id\);\n          for \(const it of initialTopics\) \{ if \(\!ctids\.includes\(it\.id\)\) \{ try \{ await trackService\.deleteTopic\(it\.id\); \} catch\(e\) \{ console\.error\(e\); \} \} \}\n          for \(const ft of formData\.subTopics\) \{\n            if \(ft\.id && ft\.id < 1000000000\) \{ try \{ await trackService\.updateTopic\(ft\.id, \{ name: ft\.name, description: ft\.desc \}\); \} catch\(e\) \{ console\.error\(e\); \} \}\n            else \{ try \{ await trackService\.createTopic\(gt\.id, \{ name: ft\.name, description: ft\.desc \}\); \} catch\(e\) \{ console\.error\(e\); \} \}\n          \}\n        \}/,
  `const ctids = formData.subTopics.map(t => t.id);\n        for (const it of initialTopics) { if (!ctids.includes(it.id)) { try { await trackService.deleteTopic(it.id); } catch(e) { console.error(e); } } }\n        for (const ft of formData.subTopics) {\n          if (ft.id && ft.id < 1000000000) { try { await trackService.updateTopic(ft.id, { name: ft.name, description: ft.desc }); } catch(e) { console.error(e); } }\n          else { try { await trackService.createTopicByEvent(eventId, { name: ft.name, description: ft.desc }); } catch(e) { console.error(e); } }\n        }`
);

// Update save logic for non edit mode (create mode)
content = content.replace(
  /if \(formData\.subTopics\?\.length > 0\) \{\n          try \{\n            const tr2 = await trackService\.getTracksByEvent\(savedId\);\n            let gt2 = tr2\.data\?\.find\(t => t\.name === 'General Track'\);\n            if \(\!gt2\) \{ const nt2 = await trackService\.createTrack\(savedId, \{ name: 'General Track', description: 'Default' \}\); gt2 = nt2\.data; \}\n            if \(gt2\?\.id\) for \(const topic of formData\.subTopics\) await trackService\.createTopic\(gt2\.id, \{ name: topic\.name, description: topic\.desc \}\);\n          \} catch\(e\) \{ console\.error\(e\); \}/,
  `if (formData.subTopics?.length > 0) {\n          try {\n            for (const topic of formData.subTopics) await trackService.createTopicByEvent(savedId, { name: topic.name, description: topic.desc });\n          } catch(e) { console.error(e); }`
);

fs.writeFileSync(filePath, content);
console.log('EventForm updated!');
