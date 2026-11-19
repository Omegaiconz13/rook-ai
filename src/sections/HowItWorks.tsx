import type { ComponentProps } from 'react'

import { Badge } from '../components/Badge'
import { Container } from '../components/Container'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { STEPS } from '../content'
import { useInView } from '../lib/useInView'

const TONE: Record<'info' | 'pass' | 'block', ComponentProps<typeof Badge>['tone']> = {
  info: 'neutral',
  pass: 'leaf',
  block: 'danger',
}

export function HowItWorks() {
  const [ref, seen] = useInView<HTMLDivElement>()
  return (
    <section id="how-it-works" className="relative overflow-hidden border-y border-line bg-night py-28 md:py-36">
      <div aria-hidden className="absolute -right-40 top-1/2 size-[640px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(47_194_76/0.22),transparent_65%)] blur-2xl" />
      <Container className="relative grid items-center gap-16 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <SectionHeading eyebrow={STEPS.eyebrow} title={STEPS.title} />
          <ol className="mt-12 grid gap-8">
            {STEPS.items.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 100} className="grid grid-cols-[56px_1fr] gap-5">
                <span className="font-mono text-[14px] text-leaf-text">{s.n}</span>
                <span>
                  <span className="block text-[20px] font-medium tracking-[-0.02em]">{s.title}</span>
                  <span className="mt-2 block text-[15.5px] leading-relaxed text-muted">{s.body}</span>
                </span>
              </Reveal>
            ))}
          </ol>
        </div>

        <div ref={ref} className="glass rounded-[32px] p-5 sm:p-7" aria-label="An example decision from the desk">
          <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
            <p className="font-mono text-[13.5px] text-soft">TSLA · 19 Nov 2026</p>
            <span className="text-[12.5px] text-faint">1R target · sample</span>
          </div>
          <div className="grid gap-4">
            {seen &&
              STEPS.demo.map((m, i) => (
                <div key={m.role} className="animate-pop rounded-2xl border border-line bg-panel/60 p-4" style={{ animationDelay: `${i * 650}ms` }}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12.5px] uppercase tracking-[0.12em] text-faint">{m.role}</span>
                    <Badge tone={TONE[m.verdict]} className="h-6 px-2.5 text-[11px]">
                      {m.verdict === 'block' ? 'blocks' : 'note'}
                    </Badge>
                  </div>
                  <p className="mt-2 text-[14.5px] leading-snug text-soft">{m.text}</p>
                </div>
              ))}
            {seen && (
              <p className="animate-pop text-[12.5px] text-faint" style={{ animationDelay: '2100ms' }}>
                Logged to the journal. No order sent, and the refusal has a rule id.
              </p>
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}
