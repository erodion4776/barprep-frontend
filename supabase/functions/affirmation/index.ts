import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GROQ_API_KEY         = Deno.env.get('GROQ_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Generate affirmation using Groq ───────────────────────────────────────────
async function generateAffirmation(): Promise<string> {
  const prompts = [
    'Write one short powerful motivational affirmation for a law student studying for the bar exam. Make it specific to legal study, confident, and under 30 words. No quotes, no explanation, just the affirmation.',
    'Write one encouraging affirmation for a bar exam student who is working hard. Reference legal concepts or the law. Keep it under 30 words. Just the affirmation text.',
    'Create one strong motivational statement for someone preparing for the bar exam. Make it inspiring and exam-specific. Under 30 words. Just the text.',
  ]

  const prompt = prompts[Math.floor(Math.random() * prompts.length)]

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:       'llama-3.1-8b-instant',
        messages: [
          {
            role:    'system',
            content: 'You are a motivational coach for bar exam students. Write powerful, concise affirmations.',
          },
          {
            role:    'user',
            content: prompt,
          },
        ],
        temperature: 0.9,
        max_tokens:  80,
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq API error: ${response.status} — ${err}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content || ''

  return text
    .trim()
    .replace(/^["']|["']$/g, '')    // remove surrounding quotes
    .replace(/^\*+|\*+$/g, '')      // remove asterisks
    .trim()
}

// ── Main handler ──────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  try {
    const url    = new URL(req.url)
    const action = url.searchParams.get('action') || 'get'

    // ── GET: Return today's affirmation ───────────────────────────────────
    if (req.method === 'GET' && action === 'get') {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('daily_affirmations')
        .select('affirmation, date')
        .eq('date', today)
        .single()

      if (error || !data) {
        // No affirmation for today — return fallback
        return new Response(
          JSON.stringify({
            affirmation: 'You have the analytical mind and the diligence to conquer this exam. One rule, one analysis, one day at a time.',
            date:        today,
            source:      'fallback',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          affirmation: data.affirmation,
          date:        data.date,
          source:      'database',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── POST: Generate and save new affirmation ───────────────────────────
    if (req.method === 'POST' || action === 'generate') {
      // Optional secret key check for security
      const authHeader = req.headers.get('authorization') || ''
      const cronSecret = Deno.env.get('CRON_SECRET') || ''

      if (cronSecret && !authHeader.includes(cronSecret)) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          {
            status:  401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const today        = new Date().toISOString().split('T')[0]
      const affirmation  = await generateAffirmation()

      console.log(`Generated affirmation for ${today}: "${affirmation}"`)

      // Save to database
      const { data, error } = await supabase
        .from('daily_affirmations')
        .upsert(
          {
            date:        today,
            affirmation,
            generated_at: new Date().toISOString(),
          },
          { onConflict: 'date' }
        )
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({
          message:     '✅ Affirmation generated and saved!',
          affirmation,
          date:        today,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      {
        status:  400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (err) {
    console.error('Affirmation function error:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      {
        status:  500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
