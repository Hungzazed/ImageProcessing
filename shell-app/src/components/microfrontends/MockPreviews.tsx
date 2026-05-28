'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { emitEvent } from '../../events/eventBus';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  Terminal, 
  Cpu, 
  Image as ImageIcon, 
  Database,
  Layers, 
  Plus, 
  ShieldCheck, 
  ShieldAlert, 
  Trash2,
  Play
} from 'lucide-react';
import { motion } from 'framer-motion';

// ==========================================
// 1. AUTH APP MOCK PREVIEW
// ==========================================
export function AuthMock() {
  const { login } = useAuthStore();
  const [email, setEmail] = useState('admin@grid.io');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('Major Kusanagi');
  const [isRegister, setIsRegister] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Registry credentials required.');
      return;
    }

    // Role assignment based on email config
    const role = email.includes('admin') ? 'admin' : 'user';
    const finalName = isRegister ? name : (role === 'admin' ? 'Major Kusanagi' : 'Bato Tech');

    const mockUser = {
      id: Math.random().toString(36).substr(2, 9),
      name: finalName,
      email,
      role: role as 'admin' | 'user',
      avatar: '',
    };

    // Authenticate
    login('mock_access_token_' + Date.now(), 'mock_refresh_token_' + Date.now(), mockUser);
    
    // Emit Custom Event Bus events
    emitEvent('auth-login', { 
      accessToken: 'mock_access_token', 
      refreshToken: 'mock_refresh_token', 
      user: mockUser 
    });
    emitEvent('notification', { 
      message: `Console Link Established: Welcome back, ${finalName}`, 
      type: 'success' 
    });

    // Navigate to dashboard using decoupled event router orchestration
    emitEvent('navigate', { path: '/dashboard' });
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-gray-900/50 border border-cyan-500/10 backdrop-blur-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] text-gray-300 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-accent-cyan/10 to-transparent blur-xl pointer-events-none" />
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-indigo">
          {isRegister ? 'Register Registry' : 'Establish Session'}
        </h2>
        <p className="text-xs text-gray-500 mt-2">
          {isRegister ? 'Initialize grid network user keys' : 'Access Quantum Shell Console'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1.5">User Handle</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3.5 text-gray-500" size={16} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-950 border border-cyan-500/15 focus:border-accent-cyan rounded-lg py-3 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-600 outline-none transition-all"
                placeholder="Major Kusanagi"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1.5">Console ID Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-500" size={16} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-950 border border-cyan-500/15 focus:border-accent-cyan rounded-lg py-3 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-600 outline-none transition-all"
              placeholder="admin@grid.io"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1.5">Console Key Crypt</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-500" size={16} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-950 border border-cyan-500/15 focus:border-accent-cyan rounded-lg py-3 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-600 outline-none transition-all"
              placeholder="••••••••••••"
            />
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs text-accent-rose text-center bg-rose-950/20 border border-rose-500/20 p-2 rounded-lg">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-gradient-to-r from-accent-cyan to-accent-indigo text-sm font-semibold uppercase tracking-wider text-white hover:brightness-110 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer mt-6"
        >
          {isRegister ? 'Inject Profile' : 'Authenticate Console'}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-cyan-500/5 text-center">
        <button
          onClick={() => {
            setIsRegister(!isRegister);
            setErrorMsg('');
          }}
          className="text-xs text-accent-cyan hover:underline transition-all"
        >
          {isRegister ? 'Return to Access Panel' : 'Need authorization credentials? Register'}
        </button>
      </div>

      <div className="mt-8 p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/15 text-[10px] leading-relaxed text-gray-500">
        <p className="font-bold text-accent-cyan mb-1">Developer Credentials Checklist:</p>
        <p className="flex justify-between mt-1">
          <span>Admin Access: <strong>admin@grid.io</strong></span>
          <span>pass: <strong>password123</strong></span>
        </p>
        <p className="flex justify-between mt-0.5">
          <span>User Access: <strong>user@grid.io</strong></span>
          <span>pass: <strong>password123</strong></span>
        </p>
      </div>
    </div>
  );
}

