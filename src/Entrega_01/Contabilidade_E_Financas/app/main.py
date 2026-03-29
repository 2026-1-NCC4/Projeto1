from fastapi import FastAPI
import pandas as pd

app = FastAPI()

# 🔹 Carregar dados
df = pd.read_csv("./app/data/STOREORDER.csv")

# 🔹 Converter data
df["createdat"] = pd.to_datetime(df["createdat"], format="ISO8601")


@app.get("/")
async def root():

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
