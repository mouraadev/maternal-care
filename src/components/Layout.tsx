import {Link,NavLink,Outlet,useLocation} from 'react-router-dom';
import {CalendarDays,ClipboardList,Heart,HeartHandshake,LayoutDashboard,MessageCircle,Users,PanelLeftClose,ShieldCheck,Stethoscope} from 'lucide-react';
import {useState} from 'react';
import {demoStore,useDemoData} from '../services/demoStore';
import {Avatar} from './UI';
export type Role = 'admin'|'doctor'|'patient';
export default function Layout({role}:{role:Role}) {
  const location = useLocation();
  const [mobileOpen,setMobileOpen] = useState(false);
  const data = useDemoData();
  const admin = role === 'admin';
  const doctor = data.doctors.find(d => d.id === data.selectedDoctorId) ?? data.doctors[0];
  const patient = data.patients.find(p => p.id === data.selectedPatientId) ?? data.patients[0];
  const menu = admin ? [
    {to:'/admin/dashboard',label:'Visão geral',icon:LayoutDashboard},
    {to:'/admin/patients',label:'Pacientes',icon:Users},
    {to:'/admin/doctors',label:'Médicos',icon:Stethoscope},
    {to:'/admin/requests',label:'Atendimentos',icon:ClipboardList},
    {to:'/admin/appointments',label:'Agenda de consultas',icon:CalendarDays}
  ] : role === 'doctor' ? [
    {to:'/doctor/dashboard',label:'Visão geral',icon:LayoutDashboard},
    {to:'/doctor/patients',label:'Minhas pacientes',icon:Users},
    {to:'/doctor/requests',label:'Solicitações',icon:ClipboardList}
  ] : [
    {to:'/patient/dashboard',label:'Visão geral',icon:LayoutDashboard},
    {to:'/patient/pregnancy',label:'Minha gestação',icon:Heart},
    {to:'/patient/appointments',label:'Consultas',icon:CalendarDays},
    {to:'/patient/assistant',label:'Conversar com Lia',icon:MessageCircle}
  ];
  const page = menu.find(x => location.pathname.startsWith(x.to))?.label ?? 'Detalhes da paciente';
  const profileName = admin ? 'Administrador' : role === 'doctor' ? doctor?.name : patient?.name;
  return <div className="app-shell"><aside className={`sidebar ${mobileOpen?'sidebar-open':''}`}>
    <Link to="/login" className="brand"><span className="brand-icon"><HeartHandshake size={24}/></span><div><strong>maternal<span>care</span></strong><small>Cuidando de cada etapa</small></div></Link>
    <div className="sidebar-label">{admin?'ADMINISTRAÇÃO':'MENU PRINCIPAL'}</div><nav>{menu.map(({to,label,icon:Icon}) => <NavLink key={to} className={({isActive}) => `side-link ${isActive?'active':''}`} to={to} onClick={() => setMobileOpen(false)}><Icon size={19}/>{label}</NavLink>)}</nav>
    <div className="sidebar-bottom"><div className="care-note"><Heart size={17}/><strong>Cuidado que acolhe</strong><p>Uma jornada mais leve e acompanhada.</p></div><div className="sidebar-profile"><Avatar initials={admin?'AD':role==='doctor'?'DR':patient?.initials??'?'}/><div><strong>{profileName??'Nenhum cadastro'}</strong><span>{admin?'Gestão da plataforma':role==='doctor'?'Médico responsável':'Gestante'}</span></div></div></div>
  </aside>{mobileOpen && <button className="mobile-backdrop" aria-label="Fechar menu" onClick={() => setMobileOpen(false)}/>}
  <div className="main-area"><header className="topbar"><button className="icon-btn mobile-menu" aria-label="Abrir menu" onClick={() => setMobileOpen(!mobileOpen)}><PanelLeftClose size={21}/></button><div className="breadcrumb">{admin?'Administração':role==='doctor'?'Área médica':'Área da gestante'} <span>/</span> <strong>{page}</strong></div><div className="topbar-right"><span className="demo-pill"><span className="dot"/> Modo demonstração</span><Link className="role-button" to={admin?'/login':'/admin/dashboard'}><ShieldCheck size={16}/>{admin?'Tela de acesso':'Administração'}</Link></div></header>
  <main className="main-content">
    {!admin && <section className="admin-preview-bar"><span>Visualização de demonstração</span><label>{role==='doctor'?'Médico':'Paciente'}<select value={(role==='doctor'?doctor?.id:patient?.id)??''} onChange={e => role==='doctor'?demoStore.selectDoctor(e.target.value):demoStore.selectPatient(e.target.value)}><option value="" disabled>Selecione um cadastro</option>{(role==='doctor'?data.doctors:data.patients).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><Link to="/admin/dashboard">Voltar à administração →</Link></section>}
    {role==='patient' && !patient ? <section className="panel"><h2>Nenhuma paciente cadastrada</h2><Link to="/admin/patients">Cadastrar paciente</Link></section> : <Outlet key={role==='patient'?patient?.id:role==='doctor'?doctor?.id:'admin'}/>}
  </main><footer className="footer">Maternal Care · Protótipo com dados fictícios · Não substitui atendimento médico.</footer></div></div>;
}
