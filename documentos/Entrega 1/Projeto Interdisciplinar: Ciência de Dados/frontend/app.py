# -*- coding: utf-8 -*-
"""
Dashboard de Ciência de Dados — Projeto Interdisciplinar
Streamlit App consumindo dados direto do Supabase
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import warnings
from datetime import date
from supabase import create_client, Client

warnings.filterwarnings("ignore")

# ── Configuração da página ────────────────────────────────────────
st.set_page_config(
    page_title="Dashboard — Ciência de Dados",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ── CSS personalizado ─────────────────────────────────────────────
st.markdown("""
<style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 700;
        color: #1a3a5c;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1rem;
        color: #6b7280;
        margin-bottom: 2rem;
    }
    .kpi-card {
        background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
        border-radius: 12px;
        padding: 1.2rem 1.5rem;
        color: white;
        text-align: center;
        box-shadow: 0 4px 15px rgba(37,99,235,0.2);
    }
    .kpi-value {
        font-size: 1.8rem;
        font-weight: 700;
        margin: 0.3rem 0;
    }
    .kpi-label {
        font-size: 0.78rem;
        opacity: 0.85;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .section-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a3a5c;
        border-left: 4px solid #2563eb;
        padding-left: 0.75rem;
        margin: 2rem 0 1rem;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        border-radius: 8px 8px 0 0;
        padding: 0.5rem 1.2rem;
        font-weight: 500;
    }
    .alert-box {
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 8px;
        padding: 1rem 1.5rem;
        margin: 1rem 0;
    }
    div[data-testid="stSidebar"] {
        background-color: #f0f4f8;
    }
