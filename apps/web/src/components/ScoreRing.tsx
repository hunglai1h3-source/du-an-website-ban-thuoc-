import { scoreColor } from '../services/score'

export function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const color = scoreColor(score)
  return (
    <div
      className="score-ring"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} ${score * 3.6}deg, #e8edf2 0deg)`,
      }}
      aria-label={`Điểm tin cậy ${score} trên 100`}
    >
      <div className="score-ring-inner"><strong>{score}</strong><small>/100</small></div>
    </div>
  )
}
