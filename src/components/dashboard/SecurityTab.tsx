import React from 'react';
import { AuditLog, Backup, SystemUser } from '../../types';

interface SecurityTabProps {
  systemUsers?: SystemUser[];
  backups?: Backup[];
  auditLogs?: AuditLog[];
}

export function SecurityTab({ systemUsers = [], backups = [], auditLogs = [] }: SecurityTabProps) {
  const activeUsers = systemUsers.filter((user) => user.status === 'Activo').length;

  return (
    <div id="security" className="max-w-5xl">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Seguridad</h1>
        <p className="text-slate-500 mt-1">Monitorea acceso, actividad y respaldos del sistema</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Usuarios del Sistema</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{systemUsers.length}</p>
          <p className="text-xs text-slate-500 mt-2">{activeUsers} activos</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Eventos de Auditoría</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{auditLogs.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Backups</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{backups.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800">Usuarios y Accesos</h3>
          </div>
          {systemUsers.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No hay usuarios adicionales registrados.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {systemUsers.slice(0, 6).map((user) => (
                <li key={user.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email} · {user.role}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${user.status === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {user.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800">Auditoría Reciente</h3>
          </div>
          {auditLogs.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No hay eventos recientes de auditoría.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {auditLogs.slice(0, 6).map((log) => (
                <li key={log.id} className="p-4">
                  <p className="text-sm font-semibold text-slate-800">{log.action}</p>
                  <p className="text-xs text-slate-500 mt-1">{log.details}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
