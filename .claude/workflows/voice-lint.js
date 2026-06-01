export const meta = {
  name: 'voice-lint',
  description: 'Voice-consistency lint for the blog: discover posts, fingerprint the strong ones, lint every post against the fingerprint plus the hard CLAUDE.md style rules, rank offenders with quoted lines and fixes',
  whenToUse: 'Run before publishing, or periodically, to catch off-voice drift, em dashes, broken hooks, typos, and internal contradictions across all posts.',
  phases: [
    { title: 'Discover', detail: 'list posts, mark draft/length, nominate canonical posts for the fingerprint' },
    { title: 'Fingerprint', detail: 'derive the Dustin voice fingerprint from the canonical posts' },
    { title: 'Lint', detail: 'one agent per post scores against fingerprint + hard rules' },
    { title: 'Report', detail: 'rank worst offenders, quote offending lines, propose fixes' },
  ],
}

// args (all optional):
//   args.postsDir  -> directory to scan (default: src/content/posts)
//   args.canonical -> array of filenames to force as fingerprint sources (default: auto-pick)
const POSTS_DIR = (args && args.postsDir) || 'src/content/posts'
const FORCED_CANON = (args && Array.isArray(args.canonical)) ? args.canonical : null

const DISCOVERY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['postsDir', 'posts'],
  properties: {
    postsDir: { type: 'string', description: 'Absolute path actually scanned' },
    posts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['file', 'path', 'draft', 'words', 'canonical'],
        properties: {
          file: { type: 'string', description: 'Filename only' },
          path: { type: 'string', description: 'Absolute path to the post' },
          draft: { type: 'boolean', description: 'frontmatter draft:true ?' },
          words: { type: 'integer', description: 'Approx body word count' },
          canonical: { type: 'boolean', description: 'Use this post as a fingerprint source? True for the strongest published posts.' },
        },
      },
    },
  },
}

const FINGERPRINT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'traits', 'dashTic', 'hookStyle', 'antiPatterns'],
  properties: {
    summary: { type: 'string', description: 'One-paragraph description of the voice' },
    traits: { type: 'array', items: { type: 'string' }, description: 'Concrete recurring voice traits (rhythm, diction, casualness, profanity, second-person address, etc.)' },
    dashTic: { type: 'string', description: 'How the glued-hyphen em-dash substitute is used, and what consistent usage looks like' },
    hookStyle: { type: 'string', description: 'How strong posts open in the first two lines' },
    antiPatterns: { type: 'array', items: { type: 'string' }, description: 'Things that read as OFF-voice' },
  },
}

const LINT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['post', 'voiceScore', 'hookOk', 'violations', 'notes'],
  properties: {
    post: { type: 'string' },
    voiceScore: { type: 'integer', description: '0-100, how on-voice and rule-compliant the post is' },
    hookOk: { type: 'boolean', description: 'Does it hook in the first two lines?' },
    violations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['rule', 'severity', 'quote', 'why', 'suggestedFix'],
        properties: {
          rule: { type: 'string', enum: ['em-dash', 'dash-tic-inconsistent', 'not-terse', 'filler-preamble', 'weak-hook', 'off-voice', 'typo', 'internal-contradiction', 'placeholder', 'other'] },
          severity: { type: 'string', enum: ['block', 'warn', 'nit'] },
          quote: { type: 'string', description: 'The exact offending line(s), verbatim' },
          why: { type: 'string' },
          suggestedFix: { type: 'string' },
        },
      },
    },
    notes: { type: 'string' },
  },
}

const REPORT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['ranked', 'crossPostIssues', 'summary', 'topFixes'],
  properties: {
    ranked: {
      type: 'array',
      description: 'Posts worst-first',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['post', 'score', 'headline'],
        properties: {
          post: { type: 'string' },
          score: { type: 'integer' },
          headline: { type: 'string', description: 'One-line verdict' },
        },
      },
    },
    crossPostIssues: { type: 'array', items: { type: 'string' }, description: 'Inconsistencies spanning posts (voice drift, dash-tic usage differences)' },
    topFixes: { type: 'array', items: { type: 'string' }, description: 'Highest-impact concrete fixes, most important first' },
    summary: { type: 'string' },
  },
}

