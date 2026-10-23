import {useSyncExternalStore} from 'react';
import {initialRequests, patients} from '../data/seed';
import type {CareRequest, Patient, RequestStatus} from '../types';
type DemoData={requests:CareRequest[];patients:Patient[]};
const key='maternal-care-demo-v1';
const read=():DemoData=>{try{const s=localStorage.getItem(key);if(s){const x=JSON.parse(s) as DemoData;if(Array.isArray(x.requests)&&Array.isArray(x.patients))return x;}}catch{}return {requests:initialRequests,patients};};
let state:DemoData={requests:initialRequests,patients};
try{if(typeof window!=='undefined')state=read();}catch{}
const subscribers=new Set<()=>void>();
const notify=()=>subscribers.forEach(fn=>fn());
function save(next:DemoData){state=next;try{localStorage.setItem(key,JSON.stringify(state));}catch{}notify();}
export const demoStore={
 subscribe(fn:()=>void){subscribers.add(fn);return()=>subscribers.delete(fn);},
 getSnapshot:()=>state,
 updateRequest(id:string,status:RequestStatus){save({...state,requests:state.requests.map(r=>r.id===id?{...r,status}:r)});},
 addRequest(patientId:string,title:string,description:string){const r:CareRequest={id:`r-${Date.now()}`,patientId,title,description,date:new Date().toISOString().slice(0,10),priority:'Normal',status:'Pendente'};save({...state,requests:[r,...state.requests]});},
 updateNotes(id:string,notes:string){save({...state,patients:state.patients.map(p=>p.id===id?{...p,notes}:p)});},
 reset(){save({requests:initialRequests,patients});}
};
export function useDemoData(){return useSyncExternalStore(demoStore.subscribe,demoStore.getSnapshot,demoStore.getSnapshot);}
