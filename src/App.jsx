import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from "react";
import {
  Home, RefreshCw, CalendarDays, ListChecks, BookOpen, BarChart3,
  ClipboardList, Play, Plus, Flame, Target, Clock, Check,
  Trash2, Pencil, X, ChevronRight, TrendingUp, Circle, CheckCircle2,
  Timer as TimerIcon, Menu, Crosshair, Zap, Sun, Moon, RotateCcw, LogOut,
  GraduationCap, FileText, ChevronLeft, AlertCircle, Award, Filter, History,
  Layers, ChevronDown, ClipboardCheck, Download, Upload
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { supabase } from "./supabaseClient";
import { EDITAIS, SEED_DATAPREV, SEED_DATAPREV3 } from "./data/editais";
import { PROVAS } from "./data/provas";

/* ============================ Temas ============================ */
const BRAND = "#0B2A5B";        // navy da marca (fixo nos dois temas)
const DISC_COLORS = ["#2D6BE0", "#F5B301", "#159A6C", "#7C5CFC", "#E5484D", "#0EA5B7", "#EC6D1F", "#3B82F6", "#DB2777"];
const LIGHT = {
  bg: "#F5F7FA", surface: "#FFFFFF", surface2: "#FFFFFF", sidebar: "#FFFFFF",
  ink: "#0B2A5B", inkSoft: "#1E3A6B", muted: "#6B7280", line: "#E6EAF0",
  gold: "#C98A00", goldSoft: "#FFF4D6", green: "#159A6C", greenSoft: "#E4F5EE",
  red: "#D5383D", redSoft: "#FCE9E9",
  navActiveBg: BRAND, navActiveInk: "#FFFFFF", chip: "#FFFFFF",
};
const DARK = {
  bg: "#0A0F1C", surface: "#111726", surface2: "#0D1220", sidebar: "#0D1220",
  ink: "#F2F4F8", inkSoft: "#AEB6C7", muted: "#8A96AC", line: "rgba(255,255,255,.07)",
  gold: "#F5B301", goldSoft: "rgba(245,179,1,.14)", green: "#3DBE7A", greenSoft: "rgba(61,190,122,.14)",
  red: "#E5544F", redSoft: "rgba(229,84,79,.14)",
  navActiveBg: "rgba(245,179,1,.12)", navActiveInk: "#F5B301", chip: "rgba(255,255,255,.05)",
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
  { id: "dataprev-arq", label: "DATAPREV", subtitle: "Perfil 2 — Arquitetura de Software", seed: SEED_DATAPREV,
    seedSimsData: [
      { name: "Dataprev 2024 — Arquitetura", date: "2024-11-17" },
      { name: "Dataprev 2023 — Arquitetura", date: "2023-10-22" },
    ],
  },
  { id: "dataprev-dev", label: "DATAPREV", subtitle: "Perfil 3 — Desenvolvimento de Software", seed: SEED_DATAPREV3,
    seedSimsData: [],
  },
  // BB oculto por enquanto (dados preservados em data/editais.js e data/provas.js):
  // { id: "bb-at", label: "BB", subtitle: "Agente de Tecnologia", seed: SEED_BB,
  //   seedSimsData: [
  //     { name: "BB 2023 — Agente de Tecnologia", date: "2023-10-29" },
  //     { name: "BB 2022 — Agente de Tecnologia", date: "2022-07-10" },
  //   ],
  // },
];

const REVIEW_INTERVALS = [1, 3, 7, 15, 30];
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/* ============================ Flashcards (Leitner) ============================ */
const DAY_MS = 24 * 60 * 60 * 1000;
const BOX_DAYS = { 1: 1, 2: 3, 3: 7 };
const FACIL_DAYS = 10;
// Vencimento cai na virada do dia, não na hora exata da revisão: uma ficha
// agendada pra daqui 3 dias já está disponível às 00h do terceiro dia.
const dueInDays = (n) => { const d = new Date(Date.now() + n * DAY_MS); d.setHours(0, 0, 0, 0); return d.getTime(); };
const MOTIVOS_ERRO = [
  "Não sabia o conteúdo",
  "Conhecia o conteúdo parcialmente",
  "Confundi conceitos semelhantes",
  "Esqueci uma regra, fórmula ou definição",
  "Apliquei o conceito de forma incorreta",
  "Interpretação equivocada do enunciado",
  "Não percebi palavra-chave ou exceção",
  "Desatenção / leitura apressada",
  "Erro de cálculo",
  "Falta de domínio de conteúdo pré-requisito",
  "Gestão inadequada do tempo",
  "Erro de marcação ou transcrição",
  "Fiquei em dúvida entre alternativas",
  "Chutei",
];
// O motivo decide o tratamento: memória vira flashcard; método é conduta de prova,
// que ficha nenhuma conserta; treino pede refazer questão do tipo.
const MOTIVO_TIPO = {
  "Não sabia o conteúdo": "memoria",
  "Conhecia o conteúdo parcialmente": "memoria",
  "Confundi conceitos semelhantes": "memoria",
  "Esqueci uma regra, fórmula ou definição": "memoria",
  "Não percebi palavra-chave ou exceção": "memoria",
  "Apliquei o conceito de forma incorreta": "treino",
  "Erro de cálculo": "treino",
  "Falta de domínio de conteúdo pré-requisito": "treino",
  "Interpretação equivocada do enunciado": "metodo",
  "Desatenção / leitura apressada": "metodo",
  "Gestão inadequada do tempo": "metodo",
  "Erro de marcação ou transcrição": "metodo",
  "Fiquei em dúvida entre alternativas": "metodo",
  "Chutei": "metodo",
};
const tipoMotivo = (m) => MOTIVO_TIPO[m] || "treino";
const TIPO_LABEL = { memoria: "memória", treino: "treino", metodo: "método" };
const TIPO_NOTA = {
  memoria: "Falha de memória — é o caso clássico de flashcard.",
  treino: "Você sabia a teoria e escorregou na aplicação. Se o buraco é uma definição, vire ficha; se é procedimento, refaça questões do tipo.",
  metodo: "Erro de conduta na prova, não de conteúdo. Flashcard não resolve — anote a regra que você vai seguir da próxima vez.",
};
const makeCard = (front, back, disciplineId, topicId = null) => ({ id: uid(), front, back, disciplineId, topicId, box: 1, due: Date.now(), created: Date.now() });

/* ============================ Helpers ============================ */
const uid = () => Math.random().toString(36).slice(2, 10);
const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const fmtMin = (m) => { const h = Math.floor(m / 60), mm = m % 60; return h ? `${h}h${mm ? String(mm).padStart(2, "0") : ""}` : `${mm}min`; };
const fmtDate = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
const startOfWeek = (iso) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0, 10); };
const fmtTime = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`; };
let CURRENT_USER_ID = null;
export function setCurrentUser(id) { CURRENT_USER_ID = id; }

/* ============================ Exportar (CSV / Markdown) ============================ */
function csvEscape(v) {
  const s = String(v ?? "");
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCSV(headers, rows) {
  const lines = [headers.map(csvEscape).join(";")];
  rows.forEach((r) => lines.push(r.map(csvEscape).join(";")));
  return lines.join("\n");
}
function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function parseCSV(text) {
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.split(/\r?\n/)[0] || "";
  const delim = firstLine.split(";").length > firstLine.split(",").length ? ";" : ",";
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === delim) { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (ch === "\r") { /* ignora */ }
    else field += ch;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
}
const normName = (s) => String(s || "").trim().toLowerCase();
function csvToObjects(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => String(h).trim());
  return rows.slice(1).map((r) => {
    const o = {};
    headers.forEach((h, i) => { o[h] = (r[i] ?? "").trim(); });
    return o;
  });
}
function ImportButton({ onImport }) {
  const C = useC();
  const inputRef = useRef(null);
  const [msg, setMsg] = useState(null);
  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const objs = csvToObjects(String(reader.result));
        const res = onImport(objs) || { added: 0, skipped: 0 };
        setMsg(`${res.added} importado(s)${res.skipped ? ` · ${res.skipped} ignorado(s)` : ""}`);
      } catch {
        setMsg("Não consegui ler o arquivo. Confira o formato CSV.");
      }
      setTimeout(() => setMsg(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = "";
  }
  return (
    <>
      <button onClick={() => inputRef.current?.click()} className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ border: `1px solid ${C.line}`, color: C.inkSoft }}>
        <Upload size={13} /> Importar CSV
      </button>
      <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
      {msg && <span className="text-xs self-center" style={{ color: C.muted }}>{msg}</span>}
    </>
  );
}
function ExportBar({ headers, rows, filenameBase, children }) {
  const C = useC();
  function handleCsv() {
    downloadFile(`${filenameBase}.csv`, toCSV(headers, rows), "text/csv;charset=utf-8;");
  }
  const hasRows = rows.length > 0;
  return (
    <div className="flex gap-2 mb-3 flex-wrap">
      {hasRows && (
        <button onClick={handleCsv} className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ border: `1px solid ${C.line}`, color: C.inkSoft }}>
          <Download size={13} /> Baixar CSV
        </button>
      )}
      {children}
    </div>
  );
}

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

// Cada perfil segue sua própria estrutura de edital/tópicos; mas onde a disciplina e o
// tópico têm exatamente o mesmo nome entre perfis (pontos em comum), o progresso
// (studied/hits) fica compartilhado globalmente em vez de duplicado por perfil.
function mergeSharedProgress(disciplines, progress) {
  if (!progress) return disciplines;
  return disciplines.map((d) => {
    const dp = progress[d.name];
    if (!dp) return d;
    return { ...d, topics: d.topics.map((t) => (dp[t.name] ? { ...t, studied: dp[t.name].studied, hits: dp[t.name].hits ?? t.hits } : t)) };
  });
}
function extractSharedProgress(disciplines) {
  const progress = {};
  disciplines.forEach((d) => {
    progress[d.name] = {};
    d.topics.forEach((t) => { progress[d.name][t.name] = { studied: t.studied, hits: t.hits }; });
  });
  return progress;
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


function seedSims(disc, simData) {
  const mk = () => disc.map((d) => ({ disciplineId: d.id, right: 0, total: d.q }));
  return simData.map((s) => ({ id: uid(), name: s.name, date: s.date, rows: mk() }));
}

/* ============================ App ============================ */
function StudyApp({ onLogout, concurso, setConcurso, onOpenPicker }) {
  const CK = (k) => `${concurso.id}_${k}`;
  const [loading, setLoading] = useState(true);
  const [preloaderExiting, setPreloaderExiting] = useState(false);
  const [showPreloader, setShowPreloader] = useState(true);
  const [view, setView] = useState("home");
  const [navOpen, setNavOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const [disciplines, setDisciplines] = useState([]);
  const [sharedProgressBase, setSharedProgressBase] = useState({});
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [plan, setPlan] = useState([]);
  const [goals, setGoals] = useState({ hours: 20, questions: 200 });
  const [simulados, setSimulados] = useState([]);
  const [streakDays, setStreakDays] = useState({});
  const [cards, setCards] = useState([]);
  const [erros, setErros] = useState([]);
  const [cardStats, setCardStats] = useState({ reviewsByDisc: {}, studyDates: [] });
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

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
      const sp = await store.get("sharedProgress", {});
      setSharedProgressBase(sp);
      d = mergeSharedProgress(d, sp);
      setDisciplines(d);
      setSessions(await store.get(CK("sess"), []));
      setReviews(await store.get(CK("rev"), []));
      setPlan(await store.get(CK("plan"), []));
      let sm = await store.get(CK("sim"), null); if (!sm) { sm = seedSims(d, concurso.seedSimsData); await store.set(CK("sim"), sm); } setSimulados(sm);
      setGoals(await store.get(CK("goals"), { hours: 20, questions: 200 }));
      setStreakDays(await store.get("streakDays", {}));
      setCards(await store.get(CK("cards"), []));
      setErros(await store.get(CK("erros"), []));
      setCardStats(await store.get(CK("cardStats"), { reviewsByDisc: {}, studyDates: [] }));
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
    const t1 = setTimeout(() => setPreloaderExiting(true), 300);
    const t2 = setTimeout(() => setShowPreloader(false), 1300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [loading]);

  useEffect(() => { document.body.style.background = C.bg; }, [C]);
  useEffect(() => { if (!loading) store.set("theme", theme); }, [theme, loading]);
  useEffect(() => { if (!loading) store.set(CK("disc"), disciplines); }, [disciplines, loading]);
  useEffect(() => { if (!loading) store.set("sharedProgress", { ...sharedProgressBase, ...extractSharedProgress(disciplines) }); }, [disciplines, loading]);
  useEffect(() => { if (!loading) store.set(CK("sess"), sessions); }, [sessions, loading]);
  useEffect(() => { if (!loading) store.set(CK("rev"), reviews); }, [reviews, loading]);
  useEffect(() => { if (!loading) store.set(CK("plan"), plan); }, [plan, loading]);
  useEffect(() => { if (!loading) store.set(CK("goals"), goals); }, [goals, loading]);
  useEffect(() => { if (!loading) store.set("streakDays", streakDays); }, [streakDays, loading]);
  useEffect(() => { if (!loading) store.set(CK("sim"), simulados); }, [simulados, loading]);
  useEffect(() => { if (!loading) store.set(CK("cards"), cards); }, [cards, loading]);
  useEffect(() => { if (!loading) store.set(CK("erros"), erros); }, [erros, loading]);
  useEffect(() => { if (!loading) store.set(CK("cardStats"), cardStats); }, [cardStats, loading]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const discById = useMemo(() => Object.fromEntries(disciplines.map((d) => [d.id, d])), [disciplines]);

  function registerStudy({ disciplineId, topicId, studyType, minutes, right, wrong, note, date, material, paginaInicio, paginaFim, videoTitulo }) {
    const s = { id: uid(), disciplineId, topicId: topicId || null, studyType: studyType || "teoria", minutes, right: right || 0, wrong: wrong || 0, note: note || "", material: material || "", paginaInicio: paginaInicio || "", paginaFim: paginaFim || "", videoTitulo: videoTitulo || "", date: date || todayISO() };
    setSessions((p) => [s, ...p]);
    const sessionDay = new Date((date || todayISO()) + "T00:00:00").getDay();
    setPlan((prev) => { const idx = prev.findIndex((p) => p.day === sessionDay && p.disciplineId === disciplineId && !p.done); if (idx === -1) return prev; const next = [...prev]; next[idx] = { ...next[idx], done: true }; return next; });
    if (topicId) setDisciplines((p) => p.map((d) => d.id === disciplineId ? { ...d, topics: d.topics.map((t) => t.id === topicId ? { ...t, studied: true } : t) } : d));
    return s;
  }
  function markReviewDone(rid) {
    setReviews((p) => p.map((r) => (r.id === rid ? { ...r, done: true } : r)));
  }

  if (loading) return <Preloader exiting={false} />;
  if (showPreloader) return <Preloader exiting={preloaderExiting} />;

  const shared = { concurso, disciplines, setDisciplines, sessions, setSessions, reviews, setReviews, plan, setPlan, goals, setGoals, simulados, setSimulados, streakDays, setStreakDays, cards, setCards, erros, setErros, cardStats, setCardStats, discById, registerStudy, markReviewDone, setView };
  const NAV = [
    ["home", "Início", Home], ["raiox", "Raio-X da prova", Crosshair],
    ["plano", "Planejamento", CalendarDays], ["revisoes", "Revisões", ListChecks],
    ["questoes", "Questões", ClipboardCheck],
    ["flashcards", "Flashcards", Layers], ["erros", "Caderno de erros", AlertCircle],
    ["edital", "Edital verticalizado", BookOpen], ["historico", "Histórico", History], ["stats", "Estatísticas", BarChart3], ["simulados", "Simulados", ClipboardList],
    ["provas", `Provas ${concurso.label}`, GraduationCap],
  ];

  return (
    <ThemeCtx.Provider value={C}>
      <div style={{ background: C.bg, minHeight: "100vh", color: C.ink, fontFamily: "'Inter',ui-sans-serif,system-ui,sans-serif" }}>
        <div className="flex">
          <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r" style={{ background: C.sidebar, borderColor: C.line }}>
            <Brand concurso={concurso} onOpenPicker={onOpenPicker} />
            <nav className="px-3 flex-1 space-y-1 overflow-auto">{NAV.map(([id, label, Icon]) => <NavItem key={id} active={view === id} onClick={() => setView(id)} Icon={Icon} label={label} />)}</nav>
            <div className="p-3 border-t" style={{ borderColor: C.line }}>
              <ThemeToggle theme={theme} setTheme={setTheme} />
              <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "transparent", color: C.inkSoft }}><LogOut size={16} color={C.inkSoft} /> Sair</button>
            </div>
          </aside>

          {navOpen && (
            <div className="md:hidden fixed inset-0 z-40" onClick={() => setNavOpen(false)}>
              <div className="absolute inset-0 bg-black/50" />
              <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col overflow-auto" style={{ background: C.sidebar }} onClick={(e) => e.stopPropagation()}>
                <Brand concurso={concurso} onOpenPicker={onOpenPicker} />
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
              {view === "plano" && <PlanoView {...shared} />}
              {view === "revisoes" && <RevisoesView {...shared} />}
              {view === "questoes" && <QuestoesView {...shared} />}
              {view === "flashcards" && <FlashcardsView {...shared} />}
              {view === "erros" && <ErrosView {...shared} />}
              {view === "edital" && <EditalView {...shared} />}
              {view === "historico" && <HistoricoView {...shared} />}
              {view === "stats" && <StatsView {...shared} />}
              {view === "simulados" && <SimuladosView {...shared} />}
              {view === "provas" && <ProvasView concurso={concurso} />}
            </div>
          </main>
        </div>

        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t flex justify-around" style={{ background: C.surface, borderColor: C.line }}>
          {[["home", Home], ["raiox", Crosshair], ["plano", CalendarDays], ["edital", BookOpen], ["stats", BarChart3]].map(([id, Icon]) => (
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
  return <button onClick={() => setTheme(dark ? "light" : "dark")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "transparent", color: C.inkSoft }}>
    {dark ? <Sun size={16} color={C.inkSoft} /> : <Moon size={16} color={C.inkSoft} />} {dark ? "Tema claro" : "Tema escuro"}
  </button>;
}
function Brand({ concurso, onOpenPicker }) {
  const C = useC();
  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ border: "1px solid #F5B301", transform: "rotate(45deg)" }}>
          <BookOpen size={15} color="#F5B301" style={{ transform: "rotate(-45deg)" }} />
        </div>
        <div className="font-extrabold text-lg leading-none tracking-tight" style={{ color: C.ink }}>Studora</div>
      </div>
      <button onClick={onOpenPicker}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left transition-all"
        style={{ background: C.chip, color: C.ink }}>
        <div className="min-w-0">
          <div className="text-[13px] font-bold leading-tight truncate">{concurso?.label}</div>
          {concurso?.subtitle && <div className="text-[11px] leading-tight truncate" style={{ color: C.muted }}>{concurso.subtitle}</div>}
        </div>
        <ChevronDown size={15} color={C.muted} style={{ transform: "rotate(-90deg)", flexShrink: 0 }} />
      </button>
    </div>
  );
}
function NavItem({ active, onClick, Icon, label }) { const C = useC(); return <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition" style={{ background: active ? C.navActiveBg : "transparent", color: active ? C.navActiveInk : C.inkSoft }}><Icon size={18} color={active ? C.navActiveInk : C.muted} /> {label}</button>; }
function Card({ children, className = "", style = {}, onClick }) { const C = useC(); return <div onClick={onClick} className={`rounded-2xl p-5 ${className}`} style={{ background: C.surface, border: `1px solid ${C.line}`, ...style }}>{children}</div>; }
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
function useMetrics(sessions, disciplines, streakDays = {}) {
  return useMemo(() => {
    const byDisc = {}; disciplines.forEach((d) => (byDisc[d.id] = { minutes: 0, right: 0, wrong: 0, name: d.name, color: d.color }));
    sessions.forEach((s) => { const b = byDisc[s.disciplineId]; if (b) { b.minutes += s.minutes; b.right += s.right; b.wrong += s.wrong; } });
    const sessDays = new Set(sessions.map((s) => s.date));
    // Marcação manual (streakDays) tem prioridade sobre as sessões registradas
    const dayDone = (d) => (streakDays[d] !== undefined ? streakDays[d] : sessDays.has(d));
    // Sequência: conta dias consecutivos até hoje (ou ontem); qualquer dia sem estudo zera
    let streak = 0; let cur = todayISO();
    if (!dayDone(cur)) cur = addDays(cur, -1);
    while (dayDone(cur)) { streak++; cur = addDays(cur, -1); }
    const wk = startOfWeek(todayISO()); const weekSess = sessions.filter((s) => s.date >= wk);
    return { byDisc, dayDone, streak, weekMin: weekSess.reduce((a, s) => a + s.minutes, 0), weekQ: weekSess.reduce((a, s) => a + s.right + s.wrong, 0), totalMin: sessions.reduce((a, s) => a + s.minutes, 0) };
  }, [sessions, disciplines, streakDays]);
}
function usePriority(disciplines) {
  return useMemo(() => { const list = []; disciplines.forEach((d) => d.topics.forEach((t) => list.push({ disc: d, topic: t, score: (t.hits || 0) * d.peso }))); return list.filter((x) => !x.topic.studied && x.topic.hits > 0).sort((a, b) => b.score - a.score); }, [disciplines]);
}

/* ============================ HOME ============================ */
function HomeView({ sessions, disciplines, reviews, goals, markReviewDone, setView, discById, concurso, streakDays, setStreakDays }) {
  const C = useC();
  const m = useMetrics(sessions, disciplines, streakDays);
  const priority = usePriority(disciplines);
  const dueToday = reviews.filter((r) => !r.done && r.due <= todayISO());
  const qPct = Math.min(100, Math.round((m.weekQ / goals.questions) * 100));
  const activeDisc = Object.entries(m.byDisc).filter(([, v]) => v.minutes > 0);
  const daysToProva = concurso?.provaDate ? Math.max(0, Math.ceil((new Date(concurso.provaDate + "T00:00:00") - new Date(todayISO() + "T00:00:00")) / 86400000)) : null;
  const pctColor = (p) => (p >= 60 ? C.green : C.gold);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold">Bom estudo</h1>
          <p className="text-sm mt-1" style={{ color: C.muted }}>Aqui está o seu progresso atualizado.</p>
        </div>
        {daysToProva !== null && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg" style={{ background: C.chip, border: `1px solid ${C.line}` }}>
            <Clock size={15} color={C.gold} />
            <span className="text-[13px] font-semibold" style={{ color: C.inkSoft }}>Prova em {daysToProva} dias</span>
          </div>
        )}
      </div>

      {/* Comece por aqui */}
      <div className="rounded-xl px-5 py-4" style={{ background: `linear-gradient(135deg, ${C.goldSoft}, transparent)`, border: `1px solid ${C.gold}55` }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-[13px] font-bold" style={{ color: C.gold }}><Zap size={15} /> Comece por aqui</div>
          <button className="text-xs font-semibold" style={{ color: C.gold }} onClick={() => setView("raiox")}>Ver raio-x completo →</button>
        </div>
        {priority.length === 0 ? <Empty msg="Sem tópicos prioritários pendentes — bom trabalho!" /> : priority.slice(0, 3).map(({ disc, topic }, i) => {
          const alta = i < 2;
          return (
            <div key={topic.id} className="flex items-center gap-3 py-2" style={{ borderTop: `1px solid ${C.gold}26` }}>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md shrink-0 tracking-wide" style={{ background: alta ? C.gold : C.goldSoft, color: alta ? "#12161F" : C.gold }}>{alta ? "PRIORIDADE ALTA" : "PRIORIDADE MÉDIA"}</span>
              <span className="text-[13px] min-w-0 truncate" style={{ color: C.ink }}>{disc.name}: {topic.name}</span>
            </div>
          );
        })}
      </div>

      {/* Constância + Metas */}
      <Card className="grid md:grid-cols-[1fr_1px_1.4fr] gap-7 items-start !p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: C.muted }}><Flame size={15} /> Constância</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold">{m.streak}</span>
            <span className="text-[13px]" style={{ color: C.muted }}>{m.streak === 1 ? "dia seguido" : "dias seguidos"}</span>
          </div>
          <StreakDots dayDone={m.dayDone} onToggle={(d) => setStreakDays((prev) => ({ ...prev, [d]: !m.dayDone(d) }))} />
        </div>
        <div className="hidden md:block h-full" style={{ background: C.line }} />
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: C.muted }}><Target size={15} /> Metas da semana</div>
          <GoalBar label="Questões resolvidas" value={m.weekQ} target={goals.questions} pct={qPct} unit="" color={pctColor(qPct)} />
        </div>
      </Card>

      <div className="grid md:grid-cols-[1fr_1.3fr] gap-5 items-start">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-bold"><ListChecks size={16} /> Revisões de hoje</div>
            <button className="text-xs font-semibold" style={{ color: C.gold }} onClick={() => setView("revisoes")}>Ver todas →</button>
          </div>
          {dueToday.length === 0 ? (
            <div className="flex flex-col items-center text-center gap-2.5 px-2 pt-4 pb-1">
              <CheckCircle2 size={32} color={C.green} />
              <div className="text-sm font-bold">Nada para revisar hoje</div>
              <div className="text-[13px] leading-relaxed" style={{ color: C.muted }}>Aproveite para adiantar o foco recomendado acima, ou resolver questões extras.</div>
            </div>
          ) : dueToday.slice(0, 5).map((r) => (
            <div key={r.id} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: C.line }}>
              <button onClick={() => markReviewDone(r.id)}><Circle size={20} color={C.muted} /></button>
              <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{r.label}</div><div className="text-xs" style={{ color: C.muted }}>{discById[r.disciplineId]?.name} · {REVIEW_INTERVALS[r.intervalIdx]}d</div></div>
              {r.due < todayISO() && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: C.redSoft, color: C.red }}>atrasada</span>}
            </div>
          ))}
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2 text-sm font-bold"><BarChart3 size={16} /> Desempenho por disciplina</div>
          {activeDisc.length === 0 ? <Empty msg="Registre um estudo para ver seu desempenho aqui." /> : activeDisc.slice(0, 7).map(([id, v]) => {
            const tot = v.right + v.wrong; const acc = tot ? Math.round((v.right / tot) * 100) : null;
            return (
              <div key={id} className="flex items-center justify-between py-3 border-t" style={{ borderColor: C.line }}>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{v.name}</div>
                  <div className="flex gap-3 text-xs">
                    <span className="flex items-center gap-1" style={{ color: C.green }}><Check size={11} />{v.right}</span>
                    <span className="flex items-center gap-1" style={{ color: C.red }}><X size={11} />{v.wrong}</span>
                  </div>
                </div>
                <div className="text-right flex flex-col gap-0.5 shrink-0">
                  <span className="text-xs" style={{ color: C.muted }}>{fmtMin(v.minutes)}</span>
                  <span className="text-[13px] font-bold" style={{ color: acc === null ? C.muted : acc >= 60 ? C.green : C.red }}>{acc === null ? "—" : `${acc}% acerto`}</span>
                </div>
              </div>
            );
          })}
        </Card>
      </div>

      <div className="flex gap-2"><Btn onClick={() => setView("historico")}><Play size={16} /> Registrar estudo</Btn></div>
    </div>
  );
}
function StreakDots({ dayDone, onToggle }) {
  const C = useC();
  const last = Array.from({ length: 7 }, (_, i) => addDays(todayISO(), -(6 - i)));
  return <div className="flex gap-2">{last.map((d, i) => {
    const done = dayDone(d); const today = i === 6;
    return <button key={d} onClick={() => onToggle(d)} title={d.split("-").reverse().join("/")} className="w-[34px] h-[34px] rounded-lg flex items-center justify-center text-[13px] font-bold transition-all cursor-pointer" style={{ background: done ? C.gold : C.chip, color: done ? "#12161F" : C.muted, boxShadow: today ? `0 0 0 2px ${C.gold}` : "none" }}>{DAYS[new Date(d + "T00:00:00").getDay()][0]}</button>;
  })}</div>;
}
function GoalBar({ label, value, target, pct, unit, color }) {
  const C = useC(); const barColor = color || (pct >= 100 ? C.green : C.gold);
  return <div>
    <div className="flex justify-between text-[13px] mb-1.5"><span style={{ color: C.inkSoft }}>{label}</span><span style={{ color: C.muted, fontVariantNumeric: "tabular-nums" }}>{Math.round(value * 10) / 10}{unit} / {target}{unit}</span></div>
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: C.chip === "#FFFFFF" ? C.line : "rgba(255,255,255,.08)" }}><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} /></div>
      <span className="text-xs font-bold w-9 text-right" style={{ color: barColor }}>{pct}%</span>
    </div>
  </div>;
}

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
        <div className="space-y-5">
          {disciplines.map((d) => (
            <div key={d.id}>
              <div className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: C.inkSoft }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />{d.name}
              </div>
              <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid ${C.line}` }}>
                <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                  <tbody>
                    {[...d.topics].sort((a, b) => b.hits - a.hits).map((t, i) => {
                      const bg = t.hits >= 8 ? C.red : t.hits >= 5 ? C.gold : t.hits >= 3 ? "#b45309" : C.line;
                      const fg = t.hits >= 3 ? "#fff" : C.muted;
                      return (
                        <tr key={t.id} style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
                          {t.num && <td className="px-2 py-1.5 font-mono text-right align-top" style={{ color: C.muted, whiteSpace: "nowrap" }}>{t.num}</td>}
                          <td className="px-2 py-1.5 w-full" style={{ color: C.ink }}>{t.name}</td>
                          <td className="px-2 py-1.5 align-top" style={{ whiteSpace: "nowrap" }}>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: bg, color: fg }}>{t.hits}×</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card><div className="text-sm font-semibold mb-2">Estratégia sugerida</div><ul className="text-sm space-y-2" style={{ color: C.inkSoft }}><li>• <b>{top.name}</b> é prioridade: {topPct}% dos {total} pontos.</li><li>• Maiores pesos: {top3.map((d) => `${d.name} (${d.peso} pts)`).join(", ")}.</li><li>• Busque <b>≥50%</b> no total e não zere nenhuma disciplina.</li><li>• Comece pelos assuntos de maior incidência (marcados em vermelho/dourado no edital).</li></ul></Card>
    </div>
  );
}



