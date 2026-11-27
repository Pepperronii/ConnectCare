import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import { Link } from 'react-router-dom';

type Kind = 'categories' | 'customers' | 'tickets' | 'histories';
type RecordRow = Record<string, unknown>;
type Field = { key: string; label: string; type?: 'number' | 'textarea'; options?: string[]; max?: number; optional?: boolean; createOnly?: boolean; editOnly?: boolean; nullable?: boolean };
const limit = 10;
const statuses = ['Pending', 'In Progress', 'Resolved'];
const configs: Record<Kind, { title: string; endpoint: string; id: string; columns: string[]; fields: Field[] }> = {
  categories: { title: 'Ticket Categories', endpoint: 'ticket-categories', id: 'categoryId', columns: ['categoryId','categoryName','description'], fields: [
    {key:'categoryName',label:'Category Name',max:80}, {key:'description',label:'Description',type:'textarea',max:255,optional:true,nullable:true}
  ]},
  customers: { title: 'Customer Management', endpoint: 'customer-profiles', id: 'customerId', columns: ['customerId','userId','fullName','email','phoneNumber','serviceAddress'], fields: [
    {key:'userId',label:'Customer User ID',type:'number',createOnly:true}, {key:'phoneNumber',label:'Phone Number',max:20}, {key:'serviceAddress',label:'Service Address',max:255}
  ]},
  tickets: { title: 'Support Ticket Management', endpoint: 'support-tickets', id: 'ticketId', columns: ['ticketId','customerId','categoryId','subject','priority','status','assignedStaffId'], fields: [
    {key:'customerId',label:'Customer Profile ID',type:'number',createOnly:true}, {key:'categoryId',label:'Category ID',type:'number'}, {key:'subject',label:'Subject',max:150}, {key:'description',label:'Description',type:'textarea',max:10000}, {key:'priority',label:'Priority',options:['Low','Normal','High']}, {key:'assignedStaffId',label:'Staff User ID (blank = unassigned)',type:'number',optional:true,nullable:true,editOnly:true}
  ]},
  histories: { title: 'Ticket Status Histories', endpoint: 'ticket-status-histories', id: 'historyId', columns: ['historyId','ticketId','updatedByUserId','previousStatus','newStatus','remarks','changedAt'], fields: [
    {key:'ticketId',label:'Ticket ID',type:'number',createOnly:true}, {key:'newStatus',label:'New Status',options:statuses,createOnly:true}, {key:'remarks',label:'Remarks',type:'textarea',max:255,optional:true,nullable:true}
  ]}
};
const labels: Record<string,string> = {customerId:'Customer ID',userId:'User ID',fullName:'Full Name',email:'Email',phoneNumber:'Phone',serviceAddress:'Address',categoryId:'Category ID',categoryName:'Category Name',description:'Description',ticketId:'Ticket ID',subject:'Subject',priority:'Priority',status:'Status',assignedStaffId:'Assigned Staff ID',historyId:'History ID',updatedByUserId:'Updated By User ID',previousStatus:'Previous Status',newStatus:'New Status',remarks:'Remarks',changedAt:'Changed At'};
function message(err: unknown) { if (axios.isAxiosError(err)) { const m = err.response?.data?.message; return Array.isArray(m) ? m.join(', ') : typeof m === 'string' ? m : 'Request failed.'; } return 'Something went wrong.'; }
export default function AdminRecords({kind}: {kind:Kind}) {
  const {user} = useAuth();
  const config = configs[kind];
  const endpoint = `/api/v1/${config.endpoint}`;
  const [rows,setRows] = useState<RecordRow[]>([]);
  const [page,setPage] = useState(1);
  const [total,setTotal] = useState(0);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [success,setSuccess] = useState('');
  const [form,setForm] = useState<Record<string,string>>({});
  const [editing,setEditing] = useState<number|null>(null);
  const [open,setOpen] = useState(false);
  const load = useCallback(async (p: number) => {
    setLoading(true);
    try { const r = await api.get(endpoint,{params:{page:p,limit}}); setRows(r.data.data); setTotal(r.data.total); }
    catch(err) {setRows([]);setError(message(err));} finally {setLoading(false);}
  }, [endpoint]);

  useEffect(() => {
    if (user?.role !== 'Admin') return;
    const start = window.setTimeout(() => void load(page), 0);
    return () => window.clearTimeout(start);
  }, [load, page, user?.role]);
  const fields = config.fields.filter(f=>editing===null ? !f.editOnly : !f.createOnly);
  function start(row?:RecordRow) {
    setEditing(row ? Number(row[config.id]) : null);
    setForm(Object.fromEntries(config.fields.map(f=>[f.key, String(row?.[f.key] ?? (f.key==='priority'?'Normal':f.options?.[0] ?? ''))])));
    setError('');setSuccess('');setOpen(true);
  }
  async function save(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setBusy(true);setError('');setSuccess('');
    try {
      const payload:Record<string,unknown> = {};
      for(const f of fields) {const v=(form[f.key]??'').trim(); if(!v && f.optional) {if(f.nullable) payload[f.key]=null;continue;} payload[f.key]=f.type==='number'?Number(v):v;}
      if(editing===null) await api.post(endpoint,payload); else await api.patch(`${endpoint}/${editing}`,payload);
      setSuccess(editing===null?'Record created successfully.':'Record updated successfully.');setOpen(false);setForm({});
      if(editing===null && page!==1) setPage(1); else await load(page);
    } catch(err){setError(message(err));} finally{setBusy(false);}
  }
  async function remove(row:RecordRow) {
    const warning=kind==='histories'?'Delete this status change? This will revert the ticket status if the server permits it.':'Delete this record?';
    if(!window.confirm(warning)) return;
    setBusy(true);setError('');setSuccess('');
    try {await api.delete(`${endpoint}/${row[config.id]}`);setSuccess('Record deleted successfully.');if(rows.length===1&&page>1)setPage(page-1);else await load(page);}catch(err){setError(message(err));}finally{setBusy(false);}
  }
  function cell(row:RecordRow,key:string) {const related=row.user as RecordRow|undefined; const value=key==='fullName'||key==='email'?related?.[key]:row[key]; return value==null?'—':key==='changedAt'?new Date(String(value)).toLocaleString():String(value);}
  if(user?.role!=='Admin') return <div className="error-message">Admin access required.</div>;
  return <div>
    <div className="page-heading"><div><h1>{config.title}</h1><p>Manage ConnectCare records.</p></div><button className="action-button" disabled={busy} onClick={()=>start()}>+ Add Record</button></div>
    {error&&<div className="error-message">{error}</div>}{success&&<div className="success-message">{success}</div>}
    {kind==='tickets'&&<p className="form-description">Use Customer Management and Ticket Categories to find IDs. Use View Details to update ticket status.</p>}
    {kind==='customers'&&<p className="form-description">Create a Customer account in User Management before adding its profile.</p>}
    {kind==='histories'&&<p className="form-description">Adding a history changes the ticket status. Only the latest non-initial change can be deleted.</p>}
    {open&&<section className="content-card ticket-detail-card"><div className="card-heading"><h2>{editing===null?'Add Record':'Edit Record'}</h2><button className="secondary-button" disabled={busy} onClick={()=>setOpen(false)}>Cancel</button></div><form className="dashboard-form" onSubmit={save}>
      {fields.map(f=><div key={f.key}><label htmlFor={f.key}>{f.label}</label>{f.options?<select id={f.key} value={form[f.key]??''} onChange={e=>setForm({...form,[f.key]:e.target.value})}>{f.options.map(o=><option key={o}>{o}</option>)}</select>:f.type==='textarea'?<textarea id={f.key} rows={4} maxLength={f.max} required={!f.optional} value={form[f.key]??''} onChange={e=>setForm({...form,[f.key]:e.target.value})}/>:<input id={f.key} type={f.type==='number'?'number':'text'} min={f.type==='number'?1:undefined} step={f.type==='number'?1:undefined} maxLength={f.max} required={!f.optional} value={form[f.key]??''} onChange={e=>setForm({...form,[f.key]:e.target.value})}/>}</div>)}
      <button className="action-button" disabled={busy} type="submit">{busy?'Saving...':'Save Record'}</button></form></section>}
    <section className="content-card"><div className="card-heading"><h2>Records ({total})</h2></div>{loading?<p className="empty-state">Loading...</p>:<div className="table-wrapper"><table className="data-table"><thead><tr>{config.columns.map(k=><th key={k}>{labels[k]??k}</th>)}<th>Actions</th></tr></thead><tbody>{rows.map(row=><tr key={String(row[config.id])}>{config.columns.map(k=><td key={k}>{cell(row,k)}</td>)}<td><div style={{display:'flex',gap:8}}>{kind==='tickets'&&<Link className="secondary-button" to={`/tickets/${row.ticketId}`}>View Details</Link>}<button className="secondary-button" disabled={busy} onClick={()=>start(row)}>Edit</button><button className="secondary-button" style={{color:'#b91c1c'}} disabled={busy||(kind==='histories'&&row.previousStatus===null)||(kind==='tickets'&&(row.status!=='Pending'||row.assignedStaffId!==null))} onClick={()=>void remove(row)}>Delete</button></div></td></tr>)}{rows.length===0&&<tr><td colSpan={config.columns.length+1}>No records found.</td></tr>}</tbody></table></div>}
    <div className="ticket-toolbar" style={{marginTop:20}}><span>Page {page} of {Math.max(1,Math.ceil(total/limit))}</span><button className="secondary-button" disabled={page===1||loading||busy} onClick={()=>setPage(page-1)}>Previous</button><button className="secondary-button" disabled={page*limit>=total||loading||busy} onClick={()=>setPage(page+1)}>Next</button></div></section>
  </div>;
}
