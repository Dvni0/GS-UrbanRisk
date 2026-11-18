"use client";

import { useMemo, useState } from "react";

type Screen = "login" | "dashboard" | "alerts" | "detail" | "confidence" | "report" | "notifications" | "triage" | "analytics";
type AlertFilters = { category: string; risk: string; source: string; status: string };
type TriageOutcome = "confirmed" | "discarded" | null;

const navigation: { id: Screen; label: string; icon: string }[] = [
  { id: "dashboard", label: "Painel geral", icon: "grid" },
  { id: "alerts", label: "Lista de alertas", icon: "list" },
  { id: "notifications", label: "Notificações", icon: "bell" },
  { id: "report", label: "Registrar ocorrência", icon: "plus" },
  { id: "triage", label: "Triagem operacional", icon: "shield" },
  { id: "analytics", label: "Análises e LGPD", icon: "chart" },
];

const alertsData = [
  { id: "UR-2841", title: "Alagamento severo", location: "Av. Anhaia Mello · Vila Prudente", category: "Alagamento", risk: "Crítico", source: "Sensor IoT", confidence: "100%", status: "Alerta emitido", time: "há 4 min" },
  { id: "UR-2838", title: "Acúmulo de água", location: "R. Ibitirama · São Lucas", category: "Alagamento", risk: "Alto", source: "Comunidade", confidence: "78%", status: "Em validação", time: "há 11 min" },
  { id: "UR-2835", title: "Temperatura elevada", location: "Pq. do Carmo · Itaquera", category: "Ilha de calor", risk: "Moderado", source: "Base pública", confidence: "86%", status: "Confirmado", time: "há 18 min" },
  { id: "UR-2832", title: "Queda de energia", location: "R. das Rosas · Sapopemba", category: "Energia", risk: "Alto", source: "Comunidade", confidence: "65%", status: "Em validação", time: "há 26 min" },
  { id: "UR-2827", title: "Interrupção no abastecimento", location: "R. Silva Bueno · Ipiranga", category: "Água", risk: "Moderado", source: "Base pública", confidence: "87%", status: "Confirmado", time: "há 35 min" },
  { id: "UR-2829", title: "Bloqueio de via", location: "Av. do Oratório · Mooca", category: "Transporte", risk: "Baixo", source: "Base pública", confidence: "91%", status: "Em monitoramento", time: "há 42 min" },
];

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    chart: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-5 5" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5M12 3v12" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.grid}</svg>;
}

