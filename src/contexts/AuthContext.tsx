import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { Employee, UserRole } from '../types';
import { dataService } from '../services/dataService';
import { auth, googleProvider, testConnection } from '../services/firebase';

interface AuthContextType {
  currentUser: Employee | null;
  firebaseUser: User | null;
  role: UserRole;
  isLoggedIn: boolean;
  isFirebaseConnected: boolean;
  switchRole: (newRole: UserRole) => void;
  selectEmployee: (employeeId: string) => void;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'athr_active_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);

  const refreshUser = () => {
    const employees = dataService.getEmployees();
    const storedId = localStorage.getItem(AUTH_STORAGE_KEY);
    const target = employees.find((e) => e.id === storedId) || employees[0];
    if (target) {
      setCurrentUser(target);
      localStorage.setItem(AUTH_STORAGE_KEY, target.id);
    }
  };

  useEffect(() => {
    refreshUser();

    // Test Firestore connection on boot
    testConnection().then((res) => {
      setIsFirebaseConnected(res.connected);
    });

    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser && fbUser.email) {
        setIsFirebaseConnected(true);
        const email = fbUser.email.toLowerCase();
        const employees = dataService.getEmployees();
        const matched = employees.find(
          (e) => e.email.toLowerCase() === email || e.auth_user_id === fbUser.uid
        );
        if (matched) {
          if (!matched.auth_user_id) {
            matched.auth_user_id = fbUser.uid;
            dataService.saveEmployee(matched);
          }
          setCurrentUser(matched);
          localStorage.setItem(AUTH_STORAGE_KEY, matched.id);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const switchRole = (newRole: UserRole) => {
    const employees = dataService.getEmployees();
    // Find an employee matching that role
    const matched = employees.find((e) => e.role === newRole) || employees[0];
    if (matched) {
      setCurrentUser(matched);
      localStorage.setItem(AUTH_STORAGE_KEY, matched.id);
      dataService.logAudit({
        user_name: matched.full_name,
        action: 'SWITCH_ROLE_VIEW',
        module: 'SECURITY',
        record_id: newRole,
      });
    }
  };

  const selectEmployee = (employeeId: string) => {
    const emp = dataService.getEmployeeById(employeeId);
    if (emp) {
      setCurrentUser(emp);
      localStorage.setItem(AUTH_STORAGE_KEY, emp.id);
    }
  };

  const login = async (
    identifier: string,
    passwordInput: string = ''
  ): Promise<{ success: boolean; error?: string }> => {
    const result = dataService.verifyLogin(identifier, passwordInput);
    if (result.success && result.employee) {
      setCurrentUser(result.employee);
      localStorage.setItem(AUTH_STORAGE_KEY, result.employee.id);
      dataService.logAudit({
        user_name: result.employee.full_name,
        action: 'USER_LOGIN',
        module: 'AUTHENTICATION',
        record_id: result.employee.id,
      });
      return { success: true };
    }
    return { success: false, error: result.error || 'Autentikasi gagal.' };
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setFirebaseUser(user);
      setIsFirebaseConnected(true);

      const email = user.email ? user.email.toLowerCase() : '';
      const employees = dataService.getEmployees();
      let matched = employees.find(
        (e) => e.email.toLowerCase() === email || e.auth_user_id === user.uid
      );

      if (!matched) {
        // Auto-provision employee profile for Google authenticated user
        const isSuperAdmin = email === 'triyantoandi80@gmail.com' || employees.length === 0;
        const newEmp: Employee = {
          id: `emp-fb-${user.uid.slice(0, 8)}`,
          employee_code: `EMP-FB-${Math.floor(1000 + Math.random() * 9000)}`,
          nik: `320101${Date.now().toString().slice(-8)}`,
          full_name: user.displayName || email.split('@')[0] || 'Firebase User',
          avatar_url: user.photoURL || undefined,
          gender: 'Male',
          phone: user.phoneNumber || '081234567890',
          email: user.email || '',
          company_id: 'comp-01',
          branch_id: 'br-01',
          department_id: 'dept-01',
          position_id: 'pos-01',
          role: isSuperAdmin ? 'SUPER_ADMIN' : 'EMPLOYEE',
          employment_type: 'Permanent',
          employment_status: 'Active',
          join_date: new Date().toISOString().split('T')[0],
          username: email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase(),
          login_access_enabled: true,
          auth_user_id: user.uid,
          branch_name: 'Kantor Pusat Sudirman',
          department_name: 'Human Resources & General Affairs',
          position_name: isSuperAdmin ? 'VP of Human Resources' : 'General Staff',
        };
        dataService.saveEmployee(newEmp);
        matched = newEmp;
      } else {
        matched.auth_user_id = user.uid;
        if (user.photoURL && !matched.avatar_url) {
          matched.avatar_url = user.photoURL;
        }
        dataService.saveEmployee(matched);
      }

      setCurrentUser(matched);
      localStorage.setItem(AUTH_STORAGE_KEY, matched.id);

      dataService.logAudit({
        user_name: matched.full_name,
        action: 'FIREBASE_GOOGLE_LOGIN',
        module: 'AUTHENTICATION',
        record_id: matched.id,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Google Sign-In failed:', error);
      return { success: false, error: error.message || 'Login dengan Google gagal.' };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('SignOut error:', e);
    }
    setFirebaseUser(null);
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const role: UserRole = currentUser?.role || 'EMPLOYEE';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        role,
        isLoggedIn: currentUser !== null,
        isFirebaseConnected,
        switchRole,
        selectEmployee,
        login,
        loginWithGoogle,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

