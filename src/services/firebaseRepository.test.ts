import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({set:vi.fn(),delete:vi.fn(),commit:vi.fn(),getDoc:vi.fn(),onSnapshot:vi.fn()}));
vi.mock('./firebase',()=>({db:{}}));
vi.mock('firebase/firestore',()=>({
  doc:(_db:unknown,path:string,id:string)=>({path:`${path}/${id}`}),
  collection:(_db:unknown,path:string)=>({path}),
  query:(base:unknown,...filters:unknown[])=>({base,filters}),where:(...args:unknown[])=>args,
  writeBatch:()=>({set:mocks.set,delete:mocks.delete,commit:mocks.commit}),
  getDoc:mocks.getDoc,onSnapshot:mocks.onSnapshot,serverTimestamp:()=> 'SERVER_TIMESTAMP'
}));
import {persistChanges,subscribeRecords} from './firebaseRepository';
import {demoStore,type DemoData} from './demoStore';

beforeEach(()=>{vi.clearAllMocks();demoStore.reset();mocks.commit.mockResolvedValue(undefined);mocks.getDoc.mockResolvedValue({exists:()=>false});});
describe('Integração Firestore',()=>{
  it('envia somente os campos alterados de uma anotação médica',async()=>{
    const previous={...demoStore.getSnapshot(),source:'firebase',sessionRole:'doctor'} as DemoData;
    const next={...previous,patients:previous.patients.map((p,index)=>index===0?{...p,notes:'Nova anotação'}:p)};
    await persistChanges(previous,next);
    expect(mocks.set).toHaveBeenCalledExactlyOnceWith({path:'patients/p1'},{notes:'Nova anotação',updatedAt:'SERVER_TIMESTAMP'},{merge:true});
  });
  it('atualiza a equipe de acesso quando o administrador reatribui atendimento',async()=>{
    const previous={...demoStore.getSnapshot(),source:'firebase',sessionRole:'admin'} as DemoData;
    const next={...previous,requests:previous.requests.map((r,index)=>index===0?{...r,doctorId:'d2'}:r)};
    await persistChanges(previous,next);
    expect(mocks.set).toHaveBeenCalledWith({path:'patients/p1'},expect.objectContaining({careTeamIds:['d1','d2']}),{merge:true});
    expect(mocks.commit).toHaveBeenCalledOnce();
  });
  it('não sobrescreve perfil de outro papel ao cadastrar médico',async()=>{
    mocks.getDoc.mockResolvedValue({exists:()=>true,data:()=>({role:'admin'})});
    const previous=demoStore.getSnapshot();
    const next={...previous,doctors:previous.doctors.map((d,index)=>index===0?{...d,name:'Novo nome'}:d)};
    await expect(persistChanges(previous,next)).rejects.toThrow('outro perfil');
    expect(mocks.commit).not.toHaveBeenCalled();
  });
  it('preserva o cadastro da paciente ao receber solicitações e consultas',()=>{
    const onData=vi.fn();
    const callbacks:Array<(snapshot:unknown)=>void>=[];
    mocks.onSnapshot.mockImplementation((_source,callback)=>{callbacks.push(callback);return vi.fn();});
    const stop=subscribeRecords('paciente-uid','patient',onData,vi.fn());
    callbacks[0]({exists:()=>true,data:()=>({name:'Paciente do Firebase',week:24})});
    callbacks[1]({docs:[]});callbacks[2]({docs:[]});
    expect(onData).toHaveBeenLastCalledWith(expect.objectContaining({patients:[expect.objectContaining({id:'paciente-uid',name:'Paciente do Firebase'})]}));
    stop();
  });
  it('propaga falhas de gravação e não confirma dados como salvos',async()=>{
    mocks.commit.mockRejectedValue(new Error('permission-denied'));
    const previous=demoStore.getSnapshot();
    const next={...previous,requests:previous.requests.map((r,index)=>index===0?{...r,status:'Concluído' as const}:r)};
    await expect(persistChanges(previous,next)).rejects.toThrow('permission-denied');
  });
  it('não grava dados reais no armazenamento local nem substitui o estado antes da confirmação',async()=>{
    const writer=vi.fn().mockRejectedValue(new Error('offline'));
    const setItem=vi.fn();vi.stubGlobal('localStorage',{getItem:()=>null,setItem});
    demoStore.connectRemote('uid','admin',writer);
    demoStore.receiveRemote({patients:[],doctors:[],requests:[],appointments:[]});
    await expect(demoStore.saveDoctor({id:'doctor-uid',name:'Médico',email:'teste@example.com',specialty:'Obstetrícia',registration:'DEMO'})).rejects.toThrow('offline');
    expect(setItem).not.toHaveBeenCalled();
    expect(demoStore.getSnapshot().doctors).toEqual([]);
    demoStore.reset();vi.unstubAllGlobals();
  });
});
