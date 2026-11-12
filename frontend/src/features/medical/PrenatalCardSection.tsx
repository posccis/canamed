import React, { useState, useEffect, useMemo } from 'react';
import { Download, Plus, Baby, Calendar, Activity, ShieldAlert, Syringe, FileSpreadsheet, AlertTriangle, Eye, Pencil } from 'lucide-react';
import { useToast } from '../layout/Toast';
import { AtalahWeightGainChart } from './AtalahWeightGainChart';
import { UterineHeightChart } from './UterineHeightChart';
import { PrenatalCardA4Modal } from './PrenatalCardA4Modal';
import './prenatal-card.css';

export interface PrenatalVisitItem {
  id: string;
  visitDate: string;
  gestationalAgeWeeks: number;
  gestationalAgeDays: number;
  weightKg: number;
  bmi?: number | null;
  bloodPressure: string;
  uterineHeightCm?: number | null;
  fetalHeartRateBpm?: number | null;
  fetalMovementPresent?: boolean | null;
  edemaClassification?: string | null;
  fetalPresentation?: string | null;
  clinicalNotes?: string | null;
}

export interface GynecologicalProfileInfo {
  gravida?: number | null;
  para?: number | null;
  cesareans?: number | null;
  abortions?: number | null;
  livingChildren?: number | null;
}

export interface PrenatalCardSectionProps {
  patientId: string;
  patientName: string;
  patientBirthDate?: string | null;
  visits: PrenatalVisitItem[];
  onAddVisit?: (visit: Omit<PrenatalVisitItem, 'id'>) => Promise<void>;
  loading?: boolean;
  initialGestationalAgeWeeks?: number;
  initialGestationalAgeDays?: number;
  heightCm?: number | null;
  dum?: string | null;
  dpp?: string | null;
  bloodType?: string | null;
  rhFactor?: string | null;
  gynProfile?: GynecologicalProfileInfo | null;
}

export interface MaternalVaccineItem {
  id: string;
  name: string;
  target: string;
  window: string;
  status: 'Aplicada' | 'Pendente' | 'Agendada' | 'Não indicada';
  date?: string;
  lot?: string;
}

export interface MaternalSerologyItem {
  id: string;
  exam: string;
  description: string;
  tri1: string;
  tri2: string;
  tri3: string;
}

