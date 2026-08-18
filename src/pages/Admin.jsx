import { useState, useEffect, useCallback } from 'react'
import { useNavigate }                       from 'react-router-dom'
import { apiClient, supabase }               from '../api/client'
import LoadingSpinner                        from '../components/LoadingSpinner'

// ── Constants ─────────────────────────────────────────────────────────────────
const TOPICS = [
  'Constitutional Law', 'Contracts',    'Torts',
  'Criminal Law',       'Civil Procedure', 'Evidence',
  'Real Property',      'Business Associations',
  'Family Law',         'Wills & Trusts',
]

const TABS = [
  { id: 'videos',  label: 'Videos',       icon: '🎥' },
  { id: 'web',     label: 'Web Pages',    icon: '🌐' },
  { id: 'pdf',     label: 'PDF Upload',   icon: '📄' },
  { id: 'modules', label: 'Modules',      icon: '📚' },
  { id: 'scraper', label: 'Scraper',      icon: '🕷️' },
  { id: 'blog',    label: 'Blog',         icon: '📰' },
  { id: 'users',   label: 'Users',        icon: '👥' },
  { id: 'chats',   label: 'Chat History', icon: '💬' },
]

const QUICK_ADD_URLS = [
  { label: 'Constitutional Law',   url: 'https://www.law.cornell.edu/wex/constitutional_law',  topic: 'Constitutional Law'    },
  { label: 'Contracts',            url: 'https://www.law.cornell.edu/wex/contract',            topic: 'Contracts'             },
  { label: 'Torts',                url: 'https://www.law.cornell.edu/wex/tort',                topic: 'Torts'                 },
  { label: 'Criminal Law',         url: 'https://www.law.cornell.edu/wex/criminal_law',        topic: 'Criminal Law'          },
  { label: 'Civil Procedure',      url: 'https://www.law.cornell.edu/wex/civil_procedure',     topic: 'Civil Procedure'       },
  { label: 'Evidence',             url: 'https://www.law.cornell.edu/wex/evidence',            topic: 'Evidence'              },
  { label: 'Real Property',        url: 'https://www.law.cornell.edu/wex/property',            topic: 'Real Property'         },
  { label: 'Family Law',           url: 'https://www.law.cornell.edu/wex/family_law',          topic: 'Family Law'            },
  { label: 'Negligence',           url: 'https://www.law.cornell.edu/wex/negligence',          topic: 'Torts'                 },
  { label: 'Due Process',          url: 'https://www.law.cornell.edu/wex/due_process',         topic: 'Constitutional Law'    },
  { label: 'Business Association', url: 'https://www.law.cornell.edu/wex/business_association',topic: 'Business Associations' },
  { label: 'Wills',                url: 'https://www.law.cornell.edu/wex/will',                topic: 'Wills & Trusts'        },
  { label: 'Trust',                url: 'https://www.law.cornell.edu/wex/trust',               topic: 'Wills & Trusts'        },
  { label: 'Hearsay',              url: 'https://www.law.cornell.edu/wex/hearsay',             topic: 'Evidence'              },
  { label: 'Consideration',        url: 'https://www.law.cornell.edu/wex/consideration',       topic: 'Contracts'             },
  { label: 'Mens Rea',             url: 'https://www.law.cornell.edu/wex/mens_rea',            topic: 'Criminal Law'          },
  { label: 'Jurisdiction',         url: 'https://www.law.cornell.edu/wex/jurisdiction',        topic: 'Civil Procedure'       },
  { label: 'Easement',             url: 'https://www.law.cornell.edu/wex/easement',            topic: 'Real Property'         },
  { label: 'Partnership',          url: 'https://www.law.cornell.edu/wex/partnership',         topic: 'Business Associations' },
  { label: 'Corporation',          url: 'https://www.law.cornell.edu/wex/corporation',         topic: 'Business Associations' },
  { label: 'Equal Protection',     url: 'https://www.law.cornell.edu/wex/equal_protection',    topic: 'Constitutional Law'    },
  { label: 'Adverse Possession',   url: 'https://www.law.cornell.edu/wex/adverse_possession',  topic: 'Real Property'         },
  { label: 'Strict Liability',     url: 'https://www.law.cornell.edu/wex/strict_liability',    topic: 'Torts'                 },
  { label: 'Defamation',           url: 'https://www.law.cornell.edu/wex/defamation',          topic: 'Torts'                 },
  { label: 'Offer',                url: 'https://www.law.cornell.edu/wex/offer',               topic: 'Contracts'             },
  { label: 'Acceptance',           url: 'https://www.law.cornell.edu/wex/acceptance',          topic: 'Contracts'             },
  { label: 'Breach of Contract',   url: 'https://www.law.cornell.edu/wex/breach_of_contract',  topic: 'Contracts'             },
  { label: 'Promissory Estoppel',  url: 'https://www.law.cornell.edu/wex/promissory_estoppel', topic: 'Contracts'             },
  { label: 'Damages',              url: 'https://www.law.cornell.edu/wex/damages',             topic: 'Contracts'             },
  { label: 'Proximate Cause',      url: 'https://www.law.cornell.edu/wex/proximate_cause',     topic: 'Torts'                 },
  { label: 'Products Liability',   url: 'https://www.law.cornell.edu/wex/products_liability',  topic: 'Torts'                 },
  { label: 'Murder',               url: 'https://www.law.cornell.edu/wex/murder',              topic: 'Criminal Law'          },
  { label: 'Self Defense',         url: 'https://www.law.cornell.edu/wex/self_defense',        topic: 'Criminal Law'          },
  { label: 'Conspiracy',           url: 'https://www.law.cornell.edu/wex/conspiracy',          topic: 'Criminal Law'          },
  { label: 'Personal Jurisdiction',url: 'https://www.law.cornell.edu/wex/personal_jurisdiction',topic:'Civil Procedure'       },
  { label: 'Res Judicata',         url: 'https://www.law.cornell.edu/wex/res_judicata',        topic: 'Civil Procedure'       },
  { label: 'Privilege (Evidence)', url: 'https://www.law.cornell.edu/wex/privilege',           topic: 'Evidence'              },
  { label: 'Commerce Clause',      url: 'https://www.law.cornell.edu/wex/commerce_clause',     topic: 'Constitutional Law'    },
  { label: 'First Amendment',      url: 'https://www.law.cornell.edu/wex/first_amendment',     topic: 'Constitutional Law'    },
  { label: 'Fourth Amendment',     url: 'https://www.law.cornell.edu/wex/fourth_amendment',    topic: 'Constitutional Law'    },
  { label: 'Fee Simple',           url: 'https://www.law.cornell.edu/wex/fee_simple',          topic: 'Real Property'         },
  { label: 'Mortgage',             url: 'https://www.law.cornell.edu/wex/mortgage',            topic: 'Real Property'         },
  { label: 'Fiduciary Duty',       url: 'https://www.law.cornell.edu/wex/fiduciary_duty',      topic: 'Business Associations' },
  { label: 'Agency',               url: 'https://www.law.cornell.edu/wex/agency',              topic: 'Business Associations' },
  { label: 'Intestacy',            url: 'https://www.law.cornell.edu/wex/intestacy',           topic: 'Wills & Trusts'        },
  { label: 'Probate',              url: 'https://www.law.cornell.edu/wex/probate',             topic: 'Wills & Trusts'        },
  { label: 'Divorce',              url: 'https://www.law.cornell.edu/wex/divorce',             topic: 'Family Law'            },
  { label: 'Child Custody',        url: 'https://www.law.cornell.edu/wex/child_custody',       topic: 'Family Law'            },
  { label: 'Fed Rules Evidence',   url: 'https://www.law.cornell.edu/rules/fre',               topic: 'Evidence'              },
  { label: 'Fed Rules Civ Pro',    url: 'https://www.law.cornell.edu/rules/frcp',              topic: 'Civil Procedure'       },
  { label: 'UCC Article 1',        url: 'https://www.law.cornell.edu/ucc/1/',                  topic: 'Contracts'             },
  { label: 'UCC Article 2',        url: 'https://www.law.cornell.edu/ucc/2/',                  topic: 'Contracts'             },
  { label: 'Wiki: Erie Doctrine',       url: 'https://en.wikipedia.org/wiki/Erie_Railroad_Co._v._Tompkins',    topic: 'Civil Procedure'       },
  { label: 'Wiki: Miranda Rights',      url: 'https://en.wikipedia.org/wiki/Miranda_warning',                   topic: 'Criminal Law'          },
  { label: 'Wiki: Rule vs Perpetuities',url: 'https://en.wikipedia.org/wiki/Rule_against_perpetuities',         topic: 'Wills & Trusts'        },
  { label: 'Wiki: Felony Murder',       url: 'https://en.wikipedia.org/wiki/Felony_murder_rule',                topic: 'Criminal Law'          },
  { label: 'Wiki: Comparative Neg.',    url: 'https://en.wikipedia.org/wiki/Comparative_negligence',            topic: 'Torts'                 },
  { label: 'Wiki: Strict Scrutiny',     url: 'https://en.wikipedia.org/wiki/Strict_scrutiny',                   topic: 'Constitutional Law'    },
  { label: 'Wiki: Res Judicata',        url: 'https://en.wikipedia.org/wiki/Res_judicata',                      topic: 'Civil Procedure'       },
  { label: 'Wiki: Joint Tenancy',       url: 'https://en.wikipedia.org/wiki/Joint_tenancy',                     topic: 'Real Property'         },
  { label: 'Wiki: Commerce Clause',     url: 'https://en.wikipedia.org/wiki/Commerce_clause',                   topic: 'Constitutional Law'    },
  { label: 'Wiki: Atty Privilege',      url: 'https://en.wikipedia.org/wiki/Attorney%E2%80%93client_privilege', topic: 'Evidence'              },
  { label: 'Wiki: Respondeat Superior', url: 'https://en.wikipedia.org/wiki/Respondeat_superior',               topic: 'Torts'                 },
  { label: 'Wiki: Community Property',  url: 'https://en.wikipedia.org/wiki/Community_property',                topic: 'Family Law'            },
  { label: 'Wiki: Promissory Estoppel', url: 'https://en.wikipedia.org/wiki/Promissory_estoppel',               topic: 'Contracts'             },
  { label: 'Wiki: Products Liability',  url: 'https://en.wikipedia.org/wiki/Products_liability',                topic: 'Torts'                 },
  { label: 'Wiki: Takings Clause',      url: 'https://en.wikipedia.org/wiki/Takings_clause',                    topic: 'Constitutional Law'    },
  { label: 'Wiki: Fiduciary',           url: 'https://en.wikipedia.org/wiki/Fiduciary',                         topic: 'Business Associations' },
  { label: 'Wiki: Hearsay Exceptions',  url: 'https://en.wikipedia.org/wiki/Excited_utterance',                 topic: 'Evidence'              },
  { label: 'Findlaw: Negligence',   url: 'https://injury.findlaw.com/accident-injury-law/negligence.html', topic: 'Torts'                 },
  { label: 'Findlaw: Criminal Law', url: 'https://criminal.findlaw.com/criminal-law-basics/',               topic: 'Criminal Law'          },
  { label: 'Findlaw: Wills',        url: 'https://estate.findlaw.com/wills/',                               topic: 'Wills & Trusts'        },
  { label: 'Findlaw: Trusts',       url: 'https://estate.findlaw.com/trusts/',                              topic: 'Wills & Trusts'        },
  { label: 'Findlaw: Divorce',      url: 'https://family.findlaw.com/divorce/',                              topic: 'Family Law'            },
  { label: 'Findlaw: Corporations', url: 'https://smallbusiness.findlaw.com/corporations/',                  topic: 'Business Associations' },
  { label: 'Findlaw: Real Estate',  url: 'https://realestate.findlaw.com/landlord-tenant-law/',              topic: 'Real Property'         },
  { label: 'Nolo: Criminal Law',    url: 'https://www.nolo.com/legal-encyclopedia/criminal-law',            topic: 'Criminal Law'          },
  { label: 'Nolo: Personal Injury', url: 'https://www.nolo.com/legal-encyclopedia/personal-injury',         topic: 'Torts'                 },
  { label: 'Nolo: Wills & Trusts',  url: 'https://www.nolo.com/legal-encyclopedia/wills-trusts-estates',   topic: 'Wills & Trusts'        },
  { label: 'Nolo: Real Estate',     url: 'https://www.nolo.com/legal-encyclopedia/real-estate',            topic: 'Real Property'         },
  { label: 'Nolo: Family Law',      url: 'https://www.nolo.com/legal-encyclopedia/family-law',             topic: 'Family Law'            },
  { label: 'Nolo: Contracts',       url: 'https://www.nolo.com/legal-encyclopedia/contracts',              topic: 'Contracts'             },
  { label: 'NCBE: MBE Info',        url: 'https://www.ncbex.org/exams/mbe/',                               topic: 'Constitutional Law'    },
  { label: 'NCBE: MEE Info',        url: 'https://www.ncbex.org/exams/mee/',                               topic: 'Constitutional Law'    },
  { label: 'NCBE: UBE Info',        url: 'https://www.ncbex.org/exams/ube/',                               topic: 'Constitutional Law'    },
  { label: 'Justia: Constitution',  url: 'https://law.justia.com/constitution/us/',                        topic: 'Constitutional Law'    },
  { label: 'Justia: 1st Amendment', url: 'https://law.justia.com/constitution/us/amendment-01/',           topic: 'Constitutional Law'    },
  { label: 'Justia: 4th Amendment', url: 'https://law.justia.com/constitution/us/amendment-04/',           topic: 'Constitutional Law'    },
  { label: 'Justia: 14th Amendment',url: 'https://law.justia.com/constitution/us/amendment-14/',           topic: 'Constitutional Law'    },
  { label: 'Justia: Criminal Law',  url: 'https://law.justia.com/topics/criminal-law/',                    topic: 'Criminal Law'          },
  { label: 'Justia: Torts',         url: 'https://law.justia.com/topics/torts/',                           topic: 'Torts'                 },
  { label: 'Justia: Contracts',     url: 'https://law.justia.com/topics/contracts/',                       topic: 'Contracts'             },
  { label: 'Justia: Family Law',    url: 'https://law.justia.com/topics/family-law/',                      topic: 'Family Law'            },
  { label: 'Justia: Property Law',  url: 'https://law.justia.com/topics/property-law/',                    topic: 'Real Property'         },
  { label: 'Justia: Evidence',      url: 'https://law.justia.com/topics/evidence/',                        topic: 'Evidence'              },
  { label: 'Justia: Wills & Trusts',url: 'https://law.justia.com/topics/wills-trusts-estates/',            topic: 'Wills & Trusts'        },
]

