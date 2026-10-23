import {beforeEach, describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import App from './App';
import {demoStore} from './services/demoStore';

beforeEach(() => demoStore.reset());
const render = (path:string) => renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><App/></MemoryRouter>);

describe('Interfaces administrativas e visualização por cadastro', () => {
  it.each([
    ['/admin/dashboard','Tudo sob seu cuidado.'],
    ['/admin/patients','Gestão de pacientes'],
    ['/admin/doctors','Equipe médica'],
    ['/admin/requests','Central de atendimentos'],
    ['/admin/appointments','Agenda de consultas']
  ])('renderiza %s', (path,title) => {
    expect(render(path)).toContain(title);
  });

  it('reflete edições e seleção da paciente no dashboard', () => {
    const patient = demoStore.getSnapshot().patients[1];
    demoStore.savePatient({...patient,name:'Beatriz Teste',week:31});
    demoStore.selectPatient(patient.id);
    const html = render('/patient/dashboard');
    expect(html).toContain('Olá, Beatriz!');
    expect(html).toContain('31ª semana');
    expect(html).toContain('Terceiro trimestre');
  });

  it('mostra ao médico selecionado somente a fila que lhe foi atribuída', () => {
    const request = demoStore.getSnapshot().requests[0];
    demoStore.saveRequest({...request,doctorId:'d2'});
    demoStore.selectDoctor('d2');
    const html = render('/doctor/requests');
    expect(html).toContain(request.title);
    expect(html).toContain('Mariana Oliveira');
    expect(html).not.toContain('Solicitação de retorno');
  });

  it('renderiza com cadastros vazios sem quebrar o dashboard ou a interface da paciente', () => {
    demoStore.getSnapshot().patients.forEach(p => demoStore.removePatient(p.id));
    demoStore.getSnapshot().doctors.forEach(d => demoStore.removeDoctor(d.id));
    expect(render('/admin/dashboard')).toContain('Nenhum atendimento cadastrado.');
    expect(render('/patient/dashboard')).toContain('Nenhuma paciente cadastrada');
    expect(render('/doctor/dashboard')).toContain('equipe médica');
  });
});