function ManualModal({ disciplines, discById, onClose, onSave, initial }) {
  const C = useC();
  const [discId, setDiscId] = useState(initial?.disciplineId || disciplines[0]?.id);
  const [topicId, setTopicId] = useState(initial?.topicId || "");
  const [studyType, setStudyType] = useState(initial?.studyType || "teoria");
  const [minutes, setMinutes] = useState(initial?.minutes ?? "");
  const [right, setRight] = useState(initial?.right ?? ""); const [wrong, setWrong] = useState(initial?.wrong ?? "");
  const [date, setDate] = useState(initial?.date || todayISO()); const [note, setNote] = useState(initial?.note || "");
  const [material, setMaterial] = useState(initial?.material || "");
  const [paginaInicio, setPaginaInicio] = useState(initial?.paginaInicio || "");
  const [paginaFim, setPaginaFim] = useState(initial?.paginaFim || "");
  const [videoTitulo, setVideoTitulo] = useState(initial?.videoTitulo || "");
  const topics = discById[discId]?.topics || [];
  return <Modal open title={initial ? "Editar registro" : "Registro manual de estudo"} onClose={onClose}>
    <Field label="Disciplina"><select value={discId} onChange={(e) => { setDiscId(e.target.value); setTopicId(""); }} className={inputCls} style={inputStyle(C)}>{disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
    <Field label="Tópico (opcional)"><select value={topicId} onChange={(e) => setTopicId(e.target.value)} className={inputCls} style={inputStyle(C)}><option value="">— geral —</option>{topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
    <Field label="Tipo de estudo"><select value={studyType} onChange={(e) => setStudyType(e.target.value)} className={inputCls} style={inputStyle(C)}><option value="teoria">Teoria</option><option value="questoes">Questões</option><option value="video">Vídeo-aula</option><option value="revisao">Revisão</option></select></Field>
    <div className="grid grid-cols-2 gap-3"><Field label="Tempo (min)"><input type="text" inputMode="numeric" value={minutes || ""} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setMinutes(v === "" ? "" : +v); }} className={inputCls} style={inputStyle(C)} placeholder="30" /></Field><Field label="Data"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} style={inputStyle(C)} /></Field><Field label="Acertos"><input type="number" value={right} onChange={(e) => setRight(e.target.value)} className={inputCls} style={inputStyle(C)} placeholder="0" /></Field><Field label="Erros"><input type="number" value={wrong} onChange={(e) => setWrong(e.target.value)} className={inputCls} style={inputStyle(C)} placeholder="0" /></Field></div>
    <div className="grid md:grid-cols-2 gap-3">
      <Field label="Material"><input value={material} onChange={(e) => setMaterial(e.target.value)} className={inputCls} style={inputStyle(C)} placeholder="Ex.: PDF" /></Field>
      <Field label="Vídeo / aula"><input value={videoTitulo} onChange={(e) => setVideoTitulo(e.target.value)} className={inputCls} style={inputStyle(C)} placeholder="Ex.: Video 01 - Focus" /></Field>
    </div>
    <div className="grid md:grid-cols-2 gap-3">
      <Field label="Página inicial"><input type="number" value={paginaInicio} onChange={(e) => setPaginaInicio(e.target.value)} className={inputCls} style={inputStyle(C)} placeholder="30" /></Field>
      <Field label="Página final"><input type="number" value={paginaFim} onChange={(e) => setPaginaFim(e.target.value)} className={inputCls} style={inputStyle(C)} placeholder="40" /></Field>
    </div>
    <Field label="Observação"><input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} style={inputStyle(C)} placeholder="Ex.: revisar teoria depois" /></Field>
    <Btn className="w-full justify-center" onClick={() => onSave({ disciplineId: discId, topicId: topicId || null, studyType, minutes: +minutes || 0, right: +right || 0, wrong: +wrong || 0, date, note, material, paginaInicio, paginaFim, videoTitulo })}><Check size={16} /> {initial ? "Salvar alterações" : "Registrar estudo"}</Btn>
  </Modal>;
}

