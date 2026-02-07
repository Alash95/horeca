import { useState, ReactNode, FC } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Menu, X } from 'lucide-react';

const Layout: FC<{ children: ReactNode }> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-950 flex font-sans relative overflow-x-hidden">
            {/* Mobile Menu Button - Optimized for touch */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden fixed z-[60] bottom-8 right-8 p-5 bg-teal-500 rounded-full shadow-2xl shadow-teal-500/40 text-white hover:bg-teal-400 active:scale-95 transition-all"
                aria-label="Toggle Menu"
            >
                {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
            </button>

            {/* Sidebar with Mobile State - Responsive width */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-20 flex-shrink-0 bg-slate-950 border-r border-slate-800 transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
            `}>
                <Sidebar />
            </div>

            {/* Overlay for mobile when sidebar is open */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm animate-in fade-in duration-300"
                />
            )}

            {/* Main Content Area - Optimized for various widths */}
            <div className="flex-1 flex flex-col relative transition-all duration-300 md:ml-20 w-full min-w-0 max-w-full">
                <Header />
                <main className="flex-1 p-4 sm:p-6 md:p-8 pt-4 overflow-x-hidden overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
