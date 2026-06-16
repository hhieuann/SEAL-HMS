const fs = require('fs');
const layouts = ['ParticipantLayout.css', 'JudgeLayout.css', 'MentorLayout.css'];

layouts.forEach(l => {
  const file = './src/layouts/' + l;
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('.fpt-topbar')) {
    content = content.replace(
      /.app-container {\s+display: flex;\s+height: 100vh;\s+}/g,
      `.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.fpt-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  background: var(--primary);
  box-shadow: 0 4px 12px rgba(242, 111, 33, 0.2);
  z-index: 50;
  color: white;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}`
    );

    // Remove .sidebar-header
    content = content.replace(/\.sidebar-header {[\s\S]*?}/g, '');

    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated CSS: ' + l);
  }
});
