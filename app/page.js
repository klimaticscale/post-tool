'use client'

import { useState } from 'react'

const SUCCESS_FIELDS = [
  {
    key: 'simple',
    label: 'S — Simple',
    sublabel: 'One core idea',
    placeholder: "What's the single thing this post is about?",
  },
  {
    key: 'unexpected',
    label: 'U — Unexpected',
    sublabel: 'Surprising angle',
    placeholder: "What's the counterintuitive or surprising take?",
  },
  {
    key: 'concrete',
    label: 'C — Concrete',
    sublabel: 'Specific detail or moment',
    placeholder: 'A real number, scene, name, or moment',
  },
  {
    key: 'credible',
    label: 'C — Credible',
    sublabel: 'Why believe you',
    placeholder: 'Your experience, data, or position that backs this up',
  },
  {
    key: 'emotional',
    label: 'E — Emotional',
    sublabel: 'Feeling to leave with',
    placeholder: 'Inspired? Frustrated? Relieved? What do you want them to feel?',
  },
  {
    key: 'story',
    label: 'S — Story',
    sublabel: 'Mini arc',
    placeholder: 'Start / change / end — even just 3 words each',
  },
]

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

function CharBar({ count, max = 3000 }) {
  const pct = Math.min((count / max) * 100, 100)
  const over = count > max
  return (
    <div className="mt-4 pt-4 border-t border-zinc-800">
      <div className="flex justify-between items-center mb-1.5">
        <span className={`text-xs ${over ? 'text-red-400' : 'text-zinc-600'}`}>
          {count.toLocaleString()} / {max.toLocaleString()} characters
        </span>
        {over && <span className="text-xs text-red-400">Over limit</span>}
      </div>
      <div className="h-0.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${over ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-zinc-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function PostCard({ label, content, onCopy, copied }) {
  return (
    <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">{label}</span>
        <button
          onClick={onCopy}
          className={`text-xs px-3 py-1.5 rounded-md border transition-all duration-150 ${
            copied
              ? 'bg-zinc-700 border-zinc-600 text-zinc-300'
              : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'
          }`}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="flex-1 text-sm text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed">
        {content}
      </pre>
      <CharBar count={content?.length ?? 0} />
    </div>
  )
}

export default function Home() {
  const [form, setForm] = useState({
    background: '',
    hooks: '',
    simple: '',
    unexpected: '',
    concrete: '',
    credible: '',
    emotional: '',
    story: '',
  })
  const [posts, setPosts] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState({ post1: false, post2: false })

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setPosts(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setPosts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (key) => {
    await navigator.clipboard.writeText(posts[key])
    setCopied((prev) => ({ ...prev, [key]: true }))
    setTimeout(() => setCopied((prev) => ({ ...prev, [key]: false })), 2000)
  }

  const hasInput = form.background.trim().length > 0

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-5xl mx-auto px-5 py-16">

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1.5">
            LinkedIn Post Builder
          </h1>
          <p className="text-zinc-500 text-sm">
            Fill in what you know. Get two AI-written variations — one personal, one bold.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">

          {/* Background */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-widest mb-2">
              Background Inspiration
            </label>
            <textarea
              name="background"
              value={form.background}
              onChange={handleChange}
              placeholder="Paste articles, notes, observations, company posts — anything that sparked this idea. The more context, the better."
              rows={6}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 resize-none text-sm leading-relaxed transition-colors"
            />
          </div>

          {/* Hooks */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1">
              Hook Ideas
              <span className="ml-2 normal-case font-normal text-zinc-600">optional</span>
            </label>
            <p className="text-xs text-zinc-600 mb-2">Lines you're already thinking about for the opening</p>
            <textarea
              name="hooks"
              value={form.hooks}
              onChange={handleChange}
              placeholder="e.g. &quot;Nobody talks about the part where you almost quit.&quot;"
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 resize-none text-sm leading-relaxed transition-colors"
            />
          </div>

          {/* SUCCESs */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest whitespace-nowrap">
                SUCCESs Framework
              </span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SUCCESS_FIELDS.map(({ key, label, sublabel, placeholder }) => (
                <div key={key}>
                  <label className="block mb-1.5">
                    <span className="text-xs font-medium text-zinc-300">{label}</span>
                    <span className="ml-2 text-xs text-zinc-600">{sublabel}</span>
                  </label>
                  <textarea
                    name={key}
                    value={form[key]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    rows={2}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 resize-none text-sm leading-relaxed transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !hasInput}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <Spinner />}
            {loading ? 'Generating...' : 'Generate Posts'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-6 px-4 py-3 bg-red-950/40 border border-red-800/60 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Output */}
        {posts && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Generated Posts</span>
              <div className="flex-1 h-px bg-zinc-800" />
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40"
              >
                Regenerate
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <PostCard
                label="Emotional & Personal"
                content={posts.post1}
                onCopy={() => handleCopy('post1')}
                copied={copied.post1}
              />
              <PostCard
                label="Provocative & Bold"
                content={posts.post2}
                onCopy={() => handleCopy('post2')}
                copied={copied.post2}
              />
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
