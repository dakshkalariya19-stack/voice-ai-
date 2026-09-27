import { useMemo, useState } from "react";
import { sendMessage } from "./api.js";
import { useSpeech } from "./useSpeech.js";

const STORAGE_KEY = "self-study-academy-progress";

const modules = [
  { icon: "⌁", title: "Interactive Textbook", detail: "Continue Biology · Ch. 4.2", progress: 72, tone: "sage" },
  { icon: "∑", title: "Math Solver", detail: "Quadratic equations", progress: 48, tone: "blue" },
  { icon: "Aa", title: "Essay Coach", detail: "Argument & evidence", progress: 61, tone: "rose" },
  { icon: "◌", title: "Flashcards", detail: "Biology review deck", progress: 84, tone: "gold" },
];

const hubItems = [
  ["Planning", "Study Planner", "Exam Prep Center", "Daily Challenge", "Motivation Journal"],
  ["Discover", "Interactive Textbook", "Lesson Explainer", "Science Lab", "History Explorer", "Geography Center", "Coding Lab"],
  ["Practice", "Math Solver", "Homework Helper", "Mistake Analyzer", "Question Generator", "Past Paper Center"],
  ["Communicate", "Essay Coach", "Reading Trainer", "Vocabulary Center", "Grammar Practice", "Oral Presentation"],
  ["Recall", "Flashcard Creator", "Concept Mapper", "Notes Organizer", "Quiz Builder"],
  ["Library", "Progress Dashboard", "Virtual Library", "Subject Tutors", "Learning Paths"],
];

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}

