import { useState } from 'react'

const AVATAR_COLORS = [
  '#7c3aed', '#2563eb', '#059669', '#d97706',
  '#dc2626', '#0891b2', '#9333ea', '#db2777',
]

const DOMAIN_MAP = {
  'netflix':          'netflix.com',
  'spotify':          'spotify.com',
  'apple music':      'apple.com',
  'apple tv':         'apple.com',
  'apple tv+':        'apple.com',
  'icloud':           'icloud.com',
  'amazon':           'amazon.com',
  'amazon prime':     'amazon.com',
  'prime video':      'amazon.com',
  'prime':            'amazon.com',
  'youtube':          'youtube.com',
  'youtube premium':  'youtube.com',
  'google':           'google.com',
  'google one':       'google.com',
  'microsoft':        'microsoft.com',
  'microsoft 365':    'microsoft.com',
  'office 365':       'microsoft.com',
  'office':           'microsoft.com',
  'adobe':            'adobe.com',
  'adobe cc':         'adobe.com',
  'github':           'github.com',
  'slack':            'slack.com',
  'notion':           'notion.so',
  'figma':            'figma.com',
  'dropbox':          'dropbox.com',
  'hulu':             'hulu.com',
  'disney+':          'disneyplus.com',
  'disney plus':      'disneyplus.com',
  'disney':           'disneyplus.com',
  'hbo max':          'hbomax.com',
  'max':              'hbomax.com',
  'hbo':              'hbomax.com',
  'paramount+':       'paramountplus.com',
  'paramount plus':   'paramountplus.com',
  'paramount':        'paramountplus.com',
  'peacock':          'peacocktv.com',
  'twitch':           'twitch.tv',
  'cursor':           'cursor.com',
  'claude':           'anthropic.com',
  'chatgpt':          'openai.com',
  'openai':           'openai.com',
  'linear':           'linear.app',
  'vercel':           'vercel.com',
  'netlify':          'netlify.com',
  'heroku':           'heroku.com',
  'digitalocean':     'digitalocean.com',
  'github copilot':   'github.com',
}

function getDomain(name) {
  const lower = name.toLowerCase().trim()
  if (DOMAIN_MAP[lower]) return DOMAIN_MAP[lower]
  for (const [key, domain] of Object.entries(DOMAIN_MAP)) {
    if (lower.includes(key)) return domain
  }
  return null
}

export default function ServiceIcon({ name, size = 'md' }) {
  const [failed, setFailed] = useState(false)
  const domain = getDomain(name)
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
  const letter = name.charAt(0).toUpperCase()

  const dim = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'

  if (domain && !failed) {
    return (
      <img
        src={`https://logo.clearbit.com/${domain}`}
        alt={name}
        onError={() => setFailed(true)}
        className={`${dim} rounded-full object-cover shrink-0 bg-zinc-800`}
      />
    )
  }

  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center shrink-0 font-bold text-white`}
      style={{ background: color }}
    >
      {letter}
    </div>
  )
}
