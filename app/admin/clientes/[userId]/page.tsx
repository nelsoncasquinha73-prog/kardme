"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "@/components/language/LanguageProvider";

type Profile = {
  id: string;
  email: string | null;
  nome: string | null;
  apelido: string | null;
  plan: string | null;
  billing: string | null;
  published_card_limit: number | null;
  plan_started_at: string | null;
  plan_expires_at: string | null;
  plan_auto_renew: boolean | null;
  created_at: string | null;
  disabled: boolean | null;
};

type CardRow = {
  id: string;
  title: string | null;
  slug: string | null;
  published: boolean | null;
  created_at: string | null;
};
type DailyStats = {
  day: string;
  card_id: string;
  card_name?: string;
  views: number;
  clicks: number;
  leads: number;
};
type CardSummary = {
  card_id: string;
  card_name: string;
  total_views: number;
  total_clicks: number;
  total_leads: number;
};
type ChartData = { date: string; views: number; clicks: number; leads: number };

export default function AdminClienteDetailPage() {
  const { t } = useLanguage();
  const params = useParams<{ userId: string }>();
  const userId = params.userId;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [activeTab, setActiveTab] = useState<
    "resumo" | "cartoes" | "dominios" | "analytics"
  >("resumo");

  type DomainRow = {
    id: string;
    card_id: string;
    domain: string;
    status: string | null;
    last_check_at: string | null;
    created_at: string;
  };

  type DomainCard = {
    id: string;
    name: string | null;
    title: string | null;
    slug: string;
  };

  const [domainsLoading, setDomainsLoading] = useState(false);
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [domainCards, setDomainCards] = useState<DomainCard[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [selectedDomainCardId, setSelectedDomainCardId] = useState<string>("");

  async function getAdminToken() {
    const token = (await supabase.auth.getSession())?.data?.session
      ?.access_token;
    return token || null;
  }

  async function loadDomains() {
    setDomainsLoading(true);
    try {
      const token = await getAdminToken();
      if (!token) throw new Error("Sem autenticação");

      const res = await fetch(`/api/admin/domains/by-user?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json?.success)
        throw new Error(json?.error || "Erro ao carregar domínios");

      setDomains((json?.domains ?? []) as DomainRow[]);
      setDomainCards((json?.cards ?? []) as DomainCard[]);
      setSelectedDomainCardId((prev) => prev || (json?.cards?.[0]?.id ?? ""));
    } catch (e: any) {
      alert("Erro: " + e?.message);
    }
    setDomainsLoading(false);
  }

  async function createDomain() {
    try {
      const token = await getAdminToken();
      if (!token) throw new Error("Sem autenticação");

      const domain = newDomain.trim();
      if (!selectedDomainCardId) throw new Error("Seleciona um cartão");
      if (!domain) throw new Error("Escreve um domínio");

      const res = await fetch("/api/admin/domains/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cardId: selectedDomainCardId, domain }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success)
        throw new Error(json?.error || "Erro ao criar domínio");

      setNewDomain("");
      await loadDomains();
      alert("Domínio criado! Agora configura o DNS e clica em Verificar.");
    } catch (e: any) {
      alert("Erro: " + e?.message);
    }
  }

  async function verifyDomain(domain: string) {
    try {
      const token = await getAdminToken();
      if (!token) throw new Error("Sem autenticação");

      const res = await fetch("/api/admin/domains/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ domain }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success)
        throw new Error(json?.error || "Erro ao verificar domínio");

      await loadDomains();
      alert(`Verificação concluída: ${json?.status || "ok"}`);
    } catch (e: any) {
      alert("Erro: " + e?.message);
    }
  }

  const [plan, setPlan] = useState("free");
  const [billing, setBilling] = useState("monthly");
  const [limit, setLimit] = useState<number>(1);
  const [nome, setNome] = useState("");
  const [apelido, setApelido] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [planStartedAt, setPlanStartedAt] = useState<string | null>(null);
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [planAutoRenew, setPlanAutoRenew] = useState(false);
  const [crmProActive, setCrmProActive] = useState(false);
  const [crmProExpiresAt, setCrmProExpiresAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cardSummary, setCardSummary] = useState<CardSummary[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [days, setDays] = useState(7);

  useEffect(() => {
    if (profile) {
      setPlan(profile.plan ?? "free");
      setBilling(profile.billing ?? "monthly");
      setLimit(profile.published_card_limit ?? 1);
      setNome(profile.nome ?? "");
      setApelido(profile.apelido ?? "");
      setDisabled(profile.disabled ?? false);
      setPlanStartedAt(profile.plan_started_at);
      setPlanExpiresAt(profile.plan_expires_at);
      setPlanAutoRenew(profile.plan_auto_renew ?? false);
      // Carregar addons
      supabase
        .from('user_addons')
        .select('crm_pro_active, crm_pro_expires_at')
        .eq('user_id', userId)
        .single()
        .then(({ data: addons }) => {
          if (addons) {
            setCrmProActive(addons.crm_pro_active ?? false);
            setCrmProExpiresAt(addons.crm_pro_expires_at ?? null);
          }
        });
    }
  }, [profile]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: p, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (pErr || !p) {
        alert("Erro a carregar cliente");
        setLoading(false);
        return;
      }
      setProfile(p as Profile);
      const { data: c } = await supabase
        .from("cards")
        .select("id,title,slug,published,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setCards((c ?? []) as CardRow[]);
      setLoading(false);
    };
    load();
  }, [userId]);

  useEffect(() => {
    if (activeTab !== "dominios") return;
    let cancelled = false;

    (async () => {
      setDomainsLoading(true);
      try {
        const token = await getAdminToken();
        if (!token) throw new Error("Sem autenticação");

        const res = await fetch(`/api/admin/domains/by-user?userId=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok || !json?.success)
          throw new Error(json?.error || "Erro ao carregar domínios");
        if (cancelled) return;

        setDomains((json?.domains ?? []) as DomainRow[]);
        setDomainCards((json?.cards ?? []) as DomainCard[]);
        setSelectedDomainCardId((prev) => prev || (json?.cards?.[0]?.id ?? ""));
      } catch (e: any) {
        if (!cancelled) alert("Erro: " + e?.message);
      }
      if (!cancelled) setDomainsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, userId]);

  useEffect(() => {
    if (activeTab !== "analytics") return;
    let cancelled = false;

    const run = async () => {
      setAnalyticsLoading(true);
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: dailyData } = await supabase
          .from("card_daily_stats")
          .select("day, card_id, views, clicks, leads, cards(name)")
          .eq("user_id", userId)
          .gte("day", startDate.toISOString().split("T")[0])
          .order("day", { ascending: false });

        if (cancelled) return;

        const formattedDaily = (dailyData || []).map((d: any) => ({
          day: d.day,
          card_id: d.card_id,
          card_name: Array.isArray(d.cards)
            ? d.cards[0]?.name
            : d.cards?.name || "Sem nome",
          views: d.views,
          clicks: d.clicks,
          leads: d.leads,
        }));

        const chartMap: Record<string, ChartData> = {};
        for (const row of formattedDaily) {
          if (!chartMap[row.day]) {
            chartMap[row.day] = {
              date: new Date(row.day).toLocaleDateString("pt-PT", {
                month: "short",
                day: "numeric",
              }),
              views: 0,
              clicks: 0,
              leads: 0,
            };
          }
          chartMap[row.day].views += row.views;
          chartMap[row.day].clicks += row.clicks;
          chartMap[row.day].leads += row.leads;
        }
        setChartData(Object.values(chartMap));

        const summary: Record<string, CardSummary> = {};
        for (const row of formattedDaily) {
          if (!summary[row.card_id]) {
            summary[row.card_id] = {
              card_id: row.card_id,
              card_name: row.card_name,
              total_views: 0,
              total_clicks: 0,
              total_leads: 0,
            };
          }
          summary[row.card_id].total_views += row.views;
          summary[row.card_id].total_clicks += row.clicks;
          summary[row.card_id].total_leads += row.leads;
        }
        setCardSummary(
          Object.values(summary).sort((a, b) => b.total_views - a.total_views),
        );
      } catch (err: any) {
        alert("Erro: " + err?.message);
      } finally {
        if (!cancelled) setAnalyticsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [activeTab, days, userId]);

  const fullName = useMemo(
    () =>
      profile
        ? ((profile.nome ?? "") + " " + (profile.apelido ?? "")).trim() || "—"
        : "Cliente",
    [profile],
  );

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          nome,
          apelido,
          plan,
          billing,
          published_card_limit: limit,
          plan_started_at: planStartedAt,
          plan_expires_at: planExpiresAt,
          plan_auto_renew: planAutoRenew,
          disabled,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success)
        throw new Error(json?.error || "Erro ao atualizar");
      alert("Guardado!");
      const { data: p2 } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (p2) setProfile(p2 as Profile);
    } catch (e: any) {
      alert("Erro: " + e?.message);
    }
    setSaving(false);
  }

  async function deleteAccount() {
    if (
      !confirm(
        "Tens a certeza que queres eliminar esta conta? Esta ação é irreversível!",
      )
    )
      return;
    if (!confirm("ÚLTIMA CONFIRMAÇÃO: Todos os dados serão eliminados."))
      return;
    setDeleting(true);
    try {
      const token = (await supabase.auth.getSession())?.data?.session
        ?.access_token;
      if (!token) {
        alert("Sem autenticação");
        setDeleting(false);
        return;
      }
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success)
        throw new Error(json?.error || "Erro ao eliminar");
      alert("Conta eliminada!");
      window.location.href = "/admin/clientes";
    } catch (e: any) {
      alert("Erro: " + e?.message);
    }
    setDeleting(false);
  }

  async function toggleCardPublish(cardId: string, publish: boolean) {
    try {
      const res = await fetch("/api/admin/cards/toggle-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, published: publish }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || "Erro");
      setCards(
        cards.map((c) => (c.id === cardId ? { ...c, published: publish } : c)),
      );
    } catch (e: any) {
      alert("Erro: " + e?.message);
    }
  }

  async function deleteCard(cardId: string) {
    if (!confirm("Eliminar este cartão? Esta ação é irreversível!")) return;
    try {
      const res = await fetch("/api/admin/cards/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || "Erro");
      setCards(cards.filter((c) => c.id !== cardId));
      alert("Cartão eliminado!");
    } catch (e: any) {
      alert("Erro: " + e?.message);
    }
  }

  async function saveAsTemplate(cardId: string, cardTitle: string) {
    const templateName = prompt("Nome do template:", cardTitle + " - Template");
    if (!templateName) return;
    try {
      const res = await fetch("/api/admin/cards/save-as-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, templateName }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success)
        throw new Error(json?.error || "Erro ao criar template");
      alert("Template criado com sucesso!");
    } catch (e: any) {
      alert("Erro: " + e?.message);
    }
  }
  if (loading)
    return <div style={{ padding: 24, color: "#fff" }}>A carregar…</div>;
  if (!profile)
    return (
      <div style={{ padding: 24, color: "#fff" }}>
        <p>Cliente não encontrado.</p>
        <Link href="/admin/clientes" style={{ color: "#93c5fd" }}>
          ← Voltar
        </Link>
      </div>
    );

  const inputStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    width: "100%",
  };
  const labelStyle: React.CSSProperties = {
    display: "grid",
    gap: 6,
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  };
  const cardStyle: React.CSSProperties = {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    padding: 16,
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22, color: "#fff" }}>{fullName}</h1>
          <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.7)" }}>
            {profile.email ?? "—"}
          </p>
          {disabled && (
            <span
              style={{
                display: "inline-block",
                marginTop: 8,
                padding: "4px 10px",
                borderRadius: 6,
                background: "#dc2626",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              CONTA DESATIVADA
            </span>
          )}
        </div>
        <Link
          href="/admin/clientes"
          style={{ textDecoration: "none", fontWeight: 700, color: "#93c5fd" }}
        >
          ← Voltar
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          borderBottom: "1px solid rgba(255,255,255,0.10)",
          paddingBottom: 12,
        }}
      >
        {(["resumo", "cartoes", "dominios", "analytics"] as const).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background:
                  activeTab === tab ? "rgba(124,58,237,0.3)" : "transparent",
                color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.6)",
                fontWeight: activeTab === tab ? 700 : 500,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              {tab === "resumo" && "📋 Resumo"}
              {tab === "cartoes" && "📇 Cartões"}
              {tab === "dominios" && "🌐 Domínios"}
              {tab === "analytics" && "📊 Analytics"}
            </button>
          ),
        )}
      </div>

      {activeTab === "resumo" && (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, fontSize: 16, color: "#fff" }}>
              Dados Pessoais
            </h2>
            <div style={{ display: "grid", gap: 12 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <label style={labelStyle}>
                  Nome
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Apelido
                  <input
                    type="text"
                    value={apelido}
                    onChange={(e) => setApelido(e.target.value)}
                    style={inputStyle}
                  />
                </label>
              </div>
              <label style={labelStyle}>
                Email
                <input
                  type="email"
                  value={profile.email ?? ""}
                  disabled
                  style={{ ...inputStyle, opacity: 0.6 }}
                />
              </label>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, fontSize: 16, color: "#fff" }}>
              Plano e Faturação
            </h2>
            <div style={{ display: "grid", gap: 12 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <label style={labelStyle}>
                  Plano
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="agency">Agency</option>
                  </select>
                </label>
                <label style={labelStyle}>
                  Faturação
                  <select
                    value={billing}
                    onChange={(e) => setBilling(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </label>
              </div>
              <label style={labelStyle}>
                Limite de cartões
                <input
                  type="number"
                  value={limit}
                  min={1}
                  onChange={(e) =>
                    setLimit(parseInt(e.target.value || "1", 10))
                  }
                  style={inputStyle}
                />
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <label style={labelStyle}>
                  Plano começa em
                  <input
                    type="datetime-local"
                    value={
                      planStartedAt
                        ? new Date(planStartedAt).toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      setPlanStartedAt(
                        e.target.value
                          ? new Date(e.target.value).toISOString()
                          : null,
                      )
                    }
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Plano expira em
                  <input
                    type="datetime-local"
                    value={
                      planExpiresAt
                        ? new Date(planExpiresAt).toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      setPlanExpiresAt(
                        e.target.value
                          ? new Date(e.target.value).toISOString()
                          : null,
                      )
                    }
                    style={inputStyle}
                  />
                </label>
              </div>
              <label
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.8)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={planAutoRenew}
                  onChange={(e) => setPlanAutoRenew(e.target.checked)}
                />
                <span>Auto-renovar plano</span>
              </label>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, fontSize: 16, color: "#fff" }}>
              Add-ons & Acessos
            </h2>
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: crmProActive ? 12 : 0 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>🧠 CRM Pro</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Acesso manual ao CRM Pro</div>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <div
                      onClick={() => setCrmProActive(p => !p)}
                      style={{
                        width: 44, height: 24, borderRadius: 12, cursor: "pointer",
                        background: crmProActive ? "#6366f1" : "rgba(255,255,255,0.15)",
                        position: "relative", transition: "background 0.2s"
                      }}
                    >
                      <div style={{
                        position: "absolute", top: 3, left: crmProActive ? 23 : 3,
                        width: 18, height: 18, borderRadius: "50%", background: "#fff",
                        transition: "left 0.2s"
                      }} />
                    </div>
                    <span style={{ fontSize: 12, color: crmProActive ? "#a5b4fc" : "rgba(255,255,255,0.4)" }}>
                      {crmProActive ? "Ativo" : "Inativo"}
                    </span>
                  </label>
                </div>
                {crmProActive && (
                  <label style={labelStyle}>
                    Expira em (opcional)
                    <input
                      type="datetime-local"
                      value={crmProExpiresAt ? new Date(crmProExpiresAt).toISOString().slice(0, 16) : ""}
                      onChange={(e) => setCrmProExpiresAt(e.target.value ? new Date(e.target.value).toISOString() : null)}
                      style={inputStyle}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, fontSize: 16, color: "#fff" }}>
              Estado da Conta
            </h2>
            <div style={{ display: "grid", gap: 12 }}>
              <label
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.8)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={disabled}
                  onChange={(e) => setDisabled(e.target.checked)}
                />
                <span>Conta desativada</span>
              </label>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                Se ativado, o cliente não consegue aceder à conta.
              </p>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, fontSize: 16, color: "#fff" }}>Ações</h2>
            <div style={{ display: "grid", gap: 12 }}>
              <button
                onClick={saveProfile}
                disabled={saving}
                style={{
                  padding: "12px",
                  borderRadius: 10,
                  border: "none",
                  background: "#22c55e",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {saving ? t("dashboard.saving") : "💾 " + t("dashboard.save")}
              </button>
              <button
                onClick={deleteAccount}
                disabled={deleting}
                style={{
                  padding: "12px",
                  borderRadius: 10,
                  border: "1px solid #dc2626",
                  background: "transparent",
                  color: "#dc2626",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {deleting
                  ? t("dashboard.deleting")
                  : "🗑️ " + t("dashboard.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "cartoes" && (
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, fontSize: 16, color: "#fff" }}>
            Cartões do Cliente
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 600,
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <th style={{ padding: 12, color: "#fff" }}>Título</th>
                  <th style={{ padding: 12, color: "#fff" }}>Slug</th>
                  <th style={{ padding: 12, color: "#fff" }}>Publicado</th>
                  <th style={{ padding: 12, color: "#fff" }}>Criado</th>
                  <th style={{ padding: 12, color: "#fff" }}>Estado</th>
                  <th style={{ padding: 12, color: "#fff" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((c, idx) => (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      background:
                        idx % 2 === 0
                          ? "rgba(255,255,255,0.02)"
                          : "transparent",
                    }}
                  >
                    <td style={{ padding: 12, fontWeight: 700, color: "#fff" }}>
                      {c.title ?? "—"}
                    </td>
                    <td
                      style={{ padding: 12, color: "rgba(255,255,255,0.85)" }}
                    >
                      {c.slug ?? "—"}
                    </td>
                    <td
                      style={{ padding: 12, color: "rgba(255,255,255,0.85)" }}
                    >
                      {c.published ? "✅ Sim" : "❌ Não"}
                    </td>
                    <td
                      style={{ padding: 12, color: "rgba(255,255,255,0.85)" }}
                    >
                      {c.created_at
                        ? new Date(c.created_at).toLocaleString("pt-PT")
                        : "—"}
                    </td>
                    <td style={{ padding: 12 }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          background: c.published
                            ? "rgba(34,197,94,0.2)"
                            : "rgba(239,68,68,0.2)",
                          color: c.published ? "#22c55e" : "#ef4444",
                        }}
                      >
                        {c.published ? "Publicado" : "Rascunho"}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div
                        style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                      >
                        <a
                          href={"/dashboard/cards/" + c.id + "/theme"}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            background: "#7c3aed",
                            color: "white",
                            textDecoration: "none",
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          ✏️ {t("dashboard.edit")}{" "}
                        </a>
                        {c.slug && c.published && (
                          <a
                            href={"/" + c.slug}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: "6px 10px",
                              borderRadius: 8,
                              background: "#2563eb",
                              color: "white",
                              textDecoration: "none",
                              fontWeight: 600,
                              fontSize: 12,
                            }}
                          >
                            👁 {t("dashboard.view")}{" "}
                          </a>
                        )}
                        <button
                          onClick={() => toggleCardPublish(c.id, !c.published)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: "none",
                            background: c.published ? "#ef4444" : "#22c55e",
                            color: "white",
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          {c.published
                            ? t("dashboard.unpublish")
                            : t("dashboard.publish")}
                        </button>
                        <button
                          onClick={() => deleteCard(c.id)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: "none",
                            background: "#7f1d1d",
                            color: "white",
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {cards.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ padding: 16, color: "rgba(255,255,255,0.6)" }}
                    >
                      Sem cartões.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "dominios" && (
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
              Adicionar domínio
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <select
                value={selectedDomainCardId}
                onChange={(e) => setSelectedDomainCardId(e.target.value)}
                style={{
                  padding: "0 12px",
                  height: 42,
                  lineHeight: "42px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(0,0,0,0.25)",
                  color: "#fff",
                  minWidth: 240,
                }}
              >
                {domainCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {((c.name || c.title) ? `${c.name || c.title} — ${c.slug}` : (c.slug || "—"))}
                  </option>
                ))}
              </select>

              <input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="ex: cartao.cliente.pt"
                style={{
                  padding: "0 12px",
                  height: 42,
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(0,0,0,0.25)",
                  color: "#fff",
                  minWidth: 260,
                  flex: 1,
                }}
              />

              <button
                onClick={createDomain}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(124,58,237,0.55)",
                  background: "rgba(124,58,237,0.25)",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Criar
              </button>

              <button
                onClick={loadDomains}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Recarregar
              </button>
            </div>

            <div
              style={{
                marginTop: 10,
                color: "rgba(255,255,255,0.7)",
                fontSize: 13,
              }}
            >
              Depois de criares, configura o DNS no teu registrador e usa
              “Verificar”.
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                Domínios do cliente
              </div>
              {domainsLoading && (
                <div style={{ color: "rgba(255,255,255,0.7)" }}>
                  A carregar…
                </div>
              )}
            </div>

            {domains.length === 0 ? (
              <div style={{ color: "rgba(255,255,255,0.7)" }}>
                Ainda não há domínios associados aos cartões deste cliente.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        textAlign: "left",
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 13,
                      }}
                    >
                      <th style={{ padding: "10px 8px" }}>Domínio</th>
                      <th style={{ padding: "10px 8px" }}>Cartão</th>
                      <th style={{ padding: "10px 8px" }}>Status</th>
                      <th style={{ padding: "10px 8px" }}>Último check</th>
                      <th style={{ padding: "10px 8px" }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {domains.map((d) => {
                      const card = domainCards.find((c) => c.id === d.card_id);
                      const status = (d.status || "").toLowerCase();
                      const isActive = status === "active";
                      const badgeBg = isActive
                        ? "rgba(34,197,94,0.18)"
                        : "rgba(234,179,8,0.18)";
                      const badgeBorder = isActive
                        ? "rgba(34,197,94,0.35)"
                        : "rgba(234,179,8,0.35)";
                      const badgeText = isActive ? "#86efac" : "#fde68a";

                      return (
                        <tr
                          key={d.id}
                          style={{
                            borderTop: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <td style={{ padding: "10px 8px", fontWeight: 700 }}>
                            {d.domain}
                          </td>
                          <td
                            style={{
                              padding: "10px 8px",
                              color: "rgba(255,255,255,0.85)",
                            }}
                          >
                            {card ? card.title || "Sem título" : d.card_id}
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                borderRadius: 999,
                                background: badgeBg,
                                border: `1px solid ${badgeBorder}`,
                                color: badgeText,
                                fontSize: 12,
                                fontWeight: 800,
                                letterSpacing: 0.2,
                              }}
                            >
                              {d.status || "—"}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "10px 8px",
                              color: "rgba(255,255,255,0.7)",
                              fontSize: 13,
                            }}
                          >
                            {d.last_check_at
                              ? new Date(d.last_check_at).toLocaleString()
                              : "—"}
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                onClick={() => verifyDomain(d.domain)}
                                style={{
                                  padding: "8px 10px",
                                  borderRadius: 10,
                                  border: "1px solid rgba(255,255,255,0.18)",
                                  background: "rgba(255,255,255,0.06)",
                                  color: "#fff",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                Verificar
                              </button>

                              <a
                                href={`https://${d.domain}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  padding: "8px 10px",
                                  borderRadius: 10,
                                  border: "1px solid rgba(255,255,255,0.18)",
                                  background: "rgba(255,255,255,0.06)",
                                  color: "#fff",
                                  fontWeight: 700,
                                  textDecoration: "none",
                                }}
                              >
                                Abrir
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 12,
                  border:
                    days === d
                      ? "2px solid #7c3aed"
                      : "1px solid rgba(255,255,255,0.15)",
                  background:
                    days === d
                      ? "rgba(124,58,237,0.15)"
                      : "rgba(255,255,255,0.05)",
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Últimos {d} dias
              </button>
            ))}
          </div>

          {analyticsLoading ? (
            <p style={{ color: "rgba(255,255,255,0.7)" }}>
              A carregar analytics…
            </p>
          ) : (
            <>
              {chartData.length > 0 && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,0.10)",
                    padding: 24,
                  }}
                >
                  <h2
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: "rgba(255,255,255,0.95)",
                      marginTop: 0,
                      marginBottom: 20,
                    }}
                  >
                    Histórico Diário
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.10)"
                      />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" />
                      <YAxis stroke="rgba(255,255,255,0.6)" />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(0,0,0,0.8)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: 8,
                          color: "#fff",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="views"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="clicks"
                        stroke="#a855f7"
                        strokeWidth={2}
                        dot={{ fill: "#a855f7", r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="leads"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ fill: "#22c55e", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {cardSummary.length > 0 && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,0.10)",
                    padding: 24,
                  }}
                >
                  <h2
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: "rgba(255,255,255,0.95)",
                      marginTop: 0,
                      marginBottom: 20,
                    }}
                  >
                    Top Cartões
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cardSummary.slice(0, 10)}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.10)"
                      />
                      <XAxis
                        dataKey="card_name"
                        stroke="rgba(255,255,255,0.6)"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis stroke="rgba(255,255,255,0.6)" />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(0,0,0,0.8)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: 8,
                          color: "#fff",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="total_views" fill="#3b82f6" />
                      <Bar dataKey="total_clicks" fill="#a855f7" />
                      <Bar dataKey="total_leads" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {chartData.length === 0 && cardSummary.length === 0 && (
                <p style={{ color: "rgba(255,255,255,0.55)" }}>
                  Sem dados de analytics.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