export default function App() {
  const [active, setActive] = useState("Overview");
  const [query, setQuery] = useState("");
  const [completed, setCompleted] = useState(() => loadProgress());
  const [showTutor, setShowTutor] = useState(false);
  const [tutorInput, setTutorInput] = useState("");
  const [tutorMessages, setTutorMessages] = useState([]);
  const [tutorLoading, setTutorLoading] = useState(false);

  const updateTask = (id) => setCompleted((current) => {
    const next = { ...current, [id]: !current[id] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  });

  const filteredModules = useMemo(() => modules.filter((item) =>
    `${item.title} ${item.detail}`.toLowerCase().includes(query.toLowerCase())
  ), [query]);

  const handleTranscript = (text) => { if (text) askTutor(text); };
  const { sttSupported, isListening, startListening, stopListening, micError } = useSpeech({ onFinalTranscript: handleTranscript });

  async function askTutor(text = tutorInput) {
    const trimmed = text.trim();
    if (!trimmed || tutorLoading) return;
    const next = [...tutorMessages, { role: "user", content: trimmed }];
    setTutorMessages(next); setTutorInput(""); setTutorLoading(true);
    try {
      const reply = await sendMessage(next);
      setTutorMessages((current) => [...current, { role: "assistant", content: reply }]);
    } catch (error) {
      setTutorMessages((current) => [...current, { role: "assistant", content: "I couldn't reach the tutor right now. Try again in a moment." }]);
    } finally { setTutorLoading(false); }
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">S</span><span>Self-Study<br /><strong>Academy</strong></span></div>
        <div className="side-label">YOUR DESK</div>
        <nav>
          {["Overview", "My Learning", "Study Planner", "Progress"].map((item) => <button key={item} className={active === item ? "nav-item active" : "nav-item"} onClick={() => setActive(item)}><span>{item === "Overview" ? "⌂" : item === "Progress" ? "◒" : item === "Study Planner" ? "□" : "▤"}</span>{item}</button>)}
        </nav>
        <div className="side-label hub-label">LEARNING HUBS</div>
        <nav>{hubItems.map(([title, ...items]) => <button key={title} className="hub-nav" onClick={() => setActive(title)}><span className="hub-dot">{title.slice(0, 1)}</span>{title}<span className="chevron">›</span></button>)}</nav>
        <div className="library-card"><span className="library-icon">▥</span><div><strong>Virtual Library</strong><small>Browse 1,240 resources</small></div><span>›</span></div>
        <div className="profile"><div className="avatar">DK</div><div><strong>Daksh</strong><small>Grade 10 · Explorer</small></div><span className="more">•••</span></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> {active}</div><div className="top-actions"><label className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your library..." /></label><button className="icon-button" aria-label="Notifications">♢<i /></button><button className="avatar small">DK</button></div></header>
        <div className="content-wrap">
          <section className="welcome-row"><div><p className="eyebrow">SUNDAY, SEPTEMBER 27, 2026</p><h1>Good morning, Daksh.</h1><p className="subhead">A little progress, thoughtfully made, adds up.</p></div><button className="primary-button" onClick={() => setShowTutor(true)}><span>✦</span> Ask your tutor</button></section>
          <section className="focus-card"><div className="focus-copy"><span className="tag">TODAY'S FOCUS</span><h2>Photosynthesis &amp; Energy Conversion</h2><p>Biology · Chapter 4.2 · Intermediate tier</p><div className="focus-actions"><button className="dark-button" onClick={() => setActive("Interactive Textbook")}>Continue lesson <span>→</span></button><button className="text-button" onClick={() => updateTask("focus")}>Mark as complete</button></div></div><div className="focus-art"><div className="sun">☼</div><div className="plant">⌁</div><div className="leaf leaf-one" /><div className="leaf leaf-two" /><span className="orbit orbit-one" /><span className="orbit orbit-two" /></div></section>
          <div className="section-heading"><div><p className="eyebrow">KEEP GOING</p><h2>Your learning desk</h2></div><button className="view-link" onClick={() => setActive("My Learning")}>View all modules <span>→</span></button></div>
          <section className="module-grid">{filteredModules.map((item) => <article className={`module-card ${item.tone}`} key={item.title}><div className="module-icon">{item.icon}</div><h3>{item.title}</h3><p>{item.detail}</p><div className="progress-line"><span style={{ width: `${item.progress}%` }} /></div><div className="module-footer"><small>{item.progress}% complete</small><button onClick={() => setActive(item.title)}>Open <span>→</span></button></div></article>)}</section>
          <section className="lower-grid"><div className="panel"><div className="panel-heading"><div><p className="eyebrow">UP NEXT</p><h2>Today's study plan</h2></div><span className="date-pill">3 tasks</span></div><div className="task-list"><Task id="math" time="09:00 — 09:45" title="Practice quadratic equations" detail="Math Solver · 45 min" completed={completed.math} onChange={updateTask} /><Task id="review" time="10:00 — 10:15" title="Review biology flashcards" detail="Active Recall · 15 min" completed={completed.review} onChange={updateTask} /><Task id="journal" time="18:30 — 18:40" title="Write a daily reflection" detail="Motivation Journal · 10 min" completed={completed.journal} onChange={updateTask} /></div><button className="add-task">+ Add a task</button></div><div className="panel progress-panel"><div className="panel-heading"><div><p className="eyebrow">THIS WEEK</p><h2>Steady momentum</h2></div><span className="streak">7 day streak</span></div><div className="ring-wrap"><div className="progress-ring"><strong>68%</strong><small>weekly goal</small></div><div className="week-bars">{[34, 58, 42, 78, 62, 88, 25].map((height, i) => <div className="bar-group" key={i}><div className="bar"><span style={{ height: `${height}%` }} /></div><small>{["M", "T", "W", "T", "F", "S", "S"][i]}</small></div>)}</div></div><p className="encouragement">You’re building a reliable rhythm. <strong>Keep it gentle and consistent.</strong></p></div></section>
          <footer>Self-Study Academy <span>·</span> A quiet place to learn well <span className="footer-right">Made for focus, not distraction.</span></footer>
        </div>
      </main>
      {showTutor && <div className="modal-backdrop" onClick={() => setShowTutor(false)}><section className="tutor-modal" onClick={(e) => e.stopPropagation()}><button className="close-button" onClick={() => setShowTutor(false)}>×</button><p className="eyebrow">SUBJECT TUTOR</p><h2>What are you working through?</h2><p className="modal-intro">Ask for a hint, a concept breakdown, or a practice question. Your tutor will guide you without giving away the work.</p><div className="tutor-messages">{tutorMessages.length === 0 && <div className="starter-prompts"><button onClick={() => askTutor("Give me a hint for photosynthesis")}>Give me a hint for photosynthesis</button><button onClick={() => askTutor("Explain quadratic equations at an intermediate level")}>Explain quadratic equations</button></div>}{tutorMessages.map((message, i) => <div className={`tutor-message ${message.role}`} key={i}>{message.content}</div>)}{tutorLoading && <div className="tutor-message assistant">Thinking through that...</div>}</div>{micError && <p className="mic-error">{micError}</p>}<form className="tutor-input" onSubmit={(e) => { e.preventDefault(); askTutor(); }}><input value={tutorInput} onChange={(e) => setTutorInput(e.target.value)} placeholder="Write your question..." />{sttSupported && <button type="button" className={isListening ? "recording" : ""} onClick={() => isListening ? stopListening() : startListening()}>{isListening ? "■" : "◉"}</button>}<button type="submit">Send</button></form></section></div>}
    </div>
  );
}

function Task({ id, time, title, detail, completed, onChange }) { return <label className={`task ${completed ? "done" : ""}`}><input type="checkbox" checked={!!completed} onChange={() => onChange(id)} /><span className="checkmark">{completed ? "✓" : ""}</span><span className="task-time">{time}</span><span className="task-copy"><strong>{title}</strong><small>{detail}</small></span><span className="task-arrow">→</span></label>; }
