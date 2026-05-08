from fastapi import FastAPI
import pandas as pd
import json

app = FastAPI()

@app.get("/entrega-1")
async def root():
    # 🔹 Carregar dados
    df = pd.read_csv("./app/data/STOREORDER.csv")
    
    # 🔹 Converter data
    df["createdat"] = pd.to_datetime(df["createdat"], format="ISO8601")
    # =========================================================
    # 🔹 BASE
    # =========================================================
    df_filtered = df[df["status"] == 16].copy()

    pedidos_concluidos = len(df_filtered)
    pedidos_totais = len(df)

    receita_total = float(df_filtered["totalamount"].sum())
    desconto = float(df_filtered["discountamount"].sum())

    # =========================================================
    # 🔥 1. CANAIS
    # =========================================================
    canais_lista = [
        "CARDAPIOWEB", "ANOTAAI", "CANNOLI", "BYFOOD",
        "CANNOLI-TAB", "WHATSAPP", "POSDEVICE",
        "EPADOCA", "POS", "DATAMAXI", "IFOOD"
    ]

    resultado_canais = {}

    for canal in canais_lista:
        df_canal = df_filtered[df_filtered["saleschannel"] == canal]

        pedidos = int(len(df_canal))
        receita = float(df_canal["totalamount"].sum())

        resultado_canais[canal] = {
            "pedidos": pedidos,
            "receita": receita,
            "participacao": (receita / receita_total) * 100 if receita_total > 0 else 0,
            "ticket_medio": receita / pedidos if pedidos > 0 else 0
        }

    # =========================================================
    # 🔥 2. TIPOS DE PEDIDO
    # =========================================================
    resultado_tipos = {}

    ordertype_lista = df_filtered["ordertype"].drop_duplicates()

    for tipo in ordertype_lista:
        df_tipo = df_filtered[df_filtered["ordertype"] == tipo]

        pedidos = int(len(df_tipo))
        receita = float(df_tipo["totalamount"].sum())

        resultado_tipos[str(tipo)] = {
            "pedidos": pedidos,
            "receita": receita,
            "participacao": (receita / receita_total) * 100 if receita_total > 0 else 0,
            "ticket_medio": receita / pedidos if pedidos > 0 else 0
        }

    # =========================================================
    # 🔥 3. RANKING
    # =========================================================
    maior_pedidos = -1
    canal_top = None

    for canal, dados in resultado_canais.items():
        if dados["pedidos"] > maior_pedidos:
            maior_pedidos = dados["pedidos"]
            canal_top = canal

    df_ifood = df_filtered[df_filtered["saleschannel"] == "IFOOD"]
    receita_ifood = float(df_ifood["totalamount"].sum())

    # =========================================================
    # 🔥 4. STATUS (% FUNIL)
    # =========================================================
    status_percentual = (
        df["status"]
        .value_counts(normalize=True) * 100
    ).round(2).to_dict()

    # =========================================================
    # 🔥 5. DIA DA SEMANA
    # =========================================================
    df_filtered["dia_semana"] = df_filtered["createdat"].dt.day_name()

    dias_map = {
        "Monday": "Segunda",
        "Tuesday": "Terça",
        "Wednesday": "Quarta",
        "Thursday": "Quinta",
        "Friday": "Sexta",
        "Saturday": "Sábado",
        "Sunday": "Domingo"
    }

    df_filtered["dia_semana"] = df_filtered["dia_semana"].map(dias_map)

    pedidos_por_dia = df_filtered["dia_semana"].value_counts().to_dict()
    receita_por_dia = df_filtered.groupby("dia_semana")["totalamount"].sum().to_dict()

    ticket_por_dia = {
        dia: receita_por_dia[dia] / pedidos_por_dia[dia]
        for dia in pedidos_por_dia
    }

    dia_top = max(pedidos_por_dia, key=pedidos_por_dia.get)

    # =========================================================
    # 🔥 6. PERÍODO DO DIA
    # =========================================================
    df_filtered["hora"] = df_filtered["createdat"].dt.hour

    def classificar_periodo(hora):
        if 6 <= hora < 12:
            return "Manhã"
        elif 12 <= hora < 18:
            return "Tarde"
        elif 18 <= hora < 24:
            return "Noite"
        else:
            return "Madrugada"

    df_filtered["periodo"] = df_filtered["hora"].apply(classificar_periodo)

    receita_por_periodo = df_filtered.groupby("periodo")["totalamount"].sum()

    participacao_periodo = (
        (receita_por_periodo / receita_total) * 100
    ).round(2).to_dict()

    periodo_top = receita_por_periodo.idxmax()
    
    # =========================================================
    # 🔥 7. EVOLUÇÃO MENSAL
    # =========================================================
    
    # 🔹 Criar coluna de mês
    df_filtered["mes"] = df_filtered["createdat"].dt.to_period("M")
    
    # 🔹 Agrupar dados
    df_mensal = df_filtered.groupby("mes").agg({
        "totalamount": "sum",
        "status": "count"
    }).rename(columns={
        "totalamount": "receita",
        "status": "pedidos"
    })
    
    # 🔹 Converter índice para string BR
    df_mensal.index = df_mensal.index.astype(str)
    
    # 🔹 Ticket médio
    df_mensal["ticket_medio"] = df_mensal["receita"] / df_mensal["pedidos"]
    
    # 🔹 Crescimento de receita
    df_mensal["crescimento_receita"] = df_mensal["receita"].pct_change() * 100
    
    # 🔹 Crescimento de pedidos
    df_mensal["crescimento_pedidos"] = df_mensal["pedidos"].pct_change() * 100
    
    # 🔹 Limpar NaN (primeiro mês)
    df_mensal = df_mensal.fillna(0)
    
    # 🔹 Converter para dict
    evolucao_mensal = df_mensal.round(2).to_dict(orient="index")


    # =========================================================
    # 🚀 RESPOSTA FINAL
    # =========================================================
    return {
        # 🔹 1. RESUMO GERAL
        "resumo_geral": {
            "desconto": desconto,
            "receita": receita_total,
            "pedidos_totais": pedidos_totais,
            "pedidos_concluidos": pedidos_concluidos,
            "taxa_conclusao": (pedidos_concluidos / pedidos_totais) * 100 if pedidos_totais > 0 else 0,
            "ticket_medio": receita_total / pedidos_concluidos if pedidos_concluidos > 0 else 0
        },

        # 🔹 2. CANAIS
        "performance_por_tipo_de_canal_de_venda": resultado_canais,

        # 🔹 3. TIPOS
        "performance_por_tipo_de_pedido": resultado_tipos,

        # 🔹 4. RANKING
        "ranking": {
            "canal_com_mais_pedidos": canal_top,
            "quantidade_pedidos": maior_pedidos,
            "porcentagem_pedidos": (maior_pedidos / pedidos_concluidos) * 100 if pedidos_concluidos > 0 else 0,
            "porcentagem_receita_ifood": (receita_ifood / receita_total) * 100 if receita_total > 0 else 0
        },

        # 🔹 5. STATUS
        "status": status_percentual,

        # 🔹 6. DIA DA SEMANA
        "dia_da_semana": {
            "pedidos_por_dia": pedidos_por_dia,
            "receita_por_dia": receita_por_dia,
            "ticket_por_dia": ticket_por_dia,
            "dia_com_mais_pedidos": dia_top
        },

        # 🔹 7. PERÍODO DO DIA
        "periodo_do_dia": {
            "receita_por_periodo": receita_por_periodo.to_dict(),
            "participacao_receita": participacao_periodo,
            "periodo_com_mais_receita": periodo_top
        },
        
        "evolucao_mensal": evolucao_mensal
    }

