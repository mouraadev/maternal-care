import {beforeEach, describe, expect, it, vi} from 'vitest';
import {demoStore} from './demoStore';

beforeEach(() => {
  const storage = new Map<string,string>();
  vi.stubGlobal('localStorage', {getItem:(key:string)=>storage.get(key)??null,setItem:(key:string,value:string)=>storage.set(key,value)});
  demoStore.reset();
});

describe('Gestão administrativa da demonstração', () => {
  it('mantém o responsável do atendimento quando o vínculo principal muda', () => {
    const patient = demoStore.getSnapshot().patients[0];
    demoStore.savePatient({...patient,doctorId:'d2'});
    expect(demoStore.getSnapshot().patients[0].doctorId).toBe('d2');
    expect(demoStore.getSnapshot().requests.find(r=>r.patientId===patient.id)?.doctorId).toBe('d1');
    demoStore.addRequest(patient.id,'Retorno','Novo pedido de acompanhamento');
    expect(demoStore.getSnapshot().requests[0].doctorId).toBe('d2');
  });

  it('permite reatribuir atendimento e atualizar o status sem duplicar o registro', () => {
    const request = demoStore.getSnapshot().requests[0];
    const count = demoStore.getSnapshot().requests.length;
    demoStore.saveRequest({...request,doctorId:'d2'});
    demoStore.updateRequest(request.id,'Concluído');
    expect(demoStore.getSnapshot().requests).toHaveLength(count);
    expect(demoStore.getSnapshot().requests.find(r=>r.id===request.id)).toMatchObject({doctorId:'d2',status:'Concluído'});
  });

  it('bloqueia atribuições a médicos ou pacientes inexistentes', () => {
    const request = demoStore.getSnapshot().requests[0];
    expect(()=>demoStore.saveRequest({...request,doctorId:'inexistente'})).toThrow('Médico não encontrado');
    expect(()=>demoStore.saveRequest({...request,patientId:'inexistente'})).toThrow('Paciente não encontrada');
  });

  it('impede excluir médico ainda referenciado', () => {
    expect(()=>demoStore.removeDoctor('d1')).toThrow('Reatribua');
    demoStore.removeDoctor('d2');
    expect(demoStore.getSnapshot().doctors.map(d=>d.id)).toEqual(['d1']);
  });

  it('remove registros associados à paciente excluída', () => {
    demoStore.removePatient('p1');
    const data = demoStore.getSnapshot();
    expect(data.patients.some(p=>p.id==='p1')).toBe(false);
    expect(data.requests.some(r=>r.patientId==='p1')).toBe(false);
    expect(data.appointments.some(a=>a.patientId==='p1')).toBe(false);
  });

  it('edita data, profissional e status da consulta sem alterar as demais', () => {
    const appointment = demoStore.getSnapshot().appointments[0];
    const unchanged = demoStore.getSnapshot().appointments[1];
    demoStore.saveAppointment({...appointment,date:'2026-11-10',doctorId:'d2',status:'Em andamento'});
    expect(demoStore.getSnapshot().appointments[0]).toMatchObject({date:'2026-11-10',doctorId:'d2',status:'Em andamento'});
    expect(demoStore.getSnapshot().appointments[1]).toEqual(unchanged);
  });

  it('persiste as alterações e a seleção de visualização', () => {
    demoStore.selectPatient('p3');
    demoStore.selectDoctor('d2');
    const saved = JSON.parse(localStorage.getItem('maternal-care-demo-v1')!);
    expect(saved.selectedPatientId).toBe('p3');
    expect(saved.selectedDoctorId).toBe('d2');
    expect(saved.doctors).toHaveLength(2);
  });

  it('migra dados anteriores sem descartar pacientes ou solicitações', async () => {
    const old = demoStore.getSnapshot();
    localStorage.setItem('maternal-care-demo-v1',JSON.stringify({patients:old.patients,requests:old.requests.map(({doctorId:_,...r})=>r)}));
    vi.resetModules();
    const migrated = (await import('./demoStore')).demoStore.getSnapshot();
    expect(migrated.patients).toEqual(old.patients);
    expect(migrated.requests).toHaveLength(old.requests.length);
    expect(migrated.requests[0].doctorId).toBe('d1');
    expect(migrated.doctors).toHaveLength(2);
  });
});
