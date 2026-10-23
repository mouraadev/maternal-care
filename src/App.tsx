import {Navigate,Route,Routes} from 'react-router-dom';
import Layout from './components/Layout';
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorPatients from './pages/doctor/Patients';
import PatientDetails from './pages/doctor/PatientDetails';
import DoctorRequests from './pages/doctor/Requests';
import PatientDashboard from './pages/patient/Dashboard';
import Pregnancy from './pages/patient/Pregnancy';
import Appointments from './pages/patient/Appointments';
import Assistant from './pages/patient/Assistant';
export default function App(){return <Routes><Route path="/" element={<Navigate to="/patient/dashboard" replace/>}/><Route path="/doctor" element={<Layout role="doctor"/>}><Route index element={<Navigate to="dashboard" replace/>}/><Route path="dashboard" element={<DoctorDashboard/>}/><Route path="patients" element={<DoctorPatients/>}/><Route path="patients/:id" element={<PatientDetails/>}/><Route path="requests" element={<DoctorRequests/>}/></Route><Route path="/patient" element={<Layout role="patient"/>}><Route index element={<Navigate to="dashboard" replace/>}/><Route path="dashboard" element={<PatientDashboard/>}/><Route path="pregnancy" element={<Pregnancy/>}/><Route path="appointments" element={<Appointments/>}/><Route path="assistant" element={<Assistant/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}
