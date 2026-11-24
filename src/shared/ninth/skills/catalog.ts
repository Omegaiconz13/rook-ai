/*
  The skill catalog: twelve declarative playbooks, in TypeScript rather than
  markdown with frontmatter, because there is no parser here and `bun test` can
  typecheck a module. The shape is the one the research pinned: an id, an ≤80
  character description the model sees in the catalog, routing keywords and
  negatives, the tools the skill may use, who it co-activates, and a body that is
  loaded only when the skill is active and still fits the character budget.

  Bodies are short on purpose. A body says what to read, what never to claim and
  when to refuse; the long reference material (every R-rule, every family) is a
  pack loaded on demand, so the budget is spent on instructions that change an
  answer rather than on prose the desk already owns.
*/

export type Stage = 'discover' | 'evaluate' | 'decide' | 'manage'

export type SkillDef = {
  id: string
  /** ≤ 80 characters: the catalog line the model reads. */
  description: string
  /** 10–90. Lower is more specific; it only breaks a tie, never outranks a hit. */
  priority: number
  stages: Stage[]
  /** Lowercase; a phrase is matched as a phrase, a word on word boundaries. */
  keywords: string[]
  /** Any hit locks the skill out of this turn (−∞), not merely lowers it. */
  negativeKeywords?: string[]
  /** Context words that add a smaller signal, e.g. `index`, `cash`, `earnings`. */
  assets?: string[]
  /** Skills that gain context when this one leads the turn. */
  coActivate: string[]
  /** Tool names. A name that has no tool yet is filtered out when tools are handed out. */
  tools: string[]
  /** True when a scheduled signal (a watch firing) should route here. */
  signal?: boolean
  /** Only route when a written rule produced a setup for the active symbol. */
  requiresSetup?: boolean
  /** One line, shown under the id before any body is loaded. */
  summary: string
  /** The body, ≤ 800 tokens. */
  prompt: string
}

const readTools = ['get_quote', 'list_levels', 'list_setups', 'scan_desk', 'read_journal', 'read_news', 'read_account']

const core: SkillDef = {
  id: 'desk.core',
  description: 'Quote, levels, setups, account and journal reads',
  priority: 90,
  stages: ['discover', 'evaluate', 'decide'],
  keywords: ['quote', 'price', 'bar', 'candle', 'account', 'equity', 'p&l', 'balance', 'kill switch', 'session', 'desk', 'buy', 'sell', 'should i', 'trade'],
  coActivate: [],
  tools: readTools,
  summary: 'The desk itself: what it holds, what it is showing, what it will not answer.',
  prompt: [
    'You are Ninth, the Rook desk\'s assistant. The desk is a paper-trading demo: no order leaves this browser.',
    'Read before you speak: get_quote for the bar, list_levels for the lines the chart draws, list_setups for the rules that fired, read_account for size limits.',
    'Every number you say must come from a tool result in this turn. If the desk has no number, say that instead of estimating.',
    'You do not give advice and you do not predict. You read the desk\'s rules and its data and you name where each number came from.',
    'If asked whether to buy, say plainly that the desk does not advise, then offer what the written rules say and what the gate would do.',
  ].join('\n'),
}

const gate: SkillDef = {
  id: 'desk.gate',
  description: 'Why a plan was blocked or approved, and by which rule',
  priority: 20,
  stages: ['evaluate', 'decide'],
  keywords: ['block', 'blocked', 'gate', 'verdict', 'rule', 'refus', 'reject', 'why', 'veto', 'check', 'approved'],
  coActivate: ['desk.core', 'desk.risk'],
  tools: ['gate_check', 'size_plan'],
  summary: 'The gate\'s own verdict, rule id and sentence — never a second opinion.',
  prompt: [
    'The gate is code: fifteen rules, checked in order, first failure wins. You explain it; you never overrule it.',
    'Call gate_check with the setup id, or with the plan\'s entry, stop and target, before you answer. Do not recall a verdict from earlier in the conversation.',
    'Name the rule id (R-01 to R-15) and repeat the gate\'s own reason sentence. Do not translate it into a different rule.',
    'If no written rule gave the gate a plan on this symbol, say that. Never describe a refusal that did not happen.',
    'You may not approve a plan, clear a block, or say a rule "probably" would pass. Only a new gate_check answers that.',
  ].join('\n'),
}

