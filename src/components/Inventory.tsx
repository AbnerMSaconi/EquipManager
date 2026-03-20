import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Minus, PackagePlus, Search, MapPin, X, Download,
  LayoutGrid, List, Trash2, QrCode, ScanLine, AlertTriangle,
  Hammer, DollarSign, Pencil, Save, Image as ImageIcon, Upload, Link2, Trash
} from 'lucide-react';
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

interface InventoryProps { user?: User; }

const emptyItem = {
  name: '', description: '', quantity: 0, category: '',
  room: '', cabinet: '', shelf: '', imageUrl: '',
  minQuantity: '', unitValue: ''
};

export default function Inventory({ user }: InventoryProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showActionModal, setShowActionModal] = useState<{ type: 'retirada' | 'recebimento' | 'quebra'; item: Item } | null>(null);
  const [showQRModal, setShowQRModal] = useState<Item | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannedItem, setScannedItem] = useState<Item | null>(null);
  const [newItem, setNewItem] = useState({ ...emptyItem });
  const [editForm, setEditForm] = useState({ ...emptyItem });
  const [actionData, setActionData] = useState({
    quantity: 1, destination: '', returnDeadline: '',
    unitValue: '', observations: '', hasDamage: false
  });

  const fetchItems = async () => {
    try {
      const data = await api.get('/items');
      setItems(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const openEdit = (item: Item) => {
    setEditForm({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity as any,
      category: item.category || '',
      room: item.room || '',
      cabinet: item.cabinet || '',
      shelf: item.shelf || '',
      imageUrl: item.imageUrl || '',
      minQuantity: item.minQuantity != null ? String(item.minQuantity) : '',
      unitValue: item.unitValue != null ? String(item.unitValue) : '',
    });
    setEditingItem(item);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/items', {
        ...newItem,
        quantity: Number(newItem.quantity),
        minQuantity: newItem.minQuantity ? Number(newItem.minQuantity) : null,
        unitValue: newItem.unitValue ? Number(newItem.unitValue) : null,
      });
      fetchItems();
      setShowAddModal(false);
      setNewItem({ ...emptyItem });
    } catch (err) { console.error(err); }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      await api.put(`/items/${editingItem.id}`, {
        ...editForm,
        minQuantity: editForm.minQuantity ? Number(editForm.minQuantity) : null,
        unitValue: editForm.unitValue ? Number(editForm.unitValue) : null,
      });
      fetchItems();
      setEditingItem(null);
    } catch (err) { console.error(err); }
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
    try {
      await api.post('/inventory/action', {
        itemId: item.id, type, quantity: qty, destination,
        returnDeadline: actionData.returnDeadline || null,
        unitValue: actionData.unitValue ? Number(actionData.unitValue) : null,
        observations: obs,
      });
      fetchItems();
      setShowActionModal(null);
      setActionData({ quantity: 1, destination: '', returnDeadline: '', unitValue: '', observations: '', hasDamage: false });
    } catch (err) { console.error(err); }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Excluir este item? Esta ação não pode ser desfeita.')) return;
    try { await api.delete(`/items/${id}`); fetchItems(); }
    catch { alert('Erro ao excluir.'); }
  };

  const handleExport = () => {
    exportToCSV(items.map(i => ({
      'ID': i.id, 'Nome': i.name, 'Categoria': i.category || '',
      'Quantidade': i.quantity, 'Sala': i.room || '',
      'Armário': i.cabinet || '', 'Prateleira': i.shelf || '',
    })), 'estoque.csv');
  };

  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category?.toLowerCase().includes(search.toLowerCase())
  );

  // Shared form fields for add/edit
  const ItemFormFields = ({ data, setData }: { data: typeof emptyItem; setData: (d: any) => void }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [urlMode, setUrlMode] = useState(false);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Limit to 2MB
      if (file.size > 2 * 1024 * 1024) {
        alert('Imagem muito grande. Use uma imagem menor que 2 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setData({ ...data, imageUrl: reader.result as string });
      reader.readAsDataURL(file);
    };

    return (
      <>
        {/* Image upload */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">Imagem do Item</label>

          {data.imageUrl ? (
            /* Preview */
            <div className="relative w-full h-36 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 group">
              <img
                src={data.imageUrl}
                alt="preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white text-zinc-800 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md"
                >
                  <Upload className="w-3.5 h-3.5" /> Trocar
                </button>
                <button
                  type="button"
                  onClick={() => setData({ ...data, imageUrl: '' })}
                  className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md"
                >
                  <Trash className="w-3.5 h-3.5" /> Remover
                </button>
              </div>
            </div>
          ) : (
            /* Upload area */
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-28 border-2 border-dashed border-zinc-300 hover:border-blue-400 hover:bg-blue-50 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group"
              >
                <div className="w-9 h-9 bg-zinc-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center transition-colors">
                  <ImageIcon className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-zinc-600">Clique para fazer upload</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">PNG, JPG ou WEBP · máx 2 MB</p>
                </div>
              </button>

              {/* URL toggle */}
              <button
                type="button"
                onClick={() => setUrlMode(!urlMode)}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <Link2 className="w-3.5 h-3.5" />
                {urlMode ? 'Cancelar URL' : 'Ou inserir por URL'}
              </button>
              {urlMode && (
                <input
                  type="url"
                  value={data.imageUrl}
                  onChange={(e) => setData({ ...data, imageUrl: e.target.value })}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">Nome *</label>
          <input required type="text" value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">Categoria</label>
            <input type="text" value={data.category}
              onChange={(e) => setData({ ...data, category: e.target.value })}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">Valor Unit. (R$)</label>
            <input type="number" step="0.01" min="0" value={data.unitValue}
              onChange={(e) => setData({ ...data, unitValue: e.target.value })}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">Qtd Mín (alerta crítico)</label>
          <input type="number" min="0" value={data.minQuantity}
            onChange={(e) => setData({ ...data, minQuantity: e.target.value })}
            className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            placeholder="Ex: 2" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">Localização</label>
          <div className="grid grid-cols-3 gap-2">
            {(['room', 'cabinet', 'shelf'] as const).map((field, i) => (
              <div key={field}>
                <span className="block text-[10px] text-zinc-400 mb-1">{['Sala', 'Armário', 'Prat.'][i]}</span>
                <input type="text" value={(data as any)[field]}
                  onChange={(e) => setData({ ...data, [field]: e.target.value })}
                  className="w-full px-2 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">Descrição</label>
          <textarea rows={2} value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl resize-none text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </>
    );
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input type="text" placeholder="Buscar equipamentos..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" />
        </div>
        <div className="flex gap-2">
          <div className="flex bg-zinc-100 p-1 rounded-xl">
            {(['grid', 'list'] as const).map((m) => (
              <button key={m} onClick={() => setViewMode(m)}
                className={cn("p-1.5 rounded-lg transition-all", viewMode === m ? "bg-white shadow-sm text-zinc-900" : "text-zinc-400")}>
                {m === 'grid'
                  ? <LayoutGrid className="w-4 h-4" />
                  : <List className="w-4 h-4" />}
              </button>
            ))}
          </div>
          <button onClick={handleExport}
            className="bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm shadow-blue-100 transition-all">
            <PackagePlus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Item</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </div>

      {/* Item count */}
      {!loading && (
        <p className="text-xs text-zinc-400">
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} encontrado{filteredItems.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Items */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-zinc-300">
          <PackagePlus className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">Nenhum equipamento encontrado</p>
        </div>
      ) : viewMode === 'list' ? (
        /* ─── LIST VIEW ─── */
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-zinc-100">
            {filteredItems.map((item) => {
              const isCritical = item.minQuantity != null && item.quantity <= item.minQuantity;
              return (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50/60 transition-colors">
                  {/* Qty badge */}
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 text-center",
                    isCritical ? "bg-red-50" : "bg-blue-50"
                  )}>
                    <span className={cn("text-base font-black leading-none", isCritical ? "text-red-600" : "text-blue-600")}>
                      {item.quantity}
                    </span>
                    <span className="text-[9px] font-bold uppercase text-zinc-400">un</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.category && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {item.category}
                        </span>
                      )}
                      {isCritical && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" /> Crítico
                        </span>
                      )}
                      <span className="text-sm font-bold text-zinc-900 truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {(item.room || item.cabinet || item.shelf) && (
                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {[item.room, item.cabinet, item.shelf].filter(Boolean).join(' • ')}
                        </span>
                      )}
                      {item.unitValue != null && (
                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          R$ {item.unitValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setShowActionModal({ type: 'recebimento', item })}
                      className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors" title="Entrada">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setShowActionModal({ type: 'retirada', item })}
                      disabled={item.quantity === 0}
                      className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors disabled:opacity-40" title="Saída">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setShowActionModal({ type: 'quebra', item })}
                      disabled={item.quantity === 0}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-40" title="Quebra">
                      <Hammer className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setShowQRModal(item)}
                      className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg transition-colors hidden sm:block" title="QR Code">
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                    {user?.role === 'admin' && (
                      <>
                        <button onClick={() => openEdit(item)}
                          className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ─── GRID VIEW ─── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isCritical = item.minQuantity != null && item.quantity <= item.minQuantity;
            return (
              <motion.div layout key={item.id}
                className="bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {item.imageUrl && (
                  <div className="h-36 bg-zinc-100 overflow-hidden">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex flex-wrap gap-1 items-center min-w-0">
                      {item.category && (
                        <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                          {item.category}
                        </span>
                      )}
                      {isCritical && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                          <AlertTriangle className="w-2.5 h-2.5" /> Crítico
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-zinc-900 truncate">{item.name}</h3>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={cn("text-xl font-black leading-none", isCritical ? "text-red-600" : "text-zinc-900")}>
                        {item.quantity}
                      </span>
                      <span className="block text-[9px] text-zinc-400 uppercase font-bold">un</span>
                    </div>
                  </div>
                  {(item.room || item.unitValue != null) && (
                    <div className="flex items-center gap-3 mb-3 mt-1">
                      {item.room && (
                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {[item.room, item.cabinet, item.shelf].filter(Boolean).join(' • ')}
                        </span>
                      )}
                      {item.unitValue != null && (
                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> R$ {item.unitValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setShowActionModal({ type: 'recebimento', item })}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold text-xs transition-colors">
                      <Plus className="w-3 h-3" /> Entrada
                    </button>
                    <button onClick={() => setShowActionModal({ type: 'retirada', item })}
                      disabled={item.quantity === 0}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-semibold text-xs transition-colors disabled:opacity-40">
                      <Minus className="w-3 h-3" /> Saída
                    </button>
                    <button onClick={() => setShowActionModal({ type: 'quebra', item })}
                      disabled={item.quantity === 0}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-semibold text-xs transition-colors disabled:opacity-40">
                      <Hammer className="w-3 h-3" /> Quebra
                    </button>
                    {user?.role === 'admin' && (
                      <>
                        <button onClick={() => openEdit(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg font-semibold text-xs transition-colors">
                          <Pencil className="w-3 h-3" /> Editar
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)}
                          className="ml-auto p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* FAB Scanner - Mobile */}
      <button onClick={() => setShowScannerModal(true)}
        className="fixed bottom-6 right-4 z-40 sm:hidden bg-blue-600 text-white p-4 rounded-full shadow-xl shadow-blue-200/60 hover:bg-blue-700 transition-all border-4 border-white">
        <ScanLine className="w-5 h-5" />
      </button>

      {/* ── ADD MODAL ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0">
                <h2 className="text-base font-bold text-zinc-900">Novo Item</h2>
                <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-zinc-100 rounded-lg"><X className="w-5 h-5 text-zinc-500" /></button>
              </div>
              <form onSubmit={handleAddItem} className="p-5 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">Qtd Inicial *</label>
                  <input required type="number" min="0" value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <ItemFormFields data={newItem} setData={setNewItem} />
                <button type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                  <PackagePlus className="w-4 h-4" /> Cadastrar Item
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── EDIT MODAL ── */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-base font-bold text-zinc-900">Editar Item</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Qtd atual: {editingItem.quantity} un</p>
                </div>
                <button onClick={() => setEditingItem(null)} className="p-1.5 hover:bg-zinc-100 rounded-lg"><X className="w-5 h-5 text-zinc-500" /></button>
              </div>
              <form onSubmit={handleEditItem} className="p-5 space-y-4 overflow-y-auto">
                <ItemFormFields data={editForm} setData={setEditForm} />
                <button type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                  <Save className="w-4 h-4" /> Salvar Alterações
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ACTION MODAL ── */}
      <AnimatePresence>
        {showActionModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-zinc-900">
                    {showActionModal.type === 'recebimento' ? '📥 Entrada' : showActionModal.type === 'quebra' ? '🔨 Dar Baixa' : '📤 Saída'}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">{showActionModal.item.name} · {showActionModal.item.quantity} em estoque</p>
                </div>
                <button onClick={() => setShowActionModal(null)} className="p-1.5 hover:bg-zinc-100 rounded-lg"><X className="w-5 h-5 text-zinc-500" /></button>
              </div>
              <form onSubmit={handleAction} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">Quantidade</label>
                  <input required type="number" min="1"
                    max={showActionModal.type !== 'recebimento' ? showActionModal.item.quantity : undefined}
                    value={actionData.quantity}
                    onChange={(e) => setActionData({ ...actionData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                {showActionModal.type === 'retirada' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">Destino / Responsável *</label>
                      <input required type="text" value={actionData.destination}
                        onChange={(e) => setActionData({ ...actionData, destination: e.target.value })}
                        placeholder="Local ou responsável"
                        className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">Prazo de Devolução</label>
                      <input type="date" value={actionData.returnDeadline}
                        onChange={(e) => setActionData({ ...actionData, returnDeadline: e.target.value })}
                        className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                  </>
                )}
                {showActionModal.type === 'quebra' && (
                  <div>
                    <label className="block text-xs font-semibold text-red-600 uppercase mb-1.5">Motivo da Quebra *</label>
                    <textarea required rows={2} value={actionData.observations}
                      onChange={(e) => setActionData({ ...actionData, observations: e.target.value })}
                      className="w-full px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-400 outline-none resize-none text-sm" />
                  </div>
                )}
                <button type="submit" className={cn(
                  "w-full text-white font-bold py-3 rounded-xl text-sm transition-all",
                  showActionModal.type === 'recebimento' ? "bg-blue-600 hover:bg-blue-700"
                    : showActionModal.type === 'quebra' ? "bg-red-600 hover:bg-red-700"
                    : "bg-zinc-900 hover:bg-zinc-800"
                )}>
                  Confirmar
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Modal */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-xs flex flex-col items-center shadow-2xl">
              <div className="bg-white p-3 rounded-xl border border-zinc-100 mb-4">
                <QRCodeSVG value={`ITEM:${showQRModal.id}`} size={180} />
              </div>
              <p className="font-bold text-zinc-900 text-center text-sm">{showQRModal.name}</p>
              <button onClick={() => setShowQRModal(null)} className="mt-4 text-zinc-400 text-sm hover:text-zinc-600">Fechar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Scanner Modal */}
      <AnimatePresence>
        {showScannerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/90">
            <button onClick={() => setShowScannerModal(false)}
              className="absolute top-4 right-4 bg-white text-zinc-900 p-2 rounded-full z-10 shadow-lg"><X className="w-5 h-5" /></button>
            <div className="w-full max-w-sm p-4">
              <div className="rounded-2xl overflow-hidden aspect-square">
                <Scanner
                  onScan={(r) => {
                    if (r?.length) {
                      const item = items.find(i => i.id === parseInt(r[0].rawValue.replace('ITEM:', '')));
                      if (item) { setShowScannerModal(false); setScannedItem(item); }
                    }
                  }}
                  onError={() => setShowScannerModal(false)}
                />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Scanned Item Modal */}
      <AnimatePresence>
        {scannedItem && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="bg-white w-full sm:max-w-xs sm:rounded-2xl rounded-t-2xl p-5 shadow-2xl">
              <h2 className="text-base font-bold text-zinc-900 mb-1">{scannedItem.name}</h2>
              <p className="text-xs text-zinc-400 mb-4">{scannedItem.quantity} em estoque</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button onClick={() => { setShowActionModal({ type: 'recebimento', item: scannedItem }); setScannedItem(null); }}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 rounded-xl flex flex-col items-center gap-1 transition-colors">
                  <Plus className="w-5 h-5" /><span className="text-xs font-semibold">Entrada</span>
                </button>
                <button onClick={() => { setShowActionModal({ type: 'retirada', item: scannedItem }); setScannedItem(null); }}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 py-3 rounded-xl flex flex-col items-center gap-1 transition-colors">
                  <Minus className="w-5 h-5" /><span className="text-xs font-semibold">Saída</span>
                </button>
                <button onClick={() => { setShowActionModal({ type: 'quebra', item: scannedItem }); setScannedItem(null); }}
                  className="bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl flex flex-col items-center gap-1 transition-colors">
                  <Hammer className="w-5 h-5" /><span className="text-xs font-semibold">Quebra</span>
                </button>
              </div>
              <button onClick={() => setScannedItem(null)} className="w-full text-zinc-400 text-sm hover:text-zinc-600 py-2">Cancelar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