function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function Badge({ children, tone = "blue" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function MapPanel({
  compact = false,
  onMarkerClick,
  visibleCategories,
  onMapClick,
  selectedPin,
}: {
  compact?: boolean;
  onMarkerClick?: () => void;
  visibleCategories?: string[];
  onMapClick?: (x: number, y: number) => void;
  selectedPin?: { x: number; y: number };
}) {
  const markerIsVisible = (category: string) => !visibleCategories || visibleCategories.includes(category);
  return (
    <div className={`map-panel ${compact ? "map-compact" : ""}`} onClick={onMapClick ? (event) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      onMapClick(
        Math.round(((event.clientX - bounds.left) / bounds.width) * 100),
        Math.round(((event.clientY - bounds.top) / bounds.height) * 100),
      );
    } : undefined}>
      <div className="map-neighborhood n1">VILA PRUDENTE</div>
      <div className="map-neighborhood n2">SÃO LUCAS</div>
      <div className="map-neighborhood n3">IPIRANGA</div>
      <div className="map-neighborhood n4">SAPOPEMBA</div>
      <div className="map-park"><span>Parque Ecológico</span></div>
      <div className="map-river" />
      <div className="map-road road-a" /><div className="map-road road-b" /><div className="map-road road-c" /><div className="map-road road-d" />
      <div className="map-road road-e" /><div className="map-road road-f" /><div className="map-road road-g" />
      <span className="map-label label-a">Av. Anhaia Mello</span><span className="map-label label-b">R. Ibitirama</span>
      {markerIsVisible("Alagamento") && <><button className="map-marker marker-critical" aria-label="Risco crítico: alagamento UR-2841" title="Alagamento crítico · UR-2841" onClick={onMarkerClick}><span>!</span></button><button className="map-marker marker-high" aria-label="Risco alto: alagamento UR-2838" title="Alagamento alto · UR-2838" onClick={onMarkerClick}><span>!</span></button></>}
      {markerIsVisible("Ilha de calor") && <button className="map-marker marker-warm" aria-label="Risco moderado: ilha de calor" title="Ilha de calor · UR-2835" onClick={onMarkerClick}><span>°</span></button>}
      {markerIsVisible("Energia") && <button className="map-marker marker-blue" aria-label="Risco alto: energia" title="Queda de energia · UR-2832" onClick={onMarkerClick}><span>ϟ</span></button>}
      {markerIsVisible("Água") && <button className="map-marker marker-water" aria-label="Risco moderado: abastecimento de água" title="Abastecimento de água"><span>H₂O</span></button>}
      {markerIsVisible("Transporte") && <button className="map-marker marker-transport" aria-label="Risco baixo: transporte" title="Bloqueio de transporte · UR-2829"><span>↔</span></button>}
      {selectedPin && <span className="report-pin" style={{ left: `${selectedPin.x}%`, top: `${selectedPin.y}%` }} aria-label="Pino de localização selecionado" />}
      {!compact && <div className="map-zoom"><button aria-label="Aproximar">+</button><button aria-label="Afastar">−</button></div>}
      <div className="map-attribution">◈  Mapa de riscos · Zona Leste, São Paulo</div>
    </div>
  );
}

function ScreenHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="screen-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("login");
  const [role, setRole] = useState("Morador");
  const [consent, setConsent] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [alertFilters, setAlertFilters] = useState<AlertFilters>({ category: "Todas", risk: "Todos", source: "Todas", status: "Todos" });
  const [alertSearch, setAlertSearch] = useState("");
  const [mapCategories, setMapCategories] = useState(["Alagamento", "Ilha de calor", "Energia", "Água", "Transporte"]);
  const [reportType, setReportType] = useState("Alagamento");
  const [reportSent, setReportSent] = useState(false);
  const [noticeFilter, setNoticeFilter] = useState("Todas");
  const [readNotices, setReadNotices] = useState(false);
  const [quietHours, setQuietHours] = useState(false);
  const [triaged, setTriaged] = useState<TriageOutcome>(null);
  const [muted, setMuted] = useState(false);
  const [accountMessage, setAccountMessage] = useState("");

  const filteredAlerts = useMemo(() => {
    const query = alertSearch.trim().toLocaleLowerCase("pt-BR");
    return alertsData.filter((alert) => (
      (alertFilters.category === "Todas" || alert.category === alertFilters.category)
      && (alertFilters.risk === "Todos" || alert.risk === alertFilters.risk)
      && (alertFilters.source === "Todas" || alert.source === alertFilters.source)
      && (alertFilters.status === "Todos" || alert.status === alertFilters.status)
      && (!query || [alert.id, alert.title, alert.location, alert.category, alert.source, alert.status].some((value) => value.toLocaleLowerCase("pt-BR").includes(query)))
    ));
  }, [alertFilters, alertSearch]);

  function navigate(next: Screen) {
    if (next === "triage" && role !== "Agente local") return;
    setScreen(next);
    if (next === "report") setReportSent(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (screen === "login") {
    return (
      <main className="login-page">
        <div className="login-brand"><span className="brand-mark"><span /></span><span>urbis<span className="brand-light">risk</span></span></div>
        <div className="login-layout">
          <section className="login-intro">
            <Badge tone="green"><span className="live-dot" /> PLATAFORMA CÍVICA DE PREVENÇÃO</Badge>
            <h1>Cidades mais<br /><span>preparadas.</span><br />Comunidades mais seguras.</h1>
            <p>Inteligência urbana que transforma dados em prevenção. Acompanhe riscos, compartilhe informações e ajude sua comunidade a agir antes.</p>
            <div className="login-proof"><div className="avatar-stack"><span>MC</span><span>JP</span><span>AL</span></div><div><strong>Uma rede que cuida de todos</strong><small>Moradores e agentes conectados em tempo real</small></div></div>
            <div className="login-map"><MapPanel compact /></div>
            <div className="login-stat"><strong>12.480</strong><span>pessoas protegidas hoje</span><i>↗ 18%</i></div>
          </section>
          <section className="login-card">
            <div className="login-card-head"><span className="mini-mark"><Icon name="shield" size={19} /></span><span className="secure-label"><span className="live-dot" /> CONEXÃO SEGURA</span></div>
            <h2>Bem-vindo de volta</h2><p className="card-subtitle">Acesse sua conta para acompanhar sua região.</p>
            <label className="field-label" htmlFor="email">E-mail</label><input id="email" className="input" type="email" defaultValue="morador@email.com" placeholder="voce@email.com" />
            <label className="field-label" htmlFor="password">Senha</label><input id="password" className="input" type="password" defaultValue="prototipo123" placeholder="Sua senha" />
            <div className="form-row"><span className="field-label">Entrar como</span><button className="text-button" type="button">Esqueceu a senha?</button></div>
            <div className="role-picker"><button type="button" className={role === "Morador" ? "role-option selected" : "role-option"} onClick={() => setRole("Morador")}><span className="role-symbol">⌂</span><span><b>Morador</b><small>Minha comunidade</small></span>{role === "Morador" && <span className="radio-dot" />}</button><button type="button" className={role === "Agente local" ? "role-option selected" : "role-option"} onClick={() => setRole("Agente local")}><span className="role-symbol agent-symbol"><Icon name="shield" size={18} /></span><span><b>Agente local</b><small>Defesa Civil</small></span>{role === "Agente local" && <span className="radio-dot" />}</button></div>
            <label className="consent-row"><input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); setLoginError(false); }} /><span><b>Obrigatório:</b> autorizo a coleta mínima de localização para mostrar riscos próximos. Posso revogar essa permissão a qualquer momento. <button className="inline-link" type="button" onClick={() => navigate("analytics")}>Saiba mais</button></span></label>
            {loginError && <p className="login-error">Para continuar, confirme o consentimento de localização.</p>}
            <button type="button" className="button primary full-button" onClick={() => { if (!consent) { setLoginError(true); return; } navigate("dashboard"); }}><span>Acessar plataforma</span><Icon name="arrow" size={17} /></button>
            <div className="login-foot"><span>◈ Seus dados são protegidos pela LGPD</span><span>Não tem conta? <button className="inline-link" type="button">Cadastre-se</button></span></div>
          </section>
        </div>
        <footer className="login-footer"><span>© 2025 UrbanRisk · Inteligência urbana para todos</span><span>Privacidade &nbsp;·&nbsp; Acessibilidade &nbsp;·&nbsp; Ajuda</span></footer>
      </main>
    );
  }

  const titleMap: Record<Exclude<Screen, "login">, string> = {
    dashboard: "Painel geral", alerts: "Lista de alertas", detail: "Detalhe do alerta", confidence: "Origem e confiança", report: "Registrar ocorrência", notifications: "Central de notificações", triage: "Triagem operacional", analytics: "Análises e LGPD",
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand sidebar-brand" onClick={() => navigate("dashboard")}><span className="brand-mark"><span /></span><span>urbis<span className="brand-light">risk</span></span></button>
        <div className="workspace-label">ESPAÇO DE TRABALHO</div>
        <button className="region-switch"><span className="region-pin"><Icon name="pin" size={17} /></span><span><small>REGIÃO MONITORADA</small><b>Zona Leste, SP</b></span><Icon name="chevron" size={15} /></button>
        <div className="nav-label">MENU PRINCIPAL</div>
        <nav className="main-nav" aria-label="Navegação principal">
          {navigation.filter((item) => item.id !== "triage" || role === "Agente local").map((item) => <button key={item.id} aria-label={item.label} className={`nav-item ${screen === item.id || (screen === "detail" && item.id === "alerts") || (screen === "confidence" && item.id === "alerts") ? "active" : ""}`} onClick={() => navigate(item.id)}><Icon name={item.icon} size={18} /><span>{item.label}</span>{item.id === "notifications" && <span className="nav-count">3</span>}</button>)}
        </nav>
        <div className="sidebar-status"><div className="status-icon"><Icon name="shield" size={18} /></div><div><b>Região protegida</b><span>Sistemas operando normalmente</span></div><span className="live-dot" /></div>
        <div className="sidebar-bottom"><button className="help-link"><span className="help-circle">?</span> Central de ajuda <Icon name="arrow" size={14} /></button><button className="profile-button"><span className="profile-avatar">{role === "Morador" ? "MC" : "DC"}</span><span><b>{role === "Morador" ? "Marina Costa" : "Agente Defesa Civil"}</b><small>{role} · Zona Leste</small></span><span className="profile-more">···</span></button></div>
      </aside>
      <main className="main-area">
        <header className="topbar"><div className="breadcrumb"><span>UrbanRisk</span><Icon name="chevron" size={14} /><b>{titleMap[screen]}</b></div><div className="topbar-actions"><div className="sync-status"><span className="live-dot" /><span><b>Ao vivo</b><small>Atualizado há 12s</small></span></div><button className="icon-button notification-button" aria-label="Notificações" onClick={() => navigate("notifications")}><Icon name="bell" size={19} /><i /></button><span className="topbar-divider" /><button className="topbar-user" onClick={() => navigate("login")}><span className="profile-avatar small-avatar">{role === "Morador" ? "MC" : "DC"}</span><Icon name="chevron" size={14} /></button></div></header>
        <div className="content-area">
          {screen === "dashboard" && <Dashboard navigate={navigate} categories={mapCategories} toggleCategory={(category) => setMapCategories((current) => current.includes(category) ? current.filter((value) => value !== category) : [...current, category])} />}
          {screen === "alerts" && <Alerts navigate={navigate} filters={alertFilters} setFilters={setAlertFilters} search={alertSearch} setSearch={setAlertSearch} alerts={filteredAlerts} />}
          {screen === "detail" && <Detail navigate={navigate} />}
          {screen === "confidence" && <Confidence navigate={navigate} />}
          {screen === "report" && <Report navigate={navigate} reportType={reportType} setReportType={setReportType} sent={reportSent} onSend={() => { setReportSent(true); }} />}
          {screen === "notifications" && <Notifications navigate={navigate} filter={noticeFilter} setFilter={setNoticeFilter} read={readNotices} setRead={setReadNotices} quietHours={quietHours} setQuietHours={setQuietHours} />}
          {screen === "triage" && <Triage navigate={navigate} triaged={triaged} onTriage={setTriaged} />}
          {screen === "analytics" && <Analytics muted={muted} setMuted={setMuted} message={accountMessage} setMessage={setAccountMessage} />}
        </div>
      </main>
    </div>
  );
}