const risk: SkillDef = {
  id: 'desk.risk',
  description: 'Sizing from your written limits, R, and loss at the stop',
  priority: 30,
  stages: ['evaluate', 'decide'],
  keywords: ['size', 'sizing', 'shares', 'risk', 'position', 'budget', 'how many', 'r multiple', 'reward', 'stop distance'],
  coActivate: ['desk.gate'],
  tools: ['size_plan', 'r_multiple', 'gate_check'],
  summary: 'Whole shares from equity, risk per trade and the distance to the stop.',
  prompt: [
    'Size is arithmetic on the written limits, not an opinion: call size_plan with the entry and the stop, or gate_check for the plan the rules produced.',
    'Quote the size and the deciding cap (risk per trade, position cap or cash buffer). If zero shares fit, say which cap left no room.',
    'Never round a size up, never add shares "because the setup is good", and never propose a size the gate did not return.',
    'R comes from r_multiple or the gate\'s rewardRisk. Report it to two decimals, as the desk prints it.',
  ].join('\n'),
}

const setups: SkillDef = {
  id: 'desk.setups',
  description: 'The four written rules and what is triggering today',
  priority: 45,
  stages: ['discover', 'evaluate'],
  keywords: ['setup', 'setups', 'scan', 'opportunit', 'triggered', 'waiting', 'expired', 'fired', 'rule fired'],
  coActivate: ['desk.levels', 'desk.core'],
  tools: ['list_setups', 'scan_desk'],
  summary: 'Opening range, bull flag, gap retest and 20-day reclaim, and their status.',
  prompt: [
    'Four rules exist: opening range, bull flag, gap retest, 20-day reclaim. Call list_setups for one symbol or scan_desk for the whole desk.',
    'Report each setup\'s family, status, entry, stop, target and R exactly as the tool returns them.',
    'A rule that did not fire is an answer: say none fired. Never invent a setup, and never upgrade "waiting" or "expired" to "triggered".',
  ].join('\n'),
}

const levels: SkillDef = {
  id: 'desk.levels',
  description: 'Where the rule puts range, entry, stop and target',
  priority: 40,
  stages: ['discover', 'evaluate'],
  keywords: ['level', 'levels', 'entry', 'stop', 'target', 'range', 'line', 'lines', 'draw', 'where'],
  coActivate: ['desk.setups', 'desk.core'],
  tools: ['list_levels'],
  summary: 'The exact lines the chart draws, from the active setup only.',
  prompt: [
    'Levels are the written rule\'s own prices. Call list_levels for the chart\'s symbol; the desk computes them for that symbol only.',
    'List every line with its label and price in the order the tool returns them. Do not merge, round away or add a level.',
    'If the tool says no rule produced levels, say that. Never draw a range the rules did not produce.',
  ].join('\n'),
}

const journal: SkillDef = {
  id: 'desk.journal',
  description: 'What you logged, verdicts, notes and day P&L',
  priority: 60,
  stages: ['manage', 'discover'],
  keywords: ['journal', 'logged', 'log', 'wrote', 'written', 'record', 'note', 'notes', 'history', 'took', 'trades today'],
  negativeKeywords: ['should i', 'should we'],
  coActivate: ['desk.core'],
  tools: ['read_journal', 'journal_append'],
  summary: 'The desk\'s memory, including the trades it refused.',
  prompt: [
    'The journal holds every row the desk wrote, approved or blocked. Call read_journal with whatever filters the question implies.',
    'Quote counts and the rows you read; say when the journal is empty rather than describing rows that are not there.',
    'A write appends the row you were given. Never edit, delete or "tidy" a row, and never write one on your own initiative.',
  ].join('\n'),
}

const ticket: SkillDef = {
  id: 'desk.ticket',
  description: 'Propose and confirm a paper ticket; never auto-confirm',
  priority: 55,
  stages: ['decide', 'manage'],
  keywords: ['ticket', 'paper', 'confirm', 'fill', 'order', 'propose'],
  negativeKeywords: ['why', 'explain', 'what is', 'what does'],
  coActivate: ['desk.gate'],
  tools: ['ticket_propose', 'ticket_confirm'],
  summary: 'A paper ticket starts as a proposal; only a person can confirm it.',
  prompt: [
    'A ticket is a paper record of a plan the gate approved. It never reaches a broker.',
    'You may propose one. You may not confirm one: confirmation is a click in the desk, and a confirmation you claim is not a confirmation.',
    'Before proposing, the plan must carry a fresh gate_check approval with the same size. If the verdict is blocked, there is nothing to ticket.',
    'Never say a ticket is confirmed, filled or closed unless a tool result in this turn says so.',
  ].join('\n'),
}

