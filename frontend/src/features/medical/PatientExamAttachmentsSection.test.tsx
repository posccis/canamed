import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PatientExamAttachmentsSection } from './PatientExamAttachmentsSection';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPostForm: vi.fn(),
  apiDelete: vi.fn(),
}));

vi.mock('../../api/client', () => ({
  ApiError: class ApiError extends Error {
    public readonly status: number;
    public constructor(status: number, title: string) {
      super(title);
      this.status = status;
    }
  },
  apiGet: mocks.apiGet,
  apiPostForm: mocks.apiPostForm,
  apiDelete: mocks.apiDelete,
}));

describe('PatientExamAttachmentsSection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza os exames anexados anteriores com badges, laboratório e botão de download', async () => {
    mocks.apiGet.mockImplementation(async (path: string) => {
      if (path === '/patients/pat-10/exam-attachments') {
        return [
          {
            id: 'att-1',
            patientId: 'pat-10',
            examType: 'mamografia',
            title: 'Mamografia Bilateral 2025',
            fileName: 'laudo_mamografia_2025.pdf',
            contentType: 'application/pdf',
            fileSizeBytes: 1048576,
            examDate: '2025-11-15',
            labFacility: 'Laboratório Mulher & Imagem',
            notes: 'BI-RADS 2 - Achados benignos bilaterais',
            fileHash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            uploadedByUserId: 'u1',
            uploadedByName: 'Dra. Gabriela',
            isActive: true,
            createdAt: '2026-10-09T10:00:00Z',
          },
          {
            id: 'att-2',
            patientId: 'pat-10',
            examType: 'usg_transvaginal',
            title: 'Ultrassonografia Pélvica Transvaginal',
            fileName: 'eco_transvaginal.png',
            contentType: 'image/png',
            fileSizeBytes: 524288,
            examDate: '2026-02-10',
            labFacility: 'Centro Diagnóstico Recife',
            notes: 'Útero em AVF, eco endometrial 4mm, anexos sem anormalidades',
            fileHash: '123456abcdef7890123456abcdef7890123456abcdef7890123456abcdef7890',
            uploadedByUserId: 'u1',
            uploadedByName: 'Dra. Gabriela',
            isActive: true,
            createdAt: '2026-10-09T11:00:00Z',
          },
        ];
      }
      return [];
    });

    render(<PatientExamAttachmentsSection patientId="pat-10" canEdit={true} />);

    expect(screen.getByRole('heading', { name: /Exames Anteriores Trazidos pela Paciente/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Mamografia Bilateral 2025')).toBeInTheDocument();
      expect(screen.getByText(/Mamografia Digital/i)).toBeInTheDocument();
      expect(screen.getByText(/Laboratório Mulher & Imagem/i)).toBeInTheDocument();
      expect(screen.getByText(/BI-RADS 2/i)).toBeInTheDocument();

      expect(screen.getByText('Ultrassonografia Pélvica Transvaginal')).toBeInTheDocument();
      expect(screen.getByText(/Centro Diagnóstico Recife/i)).toBeInTheDocument();
    });

    expect(screen.getByText('+ Anexar Novo Exame')).toBeInTheDocument();
  });
});
