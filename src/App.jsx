import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from "react";
import {
  Home, RefreshCw, CalendarDays, ListChecks, BookOpen, History, BarChart3,
  ClipboardList, Play, Plus, Flame, Target, Clock, Check,
  Trash2, Pencil, X, ChevronRight, TrendingUp, Circle, CheckCircle2,
  Timer as TimerIcon, Menu, Crosshair, Zap, Sun, Moon, RotateCcw, LogOut,
  GraduationCap, FileText, ChevronLeft, AlertCircle, Award, Filter
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { supabase } from "./supabaseClient";
import { EDITAIS, SEED_DATAPREV, SEED_BB } from "./data/editais";
import { PROVAS } from "./data/provas";

/* ============================ Temas ============================ */
const BRAND = "#0B2A5B";        // navy da marca (fixo nos dois temas)
const DISC_COLORS = ["#2D6BE0", "#F5B301", "#159A6C", "#7C5CFC", "#E5484D", "#0EA5B7", "#EC6D1F", "#3B82F6", "#DB2777"];
const LIGHT = {
  bg: "#F5F7FA", surface: "#FFFFFF", surface2: "#FFFFFF",
  ink: "#0B2A5B", inkSoft: "#1E3A6B", muted: "#6B7280", line: "#E6EAF0",
  gold: "#C98A00", goldSoft: "#FFF4D6", green: "#159A6C", greenSoft: "#E4F5EE",
  red: "#D5383D", redSoft: "#FCE9E9",
};
const DARK = {
  bg: "#0E1420", surface: "#161E2E", surface2: "#1B2536",
  ink: "#E8EDF5", inkSoft: "#B7C2D6", muted: "#8A96AC", line: "#28324A",
  gold: "#F5B301", goldSoft: "#33290F", green: "#37C79A", greenSoft: "#122E26",
  red: "#F0686C", redSoft: "#3A1E20",
};
const ThemeCtx = createContext(LIGHT);
const useC = () => useContext(ThemeCtx);
const inputStyle = (C) => ({ border: `1px solid ${C.line}`, background: C.surface2, color: C.ink });
const inputCls = "w-full px-3 py-2 rounded-lg text-sm outline-none";

/* ============================================================
   STUDY NOW — Dataprev / Arquitetura
   Base verticalizada com peso, nº de questões e incidência histórica
   sobre os temas mais relevantes para a trilha de arquitetura.
   ============================================================ */

const CONCURSOS = [
  { id: "dataprev-arq", label: "Dataprev", subtitle: "Arquitetura de Software", seed: SEED_DATAPREV,
    seedSimsData: [
      { name: "Dataprev 2024 — Arquitetura", date: "2024-11-17" },
      { name: "Dataprev 2023 — Arquitetura", date: "2023-10-22" },
    ],
  },
  { id: "bb-at", label: "BB", subtitle: "Agente de Tecnologia", seed: SEED_BB,
    seedSimsData: [
      { name: "BB 2023 — Agente de Tecnologia", date: "2023-10-29" },
      { name: "BB 2022 — Agente de Tecnologia", date: "2022-07-10" },
    ],
  },
];

const REVIEW_INTERVALS = [1, 3, 7, 15, 30];
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/* ============================ Helpers ============================ */
const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const fmtMin = (m) => { const h = Math.floor(m / 60), mm = m % 60; return h ? `${h}h${mm ? String(mm).padStart(2, "0") : ""}` : `${mm}min`; };
const fmtDate = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
const startOfWeek = (iso) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0, 10); };
let CURRENT_USER_ID = null;
export function setCurrentUser(id) { CURRENT_USER_ID = id; }

const store = {
  async get(k, def) {
    try {
      if (!CURRENT_USER_ID) return def;
      const { data, error } = await supabase
        .from("app_state").select("value")
        .eq("user_id", CURRENT_USER_ID).eq("key", k).maybeSingle();
      if (error) { console.error(error); return def; }
      return data ? data.value : def;
    } catch (e) { console.error(e); return def; }
  },
  async set(k, v) {
    try {
      if (!CURRENT_USER_ID) return;
      const { error } = await supabase
        .from("app_state")
        .upsert({ user_id: CURRENT_USER_ID, key: k, value: v, updated_at: new Date().toISOString() },
                { onConflict: "user_id,key" });
      if (error) console.error(error);
    } catch (e) { console.error(e); }
  },
};
/* ===== Conteúdo global (edital + provas) — Supabase com fallback local ===== */
// Ids estáveis derivados do índice: mesmos no app e no seed do banco.
function buildDiscFromEdital(concursoId, edital) {
  return edital.map((s, i) => ({
    id: `${concursoId}-d${i}`,
    name: s.name, block: s.block, peso: s.peso, q: s.q,
    color: DISC_COLORS[i % DISC_COLORS.length],
    topics: (s.topics || []).map((t, j) => ({ id: `${concursoId}-d${i}-t${j}`, num: t.num, name: t.name, hits: t.hits, studied: false })),
  }));
}

async function fetchEdital(concursoId) {
  try {
    const { data, error } = await supabase
      .from("editais").select("disciplinas")
      .eq("concurso_id", concursoId).maybeSingle();
    if (error) throw error;
    if (data && Array.isArray(data.disciplinas) && data.disciplinas.length) return data.disciplinas;
  } catch (e) { console.error("fetchEdital: usando fallback local —", e?.message || e); }
  return EDITAIS[concursoId] || [];
}

// Reaplica a estrutura global do edital preservando ids e progresso (studied) por nome.
function mergeEdital(saved, globalDisc) {
  return globalDisc.map((g) => {
    const old = (saved || []).find((o) => o.name === g.name);
    return {
      ...g,
      id: old?.id || g.id,
      color: old?.color || g.color,
      topics: g.topics.map((gt) => {
        const ot = old?.topics?.find((o) => o.name === gt.name);
        return { ...gt, id: ot?.id || gt.id, studied: ot?.studied || false };
      }),
    };
  });
}

function provaFromRow(r) {
  return {
    id: r.id, titulo: r.titulo, banca: r.banca, ano: r.ano, data: r.data,
    totalQuestoes: r.total_questoes, fonte: r.fonte,
    especificosDiscs: r.especificos_discs || [],
    disciplinas: r.disciplinas || {},
    questoes: r.questoes || [],
  };
}

async function fetchProvas(concursoId) {
  try {
    const { data, error } = await supabase
      .from("provas").select("*")
      .eq("concurso_id", concursoId).order("ano", { ascending: false });
    if (error) throw error;
    if (data && data.length) return data.map(provaFromRow);
  } catch (e) { console.error("fetchProvas: usando fallback local —", e?.message || e); }
  return PROVAS[concursoId] || [];
}


function autoCycle(disc) {
  const totalPeso = disc.reduce((a, d) => a + d.peso, 0);
  const totalMin = 900;
  return [...disc].sort((a, b) => b.peso - a.peso).map((d, i) => ({
    id: uid(), disciplineId: d.id, order: i,
    targetMinutes: Math.max(30, Math.round((d.peso / totalPeso) * totalMin / 15) * 15), doneMinutes: 0,
  }));
}

function seedSims(disc, simData) {
  const mk = () => disc.map((d) => ({ disciplineId: d.id, right: 0, total: d.q }));
  return simData.map((s) => ({ id: uid(), name: s.name, date: s.date, rows: mk() }));
}

