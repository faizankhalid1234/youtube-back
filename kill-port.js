// Script to kill process using port 5000 (Windows)
const { exec } = require('child_process');
const PORT = process.env.PORT || 5000;

console.log(`🔍 Finding process using port ${PORT}...`);

// Windows command
exec(`netstat -ano | findstr :${PORT}`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error finding process:', error.message);
    console.log('\n💡 Try manually:');
    console.log(`   netstat -ano | findstr :${PORT}`);
    console.log(`   taskkill /PID <PID> /F`);
    return;
  }

  if (!stdout) {
    console.log(`✅ No process found using port ${PORT}`);
    return;
  }

  console.log('\n📋 Processes using port', PORT + ':');
  console.log(stdout);

  // Extract PID
  const lines = stdout.trim().split('\n');
  const pids = new Set();

  lines.forEach((line) => {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && !isNaN(pid)) {
      pids.add(pid);
    }
  });

  if (pids.size === 0) {
    console.log('⚠️  Could not extract PID. Please kill manually.');
    return;
  }

  console.log(`\n🛑 Killing ${pids.size} process(es)...`);

  pids.forEach((pid) => {
    exec(`taskkill /PID ${pid} /F`, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error killing PID ${pid}:`, error.message);
      } else {
        console.log(`✅ Killed process ${pid}`);
      }
    });
  });

  console.log('\n✅ Done! Try running the server again.');
});
