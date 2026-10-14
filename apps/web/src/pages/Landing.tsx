import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, FileAudio, Database, MapPin, Cpu, Code2,
  ScrollText, Fingerprint, Radio, ArrowRight, Lock, Users, Hourglass
} from 'lucide-react';

const CHALLENGES = [
  { icon: Clock,       title: 'Timeline forensics', body: 'Five systems, three time formats, one clock that is wrong. Normalise them and the official story falls apart.' },
  { icon: Radio,       title: 'Audio decoding',     body: 'A patient who has not spoken in three years answers by tapping on the arm of a chair.' },
  { icon: ScrollText,  title: 'Open-source research', body: 'A sealed police file. The key is a reading assignment described only by its plot.' },
  { icon: Database,    title: 'SQL',                body: 'An audit trail nobody thought to wipe. Find the row that should not exist.' },
  { icon: Fingerprint, title: 'Deduction',          body: 'Five statements, nine pieces of evidence. Four people are lying and only one lie matters.' },
  { icon: FileAudio,   title: 'Cipher',             body: 'A diary seized out of order, and a music box that does not play.' },
  { icon: MapPin,      title: 'Geolocation',        body: 'A photograph with no metadata, posted at the exact minute it needed to be.' },
  { icon: Cpu,         title: 'Digital electronics', body: 'A keypad on its own relay logic, with its own memory, that nobody thought about. One kit per team.' },
  { icon: Code2,       title: 'Code reading',       body: 'A short script found on a laptop. Read it, then undo what it did.' }
];

const RULES: Array<[string, string]> = [
  ['Teams', 'Three to four investigators. One terminal, one electronics kit, one case.'],
  ['Clock', 'Three hours. Your clock starts when your team signs in, not when the room does.'],
  ['Ranking', 'Fastest investigation wins. Hints are available and they cost you time.'],
  ['The ending', 'You do not name a suspect. You write the case, all of it.']
];

export const Landing: React.FC = () => {
  const ticks = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="lp night grain">
      <nav className="lp-nav">
        <span className="brand">THE LAST RECORDING</span>
        <span className="eyebrow" style={{ opacity: .75 }}>E-CESA · Abhiyantriki 2026</span>
        <span className="spacer" />
        <Link className="btn btn-ghost" to="/enter">
          <Lock size={14} aria-hidden="true" /> Team sign in
        </Link>
      </nav>

      {/* ── hero ─────────────────────────────────────────────────────────── */}
      <header className="hero">
        <div>
          <span className="hero-kicker">
            <Hourglass size={13} aria-hidden="true" /> Mumbai · 23 October 2026
          </span>

          <h1>
            A man was killed
            <span className="ghost">at 10:17 PM.</span>
          </h1>

          <p className="lede">
            That is what the clock on the floor says. It is what the detective wrote
            down, and it is the time every statement in the file has been built
            around.
          </p>
          <p className="lede">
            <strong>The clock is lying.</strong> So is somebody in this building, and
            by the end of the afternoon you will understand why the man investigating
            this death is so certain it is straightforward.
          </p>

          <div className="hero-cta">
            <Link className="btn btn-lg" to="/enter">
              Open the case file <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <a className="btn btn-ghost btn-lg" href="#brief">What you are walking into</a>
          </div>

          <dl className="hero-facts">
            <div>
              <dt>Duration</dt>
              <dd>3 hours</dd>
            </div>
            <div>
              <dt>Team size</dt>
              <dd>3-4</dd>
            </div>
            <div>
              <dt>Case files</dt>
              <dd>10</dd>
            </div>
            <div>
              <dt>Decided by</dt>
              <dd>The clock</dd>
            </div>
          </dl>
        </div>

        <div className="clockwrap">
          <div className="clockface" role="img" aria-label="A smashed brass desk clock, its hands stopped at 10:17">
            {ticks.map((i) => (
              <div
                key={i}
                className={`tick${i % 3 === 0 ? ' major' : ''}`}
                style={{ transform: `rotate(${i * 30}deg)` }}
              >
                <span />
              </div>
            ))}
            <div className="hand hour" />
            <div className="hand minute" />
            <div className="hand-pin" />
            <div className="crackline" />
          </div>
          <div className="clock-stamp">EXHIBIT 1 · TIME OF DEATH, DISPUTED</div>
        </div>
      </header>

      {/* ── the brief ────────────────────────────────────────────────────── */}
      <section className="band" id="brief">
        <div className="sect">
          <div className="sect-head">
            <span className="eyebrow">Case MUM/HOM/2026/2310</span>
            <h2>What you are walking into</h2>
            <p>
              Everything below is in the file before you start. Nothing here is a spoiler:
              it is the problem, not the answer.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <article className="sheet">
              <div className="stamphead">
                <span>Mumbai Police · Homicide</span>
                <span>Confidential</span>
              </div>
              <h3>The study</h3>
              <p>
                Dr. Elias Vane, consultant psychologist, is dead at his desk in a
                first-floor study on Ridge Road. The door is bolted on the inside. The
                security log records the last visitor leaving at 9:18 PM and nobody
                entering after.
              </p>
              <p>
                A brass desk clock lies smashed on the floor with its hands stopped at
                10:17. The police surgeon has read the body and does not agree with it.
              </p>
            </article>

            <article className="sheet bright">
              <div className="stamphead">
                <span>Closed file · 2 December 2023</span>
                <span>Not reopened</span>
              </div>
              <h3>Three years ago</h3>
              <p>
                A man named Julian Marsh died in another house, and the woman he was
                going to marry was found beside him. She was never charged. She was
                never believed either.
              </p>
              <p>
                She has not spoken out loud since. Dr. Vane was her therapist for all
                three of those years.
              </p>
              <blockquote>
                You will not be told these two deaths are connected. You will work it out.
              </blockquote>
            </article>
          </div>
        </div>
      </section>

      {/* ── challenges ───────────────────────────────────────────────────── */}
      <section className="sect">
        <div className="sect-head">
          <span className="eyebrow">What the case asks of you</span>
          <h2>Nine kinds of evidence, one investigation</h2>
          <p>
            These are not rounds and they are not levels. Each one is a thing the
            case needs you to establish before it will let you move. Most of them
            need no code at all.
          </p>
        </div>

        <div className="cgrid">
          {CHALLENGES.map(({ icon: Icon, title, body }) => (
            <article className="ccard" key={title}>
              <Icon className="ic" size={22} aria-hidden="true" />
              <h4>{title}</h4>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── rules ────────────────────────────────────────────────────────── */}
      <section className="band">
        <div className="sect">
          <div className="sect-head">
            <span className="eyebrow">Before you sit down</span>
            <h2>How it runs</h2>
          </div>

          <dl className="rules">
            {RULES.map(([k, v]) => (
              <div className="rule-item" key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>

          <div style={{ marginTop: 34 }}>
            <Link className="btn btn-lg" to="/enter">
              <Users size={16} aria-hidden="true" /> Sign your team in
            </Link>
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <span>E-CESA · K. J. Somaiya School of Engineering · Abhiyantriki 2026</span>
        <span className="eyebrow">Murder Mystery · Chapter Two</span>
      </footer>
    </div>
  );
};

export default Landing;
