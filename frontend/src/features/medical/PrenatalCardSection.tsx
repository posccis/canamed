import React, { useState } from 'react';
import { Download, Plus, Baby, Calendar, Scale, Activity } from 'lucide-react';
import { useToast } from '../layout/Toast';
import { AtalahWeightGainChart } from './AtalahWeightGainChart';
import { UterineHeightChart } from './UterineHeightChart';
import type { PrenatalVisitDto } from './medicalRecordsApi';

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

export interface PrenatalCardSectionProps {
  patientId: string;
  patientName: string;
  visits: PrenatalVisitItem[];
  onAddVisit?: (visit: Omit<PrenatalVisitItem, 'id'>) => Promise<void>;
  loading?: boolean;
}

export const PrenatalCardSection: React.FC<PrenatalCardSectionProps> = ({
  patientId,
  patientName,
  visits,
  onAddVisit,
  loading = false,
}) => {
  const { addToast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [weeks, setWeeks] = useState('12');
  const [days, setDays] = useState('0');
  const [weight, setWeight] = useState('');
  const [bp, setBp] = useState('');
  const [uterineHeight, setUterineHeight] = useState('');
  const [fhr, setFhr] = useState('');
  const [movement, setMovement] = useState<boolean | null>(true);
  const [edema, setEdema] = useState('Ausente');
  const [presentation, setPresentation] = useState('Cefálica');
  const [notes, setNotes] = useState('');

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const res = await fetch(`/api/v1/patients/${patientId}/prenatal-card/pdf`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('canamed_token') || ''}`,
        },
      });

      if (!res.ok) {
        throw new Error('Não foi possível gerar o Cartão da Gestante em PDF.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cartao-gestante-${patientName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addToast('Cartão da Gestante baixado com sucesso.', 'success');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Erro ao baixar PDF.', 'error');
    } finally {
      setDownloading(false);
    }
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
          gestationalAgeWeeks: parseInt(weeks, 10),
          gestationalAgeDays: parseInt(days, 10),
          weightKg: parseFloat(weight),
          bloodPressure: bp.trim(),
          uterineHeightCm: uterineHeight ? parseFloat(uterineHeight) : null,
          fetalHeartRateBpm: fhr ? parseInt(fhr, 10) : null,
          fetalMovementPresent: movement,
          edemaClassification: edema,
          fetalPresentation: presentation,
          clinicalNotes: notes.trim() || null,
        });
        addToast('Consulta pré-natal registrada com sucesso.', 'success');
        setModalOpen(false);
      }
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Falha ao registrar consulta.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      data-testid="prenatal-card-section"
      className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-pink-50 text-pink-700">
            <Baby className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-800">
              Cartão da Gestante & Consultas de Pré-Natal
            </h3>
            <p className="text-xs text-neutral-500">
              Acompanhamento longitudinal de evolução materno-fetal padrão FEBRASGO
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onAddVisit && (
            <button
              type="button"
              className="button button--secondary button--small flex items-center gap-1.5"
              onClick={() => setModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              + Nova Consulta
            </button>
          )}

          <button
            type="button"
            className="button button--primary button--small flex items-center gap-1.5"
            onClick={handleDownloadPdf}
            disabled={downloading || visits.length === 0}
          >
            <Download className="w-3.5 h-3.5" />
            {downloading ? 'Gerando...' : 'Exportar Cartão (PDF)'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-neutral-400">Carregando consultas pré-natais...</div>
      ) : visits.length === 0 ? (
        <div className="py-8 text-center bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
          <Calendar className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-neutral-600">Nenhuma consulta pré-natal registrada</p>
          <p className="text-xs text-neutral-400 mt-0.5">
            Clique em "+ Nova Consulta" para lançar os parâmetros da visita obstétrica.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 font-semibold">
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">IG (Sem/D)</th>
                <th className="py-2.5 px-3">Peso (kg)</th>
                <th className="py-2.5 px-3">PA (mmHg)</th>
                <th className="py-2.5 px-3">AU (cm)</th>
                <th className="py-2.5 px-3">BCF (bpm)</th>
                <th className="py-2.5 px-3">Mov. Fetal</th>
                <th className="py-2.5 px-3">Edema</th>
                <th className="py-2.5 px-3">Apresentação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {visits.map((v) => (
                <tr key={v.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-neutral-800">
                    {new Date(v.visitDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-2.5 px-3 text-neutral-700">
                    {v.gestationalAgeWeeks}s {v.gestationalAgeDays}d
                  </td>
                  <td className="py-2.5 px-3 text-neutral-700">{v.weightKg.toFixed(1)}</td>
                  <td className="py-2.5 px-3 font-medium text-neutral-800">{v.bloodPressure}</td>
                  <td className="py-2.5 px-3 text-neutral-600">{v.uterineHeightCm ?? '-'}</td>
                  <td className="py-2.5 px-3 text-neutral-600">{v.fetalHeartRateBpm ?? '-'}</td>
                  <td className="py-2.5 px-3 text-neutral-600">
                    {v.fetalMovementPresent === true
                      ? 'Presente'
                      : v.fetalMovementPresent === false
                      ? 'Ausente'
                      : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-neutral-600">{v.edemaClassification || 'Ausente'}</td>
                  <td className="py-2.5 px-3 text-neutral-600">{v.fetalPresentation || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Curvas Obstétricas Automatizadas (Atalah e Altura Uterina) */}
      {visits.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
          <AtalahWeightGainChart
            visits={visits.map((v) => ({
              ...v,
              clinicId: '',
              patientId,
              medicalRecordId: null,
              maternalBmi: v.bmi,
              systolicBp: null,
              diastolicBp: null,
              conductNotes: v.clinicalNotes,
              createdAt: '',
            }))}
          />
          <UterineHeightChart
            visits={visits.map((v) => ({
              ...v,
              clinicId: '',
              patientId,
              medicalRecordId: null,
              maternalBmi: v.bmi,
              systolicBp: null,
              diastolicBp: null,
              conductNotes: v.clinicalNotes,
              createdAt: '',
            }))}
          />
        </div>
      )}

      {/* Modal de Registro de Consulta Pré-Natal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-neutral-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-neutral-800 text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-pink-600" />
                Registrar Consulta de Pré-Natal
              </h4>
              <button
                type="button"
                className="text-neutral-400 hover:text-neutral-600 font-bold"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVisit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Data da Consulta *</label>
                  <input
                    type="date"
                    required
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full border rounded-lg p-2 border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">PA (mmHg) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 120/80"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    className="w-full border rounded-lg p-2 border-neutral-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">IG Semanas *</label>
                  <input
                    type="number"
                    min="0"
                    max="44"
                    required
                    value={weeks}
                    onChange={(e) => setWeeks(e.target.value)}
                    className="w-full border rounded-lg p-2 border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">IG Dias</label>
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="w-full border rounded-lg p-2 border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Peso (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="20"
                    max="300"
                    required
                    placeholder="65.0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full border rounded-lg p-2 border-neutral-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">AU (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="24"
                    value={uterineHeight}
                    onChange={(e) => setUterineHeight(e.target.value)}
                    className="w-full border rounded-lg p-2 border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">BCF (bpm)</label>
                  <input
                    type="number"
                    placeholder="145"
                    value={fhr}
                    onChange={(e) => setFhr(e.target.value)}
                    className="w-full border rounded-lg p-2 border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Edema</label>
                  <select
                    value={edema}
                    onChange={(e) => setEdema(e.target.value)}
                    className="w-full border rounded-lg p-2 border-neutral-300"
                  >
                    <option value="Ausente">Ausente</option>
                    <option value="+/4+">+/4+</option>
                    <option value="++/4+">++/4+</option>
                    <option value="+++/4+">+++/4+</option>
                    <option value="++++/4+">++++/4+</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  className="button button--secondary button--small"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="button button--primary button--small"
                >
                  {saving ? 'Gravando...' : 'Salvar Consulta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