// ==========================================
// 2. DASHBOARD APP MOCK PREVIEW
// ==========================================
export function DashboardMock() {
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([
    '[Grid] Connection established on local cluster.',
    '[Consumer] SQS Notification Queue running: Listening...',
  ]);
  const [stats, setStats] = useState({
    queued: 0,
    processing: 0,
    completed: 148,
    failed: 3,
  });

  const runPipelineSim = () => {
    setStats(prev => ({ ...prev, queued: prev.queued + 1 }));
    setPipelineLogs(prev => [
      `[JobStart] Generating Image jobId: ${Math.random().toString(36).substr(2, 9)}`,
      ...prev
    ]);
    
    emitEvent('notification', { 
      message: 'AWS SQS: Image processing job triggered.', 
      type: 'info' 
    });

    setTimeout(() => {
      setStats(prev => ({ ...prev, queued: Math.max(0, prev.queued - 1), processing: prev.processing + 1 }));
      setPipelineLogs(prev => [
        '[ResizeStage] Resizing source raw node: scale 800x600 (Sharp engine success).',
        ...prev
      ]);
    }, 1500);

    setTimeout(() => {
      setPipelineLogs(prev => [
        '[FilterStage] Sepia matrix filter compiled and rendering completed.',
        ...prev
      ]);
    }, 3000);

    setTimeout(() => {
      setStats(prev => ({ ...prev, processing: Math.max(0, prev.processing - 1), completed: prev.completed + 1 }));
      setPipelineLogs(prev => [
        '[CompressStage] WebP output compression complete (Optimized 84% capacity).',
        '[GridSuccess] Target saved to AWS S3 processed/ bucket.',
        ...prev
      ]);
      emitEvent('notification', { 
        message: 'Pipeline finished: Image successfully processed & saved to S3 bucket.', 
        type: 'success' 
      });
    }, 4500);
  };

  const triggerErrorSim = () => {
    setStats(prev => ({ ...prev, failed: prev.failed + 1 }));
    setPipelineLogs(prev => [
      '[GridError] COMPRESSION PIPELINE HALTED: ENOMEM Exception inside Lambda process.',
      ...prev
    ]);
    emitEvent('notification', { 
      message: 'AWS Lambda Error: Image compression crashed in watermarking process.', 
      type: 'error' 
    });
  };

  return (
    <div className="space-y-6 text-gray-300">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: 'SQS Jobs Queued', count: stats.queued, color: 'text-accent-cyan', bg: 'bg-cyan-950/20', border: 'border-cyan-500/25' },
          { name: 'Lambda Workers Active', count: stats.processing, color: 'text-accent-indigo', bg: 'bg-indigo-950/20', border: 'border-indigo-500/25' },
          { name: 'Pipeline Executed', count: stats.completed, color: 'text-accent-emerald', bg: 'bg-emerald-950/20', border: 'border-emerald-500/25' },
          { name: 'System Interrupted', count: stats.failed, color: 'text-accent-rose', bg: 'bg-rose-950/20', border: 'border-rose-500/25' },
        ].map((stat, i) => (
          <div key={i} className={`p-4 rounded-xl border ${stat.border} ${stat.bg} backdrop-blur-md relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-white/5 to-transparent blur-md" />
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500">{stat.name}</p>
            <h3 className={`text-2xl font-bold tracking-tight mt-2 ${stat.color} drop-shadow-[0_0_10px_rgba(6,182,212,0.15)]`}>
              {stat.count}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operations Control Center */}
        <div className="p-6 rounded-2xl bg-gray-900/40 border border-cyan-500/10 backdrop-blur-md space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-indigo flex items-center gap-2">
            <Cpu size={16} className="text-accent-cyan" />
            <span>Operational Controls</span>
          </h3>
          <p className="text-xs text-gray-500 leading-normal">
            Interact with the serverless SQS message brokers and simulate active pipelines loaded through AWS Lambda modules.
          </p>
          
          <div className="space-y-3 pt-2">
            <button
              onClick={runPipelineSim}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs font-semibold text-accent-cyan hover:bg-cyan-950/60 transition-all cursor-pointer"
            >
              <Play size={12} fill="currentColor" />
              <span>Simulate SQS Image pipeline</span>
            </button>
            
            <button
              onClick={triggerErrorSim}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-rose-950/20 border border-rose-500/20 text-xs font-semibold text-accent-rose hover:bg-rose-950/40 transition-all cursor-pointer"
            >
              <ShieldAlert size={12} />
              <span>Simulate Pipeline Lambda Crash</span>
            </button>
          </div>
        </div>

        {/* Live Grid Logging */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-gray-900/40 border border-cyan-500/10 backdrop-blur-md flex flex-col h-[280px]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-accent-cyan" />
              <span>System Orchestration Logs</span>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-emerald opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-emerald"></span>
            </span>
          </h3>

          <div className="flex-1 bg-gray-950 border border-cyan-500/5 rounded-xl p-4 font-mono text-[10px] text-gray-400 overflow-y-auto space-y-2 select-text">
            {pipelineLogs.map((log, index) => {
              let color = 'text-gray-400';
              if (log.includes('[GridError]')) color = 'text-accent-rose font-semibold';
              if (log.includes('[GridSuccess]')) color = 'text-accent-emerald';
              if (log.includes('[JobStart]')) color = 'text-accent-cyan';
              
              return (
                <div key={index} className="flex gap-2">
                  <span className="text-gray-600">{`>${index + 1}`}</span>
                  <span className={color}>{log}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. USERS APP MOCK PREVIEW
// ==========================================
interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
}

export function UsersMock() {
  const [users, setUsers] = useState<UserRecord[]>([
    { id: '1', name: 'Major Motoko Kusanagi', email: 'major@section9.jp', role: 'admin', status: 'active' },
    { id: '2', name: 'Bato Cybernetic', email: 'bato@section9.jp', role: 'user', status: 'active' },
    { id: '3', name: 'Togusa Natural', email: 'togusa@section9.jp', role: 'user', status: 'active' },
  ]);

  const addUserSim = () => {
    const names = ['Aramaki Chief', 'Ishikawa Tech', 'Saito Scope', 'Pazu Informant', 'Borma Heavy'];
    const selectedName = names[Math.floor(Math.random() * names.length)];
    const username = selectedName.split(' ')[0].toLowerCase();
    
    const newUser: UserRecord = {
      id: Math.random().toString(36).substr(2, 9),
      name: selectedName,
      email: `${username}@section9.jp`,
      role: 'user',
      status: 'active'
    };

    setUsers(prev => [...prev, newUser]);
    emitEvent('notification', { 
      message: `User Registry: Added ${selectedName} to the access database.`, 
      type: 'success' 
    });
  };

  const toggleRoleSim = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextRole = u.role === 'admin' ? 'user' : 'admin';
        emitEvent('notification', { 
          message: `User Registry: Updated ${u.name} role to ${nextRole.toUpperCase()}`, 
          type: 'info' 
        });
        return { ...u, role: nextRole };
      }
      return u;
    }));
  };

  const removeUserSim = (id: string, name: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    emitEvent('notification', { 
      message: `User Registry: Terminated access permissions for ${name}`, 
      type: 'warning' 
    });
  };

  return (
    <div className="space-y-6 text-gray-300">
      {/* Top action header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-200">Registered Access Profiles</h3>
          <p className="text-xs text-gray-500 mt-1">Manage global system administrators and standard operators.</p>
        </div>

        <button
          onClick={addUserSim}
          className="flex items-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-accent-cyan to-accent-indigo text-xs font-semibold text-white hover:brightness-110 shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all cursor-pointer"
        >
          <Plus size={14} />
          <span>Add System Agent</span>
        </button>
      </div>

      {/* Modern High-Tech Table */}
      <div className="bg-gray-900/40 border border-cyan-500/10 rounded-2xl backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-cyan-500/10 bg-gray-950/40 text-[10px] uppercase font-bold tracking-widest text-gray-500">
                <th className="p-4">Agent Name</th>
                <th className="p-4">Secure Credentials</th>
                <th className="p-4">Clearance Role</th>
                <th className="p-4">Grid Status</th>
                <th className="p-4 text-center">Operation Keys</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-500/5">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-cyan-500/[0.02] transition-colors">
                  <td className="p-4 font-semibold text-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/20 text-accent-cyan font-bold flex items-center justify-center text-[10px] uppercase">
                        {u.name.slice(0, 2)}
                      </div>
                      <span>{u.name}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-gray-400">{u.email}</td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleRoleSim(u.id)}
                      className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase flex items-center gap-1 cursor-pointer transition-all ${
                        u.role === 'admin'
                          ? 'text-accent-rose bg-rose-950/20 border-rose-500/20 hover:bg-rose-950/40'
                          : 'text-accent-cyan bg-cyan-950/20 border-cyan-500/20 hover:bg-cyan-950/40'
                      }`}
                    >
                      {u.role === 'admin' ? <ShieldCheck size={10} /> : <UserIcon size={10} />}
                      <span>{u.role}</span>
                    </button>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1.5 text-accent-emerald font-semibold uppercase text-[10px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald animate-pulse" />
                      <span>{u.status}</span>
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => removeUserSim(u.id, u.name)}
                        className="p-1.5 rounded text-gray-500 hover:text-accent-rose hover:bg-rose-950/30 transition-all cursor-pointer"
                        title="Revoke Permission Registry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
