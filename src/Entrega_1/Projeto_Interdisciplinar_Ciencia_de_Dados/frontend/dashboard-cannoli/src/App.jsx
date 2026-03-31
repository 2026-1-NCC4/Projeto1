import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  LayoutDashboard, Megaphone, ShoppingBag, Users, Store,
  Bell, Search, TrendingUp, ArrowUpRight, TrendingDown
} from "lucide-react";

const T = {
  bg: "#0D0D0C", sidebar: "#111110", surface: "#1A1A19",
  border: "#272725", accent: "#F97316", amber: "#FBBF24",
  text: "#F0EDE8", muted: "#7A7870", success: "#4ADE80",
  danger: "#F87171", blue: "#60A5FA", purple: "#A78BFA",
  green: "#34D399",
};

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const fmt = (v) =>
  `R$ ${Number(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR");
};

const mapOrderStatus = (status) => {
  const s = Number(status);
  if (s === 0) return "Cancelado";
  if (s === 1) return "Andamento";
  if (s === 2) return "Concluído";
  return "Concluído";
};

const mapCustomerStatus = (status) => {
  const s = Number(status);
  if (s === 0) return "Inativo";
  if (s === 1) return "Ativo";
  return "Ativo";
};

const mapStoreStatus = (status) => {
  const s = Number(status);
  if (s === 0) return "Inativo";
  if (s === 1) return "Ativo";
  return "Ativo";
};

const mapCampaignStatus = (status) => {
  const s = Number(status);
  if (s === 0) return "Cancelada";
  if (s === 1) return "Ativa";
  if (s === 2) return "Concluída";
  return "Ativa";
};

const mapCampaignType = (type) => {
  const t = Number(type);
  if (t === 1) return "WhatsApp";
  if (t === 2) return "SMS";
  if (t === 3) return "E-mail";
  return "Campanha";
};

const mapChannel = (channel) => {
  if (!channel) return "N/A";
  const c = String(channel).trim();
  if (["site", "app", "site/app"].includes(c.toLowerCase())) return "Site/App";
  return c;
};

const statusConfig = {
  "Concluído": { color: "#4ADE80", bg: "rgba(74,222,128,0.12)" },
  "Andamento": { color: "#FBBF24", bg: "rgba(251,191,36,0.12)" },
  "Cancelado": { color: "#F87171", bg: "rgba(248,113,113,0.12)" },
  "Ativa": { color: "#60A5FA", bg: "rgba(96,165,250,0.12)" },
  "Concluída": { color: "#4ADE80", bg: "rgba(74,222,128,0.12)" },
  "Ativo": { color: "#4ADE80", bg: "rgba(74,222,128,0.12)" },
  "Inativo": { color: "#F87171", bg: "rgba(248,113,113,0.12)" },
  "Cancelada": { color: "#F87171", bg: "rgba(248,113,113,0.12)" },
};

const channelColors = {
  iFood: "#F97316",
  "Site/App": "#FBBF24",
  Site: "#FBBF24",
  App: "#FBBF24",
  WhatsApp: "#4ADE80",
  Balcão: "#60A5FA",
};

const Badge = ({ s }) => {
  const cfg = statusConfig[s] || { color: T.muted, bg: "rgba(122,120,112,0.12)" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.02em",
        color: cfg.color,
        background: cfg.bg,
      }}
    >
      {s}
    </span>
  );
};

const Kpi = ({ label, value, delta, up, icon: Icon, accent }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 22px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
      <span style={{ fontSize: 12, color: T.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
      <div style={{ width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: `${accent}18`, color: accent }}>
        <Icon size={16} />
      </div>
    </div>
    <div style={{ fontSize: 26, fontWeight: 700, color: T.text, letterSpacing: "-0.03em", marginBottom: 6 }}>
      {value}
    </div>
    <div style={{ fontSize: 12, color: up ? T.success : T.danger, display: "flex", alignItems: "center", gap: 3 }}>
      {up ? <ArrowUpRight size={12} /> : <TrendingDown size={12} />}
      {delta}
    </div>
  </div>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 22, ...style }}>
    {children}
  </div>
);

const CardTitle = ({ children }) => (
  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 18, textTransform: "uppercase", letterSpacing: "0.05em" }}>
    {children}
  </div>
);

const Th = ({ children, right }) => (
  <th
    style={{
      padding: "10px 14px",
      fontSize: 11,
      fontWeight: 600,
      color: T.muted,
      textAlign: right ? "right" : "left",
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      borderBottom: `1px solid ${T.border}`,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </th>
);

const Td = ({ children, style = {} }) => (
  <td style={{ padding: "11px 14px", fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}20`, ...style }}>
    {children}
  </td>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1C1C1B", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <p style={{ color: T.muted, margin: "0 0 6px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || T.text, margin: "3px 0", fontWeight: 600 }}>
          {p.name}: {typeof p.value === "number" && p.value > 5000 ? fmt(p.value) : Number(p.value || 0).toLocaleString("pt-BR")}
        </p>
      ))}
    </div>
  );
};

