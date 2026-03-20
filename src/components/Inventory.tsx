import React, { useState, useEffect } from 'react';
import { Plus, Minus, PackagePlus, Search, Package, Calendar, MapPin, X, Download, LayoutGrid, List, Image as ImageIcon, Trash2, QrCode, ScanLine, AlertTriangle, Hammer, DollarSign } from 'lucide-react';
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
  const [showActionModal, setShowActionModal] = useState<{ type: 'retirada' | 'recebimento' | 'quebra', item: Item } | null>(null);
  const [showQRModal, setShowQRModal] = useState<Item | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannedItem, setScannedItem] = useState<Item | null>(null);

  const [newItem, setNewItem] = useState({ name: '', description: '', quantity: 0, category: '', room: '', cabinet: '', shelf: '', imageUrl: '', minQuantity: '', unitValue: '' });
  const [actionData, setActionData] = useState({ quantity: 1, destination: '', returnDeadline: '', unitValue: '', observations: '', hasDamage: false });

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
      reader.onloadend = () => setNewItem({ ...newItem, imageUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/items', {
        ...newItem,
        quantity: Number(newItem.quantity),
        minQuantity: newItem.minQuantity ? Number(newItem.minQuantity) : null,
        unitValue: newItem.unitValue ? Number(newItem.unitValue) : null
      });
      fetchItems();
      setShowAddModal(false);
      setNewItem({ name: '', description: '', quantity: 0, category: '', room: '', cabinet: '', shelf: '', imageUrl: '', minQuantity: '', unitValue: '' });
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
        unitValue: actionData.unitValue ? Number(actionData.unitValue) : null,
        observations: obs
      });

      fetchItems();
      setShowActionModal(null);
      setActionData({ quantity: 1, destination: '', returnDeadline: '', unitValue: '', observations: '', hasDamage: false });
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
      {/* Search and Add Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input type="text" placeholder="Buscar equipamentos..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <div className="flex bg-zinc-100 p-1 rounded-xl">
            <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>
              <List className="w-5 h-5" />
            </button>
          </div>
          <button onClick={handleExport} className="flex-1 sm:flex-none bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all">
            <Download className="w-5 h-5" /> Exportar
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all">
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
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded">
                        {item.category || 'Geral'}
                      </span>
                      {/* ALERTA CRÍTICO RESTAURADO */}
                      {item.minQuantity !== null && item.quantity <= item.minQuantity && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 uppercase tracking-wider bg-red-50 px-2 py-1 rounded animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> Estoque Crítico
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900">{item.name}</h3>
                    <p className="text-sm text-zinc-500 line-clamp-2 mt-1">{item.description}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {(item.room || item.cabinet || item.shelf) && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <MapPin className="w-3.5 h-3.5" />
                          {item.room && <span>Sala: {item.room}</span>}
                          {item.cabinet && <span>• Arm: {item.cabinet}</span>}
                          {item.shelf && <span>• Prat: {item.shelf}</span>}
                        </div>
                      )}
                      {item.unitValue && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>R$ {item.unitValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn("text-2xl font-black", (item.minQuantity !== null && item.quantity <= item.minQuantity) ? "text-red-600" : "text-zinc-900")}>
                      {item.quantity}
                    </span>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold">Unidades</p>
                  </div>
                </div>

                <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-2", viewMode === 'grid' ? "mt-6" : "mt-4 sm:max-w-xl sm:ml-auto")}>
                  <button onClick={() => setShowActionModal({ type: 'recebimento', item })} className="flex items-center justify-center gap-1.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-semibold text-sm transition-colors">
                    <Plus className="w-4 h-4" /> Entrada
                  </button>
                  <button onClick={() => setShowActionModal({ type: 'retirada', item })} disabled={item.quantity === 0} className="flex items-center justify-center gap-1.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50">
                    <Minus className="w-4 h-4" /> Saída
                  </button>
                  <button onClick={() => setShowActionModal({ type: 'quebra', item })} disabled={item.quantity === 0} className="flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50">
                    <Hammer className="w-4 h-4" /> Quebra
                  </button>
                  <button onClick={() => setShowQRModal(item)} className="flex items-center justify-center gap-1.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg font-semibold text-sm transition-colors">
                    <QrCode className="w-4 h-4" /> QR
                  </button>
                </div>
                {user?.role === 'admin' && (
                  <div className="mt-3 flex justify-end">
                    <button onClick={() => handleDeleteItem(item.id)} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* FAB Mobile Scanner */}
      <button onClick={() => setShowScannerModal(true)} className="fixed bottom-24 right-6 z-40 sm:hidden bg-emerald-600 text-white p-4 rounded-full shadow-xl shadow-emerald-200/50 hover:bg-emerald-700 transition-all border-4 border-white">
        <ScanLine className="w-6 h-6" />
      </button>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-zinc-900">Novo Item</h2>
                <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleAddItem} className="p-6 space-y-4">
                <div><label className="block text-sm font-medium text-zinc-700 mb-1">Nome</label><input required type="text" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-zinc-700 mb-1">Qtd Inicial</label><input required type="number" min="0" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" /></div>
                  <div><label className="block text-sm font-medium text-zinc-700 mb-1">Qtd Mín (Alerta)</label><input type="number" min="0" value={newItem.minQuantity} onChange={(e) => setNewItem({ ...newItem, minQuantity: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-zinc-700 mb-1">Valor Unitário</label><input type="number" step="0.01" min="0" value={newItem.unitValue} onChange={(e) => setNewItem({ ...newItem, unitValue: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" /></div>
                  <div><label className="block text-sm font-medium text-zinc-700 mb-1">Categoria</label><input type="text" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" /></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="block text-sm font-medium text-zinc-700 mb-1">Sala</label><input type="text" value={newItem.room} onChange={(e) => setNewItem({ ...newItem, room: e.target.value })} className="w-full px-2 py-2 border rounded-lg text-sm" /></div>
                  <div><label className="block text-sm font-medium text-zinc-700 mb-1">Armário</label><input type="text" value={newItem.cabinet} onChange={(e) => setNewItem({ ...newItem, cabinet: e.target.value })} className="w-full px-2 py-2 border rounded-lg text-sm" /></div>
                  <div><label className="block text-sm font-medium text-zinc-700 mb-1">Prat</label><input type="text" value={newItem.shelf} onChange={(e) => setNewItem({ ...newItem, shelf: e.target.value })} className="w-full px-2 py-2 border rounded-lg text-sm" /></div>
                </div>
                <div><label className="block text-sm font-medium text-zinc-700 mb-1">Descrição</label><textarea rows={2} value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg resize-none" /></div>
                <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl">Cadastrar</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Action Modal */}
      <AnimatePresence>
        {showActionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-zinc-900">
                  {showActionModal.type === 'recebimento' ? 'Entrada' : showActionModal.type === 'quebra' ? 'Dar Baixa/Quebra' : 'Retirada'}
                </h2>
                <button onClick={() => setShowActionModal(null)} className="text-zinc-400 hover:text-zinc-600"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleAction} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Quantidade</label>
                  <input required type="number" min="1" max={showActionModal.type !== 'recebimento' ? showActionModal.item.quantity : undefined} value={actionData.quantity} onChange={(e) => setActionData({ ...actionData, quantity: Number(e.target.value) })} className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>

                {showActionModal.type === 'retirada' && (
                  <>
                    <div><label className="block text-sm font-medium text-zinc-700 mb-1">Destino / Responsável</label><input required type="text" value={actionData.destination} onChange={(e) => setActionData({ ...actionData, destination: e.target.value })} className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-emerald-500" /></div>
                    <div><label className="block text-sm font-medium text-zinc-700 mb-1">Prazo de Devolução</label><input type="date" value={actionData.returnDeadline} onChange={(e) => setActionData({ ...actionData, returnDeadline: e.target.value })} className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-emerald-500" /></div>
                  </>
                )}

                {showActionModal.type === 'quebra' && (
                  <div><label className="block text-sm font-medium text-red-700 mb-1">Motivo da Quebra</label><textarea required rows={3} value={actionData.observations} onChange={(e) => setActionData({ ...actionData, observations: e.target.value })} className="w-full px-4 py-2 border border-red-200 bg-red-50 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none" /></div>
                )}

                <button type="submit" className={cn("w-full text-white font-bold py-3 rounded-xl transition-all mt-4", showActionModal.type === 'recebimento' ? "bg-emerald-600 hover:bg-emerald-700" : showActionModal.type === 'quebra' ? "bg-red-600 hover:bg-red-700" : "bg-zinc-900 hover:bg-zinc-800")}>
                  Confirmar
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR e Scanner Modals mantidos padrão */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-8 flex flex-col items-center"><div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100 mb-4"><QRCodeSVG value={`ITEM:${showQRModal.id}`} size={200} /></div><p className="font-bold text-zinc-900 text-center">{showQRModal.name}</p><button onClick={() => setShowQRModal(null)} className="mt-6 text-zinc-500">Fechar</button></motion.div></div>
        )}
        {showScannerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/90 backdrop-blur-sm"><div className="w-full max-w-md p-4"><button onClick={() => setShowScannerModal(false)} className="bg-white text-black p-2 rounded-full absolute top-4 right-4 z-10"><X /></button><div className="rounded-xl overflow-hidden aspect-square"><Scanner onScan={(r) => { if(r?.length){ const item = items.find(i => i.id === parseInt(r[0].rawValue.replace('ITEM:',''))); if(item){ setShowScannerModal(false); setScannedItem(item); } } }} onError={(e) => { console.error(e); setShowScannerModal(false); }} /></div></div></div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {scannedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl p-6 w-full max-w-sm"><h2 className="text-xl font-bold mb-4">{scannedItem.name}</h2><div className="grid grid-cols-3 gap-2"><button onClick={() => { setShowActionModal({ type: 'recebimento', item: scannedItem }); setScannedItem(null); }} className="bg-emerald-50 py-3 rounded-lg"><Plus className="mx-auto" /></button><button onClick={() => { setShowActionModal({ type: 'retirada', item: scannedItem }); setScannedItem(null); }} className="bg-amber-50 py-3 rounded-lg"><Minus className="mx-auto" /></button><button onClick={() => { setShowActionModal({ type: 'quebra', item: scannedItem }); setScannedItem(null); }} className="bg-red-50 py-3 rounded-lg"><Hammer className="mx-auto" /></button></div><button onClick={() => setScannedItem(null)} className="w-full mt-4 text-zinc-500">Cancelar</button></motion.div></div>
        )}
      </AnimatePresence>
    </div>
  );
}