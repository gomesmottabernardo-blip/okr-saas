"""
Servidor de API do Dashboard de OKRs - Funil Faixa Preta
Dados mockados com estrutura idêntica ao projeto real (okrMetrics.ts)
"""

import secrets
from fastapi import FastAPI, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware

# ─── Configuração ────────────────────────────────────────────────────────────

API_KEY = "okr-ffp-2026-secret-key"   # Chave fixa para facilitar a configuração
API_KEY_NAME = "X-API-Key"

app = FastAPI(
    title="API Dashboard OKRs - Funil Faixa Preta",
    description="API para consulta de métricas de OKRs. Conecta-se ao GPT Builder via schema OpenAPI.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="API Key inválida ou ausente.")
    return api_key

# ─── Dados Mockados (estrutura idêntica ao okrMetrics.ts) ────────────────────

MOCK_METRICS = {
    "metricas_gerais": {
        "total_acoes": 39,
        "total_objetivos": 4,
        "total_concluidas": 18,
        "total_em_andamento": 10,
        "total_em_risco": 5,
        "total_nao_iniciadas": 6,
        "taxa_atingimento_geral": 59.0
    },
    "por_objetivo": {
        "Aumentar receita recorrente": {
            "percentual": 72.5,
            "total": 12,
            "concluidas": 7,
            "em_andamento": 3,
            "nao_iniciadas": 1,
            "em_risco": 1
        },
        "Expandir base de clientes": {
            "percentual": 55.0,
            "total": 10,
            "concluidas": 4,
            "em_andamento": 3,
            "nao_iniciadas": 2,
            "em_risco": 1
        },
        "Melhorar retenção e NPS": {
            "percentual": 45.0,
            "total": 9,
            "concluidas": 3,
            "em_andamento": 3,
            "nao_iniciadas": 2,
            "em_risco": 1
        },
        "Estruturar processos internos": {
            "percentual": 37.5,
            "total": 8,
            "concluidas": 4,
            "em_andamento": 1,
            "nao_iniciadas": 1,
            "em_risco": 2
        }
    },
    "por_owner": {
        "Gabriel": {
            "total": 15,
            "concluidas": 8,
            "em_andamento": 4,
            "nao_iniciadas": 2,
            "em_risco": 1
        },
        "Soares": {
            "total": 14,
            "concluidas": 6,
            "em_andamento": 4,
            "nao_iniciadas": 2,
            "em_risco": 2
        },
        "Inteligência de Mercado": {
            "total": 10,
            "concluidas": 4,
            "em_andamento": 2,
            "nao_iniciadas": 2,
            "em_risco": 2
        }
    },
    "por_key_result": {
        "kr-001": {
            "nome": "Atingir R$ 150k MRR",
            "objetivo": "Aumentar receita recorrente",
            "percentual": 80.0,
            "total": 5,
            "concluidas": 3,
            "em_andamento": 2,
            "nao_iniciadas": 0,
            "em_risco": 0
        },
        "kr-002": {
            "nome": "Fechar 20 novos contratos",
            "objetivo": "Expandir base de clientes",
            "percentual": 60.0,
            "total": 6,
            "concluidas": 2,
            "em_andamento": 3,
            "nao_iniciadas": 1,
            "em_risco": 0
        },
        "kr-003": {
            "nome": "Reduzir churn para abaixo de 3%",
            "objetivo": "Melhorar retenção e NPS",
            "percentual": 40.0,
            "total": 5,
            "concluidas": 1,
            "em_andamento": 2,
            "nao_iniciadas": 1,
            "em_risco": 1
        },
        "kr-004": {
            "nome": "Documentar 100% dos processos de onboarding",
            "objetivo": "Estruturar processos internos",
            "percentual": 30.0,
            "total": 4,
            "concluidas": 1,
            "em_andamento": 0,
            "nao_iniciadas": 1,
            "em_risco": 2
        }
    }
}

# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "status": "online",
        "projeto": "Dashboard OKRs - Funil Faixa Preta",
        "versao": "1.0.0",
        "endpoints": ["/metrics", "/metrics/objetivos", "/metrics/owners", "/metrics/key-results"]
    }

@app.get("/metrics")
def get_all_metrics(api_key: str = Security(verify_api_key)):
    """Retorna todas as métricas do dashboard de OKRs."""
    return MOCK_METRICS

@app.get("/metrics/objetivos")
def get_metrics_by_objetivo(api_key: str = Security(verify_api_key)):
    """Retorna métricas agrupadas por Objetivo estratégico."""
    result = []
    for nome, dados in MOCK_METRICS["por_objetivo"].items():
        result.append({
            "objetivo": nome,
            **dados
        })
    result.sort(key=lambda x: x["percentual"], reverse=True)
    return {"objetivos": result}

@app.get("/metrics/owners")
def get_metrics_by_owner(api_key: str = Security(verify_api_key)):
    """Retorna métricas agrupadas por Owner (responsável)."""
    result = []
    for owner, dados in MOCK_METRICS["por_owner"].items():
        taxa = round((dados["concluidas"] + dados["em_andamento"] * 0.5) / dados["total"] * 100, 1) if dados["total"] > 0 else 0
        result.append({
            "owner": owner,
            "taxa_atingimento": taxa,
            **dados
        })
    return {"owners": result}

@app.get("/metrics/key-results")
def get_metrics_by_kr(api_key: str = Security(verify_api_key)):
    """Retorna métricas agrupadas por Key Result."""
    result = []
    for kr_id, dados in MOCK_METRICS["por_key_result"].items():
        result.append({
            "id": kr_id,
            **dados
        })
    result.sort(key=lambda x: x["percentual"], reverse=True)
    return {"key_results": result}

@app.get("/metrics/gerais")
def get_metricas_gerais(api_key: str = Security(verify_api_key)):
    """Retorna apenas as métricas gerais do dashboard."""
    return MOCK_METRICS["metricas_gerais"]

# ─── Inicialização ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    print(f"\n{'='*50}")
    print(f"  API Key: {API_KEY}")
    print(f"  Header:  X-API-Key")
    print(f"{'='*50}\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
