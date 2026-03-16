// Vercel serverless function: get YouTube video info for embedding
// Since audio extraction APIs are locked down, we embed the video
// and let users play it while recording

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'Missing url' })

  // Extract video ID
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]+)/,
    /(?:youtu\.be\/)([\w-]+)/,
    /(?:youtube\.com\/shorts\/)([\w-]+)/
  ]

  let videoId = null
  for (const p of patterns) {
    const m = url.match(p)
    if (m) { videoId = m[1]; break }
  }

  if (!videoId) return res.status(400).json({ error: 'Could not parse YouTube URL' })

  // Get video title from oEmbed (no API key needed)
  try {
    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
    const oembed = await oembedRes.json()

    return res.status(200).json({
      videoId,
      title: oembed.title || 'YouTube Beat',
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=0`
    })
  } catch (e) {
    return res.status(200).json({
      videoId,
      title: 'YouTube Beat',
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=0`
    })
  }
}