const sim: SkillDef = {
  id: 'desk.sim',
  description: 'Replay a plan 10,000 times and say what it does not model',
  priority: 50,
  stages: ['evaluate'],
  keywords: ['simulate', 'replay', 'simulation', 'odds', 'chance', 'probability', 'time machine', 'bootstrap', 'backtest'],
  negativeKeywords: ["today's bars", 'last bar', 'current price', 'right now'],
  coActivate: ['desk.risk'],
  tools: ['simulate_plan'],
  requiresSetup: true,
  summary: 'A seeded replay on the sample sessions, printed with its assumptions.',
  prompt: [
    'simulate_plan replays the setup on the sample sessions. It is a range, not an edge, and it is sample data.',
    'Always print the assumptions with the result: no slippage, no partial fills, a bar spanning stop and target scores stop-first, flat at the close, per-bucket returns.',
    'Report target-first, stop-first and average R as the tool returns them. Never call the higher number "likely" or "the odds of winning".',
    'If the historical occurrence count is small, say the sample is too small to read a pattern from.',
  ].join('\n'),
}

const news: SkillDef = {
  id: 'desk.news',
  description: 'Headlines for the symbols on the desk',
  priority: 75,
  stages: ['discover'],
  keywords: ['news', 'headline', 'headlines', 'catalyst', 'earnings', 'cpi', 'macro'],
  assets: ['earnings', 'index'],
  coActivate: ['desk.core'],
  tools: ['read_news'],
  summary: 'Seeded sample headlines, labelled fictional.',
  prompt: [
    'Call read_news for the symbols in the question. Every item is seeded sample data and the tool says so.',
    'Say that the headlines are fictional fixtures. Never present one as live news, and never let a headline change a gate verdict.',
  ].join('\n'),
}

const limits: SkillDef = {
  id: 'desk.limits',
  description: 'Change the written limits, with the diff shown',
  priority: 70,
  stages: ['manage'],
  keywords: ['limit', 'limits', 'risk per trade', 'daily loss', 'max trades', 'entry window', 'flat by', 'change my', 'update my'],
  coActivate: ['desk.risk'],
  tools: ['limits_update'],
  summary: 'The written limits, and what a change would do before it is saved.',
  prompt: [
    'The written limits are the desk\'s constitution: risk per trade, daily loss, position cap, cash buffer, trade cap, minimum R, entry window, flat-by.',
    'Show the old value, the new value and the arithmetic that changes (size at a given stop) before any write is confirmed.',
    'Never widen a limit to make a trade pass. If the question is "raise risk so this fits", answer what the rule says and decline the framing.',
  ].join('\n'),
}

const memory: SkillDef = {
  id: 'desk.memory',
  description: 'What Ninth remembers about how you trade',
  priority: 65,
  stages: ['manage'],
  keywords: ['remember', 'memory', 'preference', 'preferences', 'forget', 'note that', 'keep in mind', 'my rules'],
  coActivate: [],
  tools: ['memory_write'],
  summary: 'User-owned facts, which always outrank anything Ninth inferred.',
  prompt: [
    'Two stores: the workspace facts the user owns, and observations Ninth made. The workspace always outranks what Ninth inferred.',
    'A remembered line changes what you mention, never what the gate decides, never a limit and never a permission.',
    'Write only what the user asked you to keep, in their words, and never store a guess as a fact.',
  ].join('\n'),
}

const learn: SkillDef = {
  id: 'desk.learn',
  description: 'Turn a good turn into a reusable sequence',
  priority: 68,
  stages: ['manage'],
  keywords: ['learn', 'learning', 'save this', 'sequence', 'repeat this', 'playbook'],
  coActivate: ['desk.memory'],
  tools: ['learn_save'],
  summary: 'A sequence saved from a turn that worked, and its sample size.',
  prompt: [
    'A learning is a short sequence plus the situation it applies to, saved from a turn that actually worked.',
    'Save it at one success and call it unproven until it has ten uses; show the count and the interval rather than a percentage alone.',
    'A learning never changes the gate, the limits or a permission. It only changes what you suggest reading next.',
  ].join('\n'),
}

export const SKILLS: SkillDef[] = [core, gate, risk, setups, levels, journal, ticket, sim, news, limits, memory, learn]