function deriveMonthlyData(orders) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    m: monthNames[i],
    r: 0,
    p: 0,
  }));

  orders.forEach((o) => {
    const d = o.created_at || o.data || o.date;
    if (!d) return;
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return;
    const month = dt.getMonth();
    months[month].r += Number(o.valor ?? 0);
    months[month].p += 1;
  });

  return months;
}

function deriveChannelData(orders) {
  const totals = {};
  orders.forEach((o) => {
    const canal = o.canal || "Outros";
    if (canal === "App" || canal === "Site") {
      totals["Site/App"] = (totals["Site/App"] || 0) + 1;
    } else {
      totals[canal] = (totals[canal] || 0) + 1;
    }
  });

  const totalOrders = orders.length || 1;

  return Object.entries(totals)
    .map(([name, count]) => ({
      name,
      v: Math.round((count / totalOrders) * 100),
      c: channelColors[name] || "#A1A1AA",
    }))
    .sort((a, b) => b.v - a.v);
}

function deriveStoreData(orders) {
  const map = {};

  orders.forEach((o) => {
    const loja = o.loja || "Sem loja";
    if (!map[loja]) map[loja] = { s: loja, r: 0, p: 0 };
    map[loja].r += Number(o.valor ?? 0);
    map[loja].p += 1;
  });

  return Object.values(map).sort((a, b) => b.r - a.r);
}

