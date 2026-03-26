'use client'

import { useState, useRef, useEffect } from 'react'

// ─── Small reusable components ───────────────────────────────────────────────

function Spinner({ size = 4 }) {
  return (
    <svg className={`animate-spin h-${size} w-${size} shrink-0`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  )
}

function CharBar({ count, max = 3000 }) {
  const pct = Math.min((count / max) * 100, 100)
  const over = count > max
  return (
    <div className="mt-4 pt-4 border-t border-zinc-800/60">
      <div className="flex justify-between items-center mb-1.5">
        <span className={`text-xs tabular-nums ${over ? 'text-red-400' : 'text-zinc-600'}`}>
          {count.toLocaleString()} / {max.toLocaleString()} chars
        </span>
        {over && <span className="text-xs text-red-400 font-medium">Over limit</span>}
      </div>
      <div className="h-0.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            over ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-zinc-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function CopyButton({ text, label = 'Copy', className = '' }) {
  const [copied, setCopied] = useState(false)
  const handle = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handle}
      className={`text-xs px-3 py-1.5 rounded-md border transition-all duration-150 ${
        copied
          ? 'bg-zinc-700 border-zinc-600 text-zinc-300'
          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'
      } ${className}`}
    >
      {copied ? '✓ Copied' : label}
    </button>
  )
}

function Textarea({ label, sublabel, name, value, onChange, placeholder, rows = 3, required }) {
  return (
    <div>
      {label && (
        <label className="block mb-1.5">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">{label}</span>
          {sublabel && <span className="ml-2 normal-case text-xs font-normal text-zinc-600">{sublabel}</span>}
          {required && <span className="ml-1 text-zinc-600 text-xs">*</span>}
        </label>
      )}
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 resize-none text-sm leading-relaxed transition-colors"
      />
    </div>
  )
}

// ─── SUCCESs field definitions ────────────────────────────────────────────────

