import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getDeliveries, getVehicles, getTrips } from '../services/api';
import { Package, Truck, MapPin, TrendingUp } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    pendingDeliveries: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    activeTrips: 0,
    completedTrips: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deliveriesRes, vehiclesRes, tripsRes] = await Promise.all([
          getDeliveries(),
          getVehicles(),
          getTrips(),
        ]);

        setStats({
          totalDeliveries: deliveriesRes.deliveries.length,
          pendingDeliveries: deliveriesRes.deliveries.filter((d: any) => d.status === 'pending').length,
          totalVehicles: vehiclesRes.vehicles.length,
          availableVehicles: vehiclesRes.vehicles.filter((v: any) => v.status === 'available').length,
          activeTrips: tripsRes.trips.filter((t: any) => t.status === 'in_progress').length,
          completedTrips: tripsRes.trips.filter((t: any) => t.status === 'completed').length,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>{t('dashboard.loadingDashboard')}</div>;
  }

  return (
    <div className="dashboard">
      <h1 className="page-title">{t('dashboard.title')}</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe' }}>
            <Package size={32} color="#1e40af" />
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('dashboard.totalDeliveries')}</div>
            <div className="stat-value">{stats.totalDeliveries}</div>
            <div className="stat-detail">{stats.pendingDeliveries} {t('dashboard.pendingDeliveries')}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#d1fae5' }}>
            <Truck size={32} color="#059669" />
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('dashboard.totalVehicles')}</div>
            <div className="stat-value">{stats.totalVehicles}</div>
            <div className="stat-detail">{stats.availableVehicles} {t('dashboard.availableVehicles')}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7' }}>
            <MapPin size={32} color="#d97706" />
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('dashboard.activeTrips')}</div>
            <div className="stat-value">{stats.activeTrips}</div>
            <div className="stat-detail">{t('dashboard.inProgress')}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0e7ff' }}>
            <TrendingUp size={32} color="#6366f1" />
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('dashboard.completedTrips')}</div>
            <div className="stat-value">{stats.completedTrips}</div>
            <div className="stat-detail">{t('dashboard.total')}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-info card">
        <h2>{t('dashboard.welcome')}</h2>
        <p>{t('dashboard.welcomeMessage')}</p>
      </div>
    </div>
  );
};

export default Dashboard;
