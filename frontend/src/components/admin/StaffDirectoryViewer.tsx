import React, { useEffect, useState } from 'react';
import { Users, Search, UserCheck, Mail, Briefcase, Building, ShieldCheck, UserPlus, RefreshCw } from 'lucide-react';
import { fetchUsersListApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User, Role } from '../../types';

export const StaffDirectoryViewer: React.FC = () => {
  const { token } = useAuth();
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('All');

  const loadStaff = async () => {
    setLoading(true);
    try {
      const users = await fetchUsersListApi(token);
      setStaffList(users || []);
    } catch (e) {
      console.warn('Failed to load staff directory:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [token]);

  // Filter staff by search query and role filter
  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (staff.job_title && staff.job_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (staff.department?.name && staff.department.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = selectedRole === 'All' || staff.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const countByRole = (role: Role) => staffList.filter((s) => s.role === role).length;

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'Admin':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
            👑 Admin
          </span>
        );
      case 'TeamLead':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
            👔 Team Lead
          </span>
        );
      case 'Technician':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
            🛠️ Technician
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            👤 Employee
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center">
            <UserCheck className="w-5 h-5 mr-2 text-blue-400" /> Registered Staff Directory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Overview of enterprise staff accounts, roles, assignments, and active departments
          </p>
        </div>

        <button
          onClick={loadStaff}
          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Role Distribution Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <p className="text-[11px] font-medium text-slate-400">Total Staff</p>
          <p className="text-xl font-bold text-white mt-0.5">{staffList.length}</p>
        </div>

        <div className="bg-slate-900/80 border border-purple-500/20 p-3.5 rounded-xl">
          <p className="text-[11px] font-medium text-purple-300">Administrators</p>
          <p className="text-xl font-bold text-purple-200 mt-0.5">{countByRole('Admin')}</p>
        </div>

        <div className="bg-slate-900/80 border border-emerald-500/20 p-3.5 rounded-xl">
          <p className="text-[11px] font-medium text-emerald-300">Team Leads</p>
          <p className="text-xl font-bold text-emerald-200 mt-0.5">{countByRole('TeamLead')}</p>
        </div>

        <div className="bg-slate-900/80 border border-blue-500/20 p-3.5 rounded-xl">
          <p className="text-[11px] font-medium text-blue-300">Technicians</p>
          <p className="text-xl font-bold text-blue-200 mt-0.5">{countByRole('Technician')}</p>
        </div>
      </div>

      {/* Search & Role Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['All', 'Employee', 'Technician', 'TeamLead', 'Admin'].map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedRole === role
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {role === 'All' ? 'All Roles' : role === 'TeamLead' ? 'Team Lead' : role}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search name, email, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Staff Table */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading registered staff members...</div>
        ) : filteredStaff.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 bg-slate-950/50 rounded-xl border border-slate-800/80">
            No registered staff members found matching "{searchQuery}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 font-semibold">
                  <th className="pb-2.5 pl-2">Staff Member</th>
                  <th className="pb-2.5">System Role</th>
                  <th className="pb-2.5">Job Title</th>
                  <th className="pb-2.5">Department</th>
                  <th className="pb-2.5 text-right pr-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id || staff.email} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 pl-2">
                      <div className="flex items-center space-x-3">
                        {staff.avatar_url ? (
                          <img
                            src={staff.avatar_url}
                            alt={staff.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                            {staff.name ? staff.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white leading-tight">{staff.name}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-500" /> {staff.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">{getRoleBadge(staff.role)}</td>
                    <td className="py-3 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{staff.job_title || 'Staff Member'}</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{staff.department?.name || 'General Operations'}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right pr-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        ● Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
