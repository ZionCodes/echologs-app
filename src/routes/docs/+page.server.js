import { highlight } from '$lib/server/highlight.js'

const snippets = {
  py_install: { code: `pip install echologs`, lang: 'shellscript' },

  py_install_dotenv: { code: `pip install python-dotenv`, lang: 'shellscript' },

  py_quickstart: { code: `import echologs

with echologs.run():
    # your existing code — nothing changes
    print("Hello from EchoLogs!")`, lang: 'python' },

  py_auto_init: { code: `import echologs
# SDK reads ECHOLOGS_API_KEY from os.environ automatically`, lang: 'python' },

  py_explicit_init: { code: `import echologs

echologs.init("el_your_api_key")`, lang: 'python' },

  py_context: { code: `import echologs

with echologs.run():
    print("Starting...")
    result = do_work()
    print("Done.")`, lang: 'python' },

  py_context_named: { code: `with echologs.run(name="invoice-puller"):
    ...`, lang: 'python' },

  py_decorator: { code: `import echologs

@echologs.monitor(name="invoice-puller")
def run():
    print("Running...")
    # your code here

run()`, lang: 'python' },

  py_errors: { code: `with echologs.run():
    # raises → marked FAIL, traceback captured, alerts sent, re-raised
    result = call_openai_api()
    process(result)`, lang: 'python' },

  py_ex_openai: { code: `from openai import OpenAI
import echologs

client = OpenAI()

with echologs.run(name="openai-summariser"):
    articles = fetch_articles()
    for article in articles:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": article["body"]}]
        )
        save_summary(article["id"], response.choices[0].message.content)
    print("Done.")`, lang: 'python' },

  py_ex_db: { code: `import psycopg2, os, echologs

with echologs.run(name="db-cleanup"):
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur  = conn.cursor()
    cur.execute("DELETE FROM logs WHERE created_at < NOW() - INTERVAL '90 days'")
    conn.commit()
    print("Done.")
    cur.close(); conn.close()`, lang: 'python' },

  py_ex_scheduler: { code: `from apscheduler.schedulers.blocking import BlockingScheduler
import echologs

scheduler = BlockingScheduler()

@scheduler.scheduled_job('cron', hour=9, minute=0)
def run():
    with echologs.run(name="daily-digest"):
        send_digest()
        print("Done.")

scheduler.start()`, lang: 'python' },

  // ── JavaScript ────────────────────────────────────────────────────
  js_install: { code: `npm install echologs`, lang: 'shellscript' },

  js_install_yarn: { code: `yarn add echologs`, lang: 'shellscript' },

  js_quickstart: { code: `import echologs from 'echologs'

// ECHOLOGS_API_KEY is read from process.env automatically
console.log('Fetching invoices...')
const data = await fetchInvoices()
console.log('Done. ' + data.length + ' processed.')`, lang: 'javascript' },

  js_auto_init: { code: `import echologs from 'echologs'
// Reads ECHOLOGS_API_KEY from process.env automatically
// Production: set in Railway, Render, GitHub Actions etc
// Local dev:  node --env-file=.env your_script.js`, lang: 'javascript' },

  js_explicit_init: { code: `import echologs from 'echologs'

echologs.init('el_your_api_key', { name: 'my-script' })`, lang: 'javascript' },

  js_context: { code: `import echologs from 'echologs'

// Auto-monitors the whole script on import — no wrapper needed
console.log('Starting...')
const result = await doWork()
console.log('Done.')`, lang: 'javascript' },

  js_context_named: { code: `import echologs from 'echologs'

// Explicit wrapper if you need a custom name
await echologs.run(async () => {
  await doWork()
}, { name: 'invoice-puller' })`, lang: 'javascript' },

  js_decorator: { code: `import echologs from 'echologs'

const run = echologs.monitor(async () => {
  console.log('Running...')
}, { name: 'invoice-puller' })

await run()`, lang: 'javascript' },

  js_errors: { code: `import echologs from 'echologs'

// Unhandled errors caught automatically
// Marked as FAIL, stack captured, alerts sent, exits with code 1
const result = await callOpenAI()
process(result)`, lang: 'javascript' },

  js_ex_openai: { code: `import OpenAI from 'openai'
import echologs from 'echologs'

const openai = new OpenAI()
const articles = await fetchArticles()

for (const article of articles) {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: article.body }]
  })
  await saveSummary(article.id, res.choices[0].message.content)
}
console.log('Done.')`, lang: 'javascript' },

  js_ex_cron: { code: `import cron from 'node-cron'
import echologs from 'echologs'

cron.schedule('0 9 * * *', async () => {
  await echologs.run(async () => {
    await sendDailyDigest()
    console.log('Done.')
  }, { name: 'daily-digest' })
})`, lang: 'javascript' },

  js_ex_stripe: { code: `import Stripe from 'stripe'
import echologs from 'echologs'

const stripe = new Stripe(process.env.STRIPE_KEY)
const invoices = await stripe.invoices.list({ limit: 100 })
console.log('Syncing ' + invoices.data.length + ' invoices')
await syncToDatabase(invoices.data)
console.log('Done.')`, lang: 'javascript' },

  // ── Environment ───────────────────────────────────────────────────
  env_file: { code: `ECHOLOGS_API_KEY=el_your_api_key_here`, lang: 'shellscript' },

  env_py_dotenv_import: { code: `from dotenv import load_dotenv
load_dotenv()  # loads .env file into os.environ
import echologs

with echologs.run():
    print("Running...")`, lang: 'python' },

  env_py_export: { code: `# Set once per terminal session — never touches your code
export ECHOLOGS_API_KEY=el_your_api_key_here   # mac / linux
set    ECHOLOGS_API_KEY=el_your_api_key_here   # windows

python your_script.py`, lang: 'shellscript' },

  env_js_local: { code: `# Node.js 20.6+ — reads .env file directly, no package needed
node --env-file=.env your_script.js`, lang: 'shellscript' },

  env_linux:  { code: `export ECHOLOGS_API_KEY=el_your_api_key_here`, lang: 'shellscript' },
  env_windows: { code: `set ECHOLOGS_API_KEY=el_your_api_key_here`,   lang: 'shellscript' },
  env_github:  { code: `env:\n  ECHOLOGS_API_KEY: \${{ secrets.ECHOLOGS_API_KEY }}`, lang: 'yaml' },
}

export async function load({ locals: { safeGetSession } }) {
  const { session, user } = await safeGetSession()

  const entries = await Promise.all(
    Object.entries(snippets).map(async ([key, { code, lang }]) => {
      const html = await highlight(code, lang)
      return [key, { html, raw: code }]
    })
  )

  return {
    snippets: Object.fromEntries(entries),
    user:     session ? user : null,
  }
}