export default function YouTubePlayer({ videoId, small }) {
  return (
    <div style={{
      width: '100%',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      aspectRatio: small ? '16/5' : '16/9',
      background: 'var(--color-bg)'
    }}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
        style={{ width: '100%', height: '100%', border: 'none' }}
        allow="autoplay; encrypted-media"
        allowFullScreen
      />
    </div>
  )
}