/* ============================ App ============================ */
function StudyApp({ onLogout, concurso, setConcurso }) {
  const CK = (k) => `${concurso.id}_${k}`;
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home");
  const [navOpen, setNavOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const [disciplines, setDisciplines] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [cycle, setCycle] = useState({ mode: "auto", blocks: [] });
  const [plan, setPlan] = useState([]);
  const [goals, setGoals] = useState({ hours: 20, questions: 200 });
  const [simulados, setSimulados] = useState([]);

  const C = theme === "dark" ? DARK : LIGHT;

  useEffect(() => {
    (async () => {
      setTheme(await store.get("theme", "light"));
      let d = await store.get(CK("disc"), null);
      if (!d) {
        const edital = await fetchEdital(concurso.id);
        d = buildDiscFromEdital(concurso.id, edital);
        await store.set(CK("disc"), d);
      }
      setDisciplines(d);
      setSessions(await store.get(CK("sess"), []));
      setReviews(await store.get(CK("rev"), []));
      setPlan(await store.get(CK("plan"), []));
      let sm = await store.get(CK("sim"), null); if (!sm) { sm = seedSims(d, concurso.seedSimsData); await store.set(CK("sim"), sm); } setSimulados(sm);
      setGoals(await store.get(CK("goals"), { hours: 20, questions: 200 }));
      let cy = await store.get(CK("cycle"), null);
      if (!cy) { cy = { mode: "auto", blocks: autoCycle(d) }; await store.set(CK("cycle"), cy); }
      setCycle(cy);
      setLoading(false);
    })();
  }, []);

  useEffect(() => { document.body.style.background = C.bg; }, [C]);
  useEffect(() => { if (!loading) store.set("theme", theme); }, [theme, loading]);
  useEffect(() => { if (!loading) store.set(CK("disc"), disciplines); }, [disciplines, loading]);
  useEffect(() => { if (!loading) store.set(CK("sess"), sessions); }, [sessions, loading]);
  useEffect(() => { if (!loading) store.set(CK("rev"), reviews); }, [reviews, loading]);
  useEffect(() => { if (!loading) store.set(CK("cycle"), cycle); }, [cycle, loading]);
  useEffect(() => { if (!loading) store.set(CK("plan"), plan); }, [plan, loading]);
  useEffect(() => { if (!loading) store.set(CK("goals"), goals); }, [goals, loading]);
  useEffect(() => { if (!loading) store.set(CK("sim"), simulados); }, [simulados, loading]);

  const discById = useMemo(() => Object.fromEntries(disciplines.map((d) => [d.id, d])), [disciplines]);

  function registerStudy({ disciplineId, topicId, minutes, right, wrong, note, date, addReview }) {
    const s = { id: uid(), disciplineId, topicId: topicId || null, minutes, right: right || 0, wrong: wrong || 0, note: note || "", date: date || todayISO() };
    setSessions((p) => [s, ...p]);
    setCycle((prev) => ({ ...prev, blocks: prev.blocks.map((b) => b.disciplineId === disciplineId ? { ...b, doneMinutes: (b.doneMinutes || 0) + minutes } : b) }));
    const sessionDay = new Date((date || todayISO()) + "T00:00:00").getDay();
    setPlan((prev) => { const idx = prev.findIndex((p) => p.day === sessionDay && p.disciplineId === disciplineId && !p.done); if (idx === -1) return prev; const next = [...prev]; next[idx] = { ...next[idx], done: true }; return next; });
    if (topicId) setDisciplines((p) => p.map((d) => d.id === disciplineId ? { ...d, topics: d.topics.map((t) => t.id === topicId ? { ...t, studied: true } : t) } : d));
    if (addReview !== false) {
      const disc = discById[disciplineId];
      const topicName = topicId ? disc?.topics.find((t) => t.id === topicId)?.name : "";
      setReviews((p) => {
        const jaExiste = p.some((r) => !r.done && r.disciplineId === disciplineId && r.topicId === (topicId || null) && r.intervalIdx === 0);
        if (jaExiste) return p;
        return [{ id: uid(), sessionId: s.id, disciplineId, topicId: topicId || null, label: topicName || disc?.name || "Conteúdo", intervalIdx: 0, due: addDays(s.date, REVIEW_INTERVALS[0]), done: false }, ...p];
      });
    }
    return s;
  }
  function markReviewDone(rid) {
    setReviews((p) => p.map((r) => { if (r.id !== rid) return r; const nextIdx = r.intervalIdx + 1; if (nextIdx >= REVIEW_INTERVALS.length) return { ...r, done: true }; return { ...r, intervalIdx: nextIdx, due: addDays(todayISO(), REVIEW_INTERVALS[nextIdx]) }; }));
  }

  if (loading) return <div className="h-screen flex items-center justify-center" style={{ background: LIGHT.bg }}><div className="text-center"><BookOpen size={40} color={LIGHT.ink} className="mx-auto animate-pulse" /><p className="mt-3 text-sm" style={{ color: LIGHT.muted }}>Carregando seus estudos…</p></div></div>;

  const shared = { concurso, disciplines, setDisciplines, sessions, setSessions, reviews, setReviews, cycle, setCycle, plan, setPlan, goals, setGoals, simulados, setSimulados, discById, registerStudy, markReviewDone, setView };
  const NAV = [
    ["home", "Início", Home], ["raiox", "Raio-X da prova", Crosshair],
    ["ciclo", "Ciclo de estudo", RefreshCw], ["plano", "Planejamento", CalendarDays], ["revisoes", "Revisões", ListChecks],
    ["edital", "Edital verticalizado", BookOpen], ["historico", "Histórico", History], ["stats", "Estatísticas", BarChart3], ["simulados", "Simulados", ClipboardList],
    ["provas", `Provas ${concurso.label}`, GraduationCap],
  ];

  return (
    <ThemeCtx.Provider value={C}>
      <div style={{ background: C.bg, minHeight: "100vh", color: C.ink, fontFamily: "'Inter',ui-sans-serif,system-ui,sans-serif" }}>
        <div className="flex">
          <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r" style={{ background: C.surface, borderColor: C.line }}>
            <Brand concurso={concurso} setConcurso={setConcurso} />
            <nav className="px-3 flex-1 space-y-1 overflow-auto">{NAV.map(([id, label, Icon]) => <NavItem key={id} active={view === id} onClick={() => setView(id)} Icon={Icon} label={label} />)}</nav>
            <div className="p-3 border-t" style={{ borderColor: C.line }}><ThemeToggle theme={theme} setTheme={setTheme} /><button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl text-sm font-medium" style={{ background: "transparent", color: C.muted, border: `1px solid ${C.line}` }}><LogOut size={18} color={C.muted} /> Sair</button><div className="px-1 pt-3 text-xs" style={{ color: C.muted }}>{concurso.label} · {concurso.subtitle}</div></div>
          </aside>

          {navOpen && (
            <div className="md:hidden fixed inset-0 z-40" onClick={() => setNavOpen(false)}>
              <div className="absolute inset-0 bg-black/50" />
              <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col overflow-auto" style={{ background: C.surface }} onClick={(e) => e.stopPropagation()}>
                <Brand concurso={concurso} setConcurso={setConcurso} />
                <nav className="px-3 flex-1 space-y-1">{NAV.map(([id, label, Icon]) => <NavItem key={id} active={view === id} onClick={() => { setView(id); setNavOpen(false); }} Icon={Icon} label={label} />)}</nav>
                <div className="p-3 border-t" style={{ borderColor: C.line }}><ThemeToggle theme={theme} setTheme={setTheme} /></div>
              </aside>
            </div>
          )}

          <main className="flex-1 min-w-0">
            <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b sticky top-0 z-30" style={{ background: C.surface, borderColor: C.line }}>
              <button onClick={() => setNavOpen(true)}><Menu size={22} /></button>
              <span className="font-bold flex-1">Studora</span>
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={20} color={C.gold} /> : <Moon size={20} color={C.inkSoft} />}</button>
            </header>
            <div className="max-w-5xl mx-auto p-4 md:p-8 pb-28 md:pb-8">
              {view === "home" && <HomeView {...shared} />}
              {view === "raiox" && <RaioXView {...shared} />}
              {view === "ciclo" && <CicloView {...shared} />}
              {view === "plano" && <PlanoView {...shared} />}
              {view === "revisoes" && <RevisoesView {...shared} />}
              {view === "edital" && <EditalView {...shared} />}
              {view === "historico" && <HistoricoView {...shared} />}
              {view === "stats" && <StatsView {...shared} />}
              {view === "simulados" && <SimuladosView {...shared} />}
              {view === "provas" && <ProvasView concurso={concurso} />}
            </div>
          </main>
        </div>

        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t flex justify-around" style={{ background: C.surface, borderColor: C.line }}>
          {[["home", Home], ["raiox", Crosshair], ["ciclo", RefreshCw], ["edital", BookOpen], ["stats", BarChart3]].map(([id, Icon]) => (
            <button key={id} onClick={() => setView(id)} className="flex-1 py-2 flex justify-center" style={{ color: view === id ? C.ink : C.muted }}><Icon size={22} /></button>
          ))}
        </nav>
      </div>
    </ThemeCtx.Provider>
  );
}

