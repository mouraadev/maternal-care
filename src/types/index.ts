export type AppointmentStatus = 'Pendente' | 'Em andamento' | 'Concluído';
export type RequestStatus = AppointmentStatus;
export type Patient = {id:string; name:string; initials:string; week:number; dueDate:string; lastVisit:string; nextVisit:string; notes:string; doctorId:string; color:string};
export type CareRequest = {id:string; patientId:string; doctorId?:string; title:string; description:string; date:string; status:RequestStatus; priority:'Normal'|'Alta'};
export type Appointment = {id:string; patientId:string; doctorId?:string; date:string; time:string; type:string; status:AppointmentStatus};
export type Doctor = {id:string; name:string; email:string; specialty:string; registration:string};
export type ChatMessage = {id:string; role:'user'|'assistant'; content:string; time:string};