</style>
""", unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════════════
# CONEXÃO SUPABASE
# ═══════════════════════════════════════════════════════════════════

def get_supabase_client() -> Client:
    url = st.secrets.get("SUPABASE_URL", "")
    key = st.secrets.get("SUPABASE_KEY", "")

    if not url or not key:
        st.error("Credenciais do Supabase não encontradas. Configure em .streamlit/secrets.toml")
        st.stop()

    return create_client(url, key)

supabase = get_supabase_client()

# ═══════════════════════════════════════════════════════════════════
# FUNÇÕES DE CARREGAMENTO E PROCESSAMENTO
# ═══════════════════════════════════════════════════════════════════

@st.cache_data(show_spinner=False, ttl=300)
def fetch_table(table_name: str, columns: str = "*", page_size: int = 1000) -> pd.DataFrame:
    """
    Busca todos os registros de uma tabela do Supabase com paginação.
    """
    client = get_supabase_client()
    all_rows = []
    start = 0

    while True:
        end = start + page_size - 1
        response = client.table(table_name).select(columns).range(start, end).execute()
        rows = response.data or []

        if not rows:
            break

        all_rows.extend(rows)

        if len(rows) < page_size:
            break

        start += page_size

    return pd.DataFrame(all_rows)


def safe_datetime(series, utc=True):
    if series is None or len(series) == 0:
        return series
    converted = pd.to_datetime(series, utc=utc, errors="coerce")
    try:
        return converted.dt.tz_localize(None)
    except Exception:
        return converted


def process_data_from_supabase():
    """
    Carrega e processa todos os dados do Supabase.
    """

    # 1. Carregar tabelas do Supabase
    df_order = fetch_table("store_order")
    df_customer = fetch_table("customer")
    df_campaign = fetch_table("campaign")
    df_campord = fetch_table("campaign_order")
    df_store = fetch_table("store")
    df_address = fetch_table("customer_address")

    # Garantir DataFrames válidos
    for name, df in {
        "store_order": df_order,
        "customer": df_customer,
        "campaign": df_campaign,
        "campaign_order": df_campord,
        "store": df_store,
        "customer_address": df_address,
    }.items():
        if df.empty:
            st.warning(f"A tabela `{name}` está vazia ou não retornou dados.")

    # 2. Seleção de colunas com fallback seguro
    order_cols = [
        "id", "storeid", "customerid", "scheduledat",
        "totalamount", "subtotalamount", "discountamount",
        "saleschannel", "ordertype", "status", "createdat"
    ]
    customer_cols = ["id", "name", "gender", "dateofbirth", "status", "createdat"]
    campaign_cols = [
        "segmentid", "templateid", "storeid", "name",
        "type", "statusend", "createdat", "customerid", "sendat"
    ]

    order_sel = df_order[[c for c in order_cols if c in df_order.columns]].copy()
    customer_sel = df_customer[[c for c in customer_cols if c in df_customer.columns]].copy()
    campaign_sel = df_campaign[[c for c in campaign_cols if c in df_campaign.columns]].copy()
    camporder_sel = df_campord.copy()

    # 3. Conversão de datas
    for col in ["scheduledat", "createdat"]:
        if col in order_sel.columns:
            order_sel[col] = safe_datetime(order_sel[col], utc=True)

    if "createdat" in customer_sel.columns:
        customer_sel["createdat"] = safe_datetime(customer_sel["createdat"], utc=True)

    if "dateofbirth" in customer_sel.columns:
        customer_sel["dateofbirth"] = pd.to_datetime(customer_sel["dateofbirth"], errors="coerce")

    if "createdat" in campaign_sel.columns:
        campaign_sel["createdat"] = safe_datetime(campaign_sel["createdat"], utc=True)

    if "sendat" in campaign_sel.columns:
        campaign_sel["sendat"] = safe_datetime(campaign_sel["sendat"], utc=True)

    for col in ["sent_at", "order_at", "sentat", "orderat", "createdat"]:
        if col in camporder_sel.columns:
            camporder_sel[col] = safe_datetime(camporder_sel[col], utc=True)

    # 4. Limpeza
    order_sel.drop_duplicates(inplace=True)
    customer_sel.drop_duplicates(inplace=True)
    campaign_sel.drop_duplicates(inplace=True)
    camporder_sel.drop_duplicates(inplace=True)

    if "name" in customer_sel.columns:
        customer_sel["name"] = customer_sel["name"].astype(str).str.strip().str.title()

    if "gender" in customer_sel.columns:
        customer_sel["gender"] = (
            customer_sel["gender"]
            .fillna("NI")
            .astype(str)
            .str.upper()
            .str.strip()
        )

    if "saleschannel" in order_sel.columns:
        order_sel["saleschannel"] = order_sel["saleschannel"].fillna("").astype(str).str.upper().str.strip()

    if "ordertype" in order_sel.columns:
        order_sel["ordertype"] = order_sel["ordertype"].fillna("").astype(str).str.upper().str.strip()

    if "totalamount" in order_sel.columns:
        order_sel["totalamount"] = pd.to_numeric(order_sel["totalamount"], errors="coerce")
        order_sel = order_sel[order_sel["totalamount"] > 0].copy()

    for col in ["subtotalamount", "discountamount"]:
        if col in order_sel.columns:
            order_sel[col] = pd.to_numeric(order_sel[col], errors="coerce")

    # 5. Feature engineering
    TODAY = pd.Timestamp(date.today())

    if "dateofbirth" in customer_sel.columns:
        customer_sel["age"] = ((TODAY - customer_sel["dateofbirth"]).dt.days / 365.25).round().astype("Int64")
    else:
        customer_sel["age"] = pd.Series(dtype="Int64")

    def faixa_etaria(age):
        if pd.isna(age): return "Não Informado"
        if age < 18: return "Menor de 18"
        if age < 25: return "18–24"
        if age < 35: return "25–34"
        if age < 45: return "35–44"
        if age < 55: return "45–54"
        if age < 65: return "55–64"
        return "65+"

    customer_sel["age_group"] = customer_sel["age"].apply(faixa_etaria)

    if "createdat" in order_sel.columns:
        order_sel["year"] = order_sel["createdat"].dt.year
        order_sel["month"] = order_sel["createdat"].dt.month
        order_sel["month_name"] = order_sel["createdat"].dt.strftime("%b %Y")
        order_sel["weekday"] = order_sel["createdat"].dt.day_name()
        order_sel["hour"] = order_sel["createdat"].dt.hour
        order_sel["is_weekend"] = order_sel["createdat"].dt.dayofweek >= 5
    else:
        order_sel["year"] = np.nan
        order_sel["month"] = np.nan
        order_sel["month_name"] = None
        order_sel["weekday"] = None
        order_sel["hour"] = np.nan
        order_sel["is_weekend"] = False

    if "discountamount" in order_sel.columns:
        order_sel["has_discount"] = order_sel["discountamount"].fillna(0) > 0
    else:
        order_sel["discountamount"] = 0
        order_sel["has_discount"] = False

    if "storeid" in order_sel.columns and "totalamount" in order_sel.columns:
        ticket_medio = order_sel.groupby("storeid")["totalamount"].mean().rename("avg_ticket")
        order_sel = order_sel.merge(ticket_medio, on="storeid", how="left")
    else:
        order_sel["avg_ticket"] = np.nan

    if "sendat" in campaign_sel.columns and "createdat" in campaign_sel.columns:
        campaign_sel["days_to_send"] = (campaign_sel["sendat"] - campaign_sel["createdat"]).dt.days
    else:
        campaign_sel["days_to_send"] = np.nan

    # 6. Joins
    store_name_df = df_store.copy()
    if "id" in store_name_df.columns and "name" in store_name_df.columns:
        store_name_df = store_name_df[["id", "name"]].rename(columns={"id": "storeid", "name": "store_name"})
    else:
        store_name_df = pd.DataFrame(columns=["storeid", "store_name"])

    customer_info_df = customer_sel.copy()
    if "id" in customer_info_df.columns:
        customer_info_df = customer_info_df[["id", "name", "gender", "age", "age_group"]].rename(
            columns={"id": "customerid", "name": "customer_name"}
        )
    else:
        customer_info_df = pd.DataFrame(columns=["customerid", "customer_name", "gender", "age", "age_group"])

    orders_full = order_sel.merge(store_name_df, on="storeid", how="left") if "storeid" in order_sel.columns else order_sel.copy()
    orders_full = orders_full.merge(customer_info_df, on="customerid", how="left") if "customerid" in orders_full.columns else orders_full

    if not df_address.empty and "customerid" in df_address.columns:
        addr_cols = [c for c in ["customerid", "city", "state"] if c in df_address.columns]
        addr_agg = df_address[addr_cols].groupby("customerid").first().reset_index()
        orders_full = orders_full.merge(addr_agg, on="customerid", how="left")
    else:
        orders_full["city"] = None
        orders_full["state"] = None

    # Campaign performance
    camp_details = campaign_sel.copy()
    if "segmentid" in camp_details.columns and "name" in camp_details.columns:
        camp_details = camp_details.rename(columns={"name": "campaign_name"})

    if "campaignid" in camporder_sel.columns and "segmentid" in camp_details.columns:
        cols_merge = [c for c in ["segmentid", "campaign_name", "type", "statusend", "sendat", "days_to_send"] if c in camp_details.columns]
        campaign_perf = camporder_sel.merge(
            camp_details[cols_merge].rename(columns={"segmentid": "campaign_id_for_merge"}),
            left_on="campaignid",
            right_on="campaign_id_for_merge",
            how="left"
        ).drop(columns=["campaign_id_for_merge"], errors="ignore")
    else:
        campaign_perf = camporder_sel.copy()

    if "storeid" in campaign_perf.columns and "id" in df_store.columns and "name" in df_store.columns:
        campaign_perf = campaign_perf.merge(
            df_store[["id", "name"]].rename(columns={"id": "store_id_for_merge", "name": "store_name"}),
            left_on="storeid",
            right_on="store_id_for_merge",
            how="left"
        ).drop(columns=["store_id_for_merge"], errors="ignore")

    if "status" in campaign_perf.columns:
        status_map = {2: "Entregue", 3: "Aberto", 4: "Convertido"}
        campaign_perf["status_label"] = campaign_perf["status"].map(status_map).fillna("Outro")
    else:
        campaign_perf["status_label"] = "Outro"

    if "totalamount" in campaign_perf.columns:
        campaign_perf["totalamount"] = pd.to_numeric(campaign_perf["totalamount"], errors="coerce")

    return orders_full, campaign_perf, customer_sel, campaign_sel, df_store, df_address


def compute_kpis(orders_full, campaign_perf, campaign_sel):
    receita_total = orders_full["totalamount"].sum() if "totalamount" in orders_full.columns else 0
    ticket_medio = orders_full["totalamount"].mean() if "totalamount" in orders_full.columns and len(orders_full) else 0
    clientes_unicos = orders_full["customerid"].nunique() if "customerid" in orders_full.columns else 0
    lojas_ativas = orders_full["storeid"].nunique() if "storeid" in orders_full.columns else 0
    total_campanhas = len(campaign_sel)
    convertidas = (campaign_perf["status"] == 4).sum() if "status" in campaign_perf.columns else 0
    taxa_conversao = (campaign_perf["status"] == 4).mean() * 100 if "status" in campaign_perf.columns and len(campaign_perf) else 0

    if "has_discount" in orders_full.columns and "discountamount" in orders_full.columns:
        desconto_medio = orders_full.loc[orders_full["has_discount"], "discountamount"].mean()
        pct_desconto = orders_full["has_discount"].mean() * 100
    else:
        desconto_medio = np.nan
        pct_desconto = 0

    return {
        "total_pedidos": len(orders_full),
        "receita_total": receita_total,
        "ticket_medio": ticket_medio,
        "clientes_unicos": clientes_unicos,
        "lojas_ativas": lojas_ativas,
        "total_campanhas": total_campanhas,
        "convertidas": convertidas,
        "taxa_conversao": taxa_conversao,
        "desconto_medio": desconto_medio,
        "pct_desconto": pct_desconto,
    }


# ── Paleta de cores ───────────────────────────────────────────────
BLUES = ["#1e3a5f", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"]

# ═══════════════════════════════════════════════════════════════════
# SIDEBAR
# ═══════════════════════════════════════════════════════════════════

with st.sidebar:
    st.image("https://img.icons8.com/color/96/data-configuration.png", width=72)
    st.markdown("## 📊 Dashboard Analytics")
    st.markdown("**Projeto Interdisciplinar — Ciência de Dados**")
    st.divider()

    st.markdown("### ☁️ Fonte de Dados")
    st.success("Conectado ao Supabase")

    st.divider()
    st.markdown("### 🎨 Configurações")
    show_raw = st.checkbox("Exibir dados brutos nas abas", value=False)
    n_top = st.slider("Top N lojas / estados", 5, 20, 10)

    if st.button("🔄 Atualizar dados"):
        st.cache_data.clear()
        st.rerun()

    st.divider()
    st.markdown("""
    <div style='font-size:0.75rem; color:#6b7280;'>
    Entrega 1 — Preparação e Exploração<br>
    Pipeline: Supabase → EDA → Processamento → KPIs
    </div>
    """, unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════════════
# HEADER
# ═══════════════════════════════════════════════════════════════════

st.markdown('<div class="main-header">📊 Dashboard Analítico — Ciência de Dados</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">Análise exploratória de pedidos, clientes, lojas e campanhas de marketing</div>', unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════════════
# CARREGAMENTO DOS DADOS
# ═══════════════════════════════════════════════════════════════════

data_ready = False

with st.spinner("⚙️ Carregando dados do Supabase..."):
    try:
        orders_full, campaign_perf, customer_sel, campaign_sel, df_store, df_address = process_data_from_supabase()
        kpis = compute_kpis(orders_full, campaign_perf, campaign_sel)
        data_ready = True
    except Exception as e:
        st.error(f"Erro ao carregar dados do Supabase: {e}")

# ═══════════════════════════════════════════════════════════════════
# CONTEÚDO PRINCIPAL
# ═══════════════════════════════════════════════════════════════════

if data_ready and not orders_full.empty:

    st.markdown('<div class="section-title">🔎 Filtros Globais</div>', unsafe_allow_html=True)
    col_f1, col_f2, col_f3 = st.columns(3)

    with col_f1:
        anos = sorted([int(a) for a in orders_full["year"].dropna().unique().tolist()]) if "year" in orders_full.columns else []
        anos_sel = st.multiselect("Ano", anos, default=anos)

    with col_f2:
        canais = sorted([c for c in orders_full["saleschannel"].dropna().unique().tolist() if c != ""]) if "saleschannel" in orders_full.columns else []
        canal_sel = st.multiselect("Canal de Vendas", canais, default=canais)

    with col_f3:
        tipos = sorted([t for t in orders_full["ordertype"].dropna().unique().tolist() if t != ""]) if "ordertype" in orders_full.columns else []
        tipo_sel = st.multiselect("Tipo de Pedido", tipos, default=tipos)

    mask = pd.Series(True, index=orders_full.index)

    if anos_sel and "year" in orders_full.columns:
        mask &= orders_full["year"].isin(anos_sel)

    if canal_sel and "saleschannel" in orders_full.columns:
        mask &= orders_full["saleschannel"].isin(canal_sel)

    if tipo_sel and "ordertype" in orders_full.columns:
        mask &= orders_full["ordertype"].isin(tipo_sel)

    df_f = orders_full[mask].copy()
    kpis_f = compute_kpis(df_f, campaign_perf, campaign_sel)

    st.caption(f"🔢 Exibindo **{len(df_f):,}** de **{len(orders_full):,}** pedidos após filtros.")

    st.markdown('<div class="section-title">📈 KPIs Principais</div>', unsafe_allow_html=True)
    k1, k2, k3, k4, k5 = st.columns(5)

    kpi_items = [
        (k1, "💰 Receita Total", f"R$ {kpis_f['receita_total']:,.0f}"),
        (k2, "🛒 Total de Pedidos", f"{kpis_f['total_pedidos']:,}"),
        (k3, "🎯 Ticket Médio", f"R$ {kpis_f['ticket_medio']:,.2f}"),
        (k4, "👥 Clientes Únicos", f"{kpis_f['clientes_unicos']:,}"),
        (k5, "🏪 Lojas Ativas", f"{kpis_f['lojas_ativas']:,}"),
    ]

    for col, label, val in kpi_items:
        with col:
            st.markdown(f"""
            <div class="kpi-card">
                <div class="kpi-label">{label}</div>
                <div class="kpi-value">{val}</div>
            </div>
            """, unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)
    k6, k7, k8, k9, k10 = st.columns(5)

    kpi_items2 = [
        (k6, "📣 Campanhas", f"{kpis_f['total_campanhas']:,}"),
        (k7, "✅ Convertidas", f"{int(kpis_f['convertidas']):,}"),
        (k8, "📊 Taxa de Conversão", f"{kpis_f['taxa_conversao']:.1f}%"),
        (k9, "🏷️ Desc. Médio", f"R$ {kpis_f['desconto_medio']:,.2f}" if not np.isnan(kpis_f["desconto_medio"]) else "R$ —"),
        (k10, "🎁 % c/ Desconto", f"{kpis_f['pct_desconto']:.1f}%"),
    ]

    for col, label, val in kpi_items2:
        with col:
            st.markdown(f"""
            <div class="kpi-card" style="background: linear-gradient(135deg,#0f4c75,#1b6ca8);">
                <div class="kpi-label">{label}</div>
                <div class="kpi-value">{val}</div>
            </div>
            """, unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "📦 Pedidos & Receita",
        "👥 Clientes",
        "🏪 Lojas",
        "📣 Campanhas",
        "🔍 Dados & EDA"
    ])

    with tab1:
        st.markdown('<div class="section-title">📅 Evolução Mensal</div>', unsafe_allow_html=True)

        monthly = (
            df_f.assign(yearmonth=df_f["createdat"].dt.to_period("M"))
            .groupby("yearmonth")
            .agg(pedidos=("id", "count"), receita=("totalamount", "sum"))
            .reset_index()
        )
        monthly["yearmonth_str"] = monthly["yearmonth"].astype(str)

        fig_time = make_subplots(specs=[[{"secondary_y": True}]])
        fig_time.add_trace(go.Bar(
            x=monthly["yearmonth_str"], y=monthly["pedidos"],
            name="Qtd Pedidos", marker_color="#93c5fd", opacity=0.8
        ), secondary_y=False)
        fig_time.add_trace(go.Scatter(
            x=monthly["yearmonth_str"], y=monthly["receita"],
            name="Receita (R$)", line=dict(color="#1d4ed8", width=2.5),
            mode="lines+markers", marker=dict(size=5)
        ), secondary_y=True)
        fig_time.update_layout(
            title="Evolução Mensal de Pedidos e Receita",
            hovermode="x unified", height=380,
            legend=dict(orientation="h", y=1.1),
            plot_bgcolor="white", paper_bgcolor="white"
        )
        fig_time.update_yaxes(title_text="Qtd Pedidos", secondary_y=False, gridcolor="#f0f4f8")
        fig_time.update_yaxes(title_text="Receita (R$)", secondary_y=True)
        st.plotly_chart(fig_time, use_container_width=True)

        c1, c2 = st.columns(2)

        with c1:
            st.markdown('<div class="section-title">📡 Canal de Vendas</div>', unsafe_allow_html=True)
            canal_data = df_f["saleschannel"].value_counts().reset_index()
            canal_data.columns = ["Canal", "Pedidos"]
            fig_canal = px.bar(
                canal_data, x="Canal", y="Pedidos",
                color="Pedidos", color_continuous_scale="Blues",
                text_auto=True
            )
            fig_canal.update_layout(height=320, plot_bgcolor="white", paper_bgcolor="white",
                                    showlegend=False, coloraxis_showscale=False)
            fig_canal.update_traces(textposition="outside")
            st.plotly_chart(fig_canal, use_container_width=True)

        with c2:
            st.markdown('<div class="section-title">📋 Tipo de Pedido</div>', unsafe_allow_html=True)
            tipo_data = df_f["ordertype"].value_counts().reset_index()
            tipo_data.columns = ["Tipo", "Pedidos"]
            fig_tipo = px.pie(
                tipo_data, names="Tipo", values="Pedidos",
                color_discrete_sequence=BLUES, hole=0.45
            )
            fig_tipo.update_layout(height=320, paper_bgcolor="white")
            st.plotly_chart(fig_tipo, use_container_width=True)

        st.markdown('<div class="section-title">💸 Distribuição do Valor dos Pedidos</div>', unsafe_allow_html=True)
        c3, c4 = st.columns(2)

        orders_clean = df_f[df_f["totalamount"].between(1, 500)]
        with c3:
            fig_hist = px.histogram(
                orders_clean, x="totalamount", nbins=60,
                color_discrete_sequence=["#2563eb"],
                labels={"totalamount": "Valor (R$)", "count": "Frequência"},
                title="Distribuição de Valores (R$ 1–500)"
            )
            mean_v = orders_clean["totalamount"].mean()
            median_v = orders_clean["totalamount"].median()
            fig_hist.add_vline(x=mean_v, line_dash="dash", line_color="red",
                               annotation_text=f"Média R${mean_v:.2f}")
            fig_hist.add_vline(x=median_v, line_dash="dash", line_color="orange",
                               annotation_text=f"Mediana R${median_v:.2f}")
            fig_hist.update_layout(height=320, plot_bgcolor="white", paper_bgcolor="white")
            st.plotly_chart(fig_hist, use_container_width=True)

        with c4:
            fig_box = px.box(
                orders_clean, x="ordertype", y="totalamount",
                color="ordertype", color_discrete_sequence=BLUES,
                labels={"ordertype": "Tipo", "totalamount": "Valor (R$)"},
                title="Valor por Tipo de Pedido"
            )
            fig_box.update_layout(height=320, plot_bgcolor="white", paper_bgcolor="white",
                                  showlegend=False)
            st.plotly_chart(fig_box, use_container_width=True)

        st.markdown('<div class="section-title">📆 Pedidos por Dia da Semana & Hora</div>', unsafe_allow_html=True)
        c5, c6 = st.columns(2)

        weekday_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        weekday_labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
        wday = df_f["weekday"].value_counts().reindex(weekday_order).reset_index()
        wday.columns = ["Dia", "Pedidos"]
        wday["Label"] = weekday_labels
        wday["Fim de semana"] = wday["Dia"].isin(["Saturday", "Sunday"])

        with c5:
            fig_wday = px.bar(
                wday, x="Label", y="Pedidos",
                color="Fim de semana",
                color_discrete_map={True: "#f97316", False: "#2563eb"},
                labels={"Label": "Dia da Semana"},
                title="Pedidos por Dia da Semana"
            )
            fig_wday.update_layout(height=320, plot_bgcolor="white", paper_bgcolor="white",
                                   showlegend=False)
            st.plotly_chart(fig_wday, use_container_width=True)

        with c6:
            hour_data = df_f.groupby("hour").agg(pedidos=("id", "count")).reset_index()
            fig_hour = px.area(
                hour_data, x="hour", y="pedidos",
                color_discrete_sequence=["#2563eb"],
                labels={"hour": "Hora", "pedidos": "Pedidos"},
                title="Pedidos por Hora do Dia"
            )
            fig_hour.update_layout(height=320, plot_bgcolor="white", paper_bgcolor="white")
            st.plotly_chart(fig_hour, use_container_width=True)

        if show_raw:
            raw_cols = [c for c in ["createdat", "storeid", "store_name", "totalamount", "saleschannel", "ordertype"] if c in df_f.columns]
            st.dataframe(df_f[raw_cols].head(500), use_container_width=True)

    with tab2:
        c1, c2 = st.columns(2)

        with c1:
            st.markdown('<div class="section-title">🚻 Distribuição por Gênero</div>', unsafe_allow_html=True)
            gender_map = {"M": "Masculino", "F": "Feminino", "N": "Não-Binário", "O": "Outro", "NI": "Não Informado"}
            genero = df_f["gender"].map(gender_map).fillna("Não Informado").value_counts().reset_index()
            genero.columns = ["Gênero", "Clientes"]
            fig_gen = px.pie(
                genero, names="Gênero", values="Clientes",
                color_discrete_sequence=BLUES, hole=0.4
            )
            fig_gen.update_layout(height=360, paper_bgcolor="white")
            st.plotly_chart(fig_gen, use_container_width=True)

        with c2:
            st.markdown('<div class="section-title">🎂 Receita por Faixa Etária</div>', unsafe_allow_html=True)
            age_order_cats = ["Menor de 18", "18–24", "25–34", "35–44", "45–54", "55–64", "65+", "Não Informado"]
            age_receita = (
                df_f.groupby("age_group")["totalamount"]
                .agg(["sum", "count"])
                .reindex([c for c in age_order_cats if c in df_f["age_group"].unique()])
                .reset_index()
            )
            age_receita.columns = ["Faixa Etária", "Receita", "Pedidos"]
            fig_age = px.bar(
                age_receita, x="Faixa Etária", y="Receita",
                color="Receita", color_continuous_scale="Blues",
                text_auto=".2s", title="Receita por Faixa Etária"
            )
            fig_age.update_layout(height=360, plot_bgcolor="white", paper_bgcolor="white",
                                  coloraxis_showscale=False)
            st.plotly_chart(fig_age, use_container_width=True)

        st.markdown('<div class="section-title">🗺️ Top Estados por Clientes</div>', unsafe_allow_html=True)
        estado_dist = df_f["state"].value_counts().head(n_top).reset_index()
        estado_dist.columns = ["Estado", "Clientes"]
        fig_estado = px.bar(
            estado_dist.sort_values("Clientes"), x="Clientes", y="Estado",
            orientation="h", color="Clientes", color_continuous_scale="Blues",
            text_auto=True, title=f"Top {n_top} Estados — Clientes"
        )
        fig_estado.update_layout(height=420, plot_bgcolor="white", paper_bgcolor="white",
                                 coloraxis_showscale=False)
        st.plotly_chart(fig_estado, use_container_width=True)

        st.markdown('<div class="section-title">📊 Receita por Gênero × Faixa Etária</div>', unsafe_allow_html=True)
        pivot = (
            df_f.assign(genero_label=df_f["gender"].map(gender_map).fillna("Não Informado"))
            .groupby(["age_group", "genero_label"])["totalamount"]
            .sum()
            .unstack(fill_value=0)
            .reindex([c for c in age_order_cats if c in df_f["age_group"].unique()])
        )
        fig_pivot = go.Figure()
        for i, col in enumerate(pivot.columns):
            fig_pivot.add_trace(go.Bar(
                name=col, x=pivot.index, y=pivot[col],
                marker_color=BLUES[i % len(BLUES)]
            ))
        fig_pivot.update_layout(
            barmode="group", height=380,
            xaxis_title="Faixa Etária", yaxis_title="Receita (R$)",
            plot_bgcolor="white", paper_bgcolor="white",
            legend=dict(orientation="h", y=1.12)
        )
        st.plotly_chart(fig_pivot, use_container_width=True)

        if show_raw:
            st.dataframe(customer_sel.head(300), use_container_width=True)

    with tab3:
        st.markdown('<div class="section-title">🏆 Top Lojas por Receita</div>', unsafe_allow_html=True)
        top_stores = (
            df_f.groupby(["storeid", "store_name"])["totalamount"]
            .sum()
            .sort_values(ascending=False)
            .head(n_top)
            .reset_index()
        )
        top_stores["label"] = top_stores["store_name"].fillna(top_stores["storeid"].astype(str).str[:8])

        fig_stores = px.bar(
            top_stores, x="totalamount", y="label",
            orientation="h", color="totalamount", color_continuous_scale="Blues",
            text_auto=".2s", labels={"totalamount": "Receita (R$)", "label": "Loja"},
            title=f"Top {n_top} Lojas por Receita"
        )
        fig_stores.update_layout(height=420, plot_bgcolor="white", paper_bgcolor="white",
                                 coloraxis_showscale=False, yaxis={"categoryorder": "total ascending"})
        st.plotly_chart(fig_stores, use_container_width=True)

        c1, c2 = st.columns(2)

        with c1:
            st.markdown('<div class="section-title">🎟️ Ticket Médio por Loja</div>', unsafe_allow_html=True)
            ticket_stores = (
                df_f.groupby(["storeid", "store_name"])["totalamount"]
                .mean()
                .sort_values(ascending=False)
                .head(n_top)
                .reset_index()
            )
            ticket_stores["label"] = ticket_stores["store_name"].fillna(ticket_stores["storeid"].astype(str).str[:8])
            fig_ticket = px.bar(
                ticket_stores, x="label", y="totalamount",
                color="totalamount", color_continuous_scale="Blues",
                text_auto=".2s", labels={"totalamount": "Ticket Médio", "label": "Loja"}
            )
            fig_ticket.update_layout(height=340, plot_bgcolor="white", paper_bgcolor="white",
                                     coloraxis_showscale=False, xaxis_tickangle=-30)
            st.plotly_chart(fig_ticket, use_container_width=True)

        with c2:
            st.markdown('<div class="section-title">📦 Volume de Pedidos por Loja</div>', unsafe_allow_html=True)
            vol_stores = (
                df_f.groupby(["storeid", "store_name"])["id"]
                .count()
                .sort_values(ascending=False)
                .head(n_top)
                .reset_index()
            )
            vol_stores.columns = ["storeid", "store_name", "pedidos"]
            vol_stores["label"] = vol_stores["store_name"].fillna(vol_stores["storeid"].astype(str).str[:8])
            fig_vol = px.bar(
                vol_stores, x="label", y="pedidos",
                color="pedidos", color_continuous_scale="Blues",
                text_auto=True, labels={"pedidos": "Pedidos", "label": "Loja"}
            )
            fig_vol.update_layout(height=340, plot_bgcolor="white", paper_bgcolor="white",
                                  coloraxis_showscale=False, xaxis_tickangle=-30)
            st.plotly_chart(fig_vol, use_container_width=True)

        st.markdown('<div class="section-title">📈 Receita vs Volume — Scatter</div>', unsafe_allow_html=True)
        store_summary = (
            df_f.groupby(["storeid", "store_name"])
            .agg(receita=("totalamount", "sum"), pedidos=("id", "count"), ticket=("totalamount", "mean"))
            .reset_index()
        )
        store_summary["label"] = store_summary["store_name"].fillna(store_summary["storeid"].astype(str).str[:8])
        fig_scatter = px.scatter(
            store_summary, x="pedidos", y="receita",
            size="ticket", color="ticket",
            color_continuous_scale="Blues", hover_name="label",
            labels={"pedidos": "Volume de Pedidos", "receita": "Receita Total", "ticket": "Ticket Médio"},
            title="Receita × Volume × Ticket Médio por Loja"
        )
        fig_scatter.update_layout(height=400, plot_bgcolor="white", paper_bgcolor="white")
        st.plotly_chart(fig_scatter, use_container_width=True)

    with tab4:
        c1, c2 = st.columns(2)

        with c1:
            st.markdown('<div class="section-title">📊 Status das Campanhas</div>', unsafe_allow_html=True)
            status_map_c = {1: "Ativa", 2: "Encerrada", 3: "Cancelada", 4: "Agendada", 5: "Pausada", 6: "Erro", 7: "Rascunho"}
            camp_status = campaign_sel["statusend"].map(status_map_c).value_counts().reset_index()
            camp_status.columns = ["Status", "Campanhas"]
            fig_cstatus = px.bar(
                camp_status, x="Status", y="Campanhas",
                color="Campanhas", color_continuous_scale="Blues",
                text_auto=True
            )
            fig_cstatus.update_layout(height=340, plot_bgcolor="white", paper_bgcolor="white",
                                      coloraxis_showscale=False, xaxis_tickangle=-20)
            st.plotly_chart(fig_cstatus, use_container_width=True)

        with c2:
            st.markdown('<div class="section-title">📬 Status de Envio</div>', unsafe_allow_html=True)
            send_status = campaign_perf["status_label"].value_counts().reset_index()
            send_status.columns = ["Status", "Registros"]
            fig_send = px.pie(
                send_status, names="Status", values="Registros",
                color_discrete_sequence=BLUES, hole=0.4
            )
            fig_send.update_layout(height=340, paper_bgcolor="white")
            st.plotly_chart(fig_send, use_container_width=True)

        st.markdown('<div class="section-title">⏱️ Tempo para Envio das Campanhas</div>', unsafe_allow_html=True)
        days_data = campaign_sel["days_to_send"].dropna()
        days_data = days_data[days_data.between(0, 365)]
        fig_days = px.histogram(
            days_data, nbins=50, color_discrete_sequence=["#2563eb"],
            labels={"value": "Dias", "count": "Frequência"},
            title="Distribuição: Dias entre Criação e Envio"
        )
        mean_d = days_data.mean()
        fig_days.add_vline(x=mean_d, line_dash="dash", line_color="red",
                           annotation_text=f"Média {mean_d:.1f}d")
        fig_days.update_layout(height=320, plot_bgcolor="white", paper_bgcolor="white")
        st.plotly_chart(fig_days, use_container_width=True)

        if "totalamount" in campaign_perf.columns:
            st.markdown('<div class="section-title">💰 Receita por Status de Campanha</div>', unsafe_allow_html=True)
            camp_recv = (
                campaign_perf.groupby("status_label")["totalamount"]
                .agg(["sum", "count", "mean"])
                .reset_index()
            )
            camp_recv.columns = ["Status", "Receita Total", "Pedidos", "Ticket Médio"]

            c3, c4 = st.columns(2)
            with c3:
                fig_cr1 = px.bar(
                    camp_recv, x="Status", y="Receita Total",
                    color="Receita Total", color_continuous_scale="Blues",
                    text_auto=".2s"
                )
                fig_cr1.update_layout(height=320, plot_bgcolor="white", paper_bgcolor="white",
                                      coloraxis_showscale=False)
                st.plotly_chart(fig_cr1, use_container_width=True)

            with c4:
                fig_cr2 = px.bar(
                    camp_recv, x="Status", y="Ticket Médio",
                    color="Ticket Médio", color_continuous_scale="Blues",
                    text_auto=".2s"
                )
                fig_cr2.update_layout(height=320, plot_bgcolor="white", paper_bgcolor="white",
                                      coloraxis_showscale=False)
                st.plotly_chart(fig_cr2, use_container_width=True)

        if show_raw:
            st.dataframe(campaign_perf.head(300), use_container_width=True)

    with tab5:
        st.markdown('<div class="section-title">🔍 Mapa de Nulos por Base</div>', unsafe_allow_html=True)

        datasets_eda = {
            "STOREORDER": orders_full,
            "CUSTOMER": customer_sel,
            "CAMPAIGN": campaign_sel,
            "CAMPxORDER": campaign_perf,
        }

        cols_eda = st.columns(2)
        for i, (name, df_eda) in enumerate(datasets_eda.items()):
            null_pct = (df_eda.isna().mean() * 100).reset_index()
            null_pct.columns = ["Coluna", "% Nulos"]
            fig_null = px.bar(
                null_pct, x="% Nulos", y="Coluna",
                orientation="h", color="% Nulos",
                color_continuous_scale=["#93c5fd", "#f97316", "#dc2626"],
                range_color=[0, 100], title=name
            )
            fig_null.update_layout(height=300, plot_bgcolor="white", paper_bgcolor="white",
                                   coloraxis_showscale=False, font_size=11)
            cols_eda[i % 2].plotly_chart(fig_null, use_container_width=True)

        st.markdown('<div class="section-title">📋 Sumário Estatístico</div>', unsafe_allow_html=True)
        tab_a, tab_b = st.tabs(["Pedidos (numérico)", "Clientes (numérico)"])

        with tab_a:
            num_cols_o = [c for c in ["totalamount", "subtotalamount", "discountamount", "avg_ticket"] if c in orders_full.columns]
            if num_cols_o:
                st.dataframe(orders_full[num_cols_o].describe().round(2), use_container_width=True)

        with tab_b:
            num_cols_c = [c for c in ["age"] if c in customer_sel.columns]
            if num_cols_c:
                st.dataframe(customer_sel[num_cols_c].describe().round(2), use_container_width=True)

        st.markdown('<div class="section-title">🗂️ Visualizar Tabelas</div>', unsafe_allow_html=True)
        tab_sel = st.selectbox("Selecione a tabela:", list(datasets_eda.keys()))
        n_rows = st.slider("Número de linhas:", 10, 200, 50)
        st.dataframe(datasets_eda[tab_sel].head(n_rows), use_container_width=True)

        st.download_button(
            "⬇️ Baixar tabela selecionada (CSV)",
            data=datasets_eda[tab_sel].to_csv(index=False).encode("utf-8"),
            file_name=f"{tab_sel.lower()}_processado.csv",
            mime="text/csv"
        )

    st.divider()
    st.markdown("""
    <div style='text-align:center; color:#9ca3af; font-size:0.8rem; padding:1rem;'>
    📊 Dashboard Analítico — Projeto Interdisciplinar de Ciência de Dados &nbsp;|&nbsp;
    Entrega 1: Preparação e Exploração &nbsp;|&nbsp; Powered by Streamlit + Plotly + Supabase
    </div>
    """, unsafe_allow_html=True)

else:
    st.markdown("""
    <div class="alert-box">
    <b>Não foi possível carregar dados suficientes do Supabase.</b><br>
    Verifique se as tabelas existem, possuem dados e se a política RLS permite leitura com a chave usada.
    </div>
    """, unsafe_allow_html=True)