function Dashboard({ navigate, categories, toggleCategory }: { navigate: (screen: Screen) => void; categories: string[]; toggleCategory: (category: string) => void }) {
  return <>
    <ScreenHeader eyebrow="DOMINGO, 15 DE NOVEMBRO DE 2026" title="Bom dia, Marina 👋" description="Aqui está o panorama de segurança da sua região." action={<button className="button primary" onClick={() => navigate("report")}><Icon name="plus" size={17} /> Registrar ocorrência</button>} />
    <div className="overview-line"><span className="overview-location"><Icon name="pin" size={15} /> Zona Leste · São Paulo</span><span className="overview-separator" /><span className="overview-updated"><Icon name="clock" size={14} /> Dados atualizados há 12 segundos</span></div>
    <div className="kpi-grid">
      <div className="kpi-card"><div className="kpi-top"><span>Alertas críticos ativos</span><span className="kpi-icon red"><Icon name="bell" size={18} /></span></div><div className="kpi-value">03 <span className="kpi-trend negative">↑ 2 hoje</span></div><div className="kpi-foot"><span className="mini-status red-dot" /> Exigem atenção imediata</div></div>
      <div className="kpi-card"><div className="kpi-top"><span>Sensores online</span><span className="kpi-icon green"><span className="signal-glyph">⌁</span></span></div><div className="kpi-value">98,4% <span className="kpi-trend positive">↑ 0,6%</span></div><div className="kpi-foot">61 de 62 dispositivos ativos</div></div>
      <div className="kpi-card"><div className="kpi-top"><span>Relatos em validação</span><span className="kpi-icon orange"><Icon name="clock" size={18} /></span></div><div className="kpi-value">12 <span className="kpi-trend neutral">4 novos</span></div><div className="kpi-foot">Tempo médio: 8 minutos</div></div>
      <div className="kpi-card"><div className="kpi-top"><span>Índice de calor</span><span className="kpi-icon amber">☼</span></div><div className="kpi-value">38° <span className="kpi-trend negative">Atenção</span></div><div className="kpi-foot">Sensação térmica · nível moderado</div></div>
    </div>
    <div className="dashboard-grid">
      <section className="panel map-card"><div className="panel-heading"><div><h2>Mapa de riscos</h2><p>Ocorrências ativas na Zona Leste</p></div><button className="subtle-button" onClick={() => navigate("alerts")}>Ver mapa completo <Icon name="arrow" size={14} /></button></div><div className="map-filters">{[["Alagamento", "6"], ["Ilha de calor", "3"], ["Energia", "2"], ["Água", "1"], ["Transporte", "1"]].map(([category, count]) => <button key={category} className={`filter-pill ${categories.includes(category) ? "selected" : ""}`} aria-pressed={categories.includes(category)} onClick={() => toggleCategory(category)}><span className={`filter-dot ${category === "Alagamento" ? "red-dot" : category === "Ilha de calor" ? "orange-dot" : category === "Energia" ? "blue-dot" : category === "Água" ? "teal-dot" : "purple-dot"}`} />{category} <span>{count}</span></button>)}</div><MapPanel visibleCategories={categories} onMarkerClick={() => navigate("detail")} /></section>
      <section className="panel priority-card"><div className="panel-heading"><div><h2>Alertas prioritários</h2><p>Ordenados por nível de risco</p></div><button className="more-button" aria-label="Mais opções">···</button></div><div className="priority-list">
        {alertsData.slice(0, 4).map((alert) => <button className="priority-item" key={alert.id} onClick={() => navigate("detail")}><span className={`priority-mark ${alert.risk.toLowerCase()}`} /><span className="priority-main"><span className="priority-title">{alert.title}</span><span className="priority-place"><Icon name="pin" size={12} />{alert.location.split(" · ")[0]}</span><span className="priority-badges"><Badge tone={alert.source === "Sensor IoT" ? "purple" : alert.source === "Comunidade" ? "teal" : "blue"}>{alert.source}</Badge><Badge tone="green">Confiança {alert.confidence}</Badge></span></span><span className="priority-time">{alert.time}</span></button>)}
      </div><button className="list-footer" onClick={() => navigate("alerts")}>Ver todos os alertas <Icon name="arrow" size={15} /></button></section>
    </div>
    <div className="dashboard-bottom"><div className="panel bottom-note"><span className="note-icon"><Icon name="shield" size={18} /></span><div><b>Você está em uma área monitorada</b><p>61 sensores e relatos da comunidade ajudam a manter sua região segura.</p></div><button className="subtle-button" onClick={() => navigate("confidence")}>Como funciona <Icon name="arrow" size={14} /></button></div><div className="last-updated">Latência do sistema <b>· 1,2s</b> <span className="live-dot" /></div></div>
  </>;
}

