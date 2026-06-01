export const meta = {
  name: 'ambient-art',
  description: 'Generate minimal New Yorker / Atlantic style line-art spot illustrations to break up a blog post, theme-proof SVG floated magazine-style.',
  whenToUse: 'When a post reads like a wall of text and needs ambient filler art (not data graphics). Pass the post filename or slug as args, e.g. Workflow({name:"ambient-art", args:"robin-hood-part-2"}). It plans placements, draws one theme-proof line-art SVG per slot, critiques each, then inserts the figures into the post.',
  phases: [
    { title: 'Plan', detail: 'Read post, pick 2-4 placement points, derive a concrete visual motif for each' },
    { title: 'Draw', detail: 'One agent per placement: emit theme-proof minimal line-art SVG to public/images/' },
    { title: 'Critique', detail: 'Per SVG: valid markup, theme-proof, truly minimal line art, no text' },
    { title: 'Place', detail: 'Insert all <figure> embeds into the post at the planned break points' },
  ],
}

// ambient-art: Plan -> pipeline(Draw -> Critique) -> single Place agent edits the post.
// Delivery format matches the existing house style (see public/images/robin-hood-*.svg):
//   standalone transparent SVG in public/images/, embedded via
//   <figure class="post-figure float-right|float-left"><img src alt/></figure>.
// THEME-PROOF RULE (critical): the site has light, dark, and rainbow themes. A single
// flat color vanishes on some of them. So every visible line is drawn TWICE — a wide
// black stroke under a thin white stroke (paint-order:stroke) — giving a haloed line
// that reads on any background while still looking like clean spot illustration.

const POST = (typeof args === 'string' && args.trim()) ? args.trim()
  : (args && args.post) ? String(args.post) : null

// ─── Shared house-style brief, handed to every drawing agent ───
const STYLE_BRIEF = `
HOUSE STYLE — minimal line-art spot illustration (New Yorker / Atlantic spot feel):
- Single subject, lots of negative space, suggestive not literal. Ambience, not data.
- NO text, NO labels, NO numbers anywhere in the art.
- Line drawing only: thin, confident strokes. No fills except where a small solid shape genuinely helps the silhouette.
- THEME-PROOF (mandatory): the SVG must read on light, dark, AND rainbow backgrounds.
  Achieve this by drawing each visible line as a wide black stroke UNDER a thin white stroke.
  Use stroke-only paths/shapes with paint-order="stroke", e.g. duplicate each path:
    <path d="..." fill="none" stroke="#000" stroke-width="5" opacity="0.5" stroke-linecap="round"/>
    <path d="..." fill="none" stroke="#fff" stroke-width="2"   stroke-linecap="round"/>
  (black halo wider+softer, white line on top, thinner.) Group with <g stroke-linejoin="round" paint-order="stroke">.
- Transparent background (no background rect that would fight a theme).
- viewBox roughly square-ish, width 280-420 so it floats beside body text without dominating.
- Keep it CLEAN: a good spot illustration is a dozen strokes, not a hundred.
`.trim()

// ─── Schemas ───
const PLAN_SCHEMA = {
  type: 'object', required: ['postFile', 'slug', 'placements'],
  properties: {
    postFile: { type: 'string', description: 'absolute path to the resolved post file' },
    slug: { type: 'string', description: 'kebab slug derived from the filename, used to name image files' },
    placements: {
      type: 'array', minItems: 1, maxItems: 4, items: {
        type: 'object', required: ['id', 'motif', 'float', 'anchorText', 'altSeed'],
        properties: {
          id: { type: 'string', description: 'short kebab id for this slot, e.g. "lonely-pit-lane"' },
          motif: { type: 'string', description: 'concrete single-subject visual to draw, tied to nearby text' },
          float: { type: 'string', enum: ['float-right', 'float-left'] },
          anchorText: { type: 'string', description: 'a verbatim line/sentence from the post AFTER which the figure should be inserted' },
          altSeed: { type: 'string', description: 'plain-language description for the eventual alt text' },
        },
      },
    },
  },
}
const DRAW_SCHEMA = {
  type: 'object', required: ['id', 'file', 'svg', 'alt'],
  properties: {
    id: { type: 'string' },
    file: { type: 'string', description: 'path written under public/images/, e.g. public/images/<slug>-<id>.svg' },
    svg: { type: 'string', description: 'the full SVG markup that was written' },
    alt: { type: 'string', description: 'descriptive alt text for the figure' },
  },
}
const CRITIQUE_SCHEMA = {
  type: 'object', required: ['id', 'pass', 'issues'],
  properties: {
    id: { type: 'string' },
    pass: { type: 'boolean', description: 'true if valid SVG, theme-proof, minimal line art, no text' },
    issues: { type: 'array', items: { type: 'string' } },
    fixedSvg: { type: 'string', description: 'if it failed and was fixable, the corrected SVG markup written back to the file; else empty' },
  },
}