const HARD_RULES = `HARD RULES (from CLAUDE.md, non-negotiable):
- ZERO em dashes (the character "—"). Flag any as severity:block.
- Be terse. Short sentences. No filler, no preamble. Flag throat-clearing intros.
- A post must hook the reader in the first two lines.
Dustin's voice uses a GLUED HYPHEN as its em-dash substitute (e.g. "biology- and", "stealing part- I"). That is allowed, but it must be used consistently. Flag inconsistent or typo-like usage as dash-tic-inconsistent (severity:nit/warn).
Intentional doubled-letter texture ("prettty", "reallyyy", "willl") is ON-voice emphasis, NOT a typo. Do not flag it.
Also flag: real typos, internal contradictions (numbers/claims that conflict WITHIN the same post, including frontmatter description vs body), and empty/placeholder content.`

// ---- Phase 1: discover the catalog ----
phase('Discover')
const forcedNote = FORCED_CANON
  ? `\nForce these files to canonical=true (use them as the fingerprint sources): ${FORCED_CANON.join(', ')}.`
  : `\nAuto-pick canonical=true for the 2-4 strongest PUBLISHED (draft:false) posts: longest, most complete, most representative of the author's voice. Never mark an empty stub or a draft as canonical.`
const discovery = await agent(
  `List every blog post in ${POSTS_DIR} (relative to the repo root). For each: filename, absolute path, whether frontmatter has draft:true, and an approximate body word count. ` +
  `Use shell: \`ls\` the directory, read frontmatter, \`wc -w\` the bodies.` + forcedNote,
  { label: 'discover-posts', phase: 'Discover', schema: DISCOVERY_SCHEMA }
)
const posts = discovery.posts
const canon = posts.filter(p => p.canonical)
log(`Discovered ${posts.length} posts; ${canon.length} canonical for the fingerprint`)
if (!canon.length) throw new Error('No canonical posts found to build a fingerprint from')

// ---- Phase 2: build the voice fingerprint (barrier: every linter needs it) ----
phase('Fingerprint')
const fingerprint = await agent(
  `Read these canonical, strong blog posts and build a VOICE FINGERPRINT:
${canon.map(p => `- ${p.path}`).join('\n')}

Capture the actual rhythm and habits: short punchy sentences and fragments-as-hammers, second-person conspiratorial address, casual well-placed profanity, self-deprecating parenthetical asides, real-time reaction to his own analysis, deflation-after-rigor, period-as-emphasis ("Every. Single. One."), wry oversized section headers, the glued-hyphen dash tic, intentional doubled-letter texture, numbers dropped cold as rhetorical hammers, and how hooks open. Be concrete so a linter can compare other posts against this.`,
  { label: 'build-fingerprint', phase: 'Fingerprint', schema: FINGERPRINT_SCHEMA }
)
log(`Fingerprint built: ${fingerprint.traits.length} traits, ${fingerprint.antiPatterns.length} anti-patterns`)

// ---- Phase 3: lint every post in parallel against the fingerprint + hard rules ----
phase('Lint')
const fpJson = JSON.stringify(fingerprint, null, 2)
const lints = await parallel(
  posts.map(p => () =>
    agent(
      `Read this post and lint it for voice consistency and hard style rules: ${p.path}

VOICE FINGERPRINT to compare against:
${fpJson}

${HARD_RULES}

Quote offending lines VERBATIM. Be specific and fair. If the post is empty/stub, flag as placeholder. Check the frontmatter description against the body for contradictions (e.g. a dollar tally or count in the description that disagrees with the body). Score voiceScore 0-100.`,
      { label: `lint:${p.file}`, phase: 'Lint', schema: LINT_SCHEMA }
    )
  )
)
const results = lints.filter(Boolean)
log(`Linted ${results.length}/${posts.length} posts`)

// ---- Phase 4: synthesize the ranked report ----
phase('Report')
const report = await agent(
  `Synthesize a voice-lint report from these per-post results:

${JSON.stringify(results, null, 2)}

Rank posts worst-first by voiceScore and severity of violations. Surface CROSS-POST issues (voice drift, inconsistent dash-tic usage between posts). List the highest-impact concrete fixes first, block-severity first. Be terse (the author's own rule: short sentences, no filler).`,
  { label: 'synthesize-report', phase: 'Report', schema: REPORT_SCHEMA }
)

return { discovered: posts.length, canonical: canon.map(p => p.file), fingerprint, results, report }
