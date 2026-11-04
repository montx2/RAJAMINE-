import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import os

OUT = os.path.join(os.path.dirname(__file__), 'figuras')
os.makedirs(OUT, exist_ok=True)
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':9})

def box(ax, x, y, w, h, text, fc='#F4F4F2', ec='#18181B', fs=8.5, bold=False):
    p=FancyBboxPatch((x,y),w,h,boxstyle='round,pad=0.02,rounding_size=0.04',fc=fc,ec=ec,lw=1)
    ax.add_patch(p)
    ax.text(x+w/2,y+h/2,text,ha='center',va='center',fontsize=fs,fontweight='bold' if bold else 'normal',wrap=True)

def arrow(ax, x1,y1,x2,y2, text=None):
    a=FancyArrowPatch((x1,y1),(x2,y2),arrowstyle='-|>',mutation_scale=12,color='#B45309',lw=1.2)
    ax.add_patch(a)
    if text:
        ax.text((x1+x2)/2,(y1+y2)/2+0.03,text,ha='center',va='bottom',fontsize=7,color='#52525B')

def save(fig,name):
    fig.savefig(os.path.join(OUT,name),dpi=300,bbox_inches='tight',facecolor='white')
    plt.close(fig)

# Figura 1 - Arquitetura
fig,ax=plt.subplots(figsize=(7.2,4.6)); ax.set_xlim(0,10); ax.set_ylim(0,7); ax.axis('off')
box(ax,0.3,5.6,9.4,1.0,'Camada de apresentação\nReact 19 + Vite 7 + Tailwind 4 + React Router 7\nAdmin / Revisão / Colaborador / Motorista (PWA)',fc='#FFF7E6',bold=True)
box(ax,0.3,4.0,4.5,1.2,'Estado e regras de negócio\nZustand 5 + persistência local\nRBAC demonstrativo + auditoria',fc='#F4F4F2')
box(ax,5.2,4.0,4.5,1.2,'Serviços locais\nPadronização determinística\nOCR Tesseract.js WASM\nPDF pdf-lib',fc='#F4F4F2')
box(ax,0.3,2.3,4.5,1.2,'Persistência do navegador\nlocalStorage (estado)\nIndexedDB (fotos)',fc='#F4F4F2')
box(ax,5.2,2.3,4.5,1.2,'Assets locais\npublic/ocr (worker/core/idioma)\npublic/demo (14 imagens sintéticas)\nmanifest + service worker',fc='#F4F4F2')
box(ax,0.3,0.5,9.4,1.2,'Camada de produção documentada (não implementada no protótipo)\nAPI autenticada OIDC/MFA · banco relacional · storage de objetos · filas · logs imutáveis · backups',fc='#E4E4E7',bold=True)
arrow(ax,5,5.6,5,5.2); arrow(ax,2.5,4.0,2.5,3.5); arrow(ax,7.5,4.0,7.5,3.5); arrow(ax,5,2.3,5,1.7)
save(fig,'fig1_arquitetura.png')

# Figura 2 - Fluxo relatório
fig,ax=plt.subplots(figsize=(7.2,3.2)); ax.set_xlim(0,10); ax.set_ylim(0,4); ax.axis('off')
steps=['Criar\nrelatório','Link individual\n48 h','Preencher\natividades/fotos','Padronizar\noriginal preservado','OCR local\nconfirmar','Enviar\nrevisão','Aprovação\nhumana','Gerar PDFs\ncliente/interno','Arquivar\nenvio simulado']
w=1.0; gap=0.12
for i,s in enumerate(steps):
    x=0.15+i*(w+gap)
    box(ax,x,1.4,w,1.2,s,fs=7.2,fc='#FFF7E6' if i in (4,6) else '#F4F4F2')
    if i<len(steps)-1: arrow(ax,x+w,2.0,x+w+gap,2.0)
ax.text(5,0.75,'Pontos de controle: OCR pendente bloqueia aprovação; documento do cliente bloqueado até aprovação registrada.',ha='center',fontsize=7.5,color='#52525B')
save(fig,'fig2_fluxo_relatorio.png')