function deriveCustomerCityData(customers) {
  const map = {};
  customers.forEach((c) => {
    const city = c.cidade || "Outras";
    map[city] = (map[city] || 0) + 1;
  });

  return Object.entries(map)
    .map(([c, v]) => ({ c, v }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 5);
}

function deriveGenderData(customers) {
  let f = 0;
  let m = 0;

  customers.forEach((c) => {
    const g = (c.genero || "").toUpperCase();
    if (g === "F" || g === "FEMININO") f += 1;
    else if (g === "M" || g === "MASCULINO") m += 1;
  });

  const total = f + m || 1;
  return [
    { name: "Feminino", v: Math.round((f / total) * 100) },
    { name: "Masculino", v: Math.round((m / total) * 100) },
  ];
}

function Overview({ monthlyData, channelData, storeData, orders, customers, campaigns }) {
  const receitaTotal = orders.reduce((a, o) => a + Number(o.valor ?? 0), 0);
  const pedidosTotal = orders.length;
  const clientesAtivos = customers.filter((c) => (c.status || "").toLowerCase() === "ativo").length || customers.length;
  const campanhasEnviadas = campaigns.reduce((a, c) => a + Number(c.enviados || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0, letterSpacing: "-0.02em" }}>Visão Geral</h1>
        <p style={{ fontSize: 13, color: T.muted, margin: "5px 0 0" }}>Métricas consolidadas em tempo real</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        <Kpi label="Receita Total" value={fmt(receitaTotal)} delta="Dados do banco" up icon={TrendingUp} accent={T.accent} />
        <Kpi label="Total de Pedidos" value={pedidosTotal.toLocaleString("pt-BR")} delta="Dados do banco" up icon={ShoppingBag} accent={T.amber} />
        <Kpi label="Clientes Ativos" value={clientesAtivos.toLocaleString("pt-BR")} delta="Dados do banco" up icon={Users} accent={T.blue} />
        <Kpi label="Campanhas Enviadas" value={campanhasEnviadas.toLocaleString("pt-BR")} delta="Dados do banco" up icon={Megaphone} accent={T.purple} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card>
          <CardTitle>Receita mensal</CardTitle>
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.accent} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={T.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="m" tick={{ fill: T.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.muted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="r" name="Receita" stroke={T.accent} strokeWidth={2} fill="url(#gradR)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>Canais de venda</CardTitle>
          <div style={{ height: 150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={channelData} dataKey="v" cx="50%" cy="50%" innerRadius={44} outerRadius={68} paddingAngle={4}>
                  {channelData.map((e, i) => <Cell key={i} fill={e.c} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: "#1C1C1B", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 6 }}>
            {channelData.map((d) => (
              <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 7, color: T.muted }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: d.c, display: "inline-block", flexShrink: 0 }} />
                  {d.name}
                </span>
                <span style={{ color: T.text, fontWeight: 600 }}>{d.v}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card>
          <CardTitle>Receita por loja</CardTitle>
          <div style={{ height: 195 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storeData} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="s" tick={{ fill: T.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.muted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="r" name="Receita" fill={T.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>Pedidos mensais</CardTitle>
          <div style={{ height: 195 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="m" tick={{ fill: T.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="p" name="Pedidos" fill={T.amber} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Pedidos recentes</CardTitle>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr><Th>Pedido</Th><Th>Loja</Th><Th>Cliente</Th><Th>Canal</Th><Th>Tipo</Th><Th right>Valor</Th><Th>Status</Th><Th>Data</Th></tr>
            </thead>
            <tbody>
              {orders.slice(0, 10).map((o) => (
                <tr key={o.id}>
                  <Td style={{ color: T.accent, fontWeight: 700, fontFamily: "monospace", fontSize: 12 }}>{o.id}</Td>
                  <Td>{o.loja}</Td>
                  <Td>{o.cliente}</Td>
                  <Td style={{ color: T.muted }}>{o.canal}</Td>
                  <Td style={{ color: T.muted }}>{o.tipo}</Td>
                  <Td style={{ fontWeight: 600, textAlign: "right" }}>{fmt(o.valor)}</Td>
                  <Td><Badge s={o.status} /></Td>
                  <Td style={{ color: T.muted, fontSize: 12 }}>{o.data}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Campaigns({ campaigns }) {
  const totalCampanhas = campaigns.length;
  const mensagensEnviadas = campaigns.reduce((a, c) => a + Number(c.enviados || 0), 0);
  const pedidosGerados = campaigns.reduce((a, c) => a + Number(c.pedidos || 0), 0);
  const taxaMedia = totalCampanhas ? campaigns.reduce((a, c) => a + Number(c.conv || 0), 0) / totalCampanhas : 0;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0, letterSpacing: "-0.02em" }}>Campanhas</h1>
        <p style={{ fontSize: 13, color: T.muted, margin: "5px 0 0" }}>Gestão e performance de campanhas de marketing</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        <Kpi label="Total de Campanhas" value={String(totalCampanhas)} delta="Dados do banco" up icon={Megaphone} accent={T.accent} />
        <Kpi label="Mensagens Enviadas" value={mensagensEnviadas.toLocaleString("pt-BR")} delta="Dados do banco" up icon={TrendingUp} accent={T.amber} />
        <Kpi label="Pedidos Gerados" value={pedidosGerados.toLocaleString("pt-BR")} delta="Dados do banco" up icon={ShoppingBag} accent={T.green} />
        <Kpi label="Taxa de Conversão" value={`${taxaMedia.toFixed(1)}%`} delta="Dados do banco" up icon={ArrowUpRight} accent={T.blue} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card>
          <CardTitle>Enviados vs pedidos por campanha</CardTitle>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaigns} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
                <XAxis type="number" tick={{ fill: T.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="nome" type="category" tick={{ fill: T.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={140} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="enviados" name="Enviados" fill={T.border} radius={[0, 4, 4, 0]} />
                <Bar dataKey="pedidos" name="Pedidos" fill={T.accent} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>Receita por campanha</CardTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
            {campaigns.slice(0, 5).map((c, i) => {
              const maxR = Math.max(...campaigns.map((x) => Number(x.receita || 0)), 1);
              const pct = Math.round((Number(c.receita || 0) / maxR) * 100);
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: T.muted, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.nome}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{fmt(c.receita)}</span>
                  </div>
                  <div style={{ height: 4, background: T.border, borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: T.accent, borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Todas as campanhas</CardTitle>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr><Th>Campanha</Th><Th>Tipo</Th><Th>Status</Th><Th right>Enviados</Th><Th right>Pedidos</Th><Th right>Conversão</Th><Th right>Receita</Th><Th>Data</Th></tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id}>
                <Td style={{ fontWeight: 600 }}>{c.nome}</Td>
                <Td style={{ color: T.muted }}>{c.tipo}</Td>
                <Td><Badge s={c.status} /></Td>
                <Td style={{ textAlign: "right", fontFamily: "monospace" }}>{Number(c.enviados || 0).toLocaleString("pt-BR")}</Td>
                <Td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: T.accent }}>{Number(c.pedidos || 0).toLocaleString("pt-BR")}</Td>
                <Td style={{ textAlign: "right", fontWeight: 600, color: Number(c.conv || 0) > 14 ? T.success : T.amber }}>{Number(c.conv || 0).toFixed(1)}%</Td>
                <Td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(c.receita)}</Td>
                <Td style={{ color: T.muted, fontSize: 12 }}>{c.data}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Orders({ orders }) {
  const [filter, setFilter] = useState("Todos");
  const filtered = filter === "Todos" ? orders : orders.filter((o) => o.status === filter);
  const total = filtered.reduce((acc, o) => acc + Number(o.valor ?? 0), 0);
  const cancelados = orders.filter((o) => o.status === "Cancelado").length;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0, letterSpacing: "-0.02em" }}>Pedidos</h1>
        <p style={{ fontSize: 13, color: T.muted, margin: "5px 0 0" }}>Histórico completo de todas as lojas</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        <Kpi label="Receita" value={fmt(total)} delta="Dados do banco" up icon={TrendingUp} accent={T.accent} />
        <Kpi label="Ticket médio" value={fmt(total / (filtered.length || 1))} delta="Dados do banco" up icon={ShoppingBag} accent={T.amber} />
        <Kpi label="Taxa de cancelamento" value={`${Math.round((cancelados / (orders.length || 1)) * 100)}%`} delta="Dados do banco" up icon={TrendingDown} accent={T.green} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["Todos", "Concluído", "Andamento", "Cancelado"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 18px",
              borderRadius: 20,
              border: `1px solid ${filter === f ? T.accent : T.border}`,
              background: filter === f ? `${T.accent}15` : "transparent",
              color: filter === f ? T.accent : T.muted,
              fontSize: 13,
              cursor: "pointer",
              fontWeight: filter === f ? 600 : 400,
            }}
          >
            {f}
          </button>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 13, color: T.muted, display: "flex", alignItems: "center" }}>
          {filtered.length} pedido{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr><Th>Pedido</Th><Th>Loja</Th><Th>Cliente</Th><Th>Canal</Th><Th>Tipo</Th><Th right>Valor</Th><Th>Status</Th><Th>Data</Th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 32, color: T.muted, fontSize: 13 }}>
                  Nenhum pedido encontrado
                </td>
              </tr>
            ) : (
              filtered.map((o) => (
                <tr key={o.id}>
                  <Td style={{ color: T.accent, fontWeight: 700, fontFamily: "monospace", fontSize: 12 }}>{o.id}</Td>
                  <Td>{o.loja}</Td>
                  <Td>{o.cliente}</Td>
                  <Td style={{ color: T.muted }}>{o.canal}</Td>
                  <Td style={{ color: T.muted }}>{o.tipo}</Td>
                  <Td style={{ fontWeight: 600, textAlign: "right" }}>{fmt(o.valor)}</Td>
                  <Td><Badge s={o.status} /></Td>
                  <Td style={{ color: T.muted, fontSize: 12 }}>{o.data}</Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Customers({ customers }) {
  const ativos = customers.filter((c) => (c.status || "").toLowerCase() === "ativo").length;
  const enriquecidos = customers.filter((c) => !!c.enriquecido).length;
  const gastoMedio = customers.reduce((a, c) => a + Number(c.gasto || 0), 0) / (customers.length || 1);
  const genderData = deriveGenderData(customers);
  const cityData = deriveCustomerCityData(customers);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0, letterSpacing: "-0.02em" }}>Clientes</h1>
        <p style={{ fontSize: 13, color: T.muted, margin: "5px 0 0" }}>Base de clientes cadastrados e enriquecidos</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        <Kpi label="Total de Clientes" value={customers.length.toLocaleString("pt-BR")} delta="Dados do banco" up icon={Users} accent={T.accent} />
        <Kpi label="Clientes Ativos" value={ativos.toLocaleString("pt-BR")} delta="Dados do banco" up icon={Users} accent={T.green} />
        <Kpi label="Enriquecidos" value={enriquecidos.toLocaleString("pt-BR")} delta="Dados do banco" up icon={TrendingUp} accent={T.blue} />
        <Kpi label="Gasto Médio" value={fmt(gastoMedio)} delta="Dados do banco" up icon={ShoppingBag} accent={T.amber} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card>
          <CardTitle>Distribuição por gênero</CardTitle>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderData} dataKey="v" cx="50%" cy="50%" outerRadius={70} paddingAngle={5}>
                  <Cell fill={T.purple} />
                  <Cell fill={T.blue} />
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: "#1C1C1B", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>Clientes por cidade</CardTitle>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={cityData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: T.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="c" type="category" tick={{ fill: T.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="v" name="Clientes" fill={T.blue} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Clientes cadastrados</CardTitle>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr><Th>ID</Th><Th>Nome</Th><Th>Gênero</Th><Th>Cidade</Th><Th>Status</Th><Th>Enriquecido</Th><Th right>Pedidos</Th><Th right>Gasto Total</Th><Th>Cadastro</Th></tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <Td style={{ color: T.muted, fontFamily: "monospace", fontSize: 11 }}>{c.id}</Td>
                  <Td style={{ fontWeight: 600 }}>{c.nome}</Td>
                  <Td style={{ color: T.muted }}>
                    {(c.genero || "").toUpperCase() === "F" ? "Feminino" : (c.genero || "").toUpperCase() === "M" ? "Masculino" : "N/A"}
                  </Td>
                  <Td>{c.cidade}, {c.estado}</Td>
                  <Td><Badge s={c.status} /></Td>
                  <Td>
                    <span style={{ color: c.enriquecido ? T.success : T.muted, fontSize: 12, fontWeight: 600 }}>
                      {c.enriquecido ? "✓ Sim" : "— Não"}
                    </span>
                  </Td>
                  <Td style={{ textAlign: "right", fontFamily: "monospace", color: T.accent, fontWeight: 700 }}>{Number(c.pedidos || 0)}</Td>
                  <Td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(c.gasto)}</Td>
                  <Td style={{ color: T.muted, fontSize: 12 }}>{c.cadastro}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Stores({ storeData, storeDetails }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0, letterSpacing: "-0.02em" }}>Lojas</h1>
        <p style={{ fontSize: 13, color: T.muted, margin: "5px 0 0" }}>Performance e dados das unidades Cannoli</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        {storeData.slice(0, 5).map((s, i) => (
          <div
            key={i}
            style={{
              background: T.surface,
              borderRadius: 12,
              padding: 18,
              border: `1px solid ${T.border}`,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 6, lineHeight: 1.3 }}>{s.s}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: i === 0 ? T.accent : T.text, letterSpacing: "-0.03em", marginBottom: 6 }}>
              R$ {(Number(s.r || 0) / 1000).toFixed(0)}k
            </div>
            <div style={{ fontSize: 11, color: T.muted }}>{Number(s.p || 0).toLocaleString("pt-BR")} pedidos</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card>
          <CardTitle>Receita por loja</CardTitle>
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storeData} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="s" tick={{ fill: T.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.muted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="r" name="Receita" fill={T.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>Pedidos por loja</CardTitle>
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storeData} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="s" tick={{ fill: T.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="p" name="Pedidos" fill={T.amber} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Detalhamento das lojas</CardTitle>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr><Th>Loja</Th><Th>Bairro</Th><Th>Cidade</Th><Th>Estado</Th><Th>CEP</Th><Th>Criada em</Th><Th>Status</Th><Th right>Receita Total</Th><Th right>Total Pedidos</Th></tr>
            </thead>
            <tbody>
              {storeDetails.map((s, i) => (
                <tr key={i}>
                  <Td style={{ fontWeight: 600 }}>{s.nome}</Td>
                  <Td style={{ color: T.muted }}>{s.bairro}</Td>
                  <Td>{s.cidade}</Td>
                  <Td style={{ color: T.muted }}>{s.estado}</Td>
                  <Td style={{ fontFamily: "monospace", fontSize: 12, color: T.muted }}>{s.cep}</Td>
                  <Td style={{ color: T.muted, fontSize: 12 }}>{s.createdat}</Td>
                  <Td><Badge s={s.status} /></Td>
                  <Td style={{ textAlign: "right", fontWeight: 700, color: T.accent }}>{fmt(s.r)}</Td>
                  <Td style={{ textAlign: "right", fontFamily: "monospace" }}>{Number(s.p || 0).toLocaleString("pt-BR")}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

const navItems = [
  { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
  { id: "campaigns", label: "Campanhas", icon: Megaphone },
  { id: "orders", label: "Pedidos", icon: ShoppingBag },
  { id: "customers", label: "Clientes", icon: Users },
  { id: "stores", label: "Lojas", icon: Store },
];

export default function App() {
  const [active, setActive] = useState("overview");
  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [stores, setStores] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [
          storeOrderRes,
          customerRes,
          customerAddressRes,
          campaignRes,
          campaignOrderRes,
          storeRes,
        ] = await Promise.all([
          supabase.from("store_order").select("*").order("createdat", { ascending: false }).limit(1000),
          supabase.from("customer").select("*").limit(1000),
          supabase.from("customer_address").select("*").limit(1000),
          supabase.from("campaign").select("*").order("createdat", { ascending: false }).limit(500),
          supabase.from("campaign_order").select("*").limit(2000),
          supabase.from("store").select("*").limit(200),
        ]);

        if (storeOrderRes.error) throw storeOrderRes.error;
        if (customerRes.error) throw customerRes.error;
        if (customerAddressRes.error) throw customerAddressRes.error;
        if (campaignRes.error) throw campaignRes.error;
        if (campaignOrderRes.error) throw campaignOrderRes.error;
        if (storeRes.error) throw storeRes.error;

        const storeOrderRaw = storeOrderRes.data || [];
        const customerRaw = customerRes.data || [];
        const customerAddressRaw = customerAddressRes.data || [];
        const campaignRaw = campaignRes.data || [];
        const campaignOrderRaw = campaignOrderRes.data || [];
        const storeRaw = storeRes.data || [];

        const storeMap = new Map(
          storeRaw.map((s) => [
            String(s.id),
            {
              id: s.id,
              nome: s.name || "Sem nome",
              bairro: s.neighborhood || "N/A",
              cidade: s.city || "N/A",
              estado: s.state || "N/A",
              cep: s.zipcode || "N/A",
              status: mapStoreStatus(s.status),
              createdat: formatDate(s.createdat),
            },
          ])
        );

        const addressMap = new Map();
        customerAddressRaw.forEach((a) => {
          if (!a.customerid) return;
          if (!addressMap.has(String(a.customerid))) {
            addressMap.set(String(a.customerid), a);
          }
        });

        const orderStatsByCustomer = new Map();
        const orderStatsByStore = new Map();

        storeOrderRaw.forEach((o) => {
          const orderValue = Number(o.totalamount || 0);

          if (o.customerid) {
            const key = String(o.customerid);
            const current = orderStatsByCustomer.get(key) || { pedidos: 0, gasto: 0 };
            current.pedidos += 1;
            current.gasto += orderValue;
            orderStatsByCustomer.set(key, current);
          }

          if (o.storeid) {
            const key = String(o.storeid);
            const current = orderStatsByStore.get(key) || { r: 0, p: 0 };
            current.r += orderValue;
            current.p += 1;
            orderStatsByStore.set(key, current);
          }
        });

        const customersMapped = customerRaw.map((c, i) => {
          const addr = addressMap.get(String(c.id));
          const stats = orderStatsByCustomer.get(String(c.id)) || { pedidos: 0, gasto: 0 };

          return {
            id: c.id || `CU-${String(i + 1).padStart(3, "0")}`,
            nome: c.name || "Sem nome",
            genero: c.gender || "",
            cidade: addr?.city || "N/A",
            estado: addr?.state || "N/A",
            status: mapCustomerStatus(c.status),
            enriquecido: Boolean(c.isenriched),
            pedidos: Number(stats.pedidos || 0),
            gasto: Number(stats.gasto || 0),
            cadastro: formatDate(c.createdat),
          };
        });

        const ordersMapped = storeOrderRaw.map((o) => {
          const store = storeMap.get(String(o.storeid));
          const customer = customerRaw.find((c) => String(c.id) === String(o.customerid));

          return {
            id: o.id || `ORD-${Math.random().toString(36).slice(2, 8)}`,
            loja: store?.nome || "Sem loja",
            cliente: customer?.name || "Sem cliente",
            canal: mapChannel(o.saleschannel),
            tipo: o.ordertype || "N/A",
            valor: Number(o.totalamount || 0),
            status: mapOrderStatus(o.status),
            data: formatDate(o.createdat || o.scheduledat),
            created_at: o.createdat || o.scheduledat || null,
          };
        });

        const storesMapped = storeRaw.map((s) => {
          const stats = orderStatsByStore.get(String(s.id)) || { r: 0, p: 0 };

          return {
            id: s.id,
            nome: s.name || "Sem nome",
            bairro: s.neighborhood || "N/A",
            cidade: s.city || "N/A",
            estado: s.state || "N/A",
            cep: s.zipcode || "N/A",
            status: mapStoreStatus(s.status),
            r: Number(stats.r || 0),
            p: Number(stats.p || 0),
            createdat: formatDate(s.createdat),
          };
        });

        // Observação:
        // o schema enviado mostra campaign.id = bigint e campaign_order.campaignid = uuid.
        // Isso parece inconsistente. Aqui eu faço a associação convertendo para string.
        // Se no seu banco real os tipos estiverem diferentes mesmo, essa ligação pode não funcionar corretamente.
        const campaignOrdersByCampaign = new Map();
        campaignOrderRaw.forEach((co) => {
          const key = String(co.campaignid);
          const current = campaignOrdersByCampaign.get(key) || {
            enviados: 0,
            pedidos: 0,
            receita: 0,
          };

          current.enviados += co.sent_at ? 1 : 0;
          current.pedidos += co.order_id ? 1 : 0;
          current.receita += Number(co.totalamount || 0);

          campaignOrdersByCampaign.set(key, current);
        });

        const campaignsMapped = campaignRaw.map((c, i) => {
          const stats = campaignOrdersByCampaign.get(String(c.id)) || {
            enviados: 0,
            pedidos: 0,
            receita: 0,
          };

          const conv = stats.enviados > 0 ? (stats.pedidos / stats.enviados) * 100 : 0;

          return {
            id: c.id || i + 1,
            nome: c.name || `Campanha ${i + 1}`,
            tipo: mapCampaignType(c.type),
            status: mapCampaignStatus(c.statusend),
            enviados: Number(stats.enviados || 0),
            pedidos: Number(stats.pedidos || 0),
            conv: Number(conv || 0),
            receita: Number(stats.receita || 0),
            data: formatDate(c.sendat || c.createdat),
          };
        });

        setOrders(ordersMapped);
        setCustomers(customersMapped);
        setCampaigns(campaignsMapped);
        setStores(storesMapped);
      } catch (error) {
        console.error("Erro ao carregar dados do Supabase:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredOrders = useMemo(() => {
    if (!query.trim()) return orders;
    const q = query.toLowerCase();
    return orders.filter((o) =>
      [o.id, o.loja, o.cliente, o.canal, o.tipo, o.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [orders, query]);

  const monthlyData = useMemo(() => deriveMonthlyData(orders), [orders]);
  const channelData = useMemo(() => deriveChannelData(orders), [orders]);
  const storeData = useMemo(() => deriveStoreData(orders), [orders]);
  const storeDetails = useMemo(() => {
    if (stores.length) return stores;
    return storeData.map((s) => ({
      nome: s.s,
      bairro: "-",
      cidade: "-",
      estado: "-",
      cep: "-",
      status: "Ativo",
      r: s.r,
      p: s.p,
      createdat: "-",
    }));
  }, [stores, storeData]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", color: T.text }}>
      <div style={{ width: 220, background: T.sidebar, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div style={{ padding: "22px 20px 18px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg, ${T.accent}, #EA580C)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
              🍕
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: "-0.03em", lineHeight: 1 }}>Cannoli</div>
              <div style={{ fontSize: 10, color: T.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>Analytics</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: "14px 10px", flex: 1 }}>
          <div style={{ fontSize: 10, color: T.muted, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 10px", marginBottom: 8 }}>
            Menu principal
          </div>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 8,
                marginBottom: 2,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                background: active === id ? `${T.accent}18` : "transparent",
                color: active === id ? T.accent : T.muted,
                fontWeight: active === id ? 600 : 400,
                fontSize: 13,
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.6 }}>Dados do Supabase</div>
          <div style={{ fontSize: 11, color: T.muted }}>{loading ? "Carregando..." : "Conectado"}</div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div
          style={{
            height: 58,
            background: T.sidebar,
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            position: "sticky",
            top: 0,
            zIndex: 9,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 14px", width: 260 }}>
            <Search size={13} color={T.muted} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar pedidos, clientes…"
              style={{ background: "transparent", border: "none", outline: "none", color: T.text, fontSize: 13, width: "100%" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ position: "relative", cursor: "pointer" }}>
              <Bell size={17} color={T.muted} />
              <span style={{ position: "absolute", top: -3, right: -3, width: 7, height: 7, borderRadius: "50%", background: T.accent }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${T.accent}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: T.accent, flexShrink: 0 }}>
                VM
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>Vinícius</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: "30px 28px", overflowX: "hidden" }}>
          {loading ? (
            <Card>
              <CardTitle>Carregando</CardTitle>
              <div style={{ color: T.muted, fontSize: 14 }}>Buscando dados do Supabase...</div>
            </Card>
          ) : (
            <>
              {active === "overview" && (
                <Overview
                  monthlyData={monthlyData}
                  channelData={channelData}
                  storeData={storeData}
                  orders={filteredOrders}
                  customers={customers}
                  campaigns={campaigns}
                />
              )}
              {active === "campaigns" && <Campaigns campaigns={campaigns} />}
              {active === "orders" && <Orders orders={filteredOrders} />}
              {active === "customers" && <Customers customers={customers} />}
              {active === "stores" && <Stores storeData={storeData} storeDetails={storeDetails} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}