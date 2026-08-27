import { AuthUser, UserRole } from '../types';

export const PRESET_USERS: (AuthUser & { passwordHash: string })[] = [
  {
    id: 'user-admin-1',
    username: 'admin',
    email: 'misyuriyah26@gmail.com',
    fullName: 'Ustadz Ahmad Fauzi, S.Pd.I',
    role: 'admin',
    roleTitle: 'Kepala Madrasah & Administrator Sistem',
    avatarIcon: '🏛️',
    passwordHash: 'admin123'
  },
  {
    id: 'user-operator-1',
    username: 'operator',
    email: 'piket@misyuriyah.sch.id',
    fullName: 'Ustadzah Siti Aminah, S.Pd (Piket)',
    role: 'operator',
    roleTitle: 'Petugas Piket & Operator Siaran Bel',
    avatarIcon: '🔔',
    passwordHash: 'piket123'
  },
  {
    id: 'user-guru-1',
    username: 'guru',
    email: 'guru@misyuriyah.sch.id',
    fullName: 'Dewan Guru MI Syuriyah',
    role: 'operator',
    roleTitle: 'Dewan Pendidik / Staf Guru',
    avatarIcon: '📚',
    passwordHash: 'guru123'
  },
  {
    id: 'user-viewer-1',
    username: 'monitor',
    email: 'display@misyuriyah.sch.id',
    fullName: 'Monitor Publik & Ruang Kelas',
    role: 'viewer',
    roleTitle: 'Mode Layar Pajang / Display Jam Digital',
    avatarIcon: '📺',
    passwordHash: 'monitor123'
  }
];

const AUTH_STORAGE_KEY = 'mi_syuriyah_auth_user_v1';
const AUTH_LOCK_KEY = 'mi_syuriyah_is_locked_v1';

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse auth user:', err);
  }
  return null;
}

export function saveStoredUser(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to save auth user:', err);
  }
}

export function isScreenLocked(): boolean {
  try {
    return localStorage.getItem(AUTH_LOCK_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setScreenLock(locked: boolean): void {
  try {
    if (locked) {
      localStorage.setItem(AUTH_LOCK_KEY, 'true');
    } else {
      localStorage.removeItem(AUTH_LOCK_KEY);
    }
  } catch (err) {
    console.error('Failed to set screen lock:', err);
  }
}

export function authenticate(identifier: string, password: string): { success: boolean; user?: AuthUser; message?: string } {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = password.trim();

  // Match preset users
  const found = PRESET_USERS.find(
    u => u.username.toLowerCase() === cleanId || (u.email && u.email.toLowerCase() === cleanId)
  );

  if (found) {
    if (found.passwordHash === cleanPass) {
      const authUser: AuthUser = {
        id: found.id,
        username: found.username,
        fullName: found.fullName,
        role: found.role,
        roleTitle: found.roleTitle,
        email: found.email,
        avatarIcon: found.avatarIcon,
        lastLogin: new Date().toISOString()
      };
      saveStoredUser(authUser);
      setScreenLock(false);
      return { success: true, user: authUser };
    } else {
      return { success: false, message: 'Kata sandi atau PIN yang Anda masukkan salah.' };
    }
  }

  // If user entered email or custom username
  if (cleanId === 'misyuriyah26@gmail.com' && (cleanPass === 'admin' || cleanPass === 'admin123' || cleanPass === '123456')) {
    const adminUser: AuthUser = {
      id: 'user-admin-email',
      username: 'misyuriyah26',
      fullName: 'Administrator Madrasah',
      role: 'admin',
      roleTitle: 'Kepala Madrasah & Administrator Sistem',
      email: 'misyuriyah26@gmail.com',
      avatarIcon: '🏛️',
      lastLogin: new Date().toISOString()
    };
    saveStoredUser(adminUser);
    setScreenLock(false);
    return { success: true, user: adminUser };
  }

  // Fallback: If user enters generic admin/operator
  if (cleanId === 'admin' && (cleanPass === 'admin' || cleanPass === 'admin123' || cleanPass === '123456' || cleanPass === '')) {
    const defaultAdmin: AuthUser = {
      id: 'user-admin-default',
      username: 'admin',
      fullName: 'Administrator Madrasah',
      role: 'admin',
      roleTitle: 'Kepala Madrasah & Administrator Sistem',
      email: 'misyuriyah26@gmail.com',
      avatarIcon: '🏛️',
      lastLogin: new Date().toISOString()
    };
    saveStoredUser(defaultAdmin);
    setScreenLock(false);
    return { success: true, user: defaultAdmin };
  }

  return { success: false, message: 'Akun tidak ditemukan. Gunakan username "admin", "operator", atau klik tombol Masuk Cepat.' };
}

export function quickLoginAs(role: UserRole): AuthUser {
  const preset = PRESET_USERS.find(u => u.role === role) || PRESET_USERS[0];
  const authUser: AuthUser = {
    id: preset.id,
    username: preset.username,
    fullName: preset.fullName,
    role: preset.role,
    roleTitle: preset.roleTitle,
    email: preset.email,
    avatarIcon: preset.avatarIcon,
    lastLogin: new Date().toISOString()
  };
  saveStoredUser(authUser);
  setScreenLock(false);
  return authUser;
}
