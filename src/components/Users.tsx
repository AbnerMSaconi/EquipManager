import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Trash2, Shield, User as UserIcon, AlertCircle, Pencil, X, Save, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface UserFormData {
  rf: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const emptyForm: UserFormData = { rf: '', username: '', password: '', role: 'user' };
  const [form, setForm] = useState<UserFormData>(emptyForm);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const data = await api.get('/users');
      setUsers(data);
    } catch (err: any) {
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setForm(emptyForm);
    setShowPassword(false);
    setError('');
    setShowAddModal(true);
  };

  const openEdit = (u: User) => {
    setForm({ rf: u.rf || '', username: u.username || '', password: '', role: u.role });
    setShowPassword(false);
    setError('');
    setEditingUser(u);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setEditingUser(null);
    setError('');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', form);
      closeModals();
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar usuário');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setError('');
    try {
      await api.put(`/users/${editingUser.id}`, form);
      closeModals();
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erro ao editar usuário');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este usuário permanentemente?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch {
      setError('Erro ao excluir usuário');
    }
  };

  const UserFormModal = ({ title, onSubmit, isEdit }: { title: string; onSubmit: (e: React.FormEvent) => void; isEdit?: boolean }) => (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900">{title}</h2>
          <button onClick={closeModals} className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">RF</label>
              <input
                required
                type="text"
                value={form.rf}
                onChange={(e) => setForm({ ...form, rf: e.target.value })}
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="Ex: 123456"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">Usuário</label>
              <input
                required
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="Nome de login"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">
              {isEdit ? 'Nova Senha (deixe vazio para manter)' : 'Senha'}
            </label>
            <div className="relative">
              <input
                required={!isEdit}
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2.5 pr-10 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder={isEdit ? 'Nova senha (opcional)' : '••••••••'}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">Nível de Acesso</label>
            <div className="grid grid-cols-2 gap-2">
              {(['user', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all",
                    form.role === r
                      ? r === 'admin' ? "border-purple-500 bg-purple-50 text-purple-700" : "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                  )}
                >
                  {r === 'admin' ? <Shield className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                  {r === 'admin' ? 'Admin' : 'Usuário'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={closeModals}
              className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              {isEdit ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900">Usuários</h2>
          <p className="text-xs text-zinc-400 mt-0.5">{users.length} cadastrado{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm shadow-blue-100 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Usuário</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {/* Error */}
      {error && !showAddModal && !editingUser && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase text-zinc-400 font-bold">
                <th className="px-5 py-3.5">RF</th>
                <th className="px-5 py-3.5">Usuário</th>
                <th className="px-5 py-3.5">Nível</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-zinc-400 text-sm">Nenhum usuário encontrado</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-mono font-medium text-zinc-700">{u.rf || '-'}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-zinc-900">{u.username || '-'}</td>
                  <td className="px-5 py-3.5">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-zinc-100 text-zinc-600'
                    )}>
                      {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                      {u.role === 'admin' ? 'Admin' : 'Usuário'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden divide-y divide-zinc-100">
          {users.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-sm">Nenhum usuário encontrado</div>
          ) : users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50 transition-colors">
              <div className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-zinc-600 uppercase">
                  {(u.username || u.rf || '?')[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-900 truncate">{u.username || '-'}</span>
                  <span className={cn(
                    "shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold",
                    u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-zinc-100 text-zinc-500'
                  )}>
                    {u.role === 'admin' ? <Shield className="w-2.5 h-2.5" /> : <UserIcon className="w-2.5 h-2.5" />}
                    {u.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono">RF: {u.rf || '-'}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(u)} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(u.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && <UserFormModal title="Novo Usuário" onSubmit={handleAdd} />}
        {editingUser && <UserFormModal title="Editar Usuário" onSubmit={handleEdit} isEdit />}
      </AnimatePresence>
    </div>
  );
}
