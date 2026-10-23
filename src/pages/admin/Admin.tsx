import {useState, type FormEvent, type ReactNode} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {Activity, ArrowRight, CheckCircle2, ClipboardList, Clock, Pencil, Plus, Search, ShieldCheck, Stethoscope, Trash2, Users} from 'lucide-react';
import {Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {Avatar, Empty, SectionTitle, StatCard, StatusBadge} from '../../components/UI';
import {demoStore, useDemoData} from '../../services/demoStore';
import {formatDate} from '../../data/seed';
import type {RequestStatus} from '../../types';
import './admin.css';
import {createDemoId} from '../../utils/id';

type Section = 'dashboard'|'patients'|'doctors'|'requests'|'appointments';
const statuses:RequestStatus[] = ['Pendente','Em andamento','Concluído'];
const colors = ['#d8b373','#9b80cf','#77ae99'];
const titles = {dashboard:'Tudo sob seu cuidado.',patients:'Gestão de pacientes',doctors:'Equipe médica',requests:'Central de atendimentos',appointments:'Agenda de consultas'};
const descriptions = {dashboard:'Uma visão de cada atendimento, de quem cuida e de quem precisa de atenção.',patients:'Cadastre gestantes, atualize o acompanhamento e defina o médico responsável.',doctors:'Organize os profissionais e acompanhe a distribuição dos cuidados.',requests:'Atribua responsáveis, ajuste prioridades e acompanhe cada etapa.',appointments:'Organize datas, horários, profissionais e o andamento das consultas.'};

function Field({name,label,value='',type='text',required=true,min,max,children}:{name:string;label:string;value?:string|number;type?:string;required?:boolean;min?:number;max?:number;children?:ReactNode}) {
  return <label className="admin-field"><span>{label}</span>{children ? <select name={name} defaultValue={value} required={required}>{children}</select> : type==='textarea' ? <textarea name={name} defaultValue={value} rows={3} required={required} maxLength={2000}/> : <input name={name} defaultValue={value} type={type} required={required} min={min} max={max} maxLength={200}/>}</label>;
}
function Progress({status}:{status:RequestStatus}) {
  const position = statuses.indexOf(status);
  return <div className="admin-steps" aria-label={`Progresso: ${status}`}>{statuses.map((step,index) => <span key={step} className={index<=position?'reached':''}><i>{index<position?'✓':index+1}</i>{step}</span>)}</div>;
}

export default function Admin({section}:{section:Section}) {
  const data = useDemoData();
  const navigate = useNavigate();
  const [search,setSearch] = useState('');
  const [status,setStatus] = useState('Todos');
  const [doctorFilter,setDoctorFilter] = useState('Todos');
  const [editor,setEditor] = useState<string|null>(null);
  const [notice,setNotice] = useState('');
  const [error,setError] = useState('');
  const patientName = (id:string) => data.patients.find(p => p.id===id)?.name ?? 'Paciente removida';
  const doctorName = (id?:string) => data.doctors.find(d => d.id===id)?.name ?? 'Sem responsável';
  const openPatient = (id:string) => { demoStore.selectPatient(id); navigate('/patient/dashboard'); };
  const openDoctor = (id:string) => { demoStore.selectDoctor(id); navigate('/doctor/dashboard'); };
  function action(operation:() => void, message='Alterações salvas neste navegador.') {
    setError(''); setNotice('');
    try { operation(); setNotice(message); return true; }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.'); return false; }
  }
  function remove(operation:() => void, message:string) {
    if (window.confirm(message)) action(operation,'Registro excluído da demonstração.');
  }
  function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const get = (name:string) => String(form.get(name)??'').trim();
    const id = editor==='new' ? createDemoId() : editor!;
    const success = action(() => {
      if (section==='doctors') demoStore.saveDoctor({id,name:get('name'),email:get('email'),specialty:get('specialty'),registration:get('registration')});
      if (section==='patients') demoStore.savePatient({id,name:get('name'),initials:get('name').split(/\s+/).slice(0,2).map(n => n[0]).join('').toUpperCase(),doctorId:get('doctorId'),week:Number(get('week')),dueDate:get('dueDate'),lastVisit:get('lastVisit'),nextVisit:get('nextVisit'),notes:get('notes'),color:'pink'});
      if (section==='requests') demoStore.saveRequest({id,patientId:get('patientId'),doctorId:get('doctorId'),title:get('title'),description:get('description'),date:get('date'),priority:get('priority') as 'Normal'|'Alta',status:get('status') as RequestStatus});
      if (section==='appointments') demoStore.saveAppointment({id,patientId:get('patientId'),doctorId:get('doctorId'),date:get('date'),time:get('time'),type:get('type'),status:get('status') as RequestStatus});
    });
    if (success) setEditor(null);
  }
  const patient = data.patients.find(p => p.id===editor);
  const doctor = data.doctors.find(d => d.id===editor);
  const request = data.requests.find(r => r.id===editor);
  const appointment = data.appointments.find(a => a.id===editor);
  const doctorOptions = <><option value="">Sem responsável</option>{data.doctors.map(d => <option value={d.id} key={d.id}>{d.name}</option>)}</>;
  const patientOptions = <><option value="" disabled>Selecione uma paciente</option>{data.patients.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</>;
  const statusOptions = statuses.map(s => <option key={s}>{s}</option>);
  const metrics = statuses.map((name,index) => ({name,total:data.requests.filter(r => r.status===name).length,color:colors[index]}));
  const completed = metrics[2].total;
  const rate = data.requests.length ? Math.round(completed/data.requests.length*100) : 0;
  const matches = (text:string) => text.toLocaleLowerCase().includes(search.toLocaleLowerCase());
  const filteredRequests = data.requests.filter(r => matches(`${r.title} ${patientName(r.patientId)} ${doctorName(r.doctorId)}`) && (status==='Todos'||r.status===status) && (doctorFilter==='Todos'||(r.doctorId??'')===doctorFilter));
  const filteredAppointments = data.appointments.filter(a => matches(`${a.type} ${patientName(a.patientId)} ${doctorName(a.doctorId)}`) && (status==='Todos'||a.status===status) && (doctorFilter==='Todos'||(a.doctorId??'')===doctorFilter));

  return <>
    <div className="admin-heading"><div className="page-head"><span className="eyebrow">CENTRAL ADMINISTRATIVA</span><h1>{titles[section]}</h1><p>{descriptions[section]}</p></div>{section!=='dashboard' && <button className="primary-btn" onClick={() => {setEditor('new');setError('');setNotice('');}}><Plus size={17}/>{section==='patients'?'Nova paciente':section==='doctors'?'Novo médico':section==='requests'?'Novo atendimento':'Nova consulta'}</button>}</div>
    <div className="admin-demo-note"><ShieldCheck size={17}/><span>Ambiente de demonstração · Cadastros e alterações ficam neste navegador. O cadastro não cria contas de acesso no Firebase.</span></div>
    {notice && <p className="admin-notice" role="status">{notice}</p>}{error && <p className="admin-error" role="alert">{error}</p>}

    {editor && <section className="panel admin-editor"><SectionTitle title={editor==='new'?'Novo cadastro':'Editar cadastro'} subtitle="Preencha as informações e salve para atualizar todas as interfaces."/><form key={editor} onSubmit={submit}><div className="admin-form-grid">
      {section==='doctors' && <><Field name="name" label="Nome completo" value={doctor?.name}/><Field name="email" label="E-mail" type="email" value={doctor?.email}/><Field name="specialty" label="Especialidade" value={doctor?.specialty}/><Field name="registration" label="Registro profissional (demonstração)" value={doctor?.registration}/></>}
      {section==='patients' && <><Field name="name" label="Nome completo" value={patient?.name}/><Field name="doctorId" label="Médico de acompanhamento" value={patient?.doctorId} required={false}>{doctorOptions}</Field><Field name="week" label="Semana gestacional" type="number" value={patient?.week??0} min={0} max={45}/><Field name="dueDate" label="Previsão de parto" type="date" value={patient?.dueDate}/><Field name="lastVisit" label="Última consulta" type="date" value={patient?.lastVisit}/><Field name="nextVisit" label="Próximo acompanhamento" type="date" value={patient?.nextVisit}/><Field name="notes" label="Notas de acompanhamento" type="textarea" value={patient?.notes} required={false}/></>}
      {(section==='requests'||section==='appointments') && <><Field name="patientId" label="Paciente" value={request?.patientId??appointment?.patientId??''}>{patientOptions}</Field><Field name="doctorId" label="Médico deste atendimento" value={request?.doctorId??appointment?.doctorId??''} required={false}>{doctorOptions}</Field><Field name="date" label="Data" type="date" value={request?.date??appointment?.date??new Date().toISOString().slice(0,10)}/><Field name="status" label="Status" value={request?.status??appointment?.status??'Pendente'}>{statusOptions}</Field></>}
      {section==='requests' && <><Field name="title" label="Assunto" value={request?.title}/><Field name="priority" label="Prioridade" value={request?.priority??'Normal'}><option>Normal</option><option>Alta</option></Field><Field name="description" label="Descrição" type="textarea" value={request?.description}/></>}
      {section==='appointments' && <><Field name="type" label="Tipo da consulta" value={appointment?.type}/><Field name="time" label="Horário" type="time" value={appointment?.time}/></>}
    </div><div className="admin-actions"><button type="submit" className="primary-btn">Salvar alterações</button><button type="button" className="admin-button" onClick={() => setEditor(null)}>Cancelar</button></div></form></section>}

    {section==='dashboard' ? <>
      <div className="stats-grid"><StatCard label="Pacientes cadastradas" value={data.patients.length} detail={`${data.patients.filter(p => !p.doctorId).length} sem médico vinculado`} icon={<Users size={20}/>}/><StatCard label="Profissionais" value={data.doctors.length} detail="Equipe disponível na demonstração" icon={<Stethoscope size={20}/>}/><StatCard label="Atendimentos em aberto" value={data.requests.length-completed} detail={`${metrics[0].total} pendentes · ${metrics[1].total} em andamento`} icon={<Clock size={20}/>}/><StatCard label="Taxa de conclusão" value={`${rate}%`} detail={`${completed} de ${data.requests.length} atendimentos concluídos`} icon={<CheckCircle2 size={20}/>}/></div>
      <div className="admin-interface-grid"><Link to="/doctor/dashboard" className="admin-interface"><span className="stat-icon"><Stethoscope size={22}/></span><div><h3>Interface do médico</h3><p>Veja a fila, as pacientes e edite o acompanhamento.</p></div><ArrowRight size={20}/></Link><Link to="/patient/dashboard" className="admin-interface"><span className="stat-icon pink"><HeartIcon/></span><div><h3>Interface da paciente</h3><p>Visualize a gestação, consultas e solicitações.</p></div><ArrowRight size={20}/></Link></div>
      <div className="two-columns"><section className="panel"><SectionTitle title="Panorama dos atendimentos" subtitle="Contagem atual por status, sem dados simulados no gráfico"/>{data.requests.length ? <div className="admin-chart"><ResponsiveContainer width="100%" height={230}><BarChart data={metrics}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis allowDecimals={false} width={25}/><Tooltip/><Bar dataKey="total" name="Atendimentos" radius={[8,8,0,0]}>{metrics.map(m => <Cell key={m.name} fill={m.color}/>)}</Bar></BarChart></ResponsiveContainer></div> : <Empty text="Nenhum atendimento cadastrado."/>}</section><section className="panel"><SectionTitle title="Pontos de atenção" subtitle="Pendências para organizar o cuidado"/><div className="admin-attention"><Link to="/admin/requests"><ClipboardList size={19}/><span>Atendimentos sem responsável</span><strong>{data.requests.filter(r => !r.doctorId).length}</strong></Link><Link to="/admin/requests"><Activity size={19}/><span>Prioridade alta em aberto</span><strong>{data.requests.filter(r => r.priority==='Alta'&&r.status!=='Concluído').length}</strong></Link><Link to="/admin/patients"><Users size={19}/><span>Pacientes sem médico</span><strong>{data.patients.filter(p => !p.doctorId).length}</strong></Link></div><div className="admin-completion"><span>Atendimentos concluídos <strong>{rate}%</strong></span><progress value={rate} max={100} aria-label="Percentual de atendimentos concluídos"/></div></section></div>
      <section className="panel"><SectionTitle title="Progresso dos atendimentos" subtitle="Etapas operacionais: pendente, em andamento e concluído" action={<Link to="/admin/requests" className="text-link">Gerenciar todos <ArrowRight size={15}/></Link>}/>{data.requests.length===0?<Empty text="Nenhum atendimento cadastrado."/>:data.requests.slice(0,6).map(r => <article className="admin-progress-row" key={r.id}><div><strong>{r.title}</strong><p>{patientName(r.patientId)} · {doctorName(r.doctorId)}</p></div><Progress status={r.status}/><StatusBadge status={r.status}/></article>)}</section>
      <section className="panel"><SectionTitle title="Distribuição por profissional" subtitle="Vínculos de acompanhamento e responsabilidade por atendimento são independentes"/>{data.doctors.length===0?<Empty text="Nenhum médico cadastrado."/>:data.doctors.map(d => <div className="admin-workload" key={d.id}><Avatar initials={d.name.split(' ').slice(0,2).map(n=>n[0]).join('')} color="mint"/><div><strong>{d.name}</strong><p>{data.patients.filter(p=>p.doctorId===d.id).length} pacientes · {data.requests.filter(r=>r.doctorId===d.id&&r.status!=='Concluído').length} atendimentos em aberto</p></div><button className="admin-button" onClick={()=>openDoctor(d.id)}>Abrir interface <ArrowRight size={14}/></button></div>)}</section>
    </> : <section className="panel">
      <div className="admin-filters"><label className="search-box"><Search size={18}/><input aria-label="Buscar registros" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome ou assunto…"/></label>{(section==='requests'||section==='appointments')&&<><select aria-label="Filtrar por status" value={status} onChange={e=>setStatus(e.target.value)}><option>Todos</option>{statusOptions}</select><select aria-label="Filtrar por médico" value={doctorFilter} onChange={e=>setDoctorFilter(e.target.value)}><option value="Todos">Todos os médicos</option>{doctorOptions}</select></>}</div>
      {section==='patients' && <><div className="admin-table-note">O médico de acompanhamento recebe novas solicitações. Atendimentos já existentes mantêm seu responsável e podem ser reatribuídos na central.</div><div className="table-scroll"><table className="data-table"><thead><tr><th>Paciente</th><th>Gestação</th><th>Médico responsável</th><th>Ações</th></tr></thead><tbody>{data.patients.filter(p=>matches(p.name)).map(p=><tr key={p.id}><td><div className="table-person"><Avatar initials={p.initials} color={p.color}/><strong>{p.name}</strong></div></td><td>{p.week}ª semana<br/><small>Previsão: {formatDate(p.dueDate)}</small></td><td><select aria-label={`Médico responsável por ${p.name}`} value={p.doctorId} onChange={e=>action(()=>demoStore.savePatient({...p,doctorId:e.target.value}))}>{doctorOptions}</select></td><td><div className="admin-row-actions"><button onClick={()=>openPatient(p.id)} className="admin-button">Abrir interface</button><button className="admin-icon-button" aria-label={`Editar ${p.name}`} onClick={()=>setEditor(p.id)}><Pencil size={16}/></button><button className="admin-icon-button danger" aria-label={`Excluir ${p.name}`} onClick={()=>remove(()=>demoStore.removePatient(p.id),'Excluir esta paciente e todos os seus atendimentos e consultas da demonstração?')}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>{!data.patients.some(p=>matches(p.name))&&<Empty text="Nenhuma paciente encontrada."/>}</>}
      {section==='doctors' && <div className="admin-doctor-grid">{data.doctors.filter(d=>matches(`${d.name} ${d.specialty} ${d.email}`)).map(d=><article className="request-card" key={d.id}><Avatar initials="DR" color="mint"/><h3 className="admin-doctor-name">{d.name}</h3><p className="muted small">{d.specialty}<br/>{d.email}<br/>{d.registration}</p><div className="admin-doctor-count">{data.patients.filter(p=>p.doctorId===d.id).length} pacientes vinculadas</div><div className="admin-row-actions"><button className="admin-button" onClick={()=>openDoctor(d.id)}>Abrir interface</button><button className="admin-icon-button" aria-label={`Editar ${d.name}`} onClick={()=>setEditor(d.id)}><Pencil size={16}/></button><button className="admin-icon-button danger" aria-label={`Excluir ${d.name}`} onClick={()=>remove(()=>demoStore.removeDoctor(d.id),'Excluir este médico da demonstração?')}><Trash2 size={16}/></button></div></article>)}{!data.doctors.some(d=>matches(`${d.name} ${d.specialty} ${d.email}`))&&<Empty text="Nenhum médico encontrado."/>}</div>}
      {section==='requests' && <div className="admin-request-list">{filteredRequests.length===0&&<Empty text="Nenhum atendimento encontrado."/>}{filteredRequests.map(r=><article className="request-card" key={r.id}><div className="request-card-head"><div><span className="eyebrow">{r.priority==='Alta'?'PRIORIDADE ALTA':'ATENDIMENTO'}</span><h3>{r.title}</h3><p className="muted small">{patientName(r.patientId)} · {formatDate(r.date)}</p></div><StatusBadge status={r.status}/></div><p className="muted small">{r.description}</p><Progress status={r.status}/><div className="admin-inline-fields"><label>Médico responsável<select value={r.doctorId??''} onChange={e=>action(()=>demoStore.saveRequest({...r,doctorId:e.target.value}))}>{doctorOptions}</select></label><label>Status<select value={r.status} onChange={e=>action(()=>demoStore.updateRequest(r.id,e.target.value as RequestStatus))}>{statusOptions}</select></label><label>Prioridade<select value={r.priority} onChange={e=>action(()=>demoStore.saveRequest({...r,priority:e.target.value as 'Normal'|'Alta'}))}><option>Normal</option><option>Alta</option></select></label></div><div className="admin-row-actions"><button className="admin-button" onClick={()=>setEditor(r.id)}><Pencil size={14}/> Editar atendimento</button><button className="admin-icon-button danger" aria-label={`Excluir ${r.title}`} onClick={()=>remove(()=>demoStore.removeRequest(r.id),'Excluir este atendimento da demonstração?')}><Trash2 size={16}/></button></div></article>)}</div>}
      {section==='appointments' && <><div className="table-scroll"><table className="data-table"><thead><tr><th>Consulta / paciente</th><th>Data e hora</th><th>Médico</th><th>Status</th><th>Ações</th></tr></thead><tbody>{filteredAppointments.map(a=><tr key={a.id}><td><strong>{a.type}</strong><br/>{patientName(a.patientId)}</td><td>{formatDate(a.date)} · {a.time}</td><td><select aria-label={`Médico da consulta de ${patientName(a.patientId)} em ${a.date}`} value={a.doctorId??''} onChange={e=>action(()=>demoStore.saveAppointment({...a,doctorId:e.target.value}))}>{doctorOptions}</select></td><td><select aria-label={`Status da consulta de ${patientName(a.patientId)} em ${a.date}`} value={a.status} onChange={e=>action(()=>demoStore.saveAppointment({...a,status:e.target.value as RequestStatus}))}>{statusOptions}</select></td><td><div className="admin-row-actions"><button className="admin-icon-button" aria-label={`Editar consulta de ${patientName(a.patientId)}`} onClick={()=>setEditor(a.id)}><Pencil size={16}/></button><button className="admin-icon-button danger" aria-label={`Excluir consulta de ${patientName(a.patientId)}`} onClick={()=>remove(()=>demoStore.removeAppointment(a.id),'Excluir esta consulta da demonstração?')}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>{filteredAppointments.length===0&&<Empty text="Nenhuma consulta encontrada."/>}</>}
    </section>}
  </>;
}
function HeartIcon(){return <Activity size={22}/>;}
