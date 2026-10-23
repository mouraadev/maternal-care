import type {Appointment, CareRequest, Patient} from '../types';
export const patients:Patient[] = [
 {id:'p1',name:'Mariana Oliveira',initials:'MO',week:26,dueDate:'2027-01-28',lastVisit:'2026-10-14',nextVisit:'2026-10-29',notes:'Acompanhamento de rotina. Conversar sobre dúvidas para a próxima consulta.',doctorId:'d1',color:'pink'},
 {id:'p2',name:'Camila Santos',initials:'CS',week:18,dueDate:'2027-03-25',lastVisit:'2026-10-09',nextVisit:'2026-11-04',notes:'Acompanhamento de rotina.',doctorId:'d1',color:'purple'},
 {id:'p3',name:'Ana Beatriz Costa',initials:'AC',week:32,dueDate:'2026-12-18',lastVisit:'2026-10-17',nextVisit:'2026-10-31',notes:'Revisar questões trazidas pela paciente durante a consulta.',doctorId:'d1',color:'peach'},
 {id:'p4',name:'Juliana Ferreira',initials:'JF',week:12,dueDate:'2027-05-10',lastVisit:'2026-10-11',nextVisit:'2026-11-06',notes:'Primeiras consultas de acompanhamento.',doctorId:'d1',color:'mint'}
];
export const initialRequests:CareRequest[] = [
 {id:'r1',patientId:'p1',title:'Dúvida sobre exames',description:'Gostaria de conversar sobre os exames na próxima consulta.',date:'2026-10-22',status:'Pendente',priority:'Normal'},
 {id:'r2',patientId:'p3',title:'Solicitação de retorno',description:'Gostaria de agendar um retorno para conversar com o médico.',date:'2026-10-21',status:'Em andamento',priority:'Alta'},
 {id:'r3',patientId:'p2',title:'Orientações da consulta',description:'Preciso revisar as orientações recebidas.',date:'2026-10-19',status:'Concluído',priority:'Normal'}
];
export const appointments:Appointment[] = [
 {id:'a1',patientId:'p1',date:'2026-10-29',time:'09:30',type:'Consulta de pré-natal',status:'Pendente'},
 {id:'a2',patientId:'p3',date:'2026-10-31',time:'14:00',type:'Acompanhamento',status:'Pendente'},
 {id:'a3',patientId:'p2',date:'2026-11-04',time:'10:15',type:'Consulta de pré-natal',status:'Pendente'},
 {id:'a4',patientId:'p4',date:'2026-11-06',time:'11:00',type:'Consulta de rotina',status:'Pendente'}
];
export const formatDate=(d:string)=> new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR');
export const firstName=(n:string)=>n.split(' ')[0];
