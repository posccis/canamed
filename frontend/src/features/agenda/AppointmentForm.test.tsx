import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppointmentForm } from './AppointmentForm';
import type { Appointment, AppointmentType, Patient, Professional } from './agendaApi';
import { localInputToUtcIso } from './agendaFormat';

vi.mock('./agendaApi', async () => {
  const actual = await vi.importActual('./agendaApi');
  return {
    ...actual,
    createAppointment: vi.fn(),
  };
});

describe('AppointmentForm - Recepção Inteligente & Conflitos', () => {
  const mockProfessionals: Professional[] = [
    { id: 'prof-1', name: 'Dra. Helena Martins', isActive: true, specialtyId: null, specialtyName: 'Ginecologia' },
  ];

  const mockPatients: Patient[] = [
    { id: 'pat-1', name: 'Ana Souza', phone: '81999990001', email: null, birthDate: '1995-03-20', isActive: true },
    { id: 'pat-2', name: 'Beatriz Lima', phone: '81999990002', email: null, birthDate: '1991-07-15', isActive: true },
  ];

  const mockTypes: AppointmentType[] = [
    { id: 'type-1', name: 'Consulta Ginecológica', durationMinutes: 30, category: 'consulta', coverage: 'particular', isActive: true, specialtyId: null, specialtyName: null },
  ];

  it('exibe o campo de autocomplete preditivo de pacientes', () => {
    render(
      <AppointmentForm
        professionals={mockProfessionals}
        patients={mockPatients}
        appointmentTypes={mockTypes}
        defaultProfessionalId="prof-1"
        defaultDate="2026-10-26"
        onCreated={vi.fn()}
        onRegistered={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText(/Buscar paciente por nome, CPF ou telefone/i)).toBeInTheDocument();
  });

  it('exibe banner de aviso de conflito quando o horário selecionado coincide com outro agendamento ativo do mesmo profissional', () => {
    const existingAppointments: Appointment[] = [
      {
        id: 'appt-1',
        professionalId: 'prof-1',
        patientId: 'pat-2',
        patientName: 'Beatriz Lima',
        startsAt: localInputToUtcIso('2026-10-26T14:00')!,
        endsAt: localInputToUtcIso('2026-10-26T14:30')!,
        status: 'agendado',
        appointmentTypeId: 'type-1',
        appointmentTypeName: 'Consulta Ginecológica',
        category: 'consulta',
        coverage: 'particular',
        specialtyName: 'Ginecologia',
        roomId: null,
        roomName: null,
        durationMinutes: 30,
        cancellationReason: null,
        createdAt: '2026-10-25T10:00:00Z',
        updatedAt: '2026-10-25T10:00:00Z',
      },
    ];

    render(
      <AppointmentForm
        professionals={mockProfessionals}
        patients={mockPatients}
        appointmentTypes={mockTypes}
        existingAppointments={existingAppointments}
        defaultProfessionalId="prof-1"
        defaultDate="2026-10-26"
        onCreated={vi.fn()}
        onRegistered={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // O horário padrão é 14:00, que coincide exatamente com appt-1
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/Aviso de Conflito de Horário/i);
    expect(alert).toHaveTextContent(/Beatriz Lima/i);
  });
});
