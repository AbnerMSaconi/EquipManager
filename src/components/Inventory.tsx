import React, { useState, useEffect } from 'react';
import { Plus, Minus, PackagePlus, Search, Package, Calendar, MapPin, X, Download, LayoutGrid, List, Image as ImageIcon, Trash2, QrCode, ScanLine, Wrench } from 'lucide-react';
import { Item, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { api } from '../services/api';
import { exportToCSV } from '../utils/export';
import { QRCodeSVG } from 'qrcode.react';
import { Scanner } from '@yudiel/react-qr-scanner';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InventoryProps {
  user?: User;
}

export default function Inventory({ user }: InventoryProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Agora temos 'recebimento', 'retirada' e 'quebra'
  const [showActionModal, setShowActionModal] = useState<{ type: 'retirada' | 'recebimento' | 'quebra', item: Item } | null>(null);
  const [showQRModal, setShowQRModal] = useState<Item | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannedItem, setScannedItem] = useState<Item | null>(null);

  const [newItem, setNewItem] = useState({ name: '', description: '', quantity: 0, category: '', room: '', cabinet: '', shelf: '', imageUrl: '' });
  
  // Inclui observations para a quebra
  const [actionData, setActionData] = useState({ quantity: 1, destination: '', returnDeadline: '', hasDamage: false, observations: '' });

  const fetchItems = async () => {
    try {
      const data = await api.get('/items');
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem({ ...newItem, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/items', { ...newItem, quantity: Number(newItem.quantity) });
      fetchItems();
      setShowAddModal(false);
      setNewItem({ name: '', description: '', quantity: 0, category: '', room: '', cabinet: '', shelf: '', imageUrl: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showActionModal) return;

    const { type, item } = showActionModal;
    const qty = Number(actionData.quantity);

    let destination = actionData.destination;
    if (type === 'recebimento') destination = 'Reposição de Estoque';
    if (type === 'quebra') destination = 'Baixa por Avaria/Quebra';

    let obs = null;
    if (type === 'quebra') obs = `Baixa de Estoque: ${actionData.observations}`;
    if (type === 'recebimento' && actionData.hasDamage) obs = `Avaria: ${actionData.observations}`;

    try {
      await api.post('/inventory/action', {
        itemId: item.id,
        type,
        quantity: qty,
        destination,
        returnDeadline: actionData.returnDeadline || null,
        observations: obs
      });

      fetchItems();
      setShowActionModal(null);
      setActionData({ quantity: 1, destination: '', returnDeadline: '', hasDamage: false, observations: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este equipamento? Esta ação não pode ser desfeita.')) return;
    try {
      await api.delete(`/items/${id}`);
      fetchItems();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir equipamento.');
    }
  };

  const handleExport = () => {
    const exportData = items.map(item => ({
      'ID do Item': item.id,
      'Nome do Item': item.name,
      'Quantidade': item.quantity,
      'Local de Destino': `${item.room || ''} ${item.cabinet || ''} ${item.shelf || ''}`.trim(),
    }));
    exportToCSV(exportData, 'estoque.csv');
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ... (Todo o Header e Grid do Inventory continua igual até os botões da listagem) */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar equipamentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <div className="flex bg-zinc-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          <button onClick={handleExport} className="flex-1 sm:flex-none bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2">
            <Download className="w-5 h-5" /> Exportar
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-100">
            <PackagePlus className="w-5 h-5" /> Novo Item
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-zinc-300">
          <PackagePlus className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-500">Nenhum equipamento encontrado.</p>
        </div>
      ) : (
        <div className={cn(viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4")}>
          {filteredItems.map(item => (
            <motion.div layout key={item.id} className={cn("bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden", viewMode === 'list' ? "flex flex-col sm:flex-row items-center p-4 gap-6" : "p-6")}>
              {viewMode === 'grid' && item.imageUrl && (
                <div className="w-full h-48 mb-4 bg-zinc-100 rounded-xl overflow-hidden">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
              
              <div className={cn("flex-1", viewMode === 'list' && "w-full")}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded">{item.category || 'Geral'}</span>
                    <h3 className="text-lg font-bold text-zinc-900 mt-2">{item.name}</h3>
                    <p className="text-sm text-zinc-500 line-clamp-2 mt-1">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-zinc-900">{item.quantity}</span>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold">Unidades</p>
                  </div>
                </div>

                <div className={cn("grid grid-cols-4 gap-2", viewMode === 'grid' ? "mt-6" : "mt-4 sm:max-w-xl sm:ml-auto")}>
                  <button onClick={() => setShowActionModal({ type: 'recebimento', item })} className="flex items-center justify-center gap-1.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-semibold text-sm transition-colors">
                    <Plus className="w-4 h-4" /> Entrada
                  </button>
                  <button onClick={() => setShowActionModal({ type: 'retirada', item })} disabled={item.quantity === 0} className="flex items-center justify-center gap-1.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50">
                    <Minus className="w-4 h-4" /> Saída
                  </button>
                  <button onClick={() => setShowActionModal({ type: 'quebra', item })} disabled={item.quantity === 0} className="flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50">
                    <Wrench className="w-4 h-4" /> Quebra
                  </button>
                  <button onClick={() => setShowQRModal(item)} className="flex items-center justify-center gap-1.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg font-semibold text-sm transition-colors">
                    <QrCode className="w-4 h-4" /> QR
                  </button>
                </div>
                {user?.role === 'admin' && (
                  <div className="mt-3 flex justify-end">
                    <button onClick={() => handleDeleteItem(item.id)} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Excluir Item
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Action Modal (Entrada/Saída/Quebra) */}
      <AnimatePresence>
        {showActionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-zinc-900">
                  {showActionModal.type === 'recebimento' ? 'Entrada de Material' : showActionModal.type === 'quebra' ? 'Dar Baixa / Quebra' : 'Retirada de Material'}
                </h2>
                <button onClick={() => setShowActionModal(null)} className="text-zinc-400 hover:text-zinc-600"><X className="w-6 h-6" /></button>
              </div>
              <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-100">
                <p className="text-sm text-zinc-500">Equipamento:</p>
                <p className="font-bold text-zinc-900">{showActionModal.item.name}</p>
                <p className="text-xs text-zinc-400 mt-1">Estoque atual: {showActionModal.item.quantity} unidades</p>
              </div>
              <form onSubmit={handleAction} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Quantidade</label>
                  <input required type="number" min="1" max={showActionModal.type !== 'recebimento' ? showActionModal.item.quantity : undefined} value={actionData.quantity} onChange={(e) => setActionData({ ...actionData, quantity: Number(e.target.value) })} className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>

                {showActionModal.type === 'retirada' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Destino / Responsável</label>
                      <input required type="text" placeholder="Ex: Sala 302 / João Silva" value={actionData.destination} onChange={(e) => setActionData({ ...actionData, destination: e.target.value })} className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Prazo de Devolução (Opcional)</label>
                      <input type="date" value={actionData.returnDeadline} onChange={(e) => setActionData({ ...actionData, returnDeadline: e.target.value })} className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                  </>
                )}

                {showActionModal.type === 'quebra' && (
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">Motivo da Baixa/Quebra</label>
                    <textarea required rows={3} placeholder="Descreva o que aconteceu com o equipamento..." value={actionData.observations} onChange={(e) => setActionData({ ...actionData, observations: e.target.value })} className="w-full px-4 py-2 border border-red-200 bg-red-50 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none" />
                  </div>
                )}

                {showActionModal.type === 'recebimento' && (
                  <div className="space-y-4 mt-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="hasDamage" checked={actionData.hasDamage} onChange={(e) => setActionData({ ...actionData, hasDamage: e.target.checked })} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
                      <label htmlFor="hasDamage" className="text-sm font-bold text-zinc-700 cursor-pointer">Equipamento devolvido com avaria?</label>
                    </div>
                    {actionData.hasDamage && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <textarea required rows={2} value={actionData.observations} onChange={(e) => setActionData({ ...actionData, observations: e.target.value })} className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none mt-2" placeholder="Ex: Tela trincada..." />
                      </motion.div>
                    )}
                  </div>
                )}

                <button type="submit" className={cn("w-full text-white font-bold py-3 rounded-xl shadow-lg transition-all mt-4", showActionModal.type === 'recebimento' ? "bg-emerald-600 hover:bg-emerald-700" : showActionModal.type === 'quebra' ? "bg-red-600 hover:bg-red-700" : "bg-zinc-900 hover:bg-zinc-800")}>
                  Confirmar {showActionModal.type === 'recebimento' ? 'Entrada' : showActionModal.type === 'quebra' ? 'Baixa' : 'Retirada'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}