/* ============================ PLANEJAMENTO ============================ */
function PlanoView({ plan, setPlan, disciplines, discById }) {
  const C = useC();
  const [open, setOpen] = useState(null);
  const doneCount = plan.filter((p) => p.done).length;
  const pct = plan.length ? Math.round((doneCount / plan.length) * 100) : 0;
  function toggle(id) { setPlan((p) => p.map((x) => x.id === id ? { ...x, done: !x.done } : x)); }
  function add(day, disciplineId, minutes) { setPlan((p) => [...p, { id: uid(), day, disciplineId, minutes, done: false }]); setOpen(null); }
  function remove(id) { setPlan((p) => p.filter((x) => x.id !== id)); }
  return <div>
    <PageTitle sub="Anote nos dias abaixo o que você já decidiu estudar (ex.: no ciclo do Aprovado) e marque como feito.">Planejamento semanal</PageTitle>
    <div className="flex flex-wrap gap-2 mb-4">
      {plan.length > 0 && <Btn variant="ghost" onClick={() => { if (confirm("Limpar todo o planejamento semanal?")) setPlan([]); }}><Trash2 size={14} color={C.red} /> <span style={{ color: C.red }}>Limpar tudo</span></Btn>}
      <span className="text-xs self-center ml-auto" style={{ color: C.muted }}>use o "+" em cada dia pra adicionar uma sessão</span>
    </div>
    <Card className="mb-4"><GoalBar label="Planejamento cumprido esta semana" value={doneCount} target={plan.length || 1} pct={pct} unit="" /></Card>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {DAYS.map((d, i) => { const items = plan.filter((p) => p.day === i);
        return <Card key={i} className="!p-4"><div className="flex items-center justify-between mb-2"><span className="font-bold text-sm">{d}</span><button onClick={() => setOpen(i)}><Plus size={16} color={C.ink} /></button></div>{items.length === 0 ? <p className="text-xs py-3" style={{ color: C.muted }}>Sem sessões</p> : items.map((it) => { const dd = discById[it.disciplineId]; return (<div key={it.id} className="flex items-center gap-2 py-1.5 group"><button onClick={() => toggle(it.id)}>{it.done ? <CheckCircle2 size={16} color={C.green} /> : <Circle size={16} color={C.muted} />}</button><span className="w-2 h-2 rounded-full shrink-0" style={{ background: dd?.color }} /><span className="text-xs flex-1 min-w-0 leading-tight" style={{ textDecoration: it.done ? "line-through" : "none", color: it.done ? C.muted : C.ink, wordBreak: "break-word" }}>{dd?.name}</span><span className="text-[10px]" style={{ color: C.muted }}>{fmtMin(it.minutes)}</span><button onClick={() => remove(it.id)} className="opacity-0 group-hover:opacity-100"><X size={12} color={C.red} /></button></div>); })}</Card>;
      })}
    </div>
    {open !== null && <PlanAddModal day={open} disciplines={disciplines} onClose={() => setOpen(null)} onAdd={add} />}
  </div>;
}
function PlanAddModal({ day, disciplines, onClose, onAdd }) { const C = useC(); const [discId, setDiscId] = useState(disciplines[0]?.id); const [min, setMin] = useState(60); return <Modal open title={`Adicionar sessão · ${DAYS[day]}`} onClose={onClose}><Field label="Disciplina"><select value={discId} onChange={(e) => setDiscId(e.target.value)} className={inputCls} style={inputStyle(C)}>{disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field><Field label="Duração (min)"><input type="number" value={min} step={15} onChange={(e) => setMin(+e.target.value)} className={inputCls} style={inputStyle(C)} /></Field><Btn className="w-full justify-center" onClick={() => onAdd(day, discId, min)}><Plus size={16} /> Adicionar</Btn></Modal>; }

/* ============================ REVISÕES ============================ */
function RevisoesView({ reviews, setReviews, markReviewDone, discById, disciplines, sessions }) {
  const C = useC();
  const pend = reviews.filter((r) => !r.done).sort((a, b) => a.due.localeCompare(b.due));
  const late = pend.filter((r) => r.due < todayISO()); const today = pend.filter((r) => r.due === todayISO()); const upcoming = pend.filter((r) => r.due > todayISO());
  const [discId, setDiscId] = useState(disciplines[0]?.id);
  const [topicId, setTopicId] = useState("");
  const [label, setLabel] = useState("");
  const [due, setDue] = useState(addDays(todayISO(), 1));
  const [note, setNote] = useState("");

  const currentDisc = discById[discId];
  const topics = currentDisc?.topics || [];

  const activitiesByDate = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [sessions]);

  const selectedDateActivities = activitiesByDate[due] || [];
  const activitySummary = useMemo(() => {
    if (!selectedDateActivities.length) return null;
    const byDisc = {};
    let totalMin = 0;
    selectedDateActivities.forEach((a) => {
      const d = discById[a.disciplineId];
      if (!byDisc[a.disciplineId]) byDisc[a.disciplineId] = { name: d?.name || "?", types: {}, min: 0 };
      const type = a.studyType || "teoria";
      byDisc[a.disciplineId].types[type] = (byDisc[a.disciplineId].types[type] || 0) + 1;
      byDisc[a.disciplineId].min += a.minutes;
      totalMin += a.minutes;
    });
    return { byDisc, totalMin, count: selectedDateActivities.length };
  }, [selectedDateActivities, discById]);

  function addManual() {
    if (!discId) return;
    const finalLabel = label || (topicId ? topics.find(t => t.id === topicId)?.name : null) || currentDisc?.name || "Revisão";
    setReviews((p) => [{ id: uid(), sessionId: null, intervalIdx: 0, done: false, disciplineId: discId, topicId: topicId || null, label: finalLabel, due, note }, ...p]);
    setLabel("");
    setTopicId("");
    setNote("");
    setDue(addDays(todayISO(), 1));
  }
  function editDate(id, due) { setReviews((p) => p.map((r) => r.id === id ? { ...r, due } : r)); }
  function deleteReview(id) { setReviews((p) => p.filter((r) => r.id !== id)); }
  function deleteCompleted() { setReviews((p) => p.filter((r) => !r.done)); }
  function deleteAll() { if (confirm("Excluir todas as revisões?")) setReviews([]); }
  const Group = ({ title, items, color }) => items.length ? <div className="mb-5"><h3 className="text-sm font-bold mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: color }} />{title} <span style={{ color: C.muted }}>({items.length})</span></h3><div className="space-y-2">{items.map((r) => { const topicName = r.topicId ? discById[r.disciplineId]?.topics?.find((t) => t.id === r.topicId)?.name : null; return (<Card key={r.id} className="!p-3 flex items-center gap-3"><button onClick={() => markReviewDone(r.id)} title="Marcar como concluída"><Circle size={22} color={C.muted} /></button><div className="flex-1 min-w-0"><div className="font-medium text-sm">{r.label}</div>{topicName && topicName !== r.label && <div className="text-xs mt-0.5 italic" style={{ color: C.inkSoft }}>{topicName}</div>}<div className="text-xs mt-0.5" style={{ color: C.muted }}>{discById[r.disciplineId]?.name} · data prevista {r.due || "—"}</div></div><input type="date" value={r.due} onChange={(e) => editDate(r.id, e.target.value)} className="px-2 py-1 rounded-lg text-xs" style={inputStyle(C)} /><button onClick={() => deleteReview(r.id)} title="Excluir revisão"><Trash2 size={16} color={C.red} /></button></Card>); })}</div></div> : null;
  return <div>
    <PageTitle sub="Cadastro e controle 100% manual das revisões. Cada item fica fixo até você decidir o que fazer com ele.">Revisões</PageTitle>
    <Card className="mb-4">
      <div className="flex items-center gap-2 text-sm font-semibold mb-4"><Plus size={16} color={C.gold} /> Cadastrar nova revisão</div>
      <div className="grid md:grid-cols-2 gap-3 mb-4">
        <Field label="Data">
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={inputCls} style={inputStyle(C)} />
        </Field>
        <Field label="Matéria">
          <select value={discId || ""} onChange={(e) => { setDiscId(e.target.value); setTopicId(""); }} className={inputCls} style={inputStyle(C)}>
            {disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        {topics.length > 0 && <Field label="Conteúdo"><select value={topicId} onChange={(e) => setTopicId(e.target.value)} className={inputCls} style={inputStyle(C)}><option value="">Escolha um conteúdo</option>{topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>}
        <Field label="Label customizado (opcional)">
          <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} style={inputStyle(C)} placeholder="Ex.: Normalização 3FN" />
        </Field>
        <Field label="Anotações"><input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} style={inputStyle(C)} placeholder="Ex.: revisar teoria depois" /></Field>
      </div>

      {activitySummary && <div className="mb-4 p-3 rounded-lg" style={{ background: C.surface2, border: `1px solid ${C.line}` }}><div className="text-xs font-semibold mb-2 flex items-center gap-2"><History size={14} color={C.gold} /> Atividades do dia {fmtDate(due)}</div><div className="text-sm space-y-1"><div style={{ color: C.muted }}>• <b>{activitySummary.count}</b> atividade{activitySummary.count !== 1 ? "s" : ""} · <b>{fmtMin(activitySummary.totalMin)}</b> no total</div>{Object.entries(activitySummary.byDisc).map(([dId, d]) => <div key={dId} style={{ color: C.muted }}>• <b>{d.name}</b>: {Object.entries(d.types).map(([type, cnt]) => `${cnt} ${type}`).join(" + ")} · {fmtMin(d.min)}</div>)}</div></div>}

      <div className="flex justify-end">
        <Btn onClick={addManual}><Plus size={16} /> Salvar revisão</Btn>
      </div>
    </Card>
    <div className="flex flex-wrap gap-2 mb-4">
      <Btn variant="ghost" onClick={deleteCompleted} className="text-red-600" style={{ color: C.red, borderColor: C.red }}>
        <Trash2 size={15} color={C.red} /> Excluir concluídas
      </Btn>
      <Btn variant="ghost" onClick={deleteAll} className="text-red-600" style={{ color: C.red, borderColor: C.red }}>
        <Trash2 size={15} color={C.red} /> Excluir todas
      </Btn>
    </div>
    {pend.length === 0 && <Empty msg="Nenhuma revisão pendente. Use o formulário acima para criar a primeira." />}
    <Group title="Atrasadas" items={late} color={C.red} /><Group title="Hoje" items={today} color={C.gold} /><Group title="Próximas" items={upcoming} color={C.green} />
  </div>;
}

/* ============================ FLASHCARDS ============================ */
function computeCardStreak(dates) {
  if (!dates.length) return 0;
  const set = new Set(dates);
  let streak = 0;
  let cur = todayISO();
  if (!set.has(cur)) cur = addDays(cur, -1);
  while (set.has(cur)) { streak++; cur = addDays(cur, -1); }
  return streak;
}

// Progresso da ficha no Leitner: quantas revisões seguidas ela sobreviveu.
const BOX_LABEL = { 1: "aprendendo", 2: "firmando", 3: "consolidada" };
function BoxDots({ box }) {
  const C = useC();
  const b = Math.min(3, Math.max(1, box || 1));
  const cor = b === 3 ? C.green : b === 2 ? C.gold : C.muted;
  const dias = BOX_DAYS[b];
  return (
    <span className="flex items-center gap-1 shrink-0" title={`Caixa ${b} de 3 · ${BOX_LABEL[b]} · revisão a cada ${dias} ${dias === 1 ? "dia" : "dias"}`}>
      {[1, 2, 3].map((n) => (
        <span key={n} className="rounded-full" style={{ width: 7, height: 7, background: n <= b ? cor : "transparent", border: `1px solid ${n <= b ? cor : C.line}` }} />
      ))}
    </span>
  );
}

