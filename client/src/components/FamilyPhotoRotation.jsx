
import { useEffect, useState } from 'react'

const photos = [
  {
    src: '/images/stepping-stones-family.webp',
    desktop: 'center 48%',
    mobile: 'center 60%',
  },
  {
    src: '/images/stepping-stones-dad-lunch.webp',
    desktop: 'center 48%',
    mobile: 'center 53%',
  },
  {
    src: '/images/stepping-stones-grandfather-dishes.webp',
    desktop: 'center 45%',
    mobile: 'center 52%',
    scale: 1.15,
  },
]

export default function FamilyPhotoRotation() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const motionPreference = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    )

    if (motionPreference.matches) return undefined

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % photos.length)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="story-photo" aria-hidden="true">
      {photos.map((photo, index) => (
        <div
          key={photo.src}
          className={`story-photo-frame${
            index === activeIndex ? ' is-active' : ''
          }`}
          style={{
            '--photo-desktop-position': photo.desktop,
            '--photo-mobile-position': photo.mobile,
            '--photo-scale': photo.scale ?? 1,
          }}
        >
          <img
            src={photo.src}
            alt=""
            loading={index === 0 ? 'eager' : 'lazy'}
            fetchPriority={index === 0 ? 'high' : 'auto'}
          />
        </div>
      ))}
    </div>
  )
}