/* ============================ Base ============================ */
function ThemeToggle({ theme, setTheme }) {
  const C = useC(); const dark = theme === "dark";
  return <button onClick={() => setTheme(dark ? "light" : "dark")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium" style={{ background: C.surface2, color: C.inkSoft, border: `1px solid ${C.line}` }}>
    {dark ? <Sun size={18} color={C.gold} /> : <Moon size={18} color={C.inkSoft} />} {dark ? "Tema claro" : "Tema escuro"}
  </button>;
}
function Brand({ concurso, setConcurso }) {
  const C = useC();
  return (
    <div className="px-4 pt-5 pb-3">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: BRAND }}><BookOpen size={18} color="#F5B301" /></div>
        <div className="font-extrabold text-lg leading-none" style={{ color: C.ink }}>Studora</div>
      </div>
      <div className="flex gap-1.5">
        {CONCURSOS.map((c) => (
          <button key={c.id} onClick={() => setConcurso(c.id)}
            className="flex-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg transition-all"
            style={{ background: concurso?.id === c.id ? BRAND : C.surface2, color: concurso?.id === c.id ? "#fff" : C.muted, border: `1px solid ${concurso?.id === c.id ? BRAND : C.line}` }}>
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
function NavItem({ active, onClick, Icon, label }) { const C = useC(); return <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition" style={{ background: active ? BRAND : "transparent", color: active ? "#fff" : C.inkSoft }}><Icon size={18} color={active ? "#F5B301" : C.muted} /> {label}</button>; }
function Card({ children, className = "", style = {} }) { const C = useC(); return <div className={`rounded-2xl p-5 ${className}`} style={{ background: C.surface, border: `1px solid ${C.line}`, ...style }}>{children}</div>; }
function PageTitle({ children, sub }) { const C = useC(); return <div className="mb-6"><h1 className="text-2xl font-extrabold">{children}</h1>{sub && <p className="text-sm mt-1" style={{ color: C.muted }}>{sub}</p>}</div>; }
function Btn({ children, onClick, variant = "primary", className = "", ...p }) {
  const C = useC();
  const styles = { primary: { background: BRAND, color: "#fff" }, gold: { background: C.gold, color: "#fff" }, ghost: { background: "transparent", color: C.ink, border: `1px solid ${C.line}` }, green: { background: C.green, color: "#fff" } }[variant];
  return <button onClick={onClick} className={`px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 ${className}`} style={styles} {...p}>{children}</button>;
}
function Modal({ open, onClose, title, children }) { const C = useC(); if (!open) return null; return <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}><div className="absolute inset-0 bg-black/60" /><div className="relative w-full max-w-lg rounded-2xl p-6 max-h-[85vh] overflow-auto" style={{ background: C.surface, border: `1px solid ${C.line}` }} onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">{title}</h3><button onClick={onClose}><X size={20} color={C.muted} /></button></div>{children}</div></div>; }
function Field({ label, children }) { const C = useC(); return <label className="block mb-3"><span className="text-xs font-semibold" style={{ color: C.muted }}>{label}</span><div className="mt-1">{children}</div></label>; }
function Empty({ msg }) { const C = useC(); return <p className="text-sm py-4 text-center" style={{ color: C.muted }}>{msg}</p>; }

/* ============================ Métricas ============================ */
function useMetrics(sessions, disciplines) {
  return useMemo(() => {
    const byDisc = {}; disciplines.forEach((d) => (byDisc[d.id] = { minutes: 0, right: 0, wrong: 0, name: d.name, color: d.color }));
    sessions.forEach((s) => { const b = byDisc[s.disciplineId]; if (b) { b.minutes += s.minutes; b.right += s.right; b.wrong += s.wrong; } });
    const days = [...new Set(sessions.map((s) => s.date))].sort().reverse();
    let streak = 0; let cur = todayISO();
    if (days.includes(cur) || days.includes(addDays(cur, -1))) { if (!days.includes(cur)) cur = addDays(cur, -1); while (days.includes(cur)) { streak++; cur = addDays(cur, -1); } }
    const wk = startOfWeek(todayISO()); const weekSess = sessions.filter((s) => s.date >= wk);
    return { byDisc, streak, weekMin: weekSess.reduce((a, s) => a + s.minutes, 0), weekQ: weekSess.reduce((a, s) => a + s.right + s.wrong, 0), totalMin: sessions.reduce((a, s) => a + s.minutes, 0) };
  }, [sessions, disciplines]);
}
function usePriority(disciplines) {
  return useMemo(() => { const list = []; disciplines.forEach((d) => d.topics.forEach((t) => list.push({ disc: d, topic: t, score: (t.hits || 0) * d.peso }))); return list.filter((x) => !x.topic.studied && x.topic.hits > 0).sort((a, b) => b.score - a.score); }, [disciplines]);
}

/* ============================ HOME ============================ */
function HomeView({ sessions, disciplines, reviews, goals, markReviewDone, setView, discById }) {
  const C = useC();
  const m = useMetrics(sessions, disciplines);
  const priority = usePriority(disciplines);
  const dueToday = reviews.filter((r) => !r.done && r.due <= todayISO());
  const hoursPct = Math.min(100, Math.round((m.weekMin / 60 / goals.hours) * 100));
  const qPct = Math.min(100, Math.round((m.weekQ / goals.questions) * 100));
  const activeDisc = Object.entries(m.byDisc).filter(([, v]) => v.minutes > 0);
  return (
    <div>
      <PageTitle sub="Sua central de comando — tudo atualizado em tempo real.">Bom estudo 👋</PageTitle>
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <Card className="md:col-span-1 flex flex-col justify-between" style={{ background: BRAND, color: "#fff", border: "none" }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: "#F5B301" }}><Flame size={18} /> Constância</div>
          <div className="my-2"><span className="text-5xl font-extrabold">{m.streak}</span><span className="ml-2 text-sm opacity-80">{m.streak === 1 ? "dia" : "dias"} seguidos</span></div>
          <StreakDots sessions={sessions} />
        </Card>
        <Card className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold"><Target size={16} color={C.gold} /> Metas da semana</div>
          <GoalBar label="Horas de estudo" value={m.weekMin / 60} target={goals.hours} pct={hoursPct} unit="h" />
          <div className="h-4" /><GoalBar label="Questões resolvidas" value={m.weekQ} target={goals.questions} pct={qPct} unit="" />
        </Card>
      </div>
      <Card className="mb-4" style={{ borderColor: C.gold, background: C.goldSoft }}>
        <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.ink }}><Zap size={16} color={C.gold} /> Onde focar agora</div><button className="text-xs font-semibold" style={{ color: C.inkSoft }} onClick={() => setView("raiox")}>Ver raio-x <ChevronRight size={12} className="inline" /></button></div>
        {priority.slice(0, 3).map(({ disc, topic }) => (<div key={topic.id} className="flex items-center gap-2 py-1.5 text-sm"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: disc.color }} /><span className="flex-1 min-w-0 truncate">{topic.name}</span><span className="text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{ background: C.surface, color: C.ink }}>cai muito</span></div>))}
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2 text-sm font-semibold"><ListChecks size={16} color={C.gold} /> Revisões de hoje</div><button className="text-xs font-semibold" style={{ color: C.muted }} onClick={() => setView("revisoes")}>Ver todas <ChevronRight size={12} className="inline" /></button></div>
          {dueToday.length === 0 ? <Empty msg="Nada para revisar hoje. Bom dia livre!" /> : dueToday.slice(0, 5).map((r) => (<div key={r.id} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: C.line }}><button onClick={() => markReviewDone(r.id)}><Circle size={20} color={C.muted} /></button><div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{r.label}</div><div className="text-xs" style={{ color: C.muted }}>{discById[r.disciplineId]?.name} · {REVIEW_INTERVALS[r.intervalIdx]}d</div></div>{r.due < todayISO() && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: C.redSoft, color: C.red }}>atrasada</span>}</div>))}
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold"><BarChart3 size={16} color={C.gold} /> Desempenho por disciplina</div>
          {activeDisc.length === 0 ? <Empty msg="Registre um estudo para ver seu desempenho aqui." /> : activeDisc.slice(0, 7).map(([id, v]) => { const tot = v.right + v.wrong; const acc = tot ? Math.round((v.right / tot) * 100) : 0; return <div key={id} className="py-2 border-b last:border-0" style={{ borderColor: C.line }}><div className="flex items-center justify-between text-sm"><span className="font-medium flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: v.color }} />{v.name}</span><span style={{ color: C.muted }}>{fmtMin(v.minutes)}</span></div><div className="flex items-center gap-3 text-xs mt-1" style={{ color: C.muted }}><span style={{ color: C.green }}>✓ {v.right}</span><span style={{ color: C.red }}>✕ {v.wrong}</span>{tot > 0 && <span className="ml-auto font-semibold" style={{ color: acc >= 70 ? C.green : acc >= 50 ? C.gold : C.red }}>{acc}% acerto</span>}</div></div>; })}
        </Card>
      </div>
      <div className="mt-4 flex gap-2"><Btn onClick={() => setView("ciclo")}><Play size={16} /> Estudar pelo ciclo</Btn></div>
    </div>
  );
}
function StreakDots({ sessions }) { const days = new Set(sessions.map((s) => s.date)); const last = Array.from({ length: 7 }, (_, i) => addDays(todayISO(), -(6 - i))); return <div className="flex gap-1.5">{last.map((d) => (<div key={d} className="flex-1 h-8 rounded-md flex items-center justify-center text-[10px]" style={{ background: days.has(d) ? "#F5B301" : "rgba(255,255,255,.12)", color: days.has(d) ? BRAND : "rgba(255,255,255,.5)" }}>{DAYS[new Date(d + "T00:00:00").getDay()][0]}</div>))}</div>; }
function GoalBar({ label, value, target, pct, unit }) { const C = useC(); return <div><div className="flex justify-between text-sm mb-1.5"><span className="font-medium">{label}</span><span style={{ color: C.muted }}>{Math.round(value * 10) / 10}{unit} / {target}{unit}</span></div><div className="h-2.5 rounded-full overflow-hidden" style={{ background: C.line }}><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 100 ? C.green : C.gold }} /></div></div>; }