function FlashcardsView({ cards, setCards, cardStats, setCardStats, disciplines, discById }) {
  const C = useC();
  const [sub, setSub] = useState("estudar");
  const [session, setSession] = useState(null); // { queue, index, showAnswer, mode, label }
  const [openDeck, setOpenDeck] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [cardForm, setCardForm] = useState({ front: "", back: "", disciplineId: disciplines[0]?.id || "", topicId: "" });

  const pendentes = useMemo(() => {
    const now = Date.now();
    return cards.filter((c) => c.due <= now).sort((a, b) => a.due - b.due);
  }, [cards]);

  const current = session ? cards.find((c) => c.id === session.queue[session.index]) : null;
  const livre = session?.mode === "livre";

  // mode "revisao": só fichas vencidas, na ordem do vencimento, reagenda normal.
  // mode "livre":   qualquer ficha, embaralhada, só reagenda se você marcar Novamente.
  function startSession(pool, mode, label) {
    const list = mode === "revisao" ? pool.filter((c) => c.due <= Date.now()) : pool;
    if (!list.length) return;
    const ordered = mode === "revisao" ? list.slice().sort((a, b) => a.due - b.due) : shuffle(list);
    setSession({ queue: ordered.map((c) => c.id), index: 0, showAnswer: false, mode, label });
  }
  function startStudy() { startSession(pendentes, "revisao", "Vencem hoje"); }
  function revealAnswer() { setSession((s) => ({ ...s, showAnswer: true })); }

  function recordResult(rating) {
    if (!current) return;
    const correct = rating !== "novamente";
    setCards((prev) => prev.map((c) => {
      if (c.id !== current.id) return c;
      if (rating === "novamente") return { ...c, box: 1, due: Date.now() };
      if (livre) return c; // revisão extra não infla o intervalo
      if (rating === "facil") return { ...c, box: 3, due: dueInDays(FACIL_DAYS) };
      const box = Math.min(3, c.box + 1);
      return { ...c, box, due: dueInDays(BOX_DAYS[box]) };
    }));
    setCardStats((prev) => {
      const disc = prev.reviewsByDisc[current.disciplineId] || { correct: 0, wrong: 0 };
      const today = todayISO();
      return {
        reviewsByDisc: { ...prev.reviewsByDisc, [current.disciplineId]: { correct: disc.correct + (correct ? 1 : 0), wrong: disc.wrong + (correct ? 0 : 1) } },
        studyDates: prev.studyDates.includes(today) ? prev.studyDates : [...prev.studyDates, today],
      };
    });
    setSession((s) => {
      const nextIndex = s.index + 1;
      return nextIndex < s.queue.length ? { queue: s.queue, index: nextIndex, showAnswer: false } : null;
    });
  }

  function addCard() {
    if (!cardForm.front.trim() || !cardForm.back.trim() || !cardForm.disciplineId) return;
    setCards((p) => [makeCard(cardForm.front.trim(), cardForm.back.trim(), cardForm.disciplineId, cardForm.topicId || null), ...p]);
    setCardForm({ front: "", back: "", disciplineId: cardForm.disciplineId, topicId: "" });
  }
  function removeCard(id) { setCards((p) => p.filter((c) => c.id !== id)); }
  // classificação rápida sem abrir o modo de edição
  function setCardTopic(id, topicId) { setCards((p) => p.map((c) => (c.id === id ? { ...c, topicId: topicId || null } : c))); }

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  function startEditCard(c) { setEditId(c.id); setEditForm({ disciplineId: c.disciplineId, topicId: c.topicId || "", front: c.front, back: c.back }); }
  function cancelEditCard() { setEditId(null); setEditForm(null); }
  function saveEditCard() {
    if (!editForm.front.trim() || !editForm.back.trim()) return;
    setCards((p) => p.map((c) => c.id === editId
      ? { ...c, disciplineId: editForm.disciplineId, topicId: editForm.topicId || null, front: editForm.front.trim(), back: editForm.back.trim() }
      : c));
    cancelEditCard();
  }
  function importCards(objs) {
    const byName = {}; disciplines.forEach((d) => { byName[normName(d.name)] = d; });
    const get = (o, ...keys) => { for (const k of keys) { const hit = Object.keys(o).find((h) => normName(h) === normName(k)); if (hit && o[hit]) return o[hit]; } return ""; };
    const novos = []; let skipped = 0;
    objs.forEach((o) => {
      const front = get(o, "Pergunta", "front", "frente");
      const back = get(o, "Resposta", "back", "verso");
      const disc = byName[normName(get(o, "Matéria", "Materia", "disciplina"))] || disciplines[0];
      if (!front.trim() || !back.trim() || !disc) { skipped++; return; }
      const topNome = get(o, "Tópico", "Topico", "tema");
      const topId = topNome ? (disc.topics?.find((t) => normName(t.name) === normName(topNome))?.id || null) : null;
      novos.push(makeCard(front.trim(), back.trim(), disc.id, topId));
    });
    if (novos.length) setCards((p) => [...novos, ...p]);
    return { added: novos.length, skipped };
  }

  const fmtDue = (due, created, box) => {
    if (box === 1 && created && Date.now() - created < DAY_MS) return "nova";
    const diff = due - Date.now();
    if (diff <= 0) return "hoje";
    const d = Math.ceil(diff / DAY_MS);
    return d === 1 ? "em 1 dia" : `em ${d} dias`;
  };
  const [filtroDisc, setFiltroDisc] = useState("todas");
  const [filtroTopic, setFiltroTopic] = useState("todas");
  const filtroTopics = filtroDisc !== "todas" ? (discById[filtroDisc]?.topics || []) : [];
  const filteredCards = useMemo(() => {
    let result = cards;
    if (filtroDisc !== "todas") result = result.filter((c) => c.disciplineId === filtroDisc);
    if (filtroTopic === "__geral") result = result.filter((c) => !c.topicId);
    else if (filtroTopic !== "todas") result = result.filter((c) => c.topicId === filtroTopic);
    return result;
  }, [cards, filtroDisc, filtroTopic]);

  const fichasCountByDisc = useMemo(() => { const m = {}; cards.forEach((c) => { m[c.disciplineId] = (m[c.disciplineId] || 0) + 1; }); return m; }, [cards]);
  // Decks = disciplinas do edital verticalizado, subdivididas nos tópicos que já têm ficha.
  const decks = useMemo(() => {
    const now = Date.now();
    const count = (list) => ({ total: list.length, due: list.filter((c) => c.due <= now).length });
    return disciplines.map((d) => {
      const own = cards.filter((c) => c.disciplineId === d.id);
      const topics = (d.topics || [])
        .map((t) => ({ id: t.id, num: t.num, name: t.name, cards: own.filter((c) => c.topicId === t.id) }))
        .filter((t) => t.cards.length > 0)
        .map((t) => ({ ...t, ...count(t.cards) }));
      const geral = own.filter((c) => !c.topicId || !topics.some((t) => t.id === c.topicId));
      if (geral.length) topics.push({ id: null, num: "", name: "Geral (sem tópico)", cards: geral, ...count(geral) });
      return { id: d.id, name: d.name, block: d.block, cards: own, topics, ...count(own) };
    }).filter((d) => d.total > 0);
  }, [cards, disciplines]);
  const deckBlocks = useMemo(() => [...new Set(decks.map((d) => d.block))], [decks]);

  const focoList = useMemo(() => Object.entries(cardStats.reviewsByDisc).filter(([discId]) => fichasCountByDisc[discId] > 0).map(([discId, r]) => {
    const total = r.correct + r.wrong;
    const pct = total ? Math.round((r.correct / total) * 100) : 0;
    let cor, rotulo;
    if (pct < 50) { cor = C.red; rotulo = "Foque aqui"; }
    else if (pct < 75) { cor = C.gold; rotulo = "Reforçar"; }
    else { cor = C.green; rotulo = "Indo bem"; }
    return { discId, nome: discById[discId]?.name || "?", correct: r.correct, wrong: r.wrong, pct, cor, rotulo, total: fichasCountByDisc[discId] || 0 };
  }).sort((a, b) => a.pct - b.pct), [cardStats.reviewsByDisc, discById, fichasCountByDisc, C]);

  const streak = computeCardStreak(cardStats.studyDates);
  const nextBox = current ? Math.min(3, current.box + 1) : 1;

  const SUBTABS = [["estudar", "Estudar"], ["fichas", "Fichas"], ["foco", "Foco"]];

  const deckBtns = (pool, due, label) => (
    <div className="flex gap-1.5 shrink-0">
      <button disabled={!due} onClick={() => startSession(pool, "revisao", label)}
        className="text-xs font-bold px-2.5 py-1.5 rounded-lg"
        style={{ background: due ? C.goldSoft : "transparent", color: due ? C.gold : C.muted, border: `1px solid ${due ? "transparent" : C.line}`, opacity: due ? 1 : 0.5 }}>
        Revisar{due ? ` ${due}` : ""}
      </button>
      <button onClick={() => startSession(pool, "livre", label)}
        className="text-xs font-bold px-2.5 py-1.5 rounded-lg"
        style={{ color: C.inkSoft, border: `1px solid ${C.line}` }}>
        Livre
      </button>
    </div>
  );

  return <div>
    <PageTitle sub="Revisão espaçada por deck: avalie cada ficha como Novamente, Bom ou Fácil pra ajustar o próximo intervalo. Na sessão livre você revisa quando quiser, sem mexer no agendamento.">Flashcards</PageTitle>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <Stat label="Sequência" value={`${streak} dias`} Icon={Flame} color={C.gold} />
      <Stat label="Total de fichas" value={cards.length} Icon={Layers} />
      <Stat label="Para hoje" value={pendentes.length} Icon={Clock} color={C.gold} />
      <Stat label="Precisa de foco" value={focoList.length ? focoList[0].nome : "—"} Icon={Crosshair} color={C.red} />
    </div>

    <div className="flex gap-2 mb-5">
      {SUBTABS.map(([id, label]) => (
        <button key={id} onClick={() => setSub(id)}
          className="px-3 py-2 rounded-lg text-sm font-semibold"
          style={{ background: sub === id ? C.navActiveBg : "transparent", color: sub === id ? C.navActiveInk : C.inkSoft, border: `1px solid ${sub === id ? "transparent" : C.line}` }}>
          {label}
        </button>
      ))}
    </div>

    {sub === "estudar" && (
      session && current ? (
        <div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="min-w-0">
              <div className="text-sm font-bold truncate">{session.label}</div>
              <div className="text-xs" style={{ color: livre ? C.gold : C.muted }}>{livre ? "Sessão livre · não altera o agendamento" : "Revisão programada"}</div>
            </div>
            <button onClick={() => setSession(null)} className="text-xs font-semibold flex items-center gap-1 shrink-0" style={{ color: C.muted }}><X size={14} /> Encerrar</button>
          </div>
          <div className="text-center text-xs font-semibold mb-2" style={{ color: C.muted }}>{session.index + 1} / {session.queue.length} · {discById[current.disciplineId]?.name || "?"}{current.topicId && ` · ${discById[current.disciplineId]?.topics?.find((t) => t.id === current.topicId)?.name || ""}`}</div>
          <Card className="min-h-[220px] flex items-center justify-center text-center">
            <p className="text-lg font-semibold leading-snug">{session.showAnswer ? current.back : current.front}</p>
          </Card>
          {!session.showAnswer ? (
            <div className="flex justify-center mt-5"><Btn onClick={revealAnswer}>Mostrar resposta</Btn></div>
          ) : (
            <div className="grid grid-cols-3 gap-2 mt-5">
              <Btn variant="ghost" onClick={() => recordResult("novamente")} style={{ flexDirection: "column", justifyContent: "center", color: C.red, borderColor: C.red }}>Novamente<span className="text-xs font-normal opacity-80">agora</span></Btn>
              <Btn onClick={() => recordResult("bom")} style={{ flexDirection: "column", justifyContent: "center", background: C.green, borderColor: C.green, color: "#fff" }}>Bom<span className="text-xs font-normal opacity-90">{livre ? "mantém" : `${BOX_DAYS[nextBox]}d`}</span></Btn>
              <Btn onClick={() => recordResult("facil")} style={{ flexDirection: "column", justifyContent: "center", background: C.gold, borderColor: C.gold, color: "#fff" }}>Fácil<span className="text-xs font-normal opacity-90">{livre ? "mantém" : `${FACIL_DAYS}d`}</span></Btn>
            </div>
          )}
        </div>
      ) : (
        <div>
          {pendentes.length > 0 ? (
            <Card className="mb-6">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h3 className="text-base font-bold">{pendentes.length} fichas vencem hoje</h3>
                <Btn onClick={startStudy}><Play size={16} /> Estudar agora</Btn>
              </div>
              <div className="space-y-0">
                {pendentes.slice(0, 6).map((f) => (
                  <div key={f.id} className="flex justify-between items-center py-3 border-t" style={{ borderColor: C.line }}>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold mb-0.5" style={{ color: C.muted }}>{discById[f.disciplineId]?.name || "?"}{f.topicId && ` · ${discById[f.disciplineId]?.topics?.find((t) => t.id === f.topicId)?.name || ""}`}</div>
                      <div className="text-sm truncate">{f.front}</div>
                    </div>
                    <span className="ml-3"><BoxDots box={f.box} /></span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-3 pt-3 border-t" style={{ borderColor: C.line, color: C.muted }}>
                {[1, 2, 3].map((b) => (
                  <span key={b} className="flex items-center gap-1.5"><BoxDots box={b} />{BOX_LABEL[b]} · {BOX_DAYS[b]}d</span>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="text-center py-8 mb-6">
              <CheckCircle2 size={28} color={C.green} className="mx-auto mb-3" />
              <p className="text-sm" style={{ color: C.muted }}>Nenhuma ficha vence hoje. Escolha um deck abaixo pra revisar quando quiser.</p>
            </Card>
          )}

          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-base font-bold">Decks do edital</h3>
            <span className="text-xs" style={{ color: C.muted }}>Revisar = só vencidas · Livre = tudo, sem reagendar</span>
          </div>

          {decks.length === 0 ? (
            <Empty msg="Nenhuma ficha cadastrada ainda. Crie fichas na aba Fichas pra montar seus decks." />
          ) : deckBlocks.map((block) => (
            <div key={block} className="mb-5">
              <h4 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Conhecimentos {block}</h4>
              <div className="space-y-2">
                {decks.filter((d) => d.block === block).map((d) => (
                  <Card key={d.id} className="!p-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setOpenDeck(openDeck === d.id ? null : d.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                        {openDeck === d.id ? <ChevronDown size={16} color={C.muted} className="shrink-0" /> : <ChevronRight size={16} color={C.muted} className="shrink-0" />}
                        <div className="min-w-0">
                          <div className="text-sm font-bold truncate">{d.name}</div>
                          <div className="text-xs" style={{ color: C.muted }}>{d.total} fichas{d.due > 0 ? ` · ${d.due} vencidas` : ""} · {d.topics.length} {d.topics.length === 1 ? "tópico" : "tópicos"}</div>
                        </div>
                      </button>
                      {deckBtns(d.cards, d.due, d.name)}
                    </div>
                    {openDeck === d.id && (
                      <div className="mt-2">
                        {d.topics.map((t) => (
                          <div key={t.id || "geral"} className="flex items-center gap-2 py-2.5 border-t" style={{ borderColor: C.line }}>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm truncate">{t.num ? `${t.num} · ` : ""}{t.name}</div>
                              <div className="text-xs" style={{ color: C.muted }}>{t.total} fichas{t.due > 0 ? ` · ${t.due} vencidas` : ""}</div>
                            </div>
                            {deckBtns(t.cards, t.due, `${d.name} · ${t.name}`)}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    )}

    {sub === "fichas" && (
      <div>
        {!showForm && <div className="flex justify-end mb-3"><Btn onClick={() => setShowForm(true)}><Plus size={16} /> Nova ficha</Btn></div>}
        {showForm && <Card className="mb-4">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><Plus size={16} color={C.gold} /> Nova ficha</div>
            <button onClick={() => setShowForm(false)} className="text-xs font-semibold flex items-center gap-1" style={{ color: C.muted }}><X size={14} /> Fechar</button>
          </div>
          <Field label="Matéria">
            <select value={cardForm.disciplineId} onChange={(e) => setCardForm({ ...cardForm, disciplineId: e.target.value, topicId: "" })} className={inputCls} style={inputStyle(C)}>
              {disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          {(discById[cardForm.disciplineId]?.topics || []).length > 0 && (
            <Field label="Tópico (opcional)">
              <select value={cardForm.topicId} onChange={(e) => setCardForm({ ...cardForm, topicId: e.target.value })} className={inputCls} style={inputStyle(C)}>
                <option value="">— geral —</option>
                {discById[cardForm.disciplineId].topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Pergunta"><textarea rows={2} value={cardForm.front} onChange={(e) => setCardForm({ ...cardForm, front: e.target.value })} className={inputCls} style={inputStyle(C)} placeholder="Ex.: O que é subnetting?" /></Field>
          <Field label="Resposta"><textarea rows={3} value={cardForm.back} onChange={(e) => setCardForm({ ...cardForm, back: e.target.value })} className={inputCls} style={inputStyle(C)} placeholder="A resposta que você quer lembrar na prova." /></Field>
          <div className="flex justify-end"><Btn onClick={addCard}><Plus size={16} /> Registrar ficha</Btn></div>
        </Card>}
        <div className="flex gap-2 mb-3">
          <select value={filtroDisc} onChange={(e) => { setFiltroDisc(e.target.value); setFiltroTopic("todas"); }} className={inputCls} style={inputStyle(C)}>
            <option value="todas">Todas as matérias</option>
            {disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {filtroTopics.length > 0 && (
            <select value={filtroTopic} onChange={(e) => setFiltroTopic(e.target.value)} className={inputCls} style={inputStyle(C)}>
              <option value="todas">Todos os tópicos</option>
              <option value="__geral">Sem tópico</option>
              {filtroTopics.map((t) => <option key={t.id} value={t.id}>{t.num ? `${t.num} · ` : ""}{t.name}</option>)}
            </select>
          )}
        </div>
        <ExportBar
          filenameBase="flashcards"
          headers={["Matéria", "Tópico", "Pergunta", "Resposta", "Caixa"]}
          rows={filteredCards.map((c) => [
            discById[c.disciplineId]?.name || "?",
            c.topicId ? (discById[c.disciplineId]?.topics?.find((t) => t.id === c.topicId)?.name || "") : "",
            c.front,
            c.back,
            c.box,
          ])}
        >
          <ImportButton onImport={importCards} />
        </ExportBar>
        {filteredCards.length === 0 && <Empty msg="Nenhuma ficha nesta matéria." />}
        <div className="space-y-2">
          {filteredCards.map((c) => editId === c.id ? (
            <Card key={c.id} className="!p-4">
              <div className="flex items-center gap-2 text-sm font-semibold mb-4"><Pencil size={15} color={C.gold} /> Editar ficha</div>
              <Field label="Matéria">
                <select value={editForm.disciplineId} onChange={(e) => setEditForm({ ...editForm, disciplineId: e.target.value, topicId: "" })} className={inputCls} style={inputStyle(C)}>
                  {disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="Tópico do edital (opcional)">
                <select value={editForm.topicId} onChange={(e) => setEditForm({ ...editForm, topicId: e.target.value })} className={inputCls} style={inputStyle(C)}>
                  <option value="">— geral —</option>
                  {(discById[editForm.disciplineId]?.topics || []).map((t) => <option key={t.id} value={t.id}>{t.num ? `${t.num} · ` : ""}{t.name}</option>)}
                </select>
              </Field>
              <Field label="Pergunta"><textarea rows={2} value={editForm.front} onChange={(e) => setEditForm({ ...editForm, front: e.target.value })} className={inputCls} style={inputStyle(C)} /></Field>
              <Field label="Resposta"><textarea rows={3} value={editForm.back} onChange={(e) => setEditForm({ ...editForm, back: e.target.value })} className={inputCls} style={inputStyle(C)} /></Field>
              <div className="flex justify-end gap-2">
                <Btn variant="ghost" onClick={cancelEditCard}>Cancelar</Btn>
                <Btn onClick={saveEditCard}><Check size={16} /> Salvar</Btn>
              </div>
            </Card>
          ) : (
            <Card key={c.id} className="!p-3">
              <div className="flex justify-between gap-2 text-xs mb-1" style={{ color: C.muted }}><span className="truncate">{discById[c.disciplineId]?.name || "?"}{c.topicId && ` · ${discById[c.disciplineId]?.topics?.find((t) => t.id === c.topicId)?.name || ""}`}</span><span className="flex items-center gap-2 shrink-0"><BoxDots box={c.box} />{fmtDue(c.due, c.created, c.box)}</span></div>
              <div className="font-medium text-sm">{c.front}</div>
              <div className="text-sm mt-1" style={{ color: C.muted }}>{c.back}</div>
              <div className="flex justify-between items-center gap-2 mt-2">
                {(discById[c.disciplineId]?.topics || []).length > 0 ? (
                  <select value={c.topicId || ""} onChange={(e) => setCardTopic(c.id, e.target.value)} title="Tópico do edital"
                    className="text-xs rounded-lg px-2 py-1 min-w-0 flex-1 max-w-[70%]"
                    style={{ ...inputStyle(C), color: c.topicId ? C.inkSoft : C.muted }}>
                    <option value="">— sem tópico —</option>
                    {discById[c.disciplineId].topics.map((t) => <option key={t.id} value={t.id}>{t.num ? `${t.num} · ` : ""}{t.name}</option>)}
                  </select>
                ) : <span />}
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => startEditCard(c)} title="Editar"><Pencil size={15} color={C.muted} /></button>
                  <button onClick={() => removeCard(c.id)} title="Excluir"><Trash2 size={15} color={C.red} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )}

    {sub === "foco" && (
      <div>
        <p className="text-sm mb-4" style={{ color: C.muted }}>Desempenho por matéria, com base nas revisões que você já fez. Use pra saber onde focar o estudo.</p>
        {focoList.length === 0 ? (
          <Empty msg="Ainda sem revisões suficientes. Estude algumas fichas pra ver o desempenho por matéria." />
        ) : (
          <div className="space-y-2">
            {focoList.map((m) => (
              <Card key={m.discId}>
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm font-bold">{m.nome}</div>
                  <span className="text-xs font-bold rounded-full px-2.5 py-1" style={{ color: m.cor, background: C.surface2, border: `1px solid ${C.line}` }}>{m.rotulo}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-2 rounded-full" style={{ background: C.surface2, border: `1px solid ${C.line}` }}>
                    <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.cor }} />
                  </div>
                  <span className="text-xs font-bold w-10 text-right">{m.pct}%</span>
                </div>
                <div className="text-xs" style={{ color: C.muted }}>{m.correct} acertos · {m.wrong} erros · {m.total} fichas cadastradas</div>
              </Card>
            ))}
          </div>
        )}
      </div>
    )}
  </div>;
}

/* ============================ CADERNO DE ERROS ============================ */
function ErrosView({ cards, setCards, erros, setErros, disciplines, discById, setView }) {
  const C = useC();
  const [erroForm, setErroForm] = useState({ disciplineId: disciplines[0]?.id || "", topicId: "", tema: "", motivo: MOTIVOS_ERRO[0], licao: "" });
  const [showForm, setShowForm] = useState(false);
  const topicName = (discId, topId) => (topId ? discById[discId]?.topics?.find((t) => t.id === topId)?.name || "" : "");

  function addErro() {
    if (!erroForm.tema.trim() || !erroForm.disciplineId) return;
    const e = { id: uid(), disciplineId: erroForm.disciplineId, topicId: erroForm.topicId || null, tema: erroForm.tema.trim(), motivo: erroForm.motivo, licao: erroForm.licao.trim(), data: Date.now(), virouFicha: false, dominado: false };
    setErros((p) => [e, ...p]);
    setErroForm({ disciplineId: erroForm.disciplineId, topicId: erroForm.topicId, tema: "", motivo: MOTIVOS_ERRO[0], licao: "" });
  }
  function removeErro(id) { setErros((p) => p.filter((e) => e.id !== id)); }
  function dominar(id, val) {
    setErros((p) => p.map((x) => (x.id === id ? { ...x, dominado: val, dominadoEm: val ? Date.now() : null } : x)));
  }

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  function startEdit(e) { setEditId(e.id); setEditForm({ disciplineId: e.disciplineId, topicId: e.topicId || "", tema: e.tema, motivo: e.motivo, licao: e.licao }); }
  function cancelEdit() { setEditId(null); setEditForm(null); }
  function saveEdit() {
    if (!editForm.tema.trim()) return;
    setErros((p) => p.map((x) => x.id === editId
      ? { ...x, disciplineId: editForm.disciplineId, topicId: editForm.topicId || null, tema: editForm.tema.trim(), motivo: editForm.motivo, licao: editForm.licao.trim() }
      : x));
    cancelEdit();
  }
  // motivos vindos de importação podem estar fora da lista padrão — não perder o valor atual
  const motivoOpts = editForm && !MOTIVOS_ERRO.includes(editForm.motivo) ? [editForm.motivo, ...MOTIVOS_ERRO] : MOTIVOS_ERRO;
  function importErros(objs) {
    const byName = {}; disciplines.forEach((d) => { byName[normName(d.name)] = d; });
    const get = (o, ...keys) => { for (const k of keys) { const hit = Object.keys(o).find((h) => normName(h) === normName(k)); if (hit && o[hit]) return o[hit]; } return ""; };
    const novos = []; let skipped = 0;
    objs.forEach((o) => {
      const tema = get(o, "Questão/tema", "Questao/tema", "tema", "questão", "questao", "pergunta");
      const matNome = get(o, "Matéria", "Materia", "disciplina");
      const disc = byName[normName(matNome)] || disciplines[0];
      if (!tema.trim() || !disc) { skipped++; return; }
      const topNome = get(o, "Tópico", "Topico", "tema do edital");
      const topId = topNome ? (disc.topics?.find((t) => normName(t.name) === normName(topNome))?.id || null) : null;
      novos.push({ id: uid(), disciplineId: disc.id, topicId: topId, tema: tema.trim(), motivo: get(o, "Motivo", "por que errei") || MOTIVOS_ERRO[0], licao: get(o, "O que aprendi", "licao", "lição").trim(), data: Date.now(), virouFicha: normName(get(o, "Virou ficha")) === "sim", dominado: normName(get(o, "Dominado")) === "sim" });
    });
    if (novos.length) setErros((p) => [...novos, ...p]);
    return { added: novos.length, skipped };
  }
  function erroParaFicha(e) {
    const back = e.licao || "Revisar este conceito — complete a resposta editando a ficha.";
    const card = makeCard(e.tema, back, e.disciplineId, e.topicId || null);
    setCards((p) => [card, ...p]);
    setErros((p) => p.map((x) => (x.id === e.id ? { ...x, virouFicha: true, cardId: card.id } : x)));
  }

  // Erros convertidos antes do vínculo existir não têm cardId — casa pelo conteúdo.
  const linkedCard = (e) => {
    if (e.cardId) return cards.find((c) => c.id === e.cardId) || null;
    if (!e.virouFicha) return null;
    return cards.find((c) => c.disciplineId === e.disciplineId && c.front === e.tema) || null;
  };

  const [confirmDel, setConfirmDel] = useState(null);
  function askRemove(e) {
    if (linkedCard(e)) setConfirmDel(e.id);
    else removeErro(e.id);
  }
  function removeErroECard(e) {
    const c = linkedCard(e);
    if (c) setCards((p) => p.filter((x) => x.id !== c.id));
    removeErro(e.id);
    setConfirmDel(null);
  }

  /* ---------- Recorte de estudo: matéria, tópico, motivo e status ---------- */
  const [fDisc, setFDisc] = useState("todas");
  const [fTopic, setFTopic] = useState("todas");
  const [fMotivo, setFMotivo] = useState("todos");
  const [fStatus, setFStatus] = useState("revisar");
  const [ordem, setOrdem] = useState("recentes");

  const fTopics = fDisc !== "todas" ? (discById[fDisc]?.topics || []) : [];
  const motivosUsados = useMemo(() => [...new Set(erros.map((e) => e.motivo))].sort(), [erros]);

  const filtrados = useMemo(() => erros.filter((e) => {
    if (fDisc !== "todas" && e.disciplineId !== fDisc) return false;
    if (fTopic !== "todas" && (e.topicId || "") !== (fTopic === "__geral" ? "" : fTopic)) return false;
    if (fMotivo.startsWith("tipo:")) { if (tipoMotivo(e.motivo) !== fMotivo.slice(5)) return false; }
    else if (fMotivo !== "todos" && e.motivo !== fMotivo) return false;
    if (fStatus === "revisar" && e.dominado) return false;
    if (fStatus === "dominados" && !e.dominado) return false;
    return true;
  }), [erros, fDisc, fTopic, fMotivo, fStatus]);

  // Sem matéria escolhida agrupa por matéria; com matéria escolhida, desce pro tópico do edital.
  // Dentro do grupo e entre grupos vale a mesma direção de data — o ranking por
  // volume fica no Raio-X, aqui a ordem é cronológica e previsível.
  const grupos = useMemo(() => {
    const dir = ordem === "recentes" ? -1 : 1;
    const m = new Map();
    [...filtrados].sort((a, b) => (a.data - b.data) * dir).forEach((e) => {
      const porTopico = fDisc !== "todas";
      const key = porTopico ? (e.topicId || "__geral") : e.disciplineId;
      const label = porTopico
        ? (e.topicId ? topicName(e.disciplineId, e.topicId) || "Geral" : "Geral (sem tópico)")
        : (discById[e.disciplineId]?.name || "?");
      if (!m.has(key)) m.set(key, { key, label, items: [] });
      m.get(key).items.push(e);
    });
    // items[0] já é o extremo do grupo na direção escolhida
    return [...m.values()].sort((a, b) => (a.items[0].data - b.items[0].data) * dir);
  }, [filtrados, fDisc, discById, ordem]);

  /* ---------- Sessão de revisão: recordar o conceito antes de ver a lição ---------- */
  const [sessao, setSessao] = useState(null); // { queue, index, showLicao }
  const atual = sessao ? erros.find((e) => e.id === sessao.queue[sessao.index]) : null;
  function startRevisao() {
    if (!filtrados.length) return;
    setSessao({ queue: shuffle(filtrados).map((e) => e.id), index: 0, showLicao: false });
  }
  function avancar() {
    setSessao((s) => (s.index + 1 < s.queue.length ? { ...s, index: s.index + 1, showLicao: false } : null));
  }
  function responder(val) { if (atual) dominar(atual.id, val); avancar(); }

  const countBy = (arr, get) => {
    const m = {};
    arr.forEach((x) => { const k = get(x); m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  };
  const aRevisar = erros.filter((e) => !e.dominado);
  const porMateria = countBy(aRevisar, (e) => e.disciplineId);
  const porMotivo = countBy(aRevisar, (e) => e.motivo);
  const maxMat = porMateria.length ? porMateria[0][1] : 1;
  const maxMot = porMotivo.length ? porMotivo[0][1] : 1;
  const drillDaSemana = porMateria.length ? discById[porMateria[0][0]]?.name : null;
  const dominados = erros.length - aRevisar.length;

  const TIPO_COR = { memoria: C.gold, treino: C.inkSoft, metodo: C.red };

  // O destaque do botão segue o motivo: só erro de memória merece virar ficha.
  const converterBtn = (e) => {
    const tipo = tipoMotivo(e.motivo);
    const estilo = tipo === "memoria" ? { background: C.navActiveBg, color: C.navActiveInk }
      : tipo === "treino" ? { background: C.surface2, color: C.inkSoft, border: `1px solid ${C.line}` }
        : { color: C.muted, border: `1px dashed ${C.line}` };
    return <button onClick={() => erroParaFicha(e)} title={TIPO_NOTA[tipo]} className="text-xs font-semibold px-2 py-1 rounded-lg shrink-0" style={estilo}>Virar flashcard</button>;
  };

  const Barra = ({ label, n, max, cor }) => (
    <div className="flex items-center gap-2">
      <span className="text-xs w-36 truncate" style={{ color: C.muted }} title={label}>{label}</span>
      <div className="flex-1 h-2 rounded-full" style={{ background: C.surface2, border: `1px solid ${C.line}` }}>
        <div className="h-full rounded-full" style={{ width: `${(n / max) * 100}%`, background: cor }} />
      </div>
      <span className="text-xs w-5 text-right">{n}</span>
    </div>
  );

  if (sessao && atual) return <div>
    <PageTitle sub="Leia o erro, tente reconstruir o conceito de cabeça e só então revele a lição.">Revisão de erros</PageTitle>
    <div className="flex items-center justify-between gap-2 mb-4">
      <div className="text-xs font-semibold" style={{ color: C.muted }}>
        {sessao.index + 1} / {sessao.queue.length} · {discById[atual.disciplineId]?.name || "?"}{atual.topicId && ` · ${topicName(atual.disciplineId, atual.topicId)}`}
      </div>
      <button onClick={() => setSessao(null)} className="text-xs font-semibold flex items-center gap-1 shrink-0" style={{ color: C.muted }}><X size={14} /> Encerrar</button>
    </div>
    <Card className="min-h-[200px]">
      <span className="text-xs font-bold rounded-full px-2.5 py-1" style={{ color: TIPO_COR[tipoMotivo(atual.motivo)], background: C.surface2, border: `1px solid ${C.line}` }}>{atual.motivo} · {TIPO_LABEL[tipoMotivo(atual.motivo)]}</span>
      <p className="text-lg font-semibold leading-snug mt-3">{atual.tema}</p>
      {sessao.showLicao && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: C.line }}>
          <div className="text-xs font-semibold mb-1" style={{ color: C.muted }}>O que aprendi</div>
          <p className="text-sm" style={{ color: C.inkSoft }}>{atual.licao || "Você não registrou a lição desse erro — vale voltar nele e escrever o conceito certo."}</p>
        </div>
      )}
    </Card>
    {!sessao.showLicao ? (
      <div className="flex justify-center mt-5"><Btn onClick={() => setSessao((s) => ({ ...s, showLicao: true }))}>Mostrar o que aprendi</Btn></div>
    ) : (
      <div className="grid grid-cols-2 gap-2 mt-5">
        <Btn variant="ghost" onClick={() => responder(false)} style={{ flexDirection: "column", justifyContent: "center", color: C.red, borderColor: C.red }}>Ainda erro<span className="text-xs font-normal opacity-80">continua no caderno</span></Btn>
        <Btn onClick={() => responder(true)} style={{ flexDirection: "column", justifyContent: "center", background: C.green, borderColor: C.green, color: "#fff" }}>Dominei<span className="text-xs font-normal opacity-90">sai da revisão</span></Btn>
      </div>
    )}
  </div>;

  return <div>
    <PageTitle sub="Registre por que errou, estude por recortes (matéria, tópico ou motivo) e marque o que já dominou.">Caderno de erros</PageTitle>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <Stat label="Erros registrados" value={erros.length} Icon={AlertCircle} />
      <Stat label="A revisar" value={aRevisar.length} Icon={Crosshair} color={C.red} />
      <Stat label="Dominados" value={dominados} Icon={CheckCircle2} color={C.green} />
      <Stat label="Matéria crítica" value={drillDaSemana || "—"} Icon={Target} color={C.gold} />
    </div>

    {erros.length > 0 && (
      <Card className="mb-4">
        <div className="flex items-center gap-2 text-sm font-semibold mb-3"><AlertCircle size={16} color={C.gold} /> Raio-X dos erros</div>
        {drillDaSemana && <p className="text-sm mb-3" style={{ color: C.inkSoft }}>Drill recomendado: <b>{drillDaSemana}</b> — sua matéria com mais erros em aberto.</p>}
        <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Por matéria</div>
        <div className="space-y-2 mb-4">
          {porMateria.slice(0, 5).map(([discId, n]) => <Barra key={discId} label={discById[discId]?.name || "?"} n={n} max={maxMat} cor={C.red} />)}
        </div>
        <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Por que você erra</div>
        <div className="space-y-2 mb-3">
          {porMotivo.slice(0, 5).map(([motivo, n]) => <Barra key={motivo} label={motivo} n={n} max={maxMot} cor={TIPO_COR[tipoMotivo(motivo)]} />)}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-3" style={{ color: C.muted }}>
          {["memoria", "treino", "metodo"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className="rounded-full" style={{ width: 8, height: 8, background: TIPO_COR[t] }} />
              {TIPO_LABEL[t]}
            </span>
          ))}
        </div>
        <p className="text-xs mb-3" style={{ color: C.muted }}>Erro de <b>memória</b> vira flashcard. De <b>treino</b>, refaça questões do tipo. De <b>método</b>, nenhum estudo resolve — mude a conduta na prova.</p>
        <button className="text-xs font-semibold" style={{ color: C.gold }} onClick={() => setView("flashcards")}>Ver flashcards →</button>
      </Card>
    )}

    {erros.length > 0 && (
      <Card className="mb-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><Filter size={15} color={C.gold} /> Estudar pelo caderno</div>
          <Btn onClick={startRevisao} disabled={!filtrados.length} style={!filtrados.length ? { opacity: 0.4 } : undefined}><Play size={16} /> Revisar {filtrados.length}</Btn>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <select value={fDisc} onChange={(e) => { setFDisc(e.target.value); setFTopic("todas"); }} className={inputCls} style={inputStyle(C)}>
            <option value="todas">Todas as matérias</option>
            {disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={fTopic} onChange={(e) => setFTopic(e.target.value)} disabled={fDisc === "todas"} className={inputCls} style={{ ...inputStyle(C), opacity: fDisc === "todas" ? 0.5 : 1 }}>
            <option value="todas">{fDisc === "todas" ? "Escolha uma matéria" : "Todos os tópicos"}</option>
            {fDisc !== "todas" && <option value="__geral">Geral (sem tópico)</option>}
            {fTopics.map((t) => <option key={t.id} value={t.id}>{t.num ? `${t.num} · ` : ""}{t.name}</option>)}
          </select>
          <select value={fMotivo} onChange={(e) => setFMotivo(e.target.value)} className={inputCls} style={inputStyle(C)}>
            <option value="todos">Todos os motivos</option>
            <optgroup label="Por tipo de erro">
              {["memoria", "treino", "metodo"].map((t) => <option key={t} value={`tipo:${t}`}>Só {TIPO_LABEL[t]}</option>)}
            </optgroup>
            <optgroup label="Por motivo">
              {motivosUsados.map((m) => <option key={m} value={m}>{m}</option>)}
            </optgroup>
          </select>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={inputCls} style={inputStyle(C)}>
            <option value="revisar">A revisar</option>
            <option value="dominados">Dominados</option>
            <option value="todos">Todos</option>
          </select>
          <select value={ordem} onChange={(e) => setOrdem(e.target.value)} className={inputCls} style={inputStyle(C)}>
            <option value="recentes">Mais recentes primeiro</option>
            <option value="antigos">Mais antigos primeiro</option>
          </select>
        </div>
      </Card>
    )}

    {showForm ? (
      <Card className="mb-4">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><Plus size={16} color={C.gold} /> Registrar erro</div>
          <button onClick={() => setShowForm(false)} className="text-xs font-semibold flex items-center gap-1" style={{ color: C.muted }}><X size={14} /> Fechar</button>
        </div>
        <Field label="Matéria">
          <select value={erroForm.disciplineId} onChange={(e) => setErroForm({ ...erroForm, disciplineId: e.target.value, topicId: "" })} className={inputCls} style={inputStyle(C)}>
            {disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        {(discById[erroForm.disciplineId]?.topics || []).length > 0 && (
          <Field label="Tópico do edital (opcional — a ficha já nasce classificada)">
            <select value={erroForm.topicId} onChange={(e) => setErroForm({ ...erroForm, topicId: e.target.value })} className={inputCls} style={inputStyle(C)}>
              <option value="">— geral —</option>
              {discById[erroForm.disciplineId].topics.map((t) => <option key={t.id} value={t.id}>{t.num ? `${t.num} · ` : ""}{t.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Questão / tema do erro"><textarea rows={2} value={erroForm.tema} onChange={(e) => setErroForm({ ...erroForm, tema: e.target.value })} className={inputCls} style={inputStyle(C)} placeholder="Ex.: Cálculo de broadcast em sub-rede /27" /></Field>
        <Field label="Por que errei">
          <select value={erroForm.motivo} onChange={(e) => setErroForm({ ...erroForm, motivo: e.target.value })} className={inputCls} style={inputStyle(C)}>
            {MOTIVOS_ERRO.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="O que aprendi (vira a resposta do flashcard)"><textarea rows={3} value={erroForm.licao} onChange={(e) => setErroForm({ ...erroForm, licao: e.target.value })} className={inputCls} style={inputStyle(C)} placeholder="O conceito certo, com suas palavras." /></Field>
        <div className="flex justify-end"><Btn onClick={addErro}><Plus size={16} /> Registrar erro</Btn></div>
      </Card>
    ) : (
      <div className="flex justify-end mb-3"><Btn onClick={() => setShowForm(true)}><Plus size={16} /> Registrar erro</Btn></div>
    )}

    <ExportBar
      filenameBase="caderno-de-erros"
      headers={["Matéria", "Tópico", "Questão/tema", "Motivo", "O que aprendi", "Data", "Virou ficha", "Dominado"]}
      rows={filtrados.map((e) => [
        discById[e.disciplineId]?.name || "?",
        topicName(e.disciplineId, e.topicId),
        e.tema,
        e.motivo,
        e.licao,
        new Date(e.data).toISOString().slice(0, 10),
        e.virouFicha ? "Sim" : "Não",
        e.dominado ? "Sim" : "Não",
      ])}
    >
      <ImportButton onImport={importErros} />
    </ExportBar>

    {erros.length === 0 && <Empty msg="Caderno vazio. Errar e registrar é como se aprende — cada erro aqui é um ponto a mais na prova." />}
    {erros.length > 0 && filtrados.length === 0 && <Empty msg="Nenhum erro nesse recorte. Troque os filtros acima." />}

    {grupos.map((g) => (
      <div key={g.key} className="mb-5">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wide truncate" style={{ color: C.muted }} title={g.label}>{g.label}</h3>
          <span className="text-xs shrink-0" style={{ color: C.muted }}>{g.items.length}</span>
        </div>
        <div className="space-y-2">
          {g.items.map((e) => editId === e.id ? (
            <Card key={e.id} className="!p-4">
              <div className="flex items-center gap-2 text-sm font-semibold mb-4"><Pencil size={15} color={C.gold} /> Editar erro</div>
              <Field label="Matéria">
                <select value={editForm.disciplineId} onChange={(ev) => setEditForm({ ...editForm, disciplineId: ev.target.value, topicId: "" })} className={inputCls} style={inputStyle(C)}>
                  {disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
              {(discById[editForm.disciplineId]?.topics || []).length > 0 && (
                <Field label="Tópico do edital (opcional)">
                  <select value={editForm.topicId} onChange={(ev) => setEditForm({ ...editForm, topicId: ev.target.value })} className={inputCls} style={inputStyle(C)}>
                    <option value="">— geral —</option>
                    {discById[editForm.disciplineId].topics.map((t) => <option key={t.id} value={t.id}>{t.num ? `${t.num} · ` : ""}{t.name}</option>)}
                  </select>
                </Field>
              )}
              <Field label="Questão / tema do erro"><textarea rows={2} value={editForm.tema} onChange={(ev) => setEditForm({ ...editForm, tema: ev.target.value })} className={inputCls} style={inputStyle(C)} /></Field>
              <Field label="Por que errei">
                <select value={editForm.motivo} onChange={(ev) => setEditForm({ ...editForm, motivo: ev.target.value })} className={inputCls} style={inputStyle(C)}>
                  {motivoOpts.map((m) => <option key={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="O que aprendi"><textarea rows={3} value={editForm.licao} onChange={(ev) => setEditForm({ ...editForm, licao: ev.target.value })} className={inputCls} style={inputStyle(C)} /></Field>
              {e.virouFicha && <p className="text-xs mb-3" style={{ color: C.muted }}>Esse erro já virou ficha — editar aqui não altera o flashcard, ajuste ele na aba Flashcards.</p>}
              <div className="flex justify-end gap-2">
                <Btn variant="ghost" onClick={cancelEdit}>Cancelar</Btn>
                <Btn onClick={saveEdit}><Check size={16} /> Salvar</Btn>
              </div>
            </Card>
          ) : (
            <Card key={e.id} className="!p-3" style={e.dominado ? { opacity: 0.7 } : undefined}>
              <div className="flex justify-between gap-2 text-xs mb-1" style={{ color: C.muted }}>
                <span className="truncate">{discById[e.disciplineId]?.name || "?"}{e.topicId && ` · ${topicName(e.disciplineId, e.topicId)}`}</span>
                <span className="shrink-0">{fmtDate(new Date(e.data).toISOString().slice(0, 10))}</span>
              </div>
              <div className="font-medium text-sm">{e.tema}</div>
              <div className="text-sm mt-1" style={{ color: C.muted }}>
                <span style={{ color: TIPO_COR[tipoMotivo(e.motivo)] }}>{e.motivo}</span>
                <span className="text-xs"> ({TIPO_LABEL[tipoMotivo(e.motivo)]})</span>
                {e.licao && <> — {e.licao}</>}
              </div>
              {!e.virouFicha && tipoMotivo(e.motivo) === "metodo" && (
                <p className="text-xs mt-1.5" style={{ color: C.muted }}>{TIPO_NOTA.metodo}</p>
              )}
              {confirmDel === e.id ? (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: C.line }}>
                  <p className="text-xs mb-2" style={{ color: C.inkSoft }}>Esse erro tem um flashcard. Excluir a ficha também?</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => removeErroECard(e)} className="text-xs font-bold px-2.5 py-1.5 rounded-lg" style={{ background: C.red, color: "#fff" }}>Excluir os dois</button>
                    <button onClick={() => { removeErro(e.id); setConfirmDel(null); }} className="text-xs font-bold px-2.5 py-1.5 rounded-lg" style={{ color: C.inkSoft, border: `1px solid ${C.line}` }}>Só o erro</button>
                    <button onClick={() => setConfirmDel(null)} className="text-xs font-bold px-2.5 py-1.5 rounded-lg" style={{ color: C.muted }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center gap-2 mt-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button onClick={() => dominar(e.id, !e.dominado)} className="text-xs font-semibold px-2 py-1 rounded-lg shrink-0"
                      style={e.dominado
                        ? { color: C.green, border: `1px solid ${C.green}` }
                        : { background: C.surface2, color: C.inkSoft, border: `1px solid ${C.line}` }}>
                      {e.dominado ? "✓ dominado" : "Marcar dominado"}
                    </button>
                    {e.virouFicha ? <span className="text-xs flex items-center gap-1 truncate" style={{ color: C.green }}><CheckCircle2 size={13} /> virou ficha</span> : converterBtn(e)}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => startEdit(e)} title="Editar"><Pencil size={15} color={C.muted} /></button>
                    <button onClick={() => askRemove(e)} title="Excluir"><Trash2 size={15} color={C.red} /></button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    ))}
  </div>;
}

/* ============================ HISTÓRICO ============================ */
function HistoricoView({ sessions, setSessions, discById, disciplines, registerStudy }) {
  const C = useC();
  const [edit, setEdit] = useState(null);
  const [novoOpen, setNovoOpen] = useState(false);
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  function remove(id) { setSessions((p) => p.filter((s) => s.id !== id)); }
  function save(id, data) { setSessions((p) => p.map((s) => s.id === id ? { ...s, ...data } : s)); setEdit(null); }
  return <div>
    <div className="flex items-start justify-between gap-3 mb-1">
      <PageTitle sub="Registro completo e cronológico. Corrija ou exclua registros direto aqui.">Histórico de estudo</PageTitle>
      <Btn onClick={() => setNovoOpen(true)} className="shrink-0"><Plus size={16} /> Registrar estudo</Btn>
    </div>
    {sorted.length === 0 ? <Empty msg="Nenhuma sessão registrada ainda." /> : <div className="space-y-2">{sorted.map((s) => { const d = discById[s.disciplineId]; const topic = d?.topics.find((t) => t.id === s.topicId); const tot = s.right + s.wrong;
      return <Card key={s.id} className="!p-3 flex items-center gap-3 group"><span className="w-1.5 h-10 rounded-full" style={{ background: d?.color }} /><div className="flex-1 min-w-0"><div className="text-sm font-semibold truncate">{d?.name} {topic && <span className="font-normal" style={{ color: C.muted }}>· {topic.name}</span>}</div><div className="text-xs flex gap-3 mt-0.5" style={{ color: C.muted }}><span>{fmtDate(s.date)}</span><span><Clock size={11} className="inline" /> {fmtMin(s.minutes)}</span>{tot > 0 && <span style={{ color: C.green }}>✓{s.right}</span>}{tot > 0 && <span style={{ color: C.red }}>✕{s.wrong}</span>}</div>{s.note && <div className="text-xs mt-0.5 italic" style={{ color: C.muted }}>{s.note}</div>}</div><button onClick={() => setEdit(s)} className="p-1"><Pencil size={15} color={C.muted} /></button><button onClick={() => remove(s.id)} className="p-1"><Trash2 size={15} color={C.red} /></button></Card>; })}</div>}
    {edit && <ManualModal disciplines={disciplines} discById={discById} initial={edit} onClose={() => setEdit(null)} onSave={(data) => save(edit.id, data)} />}
    {novoOpen && <ManualModal disciplines={disciplines} discById={discById} onClose={() => setNovoOpen(false)} onSave={(data) => { registerStudy(data); setNovoOpen(false); }} />}
  </div>;
}

/* ============================ QUESTÕES ============================ */
function QuestoesView({ sessions, setSessions, disciplines, discById, registerStudy }) {
  const C = useC();
  const [discId, setDiscId] = useState(disciplines[0]?.id || "");
  const [topicId, setTopicId] = useState("");
  const [right, setRight] = useState("");
  const [wrong, setWrong] = useState("");
  const [date, setDate] = useState(todayISO());
  const [filtroDisc, setFiltroDisc] = useState("todas");
  const [edit, setEdit] = useState(null);
  const topics = discById[discId]?.topics || [];

  const qSessions = useMemo(() => sessions.filter((s) => s.studyType === "questoes" && (s.right + s.wrong) > 0), [sessions]);
  const visible = filtroDisc === "todas" ? qSessions : qSessions.filter((s) => s.disciplineId === filtroDisc);
  const sorted = [...visible].sort((a, b) => b.date.localeCompare(a.date));

  const totalQ = qSessions.reduce((a, s) => a + s.right + s.wrong, 0);
  const totalR = qSessions.reduce((a, s) => a + s.right, 0);
  const accGeral = totalQ ? Math.round((totalR / totalQ) * 100) : null;

  const ranking = useMemo(() => {
    const map = {};
    qSessions.forEach((s) => {
      const d = discById[s.disciplineId];
      const topic = s.topicId ? d?.topics.find((t) => t.id === s.topicId) : null;
      const key = s.topicId || `disc-${s.disciplineId}`;
      if (!map[key]) map[key] = { name: topic ? topic.name : (d?.name || "?"), discName: d?.name || "?", r: 0, w: 0 };
      map[key].r += s.right; map[key].w += s.wrong;
    });
    return Object.values(map).map((t) => ({ ...t, total: t.r + t.w, acc: Math.round((t.r / (t.r + t.w)) * 100) })).sort((a, b) => a.acc - b.acc);
  }, [qSessions, discById]);

  function submit() {
    const r = +right || 0, w = +wrong || 0;
    if (r + w <= 0 || !discId) return;
    registerStudy({ disciplineId: discId, topicId: topicId || null, studyType: "questoes", minutes: 0, right: r, wrong: w, date });
    setRight(""); setWrong("");
  }
  function remove(id) { setSessions((p) => p.filter((s) => s.id !== id)); }
  function save(id, data) { setSessions((p) => p.map((s) => s.id === id ? { ...s, ...data } : s)); setEdit(null); }

  return <div>
    <PageTitle sub="Registre quantas questões fez, acertou e errou por tópico do edital.">Questões</PageTitle>

    <Card className="mb-4">
      <div className="text-sm font-bold mb-3">Registrar questões</div>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Disciplina"><select value={discId} onChange={(e) => { setDiscId(e.target.value); setTopicId(""); }} className={inputCls} style={inputStyle(C)}>{disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
        <Field label="Tópico (opcional)"><select value={topicId} onChange={(e) => setTopicId(e.target.value)} className={inputCls} style={inputStyle(C)}><option value="">— geral —</option>{topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Acertos"><input type="number" min={0} value={right} onChange={(e) => setRight(e.target.value)} className={inputCls} style={inputStyle(C)} placeholder="0" /></Field>
        <Field label="Erros"><input type="number" min={0} value={wrong} onChange={(e) => setWrong(e.target.value)} className={inputCls} style={inputStyle(C)} placeholder="0" /></Field>
        <Field label="Data"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} style={inputStyle(C)} /></Field>
      </div>
      <Btn className="w-full justify-center" onClick={submit}><Plus size={16} /> Registrar</Btn>
    </Card>

    <div className="grid md:grid-cols-3 gap-3 mb-4">
      <Card className="!p-4"><div className="text-[11px] mb-1" style={{ color: C.muted }}>Questões feitas</div><div className="text-2xl font-extrabold">{totalQ}</div></Card>
      <Card className="!p-4"><div className="text-[11px] mb-1" style={{ color: C.muted }}>Acertos</div><div className="text-2xl font-extrabold" style={{ color: C.green }}>{totalR}</div></Card>
      <Card className="!p-4"><div className="text-[11px] mb-1" style={{ color: C.muted }}>Aproveitamento geral</div><div className="text-2xl font-extrabold" style={{ color: accGeral === null ? C.ink : accGeral >= 60 ? C.green : C.red }}>{accGeral === null ? "—" : `${accGeral}%`}</div></Card>
    </div>

    {ranking.length > 0 && <Card className="mb-4">
      <div className="text-sm font-bold mb-3">Ranking por tópico — pior aproveitamento primeiro</div>
      <div className="space-y-1.5">
        {ranking.map((t, i) => {
          const weak = t.acc < 60;
          return <div key={i} className="flex items-center gap-3 py-1.5 border-t first:border-0" style={{ borderColor: C.line }}>
            <div className="flex-1 min-w-0"><div className="text-sm truncate">{t.name}</div><div className="text-xs" style={{ color: C.muted }}>{t.discName} · {t.total}q</div></div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: weak ? C.redSoft : C.greenSoft, color: weak ? C.red : C.green }}>{t.acc}%{weak && " · foco"}</span>
          </div>;
        })}
      </div>
    </Card>}

    <div className="flex items-center justify-between mb-2">
      <div className="text-sm font-bold">Histórico de questões</div>
      <select value={filtroDisc} onChange={(e) => setFiltroDisc(e.target.value)} className="px-2 py-1 rounded-lg text-xs" style={inputStyle(C)}>
        <option value="todas">Todas as disciplinas</option>
        {disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
    </div>
    {sorted.length === 0 ? <Empty msg="Nenhuma questão registrada ainda." /> : <div className="space-y-2">{sorted.map((s) => {
      const d = discById[s.disciplineId]; const topic = d?.topics.find((t) => t.id === s.topicId); const tot = s.right + s.wrong; const acc = tot ? Math.round((s.right / tot) * 100) : 0;
      return <Card key={s.id} className="!p-3 flex items-center gap-3 group">
        <span className="w-1.5 h-10 rounded-full" style={{ background: d?.color }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{d?.name} {topic && <span className="font-normal" style={{ color: C.muted }}>· {topic.name}</span>}</div>
          <div className="text-xs flex gap-3 mt-0.5" style={{ color: C.muted }}><span>{fmtDate(s.date)}</span><span style={{ color: C.green }}>✓{s.right}</span><span style={{ color: C.red }}>✕{s.wrong}</span></div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: acc >= 60 ? C.greenSoft : C.redSoft, color: acc >= 60 ? C.green : C.red }}>{acc}%</span>
        <button onClick={() => setEdit(s)} className="p-1"><Pencil size={15} color={C.muted} /></button>
        <button onClick={() => remove(s.id)} className="p-1"><Trash2 size={15} color={C.red} /></button>
      </Card>;
    })}</div>}
    {edit && <ManualModal disciplines={disciplines} discById={discById} initial={edit} onClose={() => setEdit(null)} onSave={(data) => save(edit.id, data)} />}
  </div>;
}

/* ============================ EDITAL ============================ */
function EditalView({ concurso, disciplines, sessions, setDisciplines }) {
  const C = useC();
  const [sincronizando, setSincronizando] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const perf = useMemo(() => { const map = {}; sessions.forEach((s) => { if (!s.topicId) return; const k = s.topicId; map[k] = map[k] || { min: 0, r: 0, w: 0 }; map[k].min += s.minutes; map[k].r += s.right; map[k].w += s.wrong; }); return map; }, [sessions]);
  const allTopics = disciplines.flatMap((d) => d.topics);
  const studied = allTopics.filter((t) => t.studied).length;
  const pct = allTopics.length ? Math.round((studied / allTopics.length) * 100) : 0;
  const blocks = [...new Set(disciplines.map((d) => d.block))];

  const filteredDisciplines = useMemo(() => {
    if (!searchQuery.trim()) return disciplines;
    const q = searchQuery.toLowerCase();
    return disciplines
      .filter((d) => d.name.toLowerCase().includes(q) || d.topics.some((t) => t.name.toLowerCase().includes(q) || (t.num && t.num.toLowerCase().includes(q))))
      .map((d) => d.name.toLowerCase().includes(q) ? d : ({
        ...d,
        topics: d.topics.filter((t) => t.name.toLowerCase().includes(q) || (t.num && t.num.toLowerCase().includes(q))),
      }));
  }, [disciplines, searchQuery]);
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
    <Card className="mb-4"><input type="text" placeholder="Pesquisar disciplina ou tópico…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={inputCls} style={inputStyle(C)} /></Card>
    <Card className="mb-4"><div className="flex items-center justify-between text-sm mb-2"><span className="font-semibold">Cobertura do edital</span><span style={{ color: C.muted }}>{studied}/{allTopics.length} tópicos</span></div><div className="h-3 rounded-full overflow-hidden" style={{ background: C.line }}><div className="h-full" style={{ width: `${pct}%`, background: C.ink }} /></div></Card>
    {blocks.map((block) => (
      <div key={block} className="mb-5"><h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Conhecimentos {block}</h3><div className="space-y-3">
        {filteredDisciplines.filter((d) => d.block === block).map((d) => { const done = d.topics.filter((t) => t.studied).length;
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

/* ============================ ESTATÍSTICAS ============================ */
function StatsView({ sessions, disciplines }) {
  const C = useC();
  const m = useMetrics(sessions, disciplines);
  const weekly = useMemo(() => { const map = {}; sessions.forEach((s) => { const w = startOfWeek(s.date); map[w] = (map[w] || 0) + s.minutes; }); const weeks = []; let w = startOfWeek(todayISO()); for (let i = 7; i >= 0; i--) { const wk = addDays(w, -i * 7); weeks.push({ semana: fmtDate(wk), horas: Math.round((map[wk] || 0) / 6) / 10 }); } return weeks; }, [sessions]);
  const pie = Object.values(m.byDisc).filter((v) => v.minutes > 0).map((v) => ({ name: v.name, value: v.minutes, color: v.color }));
  const totalQ = Object.values(m.byDisc).reduce((a, v) => a + v.right + v.wrong, 0); const totalR = Object.values(m.byDisc).reduce((a, v) => a + v.right, 0);
  const acc = totalQ ? Math.round((totalR / totalQ) * 100) : 0; const avg = sessions.length ? Math.round(m.totalMin / sessions.length) : 0;
  const topicPerf = useMemo(() => {
    const map = {};
    sessions.forEach((s) => { if (!s.topicId) return; if (!map[s.topicId]) map[s.topicId] = { r: 0, w: 0 }; map[s.topicId].r += s.right; map[s.topicId].w += s.wrong; });
    const rows = [];
    disciplines.forEach((d) => d.topics.forEach((t) => {
      const p = map[t.id]; if (!p || p.r + p.w === 0) return;
      rows.push({ discName: d.name, name: t.name, total: p.r + p.w, acc: Math.round((p.r / (p.r + p.w)) * 100) });
    }));
    return rows.sort((a, b) => a.acc - b.acc);
  }, [sessions, disciplines]);
  return <div>
    <PageTitle sub="Gráficos de evolução e indicadores para orientar sua estratégia.">Estatísticas e indicadores</PageTitle>
    <div className="grid grid-cols-3 gap-3 mb-4"><Stat label="Taxa de acerto" value={`${acc}%`} Icon={Target} color={acc >= 70 ? C.green : C.gold} /><Stat label="Tempo médio/sessão" value={`${avg}min`} Icon={TimerIcon} /><Stat label="Melhor constância" value={`${m.streak}d`} Icon={Flame} color={C.gold} /></div>
    <Card className="mb-4"><div className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp size={16} color={C.gold} /> Evolução — horas por semana</div><ResponsiveContainer width="100%" height={220}><LineChart data={weekly}><CartesianGrid strokeDasharray="3 3" stroke={C.line} /><XAxis dataKey="semana" fontSize={11} stroke={C.muted} /><YAxis fontSize={11} stroke={C.muted} /><Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, color: C.ink }} /><Line type="monotone" dataKey="horas" stroke={C.gold} strokeWidth={2.5} dot={{ fill: C.gold, r: 4 }} /></LineChart></ResponsiveContainer></Card>
    <div className="grid md:grid-cols-2 gap-4 mb-4">
      <Card><div className="text-sm font-semibold mb-3">Distribuição do tempo por disciplina</div>{pie.length === 0 ? <Empty msg="Sem dados ainda." /> : <ResponsiveContainer width="100%" height={240}><PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>{pie.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip formatter={(v) => fmtMin(v)} contentStyle={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, color: C.ink }} /><Legend fontSize={10} /></PieChart></ResponsiveContainer>}</Card>
      <Card><div className="text-sm font-semibold mb-3">Acertos vs erros por disciplina</div><ResponsiveContainer width="100%" height={240}><BarChart data={Object.values(m.byDisc).filter((v) => v.right + v.wrong > 0)} layout="vertical" margin={{ left: 10 }}><XAxis type="number" fontSize={11} stroke={C.muted} /><YAxis type="category" dataKey="name" width={90} fontSize={10} stroke={C.muted} /><Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, color: C.ink }} /><Bar dataKey="right" stackId="a" fill={C.green} name="Acertos" /><Bar dataKey="wrong" stackId="a" fill={C.red} name="Erros" /></BarChart></ResponsiveContainer></Card>
    </div>
    <Card>
      <div className="text-sm font-semibold mb-3">Acertos por tópico — pior aproveitamento primeiro</div>
      {topicPerf.length === 0 ? <Empty msg="Registre acertos/erros por tópico para ver o detalhamento aqui." /> : <div className="space-y-1.5">
        {topicPerf.map((t, i) => { const weak = t.acc < 60;
          return <div key={i} className="flex items-center gap-3 py-1.5 border-t first:border-0" style={{ borderColor: C.line }}>
            <div className="flex-1 min-w-0"><div className="text-sm truncate">{t.name}</div><div className="text-xs" style={{ color: C.muted }}>{t.discName} · {t.total}q</div></div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: weak ? C.redSoft : C.greenSoft, color: weak ? C.red : C.green }}>{t.acc}%{weak && " · foco"}</span>
          </div>;
        })}
      </div>}
    </Card>
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
    const sub = ehBB ? "Banco do Brasil · Agente de Tecnologia · CESGRANRIO" : `Dataprev · ${concurso?.subtitle || "Arquitetura de Software"}`;

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
const PERFIL_AVATAR_COLORS = ["#f5a623", "#5b9dfa", "#4dd08a", "#e06b9f", "#a48bfa", "#4dcbdb"];
function PerfilPicker({ atual, onSelect, onClose }) {
  const [busca, setBusca] = useState("");
  const perfis = CONCURSOS.map((c, i) => ({
    id: c.id, instituicao: c.label, cargo: c.subtitle || "",
    iniciais: c.label.slice(0, 2).toUpperCase(),
    cor: PERFIL_AVATAR_COLORS[i % PERFIL_AVATAR_COLORS.length],
  }));
  const filtrados = perfis.filter((p) => {
    const q = busca.trim().toLowerCase();
    if (!q) return true;
    return p.instituicao.toLowerCase().includes(q) || p.cargo.toLowerCase().includes(q);
  });
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, minHeight: "100vh", width: "100%", background: "radial-gradient(circle at 50% -10%, #1b1e2a 0%, #12141c 55%)", display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 24px 80px", fontFamily: "'Inter',ui-sans-serif,system-ui,sans-serif", boxSizing: "border-box", overflowY: "auto" }}>
      {onClose && (
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "transparent", border: "none", color: "#565b6a", cursor: "pointer", padding: 8 }} aria-label="Fechar">
          <X size={20} />
        </button>
      )}
      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, border: "2px solid #f5a623", borderRadius: 10, transform: "rotate(45deg)", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
            <BookOpen size={18} color="#f5a623" style={{ transform: "rotate(-45deg)" }} />
          </div>
          <div style={{ color: "#fff", fontSize: 24, fontWeight: 700, letterSpacing: "-0.3px" }}>Studora</div>
        </div>

        <h1 style={{ color: "#fff", fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 700, margin: "28px 0 20px", textAlign: "center" }}>Qual perfil você quer estudar hoje?</h1>

        <div style={{ width: "100%", maxWidth: 560, position: "relative", marginBottom: 24 }}>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar perfil ou instituição..."
            style={{ width: "100%", boxSizing: "border-box", background: "#1a1d29", border: "1px solid #262a3a", borderRadius: 12, padding: "14px 16px", color: "#fff", fontSize: 15, outline: "none" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 560 }}>
          {filtrados.map((p) => {
            const ativo = p.id === atual;
            return (
              <button key={p.id} onClick={() => onSelect(p.id)}
                style={{ all: "unset", boxSizing: "border-box", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, padding: "16px 18px", borderRadius: 14, background: ativo ? "rgba(245,166,35,0.08)" : "#1a1d29", border: ativo ? "1px solid rgba(245,166,35,0.35)" : "1px solid #262a3a", transition: "background 0.15s ease", width: "100%" }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: p.cor, display: "flex", alignItems: "center", justifyContent: "center", color: "#12141c", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                  {p.iniciais}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, textAlign: "left" }}>
                  <div style={{ color: "#fff", fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{p.instituicao}</div>
                  <div style={{ color: "#a8adba", fontSize: 13.5, lineHeight: 1.3 }}>{p.cargo}</div>
                </div>
                <div style={{ marginLeft: "auto", color: "#565b6a", fontSize: 18, flexShrink: 0 }}>→</div>
              </button>
            );
          })}
          {filtrados.length === 0 && <div style={{ color: "#565b6a", fontSize: 14, textAlign: "center", padding: "24px 0" }}>Nenhum perfil encontrado.</div>}
        </div>

        <p style={{ color: "#565b6a", fontSize: 13, marginTop: 40 }}>Gerenciar perfis está disponível nas configurações da conta</p>
      </div>
    </div>
  );
}

function StudyAppWithConcurso({ onLogout }) {
  const [concurso, setConcursoState] = React.useState(CONCURSOS[0]);
  const [pickerOpen, setPickerOpen] = React.useState(false);

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
    setPickerOpen(false);
  }

  return (
    <>
      <StudyApp key={concurso.id} concurso={concurso} setConcurso={setConcurso} onOpenPicker={() => setPickerOpen(true)} onLogout={onLogout} />
      {pickerOpen && <PerfilPicker atual={concurso.id} onSelect={setConcurso} onClose={() => setPickerOpen(false)} />}
    </>
  );
}

function Preloader({ exiting, label }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "#0A0F1C",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "transform 1s cubic-bezier(0.7,0,0.3,1), opacity .4s ease",
      transform: exiting ? "translateY(-100%)" : "translateY(0)",
    }}>
      <div style={{
        textAlign: "center",
        transition: "opacity .4s ease, transform .4s ease",
        opacity: exiting ? 0.1 : 1,
        transform: exiting ? "translateY(-80px)" : "translateY(0)",
      }}>
        <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto" }}>
          <span style={{ position: "absolute", width: 80, height: 80, border: "8px solid #F5B301", borderTop: "8px solid transparent", borderRadius: 999, animation: "pl-spin-1 2s infinite linear" }} />
          <span style={{ position: "absolute", top: 20, left: 20, width: 40, height: 40, border: "8px solid #F5B301", borderTop: "8px solid transparent", borderRadius: 999, animation: "pl-spin-2 1s infinite linear" }} />
        </div>
        {label && <p style={{ marginTop: 18, fontSize: 11, fontWeight: 600, letterSpacing: ".18em", textTransform: "uppercase", color: "#F5B301" }}>{label}</p>}
      </div>
    </div>
  );
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

  if (!ready) return <Preloader exiting={false} />;
  if (!session) return <Login />;
  return <StudyAppWithConcurso onLogout={() => supabase.auth.signOut()} />;
}

function Login() {
  const [mode, setMode] = React.useState("login"); // login | signup
  const [email, setEmail] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [msg, setMsg] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [focusEmail, setFocusEmail] = React.useState(false);
  const [focusPass, setFocusPass] = React.useState(false);

  const isLogin = mode === "login";

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

  return (
    <div style={{ minHeight: "100vh", width: "100%", position: "relative", overflow: "hidden", background: "#0A0F1C", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, boxSizing: "border-box", fontFamily: "'Inter',ui-sans-serif,system-ui,sans-serif" }}>

      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 900px 600px at 15% 20%, rgba(245,179,1,.10) 0%, transparent 60%), radial-gradient(ellipse 700px 700px at 85% 85%, rgba(11,42,91,.5) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />

      <div style={{ position: "absolute", top: -60, left: "6%", width: 220, height: 220, border: "1px solid rgba(245,179,1,.25)", transform: "rotate(15deg)", animation: "ln-rotate 60s linear infinite" }} />
      <div style={{ position: "absolute", bottom: -90, left: "12%", width: 160, height: 160, border: "1px solid rgba(245,179,1,.15)", borderRadius: "50%", animation: "ln-rotateRev 50s linear infinite" }} />
      <div style={{ position: "absolute", top: "12%", right: "8%", width: 130, height: 130, background: "linear-gradient(135deg, rgba(245,179,1,.12), transparent)", transform: "rotate(45deg)", animation: "ln-rotate 40s linear infinite" }} />
      <div style={{ position: "absolute", bottom: "14%", right: "14%", width: 8, height: 8, borderRadius: "50%", background: "#F5B301", boxShadow: "0 0 16px 4px rgba(245,179,1,.6)" }} />
      <div style={{ position: "absolute", top: "22%", left: "22%", width: 5, height: 5, borderRadius: "50%", background: "#F5B301", boxShadow: "0 0 12px 3px rgba(245,179,1,.5)" }} />

      <form onSubmit={submit} style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 412, background: "linear-gradient(180deg, rgba(22,30,46,.9), rgba(14,20,32,.95))", border: "1px solid rgba(245,179,1,.18)", borderRadius: 4, padding: "44px 40px 36px", boxShadow: "0 40px 100px -20px rgba(0,0,0,.7), 0 0 0 1px rgba(0,0,0,.4)", animation: "ln-fadeUp .6s ease both" }}>

        <div style={{ position: "absolute", top: -1, left: -1, width: 28, height: 28, borderTop: "2px solid #F5B301", borderLeft: "2px solid #F5B301" }} />
        <div style={{ position: "absolute", bottom: -1, right: -1, width: 28, height: 28, borderBottom: "2px solid #F5B301", borderRight: "2px solid #F5B301" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 34 }}>
          <div style={{ width: 42, height: 42, border: "1px solid #F5B301", display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(45deg)" }}>
            <BookOpen size={18} color="#F5B301" style={{ transform: "rotate(-45deg)" }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 19, color: "#F2F4F8", letterSpacing: ".02em" }}>STUDORA</div>
            <div style={{ fontSize: 10, color: "#F5B301", letterSpacing: ".18em", fontWeight: 600 }}>ESTUDOS · CONCURSOS</div>
          </div>
        </div>

        <h1 style={{ fontSize: 25, fontWeight: 800, color: "#F2F4F8", margin: "0 0 8px", letterSpacing: "-.01em" }}>
          {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
        </h1>
        <p style={{ fontSize: 13.5, color: "#8A96AC", margin: "0 0 30px", lineHeight: 1.5 }}>
          {isLogin ? "Entre para continuar sua trilha de estudos." : "Comece a organizar seus estudos hoje."}
        </p>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: ".06em", color: focusEmail ? "#F5B301" : "#8A96AC", marginBottom: 8, textTransform: "uppercase" }}>E-mail</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocusEmail(true)} onBlur={() => setFocusEmail(false)} placeholder="voce@email.com"
            style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: 2, border: `1px solid ${focusEmail ? "#F5B301" : "rgba(255,255,255,.12)"}`, fontSize: 14.5, color: "#F2F4F8", outline: "none", background: "rgba(255,255,255,.03)", boxShadow: focusEmail ? "0 0 0 3px rgba(245,179,1,.12)" : "none" }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".06em", color: focusPass ? "#F5B301" : "#8A96AC", textTransform: "uppercase" }}>Senha</label>
          </div>
          <input type="password" required minLength={6} value={pass} onChange={(e) => setPass(e.target.value)} onFocus={() => setFocusPass(true)} onBlur={() => setFocusPass(false)} placeholder="mínimo 6 caracteres"
            style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: 2, border: `1px solid ${focusPass ? "#F5B301" : "rgba(255,255,255,.12)"}`, fontSize: 14.5, color: "#F2F4F8", outline: "none", background: "rgba(255,255,255,.03)", boxShadow: focusPass ? "0 0 0 3px rgba(245,179,1,.12)" : "none" }} />
        </div>

        <button type="submit" disabled={busy}
          style={{ width: "100%", marginTop: 22, padding: 15, borderRadius: 2, border: "1px solid #F5B301", background: busy ? "#8a7433" : "#F5B301", color: "#0A0F1C", fontSize: 13.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          {busy && <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(10,15,28,.3)", borderTopColor: "#0A0F1C", animation: "ln-spin .7s linear infinite" }} />}
          <span>{busy ? "Aguarde…" : isLogin ? "Entrar" : "Criar conta"}</span>
        </button>

        {msg && (
          <div style={{ marginTop: 16, padding: "11px 13px", borderRadius: 2, border: `1px solid ${msg.ok ? "rgba(21,154,108,.4)" : "rgba(220,80,80,.4)"}`, background: msg.ok ? "rgba(21,154,108,.1)" : "rgba(220,80,80,.1)", color: msg.ok ? "#4ADE9C" : "#F28B8B", fontSize: 12.5, fontWeight: 500 }}>
            {msg.t}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "30px 0 20px" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.08)" }} />
          <span style={{ fontSize: 10, color: "#5B6478", fontWeight: 600, letterSpacing: ".1em" }}>OU</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.08)" }} />
        </div>

        <button type="button" onClick={() => { setMode(isLogin ? "signup" : "login"); setMsg(null); }}
          style={{ width: "100%", background: "transparent", border: "none", color: "#F5B301", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 6 }}>
          {isLogin ? "Não tem conta? Criar agora" : "Já tenho conta — entrar"}
        </button>
      </form>
    </div>
  );
}
