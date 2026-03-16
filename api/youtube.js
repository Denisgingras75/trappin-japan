// Vercel serverless function: extract audio URL from YouTube
// Uses cobalt.tools API (free, no auth needed)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'Missing url' })

  // Validate it's a YouTube URL
  const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[\w-]+/
  if (!ytRegex.test(url)) {
    return res.status(400).json({ error: 'Not a valid YouTube URL' })
  }

  try {
    const response = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        url,
        aFormat: 'mp3',
        isAudioOnly: true,
        filenamePattern: 'basic'
      })
    })

    const data = await response.json()

    if (data.status === 'stream' || data.status === 'redirect') {
      return res.status(200).json({ audioUrl: data.url })
    }

    if (data.status === 'error') {
      return res.status(400).json({ error: data.text || 'Failed to extract audio' })
    }

    return res.status(400).json({ error: 'Unexpected response from extraction service' })
  } catch (e) {
    return res.status(500).json({ error: 'Extraction service unavailable' })
  }
}
