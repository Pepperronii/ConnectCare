import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { Headset, LayoutDashboard, Ticket, Users, LogOut, UserCog, Layers, History, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
export default function DashboardLayout() {
  const {user,logout}=useAuth();
  if(!user) return <Navigate to="/login" replace/>;
  const isAdmin=user.role==='Admin';
  return <div className="dashboard-layout"><aside className="sidebar" style={{overflowY:'auto'}}>
    <div className="sidebar-brand"><Headset size={30}/><span>ConnectCare</span></div>
    <div className="sidebar-label">MAIN MENU</div><nav className="sidebar-nav">
      <NavLink to="/dashboard"><LayoutDashboard size={20}/>Dashboard</NavLink>
      <NavLink to="/tickets" end><Ticket size={20}/>Support Tickets</NavLink>
      <NavLink to="/customers"><Users size={20}/>Customers</NavLink>
      {isAdmin&&<><NavLink to="/users"><UserCog size={20}/>User Management</NavLink><NavLink to="/categories"><Layers size={20}/>Ticket Categories</NavLink><NavLink to="/manage-tickets"><ClipboardList size={20}/>Manage Tickets</NavLink><NavLink to="/histories"><History size={20}/>Status Histories</NavLink></>}
    </nav><div className="sidebar-bottom"><div className="sidebar-user"><div className="user-avatar">{user.fullName?.charAt(0).toUpperCase()||'U'}</div><div><strong>{user.fullName}</strong><small>{user.role}</small></div></div><button className="logout-button" onClick={logout}><LogOut size={19}/>Logout</button></div>
  </aside><div className="dashboard-main"><header className="dashboard-header"><strong>{isAdmin?'Admin Portal':'Staff Portal'}</strong><span className="header-role">{user.role}</span></header><main className="dashboard-content"><Outlet/></main></div></div>;
}