# Figura 3 - DSR
fig,ax=plt.subplots(figsize=(7.2,3.4)); ax.set_xlim(0,10); ax.set_ylim(0,4.5); ax.axis('off')
steps=['Identificação do\nproblema','Objetivos da\nsolução','Projeto e\ndesenvolvimento','Demonstração','Avaliação','Comunicação']
for i,s in enumerate(steps):
    x=0.2+i*1.65
    box(ax,x,1.7,1.45,1.1,s,fs=7.5,fc='#FFF7E6')
    if i<5: arrow(ax,x+1.45,2.25,x+1.65,2.25)
arrow(ax,8.95,1.7,1.0,1.0)
ax.text(5,1.05,'Iteração: testes, feedback e correções retornam ao desenvolvimento',ha='center',fontsize=7.5,color='#52525B')
save(fig,'fig3_dsr.png')

# Figura 4 - OCR
fig,ax=plt.subplots(figsize=(7.2,3.2)); ax.set_xlim(0,10); ax.set_ylim(0,4); ax.axis('off')
steps=['Foto local\nJPEG/PNG/WebP','Pré-processamento\ngrayscale/contraste','Multi-pass\nPSM 6/11/3','Regex PT-BR\ncódigos/IMEI','Confiança\n+ destaque','Confirmação\nhumana']
for i,s in enumerate(steps):
    x=0.15+i*1.66
    box(ax,x,1.4,1.5,1.2,s,fs=7.3,fc='#FFF7E6' if i==5 else '#F4F4F2')
    if i<5: arrow(ax,x+1.5,2.0,x+1.66,2.0)
ax.text(5,0.75,'Nenhuma imagem sai do dispositivo no protótipo; resultados simulados são rotulados.',ha='center',fontsize=7.5,color='#52525B')
save(fig,'fig4_ocr.png')

# Figura 5 - Portal motorista
fig,ax=plt.subplots(figsize=(7.2,3.8)); ax.set_xlim(0,10); ax.set_ylim(0,5); ax.axis('off')
box(ax,0.3,3.4,4.5,1.2,'Automações permitidas\nchecklist automático · falha→ocorrência\nnotificação interna simulada · fila offline',fc='#ECFDF5',bold=True)
box(ax,5.2,3.4,4.5,1.2,'Automações proibidas\naprovação · PDF cliente · envio real\nGPS contínuo · biometria · score de fadiga',fc='#FEF2F2',bold=True)
box(ax,0.3,1.5,9.4,1.2,'Portal do Motorista (PWA)\nmeu caminhão · checklist por turno · ocorrência com foto · ciência digitada · histórico',fc='#FFF7E6')
box(ax,0.3,0.1,9.4,1.0,'Triagem humana (coordenação/revisão)\nem análise · resolver · rejeitar · resposta ao motorista',fc='#F4F4F2')
arrow(ax,5,3.4,5,2.7); arrow(ax,5,1.5,5,1.1)
save(fig,'fig5_motorista.png')

# Figura 6 - Segurança
fig,ax=plt.subplots(figsize=(7.2,3.6)); ax.set_xlim(0,10); ax.set_ylim(0,5); ax.axis('off')
layers=['Governança LGPD\nbases legais · RIPD · retenção · encarregado','Aplicação\nRBAC · validação Zod · aprovação humana · auditoria','Dados\noriginal preservado · proveniência · IndexedDB/localStorage','Infraestrutura (produção)\nTLS · criptografia · rate limiting · CSP/HSTS · backups','Cliente\nupload validado · OCR local · sem envio real']
for i,s in enumerate(layers):
    y=4.0-i*0.85
    box(ax,0.5,y,9.0,0.7,s,fs=7.8,fc='#F4F4F2' if i%2 else '#FFF7E6')
save(fig,'fig6_seguranca.png')
print('figuras geradas:', os.listdir(OUT))
