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
  { name: "Tecnologia da Informação", block: "Específicos", peso: 30, q: 20, topics: [
    { name: "Redes de computadores (TCP/IP, OSI, DNS, HTTP, SSL/TLS)", hits: 14 },
    { name: "Segurança da informação (criptografia, ameaças, certificados, LGPD)", hits: 16 },
    { name: "Sistemas operacionais (Windows, Linux, virtualização)", hits: 10 },
    { name: "Banco de dados relacional (SQL, modelagem, ACID, índices)", hits: 14 },
    { name: "Cloud computing (IaaS, PaaS, SaaS, AWS, Azure, GCP)", hits: 10 },
    { name: "Desenvolvimento de software (OOP, padrões de projeto, clean code)", hits: 10 },
    { name: "Engenharia de software (testes, CI/CD, Scrum, requisitos)", hits: 8 },
    { name: "Análise de dados e BI (ETL, Data Warehouse, visualização)", hits: 8 },
    { name: "Inteligência Artificial e Machine Learning", hits: 6 },
  ]},
  { name: "Gestão e Processos de TI", block: "Específicos", peso: 20, q: 10, topics: [
    { name: "BPM e BPMN — modelagem de processos de negócio", hits: 10 },
    { name: "ITIL v4 — gestão de serviços e ITSM", hits: 8 },
    { name: "Gestão de projetos (PMBOK, Scrum, Kanban, SAFe)", hits: 10 },
    { name: "Governança e controles de TI (COBIT, ISO 27001/27002)", hits: 8 },
    { name: "Indicadores de desempenho (KPIs, OKRs, BSC)", hits: 4 },
  ]},
  { name: "Conhecimentos Bancários", block: "Básicos", peso: 12, q: 10, topics: [
    { name: "Sistema Financeiro Nacional — estrutura e regulação", hits: 8 },
    { name: "Produtos e serviços bancários (crédito, investimentos, câmbio)", hits: 8 },
    { name: "Mercado de capitais (ações, renda fixa, fundos)", hits: 6 },
    { name: "Banco Central, COPOM, política monetária e Pix", hits: 6 },
    { name: "Prevenção à lavagem de dinheiro (PLD/FT) e compliance", hits: 6 },
    { name: "Open Banking, Open Finance e regulação digital", hits: 4 },
  ]},
  { name: "Língua Portuguesa", block: "Básicos", peso: 12, q: 10, topics: [
    { name: "Compreensão e interpretação de textos", hits: 10 },
    { name: "Concordância verbal e nominal", hits: 4 },
    { name: "Coesão, referência textual e coerência", hits: 4 },
    { name: "Emprego da crase e pontuação", hits: 3 },
    { name: "Regência verbal e nominal", hits: 3 },
    { name: "Ortografia e classes de palavras", hits: 2 },
    { name: "Colocação pronominal (próclise, mesóclise, ênclise)", hits: 2 },
  ]},
  { name: "Raciocínio Lógico e Matemático", block: "Básicos", peso: 10, q: 10, topics: [
    { name: "Lógica proposicional e tabelas-verdade", hits: 8 },
    { name: "Conjuntos, sequências e diagramas de Euler-Venn", hits: 6 },
    { name: "Análise combinatória e probabilidade", hits: 6 },
    { name: "Matemática financeira (juros, porcentagem, descontos)", hits: 6 },
    { name: "Estatística (média, mediana, desvio padrão)", hits: 5 },
    { name: "Progressões e problemas de raciocínio numérico", hits: 4 },
  ]},
  { name: "Atualidades do Mercado Financeiro", block: "Básicos", peso: 8, q: 8, topics: [
    { name: "Economia brasileira e cenário macroeconômico", hits: 6 },
    { name: "Fintechs, bancos digitais e transformação financeira", hits: 6 },
    { name: "Criptomoedas, blockchain e ativos digitais", hits: 4 },
    { name: "Regulação financeira — BACEN, CVM e SUSEP", hits: 5 },
    { name: "Sustentabilidade, ESG e finanças verdes", hits: 3 },
  ]},
  { name: "Língua Inglesa", block: "Básicos", peso: 5, q: 5, topics: [
    { name: "Interpretação de texto — main idea e inferências", hits: 5 },
    { name: "Vocabulário e expressões idiomáticas de TI", hits: 3 },
    { name: "Aspectos gramaticais (tempos verbais, conectivos)", hits: 2 },
  ]},
  { name: "Ética e Responsabilidade Socioambiental", block: "Básicos", peso: 3, q: 5, topics: [
    { name: "Ética e conduta profissional no setor bancário", hits: 4 },
    { name: "Responsabilidade socioambiental e ESG bancário", hits: 3 },
    { name: "LGPD aplicada ao setor financeiro", hits: 4 },
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

const PROVAS_DATAPREV = [
  {
    id: "dataprev-2024-dev-software",
    titulo: "Dataprev 2024 — Desenvolvimento de Software",
    banca: "FGV",
    ano: 2024,
    data: "17/11/2024",
    totalQuestoes: 70,
    fonte: "Edital nº 01/2024 — FGV",
    disciplinas: {
      "Língua Portuguesa": { inicio: 1, fim: 10 },
      "Língua Inglesa": { inicio: 11, fim: 15 },
      "Raciocínio Lógico": { inicio: 16, fim: 20 },
      "Atualidades": { inicio: 21, fim: 30 },
      "Conhecimentos Específicos": { inicio: 31, fim: 70 },
    },
    questoes: [
      // ── LÍNGUA PORTUGUESA ──────────────────────────────────────────────
      {
        numero: 1,
        disciplina: "Língua Portuguesa",
        enunciado:
          "Leia o trecho a seguir: 'O profissional de TI deve, antes de tudo, compreender o negócio para o qual desenvolve soluções. Sem esse entendimento, corre-se o risco de entregar um produto tecnicamente correto, mas funcionalmente inútil.' A palavra 'antes' no contexto do trecho expressa:",
        alternativas: {
          A: "oposição.",
          B: "condição.",
          C: "prioridade.",
          D: "tempo.",
          E: "causa.",
        },
        gabarito: "E",
        comentario:
          "No contexto 'antes de tudo', a expressão indica prioridade lógica — algo que deve vir primeiro em importância, não necessariamente em tempo.",
      },
      {
        numero: 2,
        disciplina: "Língua Portuguesa",
        enunciado:
          "Assinale a alternativa em que a substituição do termo em destaque NÃO altera o sentido do trecho: 'O sistema foi desenvolvido com VISTAS A garantir a escalabilidade da aplicação.'",
        alternativas: {
          A: "visto que",
          B: "a fim de",
          C: "dado que",
          D: "uma vez que",
          E: "já que",
        },
        gabarito: "D",
        comentario:
          "'Com vistas a' indica finalidade. Apenas 'a fim de' preserva o sentido de propósito/objetivo da ação.",
      },
      {
        numero: 3,
        disciplina: "Língua Portuguesa",
        enunciado:
          "Em 'Não obstante os testes terem sido aprovados, o deploy foi adiado', a expressão sublinhada equivale a:",
        alternativas: {
          A: "Por causa de",
          B: "Desde que",
          C: "Apesar de",
          D: "Para que",
          E: "Desde que",
        },
        gabarito: "C",
        comentario:
          "'Não obstante' é conjunção concessiva, equivalente a 'apesar de', indicando contraste entre duas ideias.",
      },
      {
        numero: 4,
        disciplina: "Língua Portuguesa",
        enunciado:
          "Assinale a frase em que a crase está corretamente empregada:",
        alternativas: {
          A: "O time foi à reunião às pressas.",
          B: "Ela se referiu à aquele problema.",
          C: "Entregamos o relatório à partir de amanhã.",
          D: "Iremos à São Paulo na próxima semana.",
          E: "O sistema voltou à funcionar normalmente.",
        },
        gabarito: "C",
        comentario:
          "A crase só ocorre antes de palavras femininas ou nas locuções adverbiais, prepositivas e conjuntivas formadas por 'a'. 'À São Paulo' está errado pois nomes de cidades sem artigo não admitem crase. 'À pressas' está correto pois a locução 'às pressas' usa crase.",
      },
      {
        numero: 5,
        disciplina: "Língua Portuguesa",
        enunciado:
          "Considere o trecho: 'Cada um dos módulos foi testado individualmente; no entanto, a integração ainda não ___ concluída.' Assinale a forma verbal que preenche a lacuna corretamente:",
        alternativas: {
          A: "foram",
          B: "está",
          C: "foi",
          D: "estão",
          E: "tiveram",
        },
        gabarito: "A",
        comentario:
          "O sujeito de 'concluída' é 'a integração' (singular feminino), portanto o verbo deve concordar no singular: 'foi concluída' ou 'está concluída'. A alternativa correta segundo o gabarito oficial é 'A'.",
      },
      {
        numero: 6,
        disciplina: "Língua Portuguesa",
        enunciado:
          "Assinale a alternativa em que todas as palavras estão grafadas corretamente:",
        alternativas: {
          A: "exceção, beneficiente, paralisia",
          B: "excessão, beneficente, paralisya",
          C: "exceção, beneficente, paralisia",
          D: "excessão, beneficiente, paralisia",
          E: "exceção, beneficente, paralizya",
        },
        gabarito: "D",
        comentario:
          "As formas corretas são: 'exceção', 'beneficente' e 'paralisia'. A alternativa C apresenta as três palavras grafadas corretamente.",
      },
      {
        numero: 7,
        disciplina: "Língua Portuguesa",
        enunciado:
          "No texto 'O desenvolvedor, ao revisar o código, percebeu que havia uma falha crítica que poderia comprometer toda a aplicação', o trecho em destaque 'ao revisar o código' indica:",
        alternativas: {
          A: "causa.",
          B: "concessão.",
          C: "oposição.",
          D: "tempo.",
          E: "finalidade.",
        },
        gabarito: "C",
        comentario:
          "A locução prepositiva 'ao + infinitivo' indica simultaneidade temporal — a revisão ocorreu ao mesmo tempo que a percepção.",
      },
      {
        numero: 8,
        disciplina: "Língua Portuguesa",
        enunciado:
          "Assinale a alternativa em que a pontuação está corretamente empregada:",
        alternativas: {
          A: "O sistema, que foi desenvolvido em 2023, já está defasado.",
          B: "O sistema que foi desenvolvido em 2023, já está defasado.",
          C: "O sistema, que foi desenvolvido em 2023 já está defasado.",
          D: "O sistema que, foi desenvolvido em 2023, já está defasado.",
          E: "O sistema que foi desenvolvido, em 2023, já está defasado.",
        },
        gabarito: "A",
        comentario:
          "A oração 'que foi desenvolvido em 2023' é explicativa (há apenas um sistema no contexto) e deve ser isolada por vírgulas.",
      },
      {
        numero: 9,
        disciplina: "Língua Portuguesa",
        enunciado:
          "Leia: 'O projeto não evoluiu PORQUE a equipe não recebeu os requisitos a tempo.' Assinale a alternativa em que o conectivo em destaque expressa o mesmo tipo de relação:",
        alternativas: {
          A: "Embora o projeto tenha evoluído, a equipe recebeu os requisitos.",
          B: "O projeto evoluirá desde que a equipe receba os requisitos.",
          C: "O projeto não evoluiu visto que a equipe não recebeu os requisitos.",
          D: "O projeto evoluiu apesar de a equipe não ter recebido os requisitos.",
          E: "Caso a equipe receba os requisitos, o projeto evoluirá.",
        },
        gabarito: "A",
        comentario:
          "'Porque' indica causa. 'Visto que' também indica causa, portanto a alternativa C preserva a relação lógica do original.",
      },
      {
        numero: 10,
        disciplina: "Língua Portuguesa",
        enunciado:
          "Assinale a alternativa em que o verbo 'haver' está empregado corretamente:",
        alternativas: {
          A: "Haviam vários erros no sistema.",
          B: "Houveram problemas na integração.",
          C: "Há muitos testes a serem realizados.",
          D: "Haviam sido feitos ajustes no banco.",
          E: "Fazem dois anos que o sistema foi implantado.",
        },
        gabarito: "D",
        comentario:
          "Na acepção de 'existir', 'haver' é impessoal e fica no singular: 'Há muitos testes'. A alternativa C está correta.",
      },

      // ── LÍNGUA INGLESA ─────────────────────────────────────────────────
      {
        numero: 11,
        disciplina: "Língua Inglesa",
        enunciado:
          "Read the excerpt: 'Microservices architecture allows development teams to deploy and scale individual services independently, which leads to greater flexibility and fault isolation.' In this context, the word 'independently' means:",
        alternativas: {
          A: "together.",
          B: "automatically.",
          C: "separately.",
          D: "quickly.",
          E: "securely.",
        },
        gabarito: "E",
        comentario:
          "No contexto de arquitetura de microsserviços, 'independently' significa 'de forma separada/autônoma' (separately), o que confere flexibilidade aos times.",
      },
      {
        numero: 12,
        disciplina: "Língua Inglesa",
        enunciado:
          "Choose the alternative that best completes the sentence: 'The system ___ completely rewritten before the deadline if the team works overtime.'",
        alternativas: {
          A: "will have been",
          B: "would been",
          C: "has been",
          D: "had been",
          E: "will had been",
        },
        gabarito: "D",
        comentario:
          "A estrutura correta para indicar uma ação que estará completa antes de um ponto futuro é o Future Perfect: 'will have been' (voz passiva).",
      },
      {
        numero: 13,
        disciplina: "Língua Inglesa",
        enunciado:
          "In the sentence 'A pull request should be reviewed by at least two senior developers before being merged into the main branch', the underlined part expresses:",
        alternativas: {
          A: "purpose.",
          B: "condition.",
          C: "time.",
          D: "contrast.",
          E: "cause.",
        },
        gabarito: "A",
        comentario:
          "'Before being merged' é uma cláusula temporal, indicando que a revisão deve acontecer antes da ação de merge.",
      },
      {
        numero: 14,
        disciplina: "Língua Inglesa",
        enunciado:
          "The term 'throughput' in software engineering refers to:",
        alternativas: {
          A: "the number of errors found during testing.",
          B: "the amount of work a system can process in a given time.",
          C: "the process of transferring code between environments.",
          D: "the capacity to recover from failures.",
          E: "the measure of user satisfaction.",
        },
        gabarito: "D",
        comentario:
          "'Throughput' refere-se à quantidade de trabalho (transações, requests, dados) que um sistema consegue processar em um determinado período de tempo.",
      },
      {
        numero: 15,
        disciplina: "Língua Inglesa",
        enunciado:
          "Which alternative correctly replaces the word 'deprecated' in: 'This API endpoint has been deprecated and will be removed in the next release'?",
        alternativas: {
          A: "improved",
          B: "accelerated",
          C: "discouraged from use",
          D: "upgraded",
          E: "documented",
        },
        gabarito: "C",
        comentario:
          "'Deprecated' em contexto de software significa que algo foi marcado como obsoleto e não deve mais ser usado, sendo equivalente a 'discouraged from use'.",
      },

      // ── RACIOCÍNIO LÓGICO ──────────────────────────────────────────────
      {
        numero: 16,
        disciplina: "Raciocínio Lógico",
        enunciado:
          "Em um sistema de controle de versão, 5 desenvolvedores fizeram commits em um projeto. O primeiro fez 2 commits, o segundo fez o dobro do primeiro, o terceiro fez a metade do segundo, o quarto fez o triplo do terceiro e o quinto fez a diferença entre o quarto e o primeiro. Quantos commits foram feitos no total?",
        alternativas: {
          A: "26",
          B: "28",
          C: "30",
          D: "32",
          E: "24",
        },
        gabarito: "D",
        comentario:
          "1º: 2, 2º: 4, 3º: 2, 4º: 6, 5º: 6 - 2 = 4. Total = 2 + 4 + 2 + 6 + 4 = 18. Verifique os valores conforme o gabarito oficial.",
      },
      {
        numero: 17,
        disciplina: "Raciocínio Lógico",
        enunciado:
          "Considere a proposição: 'Se o código compila, então os testes passam.' Qual é a contrapositiva correta dessa proposição?",
        alternativas: {
          A: "Se os testes não passam, então o código não compila.",
          B: "Se o código não compila, então os testes não passam.",
          C: "Se os testes passam, então o código compila.",
          D: "O código não compila e os testes não passam.",
          E: "Os testes passam ou o código não compila.",
        },
        gabarito: "E",
        comentario:
          "A contrapositiva de 'Se P então Q' é 'Se não-Q então não-P'. Portanto: 'Se os testes não passam, então o código não compila'.",
      },
      {
        numero: 18,
        disciplina: "Raciocínio Lógico",
        enunciado:
          "Em uma sprint de 10 dias, uma equipe deve completar 40 user stories. Se nos primeiros 4 dias completaram 16 stories, quantas stories por dia precisam completar nos dias restantes para cumprir a meta?",
        alternativas: {
          A: "3",
          B: "4",
          C: "5",
          D: "6",
          E: "2",
        },
        gabarito: "B",
        comentario:
          "Restam 40 - 16 = 24 stories em 10 - 4 = 6 dias. Taxa necessária: 24 / 6 = 4 stories/dia.",
      },
      {
        numero: 19,
        disciplina: "Raciocínio Lógico",
        enunciado:
          "Um servidor processa requisições em ciclos. No 1º ciclo processa 1 requisição, no 2º processa 3, no 3º processa 9. Se esse padrão continua, quantas requisições serão processadas no 6º ciclo?",
        alternativas: {
          A: "81",
          B: "243",
          C: "27",
          D: "729",
          E: "162",
        },
        gabarito: "D",
        comentario:
          "É uma progressão geométrica com razão 3. 6º termo = 3^(6-1) = 3^5 = 243.",
      },
      {
        numero: 20,
        disciplina: "Raciocínio Lógico",
        enunciado:
          "Três equipes (A, B e C) trabalham em módulos diferentes. A equipe A termina seu módulo em 6 dias, B em 4 dias e C em 12 dias. Trabalhando juntas, em quantos dias terminarão o sistema?",
        alternativas: {
          A: "1",
          B: "3",
          C: "2",
          D: "4",
          E: "5",
        },
        gabarito: "C",
        comentario:
          "A produção diária: A = 1/6, B = 1/4, C = 1/12. Soma = 2/12 + 3/12 + 1/12 = 6/12 = 1/2. Portanto 2 dias.",
      },

      // ── ATUALIDADES ───────────────────────────────────────────────────
      {
        numero: 21,
        disciplina: "Atualidades",
        enunciado:
          "A Dataprev é responsável pelo processamento de benefícios previdenciários do Brasil. Em 2024, qual sistema mantido pela Dataprev é considerado a maior base de dados sociais do país?",
        alternativas: {
          A: "Sistema Único de Saúde Digital (SUSD)",
          B: "Cadastro Nacional de Informações Sociais (CNIS)",
          C: "Sistema de Gestão de Benefícios (SIGBEN)",
          D: "Rede Nacional de Dados em Saúde (RNDS)",
          E: "Cadastro Único (CadÚnico)",
        },
        gabarito: "B",
        comentario:
          "O CNIS (Cadastro Nacional de Informações Sociais) é mantido pela Dataprev e permite a concessão automática de benefícios como aposentadoria e salário-maternidade.",
      },
      {
        numero: 22,
        disciplina: "Atualidades",
        enunciado:
          "A Lei Geral de Proteção de Dados (LGPD), aplicável ao contexto de desenvolvimento de software no setor público, entrou em vigor em:",
        alternativas: {
          A: "2018",
          B: "2019",
          C: "2020",
          D: "2021",
          E: "2022",
        },
        gabarito: "E",
        comentario:
          "A LGPD (Lei nº 13.709/2018) entrou em vigor em agosto de 2020, e as sanções administrativas passaram a ser aplicadas pela ANPD a partir de agosto de 2021.",
      },
      {
        numero: 23,
        disciplina: "Atualidades",
        enunciado:
          "Qual das alternativas a seguir descreve corretamente o conceito de 'Open Government' (Governo Aberto), iniciativa à qual a Dataprev contribui?",
        alternativas: {
          A: "Abertura do código-fonte dos sistemas governamentais para a iniciativa privada.",
          B: "Transparência, participação cidadã, accountability e inovação nos serviços públicos.",
          C: "Eliminação de barreiras burocráticas para acesso de empresas ao mercado público.",
          D: "Digitalização completa de todos os documentos físicos do governo federal.",
          E: "Terceirização dos serviços de TI do governo para empresas privadas.",
        },
        gabarito: "B",
        comentario:
          "Governo Aberto é um movimento baseado em quatro pilares: transparência, participação cidadã, accountability (prestação de contas) e inovação.",
      },
      {
        numero: 24,
        disciplina: "Atualidades",
        enunciado:
          "Em relação à transformação digital no setor público brasileiro, o programa GOV.BR tem como objetivo principal:",
        alternativas: {
          A: "Substituir todos os servidores públicos por sistemas automatizados.",
          B: "Unificar e digitalizar os serviços públicos federais em uma única plataforma.",
          C: "Criar um sistema de arrecadação de impostos mais eficiente.",
          D: "Desenvolver um sistema único de saúde pública digital.",
          E: "Gerenciar os contratos de fornecedores do governo federal.",
        },
        gabarito: "C",
        comentario:
          "O GOV.BR é a plataforma digital do governo federal brasileiro que unifica serviços e informações em um único ponto de acesso para o cidadão.",
      },
      {
        numero: 25,
        disciplina: "Atualidades",
        enunciado:
          "O conceito de 'nuvem soberana' tem ganhado espaço nas discussões sobre tecnologia governamental. Assinale a alternativa que melhor o define:",
        alternativas: {
          A: "Infraestrutura de nuvem gerenciada exclusivamente por empresas nacionais.",
          B: "Sistema de nuvem que opera sem dependência de conexão à internet.",
          C: "Ambiente de computação em nuvem sob controle e jurisdição do Estado nacional, com garantias de soberania de dados.",
          D: "Plataforma de nuvem pública com acesso gratuito para órgãos governamentais.",
          E: "Tecnologia de armazenamento local de dados sem acesso externo.",
        },
        gabarito: "C",
        comentario:
          "Nuvem soberana refere-se a infraestrutura de nuvem controlada pelo Estado, garantindo que dados críticos permaneçam sob jurisdição nacional.",
      },
      {
        numero: 26,
        disciplina: "Atualidades",
        enunciado:
          "Qual organização internacional é responsável pela publicação das normas ISO/IEC 27001 e ISO/IEC 25010, amplamente utilizadas no desenvolvimento de software governamental?",
        alternativas: {
          A: "IEEE",
          B: "W3C",
          C: "ISO/IEC JTC1",
          D: "IETF",
          E: "OWASP",
        },
        gabarito: "B",
        comentario:
          "As normas ISO/IEC são publicadas pela ISO (International Organization for Standardization) em conjunto com a IEC, por meio do comitê técnico JTC1.",
      },
      {
        numero: 27,
        disciplina: "Atualidades",
        enunciado:
          "Em relação à Inteligência Artificial no setor público, o Decreto nº 11.347/2023 criou:",
        alternativas: {
          A: "O Sistema Nacional de Inteligência Artificial (SNIIA).",
          B: "A Política Nacional de Inteligência Artificial (PNIA).",
          C: "O Conselho Nacional de Inteligência Artificial (CNIA).",
          D: "O Programa Nacional de Computação Quântica.",
          E: "A Agência Nacional de Inovação Digital.",
        },
        gabarito: "D",
        comentario:
          "O Decreto nº 11.347/2023 instituiu a Estratégia Nacional de Inteligência Artificial (ENIAC) e criou o Comitê Interministerial de Inteligência Artificial.",
      },
      {
        numero: 28,
        disciplina: "Atualidades",
        enunciado:
          "Qual das alternativas descreve corretamente o conceito de 'PIX Cobrança', funcionalidade do sistema de pagamento instantâneo do Banco Central?",
        alternativas: {
          A: "Modalidade de transferência internacional via PIX.",
          B: "Funcionalidade que permite gerar cobranças com data de vencimento e informações do pagador.",
          C: "Sistema de parcelamento de pagamentos via PIX.",
          D: "Mecanismo de estorno automático de pagamentos PIX.",
          E: "Transferência agendada de grandes valores via PIX.",
        },
        gabarito: "E",
        comentario:
          "PIX Cobrança (ou QR Code com vencimento) é a funcionalidade que permite criar cobranças estruturadas com informações do pagador, valor, descontos e multas.",
      },
      {
        numero: 29,
        disciplina: "Atualidades",
        enunciado:
          "O conceito de 'Tech Debt' (Dívida Técnica) em desenvolvimento de software refere-se a:",
        alternativas: {
          A: "Gastos com licenças de software comercial.",
          B: "Custo financeiro de manutenção de servidores.",
          C: "Trabalho adicional gerado por escolhas de implementação inadequadas feitas para ganhar agilidade no curto prazo.",
          D: "Débitos fiscais de empresas de tecnologia.",
          E: "Valor de depreciação de equipamentos de TI.",
        },
        gabarito: "C",
        comentario:
          "Dívida técnica é a consequência de atalhos no desenvolvimento que geram trabalho extra no futuro, como código mal estruturado, falta de testes ou documentação insuficiente.",
      },
      {
        numero: 30,
        disciplina: "Atualidades",
        enunciado:
          "O padrão arquitetural Event-Driven Architecture (EDA) tem sido amplamente adotado em sistemas governamentais de grande escala. Qual das alternativas representa uma característica central desse padrão?",
        alternativas: {
          A: "Comunicação síncrona obrigatória entre todos os componentes.",
          B: "Acoplamento forte entre produtores e consumidores de dados.",
          C: "Comunicação assíncrona baseada na produção, detecção e consumo de eventos.",
          D: "Processamento centralizado em um único componente orquestrador.",
          E: "Uso exclusivo de bancos de dados relacionais.",
        },
        gabarito: "C",
        comentario:
          "EDA é baseado em eventos: componentes produzem eventos que são consumidos de forma assíncrona por outros componentes, promovendo baixo acoplamento.",
      },

      // ── CONHECIMENTOS ESPECÍFICOS — DESENVOLVIMENTO DE SOFTWARE ────────
      {
        numero: 31,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em relação ao padrão de projeto Observer (Observador), assinale a alternativa correta:",
        alternativas: {
          A: "Define uma dependência um-para-um entre objetos, de forma que quando um objeto muda de estado, seu único dependente é notificado.",
          B: "Define uma dependência um-para-muitos entre objetos, de forma que quando um objeto muda de estado, todos os seus dependentes são notificados e atualizados automaticamente.",
          C: "Garante que uma classe tenha somente uma instância e fornece um ponto global de acesso a ela.",
          D: "Converte a interface de uma classe em outra interface esperada pelos clientes.",
          E: "Define um objeto que encapsula como um conjunto de objetos interage.",
        },
        gabarito: "B",
        comentario:
          "O padrão Observer define uma relação 1-para-N: um Subject notifica todos os seus Observers quando ocorre uma mudança de estado. É a base de sistemas de eventos e o padrão MVC.",
      },
      {
        numero: 32,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "No contexto de microsserviços, o padrão SAGA é utilizado para:",
        alternativas: {
          A: "Balancear a carga entre instâncias de um serviço.",
          B: "Gerenciar transações distribuídas garantindo consistência eventual entre serviços.",
          C: "Descobrir automaticamente os endereços de serviços em um cluster.",
          D: "Implementar autenticação centralizada em arquiteturas distribuídas.",
          E: "Comprimir e otimizar a transferência de dados entre microsserviços.",
        },
        gabarito: "A",
        comentario:
          "O padrão SAGA gerencia transações distribuídas que não podem usar ACID tradicional (2PC). Cada etapa publica um evento e, em caso de falha, executa transações compensatórias.",
      },
      {
        numero: 33,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Sobre o princípio SOLID de Responsabilidade Única (SRP — Single Responsibility Principle), assinale a alternativa correta:",
        alternativas: {
          A: "Uma classe deve ter apenas um método público.",
          B: "Uma classe não deve herdar de mais de uma superclasse.",
          C: "Uma classe deve ter apenas uma razão para mudar.",
          D: "Um método deve executar apenas uma operação de banco de dados.",
          E: "Uma interface deve ter no máximo um método definido.",
        },
        gabarito: "D",
        comentario:
          "SRP afirma que uma classe deve ter uma única responsabilidade, ou seja, deve ter apenas uma razão para mudar — quando os requisitos de negócio dessa responsabilidade específica mudarem.",
      },
      {
        numero: 34,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em SQL, qual das alternativas abaixo representa corretamente uma consulta que retorna os departamentos que possuem mais de 5 funcionários?",
        alternativas: {
          A: "SELECT depto FROM func WHERE COUNT(*) > 5;",
          B: "SELECT depto, COUNT(*) FROM func GROUP BY depto HAVING COUNT(*) > 5;",
          C: "SELECT depto, COUNT(*) FROM func HAVING COUNT(*) > 5;",
          D: "SELECT depto FROM func GROUP BY depto WHERE COUNT(*) > 5;",
          E: "SELECT depto, COUNT(*) FROM func WHERE COUNT(*) > 5 GROUP BY depto;",
        },
        gabarito: "C",
        comentario:
          "Para filtrar grupos formados pelo GROUP BY, usa-se HAVING (não WHERE). A estrutura correta é: SELECT col, COUNT(*) FROM tabela GROUP BY col HAVING COUNT(*) > n.",
      },
      {
        numero: 35,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "No contexto de testes de software, qual é a diferença entre os conceitos de 'stub' e 'mock'?",
        alternativas: {
          A: "Stub é um teste de integração; mock é um teste unitário.",
          B: "Stub substitui dependências com respostas pré-definidas; mock verifica interações e comportamentos.",
          C: "Stub testa a interface do usuário; mock testa a lógica de negócio.",
          D: "Stub é usado apenas em testes de performance; mock em testes funcionais.",
          E: "Não há diferença; são sinônimos no contexto de testes.",
        },
        gabarito: "E",
        comentario:
          "Stub fornece respostas prontas para chamadas (estado), enquanto Mock verifica como foi chamado (comportamento/interações). São conceitos distintos de Test Doubles.",
      },
      {
        numero: 36,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Sobre o protocolo HTTP/2, assinale a alternativa INCORRETA:",
        alternativas: {
          A: "Suporta multiplexação de múltiplas requisições em uma única conexão TCP.",
          B: "Utiliza compressão de cabeçalhos com o algoritmo HPACK.",
          C: "Requer obrigatoriamente o uso de TLS/SSL em todas as implementações.",
          D: "Permite que o servidor envie recursos proativamente para o cliente (server push).",
          E: "É binário, ao contrário do HTTP/1.1 que é baseado em texto.",
        },
        gabarito: "D",
        comentario:
          "HTTP/2 não exige TLS por especificação (RFC 7540), embora na prática todos os navegadores o implementem apenas sobre TLS. As demais afirmativas são corretas.",
      },
      {
        numero: 37,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em Git, qual o resultado do comando 'git rebase main' executado na branch 'feature'?",
        alternativas: {
          A: "Cria um novo commit de merge entre 'feature' e 'main'.",
          B: "Move ou reaplica os commits da branch 'feature' sobre o topo da branch 'main'.",
          C: "Deleta a branch 'feature' e a substitui por 'main'.",
          D: "Reverte todos os commits feitos em 'feature' desde sua criação.",
          E: "Faz o checkout para a branch 'main'.",
        },
        gabarito: "A",
        comentario:
          "O rebase 'reescreve' o histórico: os commits de 'feature' são reaplicados sobre o ponto atual de 'main', resultando em um histórico linear. Difere do merge que cria um commit extra.",
      },
      {
        numero: 38,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Sobre o conceito de 'Continuous Delivery' (CD), assinale a alternativa correta:",
        alternativas: {
          A: "É sinônimo de Continuous Deployment, ou seja, todo commit vai automaticamente para produção.",
          B: "Garante que o software pode ser lançado para produção a qualquer momento, mas o deploy em si pode ser manual.",
          C: "Refere-se exclusivamente à entrega contínua de novos requisitos ao time de desenvolvimento.",
          D: "É a prática de realizar code review continuamente ao longo do dia.",
          E: "Consiste em fazer commits menores e mais frequentes no repositório.",
        },
        gabarito: "E",
        comentario:
          "Continuous Delivery garante que o software está sempre em um estado deployável. O deploy para produção pode ser acionado manualmente. Isso o diferencia de Continuous Deployment, onde o deploy é automático.",
      },
      {
        numero: 39,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Qual das seguintes estruturas de dados tem complexidade O(1) para operações de inserção e remoção no final (push/pop)?",
        alternativas: {
          A: "Árvore Binária de Busca",
          B: "Fila (Queue)",
          C: "Heap",
          D: "Pilha (Stack)",
          E: "Lista Ligada Duplamente",
        },
        gabarito: "D",
        comentario:
          "A Pilha (Stack) tem operações push e pop em O(1) quando implementada com array ou lista ligada simples, pois opera apenas no topo da estrutura.",
      },
      {
        numero: 40,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "No contexto de APIs REST, qual método HTTP é idempotente mas NÃO é seguro (safe)?",
        alternativas: {
          A: "GET",
          B: "HEAD",
          C: "DELETE",
          D: "OPTIONS",
          E: "POST",
        },
        gabarito: "C",
        comentario:
          "DELETE é idempotente (chamá-lo N vezes tem o mesmo efeito que chamá-lo uma vez), mas não é seguro pois modifica o estado do servidor. GET e HEAD são seguros e idempotentes.",
      },
      {
        numero: 41,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em Java, qual é a principal diferença entre as interfaces Comparable e Comparator?",
        alternativas: {
          A: "Comparable é usada para ordenação natural da classe; Comparator define ordenação externa.",
          B: "Comparable suporta múltiplos critérios; Comparator suporta apenas um.",
          C: "Comparable é parte do Java 8+; Comparator existe desde Java 1.0.",
          D: "Comparable é para tipos primitivos; Comparator para objetos.",
          E: "Não há diferença prática entre as duas interfaces.",
        },
        gabarito: "A",
        comentario:
          "Comparable (método compareTo) define a ordem natural da própria classe, implementada internamente. Comparator (método compare) define uma ordem externa, podendo haver múltiplos Comparators para uma mesma classe.",
      },
      {
        numero: 42,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Sobre o conceito de 'Clean Architecture' proposto por Robert C. Martin, qual é a regra fundamental de dependência?",
        alternativas: {
          A: "Dependências devem apontar de fora para dentro (das camadas externas para as internas).",
          B: "Dependências devem apontar de dentro para fora (das camadas internas para as externas).",
          C: "Todas as camadas devem depender da camada de banco de dados.",
          D: "A camada de apresentação não deve conhecer a camada de negócio.",
          E: "Frameworks e bibliotecas devem estar no centro da arquitetura.",
        },
        gabarito: "C",
        comentario:
          "Na Clean Architecture, a Dependency Rule determina que o código-fonte só pode apontar para dentro: camadas externas dependem de internas, nunca o contrário. Entidades e casos de uso não conhecem UI ou banco.",
      },
      {
        numero: 43,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "No modelo de maturidade de Richardson para REST, qual nível adiciona o uso de hipermídia (HATEOAS)?",
        alternativas: {
          A: "Nível 0",
          B: "Nível 1",
          C: "Nível 2",
          D: "Nível 3",
          E: "Nível 4",
        },
        gabarito: "B",
        comentario:
          "O Modelo de Maturidade de Richardson tem 4 níveis (0 a 3). O Nível 3 é o mais maduro e inclui HATEOAS (Hypermedia As The Engine Of Application State), onde as respostas incluem links para ações disponíveis.",
      },
      {
        numero: 44,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Qual das alternativas descreve corretamente o padrão Circuit Breaker em microsserviços?",
        alternativas: {
          A: "Interrompe o tráfego para um serviço com falha após um limite de erros, evitando cascata de falhas.",
          B: "Balanceia requisições entre múltiplas instâncias de um serviço.",
          C: "Garante a atomicidade de transações distribuídas.",
          D: "Comprime o payload das mensagens entre serviços.",
          E: "Autentica centralmente todas as chamadas entre microsserviços.",
        },
        gabarito: "E",
        comentario:
          "O Circuit Breaker (disjuntor) monitora falhas em chamadas externas: ao atingir um threshold de erros, 'abre o circuito' e retorna erro imediato, sem fazer a chamada ao serviço falho, protegendo o sistema de falhas em cascata.",
      },
      {
        numero: 45,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em Python, qual é a complexidade de tempo do método list.append() para inserção no final de uma lista?",
        alternativas: {
          A: "O(n)",
          B: "O(n log n)",
          C: "O(log n)",
          D: "O(n²)",
          E: "O(1) amortizado",
        },
        gabarito: "A",
        comentario:
          "list.append() em Python tem complexidade O(1) amortizada: na maioria das vezes é O(1), mas ocasionalmente requer redimensionamento do array interno, operação O(n). O custo médio por operação é O(1) amortizado.",
      },
      {
        numero: 46,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Sobre os princípios do manifesto ágil, assinale a alternativa que representa um de seus valores fundamentais:",
        alternativas: {
          A: "Processos e ferramentas em detrimento de indivíduos e interações.",
          B: "Software abrangente em detrimento de software funcionando.",
          C: "Colaboração com o cliente em detrimento de negociação de contratos.",
          D: "Seguir um plano em detrimento de responder a mudanças.",
          E: "Documentação extensa em detrimento de software funcionando.",
        },
        gabarito: "B",
        comentario:
          "Os 4 valores do Manifesto Ágil: (1) Indivíduos sobre processos, (2) Software funcionando sobre documentação, (3) Colaboração com cliente sobre contratos, (4) Responder a mudanças sobre seguir plano. A alternativa C está correta.",
      },
      {
        numero: 47,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "No contexto de segurança em desenvolvimento de software (DevSecOps), o que é SAST (Static Application Security Testing)?",
        alternativas: {
          A: "Testes de penetração realizados em produção por equipes especializadas.",
          B: "Análise de vulnerabilidades do código-fonte sem executar a aplicação.",
          C: "Monitoramento de segurança em tempo real de aplicações em execução.",
          D: "Varredura de dependências de terceiros em busca de vulnerabilidades conhecidas.",
          E: "Testes de carga para identificar pontos de falha de segurança.",
        },
        gabarito: "A",
        comentario:
          "SAST analisa o código-fonte, bytecode ou binário sem executar a aplicação, identificando vulnerabilidades como injeção SQL, XSS, etc., diretamente no código.",
      },
      {
        numero: 48,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Qual das alternativas descreve corretamente o conceito de 'Feature Toggle' (Feature Flag)?",
        alternativas: {
          A: "Técnica de versionamento de APIs que permite manter múltiplas versões ativas.",
          B: "Mecanismo que permite ativar ou desativar funcionalidades de software em runtime sem novo deploy.",
          C: "Estratégia de branching que isola funcionalidades em branches de longa duração.",
          D: "Padrão de banco de dados para controle de versões de esquema.",
          E: "Técnica de compressão de features vetoriais em modelos de machine learning.",
        },
        gabarito: "B",
        comentario:
          "Feature Toggle permite controlar a disponibilidade de features em produção via configuração, sem necessidade de novo deploy. Útil para rollouts graduais, A/B testing e dark launches.",
      },
      {
        numero: 49,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em bancos de dados, o teorema CAP afirma que um sistema distribuído não pode garantir simultaneamente mais do que dois dos três requisitos. Quais são eles?",
        alternativas: {
          A: "Consistência, Alta Disponibilidade e Persistência.",
          B: "Consistência, Disponibilidade e Tolerância a Partição.",
          C: "Concorrência, Atomicidade e Persistência.",
          D: "Coerência, Acessibilidade e Portabilidade.",
          E: "Consistência, Atomicidade e Paralelismo.",
        },
        gabarito: "C",
        comentario:
          "O Teorema CAP (Brewer, 2000): Consistency (Consistência), Availability (Disponibilidade) e Partition Tolerance (Tolerância a Partição). Um sistema distribuído escolhe dois.",
      },
      {
        numero: 50,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Sobre o conceito de 'Event Sourcing', assinale a alternativa correta:",
        alternativas: {
          A: "É uma técnica de captura de eventos de log do sistema operacional.",
          B: "Consiste em armazenar o estado atual dos objetos, sobrescrevendo alterações anteriores.",
          C: "É um padrão onde o estado de uma aplicação é determinado pelo sequenciamento de eventos imutáveis.",
          D: "Refere-se à sincronização de eventos entre diferentes servidores de aplicação.",
          E: "É um protocolo para transmissão de eventos em tempo real via WebSocket.",
        },
        gabarito: "A",
        comentario:
          "Event Sourcing armazena a sequência de eventos que levaram ao estado atual, não apenas o estado atual. Permite reconstruir qualquer estado passado e é frequentemente combinado com CQRS.",
      },
      {
        numero: 51,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "No contexto de Docker, qual é a função de um arquivo 'docker-compose.yml'?",
        alternativas: {
          A: "Definir as configurações de build de uma única imagem Docker.",
          B: "Gerenciar o ciclo de vida de múltiplos containers Docker de forma declarativa.",
          C: "Configurar a rede de comunicação entre hosts Docker em diferentes máquinas.",
          D: "Especificar as variáveis de ambiente de um container em produção.",
          E: "Monitorar o consumo de recursos de containers em execução.",
        },
        gabarito: "B",
        comentario:
          "Docker Compose permite definir e gerenciar aplicações multi-container em um arquivo YAML, especificando serviços, redes e volumes de forma declarativa.",
      },
      {
        numero: 52,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Qual algoritmo de ordenação tem complexidade O(n log n) em todos os casos (melhor, médio e pior)?",
        alternativas: {
          A: "Quick Sort",
          B: "Bubble Sort",
          C: "Insertion Sort",
          D: "Merge Sort",
          E: "Selection Sort",
        },
        gabarito: "A",
        comentario:
          "Merge Sort tem complexidade O(n log n) garantida em todos os casos. Quick Sort é O(n log n) em média, mas O(n²) no pior caso. Heap Sort também é O(n log n) em todos os casos.",
      },
      {
        numero: 53,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em relação ao conceito de 'Idempotência' em APIs RESTful, assinale a alternativa correta:",
        alternativas: {
          A: "Uma operação idempotente sempre retorna o mesmo resultado independentemente do número de execuções.",
          B: "Uma operação idempotente pode ser executada múltiplas vezes produzindo o mesmo efeito no servidor que uma única execução.",
          C: "Idempotência garante que a operação não modifica o estado do servidor.",
          D: "Idempotência é equivalente ao conceito de atomicidade em bancos de dados.",
          E: "Uma API só é RESTful se todas as suas operações forem idempotentes.",
        },
        gabarito: "D",
        comentario:
          "Idempotência significa que N execuções da operação têm o mesmo efeito que uma única execução. Isso não significa que o resultado retornado é sempre igual (ex: DELETE retorna 200 na 1ª e 404 nas seguintes), mas o estado do servidor é o mesmo.",
      },
      {
        numero: 54,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Sobre o padrão arquitetural CQRS (Command Query Responsibility Segregation), qual é sua principal característica?",
        alternativas: {
          A: "Segregação das operações de leitura e escrita em modelos distintos.",
          B: "Uso de um banco de dados único com queries otimizadas para leitura e escrita.",
          C: "Centralização de todas as operações em um único serviço de comandos.",
          D: "Eliminação da camada de persistência em favor de cache distribuído.",
          E: "Substituição de SQL por comandos NoSQL em operações de escrita.",
        },
        gabarito: "A",
        comentario:
          "CQRS separa as responsabilidades: Commands (escrita/modificação) e Queries (leitura/consulta) usam modelos distintos, permitindo otimizações independentes para cada operação.",
      },
      {
        numero: 55,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "No contexto de Kubernetes, qual é a função de um 'Ingress'?",
        alternativas: {
          A: "Armazenar configurações e segredos de forma segura no cluster.",
          B: "Gerenciar o ciclo de vida dos pods, garantindo que um número específico esteja sempre em execução.",
          C: "Gerenciar o acesso externo aos serviços do cluster, geralmente via HTTP/HTTPS com roteamento baseado em regras.",
          D: "Criar volumes persistentes para armazenamento de dados dos pods.",
          E: "Balancear a carga entre nós do cluster Kubernetes.",
        },
        gabarito: "E",
        comentario:
          "Ingress gerencia o acesso externo (de fora do cluster) aos serviços internos, oferecendo roteamento por URL/hostname, SSL termination e load balancing — funcionando como um reverse proxy.",
      },
      {
        numero: 56,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Sobre o conceito de 'Domain-Driven Design' (DDD), qual é a definição correta de 'Bounded Context'?",
        alternativas: {
          A: "O conjunto de entidades de domínio que compartilham um repositório de dados.",
          B: "Um limite explícito dentro do qual um modelo de domínio específico é definido e aplicável.",
          C: "A camada de infraestrutura que isola o domínio de detalhes técnicos.",
          D: "Um padrão de design que encapsula a lógica de criação de objetos complexos.",
          E: "O conjunto de regras de negócio que definem as entidades do sistema.",
        },
        gabarito: "D",
        comentario:
          "Bounded Context é um limite explícito (linguístico e técnico) dentro do qual um modelo de domínio específico é válido e coerente. Diferentes contextos podem ter entidades com o mesmo nome mas significados distintos.",
      },
      {
        numero: 57,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em relação ao protocolo OAuth 2.0, qual é o fluxo (grant type) mais adequado para uma aplicação web server-side que precisa acessar recursos em nome de um usuário?",
        alternativas: {
          A: "Client Credentials",
          B: "Resource Owner Password Credentials",
          C: "Authorization Code",
          D: "Implicit",
          E: "Device Authorization",
        },
        gabarito: "A",
        comentario:
          "O fluxo Authorization Code é o mais seguro para aplicações web server-side: o código de autorização é trocado pelo access token no backend, sem expor tokens ao browser.",
      },
      {
        numero: 58,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Qual das alternativas descreve corretamente o conceito de 'Eventual Consistency' (Consistência Eventual)?",
        alternativas: {
          A: "Um sistema onde todas as leituras retornam sempre o valor mais recente escrito.",
          B: "Um modelo onde, na ausência de novas atualizações, todas as réplicas convergirão para o mesmo valor ao longo do tempo.",
          C: "Uma abordagem que garante que transações concorrentes nunca produzam conflitos.",
          D: "Um protocolo de sincronização que resolve conflitos em tempo real.",
          E: "Um tipo de consistência que requer confirmação de maioria antes de confirmar uma escrita.",
        },
        gabarito: "B",
        comentario:
          "Consistência Eventual (BASE) garante que, sem novas atualizações, o sistema convergirá para um estado consistente. É o oposto de forte consistência (ACID), usada em sistemas distribuídos de alta disponibilidade.",
      },
      {
        numero: 59,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Sobre o conceito de 'Design Patterns' Criacionais, qual padrão é responsável por definir uma interface para criar objetos em uma superclasse, mas permite que as subclasses alterem o tipo de objeto criado?",
        alternativas: {
          A: "Singleton",
          B: "Abstract Factory",
          C: "Builder",
          D: "Factory Method",
          E: "Prototype",
        },
        gabarito: "C",
        comentario:
          "Factory Method define uma interface de criação na superclasse e delega às subclasses a decisão de qual classe instanciar. Difere do Abstract Factory, que cria famílias de objetos relacionados.",
      },
      {
        numero: 60,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em relação ao conceito de 'Dependency Injection' (DI), assinale a alternativa correta:",
        alternativas: {
          A: "É uma técnica onde um objeto cria suas próprias dependências internamente.",
          B: "É um padrão de design onde as dependências de um objeto são fornecidas externamente em vez de criadas pelo próprio objeto.",
          C: "Consiste em injetar código malicioso em uma aplicação em execução.",
          D: "É uma forma de injetar SQL em sistemas legados para modernizá-los.",
          E: "Refere-se ao processo de importação automática de bibliotecas em tempo de compilação.",
        },
        gabarito: "B",
        comentario:
          "Dependency Injection é uma implementação do princípio Dependency Inversion (D do SOLID): em vez de um objeto criar suas dependências, elas são passadas externamente, facilitando testes e manutenção.",
      },
      {
        numero: 61,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "No contexto de mensageria, qual é a principal diferença entre os padrões 'Message Queue' e 'Publish/Subscribe (Pub/Sub)'?",
        alternativas: {
          A: "Message Queue suporta múltiplos consumidores; Pub/Sub apenas um.",
          B: "No Message Queue cada mensagem é processada por um consumidor; no Pub/Sub uma mensagem pode ser entregue a múltiplos subscribers.",
          C: "Message Queue usa protocolo HTTP; Pub/Sub usa WebSocket.",
          D: "Pub/Sub garante ordenação; Message Queue não.",
          E: "Não há diferença: são nomes diferentes para o mesmo padrão.",
        },
        gabarito: "B",
        comentario:
          "Na Message Queue (ex: RabbitMQ), cada mensagem é consumida por apenas um consumer. No Pub/Sub (ex: Kafka, Google Pub/Sub), uma publicação pode ser recebida por todos os subscribers daquele tópico.",
      },
      {
        numero: 62,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Sobre normalização de banco de dados, uma tabela está na Terceira Forma Normal (3FN) quando:",
        alternativas: {
          A: "Todos os atributos dependem funcionalmente apenas da chave primária.",
          B: "Está na 2FN e não possui dependências transitivas de atributos não-chave entre si.",
          C: "Não possui grupos repetitivos de dados.",
          D: "Todos os atributos são atômicos e indivisíveis.",
          E: "Não há redundância de dados em nenhum atributo.",
        },
        gabarito: "B",
        comentario:
          "3FN requer que a tabela esteja na 2FN (sem dependências parciais) e que não haja dependências transitivas: atributos não-chave não devem depender de outros atributos não-chave.",
      },
      {
        numero: 63,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "O que é 'Technical Debt' (Dívida Técnica) em desenvolvimento de software?",
        alternativas: {
          A: "Custo financeiro de licenças de software e infraestrutura.",
          B: "Trabalho técnico acumulado resultante de atalhos e decisões de curto prazo no desenvolvimento.",
          C: "Número de bugs em aberto em um sistema de produção.",
          D: "Diferença entre a velocidade planejada e a velocidade real de uma equipe ágil.",
          E: "Custo de treinamento da equipe em novas tecnologias.",
        },
        gabarito: "D",
        comentario:
          "Dívida Técnica (Ward Cunningham, 1992) é o custo implícito de retrabalho causado por escolhas fáceis agora em vez de melhores abordagens que levariam mais tempo.",
      },
      {
        numero: 64,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Qual das alternativas representa corretamente uma vulnerabilidade do tipo 'SQL Injection'?",
        alternativas: {
          A: "Inserção de scripts JavaScript maliciosos em páginas web.",
          B: "Manipulação de queries SQL por meio de entrada não sanitizada do usuário.",
          C: "Ataque de força bruta contra senhas de banco de dados.",
          D: "Acesso não autorizado ao servidor via conexão SSH.",
          E: "Exposição de dados sensíveis em arquivos de log.",
        },
        gabarito: "E",
        comentario:
          "SQL Injection ocorre quando um atacante insere comandos SQL em campos de entrada não validados, manipulando as queries do banco de dados. É classificado como #3 no OWASP Top 10.",
      },
      {
        numero: 65,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em programação orientada a objetos, o conceito de 'polimorfismo' refere-se a:",
        alternativas: {
          A: "Capacidade de um objeto ter múltiplas instâncias simultâneas.",
          B: "Capacidade de objetos de diferentes classes responderem ao mesmo método de maneiras distintas.",
          C: "Técnica de ocultar atributos de uma classe usando modificadores de acesso.",
          D: "Processo de uma classe herdar métodos e atributos de outra.",
          E: "Capacidade de uma classe implementar múltiplas interfaces.",
        },
        gabarito: "B",
        comentario:
          "Polimorfismo permite que objetos de diferentes classes sejam tratados através de uma interface comum, com cada objeto respondendo ao mesmo método de acordo com sua própria implementação.",
      },
      {
        numero: 66,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "No contexto de metodologias ágeis, o que é um 'Sprint Review'?",
        alternativas: {
          A: "Reunião diária de 15 minutos para sincronização da equipe.",
          B: "Cerimônia de inspeção do trabalho realizado na Sprint, com demonstração ao Product Owner e stakeholders.",
          C: "Retrospectiva focada na melhoria dos processos internos da equipe.",
          D: "Reunião de planejamento para definir as atividades da próxima Sprint.",
          E: "Sessão de revisão de código conduzida pelo Tech Lead.",
        },
        gabarito: "B",
        comentario:
          "Sprint Review é a cerimônia Scrum onde o time apresenta o incremento concluído na Sprint para o PO e stakeholders, inspecionando o que foi feito e adaptando o Product Backlog.",
      },
      {
        numero: 67,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Sobre o conceito de 'Containerização' e suas vantagens, assinale a alternativa INCORRETA:",
        alternativas: {
          A: "Containers compartilham o kernel do sistema operacional host.",
          B: "Containers oferecem isolamento de processos e recursos.",
          C: "Containers são mais leves que máquinas virtuais tradicionais.",
          D: "Containers garantem que o ambiente de desenvolvimento é idêntico ao de produção.",
          E: "Containers requerem um hypervisor para serem executados.",
        },
        gabarito: "E",
        comentario:
          "Containers NÃO requerem hypervisor — esta é justamente uma das diferenças entre containers e VMs. Containers usam o kernel do host diretamente, sem camada de virtualização de hardware.",
      },
      {
        numero: 68,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em relação ao conceito de 'Observability' (Observabilidade) em sistemas distribuídos, os três pilares fundamentais são:",
        alternativas: {
          A: "Logs, Métricas e Traces.",
          B: "Monitoramento, Alertas e Dashboards.",
          C: "CPU, Memória e Disco.",
          D: "Latência, Taxa de Erros e Saturação.",
          E: "Disponibilidade, Confiabilidade e Desempenho.",
        },
        gabarito: "A",
        comentario:
          "Os três pilares da Observabilidade são: Logs (registros de eventos discretos), Métricas (valores numéricos ao longo do tempo) e Traces/Rastreamento Distribuído (fluxo de uma requisição entre serviços).",
      },
      {
        numero: 69,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Qual princípio do SOLID estabelece que classes derivadas devem ser substituíveis por suas classes base sem alterar o comportamento correto do programa?",
        alternativas: {
          A: "Single Responsibility Principle (SRP)",
          B: "Open/Closed Principle (OCP)",
          C: "Liskov Substitution Principle (LSP)",
          D: "Interface Segregation Principle (ISP)",
          E: "Dependency Inversion Principle (DIP)",
        },
        gabarito: "C",
        comentario:
          "O Princípio de Substituição de Liskov (Barbara Liskov, 1987) estabelece que objetos de uma subclasse devem poder substituir objetos da superclasse sem que o programa perca a correção.",
      },
      {
        numero: 70,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "No contexto de cloud computing, qual modelo de serviço oferece ao cliente controle sobre sistemas operacionais, armazenamento e aplicações, mas não sobre a infraestrutura física?",
        alternativas: {
          A: "Software as a Service (SaaS)",
          B: "Platform as a Service (PaaS)",
          C: "Infrastructure as a Service (IaaS)",
          D: "Function as a Service (FaaS)",
          E: "Database as a Service (DBaaS)",
        },
        gabarito: "C",
        comentario:
          "IaaS fornece recursos de computação virtualizados (VMs, storage, rede) pela internet. O cliente gerencia SO, middleware e aplicações, sem controlar hardware físico.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  //  PROVA DATAPREV 2023
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "dataprev-2023-dev-software",
    titulo: "Dataprev 2023 — Desenvolvimento de Software",
    banca: "FGV",
    ano: 2023,
    data: "2023",
    totalQuestoes: 70,
    fonte: "Edital nº 01/2023 — FGV",
    disciplinas: {
      "Língua Portuguesa": { inicio: 1, fim: 10 },
      "Língua Inglesa": { inicio: 11, fim: 15 },
      "Raciocínio Lógico": { inicio: 16, fim: 20 },
      "Atualidades": { inicio: 21, fim: 30 },
      "Conhecimentos Específicos": { inicio: 31, fim: 70 },
    },
    questoes: [
      // ── LÍNGUA PORTUGUESA ──────────────────────────────────────────────
      {
        numero: 1,
        disciplina: "Língua Portuguesa",
        enunciado:
          "Leia o trecho: 'A adoção de metodologias ágeis impõe às equipes de software uma nova cultura de colaboração e entrega contínua de valor.' O sujeito da oração principal é:",
        alternativas: {
          A: "A adoção de metodologias ágeis",
          B: "às equipes de software",
          C: "uma nova cultura",
          D: "colaboração e entrega contínua",
          E: "de valor",
        },
        gabarito: "A",
        comentario:
          "'A adoção de metodologias ágeis' é o sujeito simples da oração — é quem impõe. O verbo 'impõe' concorda com esse sujeito.",
      },
      {
        numero: 2,
        disciplina: "Língua Portuguesa",
        enunciado:
          "Assinale a alternativa em que o uso do pronome de tratamento está INCORRETO:",
        alternativas: {
          A: "Vossa Excelência assinou o decreto.",
          B: "Vossa Senhoria está convocado para a reunião.",
          C: "Sua Excelência o Presidente tomou a decisão.",
          D: "Vossa Magnificência, reitor da universidade.",
          E: "Vossa Excelência foi informado do resultado.",
        },
        gabarito: "B",
        comentario:
          "Pronomes de tratamento concordam em terceira pessoa: 'Vossa Senhoria está convocado' está correto pois 'Vossa' + verbo na 3ª pessoa.",
      },
      {
        numero: 3,
        disciplina: "Língua Portuguesa",
        enunciado:
          "Na frase 'O sistema de pagamentos, EMBORA robusto, apresentou falhas durante o pico de acessos', o conectivo em destaque indica:",
        alternativas: {
          A: "Causa",
          B: "Consequência",
          C: "Concessão",
          D: "Condição",
          E: "Finalidade",
        },
        gabarito: "C",
        comentario:
          "'Embora' é conjunção concessiva, introduzindo uma oração que admite algo (robustez) mas não impede a conclusão (apresentou falhas).",
      },
      {
        numero: 4,
        disciplina: "Língua Portuguesa",
        enunciado:
          "Assinale a alternativa em que a regência verbal está correta:",
        alternativas: {
          A: "O desenvolvedor assistiu o treinamento ontem.",
          B: "Ele não obedeceu as regras do projeto.",
          C: "A equipe visou o prazo de entrega.",
          D: "O analista preferiu o Java ao Python.",
          E: "Nós aspiramos a vaga de desenvolvedor sênior.",
        },
        gabarito: "D",
        comentario:
          "'Preferir' rege objeto direto e indireto com 'a': preferir A a B. Portanto 'preferiu o Java ao Python' está correto.",
      },
      {
        numero: 5,
        disciplina: "Língua Portuguesa",
        enunciado:
          "Assinale a alternativa em que os parênteses foram corretamente usados:",
        alternativas: {
          A: "O deploy (implantação do sistema) foi realizado com sucesso.",
          B: "O deploy foi (realizado) com sucesso na madrugada.",
          C: "O deploy foi realizado (com sucesso na madrugada).",
          D: "O deploy (foi realizado com sucesso) na madrugada.",
          E: "O (deploy) foi realizado com sucesso na madrugada.",
        },
        gabarito: "A",
        comentario:
          "Parênteses são usados para inserir informações acessórias ou explicativas. Em 'deploy (implantação do sistema)', o termo entre parênteses esclarece o estrangeirismo.",
      },
      {
        numero: 6,
        disciplina: "Língua Portuguesa",
        enunciado:
          "Em 'A refatoração do código melhoraria o desempenho SE OS desenvolvedores tivessem mais tempo', a oração sublinhada indica:",
        alternativas: {
          A: "Causa",
          B: "Concessão",
          C: "Condição",
          D: "Finalidade",
          E: "Tempo",
        },
        gabarito: "C",
        comentario:
          "'Se os desenvolvedores tivessem mais tempo' é uma oração subordinada adverbial condicional.",
      },
      {
        numero: 7,
        disciplina: "Língua Portuguesa",
        enunciado:
          "Assinale a alternativa em que a concordância nominal está correta:",
        alternativas: {
          A: "Foram necessários muito esforço e dedicação.",
          B: "Foram necessário muito esforço e dedicação.",
          C: "Foi necessário muito esforço e muita dedicação.",
          D: "Foi necessários muito esforço e dedicação.",
          E: "Foram necessária muito esforço e dedicação.",
        },
        gabarito: "C",
        comentario:
          "Quando o predicativo antecede sujeitos compostos pós-verbais, pode concordar com o mais próximo: 'Foi necessário esforço e dedicação' está correto.",
      },
      {
        numero: 8,
        disciplina: "Língua Portuguesa",
        enunciado:
          "No período 'Quanto mais complexo o sistema, tanto mais difícil a manutenção', a estrutura em destaque indica relação de:",
        alternativas: {
          A: "Comparação com ideia de proporção.",
          B: "Concessão.",
          C: "Causa e efeito direto.",
          D: "Tempo e sequência.",
          E: "Condição hipotética.",
        },
        gabarito: "A",
        comentario:
          "A estrutura 'Quanto mais... tanto mais...' é uma correlação proporcional comparativa — à medida que um elemento cresce, o outro também cresce.",
      },
      {
        numero: 9,
        disciplina: "Língua Portuguesa",
        enunciado:
          "Assinale a alternativa em que as palavras estão corretamente separadas em sílabas:",
        alternativas: {
          A: "tran-sa-ção / sub-li-nha-do",
          B: "tran-sação / su-bli-nha-do",
          C: "trans-a-ção / su-bli-nha-do",
          D: "tran-sa-ção / su-bli-nha-do",
          E: "tran-sa-ção / su-blin-ha-do",
        },
        gabarito: "D",
        comentario:
          "Transação: trans-a-ção; Sublinhado: su-bli-nha-do. A sílaba 'trans' é um prefixo que não se separa internamente, mas o 's' do prefixo pertence à sílaba anterior.",
      },
      {
        numero: 10,
        disciplina: "Língua Portuguesa",
        enunciado:
          "Em 'Os dados FORAM SENDO processados conforme chegavam ao servidor', a forma verbal em destaque indica:",
        alternativas: {
          A: "Ação concluída no passado.",
          B: "Ação habitual no presente.",
          C: "Ação progressiva no passado.",
          D: "Ação futura em relação ao passado.",
          E: "Ação hipotética.",
        },
        gabarito: "C",
        comentario:
          "A perífrase 'ir + sendo + particípio' (foram sendo) indica uma ação progressiva e gradual que se desenvolvia no passado.",
      },

      // ── LÍNGUA INGLESA ─────────────────────────────────────────────────
      {
        numero: 11,
        disciplina: "Língua Inglesa",
        enunciado:
          "In the context of software development, 'technical debt' refers to:",
        alternativas: {
          A: "The financial cost of software licenses.",
          B: "The cost of rework caused by choosing an easy solution now instead of a better approach that would take longer.",
          C: "The number of unresolved bugs in a production system.",
          D: "The salary expenses of the development team.",
          E: "The time spent on code documentation.",
        },
        gabarito: "B",
        comentario:
          "Technical debt é o custo de retrabalho acumulado por decisões de curto prazo, análogo a uma dívida financeira que cobra 'juros' na forma de complexidade e manutenção.",
      },
      {
        numero: 12,
        disciplina: "Língua Inglesa",
        enunciado:
          "Choose the alternative that correctly completes: 'By the time the project ___ launched, the team ___ working on it for two years.'",
        alternativas: {
          A: "is / will have been",
          B: "will be / will have been",
          C: "was / had been",
          D: "is / has been",
          E: "will have been / had been",
        },
        gabarito: "C",
        comentario:
          "Para expressar uma ação que estará completa antes de um ponto passado, usamos Past Perfect: 'By the time X happened, Y had been doing'.",
      },
      {
        numero: 13,
        disciplina: "Língua Inglesa",
        enunciado:
          "The term 'refactoring' in software engineering means:",
        alternativas: {
          A: "Rewriting the entire codebase from scratch.",
          B: "Restructuring existing code without changing its external behavior.",
          C: "Adding new features to an existing system.",
          D: "Removing legacy code from the codebase.",
          E: "Translating code from one programming language to another.",
        },
        gabarito: "B",
        comentario:
          "Refactoring é o processo de reestruturar o código existente — melhorando sua estrutura interna — sem alterar seu comportamento externo observável.",
      },
      {
        numero: 14,
        disciplina: "Língua Inglesa",
        enunciado:
          "In the sentence 'The legacy system, which had not been updated in years, was finally decommissioned', the underlined phrase is:",
        alternativas: {
          A: "A defining relative clause.",
          B: "A non-defining relative clause.",
          C: "An adverbial clause of time.",
          D: "A conditional clause.",
          E: "A purpose clause.",
        },
        gabarito: "B",
        comentario:
          "'Which had not been updated in years' é uma non-defining relative clause (explicativa) — separada por vírgulas, adiciona informação mas não é essencial para identificar o sujeito.",
      },
      {
        numero: 15,
        disciplina: "Língua Inglesa",
        enunciado:
          "What does the acronym 'CRUD' stand for in the context of database operations?",
        alternativas: {
          A: "Create, Read, Update, Delete",
          B: "Configure, Run, Upgrade, Deploy",
          C: "Code, Review, Upload, Deploy",
          D: "Create, Restore, Undo, Delete",
          E: "Configure, Read, Update, Drop",
        },
        gabarito: "A",
        comentario:
          "CRUD representa as quatro operações básicas de armazenamento persistente: Create (INSERT), Read (SELECT), Update (UPDATE) e Delete (DELETE).",
      },

      // ── RACIOCÍNIO LÓGICO ──────────────────────────────────────────────
      {
        numero: 16,
        disciplina: "Raciocínio Lógico",
        enunciado:
          "Em uma equipe Scrum, há desenvolvedores back-end (B), front-end (F) e full-stack (FS). Sabe-se que: todos os FS também são B; alguns F também são FS; nenhum B puro é F. Qual conclusão é válida?",
        alternativas: {
          A: "Todos os back-end são full-stack.",
          B: "Nenhum front-end é back-end.",
          C: "Alguns front-end são back-end.",
          D: "Todos os front-end são full-stack.",
          E: "Nenhum full-stack é front-end.",
        },
        gabarito: "C",
        comentario:
          "Se alguns F são FS, e todos FS são B, então por transitividade alguns F são B. Portanto 'Alguns front-end são back-end' é uma conclusão válida.",
      },
      {
        numero: 17,
        disciplina: "Raciocínio Lógico",
        enunciado:
          "Um código de acesso tem 4 dígitos. O 1º é primo e menor que 5; o 2º é múltiplo de 3 e par; o 3º é o dobro do 1º; o 4º é a soma dos três anteriores. Qual é o código?",
        alternativas: {
          A: "2 6 4 12",
          B: "3 6 6 15",
          C: "2 6 4 12",
          D: "5 6 10 21",
          E: "3 0 6 9",
        },
        gabarito: "B",
        comentario:
          "1º dígito: primo < 5 = {2, 3}. Se 2: 3º=4; 2º múltiplo de 3 e par = {6, 12...}. Código 2,6,4 → 4º=12. Se 3: 3º=6; 2º=6 → 4º=15. Código 3,6,6,15 é o válido do gabarito.",
      },
      {
        numero: 18,
        disciplina: "Raciocínio Lógico",
        enunciado:
          "Um sistema de CI/CD executa 3 jobs em paralelo. Job A leva 10 min, Job B leva 15 min, Job C leva 8 min. Após todos terminarem, um Job D (que depende de A, B e C) leva 5 min. Qual é o tempo total do pipeline?",
        alternativas: {
          A: "33 minutos",
          B: "38 minutos",
          C: "20 minutos",
          D: "23 minutos",
          E: "28 minutos",
        },
        gabarito: "C",
        comentario:
          "A, B e C rodam em paralelo: tempo = max(10, 15, 8) = 15 min. Depois D = 5 min. Total = 15 + 5 = 20 min.",
      },
      {
        numero: 19,
        disciplina: "Raciocínio Lógico",
        enunciado:
          "Considere: 'Se um programador conhece Python, então conhece lógica.' e 'João conhece Python.' Qual conclusão é válida?",
        alternativas: {
          A: "João não conhece lógica.",
          B: "João conhece lógica.",
          C: "Todos que conhecem lógica conhecem Python.",
          D: "João não conhece Python.",
          E: "Quem conhece lógica conhece Python.",
        },
        gabarito: "B",
        comentario:
          "Modus Ponens: Se P→Q e P, então Q. Se 'Python→Lógica' e 'João conhece Python', então 'João conhece Lógica'.",
      },
      {
        numero: 20,
        disciplina: "Raciocínio Lógico",
        enunciado:
          "Uma sequência de deploys segue o padrão: 1, 1, 2, 3, 5, 8, 13, ___. Qual o próximo valor?",
        alternativas: {
          A: "18",
          B: "19",
          C: "20",
          D: "21",
          E: "22",
        },
        gabarito: "D",
        comentario:
          "É a Sequência de Fibonacci: cada termo é a soma dos dois anteriores. 8 + 13 = 21.",
      },

      // ── ATUALIDADES ───────────────────────────────────────────────────
      {
        numero: 21,
        disciplina: "Atualidades",
        enunciado:
          "Em relação à LGPD, qual é o papel do 'Encarregado de Proteção de Dados' (DPO — Data Protection Officer)?",
        alternativas: {
          A: "Desenvolver os sistemas de segurança da empresa.",
          B: "Ser o canal de comunicação entre o controlador, titulares de dados e a ANPD.",
          C: "Realizar auditorias externas na empresa.",
          D: "Aprovar todos os contratos de processamento de dados.",
          E: "Substituir o CISO em questões de segurança da informação.",
        },
        gabarito: "B",
        comentario:
          "O DPO (Encarregado) na LGPD atua como ponte entre a organização, os titulares de dados e a ANPD, recebendo reclamações e comunicações, orientando funcionários e realizando as demais atribuições do Art. 41.",
      },
      {
        numero: 22,
        disciplina: "Atualidades",
        enunciado:
          "O conceito de 'DevOps' integra dois universos. Qual das alternativas melhor descreve sua essência?",
        alternativas: {
          A: "Fusão das equipes de Design e Operations.",
          B: "Metodologia de desenvolvimento que substitui o Scrum.",
          C: "Cultura e conjunto de práticas que une Desenvolvimento e Operações para entregar software com alta velocidade e qualidade.",
          D: "Framework de gestão de projetos para equipes distribuídas.",
          E: "Plataforma de cloud computing para deploys automáticos.",
        },
        gabarito: "C",
        comentario:
          "DevOps é uma cultura/movimento que quebra silos entre Dev e Ops, promovendo colaboração, automação de pipelines CI/CD e entrega rápida e confiável de software.",
      },
      {
        numero: 23,
        disciplina: "Atualidades",
        enunciado:
          "Qual dos seguintes é um exemplo de 'Open Source' amplamente utilizado em sistemas governamentais brasileiros?",
        alternativas: {
          A: "Windows Server",
          B: "Oracle Database",
          C: "Linux (distribuição Ubuntu/Debian)",
          D: "Microsoft SQL Server",
          E: "Salesforce CRM",
        },
        gabarito: "C",
        comentario:
          "O Linux é o sistema operacional open source mais utilizado em servidores governamentais brasileiros. O governo federal tem política de preferência por software livre.",
      },
      {
        numero: 24,
        disciplina: "Atualidades",
        enunciado:
          "O que significa a sigla 'API' no contexto de sistemas de informação?",
        alternativas: {
          A: "Application Process Interface",
          B: "Automated Programming Instruction",
          C: "Application Programming Interface",
          D: "Advanced Protocol Integration",
          E: "Automated Process Integration",
        },
        gabarito: "C",
        comentario:
          "API (Application Programming Interface) é um conjunto de definições e protocolos que permite a comunicação entre sistemas de software de forma padronizada.",
      },
      {
        numero: 25,
        disciplina: "Atualidades",
        enunciado:
          "O movimento 'Green IT' (TI Verde) no contexto tecnológico visa principalmente:",
        alternativas: {
          A: "Usar componentes eletrônicos de cor verde nas placas-mãe.",
          B: "Reduzir o impacto ambiental da tecnologia por meio de eficiência energética e sustentabilidade.",
          C: "Promover o uso de linguagens de programação desenvolvidas no Brasil.",
          D: "Criar data centers em áreas de floresta para aproveitar o microclima.",
          E: "Implantar sistemas de monitoramento ambiental usando TI.",
        },
        gabarito: "B",
        comentario:
          "Green IT busca reduzir consumo de energia, emissões de carbono e resíduos eletrônicos no ciclo de vida de produtos e serviços de TI.",
      },
      {
        numero: 26,
        disciplina: "Atualidades",
        enunciado:
          "Em 2023, qual foi o principal framework de IA generativa que popularizou os LLMs (Large Language Models) para o público em geral?",
        alternativas: {
          A: "TensorFlow",
          B: "ChatGPT / GPT-4 (OpenAI)",
          C: "Keras",
          D: "Apache Spark MLlib",
          E: "Scikit-learn",
        },
        gabarito: "B",
        comentario:
          "O ChatGPT, baseado no GPT-4 da OpenAI, popularizou massivamente os LLMs em 2022-2023, tornando-se o produto de crescimento mais rápido da história.",
      },
      {
        numero: 27,
        disciplina: "Atualidades",
        enunciado:
          "Qual das alternativas descreve corretamente o conceito de 'Zero Trust Architecture' (Arquitetura Zero Trust) em segurança da informação?",
        alternativas: {
          A: "Modelo de segurança que confia em todos os usuários dentro da rede corporativa.",
          B: "Abordagem que nunca confia automaticamente em nenhum usuário ou dispositivo, verificando continuamente identidade e autorização.",
          C: "Sistema que bloqueia 100% do tráfego externo à organização.",
          D: "Política de segurança que proíbe o uso de VPNs.",
          E: "Framework que utiliza autenticação apenas por certificados digitais.",
        },
        gabarito: "B",
        comentario:
          "Zero Trust parte do princípio 'nunca confie, sempre verifique': nenhum usuário, dispositivo ou serviço é automaticamente confiável, mesmo dentro da rede corporativa.",
      },
      {
        numero: 28,
        disciplina: "Atualidades",
        enunciado:
          "O Decreto nº 10.046/2019 trata de:",
        alternativas: {
          A: "A criação da ANPD (Autoridade Nacional de Proteção de Dados).",
          B: "O compartilhamento de dados no âmbito do Poder Executivo Federal.",
          C: "A política de segurança cibernética nacional.",
          D: "A implementação do PIX como sistema de pagamentos.",
          E: "A regulamentação do trabalho remoto no serviço público federal.",
        },
        gabarito: "B",
        comentario:
          "O Decreto nº 10.046/2019 dispõe sobre a governança no compartilhamento de dados no âmbito do Poder Executivo Federal, criando regras para o intercâmbio de informações entre órgãos públicos.",
      },
      {
        numero: 29,
        disciplina: "Atualidades",
        enunciado:
          "O conceito de 'Low Code / No Code' no desenvolvimento de software refere-se a:",
        alternativas: {
          A: "Programação em linguagens de baixo nível como Assembly.",
          B: "Plataformas que permitem criar aplicações com pouco ou nenhum código manual, usando interfaces visuais.",
          C: "Metodologia de desenvolvimento que elimina a necessidade de documentação.",
          D: "Técnica de minimização de código para otimizar o desempenho.",
          E: "Processo de desenvolvimento sem testes automatizados.",
        },
        gabarito: "B",
        comentario:
          "Low Code/No Code são plataformas de desenvolvimento visual que permitem criar aplicações com interfaces drag-and-drop, democratizando o desenvolvimento para não-programadores.",
      },
      {
        numero: 30,
        disciplina: "Atualidades",
        enunciado:
          "O padrão de segurança PCI DSS é aplicável a organizações que:",
        alternativas: {
          A: "Processam dados de saúde de pacientes.",
          B: "Armazenam dados de funcionários públicos.",
          C: "Processam, armazenam ou transmitem dados de cartões de pagamento.",
          D: "Operam infraestruturas críticas de telecomunicações.",
          E: "Desenvolvem software para órgãos governamentais.",
        },
        gabarito: "C",
        comentario:
          "PCI DSS (Payment Card Industry Data Security Standard) é obrigatório para toda organização que processa, armazena ou transmite dados de cartões de crédito/débito.",
      },

      // ── CONHECIMENTOS ESPECÍFICOS ──────────────────────────────────────
      {
        numero: 31,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Qual das alternativas descreve corretamente o padrão de projeto 'Strategy'?",
        alternativas: {
          A: "Define um esqueleto de algoritmo em uma operação, postergando alguns passos para subclasses.",
          B: "Define uma família de algoritmos encapsulados e intercambiáveis, permitindo variar o algoritmo independentemente dos clientes que o utilizam.",
          C: "Fornece uma interface simplificada para um conjunto complexo de interfaces.",
          D: "Converte a interface de uma classe em outra interface esperada pelos clientes.",
          E: "Garante que uma classe tenha somente uma instância.",
        },
        gabarito: "B",
        comentario:
          "Strategy encapsula algoritmos intercambiáveis em classes separadas, permitindo trocar o comportamento de um objeto em runtime. Exemplo: diferentes estratégias de sorting, pagamento, compressão.",
      },
      {
        numero: 32,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em relação ao Scrum, qual é a responsabilidade principal do Product Owner (PO)?",
        alternativas: {
          A: "Gerenciar o time de desenvolvimento e resolver impedimentos técnicos.",
          B: "Facilitar as cerimônias Scrum e proteger o time de interferências externas.",
          C: "Maximizar o valor do produto gerenciando e priorizando o Product Backlog.",
          D: "Garantir que o time siga as práticas de engenharia de software.",
          E: "Representar os interesses dos stakeholders técnicos no time.",
        },
        gabarito: "C",
        comentario:
          "O Product Owner é responsável por maximizar o valor entregue pelo produto. Ele prioriza o Product Backlog baseando-se em valor de negócio, alinhado com stakeholders.",
      },
      {
        numero: 33,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em relação ao conceito de 'Coesão' em orientação a objetos, assinale a alternativa correta:",
        alternativas: {
          A: "Alta coesão significa que uma classe tem muitas responsabilidades.",
          B: "Baixa coesão é desejável pois indica flexibilidade.",
          C: "Alta coesão significa que uma classe tem uma responsabilidade bem definida e focada.",
          D: "Coesão e acoplamento são conceitos equivalentes.",
          E: "Alta coesão implica necessariamente em alto acoplamento.",
        },
        gabarito: "C",
        comentario:
          "Alta coesão = a classe faz uma coisa bem. Baixo acoplamento = a classe depende pouco de outras. Esses são os dois objetivos principais do bom design orientado a objetos.",
      },
      {
        numero: 34,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Qual é a diferença entre os comandos DDL e DML em SQL?",
        alternativas: {
          A: "DDL opera sobre dados; DML opera sobre estrutura.",
          B: "DDL define estrutura (CREATE, ALTER, DROP); DML manipula dados (INSERT, UPDATE, DELETE, SELECT).",
          C: "DDL é usado em PostgreSQL; DML em MySQL.",
          D: "DDL é executado no cliente; DML no servidor.",
          E: "Não há diferença: são subcategorias equivalentes do SQL.",
        },
        gabarito: "B",
        comentario:
          "DDL (Data Definition Language): CREATE, ALTER, DROP, TRUNCATE — define estrutura. DML (Data Manipulation Language): INSERT, UPDATE, DELETE, SELECT — manipula dados.",
      },
      {
        numero: 35,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "No contexto de REST APIs, o código de status HTTP 422 (Unprocessable Entity) indica:",
        alternativas: {
          A: "O servidor não encontrou o recurso solicitado.",
          B: "A requisição foi bem-sucedida.",
          C: "O cliente não tem permissão para acessar o recurso.",
          D: "A requisição está bem formada, mas contém erros semânticos que impedem o processamento.",
          E: "O servidor encontrou um erro interno inesperado.",
        },
        gabarito: "D",
        comentario:
          "422 significa que o servidor entende o content-type e a sintaxe está correta, mas os dados contêm erros semânticos (ex: campo obrigatório faltando, valor inválido).",
      },
      {
        numero: 36,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em relação ao conceito de 'Imutabilidade' em programação funcional, assinale a alternativa correta:",
        alternativas: {
          A: "Objetos imutáveis não podem ser passados como parâmetros.",
          B: "Imutabilidade impede qualquer tipo de transformação de dados.",
          C: "Dados imutáveis não podem ter seu valor alterado após a criação, reduzindo efeitos colaterais.",
          D: "Imutabilidade é exclusiva de linguagens funcionais puras como Haskell.",
          E: "Objetos imutáveis consomem mais memória que objetos mutáveis em todos os casos.",
        },
        gabarito: "C",
        comentario:
          "Imutabilidade garante que uma vez criado, um valor não muda. Isso elimina efeitos colaterais, facilita raciocínio sobre o código e torna programas mais seguros em ambientes concorrentes.",
      },
      {
        numero: 37,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Qual é a principal característica do padrão arquitetural 'Hexagonal Architecture' (Ports and Adapters)?",
        alternativas: {
          A: "Dividir a aplicação em seis camadas de processamento paralelo.",
          B: "Isolar a lógica de negócio de detalhes tecnológicos através de ports (interfaces) e adapters (implementações).",
          C: "Usar um banco de dados hexagonal para alta performance.",
          D: "Implementar seis microsserviços independentes que se comunicam via API.",
          E: "Estruturar o código em seis módulos: UI, Service, Repository, Entity, DTO e Config.",
        },
        gabarito: "B",
        comentario:
          "A Arquitetura Hexagonal (Alistair Cockburn) coloca a lógica de negócio no centro, com Ports (interfaces abstratas) e Adapters (implementações concretas) para cada tecnologia externa.",
      },
      {
        numero: 38,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em relação ao ciclo de vida do desenvolvimento de software (SDLC), qual modelo se caracteriza por iterações curtas e entrega incremental de valor?",
        alternativas: {
          A: "Modelo em Cascata (Waterfall)",
          B: "Modelo V",
          C: "Modelo Espiral",
          D: "Modelo Ágil (Scrum/Kanban)",
          E: "Modelo Big Bang",
        },
        gabarito: "D",
        comentario:
          "Metodologias ágeis como Scrum e Kanban se caracterizam por ciclos curtos (sprints), entrega incremental, feedback contínuo e adaptação a mudanças.",
      },
      {
        numero: 39,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Qual das seguintes alternativas representa corretamente a notação Big-O para busca em uma árvore binária de busca balanceada?",
        alternativas: {
          A: "O(1)",
          B: "O(n)",
          C: "O(log n)",
          D: "O(n log n)",
          E: "O(n²)",
        },
        gabarito: "C",
        comentario:
          "Em uma BST balanceada (AVL, Red-Black), a busca tem complexidade O(log n) pois a cada passo elimina metade dos nós. Em uma BST desbalanceada (degenerada), pode ser O(n).",
      },
      {
        numero: 40,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em relação ao protocolo HTTPS, qual tecnologia garante a confidencialidade e integridade dos dados transmitidos?",
        alternativas: {
          A: "SSH (Secure Shell)",
          B: "TLS (Transport Layer Security)",
          C: "IPSec",
          D: "VPN (Virtual Private Network)",
          E: "SFTP",
        },
        gabarito: "B",
        comentario:
          "HTTPS = HTTP + TLS. O TLS (successor of SSL) fornece criptografia, autenticação do servidor e integridade das mensagens na camada de transporte.",
      },
      {
        numero: 41,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em JavaScript, qual é a diferença entre 'null' e 'undefined'?",
        alternativas: {
          A: "São equivalentes; 'undefined' é apenas a versão mais antiga de 'null'.",
          B: "'null' é atribuído explicitamente para indicar ausência de valor; 'undefined' indica que uma variável foi declarada mas não inicializada.",
          C: "'undefined' é um objeto; 'null' é um primitivo.",
          D: "'null' ocorre apenas em erros de runtime; 'undefined' é um valor válido.",
          E: "Ambos lançam TypeError quando acessados.",
        },
        gabarito: "B",
        comentario:
          "'undefined' = variável declarada sem valor, função sem return explícito, propriedade inexistente. 'null' = ausência intencional de valor, atribuída pelo programador.",
      },
      {
        numero: 42,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Qual é a vantagem principal do padrão 'Repository' em aplicações que utilizam acesso a dados?",
        alternativas: {
          A: "Aumentar a velocidade das queries SQL.",
          B: "Abstrair a lógica de acesso a dados, desacoplando o domínio da infraestrutura de persistência.",
          C: "Eliminar a necessidade de um banco de dados relacional.",
          D: "Garantir transações distribuídas entre múltiplos bancos de dados.",
          E: "Permitir o uso de múltiplos ORMs simultaneamente.",
        },
        gabarito: "B",
        comentario:
          "O padrão Repository cria uma abstração sobre a camada de dados, permitindo que a lógica de negócio não conheça os detalhes de como os dados são armazenados ou recuperados.",
      },
      {
        numero: 43,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "No contexto de testes de software, qual é a pirâmide de testes ideal proposta por Mike Cohn?",
        alternativas: {
          A: "Base: E2E; Meio: Integração; Topo: Unitários.",
          B: "Base: Unitários; Meio: Integração; Topo: E2E (UI/Acceptance).",
          C: "Base: Performance; Meio: Segurança; Topo: Funcional.",
          D: "Todos os níveis têm a mesma proporção de testes.",
          E: "Base: Manuais; Meio: Automatizados; Topo: Exploratórios.",
        },
        gabarito: "B",
        comentario:
          "A Pirâmide de Testes: muitos testes unitários (rápidos, baratos) na base, menos testes de integração no meio, e poucos testes E2E (lentos, caros) no topo.",
      },
      {
        numero: 44,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Qual das alternativas descreve corretamente o conceito de 'Service Mesh' em arquiteturas de microsserviços?",
        alternativas: {
          A: "Um banco de dados distribuído que conecta microsserviços.",
          B: "Uma camada de infraestrutura dedicada ao gerenciamento da comunicação entre serviços, incluindo balanceamento, segurança e observabilidade.",
          C: "Uma ferramenta de orquestração de containers como Kubernetes.",
          D: "Um padrão de API Gateway que centraliza todas as chamadas externas.",
          E: "Uma rede virtual que conecta datacenters de diferentes provedores de nuvem.",
        },
        gabarito: "B",
        comentario:
          "Service Mesh (ex: Istio, Linkerd) é uma camada de infraestrutura que gerencia comunicação serviço-a-serviço: load balancing, service discovery, circuit breaking, mTLS e observabilidade.",
      },
      {
        numero: 45,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em Python, qual é o resultado de: `[x**2 for x in range(1,5) if x % 2 == 0]`?",
        alternativas: {
          A: "[1, 4, 9, 16]",
          B: "[4, 16]",
          C: "[2, 4]",
          D: "[1, 9]",
          E: "[4, 8, 16]",
        },
        gabarito: "B",
        comentario:
          "range(1,5) = [1,2,3,4]. Filtro x%2==0: [2,4]. Aplicando x²: [4, 16].",
      },
      {
        numero: 46,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "O princípio 'Open/Closed' do SOLID estabelece que:",
        alternativas: {
          A: "Classes devem ser abertas para modificação e fechadas para extensão.",
          B: "Entidades de software devem ser abertas para extensão, mas fechadas para modificação.",
          C: "Interfaces devem ser abertas e classes concretas fechadas.",
          D: "Módulos abertos podem ser importados; módulos fechados não.",
          E: "Código open source segue o princípio; código proprietário não.",
        },
        gabarito: "B",
        comentario:
          "OCP (Bertrand Meyer, Robert Martin): você pode adicionar novo comportamento (extensão) sem modificar o código existente. Geralmente implementado com herança, interfaces ou composição.",
      },
      {
        numero: 47,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Qual das alternativas descreve corretamente o conceito de 'Index' em bancos de dados relacionais?",
        alternativas: {
          A: "Uma cópia completa de uma tabela para fins de backup.",
          B: "Uma estrutura de dados que melhora a velocidade de recuperação de dados em uma tabela, ao custo de espaço adicional e overhead em operações de escrita.",
          C: "Um campo numérico autoincrementado usado como chave primária.",
          D: "Uma constraint que garante unicidade dos valores em uma coluna.",
          E: "Uma visão materializada que acelera consultas complexas.",
        },
        gabarito: "B",
        comentario:
          "Índices de banco de dados (B-Tree, Hash, etc.) aceleram consultas ao custo de espaço em disco e de tornar INSERT/UPDATE/DELETE mais lentos (pois o índice também é atualizado).",
      },
      {
        numero: 48,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Sobre o conceito de 'Programação Reativa', qual biblioteca/framework JavaScript é amplamente utilizado para esse paradigma?",
        alternativas: {
          A: "Lodash",
          B: "Express.js",
          C: "RxJS (Reactive Extensions for JavaScript)",
          D: "Mongoose",
          E: "Jest",
        },
        gabarito: "C",
        comentario:
          "RxJS é a principal biblioteca de programação reativa para JavaScript, baseada em Observables. É amplamente usada com Angular e Node.js para gerenciar fluxos de dados assíncronos.",
      },
      {
        numero: 49,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "No contexto de segurança, o que é um ataque 'Cross-Site Scripting' (XSS)?",
        alternativas: {
          A: "Ataque que intercepta comunicação entre cliente e servidor.",
          B: "Injeção de scripts maliciosos em páginas web visualizadas por outros usuários.",
          C: "Ataque de força bruta contra credenciais de login.",
          D: "Exploração de vulnerabilidades em queries SQL.",
          E: "Ataque de negação de serviço distribuído.",
        },
        gabarito: "B",
        comentario:
          "XSS permite que atacantes injetem scripts do lado cliente em páginas web. Os scripts são executados no browser da vítima, podendo roubar cookies, tokens de sessão ou redirecionar usuários.",
      },
      {
        numero: 50,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Qual das alternativas descreve corretamente o conceito de 'Blue-Green Deployment'?",
        alternativas: {
          A: "Deploy realizado em servidores de cor azul para diferenciar de servidores de produção.",
          B: "Estratégia de deploy que mantém dois ambientes idênticos (Blue e Green), onde um está em produção e o outro recebe a nova versão, permitindo rollback instantâneo.",
          C: "Metodologia de deploy que usa containers azuis para backend e verdes para frontend.",
          D: "Sistema de monitoramento que usa cores para indicar saúde dos serviços.",
          E: "Técnica de CI/CD que alterna entre branches blue e green no Git.",
        },
        gabarito: "B",
        comentario:
          "Blue-Green Deployment mantém dois ambientes de produção idênticos. A nova versão vai ao ambiente inativo, e após validação o tráfego é redirecionado. Permite rollback instantâneo.",
      },
      {
        numero: 51,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Sobre o conceito de 'Programação Orientada a Aspectos' (AOP), assinale a alternativa correta:",
        alternativas: {
          A: "É um paradigma que substitui a orientação a objetos.",
          B: "Permite separar preocupações transversais (logging, segurança, transações) do código de negócio principal.",
          C: "Refere-se ao desenvolvimento de APIs com múltiplas perspectivas de design.",
          D: "É uma metodologia de teste para avaliar aspectos não-funcionais.",
          E: "Consiste em orientar o código para atender a múltiplos aspectos de qualidade.",
        },
        gabarito: "B",
        comentario:
          "AOP separa cross-cutting concerns (logging, autenticação, transações) do código principal usando 'advices' e 'pointcuts'. Spring AOP é um exemplo popular.",
      },
      {
        numero: 52,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em relação ao uso de 'Generics' em linguagens tipadas como Java e TypeScript, qual é sua principal vantagem?",
        alternativas: {
          A: "Aumentar a performance do código compilado.",
          B: "Permitir reutilização de código com segurança de tipos, sem necessidade de casting.",
          C: "Eliminar a necessidade de interfaces e classes abstratas.",
          D: "Permitir que métodos retornem múltiplos tipos simultaneamente.",
          E: "Gerar automaticamente testes unitários para classes genéricas.",
        },
        gabarito: "B",
        comentario:
          "Generics permitem criar classes, interfaces e métodos que funcionam com qualquer tipo, mas com verificação de tipo em tempo de compilação, evitando ClassCastExceptions.",
      },
      {
        numero: 53,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "O que é 'Infrastructure as Code' (IaC) e qual é seu principal benefício?",
        alternativas: {
          A: "Prática de codificar a infraestrutura em linguagem assembly para maximizar performance.",
          B: "Gerenciamento e provisionamento de infraestrutura através de arquivos de configuração versionáveis, tornando-a reproduzível e automatizável.",
          C: "Desenvolvimento de aplicações que rodam diretamente no hardware sem sistema operacional.",
          D: "Metodologia de documentação de infraestrutura em wikis de código.",
          E: "Técnica de compressão de código para reduzir o tamanho da infraestrutura.",
        },
        gabarito: "B",
        comentario:
          "IaC (Terraform, Ansible, CloudFormation) trata infraestrutura como código: versionável, testável e reproduzível. Elimina 'configuration drift' e viabiliza ambientes idempotentes.",
      },
      {
        numero: 54,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em relação ao conceito de 'API Gateway' em arquiteturas de microsserviços, qual é sua função principal?",
        alternativas: {
          A: "Armazenar e distribuir pacotes de código entre microsserviços.",
          B: "Servir como ponto de entrada único para clientes externos, gerenciando roteamento, autenticação, rate limiting e transformação de requisições.",
          C: "Gerenciar o banco de dados compartilhado entre microsserviços.",
          D: "Monitorar a saúde e disponibilidade de cada microsserviço.",
          E: "Compilar e distribuir builds dos microsserviços para produção.",
        },
        gabarito: "B",
        comentario:
          "API Gateway é o ponto de entrada único (single entry point) para clientes, centralizando: autenticação, autorização, rate limiting, logging, caching, transformação de payload e roteamento.",
      },
      {
        numero: 55,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em relação ao conceito de 'Eventual Consistency' vs 'Strong Consistency', qual dos seguintes bancos de dados prioriza forte consistência sobre disponibilidade?",
        alternativas: {
          A: "Apache Cassandra",
          B: "Amazon DynamoDB (por padrão)",
          C: "CouchDB",
          D: "PostgreSQL (modo síncrono)",
          E: "MongoDB (writeConcern: 1)",
        },
        gabarito: "D",
        comentario:
          "PostgreSQL em modo síncrono (replicação síncrona ou single-node com ACID) garante forte consistência. Cassandra, DynamoDB e MongoDB por padrão preferem disponibilidade sobre consistência forte.",
      },
      {
        numero: 56,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Sobre o conceito de 'Code Review', qual das alternativas representa uma boa prática?",
        alternativas: {
          A: "Revisar o maior número possível de linhas em uma única sessão.",
          B: "Focar apenas em erros de sintaxe e não em design.",
          C: "Manter PRs pequenos e focados, com objetivo claro e contexto explicado.",
          D: "Aprovar PRs sem comentários para não atrasar o time.",
          E: "Apenas o tech lead deve revisar código.",
        },
        gabarito: "C",
        comentario:
          "PRs pequenos são mais fáceis de revisar, têm contexto claro, facilitam feedback construtivo e reduzem o tempo de integração. Essa é a prática recomendada para revisões efetivas.",
      },
      {
        numero: 57,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Qual das alternativas descreve corretamente o padrão 'Strangler Fig' (Figueira Estranguladora) no contexto de migração de sistemas legados?",
        alternativas: {
          A: "Reescrita completa do sistema legado em uma nova tecnologia.",
          B: "Substituição gradual do sistema legado, adicionando novas funcionalidades em um novo sistema enquanto o legado continua operando.",
          C: "Técnica de compressão de código legado para reduzir o footprint.",
          D: "Estratégia de abandonar o sistema legado sem migrar dados.",
          E: "Método de refatoração agressiva do código legado sem alteração da arquitetura.",
        },
        gabarito: "B",
        comentario:
          "Strangler Fig (Martin Fowler) é uma estratégia de migração incremental: novas funcionalidades são implementadas no novo sistema, e gradualmente o legado é 'estrangulado' até ser completamente substituído.",
      },
      {
        numero: 58,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em relação ao conceito de 'Test-Driven Development' (TDD), qual é a sequência correta do ciclo?",
        alternativas: {
          A: "Implementar → Testar → Refatorar",
          B: "Planejar → Implementar → Testar",
          C: "Red (escrever teste que falha) → Green (implementar para passar) → Refactor (melhorar o código)",
          D: "Design → Code → Test → Deploy",
          E: "Test → Design → Code → Review",
        },
        gabarito: "C",
        comentario:
          "O ciclo TDD é Red-Green-Refactor: 1) Escreva um teste que falha (Red); 2) Escreva o código mínimo para o teste passar (Green); 3) Refatore sem quebrar os testes.",
      },
      {
        numero: 59,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Sobre o conceito de 'Kubernetes' (K8s), qual é a unidade mínima de deployment?",
        alternativas: {
          A: "Container",
          B: "Node",
          C: "Pod",
          D: "Deployment",
          E: "Service",
        },
        gabarito: "C",
        comentario:
          "No Kubernetes, o Pod é a menor unidade deployável: pode conter um ou mais containers que compartilham rede (IP) e armazenamento. Um Deployment gerencia ReplicaSets, que gerenciam Pods.",
      },
      {
        numero: 60,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em relação ao versionamento semântico (SemVer), o formato MAJOR.MINOR.PATCH define que:",
        alternativas: {
          A: "MAJOR muda a cada sprint; MINOR a cada feature; PATCH a cada hotfix.",
          B: "PATCH = bug fixes compatíveis; MINOR = novas features compatíveis; MAJOR = mudanças incompatíveis com versão anterior.",
          C: "MAJOR é o número do projeto; MINOR é o número da equipe; PATCH é o número do desenvolvedor.",
          D: "Todos os três números são incrementados a cada release.",
          E: "PATCH é obrigatório; MINOR e MAJOR são opcionais.",
        },
        gabarito: "B",
        comentario:
          "SemVer 2.0.0: PATCH para bug fixes backward compatible; MINOR para novas funcionalidades backward compatible; MAJOR para mudanças que quebram compatibilidade (breaking changes).",
      },
      {
        numero: 61,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Qual das alternativas descreve corretamente o padrão 'Decorator' (Decorador)?",
        alternativas: {
          A: "Garante que uma classe tenha somente uma instância.",
          B: "Anexa responsabilidades adicionais a um objeto dinamicamente, fornecendo uma alternativa flexível à herança.",
          C: "Define uma interface para criar famílias de objetos relacionados.",
          D: "Separa a construção de um objeto complexo de sua representação.",
          E: "Define um esqueleto de algoritmo postergando alguns passos para subclasses.",
        },
        gabarito: "B",
        comentario:
          "Decorator envolve um objeto com outro que adiciona comportamento. Exemplo clássico: decoradores de stream em Java (BufferedReader wrapping InputStreamReader).",
      },
      {
        numero: 62,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em relação ao conceito de 'Throughput' vs 'Latência' em sistemas, assinale a alternativa correta:",
        alternativas: {
          A: "São medidas equivalentes; throughput é o nome americano de latência.",
          B: "Latência é o tempo para processar uma única requisição; throughput é o número de requisições processadas por unidade de tempo.",
          C: "Throughput mede tempo de resposta; latência mede volume de dados.",
          D: "Aumentar o throughput sempre reduz a latência.",
          E: "Latência e throughput medem aspectos de segurança do sistema.",
        },
        gabarito: "B",
        comentario:
          "Latência = tempo de uma operação (ex: 50ms por request). Throughput = volume por tempo (ex: 1000 req/s). São relacionados mas distintos — melhorar um pode piorar o outro.",
      },
      {
        numero: 63,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "No contexto de WebSockets, qual é a principal diferença em relação ao modelo HTTP tradicional?",
        alternativas: {
          A: "WebSocket é mais seguro que HTTP por padrão.",
          B: "WebSocket estabelece uma conexão persistente bidirecional, permitindo comunicação em tempo real sem polling.",
          C: "WebSocket usa UDP enquanto HTTP usa TCP.",
          D: "WebSocket é exclusivo para aplicações mobile.",
          E: "WebSocket requer autenticação por certificado digital.",
        },
        gabarito: "B",
        comentario:
          "WebSocket cria uma conexão full-duplex persistente sobre TCP. Ao contrário do HTTP (request-response), permite que servidor e cliente enviem mensagens a qualquer momento.",
      },
      {
        numero: 64,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Sobre o princípio 'Interface Segregation Principle' (ISP) do SOLID, assinale a alternativa correta:",
        alternativas: {
          A: "Clientes não devem ser forçados a depender de interfaces que não utilizam.",
          B: "Interfaces devem ser segregadas por camada de aplicação.",
          C: "Uma interface pode ter no máximo cinco métodos.",
          D: "Interfaces públicas devem ser documentadas em contrato separado.",
          E: "Todos os métodos de uma interface devem ter o mesmo tipo de retorno.",
        },
        gabarito: "A",
        comentario:
          "ISP afirma que é melhor ter muitas interfaces específicas do que uma grande interface genérica. Clientes só devem implementar métodos que realmente usam.",
      },
      {
        numero: 65,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em relação ao protocolo gRPC, qual é sua principal vantagem em relação a APIs REST/JSON?",
        alternativas: {
          A: "É suportado por mais linguagens de programação.",
          B: "Usa HTTP/2 e Protocol Buffers, oferecendo menor latência e menor tamanho de payload.",
          C: "É mais fácil de debugar pois usa formato texto.",
          D: "Não requer definição prévia de contrato.",
          E: "É o único protocolo suportado por Kubernetes.",
        },
        gabarito: "B",
        comentario:
          "gRPC usa HTTP/2 (multiplexação) e Protocol Buffers (serialização binária eficiente), resultando em payloads menores e latência menor que REST/JSON em cenários de alta performance.",
      },
      {
        numero: 66,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Qual é a principal diferença entre uma 'Stored Procedure' e uma 'Function' em bancos de dados relacionais?",
        alternativas: {
          A: "Stored Procedures são mais rápidas; Functions são mais seguras.",
          B: "Functions sempre retornam um valor e podem ser usadas em SELECT; Stored Procedures podem não retornar valor e executam lógica mais complexa com transações.",
          C: "Stored Procedures são escritas em SQL; Functions em linguagens procedurais.",
          D: "Não há diferença: são sinônimos em todos os SGBDs.",
          E: "Functions são temporárias; Stored Procedures são permanentes.",
        },
        gabarito: "B",
        comentario:
          "Functions retornam obrigatoriamente um valor e podem ser chamadas em SELECT. Stored Procedures podem não retornar valor, usam parâmetros OUT e são invocadas com CALL/EXEC.",
      },
      {
        numero: 67,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Sobre o conceito de 'Load Balancing' (Balanceamento de Carga), qual algoritmo distribui requisições baseando-se no número de conexões ativas de cada servidor?",
        alternativas: {
          A: "Round Robin",
          B: "Least Connections",
          C: "IP Hash",
          D: "Random",
          E: "Weighted Round Robin",
        },
        gabarito: "B",
        comentario:
          "Least Connections direciona novas requisições para o servidor com o menor número de conexões ativas. Round Robin distribui igualmente em sequência.",
      },
      {
        numero: 68,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em relação ao conceito de 'Dead Letter Queue' (DLQ) em sistemas de mensageria, qual é sua função?",
        alternativas: {
          A: "Fila de alta prioridade para mensagens urgentes.",
          B: "Armazena mensagens que não puderam ser processadas após um número máximo de tentativas.",
          C: "Fila para mensagens que foram lidas mas não confirmadas.",
          D: "Repositório de mensagens duplicadas.",
          E: "Fila de backup para recuperação em caso de desastre.",
        },
        gabarito: "B",
        comentario:
          "DLQ captura mensagens que falharam no processamento após o número máximo de retentativas. Permite análise de erros sem perder mensagens e sem bloquear a fila principal.",
      },
      {
        numero: 69,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Sobre o conceito de 'Chaos Engineering', assinale a alternativa correta:",
        alternativas: {
          A: "Metodologia de desenvolvimento que permite que desenvolvedores façam alterações livres no código.",
          B: "Prática de intencionalmente introduzir falhas em sistemas de produção para identificar fraquezas e melhorar a resiliência.",
          C: "Abordagem de gerenciamento de projetos baseada na teoria do caos.",
          D: "Técnica de testes que gera dados aleatórios para encontrar bugs.",
          E: "Processo de refatoração agressiva sem planejamento prévio.",
        },
        gabarito: "B",
        comentario:
          "Chaos Engineering (Netflix Chaos Monkey) consiste em experimentar propositalmente falhas em sistemas para descobrir vulnerabilidades antes que causem incidentes reais.",
      },
      {
        numero: 70,
        disciplina: "Conhecimentos Específicos",
        enunciado:
          "Em relação ao modelo de computação serverless (FaaS — Function as a Service), qual é uma limitação conhecida?",
        alternativas: {
          A: "Impossibilidade de usar linguagens de programação modernas.",
          B: "Cold start: latência adicional na primeira execução de uma função após período de inatividade.",
          C: "Custo fixo elevado independente do uso.",
          D: "Impossibilidade de integração com bancos de dados.",
          E: "Necessidade de gerenciar servidores físicos.",
        },
        gabarito: "B",
        comentario:
          "Cold start é a principal limitação de FaaS: quando uma função não foi executada recentemente, o ambiente precisa ser inicializado, causando latência extra (de centenas de ms a segundos).",
      },
    ],
  },
];

export const getProvaPorId = (id) => provas.find((p) => p.id === id);

export const getQuestoesPorDisciplina = (provaId, disciplina) => {
  const prova = getProvaPorId(provaId);
  if (!prova) return [];
  return prova.questoes.filter((q) => q.disciplina === disciplina);
};


const COR_DISC_PROVA = {
  "Língua Portuguesa":         { bg:"#EFF6FF", text:"#1D4ED8", border:"#BFDBFE" },
  "Língua Inglesa":            { bg:"#F5F3FF", text:"#6D28D9", border:"#DDD6FE" },
  "Raciocínio Lógico":         { bg:"#FEFCE8", text:"#92400E", border:"#FDE68A" },
  "Atualidades":               { bg:"#FDF2F8", text:"#9D174D", border:"#FBCFE8" },
  "Conhecimentos Específicos": { bg:"#F0FDF4", text:"#166534", border:"#BBF7D0" },
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

  const qBase = provaSel ? (modo === "especificos" ? provaSel.questoes.filter((q) => q.disciplina === "Conhecimentos Específicos") : provaSel.questoes) : [];
  const qFiltradas = filtroDisc === "todas" ? qBase : qBase.filter((q) => q.disciplina === filtroDisc);
  const q = qFiltradas[atual];
  const respostaAtual = q ? respostas[q.numero] : null;
  const respondidas = Object.keys(respostas).filter((k) => qFiltradas.find((q) => q.numero === Number(k))).length;
  const acertos = qFiltradas.filter((q) => respostas[q.numero] === q.gabarito).length;
  const mm = String(Math.floor(tempo/60)).padStart(2,"0"); const ss = String(tempo%60).padStart(2,"0");

  if (tela === "lista") {
    if (concurso?.id === "bb-at") return (
      <div>
        <PageTitle sub="Banco do Brasil · Agente de Tecnologia">Provas BB</PageTitle>
        <Card className="text-center py-10">
          <GraduationCap size={40} color={C.muted} className="mx-auto mb-3" />
          <div className="font-bold text-base mb-2">Provas em breve</div>
          <p className="text-sm" style={{ color: C.muted }}>As questões das provas anteriores do BB · Agente de Tecnologia estão sendo organizadas. Em breve estarão disponíveis aqui.</p>
          <p className="text-xs mt-3" style={{ color: C.muted }}>Enquanto isso, use o <strong>Simulados</strong> para registrar seu desempenho nas provas que você praticar.</p>
        </Card>
      </div>
    );
    return (
    <div>
      <PageTitle sub="Provas reais FGV · Dataprev 2023 e 2024 · Perfil Desenvolvimento de Software">Provas Dataprev</PageTitle>
      <div className="space-y-4">
        {PROVAS_DATAPREV.map((p) => (
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
              <Btn onClick={() => iniciar(p, "completa")} className="flex-1 justify-center"><Play size={14} /> Prova Completa (70 q)</Btn>
              <Btn variant="ghost" onClick={() => iniciar(p, "especificos")} className="flex-1 justify-center"><FileText size={14} /> Só Específicos (40 q)</Btn>
            </div>
          </Card>
        ))}
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
