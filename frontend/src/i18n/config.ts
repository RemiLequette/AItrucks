import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.deliveries': 'Deliveries',
      'nav.vehicles': 'Vehicles',
      'nav.trips': 'Trips',
      'nav.map': 'Map',
      'nav.users': 'Users',
      'nav.logout': 'Logout',
      
      // Common
      'common.loading': 'Loading...',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.create': 'Create',
      'common.search': 'Search',
      'common.actions': 'Actions',
      'common.status': 'Status',
      'common.yes': 'Yes',
      'common.no': 'No',
      
      // Deliveries
      'deliveries.title': 'Deliveries',
      'deliveries.new': 'New Delivery',
      'deliveries.customer': 'Customer',
      'deliveries.address': 'Address',
      'deliveries.scheduledDate': 'Scheduled Date',
      'deliveries.weight': 'Weight (kg)',
      'deliveries.volume': 'Volume (m³)',
      'deliveries.location': 'Location',
      'deliveries.valid': 'Valid',
      'deliveries.missing': 'Missing',
      'deliveries.export': 'Export Excel',
      'deliveries.import': 'Import Excel',
      
      // Vehicles
      'vehicles.title': 'Vehicles',
      'vehicles.new': 'New Vehicle',
      'vehicles.name': 'Name',
      'vehicles.licensePlate': 'License Plate',
      'vehicles.type': 'Type',
      'vehicles.capacity': 'Capacity',
      'vehicles.capacityWeight': 'Capacity Weight (kg)',
      'vehicles.capacityVolume': 'Capacity Volume (m³)',
      
      // Trips
      'trips.title': 'Trips',
      'trips.new': 'New Trip',
      'trips.name': 'Trip Name',
      'trips.vehicle': 'Vehicle',
      'trips.startTime': 'Start Time',
      'trips.deliveries': 'Deliveries',
      'trips.weight': 'Weight',
      'trips.volume': 'Volume',
      'trips.assign': 'Assign Deliveries',
      'trips.modifyAssignments': 'Modify Assignments',
      'trips.deliveriesFor': 'Deliveries for {{tripName}}',
      'trips.noDeliveries': 'No deliveries assigned to this trip yet. Click \'Modify Assignments\' to add deliveries.',
      
      // Users
      'users.title': 'Users',
      
      // Dashboard
      'dashboard.title': 'Dashboard',
      'dashboard.totalDeliveries': 'Total Deliveries',
      'dashboard.pendingDeliveries': 'pending',
      'dashboard.totalVehicles': 'Total Vehicles',
      'dashboard.availableVehicles': 'available',
      'dashboard.activeTrips': 'Active Trips',
      'dashboard.inProgress': 'in progress',
      'dashboard.completedTrips': 'Completed Trips',
      'dashboard.total': 'total',
      'dashboard.welcome': 'Welcome to AI Trucks Delivery Planning',
      'dashboard.welcomeMessage': 'Use the navigation menu to manage deliveries, vehicles, and trips. The system helps you optimize delivery routes and track your fleet efficiently.',
      'dashboard.loadingDashboard': 'Loading dashboard...',
      
      // Map
      'map.title': 'Map View',
      'map.deliveries': 'Deliveries',
      'map.vehicles': 'Vehicles',
      'map.tripRoutes': 'Trip Routes',
      
      // Empty messages
      'empty.deliveries': 'No deliveries found. Start by adding your first delivery.',
      'empty.vehicles': 'No vehicles found. Add vehicles to manage your fleet.',
      'empty.trips': 'No trips found. Create a trip to start planning deliveries.',
      'empty.selectTrip': 'Select a trip to view its deliveries',
      
      // Status values
      'status.pending': 'Pending',
      'status.assigned': 'Assigned',
      'status.in_transit': 'In Transit',
      'status.delivered': 'Delivered',
      'status.failed': 'Failed',
      'status.available': 'Available',
      'status.in_use': 'In Use',
      'status.maintenance': 'Maintenance',
      'status.inactive': 'Inactive',
      'status.planned': 'Planned',
      'status.in_progress': 'In Progress',
      'status.completed': 'Completed',
      'status.cancelled': 'Cancelled',
      
      // Roles
      'role.driver': 'Driver',
      'role.dispatcher': 'Dispatcher',
      'role.trip_planner': 'Trip Planner',
      'role.admin': 'Admin',
      
      // Messages
      'message.success': 'Success',
      'message.error': 'Error',
      'message.confirmDelete': 'Are you sure you want to delete this item?',
    }
  },
  fr: {
    translation: {
      // Navigation
      'nav.dashboard': 'Tableau de bord',
      'nav.deliveries': 'Livraisons',
      'nav.vehicles': 'Véhicules',
      'nav.trips': 'Trajets',
      'nav.map': 'Carte',
      'nav.users': 'Utilisateurs',
      'nav.logout': 'Déconnexion',
      
      // Common
      'common.loading': 'Chargement...',
      'common.save': 'Enregistrer',
      'common.cancel': 'Annuler',
      'common.delete': 'Supprimer',
      'common.edit': 'Modifier',
      'common.create': 'Créer',
      'common.search': 'Rechercher',
      'common.actions': 'Actions',
      'common.status': 'Statut',
      'common.yes': 'Oui',
      'common.no': 'Non',
      
      // Deliveries
      'deliveries.title': 'Livraisons',
      'deliveries.new': 'Nouvelle Livraison',
      'deliveries.customer': 'Client',
      'deliveries.address': 'Adresse',
      'deliveries.scheduledDate': 'Date Prévue',
      'deliveries.weight': 'Poids (kg)',
      'deliveries.volume': 'Volume (m³)',
      'deliveries.location': 'Localisation',
      'deliveries.valid': 'Valide',
      'deliveries.missing': 'Manquant',
      'deliveries.export': 'Exporter Excel',
      'deliveries.import': 'Importer Excel',
      
      // Vehicles
      'vehicles.title': 'Véhicules',
      'vehicles.new': 'Nouveau Véhicule',
      'vehicles.name': 'Nom',
      'vehicles.licensePlate': 'Plaque d\'immatriculation',
      'vehicles.type': 'Type',
      'vehicles.capacity': 'Capacité',
      'vehicles.capacityWeight': 'Capacité Poids (kg)',
      'vehicles.capacityVolume': 'Capacité Volume (m³)',
      
      // Trips
      'trips.title': 'Trajets',
      'trips.new': 'Nouveau Trajet',
      'trips.name': 'Nom du Trajet',
      'trips.vehicle': 'Véhicule',
      'trips.startTime': 'Heure de Départ',
      'trips.deliveries': 'Livraisons',
      'trips.weight': 'Poids',
      'trips.volume': 'Volume',
      'trips.assign': 'Assigner Livraisons',
      'trips.modifyAssignments': 'Modifier Assignations',
      'trips.deliveriesFor': 'Livraisons pour {{tripName}}',
      'trips.noDeliveries': 'Aucune livraison assignée à ce trajet. Cliquez sur \'Modifier Assignations\' pour ajouter des livraisons.',
      
      // Users
      'users.title': 'Utilisateurs',
      
      // Dashboard
      'dashboard.title': 'Tableau de bord',
      'dashboard.totalDeliveries': 'Total des livraisons',
      'dashboard.pendingDeliveries': 'en attente',
      'dashboard.totalVehicles': 'Total des véhicules',
      'dashboard.availableVehicles': 'disponibles',
      'dashboard.activeTrips': 'Trajets actifs',
      'dashboard.inProgress': 'en cours',
      'dashboard.completedTrips': 'Trajets terminés',
      'dashboard.total': 'total',
      'dashboard.welcome': 'Bienvenue dans AI Trucks Planification de livraison',
      'dashboard.welcomeMessage': 'Utilisez le menu de navigation pour gérer les livraisons, les véhicules et les trajets. Le système vous aide à optimiser les itinéraires de livraison et à suivre votre flotte efficacement.',
      'dashboard.loadingDashboard': 'Chargement du tableau de bord...',
      
      // Map
      'map.title': 'Vue Carte',
      'map.deliveries': 'Livraisons',
      'map.vehicles': 'Véhicules',
      'map.tripRoutes': 'Itinéraires de trajet',
      
      // Empty messages
      'empty.deliveries': 'Aucune livraison trouvée. Commencez par ajouter votre première livraison.',
      'empty.vehicles': 'Aucun véhicule trouvé. Ajoutez des véhicules pour gérer votre flotte.',
      'empty.trips': 'Aucun trajet trouvé. Créez un trajet pour commencer à planifier les livraisons.',
      'empty.selectTrip': 'Sélectionnez un trajet pour voir ses livraisons',
      
      // Status values
      'status.pending': 'En Attente',
      'status.assigned': 'Assigné',
      'status.in_transit': 'En Transit',
      'status.delivered': 'Livré',
      'status.failed': 'Échoué',
      'status.available': 'Disponible',
      'status.in_use': 'En Utilisation',
      'status.maintenance': 'Maintenance',
      'status.inactive': 'Inactif',
      'status.planned': 'Planifié',
      'status.in_progress': 'En Cours',
      'status.completed': 'Terminé',
      'status.cancelled': 'Annulé',
      
      // Roles
      'role.driver': 'Conducteur',
      'role.dispatcher': 'Répartiteur',
      'role.trip_planner': 'Planificateur',
      'role.admin': 'Administrateur',
      
      // Messages
      'message.success': 'Succès',
      'message.error': 'Erreur',
      'message.confirmDelete': 'Êtes-vous sûr de vouloir supprimer cet élément ?',
    }
  }
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Bind i18n to React
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    react: {
      useSuspense: false,
    }
  });

export default i18n;