export const PrenatalCardSection: React.FC<PrenatalCardSectionProps> = ({
  patientId,
  patientName,
  patientBirthDate,
  visits,
  onAddVisit,
  loading = false,
  initialGestationalAgeWeeks,
  initialGestationalAgeDays,
  heightCm = 165,
  dum,
  dpp,
  bloodType,
  rhFactor,
  gynProfile,
}) => {
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [a4ModalOpen, setA4ModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'consultas' | 'vacinas' | 'sorologias'>('consultas');

  // Form states
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [weeks, setWeeks] = useState(
    initialGestationalAgeWeeks !== undefined ? String(initialGestationalAgeWeeks) : '12'
  );
  const [days, setDays] = useState(
    initialGestationalAgeDays !== undefined ? String(initialGestationalAgeDays) : '0'
  );
  const [maternalHeightInput, setMaternalHeightInput] = useState(String(heightCm && heightCm > 50 ? heightCm : 165));
  const [weight, setWeight] = useState('');
  const [bp, setBp] = useState('');
  const [uterineHeight, setUterineHeight] = useState('');
  const [fhr, setFhr] = useState('');
  const [movement, setMovement] = useState<boolean | null>(true);
  const [edema, setEdema] = useState('Ausente');
  const [presentation, setPresentation] = useState('Cefálica');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialGestationalAgeWeeks !== undefined) {
      setWeeks(String(initialGestationalAgeWeeks));
    }
    if (initialGestationalAgeDays !== undefined) {
      setDays(String(initialGestationalAgeDays));
    }
  }, [initialGestationalAgeWeeks, initialGestationalAgeDays]);

  // Cálculo dinâmico de IMC no modal
  const calculatedBmi = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(maternalHeightInput);
    if (!w || !h || h <= 0) return null;
    const bmiVal = w / Math.pow(h / 100, 2);
    return Number(bmiVal.toFixed(1));
  }, [weight, maternalHeightInput]);

  const bmiClassification = useMemo(() => {
    if (!calculatedBmi) return null;
    if (calculatedBmi < 19.8) return { label: 'Baixo Peso', color: '#2B6CB0', bg: '#EBF8FF' };
    if (calculatedBmi <= 26.0) return { label: 'Adequado', color: '#852A91', bg: '#F7ECF8' };
    if (calculatedBmi <= 29.0) return { label: 'Sobrepeso', color: '#C05621', bg: '#FFFAF0' };
    return { label: 'Obesidade', color: '#C53030', bg: '#FFF5F5' };
  }, [calculatedBmi]);

  const isRhNegative =
    rhFactor?.toLowerCase().includes('negativ') || (bloodType && bloodType.includes('-'));

  // Cálculo de DPP por Regra de Naegele (DUM + 7 dias - 3 meses + 1 ano)
  const effectiveDpp = useMemo(() => {
    if (dpp) return dpp;
    if (!dum) return null;
    try {
      const d = new Date(dum);
      if (isNaN(d.getTime())) return null;
      const edd = new Date(d);
      edd.setDate(edd.getDate() + 7);
      edd.setMonth(edd.getMonth() - 3);
      edd.setFullYear(edd.getFullYear() + 1);
      return edd.toISOString().slice(0, 10);
    } catch {
      return null;
    }
  }, [dpp, dum]);

  // Vacinas com persistência em localStorage por paciente — Status inicial 100% fidedigno (Pendente)
  const defaultVaccines: MaternalVaccineItem[] = [
    {
      id: 'dtpa',
      name: 'dTpa (Adulto)',
      target: 'Difteria, Tétano e Coqueluche',
      window: 'A partir da 20ª sem (ideal 27ª–36ªs) · 1 dose a cada gestação',
      status: 'Pendente',
      date: '—',
      lot: '—',
    },
    {
      id: 'flu',
      name: 'Influenza (Gripe)',
      target: 'Gripe Sazonal e complicações respiratórias',
      window: 'Qualquer Idade Gestacional · 1 dose anual',
      status: 'Pendente',
      date: '—',
      lot: '—',
    },
    {
      id: 'hepb',
      name: 'Hepatite B (Recombinante)',
      target: 'Prevenção de infecção e transmissão vertical',
      window: '3 doses (0, 1 e 6 meses) ou comprovação de esquema prévio',
      status: 'Pendente',
      date: '—',
      lot: '—',
    },
    {
      id: 'covid',
      name: 'COVID-19 (Bivalente/Atualizada)',
      target: 'Prevenção de formas graves de infecção por SARS-CoV-2',
      window: 'Conforme cronograma PNI · Gestante grupo prioritário',
      status: 'Pendente',
      date: '—',
      lot: '—',
    },
    {
      id: 'rsv',
      name: 'Vírus Sincicial Respiratório (VSR / Bivalent)',
      target: 'Prevenção de bronquiolite no recém-nascido',
      window: 'Entre a 32ª e 36ª semana gestacional · Dose única',
      status: 'Pendente',
      date: '—',
      lot: '—',
    },
    {
      id: 'antid',
      name: 'Imunoglobulina Anti-D (300 mcg)',
      target: 'Profilaxia de aloimunização em mães Rh Negativo',
      window: '28ª semana de gestação e em até 72h após o parto (se RN Rh+)',
      status: isRhNegative ? 'Pendente' : 'Não indicada',
      date: '—',
      lot: '—',
    },
  ];

  const storageKey = `canamed_prenatal_vaccines_${patientId || 'default'}`;
  const [vaccines, setVaccines] = useState<MaternalVaccineItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return defaultVaccines;
  });

  const handleUpdateVaccine = (id: string, newStatus: MaternalVaccineItem['status']) => {
    const updated = vaccines.map((vac) => {
      if (vac.id === id) {
        return {
          ...vac,
          status: newStatus,
          date: newStatus === 'Aplicada' ? new Date().toLocaleDateString('pt-BR') : '—',
          lot: newStatus === 'Aplicada' && vac.lot === '—' ? 'Registrado em Prontuário' : vac.lot,
        };
      }
      return vac;
    });
    setVaccines(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      addToast(`Status da vacina atualizado para "${newStatus}".`, 'success');
    } catch {
      // ignore
    }
  };

  // Sorologias do Ministério da Saúde / FEBRASGO — Status fidedignos gerenciáveis por paciente
  const defaultSerologies: MaternalSerologyItem[] = [
    {
      id: 'coombs',
      exam: 'Coombs Indireto (Gestante Rh-)',
      description: 'Pesquisa de anticorpos irregulares em gestantes não aloimunizadas',
      tri1: isRhNegative ? '—' : 'Não indicado (Rh+)',
      tri2: isRhNegative ? '—' : 'Não indicado (Rh+)',
      tri3: isRhNegative ? '—' : 'Não indicado (Rh+)',
    },
    {
      id: 'vdrl',
      exam: 'Sífilis (VDRL / Teste Rápido)',
      description: 'Pesquisa e vigilância de transmissão vertical de Treponema pallidum',
      tri1: '—',
      tri2: '—',
      tri3: '—',
    },
    {
      id: 'hiv',
      exam: 'HIV (Anti-HIV 1 e 2)',
      description: 'Rastreamento rápido e sorológico com profilaxia imediata se reagente',
      tri1: '—',
      tri2: '—',
      tri3: '—',
    },
    {
      id: 'hepb',
      exam: 'Hepatite B (HBsAg)',
      description: 'Detecção de infecção aguda ou crônica e preparo para imunoglobulina no RN',
      tri1: '—',
      tri2: '—',
      tri3: '—',
    },
    {
      id: 'toxo',
      exam: 'Toxoplasmose (IgM e IgG)',
      description: 'Pesquisa de susceptibilidade (IgM-/IgG-) ou primo-infecção gestacional',
      tri1: '—',
      tri2: '—',
      tri3: '—',
    },
    {
      id: 'glicemia',
      exam: 'Glicemia de Jejum / TOTG 75g',
      description: 'Rastreamento de Diabetes Mellitus Gestacional (DMG)',
      tri1: '—',
      tri2: '—',
      tri3: '—',
    },
    {
      id: 'urina',
      exam: 'Urina EAS & Urocultura',
      description: 'Rastreamento de bacteriúria assintomática e profilaxia de pielonefrite',
      tri1: '—',
      tri2: '—',
      tri3: '—',
    },
  ];

  const serologiesStorageKey = `canamed_prenatal_serologies_${patientId || 'default'}`;
  const [serologies, setSerologies] = useState<MaternalSerologyItem[]>(() => {
    try {
      const saved = localStorage.getItem(serologiesStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return defaultSerologies;
  });

  const handleUpdateSerology = (id: string, trimester: 'tri1' | 'tri2' | 'tri3', value: string) => {
    const updated = serologies.map((s) => {
      if (s.id === id) {
        return { ...s, [trimester]: value };
      }
      return s;
    });
    setSerologies(updated);
    try {
      localStorage.setItem(serologiesStorageKey, JSON.stringify(updated));
      addToast('Resultado de sorologia atualizado com sucesso.', 'success');
    } catch {
      // ignore
    }
  };

  // Estados e controle de edição de exames / sorologias
  const [serologyModalOpen, setSerologyModalOpen] = useState(false);
  const [editingSerology, setEditingSerology] = useState<MaternalSerologyItem | null>(null);
  const [selectedTrimester, setSelectedTrimester] = useState<'tri1' | 'tri2' | 'tri3'>('tri1');
  const [examResultInput, setExamResultInput] = useState('');
  const [examDateInput, setExamDateInput] = useState('');
  const [newExamName, setNewExamName] = useState('');
  const [newExamDesc, setNewExamDesc] = useState('');

  const openEditSerologyModal = (serology: MaternalSerologyItem, tri: 'tri1' | 'tri2' | 'tri3' = 'tri1') => {
    setEditingSerology(serology);
    setSelectedTrimester(tri);
    setNewExamName(serology.exam);
    setNewExamDesc(serology.description);

    const val = serology[tri] || '';
    setExamResultInput(val === '—' ? '' : val);
    setExamDateInput(new Date().toISOString().slice(0, 10));
    setSerologyModalOpen(true);
  };

  const openNewSerologyModal = () => {
    setEditingSerology(null);
    setSelectedTrimester('tri1');
    setNewExamName('');
    setNewExamDesc('');
    setExamResultInput('');
    setExamDateInput(new Date().toISOString().slice(0, 10));
    setSerologyModalOpen(true);
  };

  const handleSaveSerologyForm = (e: React.FormEvent) => {
    e.preventDefault();

    let formattedResult = examResultInput.trim() || '—';
    if (formattedResult !== '—' && examDateInput) {
      const parts = examDateInput.split('-');
      if (parts.length === 3) {
        const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        if (!formattedResult.includes(formattedDate)) {
          formattedResult = `${formattedResult} (${formattedDate})`;
        }
      }
    }

    if (editingSerology) {
      handleUpdateSerology(editingSerology.id, selectedTrimester, formattedResult);
    } else {
      if (!newExamName.trim()) {
        addToast('Nome do exame é obrigatório.', 'error');
        return;
      }
      const newId = `custom_${Date.now()}`;
      const newItem: MaternalSerologyItem = {
        id: newId,
        exam: newExamName.trim(),
        description: newExamDesc.trim() || 'Exame complementar registrado',
        tri1: selectedTrimester === 'tri1' ? formattedResult : '—',
        tri2: selectedTrimester === 'tri2' ? formattedResult : '—',
        tri3: selectedTrimester === 'tri3' ? formattedResult : '—',
      };
      const updated = [...serologies, newItem];
      setSerologies(updated);
      try {
        localStorage.setItem(serologiesStorageKey, JSON.stringify(updated));
        addToast(`Exame "${newExamName}" registrado com sucesso.`, 'success');
      } catch {
        // ignore
      }
    }
    setSerologyModalOpen(false);
  };

  // Estados e controle de edição de vacinas
  const [vaccineModalOpen, setVaccineModalOpen] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState<MaternalVaccineItem | null>(null);
  const [vacStatusInput, setVacStatusInput] = useState<MaternalVaccineItem['status']>('Pendente');
  const [vacDateInput, setVacDateInput] = useState('');
  const [vacLotInput, setVacLotInput] = useState('');

  const openEditVaccineModal = (vac: MaternalVaccineItem) => {
    setEditingVaccine(vac);
    setVacStatusInput(vac.status);
    setVacDateInput(vac.date && vac.date !== '—' ? vac.date : new Date().toLocaleDateString('pt-BR'));
    setVacLotInput(vac.lot && vac.lot !== '—' ? vac.lot : '');
    setVaccineModalOpen(true);
  };

  const handleSaveVaccineForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVaccine) return;

    const updated = vaccines.map((vac) => {
      if (vac.id === editingVaccine.id) {
        return {
          ...vac,
          status: vacStatusInput,
          date: vacStatusInput === 'Aplicada' ? (vacDateInput.trim() || new Date().toLocaleDateString('pt-BR')) : '—',
          lot: vacStatusInput === 'Aplicada' ? (vacLotInput.trim() || 'Registrado em Prontuário') : '—',
        };
      }
      return vac;
    });

    setVaccines(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      addToast(`Vacina "${editingVaccine.name}" atualizada com sucesso.`, 'success');
    } catch {
      // ignore
    }
    setVaccineModalOpen(false);
  };

  const handleSaveVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !bp) {
      addToast('Peso e Pressão Arterial são obrigatórios.', 'error');
      return;
    }

    try {
      setSaving(true);
      if (onAddVisit) {
        await onAddVisit({
          visitDate,
          gestationalAgeWeeks: parseInt(weeks, 10) || 12,
          gestationalAgeDays: parseInt(days, 10) || 0,
          weightKg: parseFloat(weight),
          bmi: calculatedBmi,
          bloodPressure: bp,
          uterineHeightCm: uterineHeight ? parseFloat(uterineHeight) : null,
          fetalHeartRateBpm: fhr ? parseInt(fhr, 10) : null,
          fetalMovementPresent: movement,
          edemaClassification: edema,
          fetalPresentation: presentation,
          clinicalNotes: notes || null,
        });
      }

      addToast('Consulta de Pré-Natal registrada com sucesso!', 'success');
      setModalOpen(false);
      setWeight('');
      setBp('');
      setUterineHeight('');
      setFhr('');
      setNotes('');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Falha ao salvar consulta pré-natal.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatIsoDate = (d?: string | null) => {
    if (!d) return 'Não informada';
    try {
      const parts = d.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(d).toLocaleDateString('pt-BR');
    } catch {
      return d;
    }
  };

  const fullBloodType = bloodType ? `${bloodType}${isRhNegative ? '-' : '+'}` : null;

  return (
    <div data-testid="prenatal-card-section" className="prenatal-card">
      {/* 1. TOPO DA SEÇÃO: Cabeçalho com ações */}
      <div className="prenatal-card__header">
        <div className="prenatal-card__header-left">
          <div className="prenatal-card__icon-badge">
            <Baby style={{ width: 22, height: 22 }} />
          </div>
          <div className="prenatal-card__titles">
            <h3 className="prenatal-card__title">
              Cartão da Gestante & Consultas de Pré-Natal
            </h3>
            <p className="prenatal-card__subtitle">
              Acompanhamento longitudinal materno-fetal · Diretrizes FEBRASGO / Ministério da Saúde
            </p>
          </div>
        </div>

        <div className="prenatal-card__actions">
          {onAddVisit && (
            <button
              type="button"
              className="prenatal-card__btn-secondary"
              onClick={() => setModalOpen(true)}
            >
              <Plus style={{ width: 14, height: 14 }} />
              + Nova Consulta
            </button>
          )}

          <button
            type="button"
            className="prenatal-card__btn-secondary"
            onClick={() => setA4ModalOpen(true)}
            title="Visualizar o Cartão da Gestante completo de 6 páginas"
          >
            <Eye style={{ width: 14, height: 14 }} />
            Visualizar Cartão (6 Páginas)
          </button>

          <button
            type="button"
            className="prenatal-card__btn-primary"
            onClick={() => {
              setA4ModalOpen(true);
              setTimeout(() => {
                window.print();
              }, 400);
            }}
            title="Exportar Cartão da Gestante idêntico à tela em formato PDF A4 oficial"
          >
            <Download style={{ width: 14, height: 14 }} />
            Exportar Cartão (PDF)
          </button>
        </div>
      </div>

      {/* 2. RESUMO OBSTÉTRICO EXECUTIVO (Fundo #F7ECF8, Borda #B77AD8) */}
      <div className="prenatal-card__summary-card">
        <div className="prenatal-card__summary-grid">
          {/* DUM */}
          <div className="prenatal-card__metric-tile">
            <span className="prenatal-card__metric-label">DUM</span>
            <strong className="prenatal-card__metric-value">{formatIsoDate(dum)}</strong>
            <span className="prenatal-card__metric-sub">Última menstruação</span>
          </div>

          {/* DPP */}
          <div className="prenatal-card__metric-tile">
            <span className="prenatal-card__metric-label">DPP (Naegele)</span>
            <strong className="prenatal-card__metric-value">
              {effectiveDpp ? formatIsoDate(effectiveDpp) : 'Pendente de DUM'}
            </strong>
            <span className="prenatal-card__metric-sub">Data provável parto</span>
          </div>

          {/* IG Atual */}
          <div className="prenatal-card__metric-tile">
            <span className="prenatal-card__metric-label">IG Atual</span>
            <strong className="prenatal-card__metric-value prenatal-card__metric-value--primary">
              {visits.length > 0
                ? `${visits[visits.length - 1].gestationalAgeWeeks}s ${visits[visits.length - 1].gestationalAgeDays}d`
                : initialGestationalAgeWeeks
                ? `${initialGestationalAgeWeeks}s ${initialGestationalAgeDays || 0}d`
                : '—'}
            </strong>
            <span className="prenatal-card__metric-sub prenatal-card__metric-sub--muted">Idade gestacional</span>
          </div>

          {/* GPA */}
          <div className="prenatal-card__metric-tile">
            <span className="prenatal-card__metric-label">Histórico GPA</span>
            <strong className="prenatal-card__metric-value">
              {gynProfile
                ? `G${gynProfile.gravida ?? 1} P${gynProfile.para ?? 0} C${gynProfile.cesareans ?? 0} A${gynProfile.abortions ?? 0}`
                : 'G1 P0 C0 A0'}
            </strong>
            <span className="prenatal-card__metric-sub prenatal-card__metric-sub--muted">
              {gynProfile?.livingChildren ? `${gynProfile.livingChildren} filhos vivos` : 'Primeira gravidez'}
            </span>
          </div>

          {/* Tipagem ABO/Rh */}
          <div className="prenatal-card__metric-tile">
            <span className="prenatal-card__metric-label">Tipagem ABO/Rh</span>
            <strong className="prenatal-card__metric-value prenatal-card__metric-value--accent">
              {fullBloodType || (bloodType ? `${bloodType} ${rhFactor || ''}` : 'Não informada')}
            </strong>
            <span className="prenatal-card__metric-sub prenatal-card__metric-sub--muted">
              {isRhNegative ? 'Rh Negativo' : 'Rh Positivo'}
            </span>
          </div>

          {/* Estatura & IMC Basal */}
          <div className="prenatal-card__metric-tile">
            <span className="prenatal-card__metric-label">Estatura / IMC</span>
            <strong className="prenatal-card__metric-value">{heightCm || 165} cm</strong>
            <span className="prenatal-card__metric-sub">
              {visits.length > 0 && visits[visits.length - 1].bmi
                ? `IMC: ${visits[visits.length - 1].bmi?.toFixed(1)}`
                : 'Acompanhamento'}
            </span>
          </div>
        </div>

        {/* Alerta de Rh Negativo e Aloimunização */}
        {isRhNegative && (
          <div className="prenatal-card__rh-alert">
            <ShieldAlert style={{ width: 18, height: 18 }} />
            <div>
              <strong>Gestante Rh Negativo — Vigilância de Aloimunização:</strong> Realizar Coombs Indireto trimestral e aplicar Imunoglobulina Anti-D (300 mcg) na 28ª semana e até 72h pós-parto caso o RN seja Rh+.
            </div>
          </div>
        )}
      </div>

      {/* 3. NAVEGAÇÃO ENTRE ABAS (Segmented Tabs) */}
      <div className="prenatal-card__tabs">
        <button
          type="button"
          onClick={() => setActiveTab('consultas')}
          className={`prenatal-card__tab-btn ${activeTab === 'consultas' ? 'prenatal-card__tab-btn--active' : ''}`}
        >
          <Activity style={{ width: 14, height: 14 }} />
          Consultas & Gráficos
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vacinas')}
          className={`prenatal-card__tab-btn ${activeTab === 'vacinas' ? 'prenatal-card__tab-btn--active' : ''}`}
        >
          <Syringe style={{ width: 14, height: 14 }} />
          Vacinas da Gestante
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sorologias')}
          className={`prenatal-card__tab-btn ${activeTab === 'sorologias' ? 'prenatal-card__tab-btn--active' : ''}`}
        >
          <FileSpreadsheet style={{ width: 14, height: 14 }} />
          Sorologias por Trimestre
        </button>
      </div>

      {/* 4. CONTEÚDO DAS ABAS */}
      {activeTab === 'consultas' && (
        <div className="prenatal-card__content-panel">
          {loading ? (
            <div className="prenatal-card__empty-state">
              <p className="prenatal-card__empty-title">Carregando consultas pré-natais...</p>
            </div>
          ) : visits.length === 0 ? (
            <div className="prenatal-card__empty-state">
              <Calendar style={{ width: 32, height: 32 }} />
              <p className="prenatal-card__empty-title">Nenhuma consulta pré-natal registrada</p>
              <p className="prenatal-card__empty-desc">
                Clique em "+ Nova Consulta" para registrar os parâmetros da visita obstétrica.
              </p>
            </div>
          ) : (
            <div className="prenatal-card__table-wrapper">
              <table className="prenatal-card__table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>IG (Sem/D)</th>
                    <th>Peso (kg)</th>
                    <th>IMC</th>
                    <th>PA (mmHg)</th>
                    <th>AU (cm)</th>
                    <th>BCF (bpm)</th>
                    <th>Mov. Fetal</th>
                    <th>Edema</th>
                    <th>Apresentação</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((v) => {
                    const effectiveBmi = v.bmi ?? (v.weightKg ? Number((v.weightKg / Math.pow((heightCm || 165) / 100, 2)).toFixed(1)) : null);
                    return (
                      <React.Fragment key={v.id}>
                        <tr>
                          <td className="col-date">
                            {new Date(v.visitDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </td>
                          <td className="col-ig">
                            {v.gestationalAgeWeeks}s {v.gestationalAgeDays}d
                          </td>
                          <td>{v.weightKg.toFixed(1)}</td>
                          <td className="col-imc">{effectiveBmi ?? '-'}</td>
                          <td style={{ fontWeight: 600 }}>{v.bloodPressure}</td>
                          <td>{v.uterineHeightCm ?? '-'}</td>
                          <td className="col-fhr">{v.fetalHeartRateBpm ?? '-'}</td>
                          <td className={v.fetalMovementPresent ? 'col-mv-active' : ''}>
                            {v.fetalMovementPresent === true
                              ? 'Presente'
                              : v.fetalMovementPresent === false
                              ? 'Ausente'
                              : '-'}
                          </td>
                          <td style={{ color: 'var(--prenatal-brand-muted)' }}>{v.edemaClassification || 'Ausente'}</td>
                          <td className="col-presentation">{v.fetalPresentation || '-'}</td>
                        </tr>
                        {v.clinicalNotes && (
                          <tr className="prenatal-card__table-notes-row">
                            <td colSpan={10}>
                              <span className="prenatal-card__table-notes-prefix">Conduta/Notas:</span>
                              {v.clinicalNotes}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Gráficos sempre visíveis na Aba 1 */}
          <div className="prenatal-card__charts-grid">
            <AtalahWeightGainChart visits={visits} heightCm={heightCm} />
            <UterineHeightChart visits={visits} />
          </div>
        </div>
      )}

      {/* ABA 2: PÁGINA EXCLUSIVA DE VACINAS DA GESTANTE */}
      {activeTab === 'vacinas' && (
        <div className="prenatal-card__content-panel">
          {/* Hero de Imunização Materno-Infantil */}
          <div className="prenatal-card__vaccine-hero">
            <div className="prenatal-card__vaccine-hero-icon">
              <Syringe style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <span className="prenatal-card__vaccine-hero-tag">Imunização Materno-Infantil · Diretrizes SBIm / FEBRASGO</span>
              <h4 className="prenatal-card__vaccine-hero-title">
                Minhas Vacinas na Gestação: Proteção para Mim e para Meu Bebê
              </h4>
              <p className="prenatal-card__vaccine-hero-desc">
                As vacinas durante a gravidez protegem a gestante de quadros graves e transferem anticorpos protetores (imunoglobulinas IgG) através da barreira placentária, conferindo imunidade passiva vital ao bebê nos primeiros meses de vida.
              </p>
            </div>
          </div>

          {/* Grade de Vacinas */}
          <div className="prenatal-card__vaccine-grid">
            {vaccines.map((vac) => {
              const badgeClass =
                vac.status === 'Aplicada'
                  ? 'prenatal-card__vaccine-badge--applied'
                  : vac.status === 'Agendada'
                  ? 'prenatal-card__vaccine-badge--scheduled'
                  : vac.status === 'Não indicada'
                  ? 'prenatal-card__vaccine-badge--none'
                  : 'prenatal-card__vaccine-badge--pending';

              return (
                <div key={vac.id} className="prenatal-card__vaccine-card">
                  <div>
                    <div className="prenatal-card__vaccine-header">
                      <strong className="prenatal-card__vaccine-name">{vac.name}</strong>
                      <span className={`prenatal-card__vaccine-badge ${badgeClass}`}>
                        {vac.status}
                      </span>
                    </div>
                    <p className="prenatal-card__vaccine-target">{vac.target}</p>
                    <span className="prenatal-card__vaccine-window">{vac.window}</span>
                  </div>

                  <div className="prenatal-card__vaccine-footer">
                    <span className="prenatal-card__vaccine-meta">
                      {vac.status === 'Aplicada'
                        ? `Aplicada: ${vac.date || '—'} · Lote: ${vac.lot || '—'}`
                        : vac.status === 'Agendada'
                        ? `Agendada (${vac.date && vac.date !== '—' ? vac.date : vac.window})`
                        : vac.status === 'Não indicada'
                        ? 'Não indicada'
                        : 'Pendente de aplicação'}
                    </span>
                    <div className="prenatal-card__vaccine-actions">
                      <button
                        type="button"
                        onClick={() => openEditVaccineModal(vac)}
                        className="prenatal-card__vaccine-action-btn"
                        title="Editar data, lote e status da vacina"
                      >
                        <Pencil style={{ width: 11, height: 11 }} />
                        Editar
                      </button>
                      {(['Aplicada', 'Pendente', 'Agendada'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleUpdateVaccine(vac.id, st)}
                          className={`prenatal-card__vaccine-action-btn ${
                            vac.status === st ? 'prenatal-card__vaccine-action-btn--active' : ''
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Alerta de Contraindicações Absolutas */}
          <div className="prenatal-card__vaccine-alert">
            <AlertTriangle style={{ width: 20, height: 20 }} />
            <div>
              <strong style={{ fontWeight: 700 }}>Atenção às Contraindicações Absolutas:</strong> Vacinas de vírus ou bactérias vivas atenuadas são terminantemente contraindicadas na gravidez: <strong>Tríplice Viral (Sarampo, Caxumba, Rubéola), Varicela (Catapora), HPV, Dengue e Febre Amarela (salvo alto risco epidemiológico)</strong>.
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: SOROLOGIAS POR TRIMESTRE */}
      {activeTab === 'sorologias' && (
        <div className="prenatal-card__content-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--prenatal-brand-deep)' }}>
                Exames Laboratoriais & Sorologias Pré-Natais
              </h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--prenatal-brand-muted)' }}>
                Acompanhamento fidedigno por trimestre. Altere no seletor rápido ou clique em <strong>Editar</strong> para registrar datas e laudos detalhados.
              </p>
            </div>
            <button
              type="button"
              className="prenatal-card__btn-primary"
              onClick={openNewSerologyModal}
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
            >
              <Plus style={{ width: 14, height: 14 }} />
              + Registrar Novo Exame
            </button>
          </div>

          <div className="prenatal-card__table-wrapper">
            <table className="prenatal-card__table prenatal-card__serologies-table">
              <thead>
                <tr>
                  <th style={{ width: '34%' }}>Exame / Parâmetro</th>
                  <th style={{ width: '20%', textAlign: 'center' }}>1º Trimestre</th>
                  <th style={{ width: '20%', textAlign: 'center' }}>2º Trimestre</th>
                  <th style={{ width: '20%', textAlign: 'center' }}>3º Trimestre</th>
                  <th style={{ width: '6%', textAlign: 'center' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {serologies.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className="prenatal-card__serology-exam-title">{s.exam}</span>
                      <span className="prenatal-card__serology-exam-desc">{s.description}</span>
                    </td>
                    {(['tri1', 'tri2', 'tri3'] as const).map((tri) => (
                      <td key={tri} className="prenatal-card__serology-cell">
                        <select
                          value={s[tri]}
                          onChange={(e) => handleUpdateSerology(s.id, tri, e.target.value)}
                          className="prenatal-card__serology-select"
                          title="Alterar resultado registrado do trimestre"
                        >
                          <option value="—">—</option>
                          <option value="Não Reagente">Não Reagente</option>
                          <option value="Reagente">Reagente</option>
                          <option value="Normal">Normal</option>
                          <option value="Alterado">Alterado</option>
                          <option value="Solicitado">Solicitado</option>
                          <option value="Não indicado">Não indicado</option>
                          {!['—', 'Não Reagente', 'Reagente', 'Normal', 'Alterado', 'Solicitado', 'Não indicado'].includes(s[tri]) && (
                            <option value={s[tri]}>{s[tri]}</option>
                          )}
                        </select>
                      </td>
                    ))}
                    <td className="prenatal-card__serology-cell" style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => openEditSerologyModal(s, 'tri1')}
                        className="prenatal-card__vaccine-action-btn"
                        title="Editar com data e laudo detalhado"
                        style={{ padding: '0.3rem 0.5rem' }}
                      >
                        <Pencil style={{ width: 12, height: 12 }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE REGISTRO DE CONSULTA PRÉ-NATAL */}
      {modalOpen && (
        <div className="prenatal-card__modal-overlay">
          <div className="prenatal-card__modal-dialog">
            <div className="prenatal-card__modal-header">
              <h4 className="prenatal-card__modal-title">
                <Activity style={{ width: 18, height: 18, color: 'var(--prenatal-brand-primary)' }} />
                Registrar Consulta de Pré-Natal
              </h4>
              <button
                type="button"
                className="prenatal-card__modal-close"
                onClick={() => setModalOpen(false)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVisit} className="prenatal-card__form">
              <div className="prenatal-card__form-grid-2">
                <div className="prenatal-card__field">
                  <label className="prenatal-card__field-label">Data da Consulta *</label>
                  <input
                    type="date"
                    required
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="prenatal-card__input"
                  />
                </div>
                <div className="prenatal-card__field">
                  <label className="prenatal-card__field-label">Pressão Arterial (PA) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 120/80"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    className="prenatal-card__input"
                  />
                </div>
              </div>

              {/* Idade Gestacional */}
              <div className="prenatal-card__form-grid-2">
                <div className="prenatal-card__field">
                  <label htmlFor="prenatal-weeks" className="prenatal-card__field-label">IG Semanas *</label>
                  <input
                    id="prenatal-weeks"
                    type="number"
                    min="4"
                    max="44"
                    required
                    value={weeks}
                    onChange={(e) => setWeeks(e.target.value)}
                    className="prenatal-card__input"
                  />
                </div>
                <div className="prenatal-card__field">
                  <label htmlFor="prenatal-days" className="prenatal-card__field-label">IG Dias</label>
                  <input
                    id="prenatal-days"
                    type="number"
                    min="0"
                    max="6"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="prenatal-card__input"
                  />
                </div>
              </div>

              {/* Biometria e IMC Dinâmico */}
              <div className="prenatal-card__bmi-panel">
                <div className="prenatal-card__form-grid-2">
                  <div className="prenatal-card__field">
                    <label className="prenatal-card__field-label">Peso Atual (kg) *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="20"
                      max="300"
                      required
                      placeholder="65.0"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="prenatal-card__input"
                    />
                  </div>
                  <div className="prenatal-card__field">
                    <label className="prenatal-card__field-label">Estatura Materna (cm)</label>
                    <input
                      type="number"
                      step="1"
                      min="100"
                      max="220"
                      placeholder="Ex: 165"
                      value={maternalHeightInput}
                      onChange={(e) => setMaternalHeightInput(e.target.value)}
                      className="prenatal-card__input"
                    />
                    <small style={{ fontSize: '0.68rem', color: '#718096', marginTop: '3px', display: 'block' }}>
                      Altura da paciente para cálculo do IMC
                    </small>
                  </div>
                </div>

                {calculatedBmi && (
                  <div className="prenatal-card__bmi-result">
                    <span style={{ fontWeight: 700, color: 'var(--prenatal-brand-deep)' }}>
                      IMC Calculado: {calculatedBmi.toFixed(1)} kg/m²
                    </span>
                    {bmiClassification && (
                      <span
                        className="prenatal-card__bmi-badge"
                        style={{ color: bmiClassification.color, backgroundColor: bmiClassification.bg }}
                      >
                        {bmiClassification.label}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Parâmetros Fetais */}
              <div className="prenatal-card__form-grid-3">
                <div className="prenatal-card__field">
                  <label className="prenatal-card__field-label">AU (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="8"
                    max="50"
                    placeholder="Ex: 24"
                    value={uterineHeight}
                    onChange={(e) => setUterineHeight(e.target.value)}
                    className="prenatal-card__input"
                  />
                  <small style={{ fontSize: '0.68rem', color: '#718096', marginTop: '3px', display: 'block' }}>
                    Sínfise púbica ao fundo uterino (normal: 10–40 cm)
                  </small>
                </div>
                <div className="prenatal-card__field">
                  <label className="prenatal-card__field-label">BCF (bpm)</label>
                  <input
                    type="number"
                    placeholder="145"
                    value={fhr}
                    onChange={(e) => setFhr(e.target.value)}
                    className="prenatal-card__input"
                  />
                </div>
                <div className="prenatal-card__field">
                  <label className="prenatal-card__field-label">Edema</label>
                  <select
                    value={edema}
                    onChange={(e) => setEdema(e.target.value)}
                    className="prenatal-card__select"
                  >
                    <option value="Ausente">Ausente</option>
                    <option value="+/4+">+/4+</option>
                    <option value="++/4+">++/4+</option>
                    <option value="+++/4+">+++/4+</option>
                    <option value="++++/4+">++++/4+</option>
                  </select>
                </div>
              </div>

              {/* Movimentação Fetal e Apresentação Fetal */}
              <div className="prenatal-card__form-grid-2">
                <div className="prenatal-card__field">
                  <label className="prenatal-card__field-label">Movimento Fetal</label>
                  <select
                    value={movement === null ? 'null' : String(movement)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMovement(val === 'null' ? null : val === 'true');
                    }}
                    className="prenatal-card__select"
                  >
                    <option value="true">Presente / Ativo</option>
                    <option value="false">Ausente / Reduzido</option>
                    <option value="null">Não aplicável (&lt; 18s)</option>
                  </select>
                </div>
                <div className="prenatal-card__field">
                  <label className="prenatal-card__field-label">Apresentação Fetal</label>
                  <select
                    value={presentation}
                    onChange={(e) => setPresentation(e.target.value)}
                    className="prenatal-card__select"
                  >
                    <option value="Cefálica">Cefálica</option>
                    <option value="Pélvica">Pélvica</option>
                    <option value="Córmica / Transversa">Córmica / Transversa</option>
                    <option value="Indiferente">Indiferente</option>
                  </select>
                </div>
              </div>

              {/* Conduta e Observações Clínicas */}
              <div className="prenatal-card__field">
                <label className="prenatal-card__field-label">Conduta e Observações Clínicas</label>
                <textarea
                  rows={3}
                  placeholder="Conduta, exames solicitados e queixas..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="prenatal-card__textarea"
                />
              </div>

              <div className="prenatal-card__modal-footer">
                <button
                  type="button"
                  className="prenatal-card__btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="prenatal-card__btn-primary"
                >
                  {saving ? 'Gravando...' : 'Salvar Consulta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE REGISTRO E EDIÇÃO DE EXAME / SOROLOGIA */}
      {serologyModalOpen && (
        <div className="prenatal-card__modal-overlay">
          <div className="prenatal-card__modal-dialog">
            <div className="prenatal-card__modal-header">
              <h4 className="prenatal-card__modal-title">
                <FileSpreadsheet style={{ width: 18, height: 18, color: 'var(--prenatal-brand-primary)' }} />
                {editingSerology ? `Editar Exame: ${editingSerology.exam}` : 'Registrar Novo Exame / Sorologia'}
              </h4>
              <button
                type="button"
                className="prenatal-card__modal-close"
                onClick={() => setSerologyModalOpen(false)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSerologyForm} className="prenatal-card__form">
              {!editingSerology && (
                <>
                  <div className="prenatal-card__field">
                    <label className="prenatal-card__field-label">Nome do Exame *</label>
                    <input
                      type="text"
                      required
                      value={newExamName}
                      onChange={(e) => setNewExamName(e.target.value)}
                      placeholder="Ex: Hemograma Completo, TSH, Estreptococo B..."
                      className="prenatal-card__input"
                    />
                  </div>
                  <div className="prenatal-card__field">
                    <label className="prenatal-card__field-label">Descrição / Parâmetro Clínico</label>
                    <input
                      type="text"
                      value={newExamDesc}
                      onChange={(e) => setNewExamDesc(e.target.value)}
                      placeholder="Ex: Avaliação de anemia, função tireoidiana..."
                      className="prenatal-card__input"
                    />
                  </div>
                </>
              )}

              <div className="prenatal-card__form-grid-2">
                <div className="prenatal-card__field">
                  <label className="prenatal-card__field-label">Trimestre de Referência *</label>
                  <select
                    value={selectedTrimester}
                    onChange={(e) => {
                      const tri = e.target.value as 'tri1' | 'tri2' | 'tri3';
                      setSelectedTrimester(tri);
                      if (editingSerology) {
                        const val = editingSerology[tri] || '';
                        setExamResultInput(val === '—' ? '' : val);
                      }
                    }}
                    className="prenatal-card__input"
                  >
                    <option value="tri1">1º Trimestre</option>
                    <option value="tri2">2º Trimestre</option>
                    <option value="tri3">3º Trimestre</option>
                  </select>
                </div>

                <div className="prenatal-card__field">
                  <label className="prenatal-card__field-label">Data da Coleta / Realização</label>
                  <input
                    type="date"
                    value={examDateInput}
                    onChange={(e) => setExamDateInput(e.target.value)}
                    className="prenatal-card__input"
                  />
                </div>
              </div>

              <div className="prenatal-card__field">
                <label className="prenatal-card__field-label">Seleção Rápida de Resultado</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {(['Não Reagente', 'Reagente', 'Normal', 'Alterado', 'Solicitado', 'Não indicado', '—'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setExamResultInput(opt)}
                      className="prenatal-card__vaccine-action-btn"
                      style={{
                        padding: '0.3rem 0.6rem',
                        backgroundColor: examResultInput.startsWith(opt) ? 'var(--prenatal-brand-primary)' : 'var(--prenatal-brand-soft)',
                        color: examResultInput.startsWith(opt) ? '#FFFFFF' : 'var(--prenatal-brand-deep)',
                        fontWeight: 600,
                        borderRadius: 4,
                        border: '1px solid var(--prenatal-brand-border)',
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="prenatal-card__field">
                <label className="prenatal-card__field-label">Resultado / Laudo Detalhado *</label>
                <input
                  type="text"
                  required
                  value={examResultInput}
                  onChange={(e) => setExamResultInput(e.target.value)}
                  placeholder="Ex: Não Reagente, 84 mg/dL, 1:4, Normal..."
                  className="prenatal-card__input"
                />
                <span style={{ fontSize: '0.6875rem', color: 'var(--prenatal-brand-muted)', marginTop: '0.25rem', display: 'block' }}>
                  A data informada será adicionada automaticamente ao laudo na formatação oficial.
                </span>
              </div>

              <div className="prenatal-card__modal-footer">
                <button
                  type="button"
                  className="prenatal-card__btn-secondary"
                  onClick={() => setSerologyModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="prenatal-card__btn-primary"
                >
                  Salvar Exame
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE VACINA */}
      {vaccineModalOpen && editingVaccine && (
        <div className="prenatal-card__modal-overlay">
          <div className="prenatal-card__modal-dialog">
            <div className="prenatal-card__modal-header">
              <h4 className="prenatal-card__modal-title">
                <Syringe style={{ width: 18, height: 18, color: 'var(--prenatal-brand-primary)' }} />
                Editar Vacina: {editingVaccine.name}
              </h4>
              <button
                type="button"
                className="prenatal-card__modal-close"
                onClick={() => setVaccineModalOpen(false)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVaccineForm} className="prenatal-card__form">
              <div className="prenatal-card__field">
                <label className="prenatal-card__field-label">Status da Vacina *</label>
                <select
                  value={vacStatusInput}
                  onChange={(e) => setVacStatusInput(e.target.value as MaternalVaccineItem['status'])}
                  className="prenatal-card__input"
                >
                  <option value="Aplicada">Aplicada</option>
                  <option value="Agendada">Agendada</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Não indicada">Não indicada</option>
                </select>
              </div>

              {vacStatusInput === 'Aplicada' && (
                <div className="prenatal-card__form-grid-2">
                  <div className="prenatal-card__field">
                    <label className="prenatal-card__field-label">Data da Aplicação *</label>
                    <input
                      type="text"
                      value={vacDateInput}
                      onChange={(e) => setVacDateInput(e.target.value)}
                      placeholder="DD/MM/AAAA ou Hoje"
                      className="prenatal-card__input"
                    />
                  </div>
                  <div className="prenatal-card__field">
                    <label className="prenatal-card__field-label">Lote da Vacina</label>
                    <input
                      type="text"
                      value={vacLotInput}
                      onChange={(e) => setVacLotInput(e.target.value)}
                      placeholder="Ex: AD24B918"
                      className="prenatal-card__input"
                    />
                  </div>
                </div>
              )}

              {vacStatusInput === 'Agendada' && (
                <div className="prenatal-card__field">
                  <label className="prenatal-card__field-label">Previsão / Janela Agendada</label>
                  <input
                    type="text"
                    value={vacDateInput}
                    onChange={(e) => setVacDateInput(e.target.value)}
                    placeholder="Ex: Prevista para 28ª sem"
                    className="prenatal-card__input"
                  />
                </div>
              )}

              <div className="prenatal-card__modal-footer">
                <button
                  type="button"
                  className="prenatal-card__btn-secondary"
                  onClick={() => setVaccineModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="prenatal-card__btn-primary"
                >
                  Salvar Vacina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cartão da Gestante A4 — 6 Páginas */}
      <PrenatalCardA4Modal
        open={a4ModalOpen}
        onClose={() => setA4ModalOpen(false)}
        patientId={patientId}
        patientName={patientName}
        patientBirthDate={patientBirthDate}
        bloodType={bloodType}
        rhFactor={rhFactor}
        gynProfile={gynProfile}
        dum={dum}
        dpp={effectiveDpp}
        heightCm={heightCm}
        visits={visits}
        vaccines={vaccines}
        serologies={serologies}
      />
    </div>
  );
};
