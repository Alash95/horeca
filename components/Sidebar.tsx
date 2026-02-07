import { ReactNode } from 'react';
import { LayoutDashboard, Wallet, PieChart, Settings, ShoppingBag, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useData } from '../context/DataProvider';

const NavItem = ({ icon, active = false, to }: { icon: ReactNode; active?: boolean; to: string }) => (
    <Link
        to={to}
        className={`p-3 rounded-xl transition-all duration-300 relative group flex items-center justify-center ${active
            ? 'text-white bg-slate-800 shadow-lg shadow-black/20'
            : 'text-slate-500 hover:text-teal-400 hover:bg-slate-900'
            }`}
    >
        {icon}
        {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-teal-500 rounded-r-full -ml-4 shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
        )}
    </Link>
);

const Sidebar = () => {
    const { userPermissions } = useData();
    const location = useLocation();

    return (
        <aside className="h-full flex flex-col items-center py-8 text-white">
            <div className="mb-12">
                <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                    <div className="w-6 h-6 bg-slate-900 rounded-lg" />
                </div>
            </div>

            <nav className="flex-1 w-full flex flex-col items-center gap-8">
                <NavItem
                    to="/dashboard"
                    icon={<LayoutDashboard size={24} />}
                    active={location.pathname === '/dashboard' || location.pathname === '/dashboard/'}
                />

                {/* Placeholders */}
                <NavItem to="#" icon={<PieChart size={24} />} />
                <NavItem to="#" icon={<Wallet size={24} />} />
                <NavItem to="#" icon={<ShoppingBag size={24} />} />

                {/* Admin Link - For Admins and Super Admins */}
                {(userPermissions.role === 'admin' || userPermissions.role === 'super_admin') && (
                    <NavItem
                        to="/dashboard/admin"
                        icon={<Shield size={24} />}
                        active={location.pathname.includes('/admin')}
                    />
                )}

                <div className="mt-auto">
                    <NavItem to="#" icon={<Settings size={24} />} />
                </div>
            </nav>
        </aside>
    );
};

export default Sidebar;
