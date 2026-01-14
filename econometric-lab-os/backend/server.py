from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import pandas as pd
import numpy as np
import statsmodels.api as sm
from statsmodels.formula.api import ols
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.vector_ar.var_model import VAR
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
from scipy import stats
import json
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image as RLImage, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import tempfile

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

class AnalysisMetadata(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    rows: int
    columns: List[str]
    suggested_model: str
    model_reasoning: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AnalysisRequest(BaseModel):
    analysis_id: str
    model_type: str
    dependent_var: str
    independent_vars: List[str]
    entity_var: Optional[str] = None
    time_var: Optional[str] = None
    arima_order: Optional[List[int]] = None

class AnalysisResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    analysis_id: str
    model_type: str
    summary: Dict[str, Any]
    coefficients: List[Dict[str, Any]]
    statistics: Dict[str, Any]
    charts: Dict[str, str]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

def detect_model_type(df: pd.DataFrame) -> tuple[str, str]:
    """Detect appropriate econometric model based on data structure"""
    n_cols = len(df.columns)
    n_rows = len(df.shape)
    
    has_datetime = any(df[col].dtype in ['datetime64[ns]', 'object'] and 
                      pd.api.types.is_datetime64_any_dtype(pd.to_datetime(df[col], errors='coerce'))
                      for col in df.columns)
    
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    
    if len(numeric_cols) >= 3 and has_datetime:
        if any('id' in col.lower() or 'entity' in col.lower() or 'group' in col.lower() 
               for col in df.columns):
            return "panel", "Dados apresentam estrutura de painel com entidades e séries temporais"
        return "timeseries", "Dados temporais detectados - adequado para ARIMA ou VAR"
    
    if len(numeric_cols) >= 2:
        return "linear", "Dados cross-section com múltiplas variáveis - adequado para regressão linear"
    
    return "linear", "Modelo de regressão linear recomendado como padrão"

def create_residual_plots(model, fitted_values, residuals):
    """Create diagnostic plots for regression models"""
    charts = {}
    
    fig, axes = plt.subplots(2, 2, figsize=(12, 10))
    fig.patch.set_facecolor('white')
    
    axes[0, 0].scatter(fitted_values, residuals, alpha=0.6, edgecolors='k', s=40)
    axes[0, 0].axhline(y=0, color='r', linestyle='--', linewidth=2)
    axes[0, 0].set_xlabel('Valores Ajustados', fontsize=10)
    axes[0, 0].set_ylabel('Resíduos', fontsize=10)
    axes[0, 0].set_title('Resíduos vs Valores Ajustados', fontsize=12, fontweight='bold')
    axes[0, 0].grid(True, alpha=0.3)
    
    stats.probplot(residuals, dist="norm", plot=axes[0, 1])
    axes[0, 1].set_title('Q-Q Plot', fontsize=12, fontweight='bold')
    axes[0, 1].grid(True, alpha=0.3)
    
    axes[1, 0].hist(residuals, bins=30, edgecolor='black', alpha=0.7)
    axes[1, 0].set_xlabel('Resíduos', fontsize=10)
    axes[1, 0].set_ylabel('Frequência', fontsize=10)
    axes[1, 0].set_title('Histograma dos Resíduos', fontsize=12, fontweight='bold')
    axes[1, 0].grid(True, alpha=0.3, axis='y')
    
    standardized_residuals = residuals / np.std(residuals)
    axes[1, 1].scatter(fitted_values, np.sqrt(np.abs(standardized_residuals)), alpha=0.6, edgecolors='k', s=40)
    axes[1, 1].set_xlabel('Valores Ajustados', fontsize=10)
    axes[1, 1].set_ylabel('√|Resíduos Padronizados|', fontsize=10)
    axes[1, 1].set_title('Scale-Location', fontsize=12, fontweight='bold')
    axes[1, 1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight', facecolor='white')
    buf.seek(0)
    charts['diagnostics'] = base64.b64encode(buf.read()).decode('utf-8')
    plt.close()
    
    return charts

def run_linear_regression(df: pd.DataFrame, dependent_var: str, independent_vars: List[str]):
    """Run OLS regression"""
    X = df[independent_vars]
    y = df[dependent_var]
    X = sm.add_constant(X)
    
    model = sm.OLS(y, X).fit()
    
    coefficients = []
    for var in ['const'] + independent_vars:
        coefficients.append({
            'variable': var,
            'coefficient': float(model.params[var]),
            'std_error': float(model.bse[var]),
            't_statistic': float(model.tvalues[var]),
            'p_value': float(model.pvalues[var])
        })
    
    statistics = {
        'r_squared': float(model.rsquared),
        'adj_r_squared': float(model.rsquared_adj),
        'f_statistic': float(model.fvalue),
        'f_pvalue': float(model.f_pvalue),
        'aic': float(model.aic),
        'bic': float(model.bic),
        'observations': int(model.nobs)
    }
    
    charts = create_residual_plots(model, model.fittedvalues, model.resid)
    
    return {
        'coefficients': coefficients,
        'statistics': statistics,
        'charts': charts,
        'summary': str(model.summary())
    }

def run_panel_regression(df: pd.DataFrame, dependent_var: str, independent_vars: List[str], 
                        entity_var: str, time_var: str, effect_type: str = 'fixed'):
    """Run panel data regression (Fixed or Random Effects)"""
    from statsmodels.regression.linear_model import PanelOLS
    
    df_panel = df.copy()
    df_panel = df_panel.set_index([entity_var, time_var])
    
    formula = f"{dependent_var} ~ {' + '.join(independent_vars)} + EntityEffects"
    
    if effect_type == 'fixed':
        model = PanelOLS.from_formula(formula, data=df_panel).fit(cov_type='clustered', cluster_entity=True)
    else:
        model = PanelOLS.from_formula(formula, data=df_panel).fit()
    
    coefficients = []
    for var in model.params.index:
        if var != 'Intercept':
            coefficients.append({
                'variable': var,
                'coefficient': float(model.params[var]),
                'std_error': float(model.std_errors[var]),
                't_statistic': float(model.tstats[var]),
                'p_value': float(model.pvalues[var])
            })
    
    statistics = {
        'r_squared': float(model.rsquared),
        'observations': int(model.nobs),
        'effect_type': effect_type
    }
    
    residuals = model.resid
    fitted = model.fitted_values
    charts = create_residual_plots(model, fitted, residuals)
    
    return {
        'coefficients': coefficients,
        'statistics': statistics,
        'charts': charts,
        'summary': str(model.summary)
    }

def run_arima_model(df: pd.DataFrame, dependent_var: str, time_var: str, order: tuple = (1, 1, 1)):
    """Run ARIMA time series model"""
    df_ts = df.sort_values(time_var)
    y = df_ts[dependent_var]
    
    model = ARIMA(y, order=order).fit()
    
    statistics = {
        'aic': float(model.aic),
        'bic': float(model.bic),
        'observations': int(len(y)),
        'order': list(order)
    }
    
    fig, axes = plt.subplots(2, 1, figsize=(12, 8))
    fig.patch.set_facecolor('white')
    
    axes[0].plot(y.values, label='Original', linewidth=2)
    axes[0].plot(model.fittedvalues.values, label='Ajustado', linewidth=2, linestyle='--')
    axes[0].set_title('Série Temporal - Original vs Ajustado', fontsize=12, fontweight='bold')
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)
    
    residuals = model.resid
    axes[1].plot(residuals.values, linewidth=2)
    axes[1].axhline(y=0, color='r', linestyle='--', linewidth=2)
    axes[1].set_title('Resíduos do Modelo ARIMA', fontsize=12, fontweight='bold')
    axes[1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight', facecolor='white')
    buf.seek(0)
    charts = {'timeseries': base64.b64encode(buf.read()).decode('utf-8')}
    plt.close()
    
    coefficients = []
    for i, param in enumerate(model.params):
        coefficients.append({
            'variable': f'param_{i}',
            'coefficient': float(param),
            'std_error': 0.0,
            't_statistic': 0.0,
            'p_value': 0.0
        })
    
    return {
        'coefficients': coefficients,
        'statistics': statistics,
        'charts': charts,
        'summary': str(model.summary())
    }

@api_router.post("/upload-csv", response_model=AnalysisMetadata)
async def upload_csv(file: UploadFile = File(...)):
    """Upload CSV file and detect model type"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Apenas arquivos CSV são suportados")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        analysis_id = str(uuid.uuid4())
        
        suggested_model, reasoning = detect_model_type(df)
        
        metadata = AnalysisMetadata(
            id=analysis_id,
            filename=file.filename,
            rows=len(df),
            columns=df.columns.tolist(),
            suggested_model=suggested_model,
            model_reasoning=reasoning
        )
        
        csv_data = df.to_json(orient='records')
        doc = metadata.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        doc['data'] = csv_data
        
        await db.analyses.insert_one(doc)
        
        return metadata
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar arquivo: {str(e)}")

@api_router.get("/analysis/{analysis_id}")
async def get_analysis_data(analysis_id: str):
    """Get analysis metadata and data preview"""
    analysis = await db.analyses.find_one({"id": analysis_id}, {"_id": 0})
    if not analysis:
        raise HTTPException(status_code=404, detail="Análise não encontrada")
    
    data = json.loads(analysis['data'])
    preview = data[:100] if len(data) > 100 else data
    
    return {
        'metadata': {
            'id': analysis['id'],
            'filename': analysis['filename'],
            'rows': analysis['rows'],
            'columns': analysis['columns'],
            'suggested_model': analysis['suggested_model'],
            'model_reasoning': analysis['model_reasoning']
        },
        'preview': preview
    }

@api_router.post("/analyze")
async def run_analysis(request: AnalysisRequest):
    """Run econometric analysis"""
    analysis = await db.analyses.find_one({"id": request.analysis_id}, {"_id": 0})
    if not analysis:
        raise HTTPException(status_code=404, detail="Análise não encontrada")
    
    df = pd.DataFrame(json.loads(analysis['data']))
    
    try:
        if request.model_type == 'linear':
            result = run_linear_regression(df, request.dependent_var, request.independent_vars)
        elif request.model_type == 'panel':
            if not request.entity_var or not request.time_var:
                raise HTTPException(status_code=400, detail="Entity e Time variables são obrigatórias para modelos de painel")
            result = run_panel_regression(df, request.dependent_var, request.independent_vars,
                                        request.entity_var, request.time_var)
        elif request.model_type == 'arima':
            if not request.time_var:
                raise HTTPException(status_code=400, detail="Time variable é obrigatória para ARIMA")
            order = tuple(request.arima_order) if request.arima_order else (1, 1, 1)
            result = run_arima_model(df, request.dependent_var, request.time_var, order)
        else:
            raise HTTPException(status_code=400, detail="Tipo de modelo não suportado")
        
        result_id = str(uuid.uuid4())
        result_doc = {
            'id': result_id,
            'analysis_id': request.analysis_id,
            'model_type': request.model_type,
            'summary': result.get('summary', ''),
            'coefficients': result['coefficients'],
            'statistics': result['statistics'],
            'charts': result['charts'],
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        await db.results.insert_one(result_doc)
        
        return {
            'result_id': result_id,
            'coefficients': result['coefficients'],
            'statistics': result['statistics'],
            'charts': result['charts']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na análise: {str(e)}")

@api_router.post("/export/png")
async def export_chart_png(chart_data: Dict[str, str]):
    """Export chart as PNG"""
    try:
        chart_b64 = chart_data.get('chart')
        if not chart_b64:
            raise HTTPException(status_code=400, detail="Chart data missing")
        
        img_data = base64.b64decode(chart_b64)
        
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
        temp_file.write(img_data)
        temp_file.close()
        
        return FileResponse(temp_file.name, media_type='image/png', filename='chart.png')
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao exportar PNG: {str(e)}")

@api_router.post("/export/pdf")
async def export_pdf(result_data: Dict[str, Any]):
    """Export analysis results as PDF"""
    try:
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        doc = SimpleDocTemplate(temp_file.name, pagesize=letter)
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#2563EB'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        story = []
        
        story.append(Paragraph("Relatório de Análise Econométrica", title_style))
        story.append(Spacer(1, 0.3 * inch))
        
        coefficients = result_data.get('coefficients', [])
        if coefficients:
            story.append(Paragraph("<b>Coeficientes</b>", styles['Heading2']))
            data = [['Variável', 'Coeficiente', 'Erro Padrão', 'Estatística t', 'p-valor']]
            for coef in coefficients:
                data.append([
                    coef['variable'],
                    f"{coef['coefficient']:.4f}",
                    f"{coef['std_error']:.4f}",
                    f"{coef['t_statistic']:.4f}",
                    f"{coef['p_value']:.4f}"
                ])
            
            table = Table(data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563EB')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(table)
            story.append(Spacer(1, 0.3 * inch))
        
        statistics = result_data.get('statistics', {})
        if statistics:
            story.append(Paragraph("<b>Estatísticas do Modelo</b>", styles['Heading2']))
            for key, value in statistics.items():
                story.append(Paragraph(f"<b>{key}:</b> {value}", styles['Normal']))
            story.append(Spacer(1, 0.3 * inch))
        
        charts = result_data.get('charts', {})
        for chart_name, chart_b64 in charts.items():
            story.append(PageBreak())
            story.append(Paragraph(f"<b>{chart_name.title()}</b>", styles['Heading2']))
            img_data = base64.b64decode(chart_b64)
            img_temp = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
            img_temp.write(img_data)
            img_temp.close()
            img = RLImage(img_temp.name, width=6*inch, height=4*inch)
            story.append(img)
            os.unlink(img_temp.name)
        
        doc.build(story)
        
        return FileResponse(temp_file.name, media_type='application/pdf', filename='analise_econometrica.pdf')
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao exportar PDF: {str(e)}")

@api_router.get("/")
async def root():
    return {"message": "Econometric Analysis API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()