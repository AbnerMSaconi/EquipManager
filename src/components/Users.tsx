import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Trash2, Shield, User as UserIcon, AlertCircle, Pencil, X, Save } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Add User States
  const [isAdding, setIsAdding] = useState(false);
  const [newRf, setNewRf] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');

  // Edit User States
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRf, setEditRf] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', { rf: newRf, username: newUsername, password: newPassword, role: newRole });
      setIsAdding(false);
      setNewRf('');
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar usuário. Verifique se o RF já existe.');
    }
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setEditRf(u.rf || '');
    setEditUsername(u.username || u.email || '');
    setEditPassword('');
    setEditRole((u.role as 'admin' | 'user') || 'user');
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede o recarregamento da página que causava o "logout"
    try {
      await api.put(`/users/${editingUser!.id}`, { 
        rf: editRf, 
        username: editUsername, 
        password: editPassword, 
        role: editRole 
      });
      
      // REGRA DE OURO: Se o usuário logado editar o próprio perfil, atualizamos o Cache para ele não cair
      const currentUserStr = localStorage.getItem('user');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser.id === editingUser!.id) {
          currentUser.rf = editRf;
          currentUser.username = editUsername;
          currentUser.role = editRole;
          localStorage.setItem('user', JSON.stringify(currentUser));
          
          // Dá um refresh suave apenas para o sistema principal atualizar o nome no cabeçalho
          window.location.reload(); 
          return;
        }
      }
      
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erro ao editar usuário. O RF pode já estar em uso.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      setError('Erro ao excluir usuário');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Gerenciamento de Usuários</h2>
          <p className="text-zinc-500 text-sm mt-1">Adicione ou gerencie usuários do sistema</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-sm shadow-blue-100 flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Novo Usuário
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-2 font-medium">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Box de Adicionar Usuário */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm mb-6">
              <h3 className="text-lg font-bold text-zinc-900 mb-4">Adicionar Novo Usuário</h3>
              <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Registro Funcional (RF)</label>
                  <input type="text" required value={newRf} onChange={(e) => setNewRf(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="RF do usuário" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Nome de Usuário</label>
                  <input type="text" required value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Nome de usuário" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Senha</label>
                  <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Senha de acesso" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Nível de Acesso</label>
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                    <option value="user">Usuário Padrão</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                  <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl font-semibold transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-sm shadow-blue-100">
                    Salvar Usuário
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-6 py-4 text-sm font-bold text-zinc-500 uppercase tracking-wider">RF</th>
                <th className="px-6 py-4 text-sm font-bold text-zinc-500 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-4 text-sm font-bold text-zinc-500 uppercase tracking-wider">Permissão</th>
                <th className="px-6 py-4 text-sm font-bold text-zinc-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-zinc-900 font-bold">{u.rf || '-'}</td>
                  <td className="px-6 py-4 text-sm text-zinc-600 font-medium">{u.username || u.email || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-zinc-100 text-zinc-700'
                    }`}>
                      {u.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
                      {u.role === 'admin' ? 'Admin' : 'Usuário'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(u)} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar Usuário">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir Usuário">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    <UserIcon className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição de Usuário */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-zinc-900">Editar Usuário</h2>
                <button onClick={() => setEditingUser(null)} className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>
              <form onSubmit={handleEditUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Registro Funcional (RF)</label>
                  <input type="text" required value={editRf} onChange={(e) => setEditRf(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Nome de Usuário</label>
                  <input type="text" required value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Nova Senha (Opcional)</label>
                  <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Deixe em branco para não alterar" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Nível de Acesso</label>
                  <select value={editRole} onChange={(e) => setEditRole(e.target.value as 'admin' | 'user')} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                    <option value="user">Usuário Padrão</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition-all">
                  <Save className="w-5 h-5" /> Salvar Alterações
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}