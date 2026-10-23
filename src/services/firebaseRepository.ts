import {collection,doc,getDoc,onSnapshot,query,where,writeBatch,serverTimestamp,type DocumentData,type Unsubscribe} from 'firebase/firestore';
import {db} from './firebase';
import type {DemoData} from './demoStore';
import type {Doctor,Patient,CareRequest,Appointment} from '../types';
type Role='admin'|'doctor'|'patient';
type Records=Pick<DemoData,'patients'|'doctors'|'requests'|'appointments'>;

export async function persistChanges(previous:DemoData,next:DemoData) {
  if(!db)throw new Error('Firebase não configurado.');
  const batch=writeBatch(db);
  let operations=0;
  for(const [field,path] of [['doctors','users'],['patients','patients'],['requests','careRequests'],['appointments','appointments']] as const){
    const before=new Map(previous[field].map(item=>[item.id,item]));
    const after=new Map(next[field].map(item=>[item.id,item]));
    for(const [id,item] of after){
      const teamFor=(data:DemoData)=>Array.from(new Set([data.patients.find(p=>p.id===id)?.doctorId,...data.requests.filter(r=>r.patientId===id).map(r=>r.doctorId),...data.appointments.filter(a=>a.patientId===id).map(a=>a.doctorId)].filter((value):value is string=>Boolean(value)))).sort();
      const team=field==='patients'?teamFor(next):undefined;
      const teamChanged=field==='patients'&&JSON.stringify(teamFor(previous))!==JSON.stringify(team);
      if(JSON.stringify(before.get(id))===JSON.stringify(item)&&!teamChanged)continue;
      if(!id||id.includes('/'))throw new Error('UID de cadastro inválido.');
      const ref=doc(db,path,id);
      if(field==='doctors'){
        const existing=await getDoc(ref);
        if(existing.exists()&&existing.data().role!=='doctor')throw new Error('Este UID já pertence a outro perfil.');
        const doctor=item as Doctor;
        batch.set(ref,{...doctor,displayName:doctor.name,role:'doctor',active:true,updatedAt:serverTimestamp()},{merge:true});
      }else{
        const old=before.get(id) as unknown as Record<string,unknown>|undefined;
        const changes=Object.fromEntries(Object.entries(item).filter(([key,value])=>!old||JSON.stringify(old[key])!==JSON.stringify(value)));
        batch.set(ref,{...changes,...(field==='patients'&&previous.sessionRole==='admin'?{careTeamIds:team}:{}),updatedAt:serverTimestamp()},{merge:true});
        if(field==='patients'&&!before.has(id)){
          const userRef=doc(db,'users',id);
          const profile=await getDoc(userRef);
          if(profile.exists()&&profile.data().role!=='patient')throw new Error('Este UID já pertence a outro perfil.');
          batch.set(userRef,{displayName:(item as Patient).name,role:'patient',active:true},{merge:true});operations++;
        }
      }
      operations++;
    }
    for(const id of before.keys()){if(!after.has(id)){batch.delete(doc(db,path,id));operations++;}}
  }
  if(operations>450)throw new Error('Muitos registros associados. Exclua os atendimentos em etapas menores.');
  if(operations)await batch.commit();
}

export function subscribeRecords(uid:string,role:Role,onData:(records:Records)=>void,onError:(message:string)=>void):Unsubscribe {
  if(!db)throw new Error('Firebase não configurado.');
  const records:Records={patients:[],doctors:[],requests:[],appointments:[]};
  const ready=new Set<string>();
  const unsubscribers:Unsubscribe[]=[];
  let stopped=false;
  let failed=false;
  const emit=()=>{if(!stopped&&!failed&&ready.size===4)onData({...records});};
  const failure=()=>{if(!stopped){failed=true;onError('Não foi possível ler os dados do Firebase. Confira o perfil, as regras de acesso e a conexão. Nenhum dado de demonstração será gravado no banco.');}};
  const mapPatient=(id:string,data:DocumentData):Patient=>({id,name:data.name??data.displayName??'Paciente',initials:data.initials??'PT',week:data.week??0,dueDate:data.dueDate??data.estimatedDueDate??'',lastVisit:data.lastVisit??'',nextVisit:data.nextVisit??'',notes:data.notes??'',doctorId:data.doctorId??'',color:data.color??'pink'});
  const mapDoctor=(id:string,data:DocumentData):Doctor=>({id,name:data.name??data.displayName??'Médico',email:data.email??'',specialty:data.specialty??'',registration:data.registration??''});
  const relatedPatients=new Map<string,Patient>();
  let primaryPatients:Patient[]=[];
  const watchedPatients=new Set<string>();
  function watchRelated(){
    if(role!=='doctor')return;
    for(const id of new Set([...records.requests.map(r=>r.patientId),...records.appointments.map(a=>a.patientId)])){
      if(watchedPatients.has(id))continue;watchedPatients.add(id);
      unsubscribers.push(onSnapshot(doc(db!,'patients',id),snapshot=>{
        if(snapshot.exists())relatedPatients.set(id,mapPatient(id,snapshot.data()));else relatedPatients.delete(id);
        mergePatients();emit();
      },failure));
    }
  }
  function mergePatients(){
    if(role==='patient')return;
    const assigned=new Set([...records.requests.map(r=>r.patientId),...records.appointments.map(a=>a.patientId)]);
    records.patients=[...new Map([...primaryPatients,...Array.from(relatedPatients.values()).filter(p=>assigned.has(p.id))].map(p=>[p.id,p])).values()];
  }
  if(role==='admin'){
    unsubscribers.push(onSnapshot(query(collection(db,'users'),where('role','==','doctor')),snapshot=>{records.doctors=snapshot.docs.map(item=>mapDoctor(item.id,item.data()));ready.add('doctors');emit();},failure));
  }else if(role==='doctor'){
    unsubscribers.push(onSnapshot(doc(db,'users',uid),snapshot=>{records.doctors=snapshot.exists()?[mapDoctor(uid,snapshot.data())]:[];ready.add('doctors');emit();},failure));
  }else{ready.add('doctors');}
  if(role==='patient'){
    unsubscribers.push(onSnapshot(doc(db,'patients',uid),snapshot=>{records.patients=snapshot.exists()?[mapPatient(uid,snapshot.data())]:[];ready.add('patients');emit();},failure));
  }else{
    const source=role==='admin'?collection(db,'patients'):query(collection(db,'patients'),where('doctorId','==',uid));
    unsubscribers.push(onSnapshot(source,snapshot=>{primaryPatients=snapshot.docs.map(item=>mapPatient(item.id,item.data()));mergePatients();ready.add('patients');emit();},failure));
  }
  for(const [field,path] of [['requests','careRequests'],['appointments','appointments']] as const){
    const source=role==='admin'?collection(db,path):query(collection(db,path),where(role==='doctor'?'doctorId':'patientId','==',uid));
    unsubscribers.push(onSnapshot(source,snapshot=>{
      if(field==='requests')records.requests=snapshot.docs.map(item=>({...item.data(),id:item.id}) as CareRequest);
      else records.appointments=snapshot.docs.map(item=>({...item.data(),id:item.id}) as Appointment);
      ready.add(field);watchRelated();mergePatients();emit();
    },failure));
  }
  return ()=>{stopped=true;unsubscribers.forEach(unsubscribe=>unsubscribe());};
}
