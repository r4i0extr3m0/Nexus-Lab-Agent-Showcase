import { useMemo } from 'react'

function pseudoRandom(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

export function Starfield() {
  const stars = useMemo(
    () =>
      Array.from({ length: 110 }, (_, index) => {
        const x = pseudoRandom(index + 1) * 100
        const y = pseudoRandom(index + 41) * 100
        const size = pseudoRandom(index + 97) * 1.8 + 0.6
        const delay = pseudoRandom(index + 17) * 5
        const duration = 2.4 + pseudoRandom(index + 7) * 3.6
        return { x, y, size, delay, duration, opacity: 0.25 + pseudoRandom(index + 23) * 0.5 }
      }),
    [],
  )

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 data-grid opacity-70" />
      <div className="absolute -left-40 -top-32 h-[440px] w-[440px] animate-drift rounded-full bg-aurora/20 blur-[130px]" />
      <div className="absolute -right-32 top-1/4 h-[400px] w-[400px] animate-drift rounded-full bg-pulse/15 blur-[140px] [animation-delay:2.4s]" />
      <div className="absolute bottom-[-15%] left-1/3 h-[380px] w-[380px] animate-drift rounded-full bg-aurora-deep/25 blur-[150px] [animation-delay:4s]" />
      {stars.map((star, index) => (
        <span
          key={index}
          className="absolute rounded-full bg-star animate-blink"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-void to-transparent" />
    </div>
  )
}
