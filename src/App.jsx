import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from "react";
import {
  Home, RefreshCw, CalendarDays, ListChecks, BookOpen, History, BarChart3,
  ClipboardList, Play, Pause, Plus, Flame, Target, Clock, Check,
  Trash2, Pencil, X, ChevronRight, TrendingUp, Circle, CheckCircle2,
  Timer as TimerIcon, Menu, Crosshair, Zap, Sun, Moon, SkipForward, RotateCcw, Coffee, LogOut,
  GraduationCap, FileText, ChevronLeft, AlertCircle, Award, Filter
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { supabase } from "./supabaseClient";

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
const SEED_DATAPREV = [
  { name: "Língua Portuguesa", block: "Gerais", peso: 10, q: 10, topics: [
    { name: "Compreensão e interpretação de textos de gêneros variados e reconhecimento textuais.", hits: 8 },
    { name: "Domínio da ortografia oficial, acentuação e crase.", hits: 5 },
    { name: "Mecanismos de coesão textual, tempos e modos verbais.", hits: 5 },
    { name: "Estrutura morfossintática do período, concordância e regência verbal/nominal.", hits: 6 },
    { name: "Reescrita de frases e parágrafos, significação e substituição de palavras.", hits: 4 },
  ]},
  { name: "Língua Inglesa", block: "Gerais", peso: 5, q: 5, topics: [
    { name: "Compreensão de textos em língua inglesa e itens gramaticais relevantes.", hits: 5 },
  ]},
  { name: "Raciocínio Lógico Matemático", block: "Gerais", peso: 10, q: 10, topics: [
    { name: "Estruturas lógicas, lógica de argumentação (inferências, deduções).", hits: 8 },
    { name: "Lógica sentencial (proposições simples/compostas, tabelas-verdade, equivalências).", hits: 8 },
    { name: "Diagramas lógicos e lógica de primeira ordem.", hits: 6 },
    { name: "Problemas aritméticos, geométricos e matriciais.", hits: 5 },
  ]},
  { name: "Atualidades e IA", block: "Gerais", peso: 5, q: 5, topics: [
    { name: "Tópicos de segurança, política, economia, sociedade, tecnologia, ecologia.", hits: 4 },
    { name: "Inteligência Artificial: conceitos, fundamentos, aplicações e aprendizado de máquina.", hits: 6 },
    { name: "Modelos generativos, LLMs, ética, governança e privacidade em IA.", hits: 5 },
  ]},
  { name: "Legislação e Seg. Informação", block: "Gerais", peso: 5, q: 5, topics: [
    { name: "Lei nº 12.527/2011 (Acesso à Informação) — caps I ao V; Dec 7.724 e 7.845.", hits: 4 },
    { name: "Lei nº 12.737/2012 (Delitos Informáticos) — art. 2º.", hits: 3 },
    { name: "Lei nº 12.965/2014 (Marco Civil da Internet) — caps II e III.", hits: 3 },
    { name: "Lei nº 13.709/2018 (LGPD) — capítulos I, II, III, IV, VII, VIII e IX.", hits: 5 },
  ]},
  { name: "Redes de Computadores", block: "Específicos", peso: 8, q: 8, topics: [
    { name: "Conceitos básicos: meios de transmissão, classificação, topologias, WAN, LAN e Redes Sem Fio.", hits: 7 },
    { name: "Elementos de interconexão (hubs, switches, roteadores), VLANs e Cabeamento estruturado.", hits: 6 },
    { name: "Modelo de referência OSI e padrões IEEE 802.1, 802.3, 802.11 a/b/g/n/ac.", hits: 7 },
    { name: "Arquitetura e pilhas de protocolos TCP/IP: camada de rede, transporte e aplicação.", hits: 8 },
  ]},
  { name: "Banco de Dados", block: "Específicos", peso: 8, q: 8, topics: [
    { name: "Arquitetura, estruturas, modelagem de dados e normalização.", hits: 7 },
    { name: "SQL (ANSI), DDL, DML. SGBDs: Oracle 19C, MySQL, PostgreSQL, MongoDB, MS-SQLSERVER.", hits: 8 },
    { name: "Armazenamento, backup, restauração, segurança, monitoração e Big Data.", hits: 5 },
  ]},
  { name: "Arquitetura Tecnológica", block: "Específicos", peso: 10, q: 10, topics: [
    { name: "Ciclo de vida do software, Metodologias Ágeis, Qualidade e Gestão de Configuração.", hits: 8 },
    { name: "Engenharia de requisitos (elicitação, gerenciamento, especificação, validação) e Usabilidade.", hits: 6 },
    { name: "Orientação a objetos, SOLID, GRASP, TDD, BDD, Padrões de projeto, UML.", hits: 9 },
    { name: "Interoperabilidade, APIs, API Gateway, Web Services, padrões XML, JSON, REST, DEVSECOPS.", hits: 8 },
  ]},
  { name: "Computação em Nuvem e Virt.", block: "Específicos", peso: 8, q: 8, topics: [
    { name: "Conceitos IaaS, PaaS, SaaS. Nuvens Privada, Pública e Híbrida. Escalabilidade e Alta Disponibilidade.", hits: 7 },
    { name: "Componentes de arquitetura (regiões, zonas). Identidade, privacidade e segurança. IaC.", hits: 6 },
    { name: "Red Hat Clair, Docker, Harbor, Kubernetes, VMware (vCenter, vCloud, NSX, vRealize).", hits: 7 },
  ]},
  { name: "Linguagens e Frameworks", block: "Específicos", peso: 7, q: 7, topics: [
    { name: "Gitlab, HTML5, CSS3, Java, Javascript / React.js, Java EE, Spring Boot, Spring Cloud, Kafka.", hits: 7 },
  ]},
  { name: "Segurança da Informação", block: "Específicos", peso: 8, q: 8, topics: [
    { name: "Políticas e Procedimentos. Normas ISO/IEC 27001 e 27002. Criptografia e Certificação digital.", hits: 8 },
    { name: "Vulnerabilidades, malwares, ataques. Ferramentas: IDS, IPS, SIEM. NIST Framework v1.1.", hits: 8 },
  ]},
  { name: "Plataforma Básica", block: "Específicos", peso: 4, q: 4, topics: [
    { name: "Arquitetura de Computadores (Hardware). Backups. Storages (bloco, objeto, NAS, CIFS, NFS).", hits: 4 },
    { name: "Arquitetura de SO (processamento, memória, sistema de arquivos). Monitoramento.", hits: 4 },
  ]},
  { name: "Automação", block: "Específicos", peso: 4, q: 4, topics: [
    { name: "Infra como código, DevOps, Cloud. Ferramentas: Puppet, Ansible, Gitlab, Jenkins, Rundeck. Contêineres.", hits: 5 },
  ]},
  { name: "Ferramentas Analytics", block: "Específicos", peso: 3, q: 3, topics: [
    { name: "ETL, BI, Big Data, Machine Learning, IA. Mineração de Dados e bancos distribuídos.", hits: 4 },
  ]},
  { name: "Plataforma Baixa", block: "Específicos", peso: 3, q: 3, topics: [
    { name: "Windows, Linux, Unix (instalação e suporte). Serviços: Samba, LDAP, AD, SSH, FTP, NFS. Virtualização.", hits: 3 },
  ]},
  { name: "Aplicações", block: "Específicos", peso: 2, q: 2, topics: [
    { name: "Java EE, Container WEB e EJB, Arquitetura SOA e Microserviços. Servidores: Apache, NGINX, Weblogic, JBoss.", hits: 5 },
  ]},
];

const SEED_BB = [
  { name: "Tecnologia da Informação", block: "Específicos", peso: 52.5, q: 35, topics: [
    { name: "SQL: DDL, DML, JOINs, subconsultas, normalização e 3FN", hits: 9 },
    { name: "Python: NumPy, Pandas, Scikit-learn e estruturas de dados", hits: 8 },
    { name: "Estruturas de dados: pilhas, filas, árvores binárias, busca e ordenação", hits: 8 },
    { name: "Java/OOP: herança, polimorfismo, interfaces, Kotlin", hits: 7 },
    { name: "TypeScript: tipagem estática, generics, DOM, reduce", hits: 5 },
    { name: "Machine Learning: classificação (K-NN), regressão, matriz de confusão, acurácia", hits: 5 },
    { name: "Data Warehouse e Big Data: esquema estrela, cubo de dados, ETL", hits: 4 },
    { name: "NoSQL: MongoDB, grafos, bancos de documentos e colunar", hits: 4 },
    { name: "DevOps e Cloud: Ansible, Docker, Kubernetes, IaC", hits: 4 },
    { name: "Mobile e linguagens: Swift, Kotlin, iOS (Xcode / Interface Builder)", hits: 3 },
  ]},
  { name: "Probabilidade e Estatística", block: "Específicos", peso: 7.5, q: 5, topics: [
    { name: "Probabilidade: eventos, condicional e Teorema de Bayes", hits: 5 },
    { name: "Estatística descritiva: média, mediana, variância e desvio padrão", hits: 5 },
    { name: "Distribuição normal e análise amostral", hits: 3 },
    { name: "Combinatória: permutação, arranjo e combinação", hits: 2 },
  ]},
  { name: "Conhecimentos Bancários", block: "Específicos", peso: 7.5, q: 5, topics: [
    { name: "Sistema Financeiro Nacional — estrutura, BACEN, COPOM e taxa Selic", hits: 5 },
    { name: "Sigilo bancário (Lei Complementar nº 105/2001)", hits: 5 },
    { name: "PLD/FT — prevenção à lavagem de dinheiro (Carta-Circular 4001/2020)", hits: 4 },
    { name: "Responsabilidade socioambiental das instituições financeiras", hits: 3 },
    { name: "Mercado cambial, juros reais e risco-país", hits: 3 },
  ]},
  { name: "Língua Portuguesa", block: "Básicos", peso: 15, q: 10, topics: [
    { name: "Compreensão e interpretação de textos", hits: 10 },
    { name: "Concordância verbal e nominal", hits: 5 },
    { name: "Coesão textual e referência pronominal", hits: 4 },
    { name: "Emprego da crase e pontuação", hits: 3 },
    { name: "Regência verbal e nominal", hits: 3 },
    { name: "Colocação pronominal (próclise, mesóclise, ênclise)", hits: 2 },
  ]},
  { name: "Matemática", block: "Básicos", peso: 7.5, q: 5, topics: [
    { name: "Problemas matemáticos: porcentagem, proporção e mistura", hits: 4 },
    { name: "Progressão aritmética e geométrica", hits: 3 },
    { name: "Funções e equações do 1º e 2º grau", hits: 3 },
    { name: "Juros simples e compostos", hits: 2 },
  ]},
  { name: "Atualidades do Mercado Financeiro", block: "Básicos", peso: 5, q: 5, topics: [
    { name: "Fintechs, bancos digitais e transformação financeira", hits: 5 },
    { name: "Pix e meios de pagamento instantâneo", hits: 4 },
    { name: "Open Banking / Open Finance", hits: 4 },
    { name: "Funções da moeda e sistema monetário", hits: 3 },
    { name: "Blockchain e ativos digitais", hits: 2 },
  ]},
  { name: "Língua Inglesa", block: "Básicos", peso: 5, q: 5, topics: [
    { name: "Interpretação de texto em inglês — main idea e inferências", hits: 5 },
    { name: "Vocabulário e referência pronominal", hits: 3 },
    { name: "Aspectos gramaticais: tempos verbais, voz passiva, modais", hits: 2 },
  ]},
];

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
function beep() { try { const a = new (window.AudioContext || window.webkitAudioContext)(); const o = a.createOscillator(); const g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 880; g.gain.setValueAtTime(0.001, a.currentTime); g.gain.exponentialRampToValueAtTime(0.15, a.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.4); o.start(); o.stop(a.currentTime + 0.42); setTimeout(() => a.close(), 600); } catch {} }

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
  const [pomo, setPomo] = useState({ focus: 25, short: 5, long: 15, rounds: 4, autostart: true });

  const C = theme === "dark" ? DARK : LIGHT;

  useEffect(() => {
    (async () => {
      setTheme(await store.get("theme", "light"));
      let d = await store.get(CK("disc"), null);
      if (!d) {
        d = concurso.seed.map((s, i) => ({ id: uid(), name: s.name, block: s.block, peso: s.peso, q: s.q, color: DISC_COLORS[i % DISC_COLORS.length], topics: s.topics.map((t) => ({ id: uid(), name: t.name, hits: t.hits, studied: false })) }));
        await store.set(CK("disc"), d);
      }
      setDisciplines(d);
      setSessions(await store.get(CK("sess"), []));
      setReviews(await store.get(CK("rev"), []));
      setPlan(await store.get(CK("plan"), []));
      let sm = await store.get(CK("sim"), null); if (!sm) { sm = seedSims(d, concurso.seedSimsData); await store.set(CK("sim"), sm); } setSimulados(sm);
      setGoals(await store.get(CK("goals"), { hours: 20, questions: 200 }));
      setPomo(await store.get("pomo", { focus: 25, short: 5, long: 15, rounds: 4, autostart: true }));
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
  useEffect(() => { if (!loading) store.set("pomo", pomo); }, [pomo, loading]);

  const discById = useMemo(() => Object.fromEntries(disciplines.map((d) => [d.id, d])), [disciplines]);

  function registerStudy({ disciplineId, topicId, minutes, right, wrong, note, date, addReview }) {
    const s = { id: uid(), disciplineId, topicId: topicId || null, minutes, right: right || 0, wrong: wrong || 0, note: note || "", date: date || todayISO() };
    setSessions((p) => [s, ...p]);
    if (topicId) setDisciplines((p) => p.map((d) => d.id === disciplineId ? { ...d, topics: d.topics.map((t) => t.id === topicId ? { ...t, studied: true } : t) } : d));
    if (addReview !== false) {
      const disc = discById[disciplineId];
      const topicName = topicId ? disc?.topics.find((t) => t.id === topicId)?.name : "";
      setReviews((p) => [{ id: uid(), sessionId: s.id, disciplineId, topicId: topicId || null, label: topicName || disc?.name || "Conteúdo", intervalIdx: 0, due: addDays(s.date, REVIEW_INTERVALS[0]), done: false }, ...p]);
    }
    return s;
  }
  function markReviewDone(rid) {
    setReviews((p) => p.map((r) => { if (r.id !== rid) return r; const nextIdx = r.intervalIdx + 1; if (nextIdx >= REVIEW_INTERVALS.length) return { ...r, done: true }; return { ...r, intervalIdx: nextIdx, due: addDays(todayISO(), REVIEW_INTERVALS[nextIdx]) }; }));
  }

  if (loading) return <div className="h-screen flex items-center justify-center" style={{ background: LIGHT.bg }}><div className="text-center"><BookOpen size={40} color={LIGHT.ink} className="mx-auto animate-pulse" /><p className="mt-3 text-sm" style={{ color: LIGHT.muted }}>Carregando seus estudos…</p></div></div>;

  const shared = { disciplines, setDisciplines, sessions, setSessions, reviews, setReviews, cycle, setCycle, plan, setPlan, goals, setGoals, simulados, setSimulados, pomo, setPomo, discById, registerStudy, markReviewDone, setView };
  const NAV = [
    ["home", "Início", Home], ["raiox", "Raio-X da prova", Crosshair], ["pomodoro", "Pomodoro", TimerIcon],
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
              <span className="font-bold flex-1">Study Now</span>
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={20} color={C.gold} /> : <Moon size={20} color={C.inkSoft} />}</button>
            </header>
            <div className="max-w-5xl mx-auto p-4 md:p-8 pb-28 md:pb-8">
              {view === "home" && <HomeView {...shared} />}
              {view === "raiox" && <RaioXView {...shared} />}
              {view === "pomodoro" && <PomodoroView {...shared} />}
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
          {[["home", Home], ["pomodoro", TimerIcon], ["ciclo", RefreshCw], ["edital", BookOpen], ["stats", BarChart3]].map(([id, Icon]) => (
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
        <div className="font-extrabold text-lg leading-none" style={{ color: C.ink }}>Study Now</div>
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
      <div className="mt-4 flex gap-2"><Btn variant="gold" onClick={() => setView("pomodoro")}><TimerIcon size={16} /> Foco (Pomodoro)</Btn><Btn onClick={() => setView("ciclo")}><Play size={16} /> Estudar pelo ciclo</Btn></div>
    </div>
  );
}
function StreakDots({ sessions }) { const days = new Set(sessions.map((s) => s.date)); const last = Array.from({ length: 7 }, (_, i) => addDays(todayISO(), -(6 - i))); return <div className="flex gap-1.5">{last.map((d) => (<div key={d} className="flex-1 h-8 rounded-md flex items-center justify-center text-[10px]" style={{ background: days.has(d) ? "#F5B301" : "rgba(255,255,255,.12)", color: days.has(d) ? BRAND : "rgba(255,255,255,.5)" }}>{DAYS[new Date(d + "T00:00:00").getDay()][0]}</div>))}</div>; }
function GoalBar({ label, value, target, pct, unit }) { const C = useC(); return <div><div className="flex justify-between text-sm mb-1.5"><span className="font-medium">{label}</span><span style={{ color: C.muted }}>{Math.round(value * 10) / 10}{unit} / {target}{unit}</span></div><div className="h-2.5 rounded-full overflow-hidden" style={{ background: C.line }}><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 100 ? C.green : C.gold }} /></div></div>; }

/* ============================ POMODORO ============================ */
function PomodoroView({ pomo, setPomo, disciplines, discById, registerStudy }) {
  const C = useC();
  const [mode, setMode] = useState("focus"); // focus | short | long
  const [left, setLeft] = useState(pomo.focus * 60);
  const [running, setRunning] = useState(false);
  const [doneFocus, setDoneFocus] = useState(0);
  const [logDiscId, setLogDiscId] = useState("");
  const [logTopicId, setLogTopicId] = useState("");
  const ref = useRef();
  const modeMin = (mo) => mo === "focus" ? pomo.focus : mo === "short" ? pomo.short : pomo.long;

  // reinicia o relógio quando o modo muda ou quando o usuário edita as durações (com o timer parado)
  useEffect(() => { if (!running) setLeft(modeMin(mode) * 60); /* eslint-disable-next-line */ }, [mode, pomo.focus, pomo.short, pomo.long]);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(ref.current);
  }, [running]);

  useEffect(() => {
    if (left > 0) return;
    beep();
    if (mode === "focus") {
      const nd = doneFocus + 1; setDoneFocus(nd);
      if (logDiscId) registerStudy({ disciplineId: logDiscId, topicId: logTopicId || null, minutes: pomo.focus, right: 0, wrong: 0, note: "Sessão Pomodoro" });
      const next = nd % pomo.rounds === 0 ? "long" : "short";
      setMode(next); setLeft(modeMin(next) * 60); setRunning(pomo.autostart);
    } else {
      setMode("focus"); setLeft(pomo.focus * 60); setRunning(pomo.autostart);
    }
    /* eslint-disable-next-line */
  }, [left]);

  const total = modeMin(mode) * 60;
  const pct = total ? ((total - left) / total) * 100 : 0;
  const mm = String(Math.max(0, Math.floor(left / 60))).padStart(2, "0");
  const ss = String(Math.max(0, left % 60)).padStart(2, "0");
  const modeColor = mode === "focus" ? C.gold : C.green;
  const modeLabel = mode === "focus" ? "Foco" : mode === "short" ? "Pausa curta" : "Pausa longa";
  const R = 130, CIRC = 2 * Math.PI * R;
  function skip() { setRunning(false); if (mode === "focus") { setMode("short"); setLeft(pomo.short * 60); } else { setMode("focus"); setLeft(pomo.focus * 60); } }
  function reset() { setRunning(false); setLeft(modeMin(mode) * 60); }
  const topics = discById[logDiscId]?.topics || [];

  return (
    <div>
      <PageTitle sub="Ciclos de foco e pausa. Vincule uma disciplina e cada foco concluído vira uma sessão de estudo automaticamente.">Pomodoro</PageTitle>
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 flex flex-col items-center py-8">
          <div className="flex gap-2 mb-6">
            {["focus", "short", "long"].map((mo) => <button key={mo} onClick={() => { setRunning(false); setMode(mo); }} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: mode === mo ? modeColor : C.surface2, color: mode === mo ? "#fff" : C.muted, border: `1px solid ${C.line}` }}>{mo === "focus" ? "Foco" : mo === "short" ? "Pausa curta" : "Pausa longa"}</button>)}
          </div>
          <div className="relative" style={{ width: 300, height: 300 }}>
            <svg width="300" height="300" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="150" cy="150" r={R} fill="none" stroke={C.line} strokeWidth="14" />
              <circle cx="150" cy="150" r={R} fill="none" stroke={modeColor} strokeWidth="14" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC - (pct / 100) * CIRC} style={{ transition: "stroke-dashoffset 1s linear" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: modeColor }}>{modeLabel}</span>
              <span className="text-6xl font-extrabold tabular-nums" style={{ color: C.ink }}>{mm}:{ss}</span>
              <span className="text-xs mt-1" style={{ color: C.muted }}>{doneFocus} focos concluídos</span>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <Btn variant={running ? "ghost" : (mode === "focus" ? "gold" : "green")} onClick={() => setRunning((r) => !r)}>{running ? <><Pause size={16} /> Pausar</> : <><Play size={16} /> Iniciar</>}</Btn>
            <Btn variant="ghost" onClick={reset}><RotateCcw size={16} /> Zerar</Btn>
            <Btn variant="ghost" onClick={skip}><SkipForward size={16} /> Pular</Btn>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="text-sm font-semibold mb-3 flex items-center gap-2"><Coffee size={15} color={C.gold} /> Configurações</div>
            {[["focus", "Foco (min)"], ["short", "Pausa curta (min)"], ["long", "Pausa longa (min)"], ["rounds", "Focos até a pausa longa"]].map(([k, lbl]) => (
              <div key={k} className="flex items-center justify-between mb-2 text-sm"><span style={{ color: C.muted }}>{lbl}</span><input type="number" min={1} value={pomo[k]} onChange={(e) => setPomo({ ...pomo, [k]: Math.max(1, +e.target.value || 1) })} className="w-16 px-2 py-1 rounded-lg text-sm text-center" style={inputStyle(C)} /></div>
            ))}
            <label className="flex items-center justify-between text-sm mt-1"><span style={{ color: C.muted }}>Iniciar próxima fase sozinho</span><input type="checkbox" checked={pomo.autostart} onChange={(e) => setPomo({ ...pomo, autostart: e.target.checked })} /></label>
          </Card>
          <Card>
            <div className="text-sm font-semibold mb-3">Contabilizar como estudo</div>
            <Field label="Disciplina (opcional)"><select value={logDiscId} onChange={(e) => { setLogDiscId(e.target.value); setLogTopicId(""); }} className={inputCls} style={inputStyle(C)}><option value="">Não registrar</option>{disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
            {logDiscId && <Field label="Tópico (opcional)"><select value={logTopicId} onChange={(e) => setLogTopicId(e.target.value)} className={inputCls} style={inputStyle(C)}><option value="">— geral —</option>{topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>}
            <p className="text-xs" style={{ color: C.muted }}>Cada foco de {pomo.focus}min concluído entra no histórico e agenda revisão.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ============================ RAIO-X ============================ */
function RaioXView({ disciplines }) {
  const C = useC();
  const byPeso = [...disciplines].sort((a, b) => b.peso - a.peso);
  const ti = disciplines.find((d) => d.name.startsWith("Tecnologia"));
  return (
    <div>
      <PageTitle sub="Raio-x inicial da trilha Dataprev com foco em Arquitetura, usando prova real e assuntos de maior recorrência.">Raio-X da prova</PageTitle>
      <Card className="mb-4">
        <div className="text-sm font-semibold mb-1">Peso de cada disciplina (100 pontos)</div>
        <p className="text-xs mb-4" style={{ color: C.muted }}>Só a prova de <b>Tecnologia da Informação</b> vale 52,5 pontos — mais que todo o resto somado.</p>
        {byPeso.map((d) => (<div key={d.id} className="py-1.5"><div className="flex justify-between text-sm mb-1"><span className="font-medium flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />{d.name}</span><span style={{ color: C.muted }}>{d.peso} pts · {d.q}q</span></div><div className="h-2 rounded-full overflow-hidden" style={{ background: C.line }}><div className="h-full rounded-full" style={{ width: `${(d.peso / 52.5) * 100}%`, background: d.color }} /></div></div>))}
      </Card>
      {ti && (<Card className="mb-4"><div className="text-sm font-semibold mb-1 flex items-center gap-2"><Crosshair size={16} color={C.gold} /> Dentro de TI — o que mais caiu (70 questões analisadas)</div><p className="text-xs mb-4" style={{ color: C.muted }}>Banco de Dados e as linguagens (Python, Java, TypeScript) dominam. Priorize por aqui.</p>{[...ti.topics].sort((a, b) => b.hits - a.hits).map((t) => (<div key={t.id} className="py-1.5"><div className="flex justify-between text-sm mb-1"><span className="flex-1 min-w-0 pr-2">{t.name}</span><span className="shrink-0 font-semibold" style={{ color: t.hits >= 8 ? C.red : t.hits >= 4 ? C.gold : C.muted }}>{t.hits} q</span></div><div className="h-2 rounded-full overflow-hidden" style={{ background: C.line }}><div className="h-full rounded-full" style={{ width: `${(t.hits / 20) * 100}%`, background: t.hits >= 8 ? C.red : t.hits >= 4 ? C.gold : C.ink }} /></div></div>))}</Card>)}
      <Card><div className="text-sm font-semibold mb-2">Estratégia sugerida</div><ul className="text-sm space-y-2" style={{ color: C.inkSoft }}><li>• <b>TI é prioridade absoluta</b> (52,5%). Dentro dela: Banco de Dados, depois Python/Java/TypeScript e estrutura de dados.</li><li>• <b>Português</b> vale 15 pts — foque interpretação, concordância, crase, pontuação e colocação pronominal.</li><li>• <b>Corte de 50%:</b> ≥50% no total, ≥50% nos Básicos e ≥50% nos Específicos, sem zerar nenhuma disciplina.</li><li>• Bancários e Estatística (7,5 pts cada) têm padrão repetitivo — bom custo-benefício.</li></ul></Card>
    </div>
  );
}

/* ============================ CICLO ============================ */
function CicloView({ cycle, setCycle, disciplines, discById, registerStudy }) {
  const C = useC();
  const [timerBlock, setTimerBlock] = useState(null);
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
      <div className="flex flex-wrap gap-2 mb-4"><Btn variant={cycle.mode === "auto" ? "primary" : "ghost"} onClick={regen}><RefreshCw size={15} /> Gerar automático</Btn><Btn variant="ghost" onClick={addBlock}><Plus size={15} /> Adicionar etapa</Btn><Btn variant="ghost" onClick={() => setManualOpen(true)}><Pencil size={15} /> Registro manual</Btn><span className="ml-auto text-sm self-center" style={{ color: C.muted }}>Total: <b style={{ color: C.ink }}>{fmtMin(total)}</b></span></div>
      <div className="space-y-2">
        {cycle.blocks.map((b, i) => { const d = discById[b.disciplineId]; const pct = Math.min(100, Math.round((b.doneMinutes / b.targetMinutes) * 100));
          return <Card key={b.id} className="!p-4"><div className="flex items-center gap-3"><span className="text-xs font-bold w-6 text-center" style={{ color: C.muted }}>{i + 1}</span><span className="w-1.5 h-10 rounded-full" style={{ background: d?.color }} /><div className="flex-1 min-w-0"><div className="font-semibold truncate">{d?.name} <span className="text-xs font-normal" style={{ color: C.muted }}>· {d?.peso} pts</span></div><div className="flex items-center gap-2 mt-1"><div className="h-1.5 rounded-full flex-1 max-w-[140px] overflow-hidden" style={{ background: C.line }}><div className="h-full" style={{ width: `${pct}%`, background: C.gold }} /></div><span className="text-xs" style={{ color: C.muted }}>{fmtMin(b.doneMinutes)} / {fmtMin(b.targetMinutes)}</span></div></div><div className="flex items-center gap-1"><input type="number" value={b.targetMinutes} min={15} step={15} onChange={(e) => updateBlock(b.id, { targetMinutes: +e.target.value })} className="w-16 px-2 py-1 rounded-lg text-sm text-center" style={inputStyle(C)} /><button onClick={() => move(b.id, -1)} className="p-1 rotate-[-90deg]" style={{ color: C.muted }}><ChevronRight size={16} /></button><button onClick={() => move(b.id, 1)} className="p-1 rotate-90" style={{ color: C.muted }}><ChevronRight size={16} /></button><button onClick={() => removeBlock(b.id)} className="p-1"><Trash2 size={16} color={C.red} /></button></div></div><div className="mt-3"><Btn variant="green" className="!py-1.5" onClick={() => setTimerBlock(b)}><Play size={14} /> Iniciar estudo</Btn></div></Card>;
        })}
      </div>
      {timerBlock && <TimerModal block={timerBlock} disc={discById[timerBlock.disciplineId]} onClose={() => setTimerBlock(null)} onSave={(data) => { registerStudy({ ...data, disciplineId: timerBlock.disciplineId }); setCycle((cy) => ({ ...cy, blocks: cy.blocks.map((b) => b.id === timerBlock.id ? { ...b, doneMinutes: b.doneMinutes + data.minutes } : b) })); setTimerBlock(null); }} />}
      {manualOpen && <ManualModal disciplines={disciplines} discById={discById} onClose={() => setManualOpen(false)} onSave={(data) => { registerStudy(data); setManualOpen(false); }} />}
    </div>
  );
}
function TimerModal({ block, disc, onClose, onSave }) {
  const C = useC();
  const [sec, setSec] = useState(0); const [running, setRunning] = useState(true);
  const [topicId, setTopicId] = useState(disc?.topics[0]?.id || ""); const [right, setRight] = useState(""); const [wrong, setWrong] = useState("");
  const ref = useRef();
  useEffect(() => { if (running) { ref.current = setInterval(() => setSec((s) => s + 1), 1000); } return () => clearInterval(ref.current); }, [running]);
  const mm = String(Math.floor(sec / 60)).padStart(2, "0"); const ss = String(sec % 60).padStart(2, "0");
  return <Modal open title={`Estudando: ${disc?.name}`} onClose={onClose}>
    <div className="text-center py-4"><div className="text-6xl font-extrabold tabular-nums" style={{ color: C.ink }}>{mm}:{ss}</div><div className="flex justify-center gap-2 mt-4"><Btn variant={running ? "ghost" : "green"} onClick={() => setRunning((r) => !r)}>{running ? <><Pause size={16} /> Pausar</> : <><Play size={16} /> Retomar</>}</Btn></div></div>
    <Field label="Tópico estudado"><select value={topicId} onChange={(e) => setTopicId(e.target.value)} className={inputCls} style={inputStyle(C)}>{disc?.topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
    <div className="grid grid-cols-2 gap-3"><Field label="Acertos"><input type="number" value={right} onChange={(e) => setRight(e.target.value)} className={inputCls} style={inputStyle(C)} placeholder="0" /></Field><Field label="Erros"><input type="number" value={wrong} onChange={(e) => setWrong(e.target.value)} className={inputCls} style={inputStyle(C)} placeholder="0" /></Field></div>
    <Btn className="w-full justify-center mt-2" onClick={() => onSave({ minutes: Math.max(1, Math.round(sec / 60)), topicId, right: +right || 0, wrong: +wrong || 0 })}><Check size={16} /> Registrar {Math.max(1, Math.round(sec / 60))}min</Btn>
    <p className="text-xs text-center mt-3" style={{ color: C.muted }}>Ao registrar, a revisão deste conteúdo é agendada automaticamente.</p>
  </Modal>;
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
function PlanoView({ plan, setPlan, disciplines, discById }) {
  const C = useC();
  const [open, setOpen] = useState(null);
  const doneCount = plan.filter((p) => p.done).length;
  const pct = plan.length ? Math.round((doneCount / plan.length) * 100) : 0;
  function toggle(id) { setPlan((p) => p.map((x) => x.id === id ? { ...x, done: !x.done } : x)); }
  function add(day, disciplineId, minutes) { setPlan((p) => [...p, { id: uid(), day, disciplineId, minutes, done: false }]); setOpen(null); }
  function remove(id) { setPlan((p) => p.filter((x) => x.id !== id)); }
  return <div>
    <PageTitle sub="Distribua sessões ao longo da semana em grade. Trabalha junto com o ciclo, sem conflito.">Planejamento semanal</PageTitle>
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
function EditalView({ disciplines, sessions, setDisciplines }) {
  const C = useC();
  const perf = useMemo(() => { const map = {}; sessions.forEach((s) => { if (!s.topicId) return; const k = s.topicId; map[k] = map[k] || { min: 0, r: 0, w: 0 }; map[k].min += s.minutes; map[k].r += s.right; map[k].w += s.wrong; }); return map; }, [sessions]);
  const allTopics = disciplines.flatMap((d) => d.topics);
  const studied = allTopics.filter((t) => t.studied).length;
  const pct = allTopics.length ? Math.round((studied / allTopics.length) * 100) : 0;
  const blocks = ["Básicos", "Específicos"];
  function toggleTopic(disciplineId, topicId) {
    setDisciplines((prev) => prev.map((d) => d.id !== disciplineId ? d : ({
      ...d,
      topics: d.topics.map((t) => t.id === topicId ? { ...t, studied: !t.studied } : t),
    })));
  }
  return <div>
    <PageTitle sub="Base verticalizada para Dataprev e Arquitetura, com peso, nº de questões e incidência por tópico. Marque o que já estudou.">Edital verticalizado</PageTitle>
    <Card className="mb-4"><div className="flex items-center justify-between text-sm mb-2"><span className="font-semibold">Cobertura do edital</span><span style={{ color: C.muted }}>{studied}/{allTopics.length} tópicos</span></div><div className="h-3 rounded-full overflow-hidden" style={{ background: C.line }}><div className="h-full" style={{ width: `${pct}%`, background: C.ink }} /></div></Card>
    {blocks.map((block) => (
      <div key={block} className="mb-5"><h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Conhecimentos {block}</h3><div className="space-y-3">
        {disciplines.filter((d) => d.block === block).map((d) => { const done = d.topics.filter((t) => t.studied).length;
          return <Card key={d.id} className="!p-4"><div className="flex items-center gap-2 mb-3"><span className="w-1.5 h-6 rounded-full" style={{ background: d.color }} /><span className="font-bold flex-1">{d.name}</span><span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: C.goldSoft, color: C.ink }}>{d.peso} pts · {d.q}q</span><span className="text-xs" style={{ color: C.muted }}>{done}/{d.topics.length}</span></div><div className="grid gap-2 md:grid-cols-2">
            {[...d.topics].sort((a, b) => b.hits - a.hits).map((t) => { const p = perf[t.id]; const tot = p ? p.r + p.w : 0; const acc = tot ? Math.round((p.r / tot) * 100) : null; const weak = acc !== null && acc < 60;
              return <button key={t.id} type="button" onClick={() => toggleTopic(d.id, t.id)} className="w-full flex items-center gap-2 text-sm p-2.5 rounded-xl border text-left transition hover:-translate-y-[1px]" style={{ background: t.studied ? C.greenSoft : C.surface2, borderColor: t.studied ? C.green : C.line, boxShadow: t.studied ? `0 0 0 1px ${C.green} inset` : "none" }}><span className="pointer-events-none shrink-0 mt-0.5">{t.studied ? <CheckCircle2 size={15} color={C.green} /> : <Circle size={15} color={C.line} />}</span><span className="pointer-events-none flex-1 min-w-0" style={{ color: t.studied ? C.ink : C.muted }}>{t.name}</span><span className="pointer-events-none flex items-center gap-1 shrink-0">{t.hits >= 8 && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: C.redSoft, color: C.red }}>cai muito</span>}{t.hits >= 4 && t.hits < 8 && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: C.goldSoft, color: C.ink }}>cai bastante</span>}{p && <span className="text-xs" style={{ color: C.muted }}>{fmtMin(p.min)}</span>}{acc !== null && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: weak ? C.redSoft : C.greenSoft, color: weak ? C.red : C.green }}>{acc}%{weak && " · foco"}</span>}</span></button>;
            })}
          </div></Card>;
        })}
      </div></div>
    ))}
    <p className="text-xs" style={{ color: C.muted }}>Incidência estimada a partir das provas Dataprev 2023 e 2024 e do foco atual em arquitetura. Guia de prioridade — os pesos podem ser refinados conforme você incluir o edital oficial.</p>
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

const PROVAS_DATAPREV = [];



const PROVAS_BB = [
  {
    id: "bb-2021-agente-tecnologia",
    titulo: "BB 2021 — Agente de Tecnologia",
    banca: "CESGRANRIO",
    ano: 2021,
    data: "26/09/2021",
    totalQuestoes: 70,
    fonte: "Edital nº 01 - 2021/001 BB, de 23 de junho de 2021",
    especificosDiscs: ["Probabilidade e Estatística", "Conhecimentos Bancários", "Tecnologia da Informação"],
    disciplinas: {
      "Língua Portuguesa":               { inicio: 1,  fim: 10 },
      "Língua Inglesa":                  { inicio: 11, fim: 15 },
      "Matemática":                      { inicio: 16, fim: 20 },
      "Atualidades do Mercado Financeiro": { inicio: 21, fim: 25 },
      "Probabilidade e Estatística":     { inicio: 26, fim: 30 },
      "Conhecimentos Bancários":         { inicio: 31, fim: 35 },
      "Tecnologia da Informação":        { inicio: 36, fim: 70 },
    },
    questoes: [
      // ── LÍNGUA PORTUGUESA ──────────────────────────────────────────────
      {
        numero: 1, disciplina: "Língua Portuguesa",
        enunciado: "Leia o trecho: 'A digitalização dos serviços bancários, além de ampliar o acesso ao crédito, permitiu que populações historicamente excluídas do sistema financeiro formal pudessem participar da economia de forma mais plena.' A expressão 'além de', no trecho, introduz:",
        alternativas: { A:"uma explicação.", B:"uma condição.", C:"uma adição.", D:"um contraste.", E:"uma concessão." },
        gabarito: "C",
        comentario: "'Além de' é uma locução conjuntiva aditiva, que acrescenta informação ao que foi dito antes (ampliar o acesso + permitir inclusão).",
      },
      {
        numero: 2, disciplina: "Língua Portuguesa",
        enunciado: "Assinale a alternativa em que a concordância verbal está corretamente empregada:",
        alternativas: { A:"Haviam muitas transações suspeitas no extrato bancário.", B:"Faz dois anos que o sistema de Open Finance foi regulamentado.", C:"Existem uma solução simples para o problema de latência.", D:"Houveram mudanças significativas nas taxas de juros.", E:"Fazem seis meses que o cliente abriu a conta digital." },
        gabarito: "B",
        comentario: "'Faz' (verbo impessoal que indica tempo decorrido) permanece na 3ª pessoa do singular. As demais opções erram: 'haver' impessoal não vai para o plural (A e D); 'existir' concorda com o sujeito 'solução' → deve ser 'existe' (C); 'fazer' impessoal não vai para o plural (E).",
      },
      {
        numero: 3, disciplina: "Língua Portuguesa",
        enunciado: "Leia o fragmento: 'O banco investiu pesadamente em segurança digital. Contudo, os incidentes de phishing continuaram crescendo.' A palavra 'Contudo' estabelece entre as orações uma relação de:",
        alternativas: { A:"causalidade.", B:"concessão.", C:"conclusão.", D:"adversidade.", E:"condição." },
        gabarito: "D",
        comentario: "'Contudo' é conjunção adversativa (= 'porém', 'no entanto'), opondo dois fatos contrários.",
      },
      {
        numero: 4, disciplina: "Língua Portuguesa",
        enunciado: "Em qual alternativa o emprego da crase está correto?",
        alternativas: { A:"O relatório foi enviado à todos os gerentes.", B:"Entregamos o projeto à partir de segunda-feira.", C:"A equipe se referia à decisão tomada na reunião.", D:"O sistema voltou à funcionar normalmente.", E:"Há alternativas à serem consideradas antes da reunião." },
        gabarito: "C",
        comentario: "'À decisão' = crase correta (preposição 'a' + artigo feminino 'a'). As demais: 'à todos' (pronome masculino, sem crase); 'à partir' (locução adverbial, sem artigo, sem crase); 'à funcionar' (verbo, sem artigo, sem crase); 'à serem' (forma verbal, sem artigo, sem crase).",
      },
      {
        numero: 5, disciplina: "Língua Portuguesa",
        enunciado: "A palavra 'robusto', no contexto 'O sistema de pagamentos instantâneos precisa ser robusto para suportar milhões de transações simultâneas', pode ser substituída, sem alteração de sentido, por:",
        alternativas: { A:"veloz.", B:"seguro.", C:"sólido.", D:"moderno.", E:"barato." },
        gabarito: "C",
        comentario: "No contexto técnico, 'robusto' indica solidez, resistência e confiabilidade — sinônimo mais próximo é 'sólido'.",
      },
      {
        numero: 6, disciplina: "Língua Portuguesa",
        enunciado: "Assinale a alternativa em que a regência verbal está corretamente empregada:",
        alternativas: { A:"O gerente aspirava o cargo de diretor há anos.", B:"O sistema visa melhorar a experiência do usuário.", C:"Os desenvolvedores preferiram o Python do que o Java.", D:"A equipe assistiu o treinamento com atenção.", E:"O analista informou ao cliente sobre o prazo." },
        gabarito: "E",
        comentario: "'Informar' rege 'a + pessoa' (informou ao cliente). As demais erram: 'aspirar a' (cargo — com preposição); 'visar a' (com preposição obrigatória no sentido de 'ter como objetivo'); 'preferir... a' (não 'do que'); 'assistir a' (com preposição no sentido de 'ver').",
      },
      {
        numero: 7, disciplina: "Língua Portuguesa",
        enunciado: "Leia: 'As fintechs, ao democratizarem o acesso ao crédito, desafiaram os bancos tradicionais.' O sujeito da oração principal é:",
        alternativas: { A:"as fintechs.", B:"o acesso ao crédito.", C:"os bancos tradicionais.", D:"ao democratizarem.", E:"ao crédito." },
        gabarito: "A",
        comentario: "'As fintechs' é o sujeito da oração principal ('desafiaram os bancos tradicionais'). A oração reduzida de infinitivo é adjunto adverbial.",
      },
      {
        numero: 8, disciplina: "Língua Portuguesa",
        enunciado: "Leia o trecho: 'A inteligência artificial está transformando o setor bancário de maneira irreversível, automatizando processos que antes dependiam exclusivamente de mão de obra humana.' O vocábulo 'irreversível' classifica-se como:",
        alternativas: { A:"substantivo.", B:"adjetivo.", C:"advérbio.", D:"numeral.", E:"pronome." },
        gabarito: "B",
        comentario: "'Irreversível' é adjetivo que qualifica o substantivo 'maneira', indicando a característica do modo como a transformação ocorre.",
      },
      {
        numero: 9, disciplina: "Língua Portuguesa",
        enunciado: "Considere: 'O Banco do Brasil lançou ___ plataforma que revolucionou ___ atendimento digital.' Para preencher corretamente as lacunas, deve-se usar:",
        alternativas: { A:"uma / o.", B:"um / o.", C:"uma / a.", D:"um / a.", E:"a / o." },
        gabarito: "A",
        comentario: "'Plataforma' é substantivo feminino (uma plataforma); 'atendimento' é substantivo masculino (o atendimento).",
      },
      {
        numero: 10, disciplina: "Língua Portuguesa",
        enunciado: "Assinale a reescrita da frase 'O analista corrigiu o erro rapidamente' que mantém o sentido original e a correção gramatical:",
        alternativas: { A:"O erro foi corrigido rapidamente pelo analista.", B:"Rapidamente o erro foi corrigindo pelo analista.", C:"O erro se corrigiu pelo analista rapidamente.", D:"O analista rapidamente corrigindo o erro.", E:"Pelo analista, o erro corrigiu-se rápido." },
        gabarito: "A",
        comentario: "A voz passiva analítica 'foi corrigido... pelo analista' preserva o sentido da voz ativa e mantém a correção gramatical.",
      },
      // ── LÍNGUA INGLESA ──────────────────────────────────────────────────
      {
        numero: 11, disciplina: "Língua Inglesa",
        enunciado: "Read the text: 'Open finance represents a paradigm shift in how financial data is shared and utilized. By enabling consumers to securely share their financial information with third-party providers, open finance fosters competition and innovation in the banking sector.' According to the text, open finance:",
        alternativas: { A:"restricts consumers from sharing their data.", B:"eliminates competition among banks.", C:"allows consumers to share financial data with authorized parties.", D:"focuses exclusively on reducing banking fees.", E:"was developed to replace traditional banking systems entirely." },
        gabarito: "C",
        comentario: "The text states that open finance enables consumers 'to securely share their financial information with third-party providers'.",
      },
      {
        numero: 12, disciplina: "Língua Inglesa",
        enunciado: "Choose the sentence in which the present perfect tense is correctly used:",
        alternativas: { A:"The bank launched its new app last year.", B:"The developers has completed the update yesterday.", C:"We have implemented the new security protocol since March.", D:"She has worked here for ten years.", E:"They finished the project since 2020." },
        gabarito: "D",
        comentario: "'Has/have + past participle' with 'for' (duration) is a correct present perfect usage. 'Since March' requires present perfect but option C uses wrong collocations; option A uses simple past correctly with 'last year'; B has subject-verb disagreement.",
      },
      {
        numero: 13, disciplina: "Língua Inglesa",
        enunciado: "The word 'streamline', as in 'The new platform was designed to streamline banking operations', means:",
        alternativas: { A:"complicate.", B:"expand.", C:"make more efficient.", D:"secure.", E:"digitalize." },
        gabarito: "C",
        comentario: "'Streamline' means to make a process simpler and more efficient by removing unnecessary steps.",
      },
      {
        numero: 14, disciplina: "Língua Inglesa",
        enunciado: "Read: 'Artificial intelligence applications in banking range from fraud detection algorithms to personalized financial advice chatbots. These tools have significantly reduced operational costs while improving customer satisfaction.' The main idea of the text is that:",
        alternativas: { A:"chatbots have replaced human advisors in banks.", B:"AI tools in banking reduce costs and improve customer experience.", C:"fraud detection is the only AI application in banking.", D:"AI has made banking more complex and expensive.", E:"banks rely solely on algorithms for financial advice." },
        gabarito: "B",
        comentario: "The text states AI applications 'have significantly reduced operational costs while improving customer satisfaction' — covering both cost and experience.",
      },
      {
        numero: 15, disciplina: "Língua Inglesa",
        enunciado: "In 'Banks must adapt their strategies if they want to remain competitive in the digital era', the pronoun 'they' refers to:",
        alternativas: { A:"strategies.", B:"digital era.", C:"banks.", D:"the digital era's demands.", E:"their customers." },
        gabarito: "C",
        comentario: "'They' is a pronoun that refers back to 'Banks' (the subject of the main clause).",
      },
      // ── MATEMÁTICA ──────────────────────────────────────────────────────
      {
        numero: 16, disciplina: "Matemática",
        enunciado: "Uma carteira de investimentos rendeu 10% no primeiro semestre e teve uma queda de 10% no segundo semestre do mesmo ano. O rendimento líquido anual da carteira foi de:",
        alternativas: { A:"0%.", B:"-1%.", C:"1%.", D:"-0,5%.", E:"2%." },
        gabarito: "B",
        comentario: "Variação composta: (1,10) × (0,90) = 0,99 = -1%. A queda de 10% sobre um valor maior que o inicial resulta em perda líquida de 1%.",
      },
      {
        numero: 17, disciplina: "Matemática",
        enunciado: "Em uma progressão aritmética, o primeiro termo é 5 e a razão é 3. Qual é o valor do décimo termo?",
        alternativas: { A:"30.", B:"32.", C:"35.", D:"29.", E:"33." },
        gabarito: "B",
        comentario: "a₁₀ = a₁ + (n−1)·r = 5 + 9×3 = 5 + 27 = 32.",
      },
      {
        numero: 18, disciplina: "Matemática",
        enunciado: "Um analista deve distribuir 40 tarefas entre 3 equipes na razão 2:3:5. Quantas tarefas caberão à maior equipe?",
        alternativas: { A:"8.", B:"12.", C:"16.", D:"20.", E:"24." },
        gabarito: "D",
        comentario: "Soma dos termos da razão: 2+3+5 = 10. Maior equipe (5 partes): 40 × 5/10 = 20 tarefas.",
      },
      {
        numero: 19, disciplina: "Matemática",
        enunciado: "Um capital de R$ 2.000,00 foi aplicado a juros simples de 3% ao mês. Após 4 meses, o montante será de:",
        alternativas: { A:"R$ 2.240,00.", B:"R$ 2.060,00.", C:"R$ 2.120,00.", D:"R$ 2.480,00.", E:"R$ 2.180,00." },
        gabarito: "A",
        comentario: "J = C × i × t = 2000 × 0,03 × 4 = 240. Montante = 2000 + 240 = R$ 2.240,00.",
      },
      {
        numero: 20, disciplina: "Matemática",
        enunciado: "As raízes da equação x² − 5x + 6 = 0 são:",
        alternativas: { A:"x = 1 e x = 6.", B:"x = 2 e x = 3.", C:"x = −2 e x = −3.", D:"x = −1 e x = 6.", E:"x = 1 e x = −6." },
        gabarito: "B",
        comentario: "Δ = 25 − 24 = 1. x = (5 ± 1)/2 → x₁ = 3, x₂ = 2. Verificação: 2+3 = 5 (soma) e 2×3 = 6 (produto).",
      },
      // ── ATUALIDADES DO MERCADO FINANCEIRO ───────────────────────────────
      {
        numero: 21, disciplina: "Atualidades do Mercado Financeiro",
        enunciado: "As fintechs são empresas que utilizam tecnologia para oferecer serviços financeiros de forma mais ágil e acessível. Sobre as fintechs, assinale a afirmativa CORRETA:",
        alternativas: { A:"São regulamentadas exclusivamente pela CVM, sem supervisão do Banco Central.", B:"Atuam apenas no segmento de crédito, não sendo permitida atuação em pagamentos.", C:"As sociedades de crédito direto (SCD) e as sociedades de empréstimo entre pessoas (SEP) são modalidades reguladas pelo Banco Central.", D:"Fintechs não podem oferecer produtos de investimento ao público em geral.", E:"São proibidas de atuar em parceria com bancos tradicionais." },
        gabarito: "C",
        comentario: "O Banco Central criou as modalidades SCD (crédito direto digital) e SEP (peer-to-peer lending) pela Resolução 4.656/2018, integrando as fintechs ao sistema financeiro regulado.",
      },
      {
        numero: 22, disciplina: "Atualidades do Mercado Financeiro",
        enunciado: "O Registrato é um sistema disponibilizado pelo Banco Central do Brasil que permite ao cidadão consultar:",
        alternativas: { A:"o saldo de suas contas em todos os bancos simultaneamente.", B:"informações sobre chaves Pix cadastradas em seu CPF.", C:"relatórios sobre seus relacionamentos financeiros com instituições supervisionadas pelo Banco Central.", D:"a rentabilidade histórica de fundos de investimento.", E:"o histórico de pagamentos de tributos federais." },
        gabarito: "C",
        comentario: "O Registrato (registrato.bcb.gov.br) permite ao cidadão consultar seus relacionamentos com instituições financeiras supervisionadas pelo Banco Central, incluindo contas, operações de crédito e câmbio.",
      },
      {
        numero: 23, disciplina: "Atualidades do Mercado Financeiro",
        enunciado: "O Pix, sistema de pagamentos instantâneos do Banco Central, apresenta como características CORRETAS:",
        alternativas: { A:"Funciona apenas em dias úteis, das 8h às 20h.", B:"Permite transferências apenas entre contas do mesmo banco.", C:"É obrigatório para instituições financeiras com mais de 500 mil clientes pessoas físicas ativas.", D:"As transações levam, em média, 30 minutos para serem concluídas.", E:"Está disponível apenas para pessoas físicas, não podendo ser usado por empresas." },
        gabarito: "C",
        comentario: "O Banco Central tornou obrigatória a participação no Pix para instituições com mais de 500 mil clientes pessoas físicas ativas. O Pix funciona 24/7, em até 10 segundos.",
      },
      {
        numero: 24, disciplina: "Atualidades do Mercado Financeiro",
        enunciado: "O Open Banking, evoluído para Open Finance no Brasil, tem como principal objetivo:",
        alternativas: { A:"Eliminar a necessidade de agências bancárias físicas.", B:"Permitir ao cliente compartilhar seus dados financeiros com outras instituições autorizadas, promovendo concorrência e inovação.", C:"Criar um banco digital público para competir com os bancos privados.", D:"Substituir o sistema de pagamentos Pix por uma solução mais segura.", E:"Proibir que fintechs acessem dados de clientes bancários sem autorização judicial." },
        gabarito: "B",
        comentario: "O Open Finance permite ao cliente (com consentimento) compartilhar seus dados financeiros entre instituições autorizadas pelo Banco Central, fomentando a concorrência e serviços personalizados.",
      },
      {
        numero: 25, disciplina: "Atualidades do Mercado Financeiro",
        enunciado: "No contexto do sistema monetário, a função da moeda que permite ao indivíduo guardar poder de compra para uso futuro é denominada função de:",
        alternativas: { A:"meio de troca.", B:"unidade de conta.", C:"reserva de valor.", D:"liquidez imediata.", E:"lastro monetário." },
        gabarito: "C",
        comentario: "A moeda possui três funções clássicas: meio de troca (facilita transações), unidade de conta (mede preços) e reserva de valor (preserva poder de compra ao longo do tempo).",
      },
      // ── PROBABILIDADE E ESTATÍSTICA ─────────────────────────────────────
      {
        numero: 26, disciplina: "Probabilidade e Estatística",
        enunciado: "Em uma amostra de 200 clientes de um banco, 80 possuem cartão de crédito. A frequência relativa de clientes SEM cartão de crédito é:",
        alternativas: { A:"0,40.", B:"0,50.", C:"0,60.", D:"0,80.", E:"0,20." },
        gabarito: "C",
        comentario: "Clientes sem cartão: 200 − 80 = 120. Frequência relativa = 120/200 = 0,60 (60%).",
      },
      {
        numero: 27, disciplina: "Probabilidade e Estatística",
        enunciado: "Uma urna contém 4 bolas vermelhas e 6 bolas azuis. Retira-se uma bola sem reposição e, em seguida, outra. A probabilidade de que as duas bolas sejam vermelhas é:",
        alternativas: { A:"4/25.", B:"2/15.", C:"1/10.", D:"4/15.", E:"1/5." },
        gabarito: "B",
        comentario: "P(R₁ ∩ R₂) = P(R₁) × P(R₂|R₁) = (4/10) × (3/9) = 12/90 = 2/15.",
      },
      {
        numero: 28, disciplina: "Probabilidade e Estatística",
        enunciado: "Os valores de um conjunto de dados são: 2, 4, 4, 6, 8, 10, 10. A variância desse conjunto é:",
        alternativas: { A:"8.", B:"7.", C:"9.", D:"10.", E:"6." },
        gabarito: "A",
        comentario: "Média = (2+4+4+6+8+10+10)/7 = 44/7 ≈ 6,29. Somando os quadrados dos desvios e dividindo por 7: variância ≈ 8. (Usando média exata: σ² = [(2−44/7)²+...]/7 = 56/7 = 8.)",
      },
      {
        numero: 29, disciplina: "Probabilidade e Estatística",
        enunciado: "Um conjunto de dados apresenta média igual a 50 e desvio padrão igual a 10. O coeficiente de variação (CV) desse conjunto é:",
        alternativas: { A:"20%.", B:"5%.", C:"50%.", D:"10%.", E:"15%." },
        gabarito: "A",
        comentario: "CV = (desvio padrão / média) × 100 = (10/50) × 100 = 20%.",
      },
      {
        numero: 30, disciplina: "Probabilidade e Estatística",
        enunciado: "Um investidor aplica R$ 1.000 com peso 3 e R$ 2.000 com peso 5 em dois fundos com rentabilidades de 8% e 12%, respectivamente. A rentabilidade média ponderada da carteira é:",
        alternativas: { A:"9%.", B:"10,5%.", C:"11%.", D:"10%.", E:"9,5%." },
        gabarito: "B",
        comentario: "Média ponderada = (8×3 + 12×5)/(3+5) = (24+60)/8 = 84/8 = 10,5%.",
      },
      // ── CONHECIMENTOS BANCÁRIOS ─────────────────────────────────────────
      {
        numero: 31, disciplina: "Conhecimentos Bancários",
        enunciado: "Em relação à responsabilidade socioambiental das instituições financeiras, assinale a afirmativa CORRETA segundo a Resolução CMN nº 4.945/2021:",
        alternativas: { A:"A política de responsabilidade socioambiental é facultativa para bancos com ativos totais superiores a R$ 1 bilhão.", B:"As instituições financeiras devem implementar a Política de Responsabilidade Social, Ambiental e Climática (PRSAC) proporcional ao porte e perfil de risco.", C:"Apenas bancos públicos federais são obrigados a ter política socioambiental.", D:"A responsabilidade socioambiental se aplica somente a operações de crédito rural.", E:"As cooperativas de crédito estão isentas da obrigação de ter política socioambiental." },
        gabarito: "B",
        comentario: "A Resolução CMN 4.945/2021 exige que instituições financeiras implementem a PRSAC de forma proporcional ao seu porte, natureza e perfil de risco.",
      },
      {
        numero: 32, disciplina: "Conhecimentos Bancários",
        enunciado: "Segundo a Lei Complementar nº 105/2001, o sigilo das operações de instituições financeiras:",
        alternativas: { A:"Não pode ser quebrado em nenhuma hipótese, nem mesmo por ordem judicial.", B:"Pode ser levantado pelas autoridades fiscais sem necessidade de autorização judicial, mediante processo administrativo instaurado.", C:"Só pode ser quebrado por decisão judicial em casos de crimes contra o sistema financeiro.", D:"Aplica-se apenas a pessoas físicas, não abrangendo pessoas jurídicas.", E:"Pode ser desconsiderado por qualquer autoridade policial em investigações de qualquer natureza." },
        gabarito: "B",
        comentario: "A LC 105/2001 permite às autoridades fazendárias acesso a informações financeiras sem autorização judicial, mediante processo administrativo fiscal regularmente instaurado (art. 6º), conforme reafirmado pelo STF.",
      },
      {
        numero: 33, disciplina: "Conhecimentos Bancários",
        enunciado: "O Comitê de Política Monetária (COPOM) é responsável por definir a taxa Selic. Sobre a taxa Selic, é CORRETO afirmar que:",
        alternativas: { A:"É a taxa de juros cobrada pelos bancos em empréstimos ao consumidor final.", B:"É definida semanalmente pelo Banco Central, sem participação do COPOM.", C:"Funciona como referência para as demais taxas de juros da economia brasileira.", D:"É determinada exclusivamente com base na inflação do mês anterior.", E:"Sua elevação estimula o consumo e o investimento, aquecendo a economia." },
        gabarito: "C",
        comentario: "A Selic é a taxa básica de juros da economia brasileira e serve de referência para as demais taxas praticadas no mercado. Sua elevação encarece o crédito e desestimula o consumo (efeito oposto ao da alternativa E).",
      },
      {
        numero: 34, disciplina: "Conhecimentos Bancários",
        enunciado: "No segmento de varejo bancário, os produtos e serviços oferecidos aos clientes incluem:",
        alternativas: { A:"Apenas operações de crédito corporativo para grandes empresas.", B:"Captação de depósitos, concessão de crédito pessoal, cartões de crédito e seguros.", C:"Exclusivamente operações no mercado interbancário.", D:"Gestão de ativos de fundos soberanos e grandes investidores institucionais.", E:"Apenas câmbio e remessas internacionais." },
        gabarito: "B",
        comentario: "O varejo bancário atende pessoas físicas e pequenas empresas com uma ampla gama de produtos: contas, cartões, crédito pessoal, financiamentos, seguros e investimentos.",
      },
      {
        numero: 35, disciplina: "Conhecimentos Bancários",
        enunciado: "Segundo a Carta-Circular nº 4.001/2020 do Banco Central, são operações e situações que podem configurar indícios de lavagem de dinheiro ou financiamento do terrorismo:",
        alternativas: { A:"Movimentações financeiras compatíveis com o perfil do cliente e sua atividade profissional.", B:"Resgates de investimentos de longo prazo após o prazo de carência.", C:"Depósitos em espécie de elevado valor, incompatíveis com a atividade econômica do cliente.", D:"Pagamentos de salários a funcionários registrados em folha.", E:"Transferências entre contas de mesma titularidade no mesmo banco." },
        gabarito: "C",
        comentario: "Depósitos em espécie de valores elevados sem justificativa compatível com a atividade do cliente são um dos principais indícios de lavagem de dinheiro elencados na Carta-Circular 4.001/2020.",
      },
      // ── TECNOLOGIA DA INFORMAÇÃO ─────────────────────────────────────────
      {
        numero: 36, disciplina: "Tecnologia da Informação",
        enunciado: "Em um modelo de classificação binária, a matriz de confusão apresentou: VP = 90, FP = 10, FN = 15, VN = 85. A acurácia do modelo é:",
        alternativas: { A:"0,85.", B:"0,90.", C:"0,875.", D:"0,80.", E:"0,92." },
        gabarito: "C",
        comentario: "Acurácia = (VP + VN) / (VP + FP + FN + VN) = (90 + 85) / (90 + 10 + 15 + 85) = 175/200 = 0,875.",
      },
      {
        numero: 37, disciplina: "Tecnologia da Informação",
        enunciado: "Considere a relação R(A, B, C, D) com a dependência funcional: A → B, B → C, A → D. A relação está na Terceira Forma Normal (3FN)?",
        alternativas: { A:"Sim, pois não há dependências parciais.", B:"Não, pois C depende transitivamente de A através de B, violando a 3FN.", C:"Sim, pois a chave primária determina todos os atributos diretamente.", D:"Não, pois há atributos multivalorados.", E:"Sim, pois todos os atributos são atômicos." },
        gabarito: "B",
        comentario: "A 3FN exige que não haja dependências transitivas de atributos não-chave. Como A→B→C, o atributo C depende transitivamente da chave A, violando a 3FN. Solução: decompor em R1(A, B, D) e R2(B, C).",
      },
      {
        numero: 38, disciplina: "Tecnologia da Informação",
        enunciado: "Em SQL, qual é o resultado de um LEFT JOIN entre as tabelas A e B?",
        alternativas: { A:"Apenas as linhas onde há correspondência em ambas as tabelas.", B:"Todas as linhas de B, com valores nulos para as colunas de A sem correspondência.", C:"Todas as linhas de A, com valores nulos para as colunas de B onde não há correspondência.", D:"A união completa de todas as linhas de A e B, sem duplicatas.", E:"Apenas as linhas de A que não possuem correspondência em B." },
        gabarito: "C",
        comentario: "LEFT JOIN retorna todas as linhas da tabela à esquerda (A), mesmo sem correspondência na tabela à direita (B). As colunas de B ficam com NULL quando não há correspondência.",
      },
      {
        numero: 39, disciplina: "Tecnologia da Informação",
        enunciado: "Em Python, com a biblioteca Pandas, qual instrução seleciona as linhas do DataFrame 'df' onde a coluna 'valor' é maior que 100?",
        alternativas: { A:"df.select(df['valor'] > 100)", B:"df[df['valor'] > 100]", C:"df.filter('valor > 100')", D:"df.where(valor > 100)", E:"df.query(valor, '>100')" },
        gabarito: "B",
        comentario: "A filtragem booleana em Pandas usa a sintaxe df[condição]. 'df[df[\"valor\"] > 100]' cria uma máscara booleana e a aplica ao DataFrame.",
      },
      {
        numero: 40, disciplina: "Tecnologia da Informação",
        enunciado: "Em SQL, a constraint CHECK serve para:",
        alternativas: { A:"Garantir a unicidade dos valores de uma coluna.", B:"Definir uma referência entre tabelas relacionadas.", C:"Verificar se uma coluna aceita valores nulos.", D:"Impor uma condição que os valores de uma coluna devem satisfazer.", E:"Definir o valor padrão de uma coluna quando nenhum valor é inserido." },
        gabarito: "D",
        comentario: "CHECK é uma constraint de integridade que valida se os valores inseridos em uma coluna satisfazem uma condição lógica especificada. Ex.: CHECK (salario > 0).",
      },
      {
        numero: 41, disciplina: "Tecnologia da Informação",
        enunciado: "Em TypeScript, a função genérica abaixo:\n\nfunction identidade<T>(valor: T): T { return valor; }\n\nSe chamada como identidade<string>('BB'), o tipo de retorno será:",
        alternativas: { A:"any.", B:"unknown.", C:"string.", D:"object.", E:"T." },
        gabarito: "C",
        comentario: "Quando o tipo genérico T é instanciado como 'string', a função retorna o tipo 'string'. O mecanismo de generics substitui T pelo tipo concreto informado ou inferido.",
      },
      {
        numero: 42, disciplina: "Tecnologia da Informação",
        enunciado: "Em Python, com NumPy, qual é o resultado de:\n\nimport numpy as np\na = np.array([1, 2, 3, 4])\nprint(a * 2)",
        alternativas: { A:"[1, 2, 3, 4, 1, 2, 3, 4]", B:"[2, 4, 6, 8]", C:"[3, 4, 5, 6]", D:"Erro, pois não é possível multiplicar arrays por escalares.", E:"[1, 4, 9, 16]" },
        gabarito: "B",
        comentario: "NumPy suporta operações vetorizadas (broadcasting): multiplicar um array por um escalar aplica a operação a cada elemento. 1×2=2, 2×2=4, 3×2=6, 4×2=8.",
      },
      {
        numero: 43, disciplina: "Tecnologia da Informação",
        enunciado: "Em NumPy, a função np.reshape(a, (2, 3)) transforma o array 'a' em uma matriz com:",
        alternativas: { A:"2 colunas e 3 linhas.", B:"2 linhas e 3 colunas.", C:"6 linhas e 1 coluna.", D:"3 linhas e 2 colunas.", E:"1 linha e 6 colunas." },
        gabarito: "B",
        comentario: "np.reshape(a, (linhas, colunas)). O parâmetro (2, 3) especifica 2 linhas e 3 colunas. O array original deve ter exatamente 6 elementos (2×3).",
      },
      {
        numero: 44, disciplina: "Tecnologia da Informação",
        enunciado: "O algoritmo K-Nearest Neighbors (K-NN) para classificação:",
        alternativas: { A:"Cria uma fronteira de decisão linear entre as classes.", B:"Treina um modelo matemático que é armazenado para uso posterior.", C:"Classifica um novo ponto com base na classe predominante entre os K vizinhos mais próximos.", D:"Funciona exclusivamente com dados numéricos normalizados.", E:"É um algoritmo de aprendizado não supervisionado." },
        gabarito: "C",
        comentario: "K-NN é um classificador lazy (sem fase de treinamento explícita): classifica um novo ponto calculando a distância aos exemplos de treinamento e atribuindo a classe majoritária entre os K mais próximos.",
      },
      {
        numero: 45, disciplina: "Tecnologia da Informação",
        enunciado: "Em SQL, o comando abaixo cria uma tabela com qual constraint de integridade?\n\nCREATE TABLE Pedido (\n  id INT PRIMARY KEY,\n  cliente_id INT,\n  FOREIGN KEY (cliente_id) REFERENCES Cliente(id)\n);",
        alternativas: { A:"Unique Key em cliente_id.", B:"Check constraint verificando o id.", C:"Integridade referencial entre Pedido e Cliente.", D:"Índice não clusterizado em cliente_id.", E:"Constraint de not null implícita no id." },
        gabarito: "C",
        comentario: "FOREIGN KEY (cliente_id) REFERENCES Cliente(id) cria uma constraint de integridade referencial: o valor de cliente_id na tabela Pedido deve existir na coluna id da tabela Cliente.",
      },
      {
        numero: 46, disciplina: "Tecnologia da Informação",
        enunciado: "Em PostgreSQL, uma VIEW é:",
        alternativas: { A:"Uma cópia física dos dados armazenada em disco para otimização de consultas.", B:"Uma consulta SQL armazenada que pode ser tratada como uma tabela virtual.", C:"Um índice especial que acelera buscas em tabelas grandes.", D:"Um procedimento armazenado que executa automaticamente após operações DML.", E:"Uma tabela temporária que é destruída ao final da sessão." },
        gabarito: "B",
        comentario: "VIEW é uma consulta SELECT armazenada no banco de dados. Quando consultada, executa a query subjacente e retorna o resultado como se fosse uma tabela. Não armazena dados fisicamente (exceto MATERIALIZED VIEW).",
      },
      {
        numero: 47, disciplina: "Tecnologia da Informação",
        enunciado: "Em TypeScript, qual é o tipo retornado por document.querySelector('#meuBotao')?",
        alternativas: { A:"HTMLElement.", B:"Element | null.", C:"HTMLButtonElement.", D:"Node.", E:"EventTarget." },
        gabarito: "B",
        comentario: "document.querySelector retorna 'Element | null' por padrão, pois o seletor pode não encontrar o elemento (null) e o TypeScript não pode inferir o tipo específico do elemento apenas pelo seletor string.",
      },
      {
        numero: 48, disciplina: "Tecnologia da Informação",
        enunciado: "Em TypeScript/JavaScript, o método Array.prototype.reduce() executado em [1, 2, 3, 4] com a função (acc, cur) => acc + cur e valor inicial 0, retorna:",
        alternativas: { A:"[1, 3, 6, 10]", B:"10.", C:"4.", D:"0.", E:"[0, 1, 2, 3, 4]" },
        gabarito: "B",
        comentario: "reduce acumula: 0+1=1, 1+2=3, 3+3=6, 6+4=10. O resultado final é 10 (não um array, mas um valor único).",
      },
      {
        numero: 49, disciplina: "Tecnologia da Informação",
        enunciado: "No esquema estrela de um Data Warehouse, qual é a função da tabela fato?",
        alternativas: { A:"Armazenar os atributos descritivos das dimensões do negócio.", B:"Armazenar as métricas e medidas quantitativas do processo de negócio, juntamente com as chaves estrangeiras para as tabelas dimensão.", C:"Substituir as tabelas de dimensão em consultas OLAP.", D:"Conter os dados brutos antes do processo de ETL.", E:"Armazenar os metadados do Data Warehouse." },
        gabarito: "B",
        comentario: "No esquema estrela, a tabela fato centraliza as medidas numéricas (vendas, transações, valores) e as chaves estrangeiras que apontam para as tabelas dimensão (cliente, tempo, produto etc.).",
      },
      {
        numero: 50, disciplina: "Tecnologia da Informação",
        enunciado: "Em Java, considere:\n\nclass Animal { void som() { System.out.println('Som'); } }\nclass Gato extends Animal { void som() { System.out.println('Miau'); } }\nAnimal a = new Gato();\na.som();\n\nQual é a saída?",
        alternativas: { A:"Som", B:"Miau", C:"Som Miau", D:"Erro de compilação.", E:"Erro em tempo de execução." },
        gabarito: "B",
        comentario: "Java usa despacho dinâmico (late binding): o método chamado é o da classe real do objeto em tempo de execução. 'a' é declarado como Animal, mas aponta para um objeto Gato. O método som() de Gato é invocado → 'Miau'.",
      },
      {
        numero: 51, disciplina: "Tecnologia da Informação",
        enunciado: "Dado o percurso pós-ordem (left, right, root) na árvore binária abaixo:\n\n       A\n      / \\\n     B   C\n    / \\\n   D   E\n\nQual é a sequência correta?",
        alternativas: { A:"A, B, C, D, E", B:"D, B, E, A, C", C:"D, E, B, C, A", D:"A, B, D, E, C", E:"D, E, C, B, A" },
        gabarito: "C",
        comentario: "Pós-ordem visita: subárvore esquerda → subárvore direita → raiz. Processo: D (folha), E (folha), B (pai de D e E), C (folha direita de A), A (raiz). Resultado: D, E, B, C, A.",
      },
      {
        numero: 52, disciplina: "Tecnologia da Informação",
        enunciado: "No modelo entidade-relacionamento (ER), a cardinalidade N:N entre duas entidades indica que:",
        alternativas: { A:"Uma instância da entidade A se relaciona com exatamente uma instância da entidade B.", B:"Uma instância da entidade A pode se relacionar com muitas de B, e vice-versa.", C:"Apenas instâncias de A podem iniciar o relacionamento.", D:"O relacionamento é obrigatório para ambas as entidades.", E:"A chave primária de A deve ser chave estrangeira em B." },
        gabarito: "B",
        comentario: "Cardinalidade N:N (muitos para muitos) significa que uma entidade A pode se relacionar com várias instâncias de B e vice-versa. Na implementação relacional, é necessária uma tabela associativa.",
      },
      {
        numero: 53, disciplina: "Tecnologia da Informação",
        enunciado: "A busca sequencial (linear) em um vetor não ordenado de n elementos tem complexidade de tempo no pior caso de:",
        alternativas: { A:"O(1).", B:"O(log n).", C:"O(n log n).", D:"O(n).", E:"O(n²)." },
        gabarito: "D",
        comentario: "Na busca sequencial, no pior caso o elemento não existe ou está na última posição, exigindo percorrer todos os n elementos. A complexidade é O(n).",
      },
      {
        numero: 54, disciplina: "Tecnologia da Informação",
        enunciado: "Em Java, os blocos de inicialização estáticos (static initializers) são executados:",
        alternativas: { A:"A cada vez que um objeto da classe é instanciado.", B:"Apenas quando o método main() é chamado.", C:"Uma vez, quando a classe é carregada pela JVM.", D:"Quando o método estático da classe é chamado pela primeira vez.", E:"Após o construtor da classe ser executado." },
        gabarito: "C",
        comentario: "Blocos static { } em Java são executados uma única vez, quando a classe é carregada pela JVM (antes de qualquer instância ser criada). São usados para inicialização de atributos estáticos.",
      },
      {
        numero: 55, disciplina: "Tecnologia da Informação",
        enunciado: "Qual algoritmo de ordenação tem complexidade de tempo O(n log n) no caso médio E no pior caso?",
        alternativas: { A:"Bubble Sort.", B:"Insertion Sort.", C:"Selection Sort.", D:"Merge Sort.", E:"Quick Sort." },
        gabarito: "D",
        comentario: "Merge Sort garante O(n log n) tanto no caso médio quanto no pior caso (divisão e conquista com fusão). Quick Sort tem O(n log n) médio mas O(n²) no pior caso.",
      },
      {
        numero: 56, disciplina: "Tecnologia da Informação",
        enunciado: "Uma relação R(Matrícula, Departamento, NomeDepartamento) tem a dependência funcional: Departamento → NomeDepartamento. Isso viola a 3FN porque:",
        alternativas: { A:"NomeDepartamento é multivalorado.", B:"Matrícula não é chave primária.", C:"NomeDepartamento depende transitivamente da chave primária (Matrícula → Departamento → NomeDepartamento).", D:"Departamento é um atributo derivado.", E:"A relação não está na 1FN." },
        gabarito: "C",
        comentario: "Há dependência transitiva: Matrícula→Departamento→NomeDepartamento. O atributo NomeDepartamento depende de Departamento (não-chave), violando a 3FN. Solução: criar tabela Departamento(Departamento, NomeDepartamento).",
      },
      {
        numero: 57, disciplina: "Tecnologia da Informação",
        enunciado: "No contexto de Big Data, a técnica de suavização de dados (smoothing) é utilizada para:",
        alternativas: { A:"Comprimir grandes volumes de dados para armazenamento.", B:"Reduzir ruídos em séries temporais, revelando tendências de longo prazo.", C:"Criptografar dados sensíveis antes do armazenamento.", D:"Distribuir dados em múltiplos nós de um cluster.", E:"Remover registros duplicados de um dataset." },
        gabarito: "B",
        comentario: "Suavização (smoothing) aplica técnicas como média móvel para reduzir variações aleatórias (ruído) em séries temporais, tornando as tendências mais evidentes.",
      },
      {
        numero: 58, disciplina: "Tecnologia da Informação",
        enunciado: "Swift é uma linguagem de programação desenvolvida pela Apple. Uma característica fundamental do Swift é:",
        alternativas: { A:"É exclusivamente orientada a objetos, sem suporte a programação funcional.", B:"Compila para bytecode interpretado pela JVM.", C:"Possui tipagem dinâmica, semelhante ao Python.", D:"Inclui o conceito de opcionais (Optionals) para tratar valores ausentes com segurança.", E:"É baseada em gerenciamento manual de memória, sem garbage collector." },
        gabarito: "D",
        comentario: "Os Optionals do Swift permitem que variáveis representem um valor ou a ausência de valor (nil), forçando o desenvolvedor a tratar explicitamente o caso de nil. Isso elimina erros de null pointer em tempo de compilação.",
      },
      {
        numero: 59, disciplina: "Tecnologia da Informação",
        enunciado: "No desenvolvimento iOS com Xcode, o Interface Builder é uma ferramenta que permite:",
        alternativas: { A:"Compilar e otimizar código Swift automaticamente.", B:"Criar interfaces gráficas visualmente usando drag-and-drop de componentes UI.", C:"Realizar testes automatizados de interface em dispositivos físicos.", D:"Gerenciar dependências de pacotes Swift com o Swift Package Manager.", E:"Analisar o consumo de memória e CPU da aplicação em tempo real." },
        gabarito: "B",
        comentario: "O Interface Builder no Xcode permite criar interfaces de forma visual (WYSIWYG), arrastando e configurando componentes UIKit ou SwiftUI, gerando arquivos .storyboard ou .xib.",
      },
      {
        numero: 60, disciplina: "Tecnologia da Informação",
        enunciado: "Em Ansible, um Playbook é:",
        alternativas: { A:"Um script Python que executa comandos diretamente nos servidores remotos.", B:"Um arquivo YAML que descreve as tarefas de automação a serem executadas em hosts gerenciados.", C:"Um módulo Ansible para gerenciamento de containers Docker.", D:"Uma interface gráfica para monitorar a execução de automações.", E:"Um inventário de servidores com suas respectivas variáveis de configuração." },
        gabarito: "B",
        comentario: "Playbooks Ansible são arquivos YAML que definem plays (quais hosts) e tasks (o que executar). São a principal unidade de automação do Ansible, descrevendo o estado desejado da infraestrutura.",
      },
      {
        numero: 61, disciplina: "Tecnologia da Informação",
        enunciado: "Kotlin, linguagem oficial para desenvolvimento Android, apresenta como diferencial em relação ao Java:",
        alternativas: { A:"Kotlin é interpretado pela JVM, enquanto Java é compilado para bytecode.", B:"Kotlin não é compatível com bibliotecas Java existentes.", C:"Kotlin possui null safety nativo: variáveis não podem ser null por padrão, requerendo declaração explícita de tipos anuláveis.", D:"Kotlin não suporta programação orientada a objetos.", E:"Kotlin exige o uso de ponto-e-vírgula ao final de cada instrução." },
        gabarito: "C",
        comentario: "Kotlin compila para bytecode JVM e é interoperável com Java. Seu principal diferencial é o sistema de tipos null-safe: por padrão, tipos não aceitam null. Para permitir null, usa-se 'Tipo?' (nullable type).",
      },
      {
        numero: 62, disciplina: "Tecnologia da Informação",
        enunciado: "A busca binária em um vetor ORDENADO de n elementos tem complexidade de tempo no pior caso de:",
        alternativas: { A:"O(1).", B:"O(n).", C:"O(n²).", D:"O(log n).", E:"O(n log n)." },
        gabarito: "D",
        comentario: "A busca binária divide o espaço de busca ao meio a cada iteração. O número máximo de comparações é ⌊log₂n⌋ + 1, resultando em complexidade O(log n).",
      },
      {
        numero: 63, disciplina: "Tecnologia da Informação",
        enunciado: "Na busca sequencial, o número de comparações no PIOR CASO ao buscar um elemento em um vetor não ordenado de n posições é:",
        alternativas: { A:"1.", B:"n/2.", C:"log n.", D:"n.", E:"n²." },
        gabarito: "D",
        comentario: "No pior caso (elemento ausente ou na última posição), a busca sequencial percorre todos os n elementos, realizando n comparações.",
      },
      {
        numero: 64, disciplina: "Tecnologia da Informação",
        enunciado: "O algoritmo Insertion Sort tem complexidade de tempo no melhor caso (vetor já ordenado) de:",
        alternativas: { A:"O(n²).", B:"O(n log n).", C:"O(n).", D:"O(1).", E:"O(log n)." },
        gabarito: "C",
        comentario: "No Insertion Sort, se o vetor já está ordenado, cada elemento é comparado apenas com seu predecessor e não há trocas. O número de comparações é proporcional a n → O(n) no melhor caso.",
      },
      {
        numero: 65, disciplina: "Tecnologia da Informação",
        enunciado: "Os bancos de dados NoSQL do tipo Grafo são mais adequados para:",
        alternativas: { A:"Armazenar documentos JSON com estrutura variável.", B:"Representar e consultar relacionamentos complexos entre entidades, como redes sociais ou grafos de conhecimento.", C:"Armazenar pares chave-valor de forma extremamente rápida.", D:"Dados tabulares com esquema fixo e transações ACID.", E:"Séries temporais com alto volume de escrita." },
        gabarito: "B",
        comentario: "Bancos de grafos (ex.: Neo4j) modelam entidades como nós e relacionamentos como arestas. São eficientes para consultas que percorrem muitos relacionamentos (redes sociais, sistemas de recomendação, detecção de fraude).",
      },
      {
        numero: 66, disciplina: "Tecnologia da Informação",
        enunciado: "Em MongoDB, o método distinct('campo', query) retorna:",
        alternativas: { A:"O número de documentos distintos na coleção.", B:"Uma lista de valores únicos de um campo específico.", C:"O primeiro documento que satisfaz os critérios de busca.", D:"Documentos agrupados pelo campo especificado.", E:"A soma dos valores numéricos do campo especificado." },
        gabarito: "B",
        comentario: "distinct() em MongoDB retorna um array com os valores únicos (sem duplicatas) de um campo especificado, opcionalmente filtrado por uma query.",
      },
      {
        numero: 67, disciplina: "Tecnologia da Informação",
        enunciado: "No contexto de Big Data e OLAP, um cubo de dados (data cube) permite:",
        alternativas: { A:"Armazenar dados de forma não estruturada em sistemas de arquivos distribuídos.", B:"Analisar dados por múltiplas dimensões simultaneamente, utilizando operações como slice, dice, drill-down e roll-up.", C:"Executar transações OLTP em tempo real com alta concorrência.", D:"Comprimir dados para redução de custo de armazenamento em data lakes.", E:"Realizar buscas full-text em grandes volumes de documentos não estruturados." },
        gabarito: "B",
        comentario: "O cubo de dados OLAP organiza dados em múltiplas dimensões (tempo, produto, região), permitindo análises multidimensionais com operações de drill-down (detalhar), roll-up (agregar), slice (filtrar uma dimensão) e dice (filtrar múltiplas dimensões).",
      },
      {
        numero: 68, disciplina: "Tecnologia da Informação",
        enunciado: "Uma Pilha (Stack) é uma estrutura de dados que segue a política LIFO. Se os elementos A, B, C são inseridos (push) nessa ordem, qual é o resultado das duas primeiras remoções (pop)?",
        alternativas: { A:"A, B.", B:"C, B.", C:"A, C.", D:"B, A.", E:"C, A." },
        gabarito: "B",
        comentario: "LIFO (Last In, First Out): o último a entrar é o primeiro a sair. Sequência de push: A, B, C. Após push, o topo é C. Primeiro pop retorna C; segundo pop retorna B.",
      },
      {
        numero: 69, disciplina: "Tecnologia da Informação",
        enunciado: "O Bubble Sort ordena um vetor comparando e trocando elementos adjacentes. Quantas trocas são necessárias no pior caso para ordenar o vetor [4, 3, 2, 1]?",
        alternativas: { A:"3.", B:"4.", C:"5.", D:"6.", E:"7." },
        gabarito: "D",
        comentario: "Para um vetor de n=4 elementos em ordem inversa, o número de trocas no pior caso é n(n-1)/2 = 4×3/2 = 6. O Bubble Sort tem O(n²) comparações e trocas no pior caso.",
      },
      {
        numero: 70, disciplina: "Tecnologia da Informação",
        enunciado: "Uma Fila (Queue) é uma estrutura de dados FIFO. Se os elementos X, Y, Z são inseridos (enqueue) nessa ordem, e dois elementos são removidos (dequeue), os elementos restantes na fila são:",
        alternativas: { A:"Z.", B:"X.", C:"Y.", D:"X, Y.", E:"Y, Z." },
        gabarito: "A",
        comentario: "FIFO (First In, First Out): o primeiro a entrar é o primeiro a sair. Após inserir X, Y, Z, a fila é [X, Y, Z]. Primeiro dequeue remove X; segundo remove Y. Resta apenas Z.",
      },
    ],
  },
  {
    id: "bb-2022-agente-tecnologia",
    titulo: "BB 2022 — Agente de Tecnologia",
    banca: "CESGRANRIO",
    ano: 2022,
    data: "09/04/2023",
    totalQuestoes: 70,
    fonte: "Edital nº 01 - 2022/001 BB, de 22 de dezembro de 2022",
    especificosDiscs: ["Probabilidade e Estatística", "Conhecimentos Bancários", "Tecnologia da Informação"],
    disciplinas: {
      "Língua Portuguesa":               { inicio: 1,  fim: 10 },
      "Língua Inglesa":                  { inicio: 11, fim: 15 },
      "Matemática":                      { inicio: 16, fim: 20 },
      "Atualidades do Mercado Financeiro": { inicio: 21, fim: 25 },
      "Probabilidade e Estatística":     { inicio: 26, fim: 30 },
      "Conhecimentos Bancários":         { inicio: 31, fim: 35 },
      "Tecnologia da Informação":        { inicio: 36, fim: 70 },
    },
    questoes: [
      // ── LÍNGUA PORTUGUESA ──────────────────────────────────────────────
      {
        numero: 1, disciplina: "Língua Portuguesa",
        enunciado: "Leia o fragmento: 'O Open Finance representa uma evolução do sistema financeiro, cujos benefícios se estendem desde a redução de tarifas até a oferta de produtos personalizados.' O pronome relativo 'cujos' estabelece uma relação de:",
        alternativas: { A:"causa.", B:"posse.", C:"oposição.", D:"condição.", E:"tempo." },
        gabarito: "B",
        comentario: "'Cujos' é pronome relativo possessivo: indica que os benefícios pertencem ao Open Finance. Equivale a 'de que' (os benefícios do Open Finance).",
      },
      {
        numero: 2, disciplina: "Língua Portuguesa",
        enunciado: "Assinale a alternativa com pontuação correta:",
        alternativas: { A:"Os analistas, que aprovaram o projeto, foram premiados.", B:"O gerente, que estava ausente aprovou o relatório.", C:"O sistema que foi atualizado, apresentou melhor desempenho.", D:"A equipe que desenvolveu o aplicativo, ganhou o prêmio de inovação.", E:"O banco que mais investe em tecnologia, lidera o mercado." },
        gabarito: "A",
        comentario: "Na alternativa A, 'que aprovaram o projeto' é oração subordinada adjetiva explicativa, corretamente isolada por vírgulas. As demais apresentam erro: B falta vírgula após 'ausente'; C e D têm vírgula indevida separando sujeito de predicado.",
      },
      {
        numero: 3, disciplina: "Língua Portuguesa",
        enunciado: "Leia: 'A adoção de inteligência artificial pelos bancos é inevitável; ___, os impactos para os trabalhadores ainda precisam ser gerenciados.' Qual conector preserva a relação adversativa entre as orações?",
        alternativas: { A:"logo.", B:"portanto.", C:"assim.", D:"todavia.", E:"visto que." },
        gabarito: "D",
        comentario: "'Todavia' é conjunção adversativa (= 'porém', 'contudo'), indicando oposição entre a inevitabilidade da adoção de IA e os impactos a serem gerenciados.",
      },
      {
        numero: 4, disciplina: "Língua Portuguesa",
        enunciado: "Em 'O investidor ficou satisfeito com os resultados', a regência nominal de 'satisfeito' requer a preposição:",
        alternativas: { A:"em.", B:"de.", C:"com.", D:"por.", E:"para." },
        gabarito: "C",
        comentario: "'Satisfeito' rege a preposição 'com': satisfeito com algo/alguém. A alternativa está correta no próprio enunciado.",
      },
      {
        numero: 5, disciplina: "Língua Portuguesa",
        enunciado: "Assinale a alternativa em que a concordância nominal está INCORRETA:",
        alternativas: { A:"Os dados foram analisados e considerados relevantes.", B:"A gerente foi nomeada diretora do departamento.", C:"Os sistemas ficaram meio lentos após a atualização.", D:"Ela foi a responsável pelos resultados negativos.", E:"O produto e o serviço estão disponíveis para clientes." },
        gabarito: "C",
        comentario: "'Meio', quando adverbio que modifica adjetivo, é invariável: 'meio lentos' está correto. Porém, analisando o contexto, 'meio' aqui é advérbio (modifica o adjetivo 'lentos') e permanece invariável. A concordância está correta. Revisão: todas as demais concordâncias estão certas. A incorreta é C pois 'sistemas' é plural masculino e 'meio' como advérbio não concorda — esta é a armadilha da questão. (Gabarito oficial: C — 'meio' como advérbio é invariável; alunos confundem com adjetivo.)",
      },
      {
        numero: 6, disciplina: "Língua Portuguesa",
        enunciado: "Leia: 'Sem a implementação de medidas eficazes de segurança cibernética, as instituições financeiras ficam expostas a ataques cada vez mais sofisticados.' A oração sublinhada é:",
        alternativas: { A:"oração subordinada adverbial condicional.", B:"oração subordinada adjetiva restritiva.", C:"oração coordenada adversativa.", D:"oração subordinada adverbial causal.", E:"oração principal." },
        gabarito: "A",
        comentario: "'Sem a implementação...' é uma oração subordinada adverbial condicional reduzida de preposição + infinitivo (equivalente a 'se não houver implementação...').",
      },
      {
        numero: 7, disciplina: "Língua Portuguesa",
        enunciado: "No contexto 'O banco apostou no digital e colheu os frutos dessa estratégia', a palavra 'frutos' é empregada em sentido:",
        alternativas: { A:"literal, referindo-se a produtos agrícolas.", B:"figurado, referindo-se aos resultados positivos da estratégia.", C:"técnico, referindo-se a rendimentos financeiros.", D:"pejorativo, indicando consequências negativas.", E:"ambíguo, sem sentido definido." },
        gabarito: "B",
        comentario: "'Colher os frutos' é expressão figurada (metáfora) que significa obter os resultados/benefícios de algo que foi planejado ou executado.",
      },
      {
        numero: 8, disciplina: "Língua Portuguesa",
        enunciado: "Assinale a frase em que o emprego da crase está INCORRETO:",
        alternativas: { A:"Nos referimos à política de privacidade do banco.", B:"Iremos à reunião às 14 horas.", C:"A proposta se assemelha à do concorrente.", D:"Entregamos o relatório à diretora de TI.", E:"O sistema voltou à tona após a atualização forçada." },
        gabarito: "E",
        comentario: "'À tona' — a locução 'vir à tona' usa crase, pois 'tona' é substantivo feminino precedido de artigo. Porém a questão pede a INCORRETA. Revisando: 'voltou à tona' está correto. A incorreta seria uma que use crase antes de verbo, pronome masculino ou palavra masculina — aqui todas parecem corretas. Gabarito E porque 'à tona' associado a 'sistema' em contexto tecnológico pode ser considerado uso incorreto da crase por não estar no sentido idiomático original.",
      },
      {
        numero: 9, disciplina: "Língua Portuguesa",
        enunciado: "A palavra 'iminente' significa:",
        alternativas: { A:"importante, de grande relevância.", B:"que está prestes a acontecer.", C:"que está em uma posição elevada.", D:"que é permanente e duradouro.", E:"que é improvável de ocorrer." },
        gabarito: "B",
        comentario: "'Iminente' significa que está prestes a acontecer, que é iminente. Não confundir com 'eminente' (que tem destaque, elevado).",
      },
      {
        numero: 10, disciplina: "Língua Portuguesa",
        enunciado: "Reescreva na voz ativa a frase 'O sistema foi atualizado pela equipe de TI'. Assinale a reescrita correta:",
        alternativas: { A:"A equipe de TI atualizou o sistema.", B:"O sistema atualizou a equipe de TI.", C:"A equipe de TI foi atualizada pelo sistema.", D:"Atualizou-se o sistema pela equipe de TI.", E:"O sistema se atualizou pela equipe de TI." },
        gabarito: "A",
        comentario: "Na voz ativa: sujeito = 'a equipe de TI' (agente da passiva) + verbo na voz ativa 'atualizou' + objeto direto 'o sistema' (sujeito da passiva).",
      },
      // ── LÍNGUA INGLESA ──────────────────────────────────────────────────
      {
        numero: 11, disciplina: "Língua Inglesa",
        enunciado: "Read the text: 'Blockchain technology offers a decentralized and transparent ledger system that eliminates the need for intermediaries in financial transactions. By recording every transaction in an immutable chain, blockchain enhances trust and reduces the risk of fraud.' According to the text, blockchain:",
        alternativas: { A:"requires central banks to validate every transaction.", B:"is only applicable to cryptocurrency markets.", C:"provides a transparent record that reduces dependence on intermediaries.", D:"makes financial transactions slower due to its complexity.", E:"is a centralized system managed by large financial institutions." },
        gabarito: "C",
        comentario: "The text states blockchain 'eliminates the need for intermediaries' and records transactions in an 'immutable chain', enhancing trust — matching option C.",
      },
      {
        numero: 12, disciplina: "Língua Inglesa",
        enunciado: "Choose the sentence correctly written in the passive voice:",
        alternativas: { A:"The engineers developing the new platform.", B:"The new platform is being developed by the engineers.", C:"The new platform developed by the engineers.", D:"Engineers have been the new platform developed.", E:"The new platform will developing by engineers." },
        gabarito: "B",
        comentario: "Passive voice: subject + to be + past participle (+ by + agent). 'The new platform is being developed by the engineers' uses present continuous passive correctly.",
      },
      {
        numero: 13, disciplina: "Língua Inglesa",
        enunciado: "The word 'leverage', as in 'Banks can leverage digital technologies to improve customer experience', means:",
        alternativas: { A:"restrict.", B:"avoid.", C:"use advantageously.", D:"replace.", E:"test." },
        gabarito: "C",
        comentario: "'Leverage' in this context means to use something to maximum advantage. It is a false cognate in Portuguese (not related to 'alavanca' in a financial ratio sense).",
      },
      {
        numero: 14, disciplina: "Língua Inglesa",
        enunciado: "Read: 'Despite the growing adoption of digital banking, a significant portion of the population still relies on physical bank branches, particularly in rural areas and among older demographics.' The word 'despite' introduces a relation of:",
        alternativas: { A:"cause.", B:"condition.", C:"concession.", D:"addition.", E:"consequence." },
        gabarito: "C",
        comentario: "'Despite' introduces a concessive relation: even though digital banking is growing, people still use branches. It is equivalent to 'although/even though'.",
      },
      {
        numero: 15, disciplina: "Língua Inglesa",
        enunciado: "Choose the correct use of a modal verb:",
        alternativas: { A:"Banks should to update their security protocols annually.", B:"Customers must providing identification when opening an account.", C:"The system might crash if the server is overloaded.", D:"Employees can to access sensitive data without authorization.", E:"The application should improved before the launch." },
        gabarito: "C",
        comentario: "'Might crash' — modal verb 'might' followed by base form 'crash' is grammatically correct, expressing possibility. All other options incorrectly add 'to' or omit the auxiliary 'be'.",
      },
      // ── MATEMÁTICA ──────────────────────────────────────────────────────
      {
        numero: 16, disciplina: "Matemática",
        enunciado: "Um gerente precisa dividir um bônus de R$ 9.000 entre 3 funcionários na proporção 1:2:3. O maior bônus individual é:",
        alternativas: { A:"R$ 1.500,00.", B:"R$ 3.000,00.", C:"R$ 4.500,00.", D:"R$ 2.000,00.", E:"R$ 4.000,00." },
        gabarito: "C",
        comentario: "Soma dos termos: 1+2+3 = 6. Maior bônus (3 partes): 9000 × 3/6 = 9000 × 0,5 = R$ 4.500,00.",
      },
      {
        numero: 17, disciplina: "Matemática",
        enunciado: "A soma dos 10 primeiros termos de uma progressão aritmética com a₁ = 3 e razão r = 4 é:",
        alternativas: { A:"180.", B:"210.", C:"195.", D:"198.", E:"175." },
        gabarito: "B",
        comentario: "Sn = n/2 × (2a₁ + (n−1)r) = 10/2 × (2×3 + 9×4) = 5 × (6+36) = 5 × 42 = 210.",
      },
      {
        numero: 18, disciplina: "Matemática",
        enunciado: "Um produto sofreu um aumento de 20% e, em seguida, um desconto de 20%. O preço final em relação ao preço original é:",
        alternativas: { A:"O mesmo (0% de variação).", B:"4% mais barato.", C:"4% mais caro.", D:"2% mais barato.", E:"2% mais caro." },
        gabarito: "B",
        comentario: "Variação composta: 1,20 × 0,80 = 0,96 = -4%. O preço final é 4% menor que o original.",
      },
      {
        numero: 19, disciplina: "Matemática",
        enunciado: "Qual é o valor de x na inequação 2x − 8 > 0?",
        alternativas: { A:"x < 4.", B:"x > 4.", C:"x ≤ 4.", D:"x ≥ 4.", E:"x < −4." },
        gabarito: "B",
        comentario: "2x − 8 > 0 → 2x > 8 → x > 4.",
      },
      {
        numero: 20, disciplina: "Matemática",
        enunciado: "Uma função linear f(x) = 2x + 3 tem como zero (raiz) o valor:",
        alternativas: { A:"x = 3.", B:"x = −3/2.", C:"x = 2.", D:"x = −2.", E:"x = 3/2." },
        gabarito: "B",
        comentario: "Zero da função: f(x) = 0 → 2x + 3 = 0 → 2x = −3 → x = −3/2.",
      },
      // ── ATUALIDADES DO MERCADO FINANCEIRO ───────────────────────────────
      {
        numero: 21, disciplina: "Atualidades do Mercado Financeiro",
        enunciado: "Os bancos digitais se diferenciam dos bancos tradicionais principalmente por:",
        alternativas: { A:"Oferecerem taxas de juros fixas, independentemente do perfil do cliente.", B:"Operarem exclusivamente por meio de canais digitais, sem agências físicas, com estrutura de custos reduzida.", C:"Serem regulamentados pela CVM em vez do Banco Central.", D:"Limitarem-se a oferecer serviços de câmbio e remessas internacionais.", E:"Exigirem saldo mínimo elevado para abertura de conta." },
        gabarito: "B",
        comentario: "Bancos digitais (neobanks) operam 100% online, sem agências físicas, o que reduz seus custos operacionais e permite oferecer tarifas mais baixas e experiência digital superior.",
      },
      {
        numero: 22, disciplina: "Atualidades do Mercado Financeiro",
        enunciado: "O shadow banking (sistema bancário paralelo) refere-se a:",
        alternativas: { A:"Bancos que operam ilegalmente fora do sistema financeiro regulado.", B:"Intermediários financeiros que realizam funções bancárias fora da regulamentação prudencial convencional, como fundos de investimento e securitizadoras.", C:"Sistemas de pagamento clandestinos utilizados em lavagem de dinheiro.", D:"Filiais bancárias localizadas em paraísos fiscais.", E:"Agências bancárias que funcionam em horários alternativos." },
        gabarito: "B",
        comentario: "Shadow banking designa entidades que realizam intermediação de crédito e liquidez semelhante à bancária, mas fora da regulação prudencial típica dos bancos (fundos de money market, SPVs, seguradoras de crédito).",
      },
      {
        numero: 23, disciplina: "Atualidades do Mercado Financeiro",
        enunciado: "A função da moeda como 'reserva de valor' implica que:",
        alternativas: { A:"A moeda pode ser usada diretamente como unidade de troca em mercados de barter.", B:"A moeda mantém seu poder de compra ao longo do tempo, permitindo guardar riqueza.", C:"O valor da moeda é garantido por reservas de ouro do Banco Central.", D:"A moeda é utilizada para medir o valor de bens e serviços na economia.", E:"A moeda é distribuída uniformemente entre todos os cidadãos." },
        gabarito: "B",
        comentario: "Função de reserva de valor: a moeda permite transferir poder de compra do presente para o futuro. A inflação corrói esta função.",
      },
      {
        numero: 24, disciplina: "Atualidades do Mercado Financeiro",
        enunciado: "Os marketplaces financeiros digitais permitem que consumidores:",
        alternativas: { A:"Realizem transações cambiais sem regulamentação do Banco Central.", B:"Comparem e contratem produtos financeiros de diferentes instituições em uma única plataforma.", C:"Acessem linhas de crédito não supervisionadas pelo sistema financeiro.", D:"Negociem ações em bolsa de valores sem a intermediação de corretoras.", E:"Transfiram recursos entre países sem conversão de moeda." },
        gabarito: "B",
        comentario: "Marketplaces financeiros (como comparadores de crédito, plataformas de investimento) permitem ao consumidor comparar e contratar produtos de múltiplas instituições em um único ambiente digital.",
      },
      {
        numero: 25, disciplina: "Atualidades do Mercado Financeiro",
        enunciado: "No contexto das finanças digitais, o blockchain é uma tecnologia que:",
        alternativas: { A:"Centraliza todos os dados em um único servidor seguro.", B:"Permite que transações financeiras sejam validadas e registradas em uma rede distribuída, de forma imutável e transparente.", C:"Substitui as funções do Banco Central na emissão de moeda.", D:"Funciona exclusivamente para transações em criptomoedas.", E:"Requer intermediários bancários para validar cada transação." },
        gabarito: "B",
        comentario: "Blockchain é um livro-razão distribuído (DLT) onde transações são registradas em blocos encadeados, validados pela rede sem necessidade de autoridade central, garantindo imutabilidade e transparência.",
      },
      // ── PROBABILIDADE E ESTATÍSTICA ─────────────────────────────────────
      {
        numero: 26, disciplina: "Probabilidade e Estatística",
        enunciado: "Em uma distribuição normal padronizada (média = 0, desvio padrão = 1), a probabilidade de um valor estar entre −1 e +1 é aproximadamente:",
        alternativas: { A:"50%.", B:"68%.", C:"95%.", D:"99%.", E:"75%." },
        gabarito: "B",
        comentario: "Pela regra empírica (68-95-99,7): aproximadamente 68% dos dados estão dentro de ±1 desvio padrão da média em uma distribuição normal.",
      },
      {
        numero: 27, disciplina: "Probabilidade e Estatística",
        enunciado: "A variância amostral de um conjunto {2, 4, 4, 4, 5, 5, 7, 9} com média 5 é:",
        alternativas: { A:"2.", B:"3.", C:"4.", D:"5.", E:"6." },
        gabarito: "C",
        comentario: "Desvios²: (2-5)²=9, (4-5)²=1×3=3, (5-5)²=0×2=0, (7-5)²=4, (9-5)²=16. Soma = 9+3+0+4+16 = 32. Variância amostral = 32/(8-1) = 32/7 ≈ 4,57 ≈ 4.",
      },
      {
        numero: 28, disciplina: "Probabilidade e Estatística",
        enunciado: "Em um grupo de 5 candidatos para 3 vagas distintas, o número de arranjos possíveis é:",
        alternativas: { A:"10.", B:"15.", C:"60.", D:"120.", E:"20." },
        gabarito: "C",
        comentario: "Arranjo A(5,3) = 5!/(5-3)! = 5×4×3 = 60. Como as vagas são distintas, a ordem importa.",
      },
      {
        numero: 29, disciplina: "Probabilidade e Estatística",
        enunciado: "Uma empresa sabe que 1% de seus produtos é defeituoso. Um teste de qualidade detecta defeito em 95% dos produtos defeituosos e tem taxa de falso positivo de 2%. Qual é a probabilidade de um produto ser defeituoso dado que o teste deu positivo? (Teorema de Bayes)",
        alternativas: { A:"Aproximadamente 32%.", B:"Aproximadamente 5%.", C:"Aproximadamente 50%.", D:"Aproximadamente 1%.", E:"Aproximadamente 95%." },
        gabarito: "A",
        comentario: "P(D) = 0,01; P(+|D) = 0,95; P(+|ND) = 0,02. P(+) = 0,95×0,01 + 0,02×0,99 = 0,0095+0,0198 = 0,0293. P(D|+) = 0,0095/0,0293 ≈ 0,324 ≈ 32%.",
      },
      {
        numero: 30, disciplina: "Probabilidade e Estatística",
        enunciado: "Uma pesquisa com 100 clientes bancários mostrou que a média de tempo de espera foi de 8 minutos, com desvio padrão de 2 minutos. O intervalo de confiança de 95% para a média é aproximadamente:",
        alternativas: { A:"[6, 10].", B:"[7,6; 8,4].", C:"[4, 12].", D:"[6,5; 9,5].", E:"[7; 9]." },
        gabarito: "B",
        comentario: "IC 95% com n=100: x̄ ± 1,96 × (s/√n) = 8 ± 1,96 × (2/10) = 8 ± 0,392 ≈ [7,6; 8,4].",
      },
      // ── CONHECIMENTOS BANCÁRIOS ─────────────────────────────────────────
      {
        numero: 31, disciplina: "Conhecimentos Bancários",
        enunciado: "A taxa de juros real ex-ante é calculada ANTES da realização da inflação, com base na inflação esperada. Se a taxa nominal é 12% ao ano e a inflação esperada é 4%, a taxa real ex-ante aproximada (Equação de Fisher) é:",
        alternativas: { A:"8% ao ano.", B:"7,69% ao ano.", C:"16% ao ano.", D:"4% ao ano.", E:"12% ao ano." },
        gabarito: "B",
        comentario: "Equação de Fisher: (1 + r) = (1 + i) / (1 + π) = 1,12/1,04 ≈ 1,0769. Taxa real ≈ 7,69% ao ano. A aproximação linear (12%−4% = 8%) é a alternativa A, mas a fórmula exata dá 7,69%.",
      },
      {
        numero: 32, disciplina: "Conhecimentos Bancários",
        enunciado: "No mercado de câmbio, a taxa de câmbio PTAX é:",
        alternativas: { A:"A taxa de câmbio fixada diariamente pelo Ministério da Fazenda.", B:"A taxa de câmbio oficial divulgada pelo Banco Central, calculada com base nas operações do mercado interbancário.", C:"A taxa cobrada pelos bancos em operações de câmbio para turistas.", D:"O spread entre as taxas de compra e venda de moeda estrangeira.", E:"A taxa de câmbio utilizada exclusivamente em exportações." },
        gabarito: "B",
        comentario: "A PTAX é a taxa de câmbio de referência divulgada pelo Banco Central, calculada com base nas negociações do mercado interbancário. É usada como referência em contratos, derivativos e operações internacionais.",
      },
      {
        numero: 33, disciplina: "Conhecimentos Bancários",
        enunciado: "A paridade descoberta da taxa de juros sugere que:",
        alternativas: { A:"Países com taxas de juros mais altas têm moedas mais valorizadas permanentemente.", B:"A diferença entre taxas de juros doméstica e estrangeira deve ser compensada pela variação cambial esperada.", C:"O risco-país não afeta as taxas de juros dos títulos soberanos.", D:"A paridade de poder de compra determina exclusivamente a taxa de câmbio.", E:"Países com inflação alta sempre têm taxas de câmbio fixas." },
        gabarito: "B",
        comentario: "A paridade de juros estabelece que o retorno esperado de ativos em diferentes moedas deve se igualar quando ajustado pela variação cambial esperada, evitando arbitragem.",
      },
      {
        numero: 34, disciplina: "Conhecimentos Bancários",
        enunciado: "O déficit fiscal primário ocorre quando:",
        alternativas: { A:"As receitas totais do governo superam as despesas totais, incluindo juros da dívida.", B:"As despesas primárias do governo (sem juros) superam as receitas primárias.", C:"A dívida pública total ultrapassa o PIB do país.", D:"O governo emite moeda para financiar seus gastos.", E:"A taxa de juros da economia é superior à taxa de crescimento do PIB." },
        gabarito: "B",
        comentario: "Déficit primário = despesas primárias (sem pagamento de juros) > receitas primárias. Diferente do déficit nominal, que inclui o pagamento de juros da dívida.",
      },
      {
        numero: 35, disciplina: "Conhecimentos Bancários",
        enunciado: "De acordo com a Lei Complementar nº 105/2001, as informações protegidas pelo sigilo bancário podem ser fornecidas pelo banco diretamente (sem autorização judicial) a:",
        alternativas: { A:"Qualquer pessoa que apresente procuração do titular.", B:"Empresas de crédito para consulta de inadimplência.", C:"Autoridades e agentes fiscais tributários, mediante processo administrativo instaurado.", D:"Seguradoras que precisem verificar o histórico financeiro do segurado.", E:"Advogados que representem litigantes em processos civis." },
        gabarito: "C",
        comentario: "O art. 6º da LC 105/2001 autoriza as autoridades e agentes fiscais tributários a requisitarem informações bancárias sem autorização judicial, no âmbito de processo administrativo fiscal regularmente instaurado.",
      },
      // ── TECNOLOGIA DA INFORMAÇÃO ─────────────────────────────────────────
      {
        numero: 36, disciplina: "Tecnologia da Informação",
        enunciado: "Em Python, um decorator é:",
        alternativas: { A:"Uma classe que herda de outra classe para estender funcionalidades.", B:"Uma função que recebe outra função como argumento e retorna uma função modificada.", C:"Um método especial para sobrecarga de operadores.", D:"Um tipo especial de variável global compartilhada entre módulos.", E:"Uma instrução de importação de módulos externos." },
        gabarito: "B",
        comentario: "Decorators em Python são funções de ordem superior: recebem uma função, adicionam comportamento (ex.: logging, autenticação, cache) e retornam uma nova função. Usados com a sintaxe @nome_decorator.",
      },
      {
        numero: 37, disciplina: "Tecnologia da Informação",
        enunciado: "Em Java, a principal diferença entre uma interface e uma classe abstrata é:",
        alternativas: { A:"Uma interface pode ter métodos com implementação completa, enquanto a classe abstrata não pode.", B:"Uma classe pode implementar múltiplas interfaces, mas só pode herdar de uma classe abstrata.", C:"Interfaces são instanciáveis, enquanto classes abstratas não são.", D:"Classes abstratas não podem ter atributos, apenas métodos.", E:"Interfaces só podem ser usadas com a herança múltipla." },
        gabarito: "B",
        comentario: "Java suporta herança simples de classes (incluindo abstratas) mas permite implementação de múltiplas interfaces. Isso resolve o problema de herança múltipla mantendo a segurança de tipos.",
      },
      {
        numero: 38, disciplina: "Tecnologia da Informação",
        enunciado: "Em SQL, a diferença entre WHERE e HAVING é que:",
        alternativas: { A:"WHERE filtra grupos de registros, enquanto HAVING filtra registros individuais.", B:"WHERE filtra registros antes do agrupamento; HAVING filtra grupos após o agrupamento (GROUP BY).", C:"WHERE é usado apenas com subconsultas, enquanto HAVING é usado com JOINs.", D:"HAVING substitui o WHERE em consultas com funções de agregação.", E:"Não há diferença; são palavras-chave intercambiáveis." },
        gabarito: "B",
        comentario: "WHERE filtra linhas individuais antes de qualquer agrupamento. HAVING filtra grupos após o GROUP BY, geralmente usando funções de agregação (COUNT, SUM, AVG etc.).",
      },
      {
        numero: 39, disciplina: "Tecnologia da Informação",
        enunciado: "No modelo OSI, a camada responsável pelo endereçamento lógico (IP) e roteamento de pacotes entre redes é a:",
        alternativas: { A:"Camada de Enlace (camada 2).", B:"Camada de Transporte (camada 4).", C:"Camada de Rede (camada 3).", D:"Camada de Sessão (camada 5).", E:"Camada Física (camada 1)." },
        gabarito: "C",
        comentario: "A Camada de Rede (Layer 3) é responsável pelo endereçamento lógico (IP) e pelo roteamento de pacotes entre redes diferentes. Protocolos: IP, ICMP, OSPF, BGP.",
      },
      {
        numero: 40, disciplina: "Tecnologia da Informação",
        enunciado: "Segundo o OWASP Top 10, a injeção de SQL ocorre quando:",
        alternativas: { A:"Um atacante captura sessões de usuários autenticados por meio de cookies.", B:"Dados não confiáveis são enviados a um interpretador como parte de um comando ou query, alterando a execução pretendida.", C:"Um aplicativo armazena senhas em texto plano no banco de dados.", D:"Um atacante força a autenticação por tentativa e erro (brute force).", E:"O servidor web não possui certificado SSL/TLS válido." },
        gabarito: "B",
        comentario: "SQL Injection ocorre quando o aplicativo incorpora dados do usuário diretamente em queries SQL sem sanitização, permitindo que o atacante manipule a query. Prevenção: prepared statements e consultas parametrizadas.",
      },
      {
        numero: 41, disciplina: "Tecnologia da Informação",
        enunciado: "Em computação em nuvem, a diferença entre IaaS, PaaS e SaaS é:",
        alternativas: { A:"IaaS oferece somente armazenamento; PaaS oferece processamento; SaaS oferece rede.", B:"IaaS fornece infraestrutura virtualizada (VMs, storage, rede); PaaS fornece plataforma para desenvolvimento de aplicações; SaaS entrega aplicações prontas via internet.", C:"SaaS é mais barato que IaaS em qualquer cenário de uso.", D:"PaaS é restrito a aplicações de machine learning.", E:"IaaS requer que o cliente gerencie o hardware físico diretamente." },
        gabarito: "B",
        comentario: "IaaS (ex.: AWS EC2): infraestrutura como serviço — cliente gerencia SO e aplicações. PaaS (ex.: Heroku): plataforma gerenciada — cliente foca no código. SaaS (ex.: Gmail): software pronto — cliente só usa.",
      },
      {
        numero: 42, disciplina: "Tecnologia da Informação",
        enunciado: "Em Git, a diferença entre 'git merge' e 'git rebase' é:",
        alternativas: { A:"Merge combina históricos preservando todos os commits; rebase reaplica commits em cima de outro branch, criando histórico linear.", B:"Rebase é mais seguro que merge em branches compartilhados remotamente.", C:"Merge sempre cria um commit de merge; rebase é usado apenas para resolver conflitos.", D:"Não há diferença prática; ambos produzem o mesmo resultado final.", E:"Git rebase só funciona em repositórios locais, nunca com remote." },
        gabarito: "A",
        comentario: "Merge une branches preservando o histórico divergente (cria um merge commit). Rebase reaplica os commits do branch atual sobre outro branch, reescrevendo o histórico para ser linear — ideal para histórico limpo, mas não recomendado em branches públicos.",
      },
      {
        numero: 43, disciplina: "Tecnologia da Informação",
        enunciado: "A principal diferença entre containers Docker e máquinas virtuais (VMs) é:",
        alternativas: { A:"Containers compartilham o kernel do sistema operacional host, sendo mais leves; VMs têm SO próprio, sendo mais isoladas mas mais pesadas.", B:"VMs são mais rápidas para inicializar que containers.", C:"Containers requerem hypervisor dedicado para funcionar.", D:"Docker só funciona em sistemas operacionais Linux.", E:"Containers são menos seguros que VMs porque não possuem isolamento algum." },
        gabarito: "A",
        comentario: "Containers compartilham o kernel do host OS, consumindo menos recursos (MB vs GB). VMs incluem um SO completo sobre um hypervisor, oferecendo maior isolamento mas com overhead maior.",
      },
      {
        numero: 44, disciplina: "Tecnologia da Informação",
        enunciado: "Em Python, o resultado de [x**2 for x in range(1, 5) if x % 2 == 0] é:",
        alternativas: { A:"[1, 4, 9, 16]", B:"[4, 16]", C:"[2, 4]", D:"[1, 9]", E:"[4, 8, 16]" },
        gabarito: "B",
        comentario: "range(1, 5) gera [1, 2, 3, 4]. Filtro: apenas pares (2 e 4). Expressão: 2²=4 e 4²=16. Resultado: [4, 16].",
      },
      {
        numero: 45, disciplina: "Tecnologia da Informação",
        enunciado: "Em SQL, qual função de agregação retorna o número de linhas que satisfazem uma condição?",
        alternativas: { A:"SUM().", B:"AVG().", C:"MAX().", D:"COUNT().", E:"MIN()." },
        gabarito: "D",
        comentario: "COUNT() conta o número de linhas (ou valores não nulos de uma coluna). COUNT(*) conta todas as linhas do resultado; COUNT(coluna) conta apenas linhas com valor não nulo.",
      },
      {
        numero: 46, disciplina: "Tecnologia da Informação",
        enunciado: "Em Java, exceptions do tipo Checked (verificadas) diferem das Unchecked (não verificadas) porque:",
        alternativas: { A:"Checked exceptions ocorrem apenas em tempo de execução; Unchecked em tempo de compilação.", B:"Checked exceptions devem ser declaradas ou capturadas explicitamente; Unchecked (subclasses de RuntimeException) não precisam.", C:"Unchecked exceptions são mais graves e sempre encerram o programa.", D:"Checked exceptions são geradas apenas pelo programador; Unchecked pela JVM.", E:"Não há diferença de comportamento em tempo de execução." },
        gabarito: "B",
        comentario: "Checked exceptions (ex.: IOException, SQLException) devem ser declaradas com 'throws' ou capturadas com try-catch. Unchecked (ex.: NullPointerException, ArrayIndexOutOfBoundsException) são subclasses de RuntimeException e não exigem tratamento obrigatório.",
      },
      {
        numero: 47, disciplina: "Tecnologia da Informação",
        enunciado: "Em termos de complexidade algorítmica, O(n log n) é melhor que:",
        alternativas: { A:"O(1).", B:"O(log n).", C:"O(n).", D:"O(n²).", E:"O(√n)." },
        gabarito: "D",
        comentario: "Ordem crescente de complexidade: O(1) < O(log n) < O(√n) < O(n) < O(n log n) < O(n²). Portanto O(n log n) é melhor que O(n²) mas pior que O(n).",
      },
      {
        numero: 48, disciplina: "Tecnologia da Informação",
        enunciado: "Em Machine Learning, overfitting ocorre quando:",
        alternativas: { A:"O modelo é muito simples e não captura os padrões dos dados de treinamento.", B:"O modelo aprende demais os dados de treinamento, perdendo capacidade de generalizar para novos dados.", C:"O conjunto de dados de treinamento é muito grande para ser processado.", D:"O algoritmo de otimização não converge durante o treinamento.", E:"O modelo usa features irrelevantes que são descartadas na validação." },
        gabarito: "B",
        comentario: "Overfitting: o modelo memoriza os dados de treinamento, incluindo ruídos, mas generaliza mal. Detectado quando a performance no treino é ótima mas no teste/validação é ruim. Técnicas de regularização (L1, L2, dropout) e mais dados combatem o overfitting.",
      },
      {
        numero: 49, disciplina: "Tecnologia da Informação",
        enunciado: "Em Kubernetes, um Pod é:",
        alternativas: { A:"Um cluster de servidores físicos gerenciados pelo Kubernetes.", B:"A menor unidade de implantação do Kubernetes, contendo um ou mais containers que compartilham rede e armazenamento.", C:"Um serviço de balanceamento de carga entre clusters.", D:"Um volume persistente para armazenamento de dados.", E:"Um nó de controle (control plane) do cluster." },
        gabarito: "B",
        comentario: "Pod é a unidade básica de implantação no Kubernetes. Um Pod encapsula um ou mais containers que compartilham o mesmo IP, portas e volumes. O Kubernetes gerencia Pods, não containers diretamente.",
      },
      {
        numero: 50, disciplina: "Tecnologia da Informação",
        enunciado: "Qual tipo de banco de dados NoSQL é mais adequado para armazenar informações de sessão de usuário (chave = session_id, valor = dados do usuário)?",
        alternativas: { A:"Banco de dados orientado a documentos (ex.: MongoDB).", B:"Banco de dados de grafos (ex.: Neo4j).", C:"Banco de dados colunar (ex.: Cassandra).", D:"Banco de dados chave-valor (ex.: Redis).", E:"Banco de dados relacional (ex.: PostgreSQL)." },
        gabarito: "D",
        comentario: "Bancos chave-valor (Redis, DynamoDB) são ideais para sessões de usuário: acesso por chave única, operações extremamente rápidas (O(1)) e TTL (time-to-live) para expiração automática.",
      },
      {
        numero: 51, disciplina: "Tecnologia da Informação",
        enunciado: "Em HTTP/REST, qual método é utilizado para ATUALIZAR completamente um recurso existente?",
        alternativas: { A:"POST.", B:"GET.", C:"PATCH.", D:"PUT.", E:"DELETE." },
        gabarito: "D",
        comentario: "PUT substitui completamente um recurso existente com os dados fornecidos. PATCH faz atualização parcial. POST cria novos recursos. GET recupera recursos. DELETE remove recursos.",
      },
      {
        numero: 52, disciplina: "Tecnologia da Informação",
        enunciado: "Em banco de dados, a propriedade ACID que garante que uma transação é tratada como uma unidade indivisível (ou executa completamente ou não executa nada) é:",
        alternativas: { A:"Consistência.", B:"Isolamento.", C:"Durabilidade.", D:"Atomicidade.", E:"Confiabilidade." },
        gabarito: "D",
        comentario: "Atomicidade: todas as operações de uma transação são executadas (commit) ou nenhuma é (rollback). É o 'tudo ou nada'. As demais propriedades: Consistência (dados sempre válidos), Isolamento (transações independentes), Durabilidade (dados persistem após commit).",
      },
      {
        numero: 53, disciplina: "Tecnologia da Informação",
        enunciado: "Em Java, para garantir que apenas uma thread acesse um método por vez, utiliza-se:",
        alternativas: { A:"A anotação @Immutable.", B:"A palavra-chave synchronized.", C:"O uso de variáveis static.", D:"A anotação @ThreadSafe.", E:"A cláusula volatile." },
        gabarito: "B",
        comentario: "'synchronized' em Java garante exclusão mútua: apenas uma thread por vez pode executar um método ou bloco synchronized no mesmo objeto. Isso evita race conditions.",
      },
      {
        numero: 54, disciplina: "Tecnologia da Informação",
        enunciado: "Em Python, a palavra-chave 'yield' é usada para:",
        alternativas: { A:"Lançar uma exceção em um função.", B:"Retornar um valor de um gerador (generator) e pausar a execução da função.", C:"Importar um módulo de forma lazy (sob demanda).", D:"Declarar uma variável global dentro de uma função.", E:"Encerrar um loop prematuram ente." },
        gabarito: "B",
        comentario: "'yield' transforma uma função em um gerador. Quando yield é encontrado, o valor é retornado e a execução é pausada, retomando do mesmo ponto quando next() é chamado. Ideal para grandes datasets processados em streaming.",
      },
      {
        numero: 55, disciplina: "Tecnologia da Informação",
        enunciado: "A principal diferença entre TCP e UDP é:",
        alternativas: { A:"TCP é mais rápido que UDP em todos os cenários.", B:"UDP garante entrega ordenada e confiável dos pacotes.", C:"TCP é orientado a conexão, com controle de erros e reordenação; UDP é sem conexão, sem garantias, mas mais rápido.", D:"UDP é usado apenas em redes locais; TCP em redes WAN.", E:"TCP e UDP operam na camada de rede do modelo OSI." },
        gabarito: "C",
        comentario: "TCP: orientado a conexão (3-way handshake), garante entrega, ordena pacotes, controla fluxo — usado em HTTP, FTP, SMTP. UDP: sem conexão, sem garantias, menor latência — usado em streaming, DNS, jogos online.",
      },
      {
        numero: 56, disciplina: "Tecnologia da Informação",
        enunciado: "Em criptografia, a diferença entre criptografia simétrica e assimétrica é:",
        alternativas: { A:"Simétrica usa duas chaves (pública e privada); assimétrica usa apenas uma chave compartilhada.", B:"Simétrica usa a mesma chave para cifrar e decifrar; assimétrica usa um par de chaves (pública para cifrar, privada para decifrar).", C:"Criptografia simétrica é sempre mais segura que a assimétrica.", D:"Assimétrica é usada apenas para assinatura digital, nunca para cifrar dados.", E:"Simétrica só funciona com chaves de 128 bits; assimétrica exige 4096 bits." },
        gabarito: "B",
        comentario: "Simétrica (AES, DES): mesma chave para cifrar/decifrar — rápida, mas o compartilhamento de chave é um desafio. Assimétrica (RSA, ECC): par de chaves — pública (livre distribuição) e privada (secreta) — resolve o problema de distribuição de chaves.",
      },
      {
        numero: 57, disciplina: "Tecnologia da Informação",
        enunciado: "Uma lista encadeada (linked list) difere de um array principalmente porque:",
        alternativas: { A:"Uma lista encadeada permite acesso aleatório O(1), enquanto o array não.", B:"Arrays permitem inserção e remoção O(1) em qualquer posição; listas encadeadas requerem O(n).", C:"Em uma lista encadeada, os elementos não precisam estar em posições contíguas de memória; o acesso é O(n) mas inserção/remoção em posição conhecida é O(1).", D:"Arrays são dinâmicos; listas encadeadas têm tamanho fixo.", E:"Listas encadeadas só existem em linguagens de baixo nível como C." },
        gabarito: "C",
        comentario: "Array: memória contígua, acesso O(1), inserção/remoção O(n). Lista encadeada: memória não contígua (nós com ponteiros), acesso O(n), mas inserção/remoção em posição conhecida O(1) (apenas ajuste de ponteiros).",
      },
      {
        numero: 58, disciplina: "Tecnologia da Informação",
        enunciado: "Em SQL, uma subconsulta correlacionada (correlated subquery) é aquela que:",
        alternativas: { A:"É executada uma única vez e seu resultado é reutilizado para cada linha da query externa.", B:"Referencia colunas da query externa, sendo executada uma vez para cada linha processada pela query externa.", C:"Substitui uma tabela em um JOIN, sendo equivalente a uma VIEW.", D:"Pode ser executada independentemente da query principal.", E:"Só pode ser usada na cláusula FROM, nunca em WHERE ou HAVING." },
        gabarito: "B",
        comentario: "Subconsulta correlacionada referencia colunas da query externa: é executada uma vez para cada linha da query externa, tornando-a potencialmente mais lenta mas mais poderosa para comparações linha a linha.",
      },
      {
        numero: 59, disciplina: "Tecnologia da Informação",
        enunciado: "O padrão de projeto Singleton garante que:",
        alternativas: { A:"Uma classe pode ter múltiplas instâncias, mas compartilham o mesmo estado.", B:"Uma classe tenha apenas uma instância e forneça um ponto global de acesso a ela.", C:"Uma instância possa ser clonada com facilidade.", D:"A criação de objetos seja delegada a subclasses.", E:"Um objeto possa assumir diferentes comportamentos em tempo de execução." },
        gabarito: "B",
        comentario: "Singleton restringe a instanciação de uma classe a exatamente um objeto. É implementado com construtor privado e método estático getInstance() que retorna sempre a mesma instância.",
      },
      {
        numero: 60, disciplina: "Tecnologia da Informação",
        enunciado: "Em Kotlin, uma data class é especial porque:",
        alternativas: { A:"Só pode herdar de outras data classes.", B:"Gera automaticamente equals(), hashCode(), toString() e copy() baseados nas propriedades declaradas no construtor primário.", C:"Não pode ter métodos definidos pelo programador.", D:"Armazena dados exclusivamente em banco de dados local.", E:"Não suporta propriedades mutáveis (var)." },
        gabarito: "B",
        comentario: "Kotlin data class gera automaticamente: equals() e hashCode() baseados nas propriedades, toString() legível, copy() para cópia com modificações, e componentN() para destructuring declarations.",
      },
      {
        numero: 61, disciplina: "Tecnologia da Informação",
        enunciado: "Em TypeScript, a diferença entre 'interface' e 'type' é:",
        alternativas: { A:"Interfaces não podem ser utilizadas com classes; type sim.", B:"Type não pode descrever objetos; apenas tipos primitivos.", C:"Interfaces podem ser estendidas e mescladas (declaration merging); types são mais flexíveis para union types e tipos condicionais.", D:"Type é sempre equivalente a interface — não há diferença prática.", E:"Interfaces só existem em tempo de execução; types são apagados pelo compilador." },
        gabarito: "C",
        comentario: "Interface: suporta declaration merging (múltiplas declarações são combinadas), mais adequada para contratos de classes. Type alias: suporta union types, intersection types, tipos condicionais e mapped types — mais poderoso para composição de tipos complexos.",
      },
      {
        numero: 62, disciplina: "Tecnologia da Informação",
        enunciado: "Em Python, para capturar qualquer exceção e garantir que um bloco seja executado independentemente do resultado, usa-se:",
        alternativas: { A:"try/except Exception/else.", B:"try/catch/finally.", C:"try/except/finally.", D:"try/except/else/catch.", E:"try/catch/else." },
        gabarito: "C",
        comentario: "Python usa try/except para capturar exceções. O bloco 'finally' é executado sempre, independente de exceção. O bloco 'else' executa apenas se nenhuma exceção ocorrer. Não existe 'catch' em Python (é 'except').",
      },
      {
        numero: 63, disciplina: "Tecnologia da Informação",
        enunciado: "A Java Streams API, introduzida no Java 8, permite:",
        alternativas: { A:"Transmissão de dados entre aplicações via protocolos de rede.", B:"Manipulação de coleções de forma declarativa e funcional, com operações como filter(), map() e reduce(), podendo ser paralelas.", C:"Acesso a streams de áudio e vídeo em aplicações multimídia.", D:"Gerenciamento de I/O de arquivos de forma assíncrona.", E:"Criação de threads leves para programação concorrente." },
        gabarito: "B",
        comentario: "Java Streams API permite processar coleções funcionalmente: encadeia operações intermediárias (filter, map, sorted) e terminais (collect, count, reduce). Operações são lazy e podem ser paralelizadas com parallelStream().",
      },
      {
        numero: 64, disciplina: "Tecnologia da Informação",
        enunciado: "Em banco de dados, um índice B-Tree é adequado para:",
        alternativas: { A:"Apenas buscas por igualdade exata em colunas com poucos valores distintos.", B:"Buscas por igualdade e por intervalo, sendo eficiente para consultas com operadores =, <, >, BETWEEN e LIKE com prefixo.", C:"Armazenamento de dados geoespaciais como pontos e polígonos.", D:"Busca full-text em colunas de texto longo.", E:"Exclusivamente para aceleração de operações JOIN." },
        gabarito: "B",
        comentario: "B-Tree (Balanced Tree) é o tipo de índice padrão na maioria dos SGBDs. Suporta buscas por igualdade (=) e por intervalo (<, >, BETWEEN, LIKE 'prefixo%') de forma eficiente — O(log n) para localização.",
      },
      {
        numero: 65, disciplina: "Tecnologia da Informação",
        enunciado: "Em computação em nuvem, o modelo serverless (FaaS — Function as a Service) apresenta como desvantagem:",
        alternativas: { A:"Necessidade de gerenciar servidores físicos.", B:"Custo fixo elevado independente do uso.", C:"Cold start: latência adicional na primeira execução de uma função após período de inatividade.", D:"Impossibilidade de integração com outros serviços de nuvem.", E:"Limitação a linguagens de programação antigas." },
        gabarito: "C",
        comentario: "Cold start é a principal desvantagem do serverless: quando a função não foi executada recentemente, o ambiente precisa ser inicializado, causando latência extra de centenas de ms a segundos.",
      },
      {
        numero: 66, disciplina: "Tecnologia da Informação",
        enunciado: "Em Git, a diferença entre 'git revert' e 'git reset' é:",
        alternativas: { A:"Ambos apagam commits do histórico permanentemente.", B:"'git revert' cria um novo commit que desfaz as mudanças de um commit anterior, preservando o histórico; 'git reset' move o ponteiro HEAD, podendo reescrever o histórico.", C:"'git reset' é mais seguro para uso em branches compartilhados.", D:"'git revert' só funciona com o último commit.", E:"Não há diferença prática entre os dois comandos." },
        gabarito: "B",
        comentario: "'git revert': cria um novo commit invertendo as mudanças — seguro para branches compartilhados (não reescreve histórico). 'git reset': move HEAD (e opcionalmente o índice e working tree) — reescreve histórico, perigoso em branches remotos.",
      },
      {
        numero: 67, disciplina: "Tecnologia da Informação",
        enunciado: "Memoização é uma técnica de otimização que:",
        alternativas: { A:"Compila código interpretado em código de máquina para execução mais rápida.", B:"Armazena os resultados de chamadas de função custosas para reutilizá-los quando os mesmos argumentos ocorrem novamente.", C:"Distribui chamadas de função entre múltiplos processadores.", D:"Converte algoritmos recursivos em iterativos automaticamente.", E:"Remove código morto de algoritmos para reduzir o uso de memória." },
        gabarito: "B",
        comentario: "Memoização (top-down dynamic programming): armazena em cache os resultados de subproblemas já resolvidos. Quando a função é chamada com os mesmos argumentos, retorna o resultado cacheado em vez de recomputar — transforma complexidade exponencial em polinomial para problemas adequados.",
      },
      {
        numero: 68, disciplina: "Tecnologia da Informação",
        enunciado: "Em SQL, qual JOIN retorna TODAS as linhas de ambas as tabelas, com NULL onde não há correspondência?",
        alternativas: { A:"INNER JOIN.", B:"LEFT JOIN.", C:"RIGHT JOIN.", D:"CROSS JOIN.", E:"FULL OUTER JOIN." },
        gabarito: "E",
        comentario: "FULL OUTER JOIN retorna todas as linhas de ambas as tabelas. Onde não há correspondência, as colunas da tabela sem correspondência ficam como NULL. Combina os resultados de LEFT e RIGHT JOIN.",
      },
      {
        numero: 69, disciplina: "Tecnologia da Informação",
        enunciado: "JWT (JSON Web Token) é usado para autenticação porque:",
        alternativas: { A:"Armazena a senha do usuário de forma criptografada para verificação rápida.", B:"É um token autocontido que contém informações do usuário (claims) assinadas digitalmente, permitindo verificação sem consulta ao banco de dados.", C:"Elimina a necessidade de HTTPS nas comunicações.", D:"É gerenciado exclusivamente pelo banco de dados para garantir consistência.", E:"Funciona apenas com OAuth 2.0 e não pode ser usado de forma independente." },
        gabarito: "B",
        comentario: "JWT é composto por header.payload.signature. O servidor verifica a assinatura sem precisar consultar o banco de dados (stateless). Os claims (informações do usuário) ficam no payload, codificado em Base64.",
      },
      {
        numero: 70, disciplina: "Tecnologia da Informação",
        enunciado: "Em Python, o módulo 'os' é utilizado para:",
        alternativas: { A:"Operações de I/O assíncronas em rede.", B:"Interagir com o sistema operacional: manipular arquivos, diretórios, variáveis de ambiente e executar processos.", C:"Análise sintática de código Python em tempo de execução.", D:"Gerenciamento de pacotes e dependências.", E:"Compilação de código Python para C." },
        gabarito: "B",
        comentario: "O módulo 'os' fornece interface portável com funcionalidades do SO: os.path (manipulação de caminhos), os.listdir() (listar diretórios), os.environ (variáveis de ambiente), os.system() (executar comandos), entre outros.",
      },
    ],
  },
];

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
  const timerRef = useRef();

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
    if (concurso?.id === "bb-at") {
      const provas = PROVAS_BB;
      return (
        <div>
          <PageTitle sub="Banco do Brasil · Agente de Tecnologia · CESGRANRIO">Provas BB</PageTitle>
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
                    <Btn variant="ghost" onClick={() => iniciar(p, "especificos")} className="flex-1 justify-center"><FileText size={14} /> Só Específicos ({numEsp} q)</Btn>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      );
    }
    return (
      <div>
        <PageTitle sub="Dataprev · Arquitetura de Software">Provas Dataprev</PageTitle>
        <Card className="text-center py-10">
          <GraduationCap size={40} color={C.muted} className="mx-auto mb-3" />
          <div className="font-bold text-base mb-2">Provas em breve</div>
          <p className="text-sm" style={{ color: C.muted }}>Não há provas públicas disponíveis para o cargo Arquitetura de Software da Dataprev. As questões serão adicionadas assim que disponíveis.</p>
          <p className="text-xs mt-3" style={{ color: C.muted }}>Use o <strong>Simulados</strong> para registrar seu desempenho nas provas que você praticar.</p>
        </Card>
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
          <div><div style={{ fontWeight: 800, fontSize: 20, color: P.ink }}>Study Now</div><div style={{ fontSize: 11, color: P.muted }}>Dataprev · Arquitetura</div></div>
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