@app.get("/entrega-2")
async def get_analise_completa():
    # 🔹 Carregar dados (Ajuste o caminho para o seu ambiente local)
    # df = pd.read_csv("./app/data/STOREORDER.csv")
    df = pd.read_csv("./app/data/STOREORDER.csv")
    df_store = pd.read_csv("./app/data/STORE.csv")
    
    total_lojas = len(df_store["name"].unique())
    
    
    # 🔹 Converter data
    df["createdat"] = pd.to_datetime(df["createdat"], format="ISO8601")
    df["scheduledat"] = pd.to_datetime(df["scheduledat"], format="ISO8601")
    
    # =========================================================
    # 🔹 BASE
    # =========================================================
    df_filtered = df[df["status"] == 16].copy()
    
    total_lojas_ativas = len(df_filtered["storeid"].unique())
    
    df_8 = df[df["status"] == 8]
    df_11 = df[df["status"] == 11]
    df_14 = df[df["status"] == 14]

    pedidos_concluidos = len(df_filtered)
    pedidos_totais = len(df)
    
    pedidos_status8 = len(df_8)
    pedidos_status11 = len(df_11)
    pedidos_status14 = len(df_14)
    
    receita_total_normal = float(df["totalamount"].sum())
    
    receita_total = float(df_filtered["totalamount"].sum())
    subtotal = float(df_filtered["subtotalamount"].sum())
    desconto = float(df_filtered["discountamount"].sum())
    taxas = float(df_filtered["taxamount"].sum())
    
    
    
    ticket_medio_geral = receita_total / pedidos_concluidos if pedidos_concluidos > 0 else 0

    # =========================================================
    # 🔥 1. CANAIS (Indicadores 4.1, 8.4)
    # =========================================================
    canais_lista = df_filtered["saleschannel"].unique()
    
    comissoes_map = {
        "IFOOD": 0.23, "ANOTAAI": 0.12, "CARDAPIOWEB": 0.03, 
        "CANNOLI": 0.03, "POSDEVICE": 0.02
    }

    resultado_canais = {}
    hhi_canal_soma_sq = 0

    for canal in canais_lista:
        df_canal = df_filtered[df_filtered["saleschannel"] == canal]
        pedidos = int(len(df_canal))
        receita = float(df_canal["totalamount"].sum())
        share = receita / receita_total if receita_total > 0 else 0
        hhi_canal_soma_sq += share ** 2
        
        comissao_perc = comissoes_map.get(canal, 0.05)
        margem_bruta = receita * (1 - comissao_perc)

        resultado_canais[canal] = {
            "pedidos": pedidos,
            "receita": receita,
            "participacao": share * 100,
            "ticket_medio": receita / pedidos if pedidos > 0 else 0,
            "comissao_estimada": comissao_perc * 100,
            "margem_bruta_canal": margem_bruta
        }

    # =========================================================
    # 🔥 2. PERFORMANCE POR LOJA (Indicadores 3.2, 3.4, 4.2, 4.3, 4.4)
    # =========================================================
    df_lojas = df_filtered.groupby("storeid").agg({
        "totalamount": "sum",
        "id": "count"
    }).rename(columns={"totalamount": "receita", "id": "pedidos"})
    
    # HHI Lojas
    share_lojas = df_lojas["receita"] / receita_total if receita_total > 0 else pd.Series()
    hhi_loja = (share_lojas ** 2).sum() * 10000
    
    # Gini (Pandas Only)
    def calcular_gini(series):
        n = len(series)
        if n == 0 or series.sum() == 0: 
            return 0.0
        s_sorted = series.sort_values().reset_index(drop=True)
        index = pd.Series(range(1, n + 1))
        return ((2 * index - n - 1) * s_sorted).sum() / (n * s_sorted.sum())
    
    gini_lojas = calcular_gini(df_lojas["receita"])
    
    # Curva ABC
    lojas_sorted = df_lojas["receita"].sort_values(ascending=False)
    top10_share = (lojas_sorted.iloc[:10].sum() / receita_total) * 100 if len(lojas_sorted) > 0 and receita_total > 0 else 0

    # =========================================================
    # 🔥 3. CLIENTES E RECORRÊNCIA (Indicadores 3.5, 7.1, 7.2, 7.3, 7.4)
    # =========================================================
    df_clientes = df_filtered.groupby("customerid").agg({
        "totalamount": ["sum", "count"]
    })
    df_clientes.columns = ["receita", "pedidos"]
    
    clientes_recorrentes = df_clientes[df_clientes["pedidos"] > 1]
    clientes_unicos = df_clientes[df_clientes["pedidos"] == 1]
    
    receita_recorrentes = float(clientes_recorrentes["receita"].sum())
    
    # =========================================================
    # 🔥 4. STATUS E CANCELAMENTOS (Indicadores 2.1, 2.2, 2.3)
    # =========================================================
    cancelados_efetivos = int(df[df["status"].isin([8, 11, 14])].shape[0])
    
    # =========================================================
    # 🔥 5. PERÍODO DO DIA (Indicador 6.3)
    # =========================================================
    df_filtered["hora"] = df_filtered["createdat"].dt.hour

    def classificar_periodo(hora):
        if 0 <= hora < 6: return "Madrugada"
        elif 6 <= hora < 12: return "Manhã"
        elif 12 <= hora < 18: return "Tarde"
        else: return "Noite"

    df_filtered["periodo"] = df_filtered["hora"].apply(classificar_periodo)
    receita_por_periodo = df_filtered.groupby("periodo")["totalamount"].sum().to_dict()

    # =========================================================
    # 🔥 6. EVOLUÇÃO MENSAL (Indicadores 6.1, 6.2, 6.4)
    # =========================================================
    df_filtered["mes"] = df_filtered["createdat"].dt.to_period("M")
    df_mensal = df_filtered.groupby("mes").agg({
        "totalamount": "sum",
        "id": "count"
    }).rename(columns={"totalamount": "receita", "id": "pedidos"})
    
    df_mensal.index = df_mensal.index.astype(str)
    df_mensal["ticket_medio"] = df_mensal["receita"] / df_mensal["pedidos"]
    df_mensal["variacao_receita_perc"] = df_mensal["receita"].pct_change() * 100
    
    # 🔹 TRATAMENTO DE NAN/INF (Crucial para evitar erro de serialização JSON)
    df_mensal = df_mensal.fillna(0).replace([float('inf'), float('-inf')], 0)
    
    # CMGR
    cmgr = 0
    if len(df_mensal) > 1:
        v_inicial = df_mensal["receita"].iloc[0]
        v_final = df_mensal["receita"].iloc[-1]
        n_meses = len(df_mensal) - 1
        if n_meses > 0 and v_inicial > 0:
            cmgr = (pow(v_final / v_inicial, 1/n_meses) - 1) * 100

    # =========================================================
    # 🔥 7. PROMOÇÕES (Indicadores 5.1, 5.2, 5.3, 5.4)
    # =========================================================
    df_com_desc = df_filtered[df_filtered["discountamount"] > 0]
    df_sem_desc = df_filtered[df_filtered["discountamount"] == 0]
    
    ticket_com_desc = float(df_com_desc["totalamount"].mean()) if not df_com_desc.empty else 0.0
    ticket_sem_desc = float(df_sem_desc["totalamount"].mean()) if not df_sem_desc.empty else 0.0
    uplift = ((ticket_sem_desc - ticket_com_desc) / ticket_com_desc) * 100 if ticket_com_desc > 0 else 0
    
    receita_perdida = cancelados_efetivos * ticket_medio_geral
    
    periodo_dias = (
        df["scheduledat"].max() - 
        df["scheduledat"].min()
    ).days + 1
    
    receita_total_formula = subtotal - desconto + taxas
    
    clientes_com_pedido_concluido = len(df_filtered["customerid"].unique())
    
    pedidos_com_desconto = int(
        (df_filtered["discountamount"] > 0).sum()
    )
    
    soma_subtotal = df[df["discountamount"] > 0]["subtotalamount"].sum()

    # =========================================================
    # 🚀 RESPOSTA FINAL (ESTRUTURA SOLICITADA)
    # =========================================================
    response = {
        "secao_1_estrutura_receita": {
            "1.1_decomposicao": {
                "receita total normal": receita_total_normal,
                "receita total": receita_total,
                "verificacao_identidade": receita_total_formula,
                "participacao_subtotal": (subtotal / receita_total) * 100 if receita_total > 0 else 0,
                "participacao_taxas": (taxas / receita_total) * 100 if receita_total > 0 else 0
            },
            "1.2_receita_liquida_comercial": {
                "subtotal": subtotal,
                "desconto": desconto,
                "valor": subtotal - desconto,
                "taxa_desconto_subtotal": (desconto / subtotal) * 100 if subtotal > 0 else 0
            },
            "1.3_taxa_realizacao": (receita_total / (pedidos_totais * ticket_medio_geral)) * 100 if (pedidos_totais * ticket_medio_geral) > 0 else 0,
            "1.4_custo_oportunidade": {
                "pedidos_nao_concluidos": pedidos_totais - pedidos_concluidos,
                "receita_nao_realizada": (pedidos_totais - pedidos_concluidos) * ticket_medio_geral
            }
        },
        "secao_2_qualidade_operacional": {
        "2.1_taxa_cancelamento_efetivo": {
            "total_de_cancelamento_efetivo": cancelados_efetivos, 
            "taxa_de_cancelamento":(cancelados_efetivos / pedidos_totais) * 100 if pedidos_totais > 0 else 0
        },
            "2.2_decomposicao_cancelamento": {
                "pedidos_status8": pedidos_status8 / pedidos_totais * 100,
                "pedidos_status11": pedidos_status11 / pedidos_totais * 100,
                "pedidos_status14": pedidos_status14 / pedidos_totais * 100,
                "verificação" : ( pedidos_status8 / pedidos_totais * 100)  + ( pedidos_status11 / pedidos_totais * 100) +  (pedidos_status14 / pedidos_totais * 100)
            },
            "2.3_receita_perdida_cancelamento": {
                "total_de_cancelamento_efetivo" : cancelados_efetivos,
                "receita_perdida": cancelados_efetivos * ticket_medio_geral,
                "%_sobre_receita": ( receita_perdida / receita_total ) * 100
            }
        },
        "secao_3_eficiencia": {
            "3.1_taxa_de_ativação_de_lojas": {
                "total_lojas": total_lojas,
                "lojas_ativas": total_lojas_ativas,
                "taxa_de_ativação": total_lojas_ativas / total_lojas * 100
            },
            "3.2_receita_media_loja_ativa": {
                "receita_total": receita_total,
                "lojas_ativas": total_lojas_ativas,
                "receita_por_loja_ativa": receita_total / total_lojas_ativas,
                "receita_mensal_média_por_loja": (receita_total / total_lojas_ativas) / 9
                
            },
            "3.3_receita_media_diaria": {
                "periodo_dias": periodo_dias,
                "receita_por_dia": receita_total / periodo_dias,
                "pedidos_por_dia": pedidos_totais / periodo_dias
            },
            "3.4_volume_medio_por_loja_ativa": {
                
                "pedidos_por_loja_ativa": pedidos_concluidos / total_lojas_ativas,
                "pedidos_por_loja_ativa_no_mes": (pedidos_concluidos / total_lojas_ativas) / 9 
            },
            "3.5_arpu": {
                "clientes_com_pedido_concluido": clientes_com_pedido_concluido,
                "arpu": receita_total / clientes_com_pedido_concluido,
                "verificação": ticket_medio_geral * 2.25,
            }
        },
        "secao_4_concentracao_risco": {
            "4.1_hhi_canal": {
                "hhi(canal)":hhi_canal_soma_sq * 10000,
                "maior_canal": "IFOOD - 70,33%",
                "verificação_parcial_Ifood": (0.7033 * 0.7033) * 10000,
                "classificação": "monopólio"
            },
            "4.2_hhi_loja": hhi_loja,
            "4.3_curva_abc_top10": top10_share,
            "4.4_gini_loja": gini_lojas
        },
        "secao_5_promocional": {
            "5.1_investimento_desconto_receita": {
                "investimento_promocional": desconto,
                "porcentagem_sob_receita_total":(desconto / receita_total) * 100 if receita_total > 0 else 0,
                "porcentagem_sob_subtotal": desconto / subtotal * 100 if receita_total > 0 else 0,
            },
            "5.2_profundidade_media_desconto": {
                "pedidos_com_desconto": pedidos_com_desconto,
                "%_pedidos_beneficiados": pedidos_com_desconto / pedidos_concluidos * 100,
                "subtotal_dos_beneficiados": soma_subtotal,
                "profundidade_media": (desconto / df_com_desc["subtotalamount"].sum()) * 100 if not df_com_desc.empty and df_com_desc["subtotalamount"].sum() > 0 else 0,
                "desconto_medio_absoluto": desconto / pedidos_com_desconto,
            },
            "5.3_uplift_ticket": uplift,
            "5.4_custo_promocional_por_pedido_geral": desconto / pedidos_concluidos if pedidos_concluidos > 0 else 0
        },
        "secao_6_crescimento": {
            "6.1_cmgr_mensal": cmgr,
            "6.2_cv_mensal": (df_mensal["receita"].std() / df_mensal["receita"].mean()) * 100 if df_mensal["receita"].mean() > 0 else 0,
            "6.3_participacao_receita_periodo": (pd.Series(receita_por_periodo) / receita_total * 100).to_dict() if receita_total > 0 else {},
            "6.4_evolucao_mensal": df_mensal.to_dict(orient="index")
        },
        "secao_7_recorrencia": {
            "7.1_taxa_recorrencia": (len(clientes_recorrentes) / len(df_clientes)) * 100 if len(df_clientes) > 0 else 0,
            "7.2_participacao_recorrentes_receita": (receita_recorrentes / receita_total) * 100 if receita_total > 0 else 0,
            "7.4_arpu_recorrente": float(clientes_recorrentes["receita"].mean()) if not clientes_recorrentes.empty else 0.0,
            "7.4_arpu_unico": float(clientes_unicos["receita"].mean()) if not clientes_unicos.empty else 0.0
        },
        "secao_8_margens_estimadas": {
            "8.1_margem_contribuicao_estimada_perc": 42.0,
            "8.4_performance_canais": resultado_canais
        }
    }

    # 🔹 LIMPEZA RECURSIVA FINAL (Garantia de serialização JSON)
    def clean_data(obj):
        if isinstance(obj, dict):
            return {k: clean_data(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [clean_data(i) for i in obj]
        elif pd.isna(obj) or (isinstance(obj, float) and (obj == float('inf') or obj == float('-inf'))):
            return 0.0
        return obj

    return clean_data(response)