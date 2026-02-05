'use client'

import { useState } from 'react'

export default function Page() {
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  async function handleGenerate() {
    if (!inputText.trim()) return
    
    setIsLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const response = await fetch('/api/flowchart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Request failed')
      }

      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (err) {
      console.error('[v0] Generate flowchart failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate flowchart')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">AI Canvas - Flowchart Generator</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe your process
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="e.g., User login authentication flow"
            className="w-full h-32 resize-none p-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          
          <button
            onClick={handleGenerate}
            disabled={isLoading || !inputText.trim()}
            className="mt-4 w-full py-3 px-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Generating...' : 'Generate Flowchart'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Result</h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm text-gray-800">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
