import {readFileSync} from 'node:fs';
import {afterAll,beforeAll,beforeEach,describe,it} from 'vitest';
import {assertFails,assertSucceeds,initializeTestEnvironment,type RulesTestEnvironment} from '@firebase/rules-unit-testing';
import {collection,doc,getDoc,getDocs,query,setDoc,updateDoc,where} from 'firebase/firestore';

const suite=process.env.FIRESTORE_EMULATOR_HOST?describe:describe.skip;
suite('Regras Firestore por perfil',()=>{
  let environment:RulesTestEnvironment;
  beforeAll(async()=>{
    const [host,port]=process.env.FIRESTORE_EMULATOR_HOST!.split(':');
    environment=await initializeTestEnvironment({projectId:'demo-maternal-care',firestore:{host,port:Number(port),rules:readFileSync('firestore.rules','utf8')}});
  },30000);
  afterAll(async()=>{await environment?.cleanup();});
  beforeEach(async()=>{
    await environment.clearFirestore();
    await environment.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      for(const [uid,role] of [['admin','admin'],['d1','doctor'],['d2','doctor'],['p1','patient'],['p2','patient']])await setDoc(doc(db,'users',uid),{role,active:true});
      await setDoc(doc(db,'patients','p1'),{name:'Paciente um',doctorId:'d1',careTeamIds:['d1'],week:26,notes:''});
      await setDoc(doc(db,'patients','p2'),{name:'Paciente dois',doctorId:'d2',careTeamIds:['d2'],week:20,notes:''});
      await setDoc(doc(db,'careRequests','r1'),{patientId:'p1',doctorId:'d1',title:'Retorno',description:'Dúvida para consulta',status:'Pendente',priority:'Normal'});
      await setDoc(doc(db,'appointments','a1'),{patientId:'p1',doctorId:'d1',status:'Pendente'});
    });
  });
  const db=(uid:string)=>environment.authenticatedContext(uid).firestore();
  it('bloqueia pessoas não autenticadas',async()=>{await assertFails(getDoc(doc(environment.unauthenticatedContext().firestore(),'patients','p1')));});
  it('permite à paciente apenas seu cadastro e sua fila filtrada',async()=>{
    await assertSucceeds(getDoc(doc(db('p1'),'patients','p1')));
    await assertFails(getDoc(doc(db('p1'),'patients','p2')));
    await assertSucceeds(getDocs(query(collection(db('p1'),'careRequests'),where('patientId','==','p1'))));
    await assertFails(getDocs(collection(db('p1'),'careRequests')));
  });
  it('bloqueia autoatribuição de papel e edição clínica pela paciente',async()=>{
    await assertFails(updateDoc(doc(db('p1'),'users','p1'),{role:'admin'}));
    await assertFails(updateDoc(doc(db('p1'),'patients','p1'),{notes:'Nota da paciente'}));
  });
  it('permite notas e status ao responsável sem permitir mudar o vínculo',async()=>{
    await assertSucceeds(updateDoc(doc(db('d1'),'patients','p1'),{notes:'Nota do médico'}));
    await assertSucceeds(updateDoc(doc(db('d1'),'careRequests','r1'),{status:'Em andamento'}));
    await assertFails(updateDoc(doc(db('d1'),'patients','p1'),{doctorId:'d2'}));
    await assertFails(getDoc(doc(db('d2'),'patients','p1')));
    await assertFails(updateDoc(doc(db('d2'),'careRequests','r1'),{status:'Concluído'}));
  });
  it('permite atribuição e gestão global somente pelo administrador',async()=>{
    await assertSucceeds(getDocs(collection(db('admin'),'patients')));
    await assertSucceeds(updateDoc(doc(db('admin'),'careRequests','r1'),{doctorId:'d2'}));
    await assertSucceeds(updateDoc(doc(db('admin'),'patients','p1'),{careTeamIds:['d1','d2']}));
    await assertSucceeds(getDoc(doc(db('d2'),'patients','p1')));
    await assertSucceeds(updateDoc(doc(db('d2'),'careRequests','r1'),{status:'Concluído'}));
  });
  it('valida o responsável e os estados iniciais de uma solicitação da paciente',async()=>{
    const data={patientId:'p1',doctorId:'d1',title:'Retorno',description:'Pergunta para consulta',priority:'Normal',status:'Pendente'};
    await assertSucceeds(setDoc(doc(db('p1'),'careRequests','novo'),data));
    await assertFails(setDoc(doc(db('p1'),'careRequests','invalido'),{...data,doctorId:'d2'}));
    await assertFails(setDoc(doc(db('p1'),'careRequests','concluido'),{...data,status:'Concluído'}));
  });
  it('nega perfis inativos e acesso cliente às quotas de voz',async()=>{
    await environment.withSecurityRulesDisabled(async context=>{await updateDoc(doc(context.firestore(),'users','p1'),{active:false});});
    await assertFails(getDoc(doc(db('p1'),'patients','p1')));
    await assertFails(setDoc(doc(db('admin'),'aiUsage','p1'),{voiceCount:0}));
  });
});
