import React, { useState, useEffect } from 'react';
import { 
  Save, Loader2, Palette, Clock, Gavel, Building, 
  Mail, Phone, Facebook, Instagram, MessageCircle, Plus, Trash2 
} from 'lucide-react';
import { OrgSettings } from '@/types/dashboard';
import { useNotificationHelpers } from '@/hooks/useNotificationHelpers';

interface SettingsViewProps {
    orgSettings: OrgSettings;
    onUpdate: (newSettings: Partial<OrgSettings>) => Promise<void>;
}

export const SettingsView = ({ orgSettings, onUpdate }: SettingsViewProps) => {
    // État local pour le formulaire
    const [formData, setFormData] = useState<OrgSettings>({});
    const [activeTab, setActiveTab] = useState<'general' | 'contact' | 'hours' | 'rules'>('general');
    const [isSaving, setIsSaving] = useState(false);
    
    // États pour les listes dynamiques
    const [penalties, setPenalties] = useState<string[]>([]);
    const [rules, setRules] = useState<string[]>([]);

    const { notifySuccess, notifyError } = useNotificationHelpers();
  
    useEffect(() => {
      if (orgSettings) {
        setFormData(orgSettings);
        setPenalties(orgSettings.LateReturnPenalties || []);
        setRules(orgSettings.SpecificBorrowingRules || []);
      }
    }, [orgSettings]);
  
    const handleSave = async () => {
      setIsSaving(true);
      try {
        // On prépare l'objet final avec les listes
        const finalData = {
            ...formData,
            LateReturnPenalties: penalties.filter(p => p.trim() !== ''),
            SpecificBorrowingRules: rules.filter(r => r.trim() !== '')
        };
        
        await onUpdate(finalData);
        notifySuccess('Succès', 'Configuration mise à jour et bibliothécaire notifiée.');
      } catch (e) {
        console.error(e);
        notifyError('Erreur', 'Impossible de sauvegarder');
      } finally {
        setIsSaving(false);
      }
    };

    // --- Helpers de gestion de formulaire ---

    const updateField = (path: string, value: any) => {
        setFormData(prev => {
            const newData = { ...prev };
            // Gestion simple pour 1 niveau de profondeur (ex: Theme.Primary)
            if (path.includes('.')) {
                const [parent, child] = path.split('.');
                newData[parent] = { ...newData[parent], [child]: value };
            } else {
                newData[path] = value;
            }
            return newData;
        });
    };

    const handleHoursChange = (day: string, type: 'open' | 'close' | 'closed', value: any) => {
        setFormData(prev => {
            const currentHours = prev.OpeningHours || {};
            const dayData = currentHours[day] === 'closed' ? { open: '08:00', close: '18:00' } : currentHours[day] || { open: '08:00', close: '18:00' };
            
            let newValue;
            if (type === 'closed') {
                newValue = value ? 'closed' : { open: '08:00', close: '18:00' };
            } else {
                newValue = { ...dayData, [type]: value };
            }

            return {
                ...prev,
                OpeningHours: { ...currentHours, [day]: newValue }
            };
        });
    };

    // --- Composants UI internes ---
    
    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors font-medium ${
                activeTab === id ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
            }`}
        >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );

    if (!formData) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

    return (
        <div className="space-y-6">
            {/* Header avec Bouton Sauvegarde Global */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Paramètres de la Bibliothèque</h2>
                    <p className="text-sm text-gray-500">Gérez l&apos;identité, les horaires et les règles.</p>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={isSaving} 
                    className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium disabled:opacity-50 w-full md:w-auto justify-center"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Sauvegarder & Notifier</span>
                </button>
            </div>

            {/* Navigation par Onglets */}
            <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                <TabButton id="general" label="Général & Thème" icon={Building} />
                <TabButton id="contact" label="Contacts" icon={Mail} />
                <TabButton id="hours" label="Horaires" icon={Clock} />
                <TabButton id="rules" label="Règles & Pénalités" icon={Gavel} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[500px]">
                
                {/* 1. ONGLET GÉNÉRAL */}
                {activeTab === 'general' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900 border-b pb-2 mb-4">Identité</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;organisation</label>
                                <input type="text" 
                                    value={formData.Name || ''} 
                                    onChange={(e) => updateField('Name', e.target.value)}
                                    className="w-full border-gray-200 rounded-lg p-2.5 border focus:ring-2 focus:ring-blue-100 outline-none" 
                                    placeholder="Ma Bibliothèque"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse complète</label>
                                <textarea 
                                    value={formData.Address || ''} 
                                    onChange={(e) => updateField('Address', e.target.value)}
                                    className="w-full border-gray-200 rounded-lg p-2.5 border focus:ring-2 focus:ring-blue-100 outline-none" 
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL du Logo</label>
                                <input type="text" 
                                    value={formData.Logo || ''} 
                                    onChange={(e) => updateField('Logo', e.target.value)}
                                    className="w-full border-gray-200 rounded-lg p-2.5 border focus:ring-2 focus:ring-blue-100 outline-none" 
                                    placeholder="https://..."
                                />
                                <p className="text-xs text-gray-500 mt-1">Utilisez votre gestionnaire de fichiers pour uploader et coller le lien ici.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900 border-b pb-2 mb-4 flex items-center"><Palette className="w-4 h-4 mr-2"/> Thème Visuel</h3>
                            {['Primary', 'Secondary'].map((type) => (
                             <div key={type}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Couleur {type === 'Primary' ? 'Principale' : 'Secondaire'}</label>
                                <div className="flex items-center space-x-3">
                                    <input type="color" 
                                        value={(formData.Theme as any)?.[type] || '#000000'}
                                        onChange={(e) => updateField(`Theme.${type}`, e.target.value)}
                                        className="h-10 w-16 rounded cursor-pointer border border-gray-200 p-1 bg-white"
                                    />
                                    <input type="text" 
                                        value={(formData.Theme as any)?.[type] || ''}
                                        onChange={(e) => updateField(`Theme.${type}`, e.target.value)}
                                        className="flex-1 border-gray-200 rounded-lg p-2 border font-mono uppercase"
                                    />
                                </div>
                             </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. ONGLET CONTACT */}
                {activeTab === 'contact' && (
                    <div className="space-y-6 max-w-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1"><Mail className="w-4 h-4 inline mr-1"/> Email</label>
                                <input type="email" value={formData.Contact?.Email || ''} 
                                    onChange={(e) => updateField('Contact.Email', e.target.value)}
                                    className="w-full border-gray-200 rounded-lg p-2.5 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1"><Phone className="w-4 h-4 inline mr-1"/> Téléphone</label>
                                <input type="tel" value={formData.Contact?.Phone || ''} 
                                    onChange={(e) => updateField('Contact.Phone', e.target.value)}
                                    className="w-full border-gray-200 rounded-lg p-2.5 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1"><MessageCircle className="w-4 h-4 inline mr-1"/> WhatsApp</label>
                                <input type="tel" value={formData.Contact?.WhatsApp || ''} 
                                    onChange={(e) => updateField('Contact.WhatsApp', e.target.value)}
                                    className="w-full border-gray-200 rounded-lg p-2.5 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1"><Facebook className="w-4 h-4 inline mr-1"/> Facebook</label>
                                <input type="url" value={formData.Contact?.Facebook || ''} 
                                    onChange={(e) => updateField('Contact.Facebook', e.target.value)}
                                    className="w-full border-gray-200 rounded-lg p-2.5 border"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1"><Instagram className="w-4 h-4 inline mr-1"/> Instagram</label>
                                <input type="url" value={formData.Contact?.Instagram || ''} 
                                    onChange={(e) => updateField('Contact.Instagram', e.target.value)}
                                    className="w-full border-gray-200 rounded-lg p-2.5 border"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. ONGLET HORAIRES */}
                {activeTab === 'hours' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                            const dayData = (formData.OpeningHours as any)?.[day];
                            const isClosed = dayData === 'closed';
                            const hours = isClosed ? { open: '08:00', close: '18:00' } : dayData;

                            return (
                                <div key={day} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                    <span className="font-medium w-24 text-gray-700">
                                        {day.replace('Monday', 'Lundi').replace('Tuesday', 'Mardi').replace('Wednesday', 'Mercredi')
                                            .replace('Thursday', 'Jeudi').replace('Friday', 'Vendredi').replace('Saturday', 'Samedi').replace('Sunday', 'Dimanche')}
                                    </span>
                                    
                                    <div className="flex items-center space-x-4">
                                        <label className="flex items-center space-x-2 text-sm text-gray-500 cursor-pointer">
                                            <input type="checkbox" checked={isClosed} 
                                                onChange={(e) => handleHoursChange(day, 'closed', e.target.checked)}
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>Fermé</span>
                                        </label>

                                        {!isClosed && (
                                            <div className="flex items-center space-x-2">
                                                <input type="time" value={hours?.open || '08:00'} 
                                                    onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                                />
                                                <span className="text-gray-400">-</span>
                                                <input type="time" value={hours?.close || '18:00'} 
                                                    onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* 4. ONGLET RÈGLES */}
                {activeTab === 'rules' && (
                    <div className="space-y-8">
                        {/* Paramètres numériques */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Prêts simultanés max</label>
                                <input type="number" 
                                    value={formData.MaximumSimultaneousLoans || 3}
                                    onChange={(e) => updateField('MaximumSimultaneousLoans', parseInt(e.target.value))}
                                    className="w-full border-gray-200 rounded-lg p-2.5 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Durée prêt par défaut (jours)</label>
                                <input type="number" 
                                    value={formData.DefaultLoanDuration || 14}
                                    onChange={(e) => updateField('DefaultLoanDuration', parseInt(e.target.value))}
                                    className="w-full border-gray-200 rounded-lg p-2.5 border"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Pénalités */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-gray-800">Pénalités de retard</h3>
                                    <button onClick={() => setPenalties([...penalties, ''])} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100 font-medium flex items-center">
                                        <Plus className="w-3 h-3 mr-1"/> Ajouter
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {penalties.map((p, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input type="text" value={p} 
                                                onChange={(e) => {
                                                    const newArr = [...penalties];
                                                    newArr[idx] = e.target.value;
                                                    setPenalties(newArr);
                                                }}
                                                className="flex-1 border-gray-200 rounded-lg p-2 border text-sm"
                                                placeholder="Ex: 100 FCFA / jour"
                                            />
                                            <button onClick={() => setPenalties(penalties.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {penalties.length === 0 && <p className="text-sm text-gray-400 italic">Aucune pénalité définie.</p>}
                                </div>
                            </div>

                            {/* Règles spécifiques */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-gray-800">Règles Spécifiques</h3>
                                    <button onClick={() => setRules([...rules, ''])} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100 font-medium flex items-center">
                                        <Plus className="w-3 h-3 mr-1"/> Ajouter
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {rules.map((r, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input type="text" value={r} 
                                                onChange={(e) => {
                                                    const newArr = [...rules];
                                                    newArr[idx] = e.target.value;
                                                    setRules(newArr);
                                                }}
                                                className="flex-1 border-gray-200 rounded-lg p-2 border text-sm"
                                                placeholder="Ex: Max 2 romans"
                                            />
                                            <button onClick={() => setRules(rules.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {rules.length === 0 && <p className="text-sm text-gray-400 italic">Aucune règle définie.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};