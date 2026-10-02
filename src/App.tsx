import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { FirebaseSetupModal } from './components/modals/FirebaseSetupModal';
import { ClockInView } from './features/attendance/ClockInView';
import { AttendanceMonitoring } from './features/attendance/AttendanceMonitoring';
import { AttendanceHistory } from './features/attendance/AttendanceHistory';
import { EmployeeList } from './features/employee/EmployeeList';
import { OrganizationView } from './features/organization/OrganizationView';
import { ShiftView } from './features/shifts/ShiftView';
import { HRDashboard } from './features/dashboard/HRDashboard';
import { EmployeeDashboard } from './features/dashboard/EmployeeDashboard';
import { AuditLogView } from './features/system/AuditLogView';
import { LoginView } from './features/auth/LoginView';
import { LeaveView } from './features/leave/LeaveView';
import { PermissionView } from './features/permission/PermissionView';
import { OvertimeView } from './features/overtime/OvertimeView';
import { ApprovalsHubView } from './features/approval/ApprovalsHubView';
import { AttendanceCorrectionView } from './features/attendance/AttendanceCorrectionView';
import { HolidayView } from './features/holiday/HolidayView';
import { ReportsView } from './features/reports/ReportsView';
import { BusinessTripView } from './features/businesstrip/BusinessTripView';
import { ScheduleView } from './features/schedule/ScheduleView';
import { PayrollView } from './features/payroll/PayrollView';
import { ReimbursementView } from './features/reimbursement/ReimbursementView';
import { PerformanceView } from './features/performance/PerformanceView';
import { CompanyHubView } from './features/companyHub/CompanyHubView';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

function MainApp() {
  const { isLoggedIn, role } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [dbModalOpen, setDbModalOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  if (!isLoggedIn) {
    return <LoginView />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return role === 'EMPLOYEE' ? (
          <EmployeeDashboard onNavigateTab={setCurrentTab} />
        ) : (
          <HRDashboard onNavigateTab={setCurrentTab} />
        );
      case 'clock-in':
        return <ClockInView />;
      case 'attendance-history':
        return <AttendanceHistory />;
      case 'attendance-correction':
        return <AttendanceCorrectionView />;
      case 'attendance-monitoring':
        return <AttendanceMonitoring />;
      case 'leave':
        return <LeaveView />;
      case 'permission':
        return <PermissionView />;
      case 'overtime':
        return <OvertimeView />;
      case 'business-trip':
        return <BusinessTripView />;
      case 'approvals-hub':
        return <ApprovalsHubView />;
      case 'holiday':
        return <HolidayView />;
      case 'reports':
        return <ReportsView />;
      case 'payroll':
        return <PayrollView />;
      case 'reimbursements':
        return <ReimbursementView />;
      case 'performance':
        return <PerformanceView />;
      case 'company-hub':
        return <CompanyHubView />;
      case 'employees':
        return <EmployeeList />;
      case 'organization':
        return <OrganizationView />;
      case 'shifts':
        return <ShiftView />;
      case 'schedule':
        return <ScheduleView />;
      case 'audit-logs':
        return <AuditLogView />;
      default:
        return <HRDashboard onNavigateTab={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col font-sans antialiased text-slate-800">
      {/* Full-width Dark Header Bar as in Reference Image */}
      <Header
        currentTab={currentTab}
        onOpenDbModal={() => setDbModalOpen(true)}
        onNavigateTab={setCurrentTab}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Dark Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenDbModal={() => setDbModalOpen(true)}
          collapsed={sidebarCollapsed}
        />

        {/* Main Viewport Container */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-20 lg:pb-8">
          <main className="flex-1 p-3 sm:p-5 lg:p-6">
            {renderContent()}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* PWA Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* Firebase Cloud Firestore Configuration Modal */}
      <FirebaseSetupModal isOpen={dbModalOpen} onClose={() => setDbModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
