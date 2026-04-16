const runtimes = [
  { language: 'node', version: '18.15.0' },
  { language: 'typescript', version: '5.0.3' },
  { language: 'python', version: '3.10.0' },
  { language: 'c++', version: '10.2.0' },
  { language: 'java', version: '15.0.2' }, 
  { language: 'rust', version: '1.68.2' },
  { language: 'go', version: '1.16.2' },
  { language: 'bash', version: '5.2.0' }
];

async function installAll() {
  console.log("Installing Piston runtimes via API... This will take a few minutes.");
  
  for (const pkg of runtimes) {
    try {
      console.log(`Installing ${pkg.language} v${pkg.version}...`);
      const res = await fetch('http://localhost:2000/api/v2/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: pkg.language, version: pkg.version })
      });
      if (!res.ok) throw new Error(await res.text());
      console.log(`✅ Success: ${pkg.language} installed.`);
    } catch (err) {
      console.error(`❌ Failed to install ${pkg.language}:`, err.message);
    }
  }
  
  console.log("\nFetching installed runtimes to confirm:");
  const installed = await fetch('http://localhost:2000/api/v2/runtimes').then(res => res.json());
  console.log(installed.map(r => `${r.language}@${r.version}`).join(', '));
}

installAll();
