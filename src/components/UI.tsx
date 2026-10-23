import type {ReactNode} from 'react';
import {AlertCircle,CheckCircle2,Clock3} from 'lucide-react';
import type {RequestStatus} from '../types';
export function StatCard({label,value,detail,icon}:{label:string;value:string|number;detail?:string;icon:ReactNode}){return <div className="stat-card"><div className="stat-icon">{icon}</div><div className="muted small">{label}</div><div className="stat-value">{value}</div>{detail&&<div className="muted small">{detail}</div>}</div>}
export function StatusBadge({status}:{status:RequestStatus}){return <span className={`status status-${status==='Pendente'?'pending':status==='Concluído'?'done':'progress'}`}>{status==='Concluído'?<CheckCircle2 size={13}/>:status==='Pendente'?<AlertCircle size={13}/>:<Clock3 size={13}/>} {status}</span>}
export function SectionTitle({title,subtitle,action}:{title:string;subtitle?:string;action?:ReactNode}){return <div className="section-heading"><div><h2>{title}</h2>{subtitle&&<p className="muted">{subtitle}</p>}</div>{action}</div>}
export function Avatar({initials,color='purple',size='md'}:{initials:string;color?:string;size?:'md'|'lg'}){return <span className={`avatar avatar-${color} avatar-${size}`} aria-label={initials}>{initials}</span>}
export function Empty({text}:{text:string}){return <div className="empty">{text}</div>}