function Alerts({ navigate, filters, setFilters, search, setSearch, alerts }: { navigate: (screen: Screen) => void; filters: AlertFilters; setFilters: (filters: AlertFilters) => void; search: string; setSearch: (search: string) => void; alerts: typeof alertsData }) {
  const filterOptions: { key: keyof AlertFilters; label: string; values: string[] }[] = [
    { key: "category", label: "Categoria", values: ["Todas", "Alagamento", "Ilha de calor", "Energia", "Água", "Transporte"] },
    { key: "risk", label: "Severidade", values: ["Todos", "Crítico", "Alto", "Moderado", "Baixo"] },
    { key: "source", label: "Origem", values: ["Todas", "Sensor IoT", "Base pública", "Comunidade"] },
    { key: "status", label: "Estado", values: ["Todos", "Reportado", "Em validação", "Confirmado", "Alerta emitido", "Em monitoramento", "Encerrado", "Descartado"] },
  ];
  const exportAlerts = () => {
    const header = ["ID", "Evento", "Local", "Categoria", "Risco", "Origem", "Confiança", "Estado"];
    const rows = alerts.map((alert) => [alert.id, alert.title, alert.location, alert.category, alert.risk, alert.source, alert.confidence, alert.status]);
    downloadFile("urbanrisk-alertas.csv", [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n"), "text/csv;charset=utf-8");
  };
  return <>
    <ScreenHeader eyebrow="MONITORAMENTO DA REGIÃO" title="Lista de alertas" description="Acompanhe, filtre e priorize as ocorrências da sua região." action={<button className="button primary" onClick={() => navigate("report")}><Icon name="plus" size={17} /> Novo relato</button>} />
    <div className="alert-summary"><div><span className="summary-number red-text">03</span><span>Críticos</span></div><div><span className="summary-number orange-text">08</span><span>Em andamento</span></div><div><span className="summary-number blue-text">24</span><span>Últimas 24h</span></div><div className="summary-updated"><span className="live-dot" /> Sincronizado agora</div></div>
    <section className="panel table-panel"><div className="table-toolbar"><div className="search-field"><Icon name="search" size={17} /><input placeholder="Buscar alerta, local ou ID..." aria-label="Buscar alerta" value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="filter-buttons">{filterOptions.map(({ key, label, values }) => <label key={key} className="alert-filter"><span>{label}</span><select aria-label={`Filtrar por ${label.toLocaleLowerCase("pt-BR")}`} value={filters[key]} onChange={(event) => setFilters({ ...filters, [key]: event.target.value })}>{values.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>)}</div><button className="subtle-button export-button" onClick={exportAlerts}><Icon name="upload" size={15} /> Exportar</button></div>
      <div className="table-scroll"><table className="alerts-table"><thead><tr><th>ID</th><th>EVENTO & LOCAL</th><th>CATEGORIA</th><th>NÍVEL DE RISCO</th><th>ORIGEM</th><th>CONFIANÇA</th><th>ESTADO DO EVENTO</th><th /></tr></thead><tbody>{alerts.map((alert) => <tr key={alert.id}><td className="mono">{alert.id}</td><td><button className="table-event" onClick={() => navigate("detail")}><b>{alert.title}</b><span><Icon name="pin" size={12} />{alert.location}</span></button></td><td>{alert.category}</td><td><Badge tone={alert.risk === "Crítico" ? "red" : alert.risk === "Alto" ? "orange" : alert.risk === "Moderado" ? "amber" : "blue"}><span className="badge-dot" />{alert.risk}</Badge></td><td>{alert.source}</td><td><span className="confidence-cell">{alert.confidence}<span className="confidence-track"><i style={{ width: alert.confidence }} /></span></span></td><td><Badge tone={alert.status === "Alerta emitido" ? "red" : alert.status === "Em validação" ? "amber" : "green"}>{alert.status}</Badge></td><td><button className="inspect-button" onClick={() => navigate("detail")}>Inspecionar <Icon name="chevron" size={13} /></button></td></tr>)}</tbody></table></div>
      {alerts.length === 0 && <div className="empty-state">Nenhum alerta corresponde a esse filtro.</div>}
      <div className="table-pagination"><span>Exibindo <b>{alerts.length}</b> de <b>{alertsData.length}</b> ocorrências disponíveis</span></div>
    </section>
    <div className="table-footnote"><Icon name="shield" size={16} /><span>O nível de confiança reflete a validação cruzada entre sensores, bases públicas e relatos da comunidade.</span><button className="inline-link" onClick={() => navigate("confidence")}>Entenda os dados</button></div>
  </>;
}

function Detail({ navigate }: { navigate: (screen: Screen) => void }) {
  const steps = ["Reportado", "Em validação", "Confirmado", "Alerta emitido", "Em monitoramento", "Encerrado"];
  return <>
    <div className="back-link"><button onClick={() => navigate("alerts")}>← &nbsp;Voltar para alertas</button><span>Ocorrência <span className="mono">UR-2841</span></span></div>
    <div className="detail-title-row"><div><div className="eyebrow">ALAGAMENTO · VILA PRUDENTE</div><h1>Alagamento severo</h1><p>Av. Prof. Luiz Ignácio Anhaia Mello, 3.420 · São Paulo, SP</p></div><div className="detail-actions"><Badge tone="red"><span className="badge-dot" /> Crítico</Badge><Badge tone="green"><span className="badge-dot" /> Alerta emitido</Badge><button className="button secondary" onClick={() => navigate("confidence")}><Icon name="shield" size={16} /> Auditar origem e confiança</button></div></div>
    <div className="detail-meta"><span><Icon name="clock" size={15} /> Reportado há 18 minutos</span><span>·</span><span><Icon name="pin" size={15} /> -23.5924, -46.5741</span><span>·</span><span>Atualizado às 14:32</span></div>
    <section className="panel lifecycle-panel"><div className="section-title"><div><h2>Ciclo de vida da ocorrência</h2><p>Acompanhe cada etapa da validação</p></div><span className="mono subtle">UR-2841</span></div><div className="lifecycle">{steps.map((step, index) => <div key={step} className={`lifecycle-step ${index < 4 ? "completed" : ""} ${index === 3 ? "current" : ""}`}><span className="step-node">{index < 3 ? <Icon name="check" size={13} /> : index + 1}</span><span>{step}</span><small>{["14:14", "14:17", "14:24", "14:32", "—", "—"][index]}</small></div>)}</div><div className="lifecycle-discarded"><span className="step-node"><Icon name="close" size={12} /></span><span><b>Descartado</b> · estado terminal alternativo, após triagem operacional</span></div></section>
    <div className="detail-grid"><div className="detail-main-column"><section className="panel incident-panel"><div className="section-title"><div><h2>Resumo do incidente</h2><p>Informações consolidadas das fontes disponíveis</p></div><Badge tone="green">Confiança alta · 100%</Badge></div><p className="incident-copy">Elevação rápida do nível da água identificada no trecho próximo ao Córrego da Mooca. O cruzamento de telemetria pluviométrica com relatos locais indica risco de transbordamento e bloqueio parcial da via.</p><div className="incident-stats"><div><span>Altura estimada</span><b>68 cm · extrema</b></div><div><span>Área afetada</span><b>~ 350 m²</b></div><div><span>Fontes confirmadas</span><b>3 de 3</b></div></div><div className="risk-calculation"><b>Índice de risco:</b> S4 × M1,25 × C100% = 5,00 · Crítico</div><div className="incident-map"><MapPanel compact /></div></section>
      <section className="panel recommendation-panel"><div className="section-title"><div><h2>Impacto e ações recomendadas</h2><p>Orientações para moradores e equipes de campo</p></div></div><div className="recommendation-list"><div><span className="recommendation-icon orange-icon">↗</span><p><b>Evite o trecho da Av. Anhaia Mello</b><span>Bloqueio parcial sentido centro. Utilize a Av. Paes de Barros como rota alternativa.</span></p></div><div><span className="recommendation-icon blue-icon">⌂</span><p><b>Infraestrutura crítica próxima</b><span>Hospital Vila Prudente a 0,4 km · E.E. Prof. Américo de Moura a 0,6 km</span></p></div><div><span className="recommendation-icon green-icon">✓</span><p><b>Recomendação preventiva</b><span>Não atravesse áreas alagadas a pé ou de veículo. Acione 199 em caso de emergência.</span></p></div></div></section>
      </div><aside className="detail-side-column"><section className="panel detail-side-card"><h3>Fontes de informação</h3><div className="source-list"><div><span className="source-icon purple"><span>◉</span></span><p><b>Sensor pluviométrico</b><small>SP-042 · 48 mm/h</small></p><span className="source-check">✓</span></div><div><span className="source-icon blue"><span>◈</span></span><p><b>Base Defesa Civil</b><small>Boletim ativo · 14:26</small></p><span className="source-check">✓</span></div><div><span className="source-icon teal"><span>♧</span></span><p><b>Comunidade</b><small>4 relatos · últimos 15 min</small></p><span className="source-check">✓</span></div></div><button className="subtle-button full-subtle" onClick={() => navigate("confidence")}>Ver auditoria completa <Icon name="arrow" size={14} /></button></section><section className="panel response-card"><div className="response-top"><span className="response-icon"><Icon name="shield" size={17} /></span><Badge tone="green">Ativa</Badge></div><h3>Equipe de resposta</h3><p>Defesa Civil · Núcleo Vila Prudente</p><div className="response-person"><span className="response-avatar">DC</span><span><b>Equipe de plantão</b><small>Acionada às 14:32 · ETA 8 min</small></span></div></section><button className="audit-link" onClick={() => navigate("confidence")}><Icon name="clock" size={15} /> Ver histórico de atualizações <Icon name="chevron" size={14} /></button></aside></div>
  </>;
}

function Confidence({ navigate }: { navigate: (screen: Screen) => void }) {
  return <>
    <div className="back-link"><button onClick={() => navigate("detail")}>← &nbsp;Voltar para ocorrência</button><span>Transparência dos dados</span></div>
    <ScreenHeader eyebrow="AUDITORIA · OCORRÊNCIA UR-2841" title="De onde vêm esses dados?" description="Veja como as fontes foram cruzadas para gerar este alerta." />
    <div className="confidence-layout"><section className="panel confidence-score-panel"><div className="score-eyebrow"><span className="live-dot" /> ÍNDICE DE CONFIANÇA</div><div className="score-meter"><div className="score-circle"><div><strong>100</strong><span>%</span></div><small>ALTA</small></div></div><h2>Alta confiabilidade</h2><p>Base pública oficial corroborada por sensor calibrado e relatos independentes.</p><div className="score-breakdown"><div><span>Base pública oficial</span><b>90 pts</b></div><div><span>Convergência multi-fonte</span><b>+ 20 pts</b></div><div><span>Teto regulamentar aplicado</span><b>100 pts</b></div><div className="score-total"><span>Score consolidado</span><b>100 / 100</b></div></div><div className="formula-note"><span>i</span><p>Confiança = pontuação-base + bônus de corroboração, limitada a 100%. Relatos isolados não ultrapassam 65%.</p></div></section>
      <div className="confidence-sources"><section className="panel source-detail-card"><div className="source-detail-head"><span className="source-icon purple"><span>◉</span></span><div><h3>Sensor IoT pluviométrico</h3><small>ID <span className="mono">SP-042</span> · Rede municipal</small></div><Badge tone="purple">C_BASE 85%</Badge></div><div className="source-data-grid"><div><span>LEITURA ATUAL</span><b>48 <small>mm/h</small></b></div><div><span>CALIBRAÇÃO</span><b className="healthy">Válida <i>✓</i></b></div><div><span>ÚLTIMA LEITURA</span><b>17:31:42 UTC</b></div></div><div className="source-progress"><span style={{ width: "96%" }} /></div><small className="source-quality">Qualidade do sinal <b>96%</b></small></section>
        <section className="panel source-detail-card"><div className="source-detail-head"><span className="source-icon blue"><span>◈</span></span><div><h3>API CEMADEN / Defesa Civil</h3><small>Boletim hidrometeorológico</small></div><Badge tone="blue">C_BASE 90%</Badge></div><div className="public-notice"><span className="notice-check">✓</span><span><b>Boletim ativo na região</b><small>Risco de alagamento · emitido às 17:26 UTC</small></span></div><div className="source-meta"><span>Fonte oficial</span><b>cemaden.gov.br</b><span>Atualização</span><b>17:26 UTC</b></div></section>
        <section className="panel source-detail-card"><div className="source-detail-head"><span className="source-icon teal"><span>♧</span></span><div><h3>Registros da comunidade</h3><small>Relatos geolocalizados e anonimizados</small></div><Badge tone="teal">C_BASE 30%</Badge></div><div className="community-count"><strong>4</strong><span>relatos confirmados<br /><b>num raio de 300 m</b></span><span className="community-time">nos últimos 15 min</span></div><div className="privacy-inline"><Icon name="shield" size={15} /> Dados pessoais removidos antes da análise.</div></section></div></div>
    <section className="panel audit-log"><div className="section-title"><div><h2>Log de auditoria</h2><p>Eventos com origem identificada e horário UTC; a imutabilidade do registro depende do serviço de auditoria.</p></div><button className="subtle-button" onClick={() => downloadFile("urbanrisk-auditoria.csv", "timestamp_utc,source_id,event\n2026-11-15T17:31:42Z,SRC-SP-042,Leitura pluviométrica recebida\n2026-11-15T17:30:18Z,API-CEMADEN,Boletim correlacionado\n2026-11-15T17:28:06Z,COMMUNITY,Relatos agrupados\n2026-11-15T17:14:32Z,URBANRISK,Alerta UR-2841 criado", "text/csv;charset=utf-8")}><Icon name="upload" size={14} /> Baixar registro</button></div><div className="audit-timeline"><div><i className="timeline-dot purple-dot" /><time>17:31:42Z</time><b>Leitura recebida do sensor SP-042</b><span>48 mm/h · SHA-256: demonstrativo</span><Badge tone="green">SRC-SP-042</Badge></div><div><i className="timeline-dot blue-dot" /><time>17:30:18Z</time><b>Boletim CEMADEN correlacionado</b><span>Risco hidrometeorológico · SHA-256: demonstrativo</span><Badge tone="green">API-CEMADEN</Badge></div><div><i className="timeline-dot teal-dot" /><time>17:28:06Z</time><b>4 relatos comunitários agrupados</b><span>Raio de 300 m · SHA-256: demonstrativo</span><Badge tone="green">COMMUNITY</Badge></div><div><i className="timeline-dot red-dot" /><time>17:14:32Z</time><b>Alerta UR-2841 criado</b><span>Confiança 100% · risco crítico · SHA-256: demonstrativo</span><Badge tone="purple">URBANRISK</Badge></div></div></section>
  </>;
}

function Report({ navigate, reportType, setReportType, sent, onSend }: { navigate: (screen: Screen) => void; reportType: string; setReportType: (type: string) => void; sent: boolean; onSend: () => void }) {
  const [pinPosition, setPinPosition] = useState({ x: 50, y: 45 });
  const [description, setDescription] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [locationLabel, setLocationLabel] = useState("Av. Prof. Luiz Ignácio Anhaia Mello, Vila Prudente");

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError("Este navegador não disponibiliza localização.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPinPosition({ x: 50, y: 45 });
        setLocationLabel(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
        setLocationError("");
      },
      () => setLocationError("Não foi possível obter sua localização. Ajuste o pino no mapa."),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  if (sent) return <div className="success-page"><div className="success-icon"><Icon name="check" size={30} /></div><Badge tone="green">RELATO RECEBIDO</Badge><h1>Obrigado por cuidar<br />da sua comunidade.</h1><p>Seu relato <b className="mono">UR-2846</b> foi enviado para validação. Você receberá uma atualização quando o status mudar.</p><div className="success-progress"><span>Reportado</span><i /><span>Em validação</span><i className="empty-progress" /><span>Confirmado</span></div><div className="success-buttons"><button className="button primary" onClick={() => navigate("alerts")}>Acompanhar relato <Icon name="arrow" size={16} /></button><button className="button secondary" onClick={() => navigate("dashboard")}>Voltar ao painel</button></div></div>;
  const types = ["Alagamento", "Ilha de calor", "Queda de energia", "Falta d'água", "Bloqueio de transporte"];
  return <>
    <ScreenHeader eyebrow="SUA VOZ FAZ A DIFERENÇA" title="Registrar ocorrência" description="Compartilhe o que está acontecendo. Seu relato ajuda toda a comunidade." />
    <div className="report-layout"><section className="panel report-form"><div className="form-section-title"><span>01</span><div><h2>O que está acontecendo?</h2><p>Selecione o tipo de ocorrência que você identificou.</p></div></div><div className="risk-type-grid">{types.map((type, index) => <button key={type} className={`risk-type ${reportType === type ? "selected" : ""}`} onClick={() => setReportType(type)}><span className={`type-icon type-${index}`}>{["≋", "☼", "ϟ", "◒", "⇄"][index]}</span><b>{type}</b>{reportType === type && <span className="type-selected"><Icon name="check" size={12} /></span>}</button>)}</div>
      <div className="form-section-title form-section-spaced"><span>02</span><div><h2>Onde está acontecendo?</h2><p>Marque o local aproximado no mapa. Sua localização exata não será compartilhada.</p></div></div><div className="report-map-wrap"><MapPanel compact onMapClick={(x, y) => setPinPosition({ x, y })} selectedPin={pinPosition} /><button className="locate-button" onClick={useCurrentLocation}><Icon name="pin" size={14} /> Usar minha localização</button></div>{locationError && <p className="location-error" role="status">{locationError}</p>}<div className="location-confirm"><span className="location-check">✓</span><span><b>Local aproximado identificado</b><small>{locationLabel}</small></span><button onClick={() => setPinPosition({ x: 50, y: 45 })}>Centralizar</button></div>
      <div className="form-section-title form-section-spaced"><span>03</span><div><h2>Conte mais detalhes</h2><p>Descreva o que observou para ajudar na validação.</p></div></div><label className="field-label" htmlFor="description">Descrição <span className="optional">OPCIONAL</span></label><textarea className="input textarea" id="description" placeholder="Ex.: água cobrindo metade da calçada, trânsito lento no sentido centro..." maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} /><div className="char-count">{description.length} / 500 caracteres</div><label className="field-label upload-label" htmlFor="report-photo">Adicionar foto <span className="optional">OPCIONAL</span></label><label className="upload-zone" htmlFor="report-photo"><span className="upload-icon"><Icon name="upload" size={20} /></span><span><b>{photoName || "Toque para enviar uma foto"}</b><small>JPG ou PNG · até 10 MB</small></span><input id="report-photo" type="file" accept="image/jpeg,image/png" onChange={(event) => { const photo = event.target.files?.[0]; if (!photo) return; if (photo.size > 10 * 1024 * 1024) { setPhotoName(""); setPhotoError("A foto deve ter no máximo 10 MB."); event.target.value = ""; return; } setPhotoError(""); setPhotoName(photo.name); }} /></label>{photoError && <p className="location-error" role="alert">{photoError}</p>}<div className="privacy-banner"><span><Icon name="shield" size={17} /></span><p><b>Sua privacidade é prioridade</b><small>Metadados da imagem e sua identidade são removidos antes que o relato seja exibido publicamente.</small></p><button className="inline-link" onClick={() => navigate("analytics")}>Saiba mais</button></div><button className="button primary submit-report" disabled={Boolean(photoError)} onClick={onSend}>Enviar relato <Icon name="arrow" size={16} /></button><p className="submit-caption">Ao enviar, você concorda com nossos <button className="inline-link">Termos de uso</button>.</p>
    </section><aside className="report-aside"><section className="panel report-guide"><span className="guide-icon"><Icon name="shield" size={19} /></span><h3>Como funciona?</h3><p>Seu relato passa por uma validação automática com sensores próximos e outros registros da região.</p><div className="guide-steps"><div><span>1</span><p><b>Você relata</b><small>Leva menos de 1 minuto</small></p></div><div><span>2</span><p><b>A comunidade confirma</b><small>Dados são cruzados automaticamente</small></p></div><div><span>3</span><p><b>Todos são alertados</b><small>Quando o risco é confirmado</small></p></div></div></section><section className="panel report-region"><h3>Na sua região hoje</h3><div><strong>12</strong><span>relatos enviados</span></div><div><strong>9</strong><span>ocorrências confirmadas</span></div><div><strong>4 min</strong><span>tempo médio de validação</span></div></section><button className="report-help"><span>?</span> Precisa de ajuda para relatar?</button></aside></div>
  </>;
}

function Notifications({ navigate, filter, setFilter, read, setRead, quietHours, setQuietHours }: { navigate: (screen: Screen) => void; filter: string; setFilter: (filter: string) => void; read: boolean; setRead: (read: boolean) => void; quietHours: boolean; setQuietHours: (enabled: boolean) => void }) {
  const [areas, setAreas] = useState(["Casa · Vila Prudente", "Trabalho · Ipiranga"]);
  const [editingAreas, setEditingAreas] = useState(false);
  const [newArea, setNewArea] = useState("");
  const [saved, setSaved] = useState(false);
  const [minimumSeverity, setMinimumSeverity] = useState("Moderado");
  const entries = [
    { id: "n1", type: "critical", title: "Alerta crítico de alagamento", text: "Risco de alagamento na Av. Anhaia Mello, a 800 m de você.", time: "há 4 min", tag: "CRÍTICO" },
    { id: "n2", type: "warning", title: "Novo relato na sua região", text: "Morador reportou acúmulo de água na R. Ibitirama.", time: "há 11 min", tag: "EM VALIDAÇÃO" },
    { id: "n3", type: "info", title: "Sensação térmica elevada", text: "Temperatura pode chegar a 38° entre 13h e 16h.", time: "há 32 min", tag: "INFORMATIVO" },
    { id: "n4", type: "success", title: "Ocorrência encerrada", text: "Bloqueio na R. das Rosas foi normalizado.", time: "ontem, 18:42", tag: "RESOLVIDO" },
  ];
  const filtered = entries.filter((entry) => filter === "Todas" || (filter === "Não lidas" ? !read && entry.id === "n1" : entry.type === "critical"));
  function addArea() {
    const value = newArea.trim();
    if (!value) return;
    setAreas((current) => [...current, value]);
    setNewArea("");
  }
  return <>
    <ScreenHeader eyebrow="ACOMPANHAMENTO PERSONALIZADO" title="Notificações" description="Fique por dentro do que acontece nas áreas que importam para você." action={<button className="button secondary" onClick={() => setRead(true)}><Icon name="check" size={15} /> Marcar todas como lidas</button>} />
    <div className="notifications-layout"><section className="panel notification-list-panel"><div className="notification-toolbar"><div className="segmented-control">{["Todas", "Não lidas", "Críticas"].map((item) => <button key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>{item}{item === "Não lidas" && !read && <i />}</button>)}</div><span>Últimas 24 horas</span></div><div className="notification-list">{filtered.map((entry) => <button key={entry.id} className={`notification-item ${!read && entry.id === "n1" ? "unread" : ""}`} onClick={() => { setRead(true); navigate("detail"); }}><span className={`notification-icon ${entry.type}`}>{entry.type === "critical" ? "!" : entry.type === "warning" ? "◉" : entry.type === "info" ? "☼" : "✓"}</span><span className="notification-copy"><span><b>{entry.title}</b><small>{entry.text}</small></span><span className="notification-meta"><Badge tone={entry.type === "critical" ? "red" : entry.type === "warning" ? "amber" : entry.type === "success" ? "green" : "blue"}>{entry.tag}</Badge><small>{entry.time}</small></span></span>{!read && entry.id === "n1" && <span className="unread-dot" />}</button>)}</div><button className="load-more">Carregar notificações anteriores <Icon name="chevron" size={14} /></button></section>
      <aside className="notification-settings"><section className="panel settings-card"><div className="settings-title"><span className="settings-icon"><Icon name="bell" size={17} /></span><div><h3>Preferências de alerta</h3><p>Personalize como quer ser avisado</p></div></div><div className="setting-item"><div><b>Áreas monitoradas</b><small>Receba alertas próximos a você</small></div><button className="edit-setting" onClick={() => setEditingAreas(!editingAreas)}>{editingAreas ? "Concluir" : "Editar"}</button></div>{areas.map((area, index) => <div className="area-chip" key={area}><span className={`live-dot ${index % 2 ? "blue-live" : ""}`} />{area}<button aria-label={`Remover ${area}`} onClick={() => setAreas((current) => current.filter((value) => value !== area))}>×</button></div>)}{editingAreas && <div className="area-editor"><input value={newArea} onChange={(event) => setNewArea(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addArea(); }} placeholder="Ex.: Escola · Mooca" aria-label="Nova região monitorada" /><button className="subtle-button" onClick={addArea}>Adicionar</button></div>}<div className="setting-item setting-separator"><div><b>Severidade mínima</b><small>Alertas abaixo deste nível não serão enviados</small></div></div><select className="select-input" value={minimumSeverity} onChange={(event) => setMinimumSeverity(event.target.value)} aria-label="Severidade mínima para alertas"><option>Todos os níveis</option><option>Moderado</option><option>Alto</option><option>Crítico</option></select><div className="setting-item setting-separator"><div><b>Horário silencioso</b><small>Alertas críticos são sempre enviados</small></div><button className={`toggle ${quietHours ? "on" : ""}`} onClick={() => setQuietHours(!quietHours)} aria-label="Ativar horário silencioso"><span /></button></div><div className="quiet-hours"><span>Das</span><input defaultValue="22:00" aria-label="Início do horário silencioso" /><span>às</span><input defaultValue="07:00" aria-label="Fim do horário silencioso" /></div><div className="channels-title">CANAIS DE NOTIFICAÇÃO</div><label className="channel-row"><span><span className="channel-icon">⌕</span><span><b>Notificações push</b><small>Alertas no seu dispositivo</small></span></span><input type="checkbox" defaultChecked /></label><label className="channel-row"><span><span className="channel-icon sms">SMS</span><span><b>SMS de emergência</b><small>Apenas para alertas críticos</small></span></span><input type="checkbox" defaultChecked /></label><button className="button primary save-settings" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}>Salvar preferências</button>{saved && <p className="settings-saved" role="status">Preferências salvas para esta sessão.</p>}</section><div className="notification-safety"><Icon name="shield" size={16} /> Sua segurança vem primeiro. Alertas críticos ignoram o horário silencioso.</div></aside></div>
  </>;
}

function Triage({ navigate, triaged, onTriage }: { navigate: (screen: Screen) => void; triaged: TriageOutcome; onTriage: (outcome: TriageOutcome) => void }) {
  const [selectedId, setSelectedId] = useState("UR-2838");
  const selectedAlert = alertsData.find((alert) => alert.id === selectedId) ?? alertsData[1];
  const queue = alertsData.filter((alert) => alert.status === "Em validação" && (!triaged || alert.id !== selectedId));
  const confidence = triaged === "confirmed" ? "100%" : triaged === "discarded" ? "0%" : selectedAlert.confidence;

  return <>
    <ScreenHeader eyebrow="PAINEL DO AGENTE · DEFESA CIVIL" title="Triagem operacional" description="Valide relatos da comunidade e coordene respostas na sua região." action={<button className="button secondary"><span className="live-dot" /> Plantão ativo</button>} />
    <div className="triage-stats"><div className="panel"><span className="triage-stat-icon amber">◷</span><div><b>{triaged ? "11" : "12"}</b><span>Aguardando validação</span></div><small>−1 na última hora</small></div><div className="panel"><span className="triage-stat-icon red">!</span><div><b>03</b><span>Prioridade alta</span></div><small className="urgent-text">Requer atenção</small></div><div className="panel"><span className="triage-stat-icon green">✓</span><div><b>08 min</b><span>Tempo médio de análise</span></div><small>Meta: até 15 min</small></div><div className="panel"><span className="triage-stat-icon blue"><Icon name="shield" size={17} /></span><div><b>24</b><span>Validado hoje</span></div><small>+ 6 vs. ontem</small></div></div>
    <div className="triage-layout"><section className="panel queue-panel"><div className="queue-heading"><div><h2>Fila de validação</h2><p>Relatos aguardando revisão do agente</p></div><button className="subtle-button">Prioridade <span>⌄</span></button></div><div className="queue-filters"><button className="selected">Todos <span>{queue.length}</span></button><button>Alta prioridade <span>3</span></button><button>Baixa confiança <span>4</span></button></div>{queue.length === 0 ? <div className="empty-state">Não há relatos pendentes para triagem.</div> : queue.map((item) => <button key={item.id} className={`queue-item ${item.id === selectedId ? "queue-selected" : ""}`} onClick={() => { setSelectedId(item.id); onTriage(null); }}><span className={`queue-risk ${item.risk === "Alto" || item.risk === "Crítico" ? "risk-high" : ""}`}><Icon name="pin" size={16} /></span><span className="queue-copy"><b>{item.title}</b><small>{item.location}</small><span><Badge tone={item.risk === "Alto" || item.risk === "Crítico" ? "orange" : "blue"}>{item.risk} prioridade</Badge><Badge tone="teal">{item.confidence} confiança</Badge></span></span><span className="queue-time">{item.time}<Icon name="chevron" size={14} /></span></button>)}</section>
      <section className="panel triage-detail"><div className="triage-detail-top"><Badge tone={triaged === "confirmed" ? "green" : triaged === "discarded" ? "red" : "amber"}><span className="badge-dot" />{triaged === "confirmed" ? "CONFIRMADO · ALERTA EMITIDO" : triaged === "discarded" ? "DESCARTADO" : "EM VALIDAÇÃO"}</Badge><span className="mono">{selectedAlert.id}</span></div><h2>{selectedAlert.title}</h2><p className="triage-location"><Icon name="pin" size={14} /> {selectedAlert.location}</p><div className="triage-timestamp"><Icon name="clock" size={14} /> Relatado {selectedAlert.time} por morador verificado</div><div className="evidence-placeholder"><div className="evidence-water">≈</div><span>Evidência enviada pelo morador</span><small>Foto anonimizada · 14:21</small><button className="evidence-open">Visualizar ↗</button></div><div className="nearby-heading"><b>Sensores próximos</b><span>Dados dos últimos 15 min</span></div><div className="nearby-sensor"><span className="sensor-status" /><span><b>Sensor SP-039 · Pluviômetro</b><small>Chuva leve · 8 mm/h</small></span><Badge tone="green">ONLINE</Badge></div><div className="nearby-sensor"><span className="sensor-status" /><span><b>Sensor SP-041 · Nível d&apos;água</b><small>Dentro do padrão · +2 cm</small></span><Badge tone="green">ONLINE</Badge></div><div className="confidence-warning"><Icon name="shield" size={16} /><span>Confiança atual <b>{confidence}</b><small>{triaged === "confirmed" ? "Validação operacional manual · índice fixado em 100%" : triaged === "discarded" ? "Evento descartado pelo agente · índice fixado em 0%" : "Relatos da comunidade + dados de 2 sensores"}</small></span></div><div className="triage-actions"><button className="button danger-outline" disabled={triaged !== null} onClick={() => onTriage("discarded")}><Icon name="close" size={16} /> Descartar</button><button className="button primary" disabled={triaged !== null} onClick={() => onTriage("confirmed")}><Icon name="check" size={16} /> Confirmar e emitir alerta</button></div><button className="triage-audit" onClick={() => navigate("confidence")}>Ver histórico de validação <Icon name="arrow" size={14} /></button></section></div>
    {triaged && <div className="toast-message"><span className="toast-check">✓</span> {triaged === "confirmed" ? "Ocorrência confirmada. Confiança atualizada para 100% e alerta emitido." : "Ocorrência descartada. Confiança atualizada para 0%."}</div>}
  </>;
}

function Analytics({ muted, setMuted, message, setMessage }: { muted: boolean; setMuted: (muted: boolean) => void; message: string; setMessage: (message: string) => void }) {
  function exportPersonalData(format: "json" | "csv") {
    const data = {
      titular: { nome: "Marina Costa", email: "morador@email.com" },
      consentimentos: { localizacao: !muted, notificacoesPersonalizadas: true },
      registrosComunitarios: [],
      observacao: "Dados demonstrativos do protótipo.",
    };
    if (format === "json") {
      downloadFile("urbanrisk-meus-dados.json", JSON.stringify(data, null, 2), "application/json;charset=utf-8");
      return;
    }
    const rows = [["campo", "valor"], ["titular.nome", data.titular.nome], ["titular.email", data.titular.email], ["consentimentos.localizacao", String(data.consentimentos.localizacao)], ["consentimentos.notificacoesPersonalizadas", String(data.consentimentos.notificacoesPersonalizadas)]];
    downloadFile("urbanrisk-meus-dados.csv", rows.map((row) => row.map(csvCell).join(",")).join("\n"), "text/csv;charset=utf-8");
  }

  function requestAccountDeletion() {
    if (window.confirm("Deseja solicitar a exclusão da conta e do histórico? Esta ação exige confirmação por e-mail.")) {
      setMessage("Solicitação de exclusão registrada para confirmação por e-mail.");
    }
  }

  return <>
    <ScreenHeader eyebrow="DADOS PARA UM FUTURO MAIS SEGURO" title="Análises e privacidade" description="Entenda as tendências da região e gerencie seus dados pessoais." action={<div className="period-select">Últimos 6 meses <span>⌄</span></div>} />
    <div className="analytics-kpis"><div className="panel analytic-kpi"><span>Ocorrências registradas</span><b>1.284</b><small className="positive">↓ 12% vs. período anterior</small><span className="sparkline blue-spark">▂▃▂▄▃▅▄▆▅▇</span></div><div className="panel analytic-kpi"><span>Tempo médio de resposta</span><b>8,4 <small>min</small></b><small className="positive">↓ 18% vs. período anterior</small><span className="sparkline green-spark">▇▆▅▆▄▃▄▂▃▂</span></div><div className="panel analytic-kpi"><span>Alertas confirmados</span><b>86,2<small>%</small></b><small className="positive">↑ 4,2% vs. período anterior</small><span className="sparkline orange-spark">▂▄▃▄▅▄▆▅▇▇</span></div></div>
    <div className="analytics-grid"><section className="panel chart-panel"><div className="section-title"><div><h2>Ocorrências por mês</h2><p>Comparativo de categorias na Zona Leste</p></div><div className="chart-legend"><span><i className="legend-blue" />Alagamentos</span><span><i className="legend-orange" />Ilhas de calor</span></div></div><div className="chart-area"><div className="chart-y-labels"><span>300</span><span>200</span><span>100</span><span>0</span></div><svg className="trend-chart" viewBox="0 0 700 220" preserveAspectRatio="none" role="img" aria-label="Gráfico de ocorrências: tendência mensal de alagamentos e ilhas de calor"><defs><linearGradient id="blueFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity=".17" /><stop offset="100%" stopColor="#2563eb" stopOpacity="0" /></linearGradient></defs><path d="M0 170 C35 164 55 142 86 150 S135 183 172 139 S224 105 258 123 S304 147 344 108 S392 64 430 89 S478 132 516 77 S562 48 602 58 S663 67 700 22 L700 220 L0 220Z" fill="url(#blueFill)" /><path d="M0 170 C35 164 55 142 86 150 S135 183 172 139 S224 105 258 123 S304 147 344 108 S392 64 430 89 S478 132 516 77 S562 48 602 58 S663 67 700 22" fill="none" stroke="#2563eb" strokeWidth="3" /><path d="M0 194 C40 185 60 198 86 186 S134 168 172 184 S226 157 258 166 S306 177 344 162 S394 137 430 150 S478 166 516 137 S564 123 602 134 S660 108 700 99" fill="none" stroke="#f97316" strokeWidth="2.5" strokeDasharray="5 5" /><circle cx="700" cy="22" r="5" fill="#2563eb" stroke="white" strokeWidth="3" /></svg><div className="chart-x-labels"><span>Jun</span><span>Jul</span><span>Ago</span><span>Set</span><span>Out</span><span>Nov</span></div></div><div className="chart-insight"><span className="insight-icon">✦</span><span><b>Insight:</b> Alagamentos caíram 22% neste mês após a limpeza preventiva de bueiros.</span><span className="insight-time">Atualizado hoje</span></div></section><section className="panel neighborhood-panel"><div className="section-title"><div><h2>Áreas em destaque</h2><p>Ocorrências nos últimos 30 dias</p></div></div><div className="neighborhood-list"><div><span className="neighborhood-rank">01</span><span className="neighborhood-copy"><b>Vila Prudente</b><small>Alagamentos · 32 ocorrências</small></span><span className="neighborhood-change negative">↑ 8%</span></div><div><span className="neighborhood-rank">02</span><span className="neighborhood-copy"><b>São Lucas</b><small>Alagamentos · 24 ocorrências</small></span><span className="neighborhood-change positive">↓ 12%</span></div><div><span className="neighborhood-rank">03</span><span className="neighborhood-copy"><b>Itaquera</b><small>Ilha de calor · 19 ocorrências</small></span><span className="neighborhood-change negative">↑ 3%</span></div><div><span className="neighborhood-rank">04</span><span className="neighborhood-copy"><b>Sapopemba</b><small>Energia · 14 ocorrências</small></span><span className="neighborhood-change positive">↓ 5%</span></div></div><button className="subtle-button neighborhood-link">Ver análise completa <Icon name="arrow" size={14} /></button></section></div>
    <section className="panel privacy-panel"><div className="privacy-heading"><span className="privacy-shield"><Icon name="shield" size={21} /></span><div><span className="eyebrow">SEUS DIREITOS · LGPD</span><h2>Você está no controle dos seus dados.</h2><p>Gerencie suas informações e permissões com transparência.</p></div><Badge tone="green"><Icon name="check" size={12} /> CONTA PROTEGIDA</Badge></div><div className="privacy-actions"><div className="privacy-action"><span className="privacy-action-icon">⇩</span><span><b>Exportar meus dados</b><small>Baixe suas informações em JSON ou CSV</small></span><div className="privacy-export-actions"><button className="button secondary" onClick={() => exportPersonalData("json")}>JSON</button><button className="button secondary" onClick={() => exportPersonalData("csv")}>CSV</button></div></div><div className="privacy-action"><span className="privacy-action-icon">⌖</span><span><b>Permissão de localização</b><small>{muted ? "Consentimento de localização revogado" : "Usada apenas para alertas próximos"} </small></span><button className={`toggle ${muted ? "" : "on"}`} onClick={() => setMuted(!muted)} aria-label={muted ? "Conceder novamente permissão de localização" : "Revogar consentimento de localização"}><span /></button></div><div className="privacy-action delete-action"><span className="privacy-action-icon">×</span><span><b>Excluir conta e histórico</b><small>Solicite a remoção dos seus dados pessoais</small></span><button className="button danger-outline" onClick={requestAccountDeletion}>Solicitar exclusão</button></div></div>{message && <div className="inline-confirmation"><Icon name="check" size={15} />{message}<button onClick={() => setMessage("")} aria-label="Fechar"><Icon name="close" size={14} /></button></div>}</section>
  </>;
}