const PROFILES_SQL = `-- 1. Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.profiles enable row level security;
create policy "Allow public read" on public.profiles for select using (true);
create policy "Allow individual update" on public.profiles for update using (auth.uid() = id);
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();`

// ── Feedback banner ───────────────────────────────────────────────────────────
function Feedback({ result, error, onClearResult, onClearError }) {
  return (
    <>
      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl
                        text-green-700 text-sm flex items-start justify-between gap-3">
          <span>✅ {result}</span>
          <button onClick={onClearResult}
                  className="shrink-0 text-green-500 hover:text-green-700">✕</button>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl
                        text-red-700 text-sm flex items-start justify-between gap-3">
          <span>❌ {error}</span>
          <button onClick={onClearError}
                  className="shrink-0 text-red-500 hover:text-red-700">✕</button>
        </div>
      )}
    </>
  )
}

// ── Scraper Tab ───────────────────────────────────────────────────────────────
function ScraperTab() {
  const [url,        setUrl]        = useState('')
  const [topic,      setTopic]      = useState('')
  const [scraping,   setScraping]   = useState(false)
  const [result,     setResult]     = useState('')
  const [error,      setError]      = useState('')
  const [scraped,    setScraped]    = useState([])
  const [loadingSc,  setLoadingSc]  = useState(false)
  const [filter,     setFilter]     = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const loadScraped = useCallback(async () => {
    setLoadingSc(true)
    setError('')
    try {
      const { data, error: dbErr } = await supabase
        .from('scraped_data')
        .select('id, url, title, topic, word_count, is_indexed, scraped_at, content')
        .order('scraped_at', { ascending: false })
        .limit(100)
      if (dbErr) throw dbErr
      setScraped(data || [])
    } catch (err) {
      console.error('Load scraped error:', err)
      setError('Failed to load scraped data: ' + err.message)
    } finally {
      setLoadingSc(false)
    }
  }, [])

  useEffect(() => { loadScraped() }, [loadScraped])

  const handleScrape = async (e) => {
    e.preventDefault()
    if (!url.trim()) return
    setScraping(true)
    setResult('')
    setError('')
    try {
      const res = await apiClient.triggerScrape(url.trim(), topic)
      setResult(res.data.message || 'Scraped successfully!')
      setUrl('')
      setTopic('')
      setTimeout(() => loadScraped(), 1500)
    } catch (err) {
      setError(err.message || 'Failed to scrape URL')
    } finally {
      setScraping(false)
    }
  }

  const handleSync = async (id, itemUrl) => {
    try {
      setResult('Syncing to AI knowledge base...')
      setError('')
      await apiClient.ingestUrl(itemUrl)
      await supabase.from('scraped_data').update({ is_indexed: true }).eq('id', id)
      setScraped(s => s.map(item =>
        item.id === id ? { ...item, is_indexed: true } : item
      ))
      setResult('✅ Synced to AI knowledge base successfully!')
    } catch (err) {
      setError('Failed to sync: ' + err.message)
    }
  }

  const handleSyncAll = async () => {
    const unindexed = scraped.filter(i => !i.is_indexed)
    if (unindexed.length === 0) { setResult('All items are already synced!'); return }
    setScraping(true)
    setResult('')
    setError('')
    let successCount = 0
    let failCount    = 0
    for (const item of unindexed) {
      try {
        await apiClient.ingestUrl(item.url)
        await supabase.from('scraped_data').update({ is_indexed: true }).eq('id', item.id)
        successCount++
        setResult(`⏳ Syncing... ${successCount}/${unindexed.length} done`)
      } catch (err) {
        console.error(`Failed to sync ${item.url}:`, err)
        failCount++
      }
      await new Promise(r => setTimeout(r, 800))
    }
    setScraped(s => s.map(item =>
      unindexed.find(u => u.id === item.id) ? { ...item, is_indexed: true } : item
    ))
    setScraping(false)
    setResult(
      `✅ Synced ${successCount} pages to AI knowledge base!` +
      (failCount > 0 ? ` (${failCount} failed)` : '')
    )
    loadScraped()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this scraped item?')) return
    try {
      const { error: dbErr } = await supabase.from('scraped_data').delete().eq('id', id)
      if (dbErr) throw dbErr
      setScraped(s => s.filter(i => i.id !== id))
      setResult('Item deleted.')
    } catch (err) {
      setError('Failed to delete: ' + err.message)
    }
  }

  const handleDeleteAll = async () => {
    if (!window.confirm(`Delete ALL ${scraped.length} scraped items? This cannot be undone.`)) return
    try {
      await supabase.from('scraped_data').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      setScraped([])
      setResult('All items deleted.')
    } catch (err) {
      setError('Failed to delete all: ' + err.message)
    }
  }

  const filtered = scraped.filter(item => {
    const matchesTopic  = !filter || item.topic === filter
    const matchesSearch = !searchTerm ||
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.url?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesTopic && matchesSearch
  })

  const totalWords   = scraped.reduce((sum, i) => sum + (i.word_count || 0), 0)
  const indexedCount = scraped.filter(i => i.is_indexed).length
  const pendingCount = scraped.filter(i => !i.is_indexed).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Web Scraper</h2>
        <p className="text-slate-500 text-sm mt-1">
          Scrape bar prep content, save to Supabase, and sync to the AI knowledge base.
        </p>
      </div>

      <Feedback result={result} error={error}
        onClearResult={() => setResult('')} onClearError={() => setError('')} />

      {scraped.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pages Scraped', value: scraped.length,             color: 'text-blue-600'  },
            { label: 'Total Words',   value: totalWords.toLocaleString(), color: 'text-green-600' },
            { label: 'Indexed',       value: `${indexedCount}/${scraped.length}`,
              color: indexedCount === scraped.length ? 'text-green-600' : 'text-amber-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
              <p className={`text-xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {pendingCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4
                        flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-blue-900">
              🔄 {pendingCount} page{pendingCount !== 1 ? 's' : ''} not yet synced to AI
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              Sync them so the AI Coach can use this content
            </p>
          </div>
          <button
            onClick={handleSyncAll}
            disabled={scraping}
            className="shrink-0 px-4 py-2 bg-blue-600 text-white text-xs font-bold
                       rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60
                       flex items-center gap-2 whitespace-nowrap"
          >
            {scraping
              ? <><LoadingSpinner size="sm" color="white" /> Syncing…</>
              : `↑ Sync All ${pendingCount} to AI`
            }
          </button>
        </div>
      )}

      {scraped.length > 0 && pendingCount === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
          <span className="text-lg">✅</span>
          <p className="text-sm font-medium text-green-800">
            All {scraped.length} pages are synced to the AI knowledge base!
          </p>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-slate-900 text-sm">Scrape New URL</h3>
        <form onSubmit={handleScrape} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">URL to Scrape</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://www.law.cornell.edu/wex/negligence"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                         focus:outline-none focus:border-blue-500 transition-colors"
              disabled={scraping} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Topic (optional)</label>
            <select value={topic} onChange={e => setTopic(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                         focus:outline-none focus:border-blue-500 transition-colors bg-white">
              <option value="">-- Select topic --</option>
              {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button type="submit" disabled={scraping || !url.trim()}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl
                       hover:bg-blue-700 transition-colors disabled:opacity-60
                       flex items-center justify-center gap-2">
            {scraping
              ? <><LoadingSpinner size="sm" color="white" /> Scraping…</>
              : '🕷️ Scrape & Sync to Supabase →'
            }
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-700">Quick Add — Click to fill URL field:</p>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">📚 Cornell Law WEX</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
            {QUICK_ADD_URLS.filter(u => u.url.includes('cornell.edu'))
              .map(({ label, url: u, topic: t }) => (
                <button key={label + u} onClick={() => { setUrl(u); setTopic(t) }}
                  className="p-2 text-left text-xs bg-blue-50 border border-blue-100
                             rounded-lg hover:bg-blue-100 hover:border-blue-300
                             text-blue-700 transition-colors">
                  📄 {label}
                </button>
              ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">🌐 Wikipedia</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
            {QUICK_ADD_URLS.filter(u => u.url.includes('wikipedia.org'))
              .map(({ label, url: u, topic: t }) => (
                <button key={label + u} onClick={() => { setUrl(u); setTopic(t) }}
                  className="p-2 text-left text-xs bg-slate-50 border border-slate-200
                             rounded-lg hover:bg-slate-100 hover:border-slate-300
                             text-slate-700 transition-colors">
                  🌐 {label.replace('Wiki: ', '')}
                </button>
              ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">⚖️ Findlaw & Nolo</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
            {QUICK_ADD_URLS.filter(u => u.url.includes('findlaw.com') || u.url.includes('nolo.com'))
              .map(({ label, url: u, topic: t }) => (
                <button key={label + u} onClick={() => { setUrl(u); setTopic(t) }}
                  className="p-2 text-left text-xs bg-green-50 border border-green-100
                             rounded-lg hover:bg-green-100 hover:border-green-300
                             text-green-700 transition-colors">
                  ⚖️ {label.replace('Findlaw: ', '').replace('Nolo: ', '')}
                </button>
              ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">🏛️ NCBE & Justia</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
            {QUICK_ADD_URLS.filter(u => u.url.includes('ncbex.org') || u.url.includes('justia.com'))
              .map(({ label, url: u, topic: t }) => (
                <button key={label + u} onClick={() => { setUrl(u); setTopic(t) }}
                  className="p-2 text-left text-xs bg-purple-50 border border-purple-100
                             rounded-lg hover:bg-purple-100 hover:border-purple-300
                             text-purple-700 transition-colors">
                  🏛️ {label.replace('NCBE: ', '').replace('Justia: ', '')}
                </button>
              ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Scraped Data ({filtered.length} / {scraped.length})
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {scraped.length > 0 && (
              <button onClick={handleDeleteAll}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline">
                Delete All
              </button>
            )}
            <button onClick={loadScraped} disabled={loadingSc}
                    className="text-xs text-blue-600 hover:underline disabled:opacity-50
                               px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50">
              {loadingSc ? 'Loading…' : '↻ Refresh'}
            </button>
          </div>
        </div>

        {scraped.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by title or URL..."
              className="flex-1 min-w-[200px] border border-slate-200 rounded-xl
                         px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500" />
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs
                         focus:outline-none focus:border-blue-500 bg-white">
              <option value="">All Topics</option>
              {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}

        {loadingSc ? (
          <div className="py-8 flex justify-center">
            <LoadingSpinner size="md" text="Loading scraped data..." />
          </div>
        ) : scraped.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl text-center py-10 space-y-2">
            <p className="text-3xl">🕷️</p>
            <p className="text-slate-500 text-sm font-medium">No scraped data yet.</p>
            <p className="text-slate-400 text-xs">Use the form above or click a Quick Add button.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl text-center py-8">
            <p className="text-slate-500 text-sm">No results match your filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <div key={item.id}
                   className={`bg-white border rounded-xl p-4 space-y-2 transition-colors
                     ${item.is_indexed ? 'border-green-200 bg-green-50/30' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {item.title || 'Untitled'}
                    </p>
                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-blue-600 hover:underline truncate block">
                      {item.url}
                    </a>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {item.topic ? (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          {item.topic}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                          No topic
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {(item.word_count || 0).toLocaleString()} words
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.scraped_at
                          ? new Date(item.scraped_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })
                          : 'Just now'
                        }
                      </span>
                      {item.is_indexed ? (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                          ✓ In AI Knowledge Base
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                          ⏳ Pending Sync
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {!item.is_indexed && (
                      <button onClick={() => handleSync(item.id, item.url)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-bold
                                   px-2.5 py-1.5 hover:bg-blue-50 rounded-lg border
                                   border-blue-200 hover:border-blue-300 transition-colors">
                        ↑ Sync
                      </button>
                    )}
                    <button onClick={() => handleDelete(item.id)}
                      className="text-red-400 hover:text-red-600 text-xs px-2.5 py-1.5
                                 hover:bg-red-50 rounded-lg font-medium transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
                {item.content && (
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {item.content.substring(0, 300)}…
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Blog Tab ──────────────────────────────────────────────────────────────────
function BlogTab() {
  const [posts,      setPosts]      = useState([])
  const [loading,    setLoading]    = useState(false)
  const [generating, setGenerating] = useState(false)
  const [result,     setResult]     = useState('')
  const [error,      setError]      = useState('')
  const [topic,      setTopic]      = useState(TOPICS[0])
  const [filter,     setFilter]     = useState('all')

  const loadPosts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('blog_posts').select('*')
        .order('created_at', { ascending: false }).limit(50)
      if (err) throw err
      const filtered = filter === 'all' ? (data || []) : (data || []).filter(p => p.status === filter)
      setPosts(filtered)
    } catch (err) {
      setError(err.message || 'Failed to load blog posts')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { loadPosts() }, [loadPosts])

  const handleGenerate = async () => {
    setGenerating(true); setResult(''); setError('')
    try {
      const res = await apiClient.generateBlogPost({ topic })
      setResult(res.data.message || 'Blog post generated!')
      setTimeout(() => loadPosts(), 1000)
    } catch (err) {
      setError(err.message || 'Failed to generate blog post')
    } finally {
      setGenerating(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      const { error: err } = await supabase.from('blog_posts')
        .update({ status: 'published', published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', id)
      if (err) throw err
      setPosts(p => p.map(post => post.id === id
        ? { ...post, status: 'published', published_at: new Date().toISOString() } : post))
      setResult('Post published! ✅')
    } catch (err) { setError('Failed to publish: ' + err.message) }
  }

  const handleUnpublish = async (id) => {
    try {
      const { error: err } = await supabase.from('blog_posts')
        .update({ status: 'pending', updated_at: new Date().toISOString() }).eq('id', id)
      if (err) throw err
      setPosts(p => p.map(post => post.id === id ? { ...post, status: 'pending' } : post))
      setResult('Post unpublished.')
    } catch (err) { setError('Failed to unpublish: ' + err.message) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this blog post? This cannot be undone.')) return
    try {
      const { error: err } = await supabase.from('blog_posts').delete().eq('id', id)
      if (err) throw err
      setPosts(p => p.filter(post => post.id !== id))
      setResult('Post deleted.')
    } catch (err) { setError('Failed to delete: ' + err.message) }
  }

  const publishedCount = posts.filter(p => p.status === 'published').length
  const pendingCount   = posts.filter(p => p.status === 'pending').length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Blog Management</h2>
        <p className="text-slate-500 text-sm mt-1">
          Generate AI blog posts using Groq AI for text and Pollinations AI for cover images.
        </p>
      </div>

      <Feedback result={result} error={error}
        onClearResult={() => setResult('')} onClearError={() => setError('')} />

      {posts.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Posts',    value: posts.length,   color: 'text-blue-600'  },
            { label: 'Published',      value: publishedCount, color: 'text-green-600' },
            { label: 'Pending Review', value: pendingCount,   color: 'text-amber-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
              <p className={`text-xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-slate-900">Generate New Post</h3>
        <div className="flex gap-3">
          <select value={topic} onChange={e => setTopic(e.target.value)}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm
                       focus:outline-none focus:border-blue-500 transition-colors bg-white">
            {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={handleGenerate} disabled={generating}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl
                       hover:bg-blue-700 transition-colors disabled:opacity-60
                       flex items-center gap-2 whitespace-nowrap">
            {generating ? <><LoadingSpinner size="sm" color="white" /> Generating…</> : '✨ Generate Post'}
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Groq AI writes the article • Pollinations AI generates the cover image • Saved as draft
        </p>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {['all', 'pending', 'published'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-colors
              ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {f}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
        <button onClick={loadPosts}
          className="ml-auto px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700
                     border border-slate-200 rounded-full hover:bg-slate-50 transition-colors">
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-8 flex justify-center"><LoadingSpinner size="md" text="Loading posts..." /></div>
      ) : posts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl text-center py-12 space-y-2">
          <p className="text-4xl">📰</p>
          <p className="text-slate-500 text-sm font-medium">
            {filter === 'all' ? 'No blog posts yet. Generate one above.' : `No ${filter} posts.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id}
                 className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300">
              {post.image_url && (
                <div className="w-full h-32 bg-slate-100 overflow-hidden">
                  <img src={post.image_url} alt={post.title} className="w-full h-full object-cover"
                    onError={e => e.currentTarget.style.display = 'none'} />
                </div>
              )}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {post.status === 'published' ? '✅ Published' : '⏳ Pending'}
                  </span>
                  {post.topic && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      {post.topic}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 ml-auto">
                    {(post.word_count || 0).toLocaleString()} words
                    {post.read_time ? ` • ${post.read_time} min read` : ''}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm leading-snug">{post.title}</h3>
                {post.excerpt && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                )}
                <div className="flex items-center gap-3 text-[10px] text-slate-400 flex-wrap">
                  <span>Created: {new Date(post.created_at).toLocaleDateString()}</span>
                  {post.published_at && <span>Published: {new Date(post.published_at).toLocaleDateString()}</span>}
                  {post.views > 0 && <span>{post.views.toLocaleString()} views</span>}
                  <span className="text-slate-300">{post.ai_model || 'groq+pollinations'}</span>
                </div>
                <div className="flex gap-2 pt-1 flex-wrap">
                  {post.status !== 'published' ? (
                    <button onClick={() => handleApprove(post.id)}
                      className="flex-1 py-2 text-xs font-bold bg-green-600 text-white
                                 rounded-lg hover:bg-green-700 transition-colors">
                      ✅ Publish Now
                    </button>
                  ) : (
                    <button onClick={() => handleUnpublish(post.id)}
                      className="flex-1 py-2 text-xs font-medium bg-slate-100 text-slate-600
                                 rounded-lg hover:bg-slate-200 transition-colors">
                      Unpublish
                    </button>
                  )}
                  <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-2 text-xs font-medium text-center border border-slate-200
                               text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                    Preview ↗
                  </a>
                  <button onClick={() => handleDelete(post.id)}
                    className="px-3 py-2 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Users Tab — UPDATED with full name, activate/deactivate, plan management ──
function UsersTab() {
  const [usersList,     setUsersList]     = useState([])
  const [attemptsList,  setAttemptsList]  = useState([])
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(null)
  const [result,        setResult]        = useState('')
  const [page,          setPage]          = useState(0)
  const [searchTerm,    setSearchTerm]    = useState('')
  const [filterPlan,    setFilterPlan]    = useState('all')
  const [filterStatus,  setFilterStatus]  = useState('all')
  const [actionLoading, setActionLoading] = useState(null)
  const PAGE_SIZE = 20

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [profilesRes, attemptsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('attempts').select('*').order('created_at', { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1),
      ])
      if (profilesRes.error) throw profilesRes.error
      setUsersList(profilesRes.data   || [])
      setAttemptsList(attemptsRes.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { load() }, [load])

  // ── Activate ───────────────────────────────────────────────────────────────
  const handleActivate = async (userId, email) => {
    if (!window.confirm(`Activate account for: ${email}?`)) return
    setActionLoading(userId)
    setResult('')
    try {
      const { error: err } = await supabase.from('profiles')
        .update({
          is_active:    true,
          banned_at:    null,
          ban_reason:   null,
          activated_at: new Date().toISOString(),
          updated_at:   new Date().toISOString(),
        })
        .eq('id', userId)
      if (err) throw err
      setUsersList(u => u.map(user =>
        user.id === userId
          ? { ...user, is_active: true, banned_at: null, ban_reason: null }
          : user
      ))
      setResult(`✅ Account activated for ${email}`)
    } catch (err) {
      setResult(`❌ Failed to activate: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  // ── Deactivate ─────────────────────────────────────────────────────────────
  const handleDeactivate = async (userId, email) => {
    const reason = window.prompt(
      `Reason for deactivating ${email}?\n(This will be shown to the user)`,
      'Violation of Terms of Service'
    )
    if (reason === null) return
    setActionLoading(userId)
    setResult('')
    try {
      const { error: err } = await supabase.from('profiles')
        .update({
          is_active:  false,
          banned_at:  new Date().toISOString(),
          ban_reason: reason || 'Account deactivated by admin',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
      if (err) throw err
      setUsersList(u => u.map(user =>
        user.id === userId
          ? { ...user, is_active: false, banned_at: new Date().toISOString(), ban_reason: reason }
          : user
      ))
      setResult(`✅ Account deactivated for ${email}`)
    } catch (err) {
      setResult(`❌ Failed to deactivate: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  // ── Change Plan ────────────────────────────────────────────────────────────
  const handleChangePlan = async (userId, email, newPlan) => {
    if (!window.confirm(`Change ${email} to ${newPlan} plan?`)) return
    setActionLoading(userId)
    setResult('')
    try {
      const { error: err } = await supabase.from('profiles')
        .update({ plan: newPlan, updated_at: new Date().toISOString() })
        .eq('id', userId)
      if (err) throw err
      setUsersList(u => u.map(user =>
        user.id === userId ? { ...user, plan: newPlan } : user
      ))
      setResult(`✅ ${email} plan changed to ${newPlan}`)
    } catch (err) {
      setResult(`❌ Failed to change plan: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  // ── Reset Daily Limits ─────────────────────────────────────────────────────
  const handleResetLimits = async (userId, email) => {
    if (!window.confirm(`Reset daily limits for ${email}?`)) return
    setActionLoading(userId)
    setResult('')
    try {
      const today = new Date().toISOString().split('T')[0]
      const { error: err } = await supabase.from('profiles')
        .update({
          ai_messages_today:       0,
          ai_messages_reset_at:    today,
          mock_questions_today:    0,
          mock_questions_reset_at: today,
          updated_at:              new Date().toISOString(),
        })
        .eq('id', userId)
      if (err) throw err
      setUsersList(u => u.map(user =>
        user.id === userId
          ? { ...user, ai_messages_today: 0, mock_questions_today: 0 }
          : user
      ))
      setResult(`✅ Daily limits reset for ${email}`)
    } catch (err) {
      setResult(`❌ Failed to reset: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  // ── Edit Name ──────────────────────────────────────────────────────────────
  const handleEditName = async (userId, currentName) => {
    const newName = window.prompt('Enter new full name:', currentName || '')
    if (newName === null || newName.trim() === '') return
    setActionLoading(userId)
    setResult('')
    try {
      const { error: err } = await supabase.from('profiles')
        .update({ full_name: newName.trim(), updated_at: new Date().toISOString() })
        .eq('id', userId)
      if (err) throw err
      setUsersList(u => u.map(user =>
        user.id === userId ? { ...user, full_name: newName.trim() } : user
      ))
      setResult(`✅ Name updated to "${newName.trim()}"`)
    } catch (err) {
      setResult(`❌ Failed to update name: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filteredUsers = usersList.filter(usr => {
    const matchesSearch =
      !searchTerm ||
      usr.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usr.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usr.id?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPlan   = filterPlan   === 'all' || usr.plan === filterPlan
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active'      && usr.is_active !== false) ||
      (filterStatus === 'deactivated' && usr.is_active === false)
    return matchesSearch && matchesPlan && matchesStatus
  })

  // Add synthetic users from attempts
  const combinedUsers = [...filteredUsers]
  const userIds = new Set(usersList.map(u => u.id))
  if (filterPlan === 'all' && filterStatus === 'all' && !searchTerm) {
    attemptsList.forEach(att => {
      if (att.user_id && !userIds.has(att.user_id)) {
        combinedUsers.push({
          id:          att.user_id,
          email:       `Pre-sync (${att.user_id.slice(0, 8)}…)`,
          created_at:  att.created_at,
          isSynthetic: true,
          is_active:   true,
          plan:        'free',
        })
        userIds.add(att.user_id)
      }
    })
  }

  const planBadge = (plan) => {
    const config = {
      free:     { label: 'Free',         bg: 'bg-slate-100',  text: 'text-slate-600'  },
      pro:      { label: '🔥 Pro',       bg: 'bg-blue-100',   text: 'text-blue-700'   },
      barready: { label: '👑 Bar Ready', bg: 'bg-purple-100', text: 'text-purple-700' },
    }
    const c = config[plan] || config.free
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    )
  }

  const totalUsers       = usersList.length
  const activeUsers      = usersList.filter(u => u.is_active !== false).length
  const deactivatedUsers = usersList.filter(u => u.is_active === false).length
  const paidUsers        = usersList.filter(u => u.plan && u.plan !== 'free').length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Users & Activity</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage student accounts, plans, and access.
          </p>
        </div>
        <button onClick={load}
                className="px-4 py-2 text-sm border border-slate-200
                           rounded-xl hover:bg-slate-50 transition-colors">
          ↻ Refresh
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`p-4 rounded-xl text-sm flex items-center justify-between gap-3
          ${result.startsWith('✅')
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
          <span>{result}</span>
          <button onClick={() => setResult('')}
                  className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Users',  value: totalUsers,       color: 'text-slate-900' },
          { label: 'Active',       value: activeUsers,      color: 'text-green-600' },
          { label: 'Deactivated',  value: deactivatedUsers, color: 'text-red-600'   },
          { label: 'Paid Users',   value: paidUsers,        color: 'text-blue-600'  },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl py-12 flex justify-center">
          <LoadingSpinner size="lg" text="Loading users..." />
        </div>
      ) : error ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <h4 className="font-semibold text-amber-900">Profiles table setup needed</h4>
              <p className="text-amber-800 text-sm mt-1">Run this SQL in your Supabase SQL Editor:</p>
            </div>
          </div>
          <pre className="bg-slate-900 rounded-lg p-4 text-xs font-mono text-slate-300
                          overflow-x-auto max-h-[300px] select-all whitespace-pre-wrap">
            {PROFILES_SQL}
          </pre>
        </div>
      ) : (
        <>
          {/* Search + Filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2
                               text-slate-400 text-sm pointer-events-none">🔍</span>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name, email or ID..."
                className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2
                           text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-slate-400 hover:text-slate-600 text-xs">✕</button>
              )}
            </div>
            <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm
                         focus:outline-none focus:border-blue-500 bg-white">
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="barready">Bar Ready</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm
                         focus:outline-none focus:border-blue-500 bg-white">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>

          <p className="text-xs text-slate-500">
            Showing {combinedUsers.length} of {usersList.length} users
            {searchTerm && ` matching "${searchTerm}"`}
          </p>

          {/* User cards */}
          <div className="space-y-3">
            {combinedUsers.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl text-center py-12">
                <p className="text-slate-400 text-sm">
                  {usersList.length === 0
                    ? 'No users yet. When users sign up they will appear here.'
                    : 'No users match your filter.'
                  }
                </p>
              </div>
            ) : (
              combinedUsers.map(usr => (
                <div key={usr.id}
                     className={`bg-white border rounded-2xl p-5 space-y-4
                       ${usr.is_active === false
                         ? 'border-red-200 bg-red-50/20'
                         : 'border-slate-200'
                       }`}>

                  {/* User info */}
                  <div className="flex items-start gap-3 flex-wrap">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center
                                    justify-center shrink-0">
                      <span className="text-white text-xs font-black">
                        {(usr.full_name || usr.email || '?').slice(0, 2).toUpperCase()}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      {/* Name row */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {usr.full_name || (
                            <span className="text-slate-400 italic font-normal text-xs">
                              No name set
                            </span>
                          )}
                        </p>
                        {!usr.isSynthetic && (
                          <button
                            onClick={() => handleEditName(usr.id, usr.full_name)}
                            title="Edit name"
                            className="text-slate-300 hover:text-blue-500 transition-colors text-[10px]"
                          >
                            ✏️
                          </button>
                        )}
                      </div>

                      {/* Email */}
                      <p className="text-xs text-slate-500 truncate">
                        {usr.email || 'No email'}
                      </p>

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {usr.is_active === false ? (
                          <span className="text-[10px] font-bold px-2 py-0.5
                                           bg-red-100 text-red-700 rounded-full">
                            🚫 Deactivated
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5
                                           bg-green-100 text-green-700 rounded-full">
                            ✅ Active
                          </span>
                        )}
                        {!usr.isSynthetic && planBadge(usr.plan || 'free')}
                        {usr.isSynthetic ? (
                          <span className="text-[10px] px-2 py-0.5 bg-amber-50
                                           text-amber-700 border border-amber-100 rounded-full">
                            Attempt Only
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 bg-slate-100
                                           text-slate-500 rounded-full">
                            Synced
                          </span>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-[10px] text-slate-400 font-mono select-all truncate max-w-[180px]">
                          {usr.id}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Joined: {usr.created_at
                            ? new Date(usr.created_at).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                              })
                            : 'N/A'
                          }
                        </p>
                        {usr.ai_messages_today > 0 && (
                          <p className="text-[10px] text-blue-500">
                            🤖 {usr.ai_messages_today}/10 AI today
                          </p>
                        )}
                        {usr.mock_questions_today > 0 && (
                          <p className="text-[10px] text-green-500">
                            📝 {usr.mock_questions_today}/5 mock today
                          </p>
                        )}
                      </div>

                      {/* Ban reason */}
                      {usr.ban_reason && (
                        <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                          <p className="text-xs text-red-700">
                            <span className="font-bold">Ban reason:</span> {usr.ban_reason}
                          </p>
                          {usr.banned_at && (
                            <p className="text-[10px] text-red-400 mt-0.5">
                              Banned: {new Date(usr.banned_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  {!usr.isSynthetic && (
                    <div className="flex gap-2 flex-wrap pt-1 border-t border-slate-100">

                      {/* Activate / Deactivate */}
                      {usr.is_active === false ? (
                        <button
                          onClick={() => handleActivate(usr.id, usr.email)}
                          disabled={actionLoading === usr.id}
                          className="px-4 py-2 text-xs font-bold bg-green-600 text-white
                                     rounded-xl hover:bg-green-700 transition-colors
                                     disabled:opacity-60 flex items-center gap-1.5"
                        >
                          {actionLoading === usr.id
                            ? <><LoadingSpinner size="sm" color="white" /> Loading…</>
                            : '✅ Activate Account'
                          }
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeactivate(usr.id, usr.email)}
                          disabled={actionLoading === usr.id}
                          className="px-4 py-2 text-xs font-bold bg-red-50 text-red-700
                                     border border-red-200 rounded-xl hover:bg-red-100
                                     transition-colors disabled:opacity-60 flex items-center gap-1.5"
                        >
                          {actionLoading === usr.id
                            ? <><LoadingSpinner size="sm" /> Loading…</>
                            : '🚫 Deactivate'
                          }
                        </button>
                      )}

                      {/* Change Plan */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500 shrink-0">Plan:</span>
                        <select
                          value={usr.plan || 'free'}
                          onChange={e => handleChangePlan(usr.id, usr.email, e.target.value)}
                          disabled={actionLoading === usr.id}
                          className="px-2 py-2 text-xs border border-slate-200 rounded-xl bg-white
                                     focus:outline-none focus:border-blue-500 transition-colors
                                     disabled:opacity-60 cursor-pointer"
                        >
                          <option value="free">Free</option>
                          <option value="pro">🔥 Pro</option>
                          <option value="barready">👑 Bar Ready</option>
                        </select>
                      </div>

                      {/* Reset Limits */}
                      <button
                        onClick={() => handleResetLimits(usr.id, usr.email)}
                        disabled={actionLoading === usr.id}
                        className="px-4 py-2 text-xs font-medium bg-slate-100 text-slate-600
                                   border border-slate-200 rounded-xl hover:bg-slate-200
                                   transition-colors disabled:opacity-60"
                      >
                        🔄 Reset Limits
                      </button>

                      {/* Edit Name */}
                      <button
                        onClick={() => handleEditName(usr.id, usr.full_name)}
                        disabled={actionLoading === usr.id}
                        className="px-4 py-2 text-xs font-medium bg-blue-50 text-blue-700
                                   border border-blue-200 rounded-xl hover:bg-blue-100
                                   transition-colors disabled:opacity-60"
                      >
                        ✏️ Edit Name
                      </button>

                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-2">
            <p className="text-xs text-slate-500">
              Page {page + 1} • {combinedUsers.length} users shown
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg
                           disabled:opacity-40 hover:bg-slate-50 transition-colors">
                ← Prev
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={attemptsList.length < PAGE_SIZE}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg
                           disabled:opacity-40 hover:bg-slate-50 transition-colors">
                Next →
              </button>
            </div>
          </div>
        </>
      )}

      {/* Recent attempts */}
      {attemptsList.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Recent Attempts ({attemptsList.length})
          </h3>
          {attemptsList.slice(0, 10).map(attempt => (
            <div key={attempt.id}
                 className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                  {attempt.topic}
                </span>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold ${attempt.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                    {attempt.is_correct ? '✅ Correct' : '❌ Incorrect'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(attempt.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2 line-clamp-2">
                {attempt.question}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Admin component ──────────────────────────────────────────────────────
export default function Admin() {
  const navigate    = useNavigate()
  const [activeTab, setActiveTab] = useState('videos')
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState('')
  const [error,     setError]     = useState('')

  const [videoUrl,   setVideoUrl]   = useState('')
  const [videoTopic, setVideoTopic] = useState(TOPICS[0])
  const [videoOrder, setVideoOrder] = useState(0)
  const [pageUrl,    setPageUrl]    = useState('')
  const [pdfFile,    setPdfFile]    = useState(null)
  const [uploading,  setUploading]  = useState(false)
  const [modules,         setModules]         = useState([])
  const [loadingModules,  setLoadingModules]  = useState(false)
  const [chatSessions,    setChatSessions]    = useState([])
  const [loadingChats,    setLoadingChats]    = useState(false)
  const [chatsError,      setChatsError]      = useState(null)
  const [expandedSession, setExpandedSession] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) { navigate('/admin/login'); return }
    apiClient.adminVerify(token)
      .then(res => {
        if (!res.data.valid) {
          localStorage.removeItem('admin_token')
          navigate('/admin/login')
        }
      })
      .catch(() => navigate('/admin/login'))
  }, [navigate])

  useEffect(() => {
    if (activeTab === 'modules') loadModules()
    if (activeTab === 'chats')   loadChatSessions()
  }, [activeTab])

  const loadModules = async () => {
    setLoadingModules(true)
    try {
      const res = await apiClient.getModules('', true)
      setModules(res.data.modules || [])
    } catch (err) {
      console.error('Load modules error:', err)
    } finally {
      setLoadingModules(false)
    }
  }

  const loadChatSessions = async () => {
    setLoadingChats(true)
    setChatsError(null)
    try {
      const token = localStorage.getItem('admin_token')
      const res   = await apiClient.adminGetAllSessions(token)
      setChatSessions(res.data.sessions || [])
    } catch (err) {
      setChatsError(err.message)
    } finally {
      setLoadingChats(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    navigate('/admin/login')
  }

  const clear = () => { setResult(''); setError('') }

  const handleVideoSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    clear()
    try {
      const res = await apiClient.processVideo(videoUrl, videoTopic, videoOrder)
      let msg   = res.data.message || 'Module created!'
      if (res.data.source_type === 'description') msg += ' (Used description)'
      else if (res.data.source_type === 'transcript') msg += ' Full transcript extracted!'
      setResult(msg)
      setVideoUrl('')
      setVideoOrder(p => p + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePageSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    clear()
    try {
      const res = await apiClient.ingestUrl(pageUrl)
      setResult(res.data.message || 'Page ingested!')
      setPageUrl('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePdfUpload = async (e) => {
    e.preventDefault()
    if (!pdfFile) return
    setUploading(true)
    clear()
    try {
      const filename    = pdfFile.name
      const storagePath = `pdfs/${Date.now()}_${filename}`
      const { error: uploadError } = await supabase.storage
        .from('documents').upload(storagePath, pdfFile)
      if (uploadError) throw new Error(uploadError.message)
      const { data: docData, error: docError } = await supabase
        .from('user_documents')
        .insert({ filename, file_type: pdfFile.type, file_size: pdfFile.size,
                  storage_path: storagePath, is_indexed: false })
        .select().single()
      if (docError) throw new Error(docError.message)
      const res = await apiClient.processPdf(storagePath, filename, docData.id)
      setResult(res.data.message || 'PDF uploaded and indexed!')
      setPdfFile(null)
      e.target.reset()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteModule = async (id) => {
    if (!window.confirm('Delete this module?')) return
    await supabase.from('course_modules').delete().eq('id', id)
    setModules(m => m.filter(mod => mod.id !== id))
  }

  const handleTogglePublish = async (id, current) => {
    await supabase.from('course_modules').update({ is_published: !current }).eq('id', id)
    setModules(m => m.map(mod => mod.id === id ? { ...mod, is_published: !current } : mod))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manage BarPrep AI content, blog, and users</p>
        </div>
        <button onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium border border-slate-200
                           text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">
          Logout →
        </button>
      </div>

      {/* Tabs — desktop */}
      <div className="hidden sm:flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(({ id, label, icon }) => (
          <button key={id} onClick={() => { setActiveTab(id); clear() }}
            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap
              transition-colors flex-1 flex items-center justify-center gap-1.5
              ${activeTab === id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tabs — mobile */}
      <div className="sm:hidden">
        <select value={activeTab} onChange={e => { setActiveTab(e.target.value); clear() }}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                     font-medium text-slate-700 focus:outline-none focus:border-blue-500 bg-white">
          {TABS.map(({ id, label, icon }) => (
            <option key={id} value={id}>{icon} {label}</option>
          ))}
        </select>
      </div>

      {/* Global feedback */}
      {['videos', 'web', 'pdf'].includes(activeTab) && (
        <Feedback result={result} error={error}
          onClearResult={() => setResult('')} onClearError={() => setError('')} />
      )}

      {/* ── Videos Tab ── */}
      {activeTab === 'videos' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Add YouTube Lecture</h2>
            <p className="text-slate-500 text-sm mt-1">
              AI extracts transcript → summary → outline → indexes for chat.
            </p>
          </div>
          <form onSubmit={handleVideoSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">YouTube URL</label>
              <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                           focus:outline-none focus:border-blue-500 transition-colors"
                disabled={loading} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Topic</label>
                <select value={videoTopic} onChange={e => setVideoTopic(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                             focus:outline-none focus:border-blue-500 transition-colors bg-white"
                  disabled={loading}>
                  {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Order Index</label>
                <input type="number" value={videoOrder} onChange={e => setVideoOrder(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                             focus:outline-none focus:border-blue-500 transition-colors"
                  min="0" disabled={loading} />
              </div>
            </div>
            <button type="submit" disabled={loading || !videoUrl.trim()}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl
                         hover:bg-blue-700 transition-colors disabled:opacity-60
                         flex items-center justify-center gap-2 min-h-[48px]">
              {loading
                ? <><LoadingSpinner size="sm" color="white" /> Processing… (up to 60s)</>
                : 'Create Course Module →'
              }
            </button>
          </form>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-slate-700">⚙️ What happens automatically:</p>
            <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
              <li>Gets title + thumbnail from YouTube</li>
              <li>Extracts transcript (description as fallback)</li>
              <li>AI generates summary + outline</li>
              <li>Indexes content for AI chat search</li>
              <li>Module appears on Tutorials page immediately</li>
            </ol>
          </div>
        </div>
      )}

      {/* ── Web Pages Tab ── */}
      {activeTab === 'web' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Scrape Web Page (AI Knowledge Base)</h2>
            <p className="text-slate-500 text-sm mt-1">
              Add bar prep websites directly to the AI knowledge base via ingest-url.
            </p>
          </div>
          <form onSubmit={handlePageSubmit} className="space-y-4">
            <input type="url" value={pageUrl} onChange={e => setPageUrl(e.target.value)}
              placeholder="https://www.law.cornell.edu/wex/tort"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                         focus:outline-none focus:border-blue-500 transition-colors"
              disabled={loading} required />
            <button type="submit" disabled={loading || !pageUrl.trim()}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl
                         hover:bg-blue-700 transition-colors disabled:opacity-60
                         flex items-center justify-center gap-2 min-h-[48px]">
              {loading
                ? <><LoadingSpinner size="sm" color="white" /> Ingesting…</>
                : 'Add to AI Knowledge Base →'
              }
            </button>
          </form>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {QUICK_ADD_URLS.filter(u => u.url.includes('cornell.edu')).slice(0, 12)
              .map(({ label, url }) => (
                <button key={label + url} onClick={() => setPageUrl(url)}
                  className="p-2 text-left text-xs bg-slate-50 border border-slate-200
                             rounded-lg hover:bg-blue-50 hover:border-blue-300
                             text-slate-600 hover:text-blue-700 transition-colors">
                  📄 {label}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* ── PDF Tab ── */}
      {activeTab === 'pdf' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Upload Study Document</h2>
            <p className="text-slate-500 text-sm mt-1">Upload PDFs, notes, or guides. AI reads and indexes them.</p>
          </div>
          <form onSubmit={handlePdfUpload} className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center
                            hover:border-blue-400 transition-colors">
              <input type="file" accept=".pdf,.txt,.doc,.docx"
                onChange={e => setPdfFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4
                           file:rounded-lg file:border-0 file:text-sm file:font-medium
                           file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={uploading} />
              {pdfFile ? (
                <p className="mt-2 text-sm text-green-600 font-medium">
                  ✅ {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              ) : (
                <p className="text-slate-400 text-sm mt-2">PDF, TXT, DOC — up to 10MB</p>
              )}
            </div>
            <button type="submit" disabled={uploading || !pdfFile}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl
                         hover:bg-blue-700 transition-colors disabled:opacity-60
                         flex items-center justify-center gap-2 min-h-[48px]">
              {uploading
                ? <><LoadingSpinner size="sm" color="white" /> Uploading & Indexing…</>
                : 'Upload & Index Document →'
              }
            </button>
          </form>
        </div>
      )}

      {/* ── Modules Tab ── */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Course Modules ({modules.length})</h2>
            <button onClick={loadModules}
                    className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50">
              ↻ Refresh
            </button>
          </div>
          {loadingModules ? (
            <div className="bg-white border border-slate-200 rounded-xl py-12 flex justify-center">
              <LoadingSpinner size="lg" text="Loading modules..." />
            </div>
          ) : modules.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl text-center py-12">
              <p className="text-4xl mb-3">📚</p>
              <p className="text-slate-500 text-sm">No modules yet. Add YouTube videos in the Videos tab.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {modules.map(module => (
                <div key={module.id}
                     className="bg-white border border-slate-200 rounded-xl flex items-start gap-4 p-4">
                  {module.thumbnail_url && (
                    <img src={module.thumbnail_url} alt={module.title}
                      className="w-24 h-16 object-cover rounded-lg shrink-0 bg-slate-200"
                      onError={e => e.currentTarget.style.display = 'none'} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        {module.topic}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full
                        ${module.is_published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {module.is_published ? '✅ Published' : 'Draft'}
                      </span>
                    </div>
                    <h3 className="font-medium text-slate-900 text-sm truncate">{module.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{module.ai_summary}</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => handleTogglePublish(module.id, module.is_published)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors
                        ${module.is_published
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}>
                      {module.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    {module.video_url && (
                      <a href={module.video_url} target="_blank" rel="noopener noreferrer"
                         className="px-3 py-1 text-xs text-center text-blue-600 hover:underline">
                        Watch ↗
                      </a>
                    )}
                    <button onClick={() => handleDeleteModule(module.id)}
                      className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Scraper Tab ── */}
      {activeTab === 'scraper' && <ScraperTab />}

      {/* ── Blog Tab ── */}
      {activeTab === 'blog' && <BlogTab />}

      {/* ── Users Tab ── */}
      {activeTab === 'users' && <UsersTab />}

      {/* ── Chat History Tab ── */}
      {activeTab === 'chats' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Student Chat History</h2>
              <p className="text-slate-500 text-sm mt-0.5">Read-only view of all student AI Coach conversations.</p>
            </div>
            <button onClick={loadChatSessions}
                    className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50">
              ↻ Refresh
            </button>
          </div>

          {loadingChats ? (
            <div className="bg-white border border-slate-200 rounded-xl py-8 flex justify-center">
              <LoadingSpinner size="md" text="Loading sessions..." />
            </div>
          ) : chatsError ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div>
                  <h4 className="font-semibold text-amber-900">Backend support needed</h4>
                  <p className="text-amber-800 text-sm mt-1">{chatsError}</p>
                </div>
              </div>
            </div>
          ) : chatSessions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl text-center py-12">
              <p className="text-slate-500 text-sm">No chat sessions saved yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chatSessions.map(session => {
                const isOpen = expandedSession === session.id
                return (
                  <div key={session.id}
                       className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedSession(isOpen ? null : session.id)}
                      className="w-full flex items-center justify-between gap-3 px-5 py-4
                                 text-left hover:bg-slate-50 transition-colors">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {session.title || 'Untitled Chat'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {session.user_email || `User: ${session.user_id?.slice(0, 8)}…`}
                          {' · '}
                          {session.updated_at ? new Date(session.updated_at).toLocaleString() : 'N/A'}
                          {' · '}
                          {(session.messages || []).length} messages
                        </p>
                      </div>
                      <span className="text-slate-400 text-sm shrink-0">
                        {isOpen ? 'Hide ▲' : 'View ▼'}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-100 px-5 py-4 space-y-3
                                      bg-slate-50 max-h-96 overflow-y-auto">
                        {(session.messages || []).map((msg, i) => (
                          <div key={i}
                               className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm
                              ${msg.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-800'
                              }`}>
                              {msg.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
