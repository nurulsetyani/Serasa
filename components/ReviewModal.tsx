'use client'

import { useState } from 'react'
import { Star, X } from 'lucide-react'
import { useLang } from '@/context/LanguageContext'

interface Props {
  orderId: string
  onClose: () => void
}

export default function ReviewModal({ orderId, onClose }: Props) {
  const { t } = useLang()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [review, setReview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    if (!rating) return
    setSubmitting(true)
    try {
      await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, rating, review }),
      })
      setDone(true)
      setTimeout(onClose, 2000)
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-obsidian-light border border-gold-border rounded-2xl p-6 animate-slide-up shadow-gold-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-muted hover:text-ink transition-colors"
        >
          <X size={18} />
        </button>

        {done ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">🌟</div>
            <h3 className="font-display text-gold text-xl font-bold">{t('thankYouReview')}</h3>
            <p className="text-ink-muted text-sm mt-2">{t('reviewSent')}</p>
          </div>
        ) : (
          <>
            <h2 className="font-display text-xl font-bold text-ink text-center mb-1">{t('thankYou')}</h2>
            <p className="text-ink-muted text-sm text-center mb-6">{t('rateExperience')}</p>

            {/* Stars */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={36}
                    className={`transition-colors ${
                      star <= (hovered || rating)
                        ? 'text-gold fill-gold'
                        : 'text-ink-faint'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Text review */}
            <textarea
              value={review}
              onChange={e => setReview(e.target.value)}
              placeholder={t('writeReview')}
              rows={3}
              className="input-dark w-full px-4 py-3 text-sm resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="btn-ghost flex-1 py-3 text-sm"
              >
                {t('skipReview')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!rating || submitting}
                className="btn-gold flex-1 py-3 text-sm"
              >
                {submitting ? '...' : t('submitReview')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
