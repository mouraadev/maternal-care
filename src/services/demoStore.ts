import {useSyncExternalStore} from 'react';
import {initialRequests, patients, appointments} from '../data/seed';
import type {Appointment, CareRequest, Doctor, Patient, RequestStatus} from '../types';
import {createDemoId} from '../utils/id';

export type DemoData = {requests:CareRequest[];patients:Patient[];doctors:Doctor[];appointments:Appointment[];selectedPatientId:string;selectedDoctorId:string;source?:'demo'|'firebase';loading?:boolean;error?:string;sessionUid?:string;sessionRole?:'admin'|'doctor'|'patient'};
const key = 'maternal-care-demo-v1';
function defaults(): DemoData {
  return structuredClone({requests:initialRequests.map(r => ({...r,doctorId:'d1'})),patients,
    appointments:appointments.map(a => ({...a,doctorId:'d1'})),
    doctors:[{id:'d1',name:'Dr. Rafael Almeida',email:'rafael@example.com',specialty:'Obstetrícia',registration:'CRM DEMO-001'},
      {id:'d2',name:'Dra. Helena Costa',email:'helena@example.com',specialty:'Ginecologia e obstetrícia',registration:'CRM DEMO-002'}],
    selectedPatientId:'p1',selectedDoctorId:'d1'});
}
function read(): DemoData {
  const initial = defaults();
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.patients) && Array.isArray(data.requests)) {
        const patientDoctor = (id:string) => data.patients.find((p:Patient) => p.id === id)?.doctorId ?? '';
        return {...initial,...data,
          doctors:Array.isArray(data.doctors) ? data.doctors : initial.doctors,
          appointments:Array.isArray(data.appointments) ? data.appointments : initial.appointments.filter(a => data.patients.some((p:Patient) => p.id === a.patientId)),
          requests:data.requests.map((r:CareRequest) => ({...r,doctorId:r.doctorId ?? patientDoctor(r.patientId)}))};
      }
    }
  } catch { /* Armazenamento indisponível: manter demonstração em memória. */ }
  return initial;
}
let state = read();
let remoteWriter:((previous:DemoData,next:DemoData)=>Promise<void>)|null = null;
const subscribers = new Set<() => void>();
function save(next:DemoData) {
  if(remoteWriter) return remoteWriter(state,next);
  state = next;
  try { localStorage.setItem(key,JSON.stringify(state)); } catch { /* Funciona em memória. */ }
  subscribers.forEach(fn => fn());
}
function checkAssignment(patientId:string, doctorId?:string) {
  if (!state.patients.some(p => p.id === patientId)) throw new Error('Paciente não encontrada.');
  if (doctorId && !state.doctors.some(d => d.id === doctorId)) throw new Error('Médico não encontrado.');
}
export const demoStore = {
  subscribe(fn:() => void) { subscribers.add(fn); return () => { subscribers.delete(fn); }; },
  getSnapshot:() => state,
  enterDemo() { remoteWriter=null;state={...read(),source:'demo',loading:false,error:'',sessionUid:undefined,sessionRole:undefined};subscribers.forEach(fn=>fn()); },
  connectRemote(uid:string,role:'admin'|'doctor'|'patient',writer:(previous:DemoData,next:DemoData)=>Promise<void>) { remoteWriter=writer;state={patients:[],doctors:[],requests:[],appointments:[],selectedPatientId:uid,selectedDoctorId:uid,source:'firebase',loading:true,error:'',sessionUid:uid,sessionRole:role};subscribers.forEach(fn=>fn()); },
  receiveRemote(data:Pick<DemoData,'patients'|'doctors'|'requests'|'appointments'>) { state={...state,...data,loading:false,error:''};subscribers.forEach(fn=>fn()); },
  remoteError(message:string) {state={...state,loading:false,error:message};subscribers.forEach(fn=>fn());},
  selectPatient(id:string) { if (state.patients.some(p => p.id === id)) { if(state.source==='firebase'){state={...state,selectedPatientId:id};subscribers.forEach(fn=>fn());}else save({...state,selectedPatientId:id}); } },
  selectDoctor(id:string) { if (state.doctors.some(d => d.id === id)) { if(state.source==='firebase'){state={...state,selectedDoctorId:id};subscribers.forEach(fn=>fn());}else save({...state,selectedDoctorId:id}); } },
  saveDoctor(doctor:Doctor) {
    if (!doctor.name.trim()) throw new Error('Informe o nome do médico.');
    return save({...state,doctors:state.doctors.some(d => d.id === doctor.id) ? state.doctors.map(d => d.id === doctor.id ? doctor : d) : [...state.doctors,doctor]});
  },
  removeDoctor(id:string) {
    if (state.patients.some(p => p.doctorId === id) || state.requests.some(r => r.doctorId === id) || state.appointments.some(a => a.doctorId === id)) throw new Error('Reatribua pacientes, solicitações e consultas antes de excluir este médico.');
    return save({...state,doctors:state.doctors.filter(d => d.id !== id)});
  },
  savePatient(patient:Patient) {
    if (!patient.name.trim()) throw new Error('Informe o nome da paciente.');
    if (patient.doctorId && !state.doctors.some(d => d.id === patient.doctorId)) throw new Error('Médico não encontrado.');
    if (patient.week < 0 || patient.week > 45) throw new Error('Informe uma semana entre 0 e 45.');
    return save({...state,patients:state.patients.some(p => p.id === patient.id) ? state.patients.map(p => p.id === patient.id ? patient : p) : [...state.patients,patient]});
  },
  removePatient(id:string) {
    return save({...state,patients:state.patients.filter(p => p.id !== id),requests:state.requests.filter(r => r.patientId !== id),appointments:state.appointments.filter(a => a.patientId !== id)});
  },
  saveRequest(request:CareRequest) {
    checkAssignment(request.patientId,request.doctorId);
    if (!request.title.trim() || !request.description.trim()) throw new Error('Informe assunto e descrição.');
    return save({...state,requests:state.requests.some(r => r.id === request.id) ? state.requests.map(r => r.id === request.id ? request : r) : [request,...state.requests]});
  },
  removeRequest(id:string) { return save({...state,requests:state.requests.filter(r => r.id !== id)}); },
  updateRequest(id:string,status:RequestStatus) { return save({...state,requests:state.requests.map(r => r.id === id ? {...r,status} : r)}); },
  addRequest(patientId:string,title:string,description:string) {
    const patient = state.patients.find(p => p.id === patientId);
    return this.saveRequest({id:createDemoId(),patientId,doctorId:patient?.doctorId ?? '',title,description,date:new Date().toISOString().slice(0,10),priority:'Normal',status:'Pendente'});
  },
  saveAppointment(appointment:Appointment) {
    checkAssignment(appointment.patientId,appointment.doctorId);
    if (!appointment.type.trim() || !appointment.date || !appointment.time) throw new Error('Preencha tipo, data e horário.');
    return save({...state,appointments:state.appointments.some(a => a.id === appointment.id) ? state.appointments.map(a => a.id === appointment.id ? appointment : a) : [...state.appointments,appointment]});
  },
  removeAppointment(id:string) { return save({...state,appointments:state.appointments.filter(a => a.id !== id)}); },
  updateNotes(id:string,notes:string) { return save({...state,patients:state.patients.map(p => p.id === id ? {...p,notes} : p)}); },
  reset() { remoteWriter=null;save(defaults()); }
};
export function useDemoData() { return useSyncExternalStore(demoStore.subscribe,demoStore.getSnapshot,demoStore.getSnapshot); }
export function usePatientData() {
  const data = useDemoData();
  const patient = data.patients.find(p => p.id === data.selectedPatientId) ?? data.patients[0];
  return {...data,patients:patient ? [patient] : [],requests:data.requests.filter(r => r.patientId === patient?.id),appointments:data.appointments.filter(a => a.patientId === patient?.id)};
}
export function useDoctorData() {
  const data = useDemoData();
  const doctor = data.doctors.find(d => d.id === data.selectedDoctorId) ?? data.doctors[0];
  const requests = data.requests.filter(r => r.doctorId === doctor?.id);
  const appointments = data.appointments.filter(a => a.doctorId === doctor?.id);
  return {...data,doctor,patients:data.patients.filter(p => p.doctorId === doctor?.id || requests.some(r=>r.patientId===p.id) || appointments.some(a=>a.patientId===p.id)),requests,appointments};
}
