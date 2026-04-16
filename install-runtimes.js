const PISTON_URL = 'http://localhost:2000/api/v2/packages'

const LANGUAGES = [
  'node',
  'typescript',
  'python',
  'go',
  'rust',
  'gcc',        // ← c++ is 'gcc' in Piston
  'java',
  'bash',
]

async function installAll() {
  console.log('🚀 Installing Piston language runtimes...\n')

  const res  = await fetch('http://localhost:2000/api/v2/packages')
  const pkgs = await res.json()

  // Safety check
  const list = Array.isArray(pkgs) ? pkgs : pkgs.packages ?? []
  console.log(`📋 Total packages found: ${list.length}`)

  for (const lang of LANGUAGES) {
    const filtered = list.filter(p => p.language === lang && p.language_version != null)

    if (filtered.length === 0) {
      console.log(`⚠️  ${lang} — not found, skipping`)
      continue
    }

    const match = filtered.sort((a, b) =>
      b.language_version.localeCompare(a.language_version)
    )[0]

    console.log(`📦 Installing ${match.language} ${match.language_version}...`)

    try {
      const install = await fetch(PISTON_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          language: match.language,
          version:  match.language_version,
        }),
      })
      const result = await install.json()
      console.log(`✅ ${result.language} ${result.version} installed`)
    } catch (err) {
      console.error(`❌ Failed to install ${lang}:`, err.message)
    }
  }

  console.log('\n✅ Done!')
}

installAll()