const SUCCESS_FIELDS = [
  { key: 'simple',     label: 'S — Simple',     sub: 'One core idea',          ph: "What's the single thing this post is about?" },
  { key: 'unexpected', label: 'U — Unexpected',  sub: 'Surprising angle',       ph: "What's the counterintuitive or surprising take?" },
  { key: 'concrete',   label: 'C — Concrete',    sub: 'Specific detail',        ph: 'A real number, scene, name, or moment' },
  { key: 'credible',   label: 'C — Credible',    sub: 'Why believe you',        ph: 'Your experience, data, or position that backs this up' },
  { key: 'emotional',  label: 'E — Emotional',   sub: 'Feeling to leave with',  ph: 'Inspired? Frustrated? Relieved? What do you want them to feel?' },
  { key: 'story',      label: 'S — Story',       sub: 'Mini arc',               ph: 'Start / change / end — even just 3 words each' },
]

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [form, setForm] = useState({
    background: '', hooks: '',
    simple: '', unexpected: '', concrete: '', credible: '', emotional: '', story: '',
  })
  const [autofilling, setAutofilling] = useState(false)
  const [autofillError, setAutofillError] = useState(null)

  const [post, setPost] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState(null)
  const [version, setVersion] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState('')

  const [carousel, setCarousel] = useState(null)
  const [carouselLoading, setCarouselLoading] = useState(false)
  const [carouselError, setCarouselError] = useState(null)

  const postRef = useRef(null)
  const carouselRef = useRef(null)

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  // ── Auto-fill SUCCESs ──────────────────────────────────────────────────────
  const handleAutofill = async () => {
    if (!form.background.trim()) return
    setAutofilling(true)
    setAutofillError(null)
    try {
      const res = await fetch('/api/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ background: form.background }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Autofill failed')
      setForm(prev => ({
        ...prev,
        simple:     data.simple     ?? prev.simple,
        unexpected: data.unexpected ?? prev.unexpected,
        concrete:   data.concrete   ?? prev.concrete,
        credible:   data.credible   ?? prev.credible,
        emotional:  data.emotional  ?? prev.emotional,
        story:      data.story      ?? prev.story,
      }))
    } catch (err) {
      setAutofillError(err.message)
    } finally {
      setAutofilling(false)
    }
  }

  // ── Generate post ──────────────────────────────────────────────────────────
  const handleGenerate = async (feedbackText = '') => {
    setGenerating(true)
    setGenerateError(null)
    setCarousel(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, feedback: feedbackText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setPost(data.post)
      setVersion(v => v + 1)
      setShowFeedback(false)
      setFeedback('')
    } catch (err) {
      setGenerateError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  // ── Create carousel ────────────────────────────────────────────────────────
  const handleCarousel = async () => {
    if (!post) return
    setCarouselLoading(true)
    setCarouselError(null)
    try {
      const res = await fetch('/api/carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Carousel failed')
      setCarousel(data.slides)
    } catch (err) {
      setCarouselError(err.message)
    } finally {
      setCarouselLoading(false)
    }
  }

  // ── Scroll into view when sections appear ─────────────────────────────────
  useEffect(() => {
    if (post && postRef.current) {
      setTimeout(() => postRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    }
  }, [version])

  useEffect(() => {
    if (carousel && carouselRef.current) {
      setTimeout(() => carouselRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    }
  }, [carousel])

  // ── Carousel copy text ─────────────────────────────────────────────────────
  const carouselCopyText = carousel
    ?.map((s, i) => `Slide ${i + 1}\n${s.headline}\n${s.body}`)
    .join('\n\n')

  const hasInput = form.background.trim().length > 0

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-3xl mx-auto px-5 py-16 space-y-12">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1.5">
            LinkedIn Post Builder
          </h1>
          <p className="text-zinc-500 text-sm">
            Add your inspiration, shape the message, generate the post.
          </p>
        </div>

        {/* ══ STEP 1: INPUT ══════════════════════════════════════════════════ */}
        <section className="space-y-6">
          <SectionDivider label="Step 1 — Input" />

          <Textarea
            label="Background Inspiration"
            required
            name="background"
            value={form.background}
            onChange={handleChange}
            placeholder="Paste articles, notes, observations, company posts — anything that sparked this idea."
            rows={5}
          />

          {/* Auto-fill button */}
          <div>
            <button
              type="button"
              onClick={handleAutofill}
              disabled={autofilling || !form.background.trim()}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {autofilling ? (
                <>
                  <Spinner size={3} />
                  Auto-filling SUCCESs fields…
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 1v6M8 1L5.5 3.5M8 1l2.5 2.5M3 8a5 5 0 1 0 10 0" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Auto-fill SUCCESs from inspiration
                </>
              )}
            </button>
            {autofillError && (
              <p className="mt-2 text-xs text-red-400">{autofillError}</p>
            )}
          </div>

          {/* SUCCESs fields */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-medium text-zinc-600 uppercase tracking-widest whitespace-nowrap">
                SUCCESs Framework
              </span>
              <div className="flex-1 h-px bg-zinc-800/60" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SUCCESS_FIELDS.map(({ key, label, sub, ph }) => (
                <div key={key}>
                  <label className="block mb-1.5">
                    <span className="text-xs font-medium text-zinc-400">{label}</span>
                    <span className="ml-2 text-xs text-zinc-600">{sub}</span>
                  </label>
                  <textarea
                    name={key}
                    value={form[key]}
                    onChange={handleChange}
                    placeholder={ph}
                    rows={2}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 resize-none text-sm leading-relaxed transition-colors"
                  />
                </div>
              ))}
            </div>

            {/* Hook ideas — lives here alongside SUCCESs fields */}
            <div className="mt-4">
              <label className="block mb-1.5">
                <span className="text-xs font-medium text-zinc-400">Hook Ideas</span>
                <span className="ml-2 text-xs text-zinc-600">optional — opening lines to draw from</span>
              </label>
              <textarea
                name="hooks"
                value={form.hooks}
                onChange={handleChange}
                placeholder="Lines you're thinking about for the opening..."
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 resize-none text-sm leading-relaxed transition-colors"
              />
            </div>
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !hasInput}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {generating && <Spinner size={4} />}
            {generating ? 'Generating…' : post ? 'Regenerate post' : 'Generate post'}
          </button>
          {generateError && (
            <p className="text-xs text-red-400 -mt-2">{generateError}</p>
          )}
        </section>

        {/* ══ STEP 2: POST ════════════════════════════════════════════════════ */}
        {post && (
          <section ref={postRef} className="space-y-4">
            <SectionDivider label={`Step 2 — Post${version > 1 ? ` (version ${version})` : ''}`} />

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">LinkedIn Post</span>
                <CopyButton text={post} />
              </div>
              <pre className="text-sm text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed">
                {post}
              </pre>
              <CharBar count={post.length} />
            </div>

            {/* Feedback + iterate */}
            {showFeedback ? (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-widest">
                  What should be different?
                </label>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="e.g. Make it shorter, lead with the statistic, more emotional..."
                  rows={2}
                  autoFocus
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 resize-none text-sm leading-relaxed transition-colors"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenerate(feedback)}
                    disabled={generating}
                    className="flex items-center gap-2 flex-1 justify-center py-2.5 text-sm bg-white text-black rounded-lg hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {generating ? <><Spinner size={3} /> Generating…</> : 'Regenerate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowFeedback(false); setFeedback('') }}
                    className="px-4 py-2.5 text-sm border border-zinc-800 text-zinc-600 rounded-lg hover:border-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowFeedback(true)}
                  disabled={generating}
                  className="flex items-center gap-2 flex-1 justify-center py-2.5 text-sm border border-zinc-700 text-zinc-300 rounded-lg hover:border-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ↺  New version
                </button>
                <button
                  type="button"
                  onClick={handleCarousel}
                  disabled={carouselLoading}
                  className="flex items-center gap-2 flex-1 justify-center py-2.5 text-sm border border-zinc-700 text-zinc-300 rounded-lg hover:border-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {carouselLoading ? <><Spinner size={3} /> Creating…</> : '⊞  Create carousel'}
                </button>
              </div>
            )}
            {carouselError && (
              <p className="text-xs text-red-400">{carouselError}</p>
            )}
          </section>
        )}

        {/* ══ STEP 3: CAROUSEL ════════════════════════════════════════════════ */}
        {carousel && (
          <section ref={carouselRef} className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                Step 3 — Carousel ({carousel.length} slides)
              </span>
              <div className="flex-1 h-px bg-zinc-800" />
              <CopyButton text={carouselCopyText} label="Copy all slides" />
            </div>

            {/* Horizontal scroll */}
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 snap-x snap-mandatory">
              {carousel.map((slide, i) => (
                <div
                  key={i}
                  className="flex-none w-64 snap-start bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-600 uppercase tracking-widest">
                      Slide {i + 1}
                    </span>
                    <CopyButton text={`Slide ${i + 1}\n${slide.headline}\n${slide.body}`} />
                  </div>
                  <p className="text-base font-semibold text-white leading-snug">
                    {slide.headline}
                  </p>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {slide.body}
                  </p>
                </div>
              ))}
            </div>

            {/* Regenerate carousel */}
            <button
              type="button"
              onClick={handleCarousel}
              disabled={carouselLoading}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm border border-zinc-800 text-zinc-600 rounded-lg hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {carouselLoading ? <><Spinner size={3} /> Regenerating…</> : '↺  New carousel'}
            </button>
          </section>
        )}

      </div>
    </main>
  )
}
