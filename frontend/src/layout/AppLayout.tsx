import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Truck, Package, MapPin, Users, LogOut, LayoutDashboard, Map as MapIcon } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './AppLayout.css';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Truck size={32} />
          <h1>AI Trucks</h1>
        </div>

        <nav className="sidebar-nav">
          <Link to="/" className={isActive('/') ? 'nav-link active' : 'nav-link'}>
            <LayoutDashboard size={20} />
            <span>{t('nav.dashboard')}</span>
          </Link>

          <Link to="/deliveries" className={isActive('/deliveries') ? 'nav-link active' : 'nav-link'}>
            <Package size={20} />
            <span>{t('nav.deliveries')}</span>
          </Link>

          <Link to="/vehicles" className={isActive('/vehicles') ? 'nav-link active' : 'nav-link'}>
            <Truck size={20} />
            <span>{t('nav.vehicles')}</span>
          </Link>

          <Link to="/trips" className={isActive('/trips') ? 'nav-link active' : 'nav-link'}>
            <MapPin size={20} />
            <span>{t('nav.trips')}</span>
          </Link>

          <Link to="/map" className={isActive('/map') ? 'nav-link active' : 'nav-link'}>
            <MapIcon size={20} />
            <span>{t('nav.map')}</span>
          </Link>

          {hasRole('admin') && (
            <Link to="/users" className={isActive('/users') ? 'nav-link active' : 'nav-link'}>
              <Users size={20} />
              <span>{t('nav.users')}</span>
            </Link>
          )}
        </nav>

        <div className="sidebar-footer">
          <LanguageSwitcher />
          <div className="user-info">
            <div>
              <div className="user-name">{user?.full_name}</div>
              <div className="user-role">{t(`role.${user?.role}`)}</div>
            </div>
          </div>
          <button onClick={logout} className="logout-btn">
            <LogOut size={18} />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
