import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import CreateTicket from './pages/CreateTicket';
import Tickets from './pages/Tickets';
import TicketDetails from './pages/TicketDetails';
import Customers from './pages/Customers';
import Users from './pages/Users';
import AdminRecords from './pages/AdminRecords';
import DashboardLayout from './components/DashboardLayout';
import CustomerLayout from './components/CustomerLayout';
import './App.css';
export default function App() {
  const {isAuthenticated,user}=useAuth();
  const isAdmin=user?.role==='Admin';
  const isStaff=user?.role==='Staff'||isAdmin;
  const redirect=<Navigate to="/dashboard" replace/>;
  return <Routes>
    <Route path="/" element={<Navigate to={isAuthenticated?'/dashboard':'/login'} replace/>}/>
    <Route path="/login" element={isAuthenticated?redirect:<Login/>}/>
    <Route path="/register" element={isAuthenticated?redirect:<Register/>}/>
    <Route element={!isAuthenticated?<Navigate to="/login" replace/>:isStaff?<DashboardLayout/>:<CustomerLayout/>}>
      <Route path="/dashboard" element={<Dashboard/>}/>
      <Route path="/tickets" element={<Tickets/>}/>
      <Route path="/tickets/:id" element={<TicketDetails/>}/>
      <Route path="/tickets/create" element={isStaff?redirect:<CreateTicket/>}/>
      <Route path="/profile" element={isStaff?redirect:<Profile/>}/>
      <Route path="/customers" element={isAdmin?<AdminRecords key="customers" kind="customers"/>:isStaff?<Customers/>:redirect}/>
      <Route path="/users" element={isAdmin?<Users/>:redirect}/>
      <Route path="/categories" element={isAdmin?<AdminRecords key="categories" kind="categories"/>:redirect}/>
      <Route path="/manage-tickets" element={isAdmin?<AdminRecords key="tickets" kind="tickets"/>:redirect}/>
      <Route path="/histories" element={isAdmin?<AdminRecords key="histories" kind="histories"/>:redirect}/>
    </Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>;
}