/* ============================ RAIO-X ============================ */
function RaioXView({ disciplines }) {
  const C = useC();
  if (!disciplines.length) return <div><PageTitle>Raio-X da prova</PageTitle><Empty msg="Edital ainda não carregado." /></div>;
  const byPeso = [...disciplines].sort((a, b) => b.peso - a.peso);
  const total = disciplines.reduce((a, d) => a + d.peso, 0);
  const maxPeso = byPeso[0].peso || 1;
  const top = byPeso[0];
  const topPct = total ? Math.round((top.peso / total) * 100) : 0;
  const top3 = byPeso.slice(0, 3);
  const maxHit = Math.max(1, ...(top.topics || []).map((t) => t.hits || 0));
  return (
    <div>
      <PageTitle sub="Raio-X do edital: peso de cada disciplina e os assuntos de maior incidência, para priorizar o estudo.">Raio-X da prova</PageTitle>
      <Card className="mb-4">
        <div className="text-sm font-semibold mb-1">Peso de cada disciplina ({total} pontos)</div>
        <p className="text-xs mb-4" style={{ color: C.muted }}>A disciplina de maior peso é <b>{top.name}</b>: {top.peso} de {total} pontos ({topPct}%).</p>
        {byPeso.map((d) => (<div key={d.id} className="py-1.5"><div className="flex justify-between text-sm mb-1"><span className="font-medium flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />{d.name}</span><span style={{ color: C.muted }}>{d.peso} pts · {d.q}q</span></div><div className="h-2 rounded-full overflow-hidden" style={{ background: C.line }}><div className="h-full rounded-full" style={{ width: `${(d.peso / maxPeso) * 100}%`, background: d.color }} /></div></div>))}
      </Card>
      <Card className="mb-4">
        <div className="text-sm font-semibold mb-1 flex items-center gap-2"><Flame size={16} color={C.red} /> Mapa de calor — tópicos por incidência</div>
        <p className="text-xs mb-3" style={{ color: C.muted }}>Todos os tópicos do edital. Quanto mais quente a cor, mais vezes o assunto caiu em provas anteriores.</p>
        <div className="flex flex-wrap gap-1.5 mb-4 text-[10px]">
          {[["≥8 cai muito", C.red], ["5–7 cai bastante", C.gold], ["3–4 recorrente", "#b45309"], ["1–2 raro", C.line]].map(([lbl, bg]) => (
            <span key={lbl} className="flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold" style={{ background: bg, color: bg === C.line ? C.muted : "#fff" }}>{lbl}</span>
          ))}
        </div>
        <div className="space-y-4">
          {disciplines.map((d) => (
            <div key={d.id}>
              <div className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: C.inkSoft }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />{d.name}
              </div>
              <div className="flex flex-wrap gap-1">
                {[...d.topics].sort((a, b) => b.hits - a.hits).map((t) => {
                  const bg = t.hits >= 8 ? C.red : t.hits >= 5 ? C.gold : t.hits >= 3 ? "#b45309" : C.line;
                  const fg = t.hits >= 3 ? "#fff" : C.muted;
                  const label = (t.num ? t.num + " " : "") + (t.name.length > 50 ? t.name.slice(0, 50) + "…" : t.name);
                  return (
                    <span key={t.id} title={`${t.num ? t.num + " " : ""}${t.name} — ${t.hits}× em provas`}
                      className="text-[10px] px-1.5 py-0.5 rounded leading-tight cursor-default"
                      style={{ background: bg, color: fg, maxWidth: 220 }}>
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card><div className="text-sm font-semibold mb-2">Estratégia sugerida</div><ul className="text-sm space-y-2" style={{ color: C.inkSoft }}><li>• <b>{top.name}</b> é prioridade: {topPct}% dos {total} pontos.</li><li>• Maiores pesos: {top3.map((d) => `${d.name} (${d.peso} pts)`).join(", ")}.</li><li>• Busque <b>≥50%</b> no total e não zere nenhuma disciplina.</li><li>• Comece pelos assuntos de maior incidência (marcados em vermelho/dourado no edital).</li></ul></Card>
    </div>
  );
}



/* ============================ CICLO ============================ */
function CicloView({ cycle, setCycle, disciplines, discById, registerStudy }) {
  const C = useC();
  const [manualOpen, setManualOpen] = useState(false);
  const total = cycle.blocks.reduce((a, b) => a + b.targetMinutes, 0);
  function regen() { setCycle({ ...cycle, mode: "auto", blocks: autoCycle(disciplines) }); }
  function updateBlock(id, patch) { setCycle({ ...cycle, blocks: cycle.blocks.map((b) => b.id === id ? { ...b, ...patch } : b) }); }
  function removeBlock(id) { setCycle({ ...cycle, blocks: cycle.blocks.filter((b) => b.id !== id) }); }
  function move(id, dir) { const idx = cycle.blocks.findIndex((b) => b.id === id); const j = idx + dir; if (j < 0 || j >= cycle.blocks.length) return; const b = [...cycle.blocks];[b[idx], b[j]] = [b[j], b[idx]]; setCycle({ ...cycle, blocks: b }); }
  function addBlock() { const used = new Set(cycle.blocks.map((b) => b.disciplineId)); const free = disciplines.find((d) => !used.has(d.id)) || disciplines[0]; setCycle({ ...cycle, blocks: [...cycle.blocks, { id: uid(), disciplineId: free.id, targetMinutes: 60, order: cycle.blocks.length }] }); }
  return (
    <div>
      <PageTitle sub="Flexível: sem fixação em dias. O tempo é distribuído proporcionalmente ao peso de cada disciplina no edital.">Ciclo de estudo</PageTitle>
      <div className="flex flex-wrap gap-2 mb-4"><Btn variant={cycle.mode === "auto" ? "primary" : "ghost"} onClick={regen}><RefreshCw size={15} /> Gerar automático</Btn><Btn variant="ghost" onClick={addBlock}><Plus size={15} /> Adicionar etapa</Btn><Btn variant="ghost" onClick={() => setManualOpen(true)}><Pencil size={15} /> Registro manual</Btn>{cycle.blocks.length > 0 && <Btn variant="ghost" onClick={() => { if (confirm("Limpar todo o ciclo de estudo?")) setCycle({ ...cycle, blocks: [] }); }}><Trash2 size={15} color={C.red} /> <span style={{ color: C.red }}>Limpar ciclo</span></Btn>}<span className="ml-auto text-sm self-center" style={{ color: C.muted }}>Total: <b style={{ color: C.ink }}>{fmtMin(total)}</b></span></div>
      <div className="space-y-2">
        {cycle.blocks.map((b, i) => { const d = discById[b.disciplineId]; const pct = Math.min(100, Math.round((b.doneMinutes / b.targetMinutes) * 100));
          return <Card key={b.id} className="!p-4"><div className="flex items-center gap-3"><span className="text-xs font-bold w-6 text-center" style={{ color: C.muted }}>{i + 1}</span><span className="w-1.5 h-10 rounded-full" style={{ background: d?.color }} /><div className="flex-1 min-w-0"><div className="font-semibold truncate">{d?.name} <span className="text-xs font-normal" style={{ color: C.muted }}>· {d?.peso} pts</span></div><div className="flex items-center gap-2 mt-1"><div className="h-1.5 rounded-full flex-1 max-w-[140px] overflow-hidden" style={{ background: C.line }}><div className="h-full" style={{ width: `${pct}%`, background: C.gold }} /></div><span className="text-xs" style={{ color: C.muted }}>{fmtMin(b.doneMinutes)} / {fmtMin(b.targetMinutes)}</span></div></div><div className="flex items-center gap-1"><input type="number" value={b.targetMinutes} min={15} step={15} onChange={(e) => updateBlock(b.id, { targetMinutes: +e.target.value })} className="w-16 px-2 py-1 rounded-lg text-sm text-center" style={inputStyle(C)} /><button onClick={() => move(b.id, -1)} className="p-1 rotate-[-90deg]" style={{ color: C.muted }}><ChevronRight size={16} /></button><button onClick={() => move(b.id, 1)} className="p-1 rotate-90" style={{ color: C.muted }}><ChevronRight size={16} /></button><button onClick={() => removeBlock(b.id)} className="p-1"><Trash2 size={16} color={C.red} /></button></div></div></Card>;
        })}
      </div>
      {manualOpen && <ManualModal disciplines={disciplines} discById={discById} onClose={() => setManualOpen(false)} onSave={(data) => { registerStudy(data); setManualOpen(false); }} />}
    </div>
  );
}
function ManualModal({ disciplines, discById, onClose, onSave, initial }) {
  const C = useC();
  const [discId, setDiscId] = useState(initial?.disciplineId || disciplines[0]?.id);
  const [topicId, setTopicId] = useState(initial?.topicId || "");
  const [minutes, setMinutes] = useState(initial?.minutes || 30);
  const [right, setRight] = useState(initial?.right ?? ""); const [wrong, setWrong] = useState(initial?.wrong ?? "");
  const [date, setDate] = useState(initial?.date || todayISO()); const [note, setNote] = useState(initial?.note || "");
  const topics = discById[discId]?.topics || [];
  return <Modal open title={initial ? "Editar registro" : "Registro manual de estudo"} onClose={onClose}>
    <Field label="Disciplina"><select value={discId} onChange={(e) => { setDiscId(e.target.value); setTopicId(""); }} className={inputCls} style={inputStyle(C)}>{disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
    <Field label="Tópico (opcional)"><select value={topicId} onChange={(e) => setTopicId(e.target.value)} className={inputCls} style={inputStyle(C)}><option value="">— geral —</option>{topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
    <div className="grid grid-cols-2 gap-3"><Field label="Tempo (min)"><input type="number" value={minutes} onChange={(e) => setMinutes(+e.target.value)} className={inputCls} style={inputStyle(C)} /></Field><Field label="Data"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} style={inputStyle(C)} /></Field><Field label="Acertos"><input type="number" value={right} onChange={(e) => setRight(e.target.value)} className={inputCls} style={inputStyle(C)} placeholder="0" /></Field><Field label="Erros"><input type="number" value={wrong} onChange={(e) => setWrong(e.target.value)} className={inputCls} style={inputStyle(C)} placeholder="0" /></Field></div>
    <Field label="Observação"><input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} style={inputStyle(C)} placeholder="Ex.: revisar teoria depois" /></Field>
    <Btn className="w-full justify-center" onClick={() => onSave({ disciplineId: discId, topicId: topicId || null, minutes, right: +right || 0, wrong: +wrong || 0, date, note })}><Check size={16} /> {initial ? "Salvar alterações" : "Registrar estudo"}</Btn>
  </Modal>;
}

/* ============================ PLANEJAMENTO ============================ */
function PlanoView({ plan, setPlan, disciplines, discById, cycle, setView }) {
  const C = useC();
  const [open, setOpen] = useState(null);
  const [gerarOpen, setGerarOpen] = useState(false);
  const doneCount = plan.filter((p) => p.done).length;
  const pct = plan.length ? Math.round((doneCount / plan.length) * 100) : 0;
  function toggle(id) { setPlan((p) => p.map((x) => x.id === id ? { ...x, done: !x.done } : x)); }
  function add(day, disciplineId, minutes) { setPlan((p) => [...p, { id: uid(), day, disciplineId, minutes, done: false }]); setOpen(null); }
  function remove(id) { setPlan((p) => p.filter((x) => x.id !== id)); }
  function gerarDoCiclo(dias, horasPorDia) {
    const minPerDay = Math.round(Number(horasPorDia) * 60);
    if (!minPerDay || !dias.length) return;
    const blocks = cycle?.blocks || [];
    if (!blocks.length) return;
    const dayBlocks = dias.map(() => []);
    blocks.forEach((block, bi) => { dayBlocks[bi % dias.length].push(block); });
    // Se blocos < dias, dias do final ficam vazios — preenche com repetição
    if (blocks.length < dias.length) {
      let src = 0;
      dayBlocks.forEach((assigned, di) => {
        if (assigned.length === 0) { dayBlocks[di].push(blocks[src % blocks.length]); src++; }
      });
    }
    const newPlan = [];
    dayBlocks.forEach((assigned, di) => {
      if (!assigned.length) return;
      const totalMin = assigned.reduce((s, b) => s + Number(b.targetMinutes), 0);
      const scale = totalMin > minPerDay ? minPerDay / totalMin : 1;
      assigned.forEach((block) => {
        const minutes = Math.max(15, Math.round(Number(block.targetMinutes) * scale / 15) * 15);
        newPlan.push({ id: uid(), day: dias[di], disciplineId: block.disciplineId, minutes, done: false });
      });
    });
    setPlan(newPlan);
    setGerarOpen(false);
  }
  return <div>
    <PageTitle sub="Distribua sessões ao longo da semana em grade. Gerado automaticamente a partir do ciclo ou ajustado manualmente.">Planejamento semanal</PageTitle>
    <div className="flex flex-wrap gap-2 mb-4">
      <Btn variant="primary" onClick={() => setGerarOpen(true)}><RefreshCw size={14} /> Gerar da semana</Btn>
      {plan.length > 0 && <Btn variant="ghost" onClick={() => { if (confirm("Limpar todo o planejamento semanal?")) setPlan([]); }}><Trash2 size={14} color={C.red} /> <span style={{ color: C.red }}>Limpar tudo</span></Btn>}
      <span className="text-xs self-center ml-auto" style={{ color: C.muted }}>ou adicione sessões manualmente nos dias abaixo</span>
    </div>
    <Card className="mb-4"><GoalBar label="Planejamento cumprido esta semana" value={doneCount} target={plan.length || 1} pct={pct} unit="" /></Card>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {DAYS.map((d, i) => { const items = plan.filter((p) => p.day === i);
        return <Card key={i} className="!p-4"><div className="flex items-center justify-between mb-2"><span className="font-bold text-sm">{d}</span><button onClick={() => setOpen(i)}><Plus size={16} color={C.ink} /></button></div>{items.length === 0 ? <p className="text-xs py-3" style={{ color: C.muted }}>Sem sessões</p> : items.map((it) => { const dd = discById[it.disciplineId]; return (<div key={it.id} className="flex items-center gap-2 py-1.5 group"><button onClick={() => toggle(it.id)}>{it.done ? <CheckCircle2 size={16} color={C.green} /> : <Circle size={16} color={C.muted} />}</button><span className="w-2 h-2 rounded-full shrink-0" style={{ background: dd?.color }} /><span className="text-xs flex-1 min-w-0 leading-tight" style={{ textDecoration: it.done ? "line-through" : "none", color: it.done ? C.muted : C.ink, wordBreak: "break-word" }}>{dd?.name}</span><span className="text-[10px]" style={{ color: C.muted }}>{fmtMin(it.minutes)}</span><button onClick={() => remove(it.id)} className="opacity-0 group-hover:opacity-100"><X size={12} color={C.red} /></button></div>); })}</Card>;
      })}
    </div>
    {open !== null && <PlanAddModal day={open} disciplines={disciplines} onClose={() => setOpen(null)} onAdd={add} />}
    {gerarOpen && <GerarPlanoModal cycle={cycle} discById={discById} onClose={() => setGerarOpen(false)} onGerar={gerarDoCiclo} setView={setView} />}
  </div>;
}
function GerarPlanoModal({ cycle, discById, onClose, onGerar, setView }) {
  const C = useC();
  const [dias, setDias] = useState([1, 2, 3, 4, 5, 6]);
  const [horas, setHoras] = useState(2);
  function toggleDia(i) { setDias((d) => d.includes(i) ? d.filter((x) => x !== i) : [...d, i].sort((a, b) => a - b)); }
  const blocks = cycle?.blocks || [];
  const totalCiclo = blocks.reduce((a, b) => a + b.targetMinutes, 0);
  const totalSemana = dias.length * horas * 60;
  if (blocks.length === 0) return <Modal open title="Gerar planejamento da semana" onClose={onClose}>
    <div className="text-center py-6">
      <RefreshCw size={32} color={C.muted} className="mx-auto mb-3" />
      <p className="text-sm font-semibold mb-1" style={{ color: C.ink }}>Ciclo de estudo vazio</p>
      <p className="text-sm mb-5" style={{ color: C.muted }}>Você precisa configurar o ciclo de estudo antes de gerar o planejamento.</p>
      <Btn onClick={() => { onClose(); setView("ciclo"); }}><RefreshCw size={14} /> Ir para o Ciclo de estudo</Btn>
    </div>
  </Modal>;
  return <Modal open title="Gerar planejamento da semana" onClose={onClose}>
    <p className="text-sm mb-4" style={{ color: C.muted }}>Distribui os blocos do seu ciclo de estudo automaticamente pelos dias selecionados.</p>
    <Field label="Dias de estudo">
      <div className="flex gap-1.5 flex-wrap">
        {DAYS.map((d, i) => <button key={i} type="button" onClick={() => toggleDia(i)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition" style={{ background: dias.includes(i) ? C.ink : C.surface2, color: dias.includes(i) ? C.bg : C.muted, borderColor: dias.includes(i) ? C.ink : C.line }}>{d}</button>)}
      </div>
    </Field>
    <Field label="Horas de estudo por dia">
      <input type="number" min={0.5} max={12} step={0.5} value={horas} onChange={(e) => setHoras(+e.target.value)} className={inputCls} style={inputStyle(C)} />
    </Field>
    <div className="text-xs rounded-xl p-3 mb-2" style={{ background: C.surface2, color: C.muted }}>
      Ciclo: <b style={{ color: C.ink }}>{fmtMin(totalCiclo)}</b> total · Semana: <b style={{ color: C.ink }}>{fmtMin(totalSemana)}</b> disponível
      {totalSemana < totalCiclo && <span className="block mt-1 text-amber-600">⚠ Horas insuficientes para um ciclo completo por semana — só parte será alocada.</span>}
    </div>
    <Btn className="w-full justify-center" onClick={() => onGerar(dias, horas)} disabled={dias.length === 0}><Check size={16} /> Gerar planejamento</Btn>
  </Modal>;
}
function PlanAddModal({ day, disciplines, onClose, onAdd }) { const C = useC(); const [discId, setDiscId] = useState(disciplines[0]?.id); const [min, setMin] = useState(60); return <Modal open title={`Adicionar sessão · ${DAYS[day]}`} onClose={onClose}><Field label="Disciplina"><select value={discId} onChange={(e) => setDiscId(e.target.value)} className={inputCls} style={inputStyle(C)}>{disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field><Field label="Duração (min)"><input type="number" value={min} step={15} onChange={(e) => setMin(+e.target.value)} className={inputCls} style={inputStyle(C)} /></Field><Btn className="w-full justify-center" onClick={() => onAdd(day, discId, min)}><Plus size={16} /> Adicionar</Btn></Modal>; }

/* ============================ REVISÕES ============================ */
function RevisoesView({ reviews, setReviews, markReviewDone, discById, disciplines }) {
  const C = useC();
  const [addOpen, setAddOpen] = useState(false);
  const pend = reviews.filter((r) => !r.done).sort((a, b) => a.due.localeCompare(b.due));
  const late = pend.filter((r) => r.due < todayISO()); const today = pend.filter((r) => r.due === todayISO()); const upcoming = pend.filter((r) => r.due > todayISO());
  function addManual(data) { setReviews((p) => [{ id: uid(), sessionId: null, intervalIdx: 0, done: false, ...data }, ...p]); setAddOpen(false); }
  function editDate(id, due) { setReviews((p) => p.map((r) => r.id === id ? { ...r, due } : r)); }
  const Group = ({ title, items, color }) => items.length ? <div className="mb-5"><h3 className="text-sm font-bold mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: color }} />{title} <span style={{ color: C.muted }}>({items.length})</span></h3><div className="space-y-2">{items.map((r) => { const topicName = r.topicId ? discById[r.disciplineId]?.topics?.find((t) => t.id === r.topicId)?.name : null; return (<Card key={r.id} className="!p-3 flex items-center gap-3"><button onClick={() => markReviewDone(r.id)}><Circle size={22} color={C.muted} /></button><div className="flex-1 min-w-0"><div className="font-medium text-sm">{r.label}</div>{topicName && topicName !== r.label && <div className="text-xs mt-0.5 italic" style={{ color: C.inkSoft }}>{topicName}</div>}<div className="text-xs mt-0.5" style={{ color: C.muted }}>{discById[r.disciplineId]?.name} · intervalo {REVIEW_INTERVALS[r.intervalIdx]}d</div></div><input type="date" value={r.due} onChange={(e) => editDate(r.id, e.target.value)} className="px-2 py-1 rounded-lg text-xs" style={inputStyle(C)} /></Card>); })}</div></div> : null;
  return <div>
    <PageTitle sub="Agendamento automático por repetição espaçada. Ao concluir, o próximo intervalo é reprogramado sozinho.">Revisões</PageTitle>
    <div className="mb-4"><Btn variant="ghost" onClick={() => setAddOpen(true)}><Plus size={15} /> Revisão manual</Btn></div>
    {pend.length === 0 && <Empty msg="Nenhuma revisão pendente. Registre estudos para gerar revisões." />}
    <Group title="Atrasadas" items={late} color={C.red} /><Group title="Hoje" items={today} color={C.gold} /><Group title="Próximas" items={upcoming} color={C.green} />
    {addOpen && <RevAddModal disciplines={disciplines} discById={discById} onClose={() => setAddOpen(false)} onAdd={addManual} />}
  </div>;
}
function RevAddModal({ disciplines, discById, onClose, onAdd }) { const C = useC(); const [discId, setDiscId] = useState(disciplines[0]?.id); const [label, setLabel] = useState(""); const [due, setDue] = useState(addDays(todayISO(), 1)); return <Modal open title="Nova revisão" onClose={onClose}><Field label="Disciplina"><select value={discId} onChange={(e) => setDiscId(e.target.value)} className={inputCls} style={inputStyle(C)}>{disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field><Field label="Conteúdo"><input value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} style={inputStyle(C)} placeholder="Ex.: Normalização 3FN" /></Field><Field label="Data"><input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={inputCls} style={inputStyle(C)} /></Field><Btn className="w-full justify-center" onClick={() => onAdd({ disciplineId: discId, topicId: null, label: label || discById[discId]?.name, due })}><Plus size={16} /> Agendar</Btn></Modal>; }

/* ============================ EDITAL ============================ */
function EditalView({ concurso, disciplines, sessions, setDisciplines }) {
  const C = useC();
  const [sincronizando, setSincronizando] = useState(false);
  const perf = useMemo(() => { const map = {}; sessions.forEach((s) => { if (!s.topicId) return; const k = s.topicId; map[k] = map[k] || { min: 0, r: 0, w: 0 }; map[k].min += s.minutes; map[k].r += s.right; map[k].w += s.wrong; }); return map; }, [sessions]);
  const allTopics = disciplines.flatMap((d) => d.topics);
  const studied = allTopics.filter((t) => t.studied).length;
  const pct = allTopics.length ? Math.round((studied / allTopics.length) * 100) : 0;
  const blocks = [...new Set(disciplines.map((d) => d.block))];
  function toggleTopic(disciplineId, topicId) {
    setDisciplines((prev) => prev.map((d) => d.id !== disciplineId ? d : ({
      ...d,
      topics: d.topics.map((t) => t.id === topicId ? { ...t, studied: !t.studied } : t),
    })));
  }
  async function atualizarEdital() {
    if (sincronizando) return;
    setSincronizando(true);
    try {
      const edital = EDITAIS[concurso.id] || [];
      const globalDisc = buildDiscFromEdital(concurso.id, edital);
      await supabase.from("editais").upsert({ concurso_id: concurso.id, disciplinas: edital, updated_at: new Date().toISOString() });
      setDisciplines((prev) => mergeEdital(prev, globalDisc));
    } finally { setSincronizando(false); }
  }
  return <div>
    <div className="flex items-start justify-between gap-3 mb-6">
      <div><h1 className="text-2xl font-extrabold">Edital verticalizado</h1><p className="text-sm mt-1" style={{ color: C.muted }}>{concurso.label} · {concurso.subtitle}. Peso, nº de questões e incidência por tópico. Marque o que já estudou.</p></div>
      <Btn variant="ghost" onClick={atualizarEdital} disabled={sincronizando} className="shrink-0"><RefreshCw size={14} className={sincronizando ? "animate-spin" : ""} /> {sincronizando ? "Atualizando…" : "Atualizar edital"}</Btn>
    </div>
    <Card className="mb-4"><div className="flex items-center justify-between text-sm mb-2"><span className="font-semibold">Cobertura do edital</span><span style={{ color: C.muted }}>{studied}/{allTopics.length} tópicos</span></div><div className="h-3 rounded-full overflow-hidden" style={{ background: C.line }}><div className="h-full" style={{ width: `${pct}%`, background: C.ink }} /></div></Card>
    {blocks.map((block) => (
      <div key={block} className="mb-5"><h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Conhecimentos {block}</h3><div className="space-y-3">
        {disciplines.filter((d) => d.block === block).map((d) => { const done = d.topics.filter((t) => t.studied).length;
          return <Card key={d.id} className="!p-4"><div className="flex items-center gap-2 mb-3"><span className="w-1.5 h-6 rounded-full" style={{ background: d.color }} /><span className="font-bold flex-1">{d.name}</span><span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: C.goldSoft, color: C.ink }}>{d.peso} pts · {d.q}q</span><span className="text-xs" style={{ color: C.muted }}>{done}/{d.topics.length}</span></div><div className="space-y-1.5">
            {d.topics.map((t) => { const isSub = t.num && t.num.includes("."); const p = perf[t.id]; const tot = p ? p.r + p.w : 0; const acc = tot ? Math.round((p.r / tot) * 100) : null; const weak = acc !== null && acc < 60;
              return <button key={t.id} type="button" onClick={() => toggleTopic(d.id, t.id)} className={`w-full flex items-center gap-2 text-sm p-2.5 rounded-xl border text-left transition hover:-translate-y-[1px]${isSub ? " ml-5" : ""}`} style={{ background: t.studied ? C.greenSoft : C.surface2, borderColor: t.studied ? C.green : C.line, boxShadow: t.studied ? `0 0 0 1px ${C.green} inset` : "none", width: isSub ? "calc(100% - 1.25rem)" : undefined }}><span className="pointer-events-none shrink-0 mt-0.5">{t.studied ? <CheckCircle2 size={15} color={C.green} /> : <Circle size={15} color={C.line} />}</span>{t.num && <span className="pointer-events-none text-xs font-mono shrink-0 min-w-[2rem] text-right" style={{ color: C.muted }}>{t.num}</span>}<span className="pointer-events-none flex-1 min-w-0" style={{ color: t.studied ? C.ink : C.inkSoft }}>{t.name}</span><span className="pointer-events-none flex items-center gap-1 shrink-0">{t.hits >= 8 && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: C.redSoft, color: C.red }}>cai muito</span>}{t.hits >= 4 && t.hits < 8 && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: C.goldSoft, color: C.ink }}>cai bastante</span>}{p && <span className="text-xs" style={{ color: C.muted }}>{fmtMin(p.min)}</span>}{acc !== null && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: weak ? C.redSoft : C.greenSoft, color: weak ? C.red : C.green }}>{acc}%{weak && " · foco"}</span>}</span></button>;
            })}
          </div></Card>;
        })}
      </div></div>
    ))}
    <p className="text-xs" style={{ color: C.muted }}>Incidência estimada a partir de provas anteriores e do foco atual do concurso. Guia de prioridade — os pesos podem ser refinados conforme o edital oficial.</p>
  </div>;
}

/* ============================ HISTÓRICO ============================ */
function HistoricoView({ sessions, setSessions, discById, disciplines }) {
  const C = useC();
  const [edit, setEdit] = useState(null);
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  function remove(id) { setSessions((p) => p.filter((s) => s.id !== id)); }
  function save(id, data) { setSessions((p) => p.map((s) => s.id === id ? { ...s, ...data } : s)); setEdit(null); }
  return <div>
    <PageTitle sub="Registro completo e cronológico. Corrija ou exclua registros direto aqui.">Histórico de estudo</PageTitle>
    {sorted.length === 0 ? <Empty msg="Nenhuma sessão registrada ainda." /> : <div className="space-y-2">{sorted.map((s) => { const d = discById[s.disciplineId]; const topic = d?.topics.find((t) => t.id === s.topicId); const tot = s.right + s.wrong;
      return <Card key={s.id} className="!p-3 flex items-center gap-3 group"><span className="w-1.5 h-10 rounded-full" style={{ background: d?.color }} /><div className="flex-1 min-w-0"><div className="text-sm font-semibold truncate">{d?.name} {topic && <span className="font-normal" style={{ color: C.muted }}>· {topic.name}</span>}</div><div className="text-xs flex gap-3 mt-0.5" style={{ color: C.muted }}><span>{fmtDate(s.date)}</span><span><Clock size={11} className="inline" /> {fmtMin(s.minutes)}</span>{tot > 0 && <span style={{ color: C.green }}>✓{s.right}</span>}{tot > 0 && <span style={{ color: C.red }}>✕{s.wrong}</span>}</div>{s.note && <div className="text-xs mt-0.5 italic" style={{ color: C.muted }}>{s.note}</div>}</div><button onClick={() => setEdit(s)} className="p-1"><Pencil size={15} color={C.muted} /></button><button onClick={() => remove(s.id)} className="p-1"><Trash2 size={15} color={C.red} /></button></Card>; })}</div>}
    {edit && <ManualModal disciplines={disciplines} discById={discById} initial={edit} onClose={() => setEdit(null)} onSave={(data) => save(edit.id, data)} />}
  </div>;
}

/* ============================ ESTATÍSTICAS ============================ */
function StatsView({ sessions, disciplines }) {
  const C = useC();
  const m = useMetrics(sessions, disciplines);
  const weekly = useMemo(() => { const map = {}; sessions.forEach((s) => { const w = startOfWeek(s.date); map[w] = (map[w] || 0) + s.minutes; }); const weeks = []; let w = startOfWeek(todayISO()); for (let i = 7; i >= 0; i--) { const wk = addDays(w, -i * 7); weeks.push({ semana: fmtDate(wk), horas: Math.round((map[wk] || 0) / 6) / 10 }); } return weeks; }, [sessions]);
  const pie = Object.values(m.byDisc).filter((v) => v.minutes > 0).map((v) => ({ name: v.name, value: v.minutes, color: v.color }));
  const totalQ = Object.values(m.byDisc).reduce((a, v) => a + v.right + v.wrong, 0); const totalR = Object.values(m.byDisc).reduce((a, v) => a + v.right, 0);
  const acc = totalQ ? Math.round((totalR / totalQ) * 100) : 0; const avg = sessions.length ? Math.round(m.totalMin / sessions.length) : 0;
  return <div>
    <PageTitle sub="Gráficos de evolução e indicadores para orientar sua estratégia.">Estatísticas e indicadores</PageTitle>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4"><Stat label="Tempo total" value={fmtMin(m.totalMin)} Icon={Clock} /><Stat label="Taxa de acerto" value={`${acc}%`} Icon={Target} color={acc >= 70 ? C.green : C.gold} /><Stat label="Tempo médio/sessão" value={`${avg}min`} Icon={TimerIcon} /><Stat label="Melhor constância" value={`${m.streak}d`} Icon={Flame} color={C.gold} /></div>
    <Card className="mb-4"><div className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp size={16} color={C.gold} /> Evolução — horas por semana</div><ResponsiveContainer width="100%" height={220}><LineChart data={weekly}><CartesianGrid strokeDasharray="3 3" stroke={C.line} /><XAxis dataKey="semana" fontSize={11} stroke={C.muted} /><YAxis fontSize={11} stroke={C.muted} /><Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, color: C.ink }} /><Line type="monotone" dataKey="horas" stroke={C.gold} strokeWidth={2.5} dot={{ fill: C.gold, r: 4 }} /></LineChart></ResponsiveContainer></Card>
    <div className="grid md:grid-cols-2 gap-4">
      <Card><div className="text-sm font-semibold mb-3">Distribuição do tempo por disciplina</div>{pie.length === 0 ? <Empty msg="Sem dados ainda." /> : <ResponsiveContainer width="100%" height={240}><PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>{pie.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip formatter={(v) => fmtMin(v)} contentStyle={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, color: C.ink }} /><Legend fontSize={10} /></PieChart></ResponsiveContainer>}</Card>
      <Card><div className="text-sm font-semibold mb-3">Acertos vs erros por disciplina</div><ResponsiveContainer width="100%" height={240}><BarChart data={Object.values(m.byDisc).filter((v) => v.right + v.wrong > 0)} layout="vertical" margin={{ left: 10 }}><XAxis type="number" fontSize={11} stroke={C.muted} /><YAxis type="category" dataKey="name" width={90} fontSize={10} stroke={C.muted} /><Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, color: C.ink }} /><Bar dataKey="right" stackId="a" fill={C.green} name="Acertos" /><Bar dataKey="wrong" stackId="a" fill={C.red} name="Erros" /></BarChart></ResponsiveContainer></Card>
    </div>
  </div>;
}
function Stat({ label, value, Icon, color }) { const C = useC(); const col = color || C.ink; return <Card className="!p-4"><Icon size={18} color={col} /><div className="text-2xl font-extrabold mt-2" style={{ color: col }}>{value}</div><div className="text-xs" style={{ color: C.muted }}>{label}</div></Card>; }

// Questões das Provas Dataprev 2023 e 2024 — Perfil: Desenvolvimento de Software
// Banca: FGV | Gabaritos oficiais definitivos da FGV

const COR_DISC_PROVA = {
  "Língua Portuguesa":                 { bg:"#EFF6FF", text:"#1D4ED8", border:"#BFDBFE" },
  "Língua Inglesa":                    { bg:"#F5F3FF", text:"#6D28D9", border:"#DDD6FE" },
  "Raciocínio Lógico":                 { bg:"#FEFCE8", text:"#92400E", border:"#FDE68A" },
  "Atualidades":                       { bg:"#FDF2F8", text:"#9D174D", border:"#FBCFE8" },
  "Conhecimentos Específicos":         { bg:"#F0FDF4", text:"#166534", border:"#BBF7D0" },
  "Matemática":                        { bg:"#FFF7ED", text:"#C2410C", border:"#FED7AA" },
  "Atualidades do Mercado Financeiro": { bg:"#FDF4FF", text:"#86198F", border:"#F0ABFC" },
  "Probabilidade e Estatística":       { bg:"#FEFCE8", text:"#713F12", border:"#FEF08A" },
  "Conhecimentos Bancários":           { bg:"#F0FDF4", text:"#15803D", border:"#86EFAC" },
  "Tecnologia da Informação":          { bg:"#EFF6FF", text:"#1E40AF", border:"#93C5FD" },
  "Legislação":                        { bg:"#F0FDFA", text:"#0F766E", border:"#99F6E4" },
};

function BadgeDisc({ disc }) {
  const col = COR_DISC_PROVA[disc] || { bg:"#F3F4F6", text:"#374151", border:"#D1D5DB" };
  return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border" style={{ background:col.bg, color:col.text, borderColor:col.border }}>{disc}</span>;
}

function ProvasView({ concurso }) {
  const C = useC();
  const [tela, setTela] = useState("lista");
  const [provaSel, setProvaSel] = useState(null);
  const [modo, setModo] = useState("completa");
  const [respostas, setRespostas] = useState({});
  const [atual, setAtual] = useState(0);
  const [revelado, setRevelado] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [filtroDisc, setFiltroDisc] = useState("todas");
  const [dadosResult, setDadosResult] = useState(null);
  const [provas, setProvas] = useState(null); // null = carregando
  const timerRef = useRef();

  useEffect(() => {
    let alive = true;
    setProvas(null);
    fetchProvas(concurso.id).then((ps) => { if (alive) setProvas(ps); });
    return () => { alive = false; };
  }, [concurso?.id]);

  useEffect(() => {
    if (tela !== "simulado") { clearInterval(timerRef.current); return; }
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setTempo((t) => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [tela]);

  function iniciar(prova, m) {
    setProvaSel(prova); setModo(m); setRespostas({}); setAtual(0);
    setRevelado(false); setTempo(0); setFiltroDisc("todas"); setTela("simulado");
  }
  function finalizar() { clearInterval(timerRef.current); setDadosResult({ prova:provaSel, modo, respostas, questoes:qFiltradas, tempo }); setTela("resultado"); }
  function voltar() { clearInterval(timerRef.current); setTela("lista"); setProvaSel(null); }

  const qBase = provaSel ? (modo === "especificos"
    ? (provaSel.especificosDiscs
      ? provaSel.questoes.filter((q) => provaSel.especificosDiscs.includes(q.disciplina))
      : provaSel.questoes.filter((q) => q.disciplina === "Conhecimentos Específicos"))
    : provaSel.questoes) : [];
  const qFiltradas = filtroDisc === "todas" ? qBase : qBase.filter((q) => q.disciplina === filtroDisc);
  const q = qFiltradas[atual];
  const respostaAtual = q ? respostas[q.numero] : null;
  const respondidas = Object.keys(respostas).filter((k) => qFiltradas.find((q) => q.numero === Number(k))).length;
  const acertos = qFiltradas.filter((q) => respostas[q.numero] === q.gabarito).length;
  const mm = String(Math.floor(tempo/60)).padStart(2,"0"); const ss = String(tempo%60).padStart(2,"0");

  if (tela === "lista") {
    const ehBB = concurso?.id === "bb-at";
    const titulo = ehBB ? "Provas BB" : "Provas Dataprev";
    const sub = ehBB ? "Banco do Brasil · Agente de Tecnologia · CESGRANRIO" : "Dataprev · Arquitetura de Software";

    if (provas === null) {
      return (
        <div>
          <PageTitle sub={sub}>{titulo}</PageTitle>
          <Card className="text-center py-10">
            <GraduationCap size={40} color={C.muted} className="mx-auto mb-3 animate-pulse" />
            <div className="font-bold text-base">Carregando provas…</div>
          </Card>
        </div>
      );
    }

    if (provas.length === 0) {
      return (
        <div>
          <PageTitle sub={sub}>{titulo}</PageTitle>
          <Card className="text-center py-10">
            <GraduationCap size={40} color={C.muted} className="mx-auto mb-3" />
            <div className="font-bold text-base mb-2">Provas em breve</div>
            <p className="text-sm" style={{ color: C.muted }}>Ainda não há provas cadastradas para {concurso.label} · {concurso.subtitle}. As questões serão adicionadas assim que disponíveis.</p>
            <p className="text-xs mt-3" style={{ color: C.muted }}>Use o <strong>Simulados</strong> para registrar seu desempenho nas provas que você praticar.</p>
          </Card>
        </div>
      );
    }

    return (
      <div>
        <PageTitle sub={sub}>{titulo}</PageTitle>
        <div className="space-y-4">
          {provas.map((p) => {
            const numEsp = p.especificosDiscs ? p.questoes.filter((q) => p.especificosDiscs.includes(q.disciplina)).length : 0;
            return (
              <Card key={p.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:C.goldSoft, color:C.gold }}>{p.banca} · {p.data}</span>
                    <h2 className="font-extrabold text-base mt-2">{p.titulo}</h2>
                  </div>
                  <div className="text-right shrink-0 ml-3"><div className="text-3xl font-extrabold" style={{ color:BRAND }}>{p.totalQuestoes}</div><div className="text-xs" style={{ color:C.muted }}>questões</div></div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">{Object.keys(p.disciplinas).map((disc) => <BadgeDisc key={disc} disc={disc} />)}</div>
                <div className="flex gap-2">
                  <Btn onClick={() => iniciar(p, "completa")} className="flex-1 justify-center"><Play size={14} /> Prova Completa ({p.totalQuestoes} q)</Btn>
                  {numEsp > 0 && <Btn variant="ghost" onClick={() => iniciar(p, "especificos")} className="flex-1 justify-center"><FileText size={14} /> Só Específicos ({numEsp} q)</Btn>}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (tela === "simulado" && q) {
    const disciplinas = ["todas", ...Object.keys(provaSel.disciplinas)];
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={voltar} className="flex items-center gap-1 text-sm" style={{ color:C.muted }}><ChevronLeft size={16} /> Voltar</button>
          <div className="text-center flex-1 px-3"><div className="font-bold text-sm truncate">{provaSel.titulo}</div><div className="text-xs" style={{ color:C.muted }}>{modo==="especificos"?"Conhecimentos Específicos":"Prova Completa"}</div></div>
          <div className="font-mono text-sm font-bold shrink-0" style={{ color:BRAND }}><Clock size={14} className="inline mr-1" />{mm}:{ss}</div>
        </div>
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1" style={{ color:C.muted }}><span>{respondidas}/{qFiltradas.length} respondidas</span><span>{acertos} acerto{acertos!==1?"s":""}</span></div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background:C.line }}><div className="h-full rounded-full transition-all" style={{ width:`${(respondidas/qFiltradas.length)*100}%`, background:C.gold }} /></div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4">
          {disciplinas.map((d) => <button key={d} onClick={() => { setFiltroDisc(d); setAtual(0); setRevelado(false); }} className="px-2.5 py-1 rounded-full text-xs whitespace-nowrap border transition shrink-0" style={filtroDisc===d ? { background:BRAND, color:"#fff", borderColor:BRAND } : { background:C.surface, color:C.muted, borderColor:C.line }}>{d==="todas"?"Todas":d.replace("Conhecimentos Específicos","Específicos").replace("Língua ","")}</button>)}
        </div>
        <div className="flex flex-wrap gap-1 mb-4">
          {qFiltradas.map((qt, idx) => { const resp = respostas[qt.numero]; return <button key={qt.numero} onClick={() => { setAtual(idx); setRevelado(false); }} className="w-7 h-7 rounded-lg text-[11px] font-bold border-2 transition" style={{ background:resp?BRAND:C.line, color:resp?"#fff":C.muted, borderColor:idx===atual?C.gold:(resp?BRAND:C.line) }}>{qt.numero}</button>; })}
        </div>
        <Card className="mb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><span className="text-xs font-bold" style={{ color:C.muted }}>Q{q.numero}</span><BadgeDisc disc={q.disciplina} /></div>
            <span className="text-xs" style={{ color:C.muted }}>{atual+1}/{qFiltradas.length}</span>
          </div>
          <p className="text-sm leading-relaxed mb-4" style={{ color:C.ink }}>{q.enunciado}</p>
          <div className="space-y-2">
            {Object.entries(q.alternativas).map(([letra, texto]) => {
              let bg=C.surface2, border=C.line, color=C.ink;
              if (respostaAtual===letra && !revelado) { border=BRAND; bg="#EFF6FF"; }
              if (revelado) { if (letra===q.gabarito) { border=C.green; bg=C.greenSoft; } else if (respostaAtual===letra) { border=C.red; bg=C.redSoft; } else { color=C.muted; } }
              return <button key={letra} disabled={revelado} onClick={() => setRespostas((r) => ({ ...r, [q.numero]:letra }))} className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left text-sm border transition" style={{ background:bg, borderColor:border, color }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5" style={{ background:(revelado&&letra===q.gabarito)?C.green:(respostaAtual===letra?BRAND:C.line), color:(respostaAtual===letra||(revelado&&letra===q.gabarito))?"#fff":C.muted }}>{letra}</span>
                <span className="flex-1">{texto}</span>
                {revelado && letra===q.gabarito && <CheckCircle2 size={16} color={C.green} className="shrink-0 mt-0.5" />}
                {revelado && respostaAtual===letra && letra!==q.gabarito && <X size={16} color={C.red} className="shrink-0 mt-0.5" />}
              </button>;
            })}
          </div>
          {revelado && q.comentario && <div className="mt-3 p-3 rounded-xl text-sm" style={{ background:C.goldSoft, color:C.ink }}><span className="font-semibold" style={{ color:C.gold }}>Comentário: </span>{q.comentario}</div>}
        </Card>
        <div className="flex items-center justify-between gap-2">
          <Btn variant="ghost" onClick={() => { setAtual((a) => Math.max(0,a-1)); setRevelado(false); }} disabled={atual===0}><ChevronLeft size={15} /> Anterior</Btn>
          <div className="flex gap-2">
            {!revelado && <Btn variant="ghost" onClick={() => setRevelado(true)}>{respostaAtual?"Ver gabarito":"Pular/Gabarito"}</Btn>}
            <Btn variant="gold" onClick={finalizar}>Finalizar</Btn>
          </div>
          <Btn variant="ghost" onClick={() => { setAtual((a) => Math.min(qFiltradas.length-1,a+1)); setRevelado(false); }} disabled={atual===qFiltradas.length-1}>Próxima <ChevronRight size={15} /></Btn>
        </div>
      </div>
    );
  }

  if (tela === "resultado" && dadosResult) {
    const { prova, questoes:qs, respostas:resp, tempo:t } = dadosResult;
    const tot = qs.length; const cert = qs.filter((q) => resp[q.numero]===q.gabarito).length;
    const pct = Math.round((cert/tot)*100); const aprovado = pct >= 50;
    const tempoFmt = `${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`;
    const porDisc = {};
    qs.forEach((q) => { if (!porDisc[q.disciplina]) porDisc[q.disciplina]={c:0,t:0}; porDisc[q.disciplina].t++; if(resp[q.numero]===q.gabarito) porDisc[q.disciplina].c++; });
    return (
      <div>
        <button onClick={voltar} className="flex items-center gap-1 text-sm mb-6" style={{ color:C.muted }}><ChevronLeft size={16} /> Voltar às provas</button>
        <Card className="mb-4 text-center">
          <Award size={40} className="mx-auto mb-2" color={aprovado?C.gold:C.muted} />
          <h2 className="font-extrabold text-lg mb-1">{prova.titulo}</h2>
          <p className="text-sm mb-4" style={{ color:C.muted }}>Tempo: {tempoFmt}</p>
          <div className="text-6xl font-black mb-1" style={{ color:aprovado?C.green:C.red }}>{pct}%</div>
          <p className="text-sm mb-3" style={{ color:C.muted }}>{cert} de {tot} corretas</p>
          <span className="px-4 py-1.5 rounded-full text-sm font-semibold" style={{ background:aprovado?C.greenSoft:C.redSoft, color:aprovado?C.green:C.red }}>{aprovado?"✓ Aprovado (≥50%)":"✗ Abaixo da média"}</span>
        </Card>
        <Card className="mb-4">
          <div className="text-sm font-semibold mb-3 flex items-center gap-2"><BarChart3 size={16} color={C.gold} /> Desempenho por disciplina</div>
          {Object.entries(porDisc).map(([disc, val]) => { const p2=Math.round((val.c/val.t)*100); return <div key={disc} className="mb-3"><div className="flex justify-between text-sm mb-1"><span style={{ color:C.inkSoft }}>{disc}</span><span className="font-semibold">{val.c}/{val.t} ({p2}%)</span></div><div className="h-2 rounded-full overflow-hidden" style={{ background:C.line }}><div className="h-full rounded-full" style={{ width:`${p2}%`, background:p2>=70?C.green:p2>=50?C.gold:C.red }} /></div></div>; })}
        </Card>
        <Card className="mb-4">
          <div className="text-sm font-semibold mb-3 flex items-center gap-2"><X size={16} color={C.red} /> Questões incorretas ({tot-cert})</div>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {qs.filter((q) => resp[q.numero]!==q.gabarito).map((q) => <div key={q.numero} className="p-3 rounded-xl text-sm" style={{ background:C.redSoft }}><div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold" style={{ color:C.muted }}>Q{q.numero}</span><BadgeDisc disc={q.disciplina} /></div><p className="mb-1 line-clamp-2" style={{ color:C.ink }}>{q.enunciado}</p><div className="flex gap-4 text-xs"><span style={{ color:C.red }}>Você: {resp[q.numero]||"—"}</span><span style={{ color:C.green }}>Gabarito: {q.gabarito}</span></div>{q.comentario&&<p className="text-xs mt-1 italic" style={{ color:C.muted }}>{q.comentario}</p>}</div>)}
            {cert===tot && <p className="text-center py-4" style={{ color:C.green }}>🎉 Parabéns! Acertou tudo!</p>}
          </div>
        </Card>
        <div className="flex gap-3">
          <Btn className="flex-1 justify-center" onClick={() => iniciar(dadosResult.prova, dadosResult.modo)}><RotateCcw size={15} /> Refazer</Btn>
          <Btn variant="ghost" className="flex-1 justify-center" onClick={voltar}>Outra prova</Btn>
        </div>
      </div>
    );
  }
  return null;
}

/* ============================ SIMULADOS ============================ */
function SimuladosView({ simulados, setSimulados, disciplines, discById }) {
  const C = useC();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const sorted = [...simulados].sort((a, b) => b.date.localeCompare(a.date));
  function save(sim) { if (sim.id) { setSimulados((p) => p.map((s) => s.id === sim.id ? { ...s, ...sim } : s)); } else { setSimulados((p) => [{ id: uid(), ...sim }, ...p]); } setOpen(false); setEditing(null); }
  function remove(id) { setSimulados((p) => p.filter((s) => s.id !== id)); }
  const evo = sorted.slice().reverse().map((s) => { const t = s.rows.reduce((a, r) => a + r.total, 0); const c = s.rows.reduce((a, r) => a + r.right, 0); return { nome: s.name.slice(0, 8), taxa: t ? Math.round((c / t) * 100) : 0 }; });
  return <div>
    <PageTitle sub="Registre simulados, provas anteriores e questões avulsas. Cruze com o tempo de estudo para achar lacunas.">Simulados</PageTitle>
    <div className="mb-4"><Btn onClick={() => setOpen(true)}><Plus size={15} /> Registrar simulado</Btn></div>
    {evo.length > 1 && <Card className="mb-4"><div className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp size={16} color={C.gold} /> Evolução da taxa de acerto</div><ResponsiveContainer width="100%" height={200}><LineChart data={evo}><CartesianGrid strokeDasharray="3 3" stroke={C.line} /><XAxis dataKey="nome" fontSize={11} stroke={C.muted} /><YAxis domain={[0, 100]} fontSize={11} stroke={C.muted} /><Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, color: C.ink }} /><Line type="monotone" dataKey="taxa" stroke={C.gold} strokeWidth={2.5} dot={{ fill: C.gold, r: 4 }} /></LineChart></ResponsiveContainer></Card>}
    {sorted.length === 0 ? <Empty msg="Nenhum simulado registrado ainda." /> : <div className="space-y-3">{sorted.map((s) => { const tot = s.rows.reduce((a, r) => a + r.total, 0); const cor = s.rows.reduce((a, r) => a + r.right, 0); const acc = tot ? Math.round((cor / tot) * 100) : 0;
      return <Card key={s.id}><div className="flex items-center gap-3 mb-3"><div className="flex-1"><div className="font-bold">{s.name}</div><div className="text-xs" style={{ color: C.muted }}>{fmtDate(s.date)} · {cor}/{tot} acertos</div></div><span className="text-lg font-extrabold" style={{ color: acc >= 70 ? C.green : acc >= 50 ? C.gold : C.red }}>{acc}%</span><button onClick={() => setEditing(s)}><Pencil size={15} color={C.muted} /></button><button onClick={() => remove(s.id)}><Trash2 size={15} color={C.red} /></button></div><div className="space-y-1.5">{s.rows.map((r, i) => { const a = r.total ? Math.round((r.right / r.total) * 100) : 0; return <div key={i} className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full" style={{ background: discById[r.disciplineId]?.color }} /><span className="flex-1 min-w-0 truncate">{discById[r.disciplineId]?.name}</span><span className="text-xs" style={{ color: C.muted }}>{r.right}/{r.total}</span><span className="text-xs font-semibold w-10 text-right" style={{ color: a >= 60 ? C.green : C.red }}>{a}%</span></div>; })}</div></Card>; })}</div>}
    {(open || editing) && <SimModal disciplines={disciplines} initial={editing} onClose={() => { setOpen(false); setEditing(null); }} onSave={save} />}
  </div>;
}
function SimModal({ disciplines, onClose, onSave, initial }) {
  const C = useC();
  const [name, setName] = useState(initial?.name || ""); const [date, setDate] = useState(initial?.date || todayISO());
  const [rows, setRows] = useState(disciplines.map((d) => { const f = initial?.rows?.find((r) => r.disciplineId === d.id); return { disciplineId: d.id, right: f && f.right ? String(f.right) : "", total: f && f.total ? String(f.total) : "" }; }));
  function up(i, k, v) { setRows((p) => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r)); }
  const valid = rows.filter((r) => +r.total > 0).map((r) => ({ disciplineId: r.disciplineId, right: +r.right || 0, total: +r.total }));
  return <Modal open title={initial ? "Editar simulado" : "Registrar simulado"} onClose={onClose}>
    <Field label="Nome"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={inputStyle(C)} placeholder="Ex.: Dataprev 2024 / Simulado Arquitetura 01" /></Field>
    <Field label="Data"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} style={inputStyle(C)} /></Field>
    <div className="text-xs font-semibold mb-2" style={{ color: C.muted }}>Acertos / total por disciplina (deixe em branco o que não caiu)</div>
    <div className="space-y-2 mb-4">{disciplines.map((d, i) => (<div key={d.id} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: d.color }} /><span className="text-sm flex-1 truncate">{d.name}</span><input type="number" value={rows[i].right} onChange={(e) => up(i, "right", e.target.value)} className="w-14 px-2 py-1 rounded-lg text-sm text-center" style={inputStyle(C)} placeholder="✓" /><span style={{ color: C.muted }}>/</span><input type="number" value={rows[i].total} onChange={(e) => up(i, "total", e.target.value)} className="w-14 px-2 py-1 rounded-lg text-sm text-center" style={inputStyle(C)} placeholder="tot" /></div>))}</div>
    <Btn className="w-full justify-center" disabled={!valid.length} onClick={() => onSave({ id: initial?.id, name: name || "Simulado", date, rows: valid })}><Check size={16} /> {initial ? "Salvar alterações" : "Salvar simulado"}</Btn>
  </Modal>;
}

/* ============================ Seletor de Concurso ============================ */
function StudyAppWithConcurso({ onLogout }) {
  const [concurso, setConcursoState] = React.useState(CONCURSOS[0]);

  React.useEffect(() => {
    store.get("active_concurso", "dataprev-arq").then((id) => {
      const c = CONCURSOS.find((x) => x.id === id) || CONCURSOS[0];
      setConcursoState(c);
    });
  }, []);

  function setConcurso(id) {
    const c = CONCURSOS.find((x) => x.id === id) || CONCURSOS[0];
    setConcursoState(c);
    store.set("active_concurso", id);
  }

  return <StudyApp key={concurso.id} concurso={concurso} setConcurso={setConcurso} onLogout={onLogout} />;
}

/* ============================ Autenticação ============================ */
export default function App() {
  const [session, setSession] = React.useState(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      setCurrentUser(data.session?.user?.id || null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess || null);
      setCurrentUser(sess?.user?.id || null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: LIGHT.bg }}>
      <div style={{ textAlign: "center" }}><BookOpen size={40} color={LIGHT.ink} /><p style={{ marginTop: 12, fontSize: 14, color: LIGHT.muted }}>Carregando…</p></div>
    </div>;
  }
  if (!session) return <Login />;
  return <StudyAppWithConcurso onLogout={() => supabase.auth.signOut()} />;
}

function Login() {
  const [mode, setMode] = React.useState("login"); // login | signup
  const [email, setEmail] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [msg, setMsg] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const P = LIGHT;

  async function submit(e) {
    e?.preventDefault();
    setBusy(true); setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw error;
        setMsg({ ok: true, t: "Conta criada. Se o projeto exigir confirmação, verifique seu e-mail; senão, já pode entrar." });
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
      }
    } catch (err) {
      setMsg({ ok: false, t: err.message || "Erro ao autenticar." });
    } finally { setBusy(false); }
  }

  const inp = { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: `1px solid ${P.line}`, fontSize: 14, marginTop: 6, outline: "none" };
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: P.bg, fontFamily: "'Inter',ui-sans-serif,system-ui,sans-serif", padding: 16 }}>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 380, background: P.surface, border: `1px solid ${P.line}`, borderRadius: 20, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: BRAND, display: "flex", alignItems: "center", justifyContent: "center" }}><BookOpen size={20} color="#F5B301" /></div>
          <div><div style={{ fontWeight: 800, fontSize: 20, color: P.ink }}>Studora</div><div style={{ fontSize: 11, color: P.muted }}>Dataprev · Arquitetura</div></div>
        </div>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: P.ink, margin: "0 0 14px" }}>{mode === "login" ? "Entrar" : "Criar conta"}</h1>
        <label style={{ fontSize: 12, fontWeight: 600, color: P.muted }}>E-mail
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inp} placeholder="voce@email.com" />
        </label>
        <div style={{ height: 12 }} />
        <label style={{ fontSize: 12, fontWeight: 600, color: P.muted }}>Senha
          <input type="password" required minLength={6} value={pass} onChange={(e) => setPass(e.target.value)} style={inp} placeholder="mínimo 6 caracteres" />
        </label>
        {msg && <div style={{ marginTop: 12, fontSize: 13, color: msg.ok ? P.green : P.red }}>{msg.t}</div>}
        <button type="submit" disabled={busy} style={{ width: "100%", marginTop: 18, padding: "11px 0", borderRadius: 12, border: "none", background: BRAND, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
        </button>
        <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMsg(null); }} style={{ width: "100%", marginTop: 10, background: "transparent", border: "none", color: P.inkSoft, fontSize: 13, cursor: "pointer" }}>
          {mode === "login" ? "Não tem conta? Criar agora" : "Já tenho conta — entrar"}
        </button>
      </form>
    </div>
  );
}
