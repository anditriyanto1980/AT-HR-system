import React, { createContext, useContext, useEffect, useState } from 'react';
import { Employee, UserRole } from '../types';
import { dataService } from '../services/dataService';

interface AuthContextType {
  currentUser: Employee | null;
  role: UserRole;
  isLoggedIn: boolean;
  switchRole: (newRole: UserRole) => void;
  selectEmployee: (employeeId: string) => void;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'athr_active_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);

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

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const role: UserRole = currentUser?.role || 'EMPLOYEE';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isLoggedIn: currentUser !== null,
        switchRole,
        selectEmployee,
        login,
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
