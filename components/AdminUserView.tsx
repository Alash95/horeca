import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, X, Search, UserCog, Shield, AlertTriangle, CheckCircle, Trash2, ShieldAlert, UserMinus, Plus } from 'lucide-react';
import { useData } from '../context/DataProvider';
import { useLanguage } from '../context/LanguageContext';

interface UserProfile {
    id: string;
    email: string;
    role: string;
    brand_owner_access: string;
    created_at?: string;
}

export const AdminUserView = () => {
    const { userPermissions } = useData();
    const { t } = useLanguage();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [brands, setBrands] = useState<string[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ role: string, brand: string }>({ role: '', brand: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Domain Management State
    const [domains, setDomains] = useState<{ domain: string, brand_owner: string }[]>([]);
    const [newDomain, setNewDomain] = useState<{ domain: string, brand: string }>({ domain: '', brand: '' });

    // Blacklist Management State
    const [blacklist, setBlacklist] = useState<{ email: string, reason: string, created_at: string }[]>([]);
    const [newBlacklist, setNewBlacklist] = useState<{ email: string, reason: string }>({ email: '', reason: '' });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        await fetchData(); // Existing user fetch

        const { data: domainsData } = await supabase.from('domain_mappings').select('*').order('domain');
        if (domainsData) setDomains(domainsData);

        const { data: blacklistData } = await supabase.from('blacklist').select('*').order('created_at', { ascending: false });
        if (blacklistData) setBlacklist(blacklistData);
    };

    const fetchData = async () => {
        setLoading(true);
        setMsg(null);

        try {
            console.log('🔍 Admin Panel: Starting data fetch...');

            // 1. Fetch Users
            console.log('📊 Fetching users table...');
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('*');

            if (usersError) {
                console.error('❌ Users table error:', usersError);
                setMsg({ type: 'error', text: `Users query failed: ${usersError.message}` });
                // Don't throw - try to continue with brands
            } else {
                console.log(`✅ Fetched ${usersData?.length || 0} users`);
                setUsers(usersData || []);
            }

            // 2. Fetch Brands (for the dropdown)
            console.log('📊 Fetching brandowners table...');
            const { data: brandsData, error: brandsError } = await supabase
                .from('brandowners')
                .select('ingredients_brand_owner')
                .order('ingredients_brand_owner');

            if (brandsError) {
                console.error('❌ Brandowners table error:', brandsError);
                // Only show brand error if users also failed
                if (usersError) {
                    setMsg({ type: 'error', text: `Both queries failed. Check RLS policies.` });
                } else {
                    setMsg({ type: 'error', text: `Brands query failed: ${brandsError.message}` });
                }
            } else {
                console.log(`✅ Fetched ${brandsData?.length || 0} brand owners`);
                // Get unique brand owners
                const uniqueBrands = [...new Set(brandsData?.map(b => b.ingredients_brand_owner).filter(Boolean))] as string[];
                setBrands(uniqueBrands.sort());
            }

            // If both succeeded but no users found
            if (!usersError && !brandsError && (!usersData || usersData.length === 0)) {
                console.warn('⚠️ No users found - RLS might be blocking or table is empty');
            }

        } catch (err: any) {
            console.error('🚨 Admin Fetch Critical Error:', err);
            setMsg({ type: 'error', text: `Critical error: ${err.message}` });
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (user: UserProfile) => {
        setEditingId(user.id);
        setEditForm({ role: user.role, brand: user.brand_owner_access });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setMsg(null);
    };

    const saveEdit = async (id: string) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    role: editForm.role,
                    brand_owner_access: editForm.brand
                })
                .eq('id', id);

            if (error) throw error;

            // Update local state
            setUsers(users.map(u => u.id === id ? { ...u, role: editForm.role, brand_owner_access: editForm.brand } : u));
            setMsg({ type: 'success', text: 'User updated successfully' });
            setEditingId(null);

            // Clear message after 3 seconds
            setTimeout(() => setMsg(null), 3000);

        } catch (err: any) {
            console.error('Update Error:', err);
            setMsg({ type: 'error', text: 'Failed to update user. Check console.' });
        }
    };

    const addDomain = async () => {
        if (!newDomain.domain || !newDomain.brand) return;

        try {
            const { error } = await supabase.from('domain_mappings').insert({
                domain: newDomain.domain,
                brand_owner: newDomain.brand
            });

            if (error) throw error;

            setMsg({ type: 'success', text: 'Domain mapping added!' });
            setNewDomain({ domain: '', brand: '' });
            fetchAll(); // Refresh list
            setTimeout(() => setMsg(null), 3000);
        } catch (err: any) {
            console.error(err);
            setMsg({ type: 'error', text: 'Failed to add domain.' });
            setTimeout(() => setMsg(null), 3000);
        }
    };

    const deleteUser = async (user: UserProfile) => {
        if (user.role === 'super_admin') {
            alert('Cannot delete a Super Admin.');
            return;
        }

        if (!confirm(`Are you sure you want to PERMANENTLY delete user: ${user.email}? This action cannot be undone.`)) {
            return;
        }

        try {
            const { error } = await supabase.from('users').delete().eq('id', user.id);
            if (error) throw error;

            setUsers(users.filter(u => u.id !== user.id));
            setMsg({ type: 'success', text: `User ${user.email} deleted.` });
            setTimeout(() => setMsg(null), 3000);
        } catch (err: any) {
            console.error('Delete User Error:', err);
            setMsg({ type: 'error', text: `Failed to delete user: ${err.message}` });
        }
    };

    const deleteDomain = async (domain: string) => {
        if (!confirm(`Delete mapping for ${domain}?`)) return;

        try {
            const { error } = await supabase.from('domain_mappings').delete().eq('domain', domain);
            if (error) throw error;
            setMsg({ type: 'success', text: 'Domain deleted.' });
            fetchAll();
            setTimeout(() => setMsg(null), 3000);
        } catch (err: any) {
            console.error(err);
            setMsg({ type: 'error', text: 'Delete failed.' });
            setTimeout(() => setMsg(null), 3000);
        }
    };

    const addToBlacklist = async () => {
        if (!newBlacklist.email) return;

        try {
            const { error } = await supabase.from('blacklist').insert({
                email: newBlacklist.email,
                reason: newBlacklist.reason || 'No reason provided'
            });

            if (error) throw error;

            setMsg({ type: 'success', text: `${newBlacklist.email} blacklisted!` });
            setNewBlacklist({ email: '', reason: '' });
            fetchAll();
            setTimeout(() => setMsg(null), 3000);
        } catch (err: any) {
            console.error(err);
            setMsg({ type: 'error', text: 'Failed to blacklist email.' });
            setTimeout(() => setMsg(null), 3000);
        }
    };

    const removeFromBlacklist = async (email: string) => {
        if (!confirm(`Remove ${email} from blacklist?`)) return;

        try {
            const { error } = await supabase.from('blacklist').delete().eq('email', email);
            if (error) throw error;
            setMsg({ type: 'success', text: 'Email removed from blacklist.' });
            fetchAll();
            setTimeout(() => setMsg(null), 3000);
        } catch (err: any) {
            console.error(err);
            setMsg({ type: 'error', text: 'Action failed.' });
            setTimeout(() => setMsg(null), 3000);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.brand_owner_access?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-12">

            {/* --- SECTION 1: USER MANAGEMENT (Existing) --- */}
            <div className="space-y-6">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            <Shield className="text-teal-500" /> {t('adminUserManagement')}
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">{t('manageUserPerms')}</p>
                    </div>

                    {msg && (
                        <div className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                            {msg.text}
                        </div>
                    )}
                </header>

                {/* Search Bar */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder={t('searchUsers')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-slate-100 pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                </div>

                {/* Users Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-950 text-slate-200 uppercase font-bold text-xs tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">{t('userEmail')}</th>
                                    <th className="px-6 py-4">{t('status')}</th>
                                    <th className="px-6 py-4">{t('currentRole')}</th>
                                    <th className="px-6 py-4">{t('assignedBrand')}</th>
                                    <th className="px-6 py-4 text-right">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center">Loading users...</td></tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center">No users found</td></tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-100 flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs">
                                                    {user.email.slice(0, 2).toUpperCase()}
                                                </div>
                                                {user.email}
                                            </td>

                                            <td className="px-6 py-4">
                                                {user.brand_owner_access === 'PENDING' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                                                        Pending
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                                                        Active
                                                    </span>
                                                )}
                                            </td>

                                            {/* Editable Fields */}
                                            {editingId === user.id ? (
                                                <>
                                                    <td className="px-6 py-4">
                                                        <select
                                                            value={editForm.role}
                                                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                                            className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:ring-1 focus:ring-teal-500"
                                                        >
                                                            <option value="viewer">Viewer</option>
                                                            <option value="editor">Editor</option>
                                                            <option value="admin">Admin</option>
                                                            <option value="super_admin">Super Admin</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <select
                                                            value={editForm.brand}
                                                            onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                                                            className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:ring-1 focus:ring-teal-500 max-w-[200px]"
                                                        >
                                                            <option value="PENDING">⚠️ PENDING (No Access)</option>
                                                            <option value="ALL">🌟 ALL (Super Admin)</option>
                                                            <option disabled>──────────</option>
                                                            {brands.map(b => (
                                                                <option key={b} value={b}>{b}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => saveEdit(user.id)}
                                                                className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors border border-emerald-500/20"
                                                                title={t('save')}
                                                            >
                                                                <Save size={16} />
                                                            </button>
                                                            <button
                                                                onClick={cancelEdit}
                                                                className="p-1.5 text-slate-400 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                                                                title={t('cancel')}
                                                            >
                                                                <UserCog size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-4 text-slate-300 capitalize">{user.role}</td>
                                                    <td className="px-6 py-4 text-slate-300 font-mono text-xs">{user.brand_owner_access}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <button
                                                                onClick={() => startEdit(user)}
                                                                className="text-slate-500 hover:text-teal-400 transition-colors"
                                                                title="Edit Config"
                                                            >
                                                                <UserCog size={18} />
                                                            </button>
                                                            {userPermissions.role === 'super_admin' && user.role !== 'super_admin' && (
                                                                <button
                                                                    onClick={() => deleteUser(user)}
                                                                    className="text-slate-500 hover:text-red-400 transition-colors"
                                                                    title="Delete User"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- SECTION 2: DOMAIN AUTOMATION MANAGEMENT --- */}
            <div className="space-y-6 pt-6 border-t border-slate-800">
                <div>
                    <h2 className="text-xl font-bold text-slate-100">{t('domainAutomationRules')}</h2>
                    <p className="text-slate-400 text-sm mt-1">{t('domainAutomationDesc')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Add New Rule Form */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl h-fit">
                        <h3 className="font-semibold text-slate-200 mb-4">{t('addNewRule')}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">{t('domainNoAt')}</label>
                                <input
                                    type="text"
                                    placeholder="example.com"
                                    value={newDomain.domain}
                                    onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 px-3 py-2 rounded focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">{t('assignBrand')}</label>
                                <select
                                    value={newDomain.brand}
                                    onChange={(e) => setNewDomain({ ...newDomain, brand: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 px-3 py-2 rounded focus:ring-2 focus:ring-teal-500 outline-none"
                                >
                                    <option value="">Select Brand...</option>
                                    {brands.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <button
                                onClick={addDomain}
                                disabled={!newDomain.domain || !newDomain.brand}
                                className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {t('addAutomationRule')}
                            </button>
                        </div>
                    </div>

                    {/* Rules List */}
                    <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-950 text-slate-200 uppercase font-bold text-xs tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Domain</th>
                                    <th className="px-6 py-4">➜ {t('autoAssigns')}</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {domains.map(d => (
                                    <tr key={d.domain} className="hover:bg-slate-800/50">
                                        <td className="px-6 py-3 font-mono text-slate-300">{d.domain}</td>
                                        <td className="px-6 py-3 text-teal-400 font-medium">{d.brand_owner}</td>
                                        <td className="px-6 py-3 text-right">
                                            <button
                                                onClick={() => deleteDomain(d.domain)}
                                                className="text-slate-600 hover:text-red-400 p-1"
                                                title="Delete Rule"
                                            >
                                                <X size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- SECTION 3: EMAIL BLACKLIST MANAGEMENT --- */}
            {userPermissions.role === 'super_admin' && (
                <div className="space-y-6 pt-6 border-t border-slate-800 pb-12">
                    <div>
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <ShieldAlert className="text-red-500" /> {t('securityEmailBlacklist')}
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">{t('blacklistDesc')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Add to Blacklist Form */}
                        <div className="bg-slate-900 border border-red-900/30 p-6 rounded-xl h-fit">
                            <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                                <UserMinus size={18} className="text-red-400" /> {t('blockEmail')}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">{t('targetEmail')}</label>
                                    <input
                                        type="email"
                                        placeholder="user@badactor.com"
                                        value={newBlacklist.email}
                                        onChange={(e) => setNewBlacklist({ ...newBlacklist, email: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-slate-100 px-3 py-2 rounded focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">{t('reasonInternal')}</label>
                                    <input
                                        type="text"
                                        placeholder="Spam / Competitor"
                                        value={newBlacklist.reason}
                                        onChange={(e) => setNewBlacklist({ ...newBlacklist, reason: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-slate-100 px-3 py-2 rounded focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>
                                <button
                                    onClick={addToBlacklist}
                                    disabled={!newBlacklist.email}
                                    className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {t('blacklistUser')}
                                </button>
                            </div>
                        </div>

                        {/* Blacklist Table */}
                        <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-950 text-slate-200 uppercase font-bold text-xs tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">{t('blacklistedEmail')}</th>
                                        <th className="px-6 py-4">{t('reason')}</th>
                                        <th className="px-6 py-4 text-right">{t('action')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {blacklist.length === 0 ? (
                                        <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-600 italic">{t('noBlacklistedEmailsFound')}</td></tr>
                                    ) : (
                                        blacklist.map(entry => (
                                            <tr key={entry.email} className="hover:bg-red-900/10 active:bg-red-900/20 transition-colors">
                                                <td className="px-6 py-3 font-medium text-slate-300">{entry.email}</td>
                                                <td className="px-6 py-3 text-slate-500 text-xs italic">{entry.reason}</td>
                                                <td className="px-6 py-3 text-right">
                                                    <button
                                                        onClick={() => removeFromBlacklist(entry.email)}
                                                        className="text-slate-600 hover:text-emerald-400 p-1"
                                                        title="Remove from Blacklist"
                                                    >
                                                        <Plus size={16} className="rotate-45" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