// ─── Phase 1: Plan ───
phase('Plan')
const plan = await agent(
  `Resolve and read the blog post identified by: "${POST}".
It lives under src/content/posts/ (try exact filename, then <slug>.md, then <slug>.mdx). Read the whole post.

Decide where this post needs ambient filler art to break up walls of text. Choose 2-4 placement points
(fewer for short posts). For each, pick a CONCRETE single-subject visual motif drawn from the nearby prose —
something evocative, not a chart. Alternate float sides. For each placement, capture a verbatim line from the
post (anchorText) after which the figure should be inserted; pick lines that are unique in the document so they
can be matched exactly later. Derive a kebab slug from the filename for naming image files.

Return the plan. Do not edit anything yet.`,
  { schema: PLAN_SCHEMA, phase: 'Plan' }
)

if (!plan || !plan.placements || !plan.placements.length) {
  log('No placements produced — aborting.')
  return { error: 'planning produced no placements', post: POST }
}
log(`Planned ${plan.placements.length} illustration(s) for ${plan.slug}.`)

// ─── Phase 2+3: Draw each, then Critique each (pipelined, no barrier) ───
const drawn = await pipeline(
  plan.placements,
  (p) => agent(
    `${STYLE_BRIEF}

Draw ONE spot illustration for this placement in post "${plan.slug}":
  motif: ${p.motif}
  intended float: ${p.float}
  context: ${p.altSeed}

Write the finished SVG to: public/images/${plan.slug}-${p.id}.svg  (use the Write tool).
Then return {id:"${p.id}", file, svg, alt}. The alt must describe the drawing for a screen reader.`,
    { label: `draw:${p.id}`, phase: 'Draw', schema: DRAW_SCHEMA }
  ),
  (d, p) => {
    if (!d) return null
    return agent(
      `${STYLE_BRIEF}

Critique the SVG at ${d.file} (id "${d.id}"). Read the file. Check, strictly:
  1. Valid, well-formed SVG that will render.
  2. THEME-PROOF: every visible line is haloed (black-under / white-over); nothing relies on a single
     flat color that would disappear on a light, dark, or rainbow background. No opaque background rect.
  3. Truly MINIMAL line art — a spot illustration, not a busy diagram. Single subject, generous negative space.
  4. Absolutely NO text/labels/numbers in the art.
If it fails any check AND you can fix it, rewrite the file with the Write tool and return the corrected markup
as fixedSvg. Otherwise return pass=true and empty fixedSvg. Return {id, pass, issues, fixedSvg}.`,
      { label: `critique:${p.id}`, phase: 'Critique', schema: CRITIQUE_SCHEMA }
    ).then((c) => ({ ...d, critique: c }))
  }
)

const ready = drawn.filter(Boolean)
if (!ready.length) {
  log('No illustrations survived drawing/critique.')
  return { error: 'no illustrations produced', post: POST }
}

// ─── Phase 4: Place — one agent edits the post (single writer, no conflict) ───
phase('Place')
const figures = ready.map((d) => {
  const p = plan.placements.find((x) => x.id === d.id) || {}
  return {
    id: d.id,
    float: p.float || 'float-right',
    file: d.file,
    src: '/' + String(d.file).replace(/^public\//, ''),
    alt: d.alt,
    anchorText: p.anchorText || '',
  }
})

const placement = await agent(
  `Insert ambient figures into the post at ${plan.postFile}. Read it first.

For each figure below, insert this block immediately AFTER the line containing its anchorText (match the anchor
verbatim; if an anchor can't be found, insert the block at a sensible paragraph break near the top instead and
note it). Keep a blank line above and below each inserted block. Match the existing house embed exactly:

<figure class="post-figure FLOAT">
  <img src="SRC" alt="ALT" />
</figure>

Figures (in document order, top to bottom):
${JSON.stringify(figures, null, 2)}

Edit the post file with the Edit tool. Then return a short plain-text summary: which figures went in, at which
anchors, and any anchor that had to fall back.`,
  { phase: 'Place' }
)

return {
  post: plan.postFile,
  slug: plan.slug,
  count: ready.length,
  figures: figures.map((f) => ({ id: f.id, src: f.src, float: f.float })),
  critiques: ready.map((d) => ({ id: d.id, pass: d.critique && d.critique.pass, issues: (d.critique && d.critique.issues) || [] })),
  placementSummary: placement,
}
