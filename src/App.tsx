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
import Login from './pages/auth/Login';
import Admin from './pages/admin/Admin';
export default function App(){return <Routes><Route path="/" element={<Navigate to="/login" replace/>}/><Route path="/login" element={<Login/>}/><Route path="/admin" element={<Layout role="admin"/>}><Route index element={<Navigate to="dashboard" replace/>}/><Route path="dashboard" element={<Admin key="dashboard" section="dashboard"/>}/><Route path="patients" element={<Admin key="patients" section="patients"/>}/><Route path="doctors" element={<Admin key="doctors" section="doctors"/>}/><Route path="requests" element={<Admin key="requests" section="requests"/>}/><Route path="appointments" element={<Admin key="appointments" section="appointments"/>}/></Route><Route path="/doctor" element={<Layout role="doctor"/>}><Route index element={<Navigate to="dashboard" replace/>}/><Route path="dashboard" element={<DoctorDashboard/>}/><Route path="patients" element={<DoctorPatients/>}/><Route path="patients/:id" element={<PatientDetails/>}/><Route path="requests" element={<DoctorRequests/>}/></Route><Route path="/patient" element={<Layout role="patient"/>}><Route index element={<Navigate to="dashboard" replace/>}/><Route path="dashboard" element={<PatientDashboard/>}/><Route path="pregnancy" element={<Pregnancy/>}/><Route path="appointments" element={<Appointments/>}/><Route path="assistant" element={<Assistant/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}
