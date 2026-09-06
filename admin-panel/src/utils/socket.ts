/**
 * Action Tailor - Admin Socket.IO Client Manager
 */

export function getSocket(): any {
  if (typeof (window as any).io !== 'undefined') {
    return (window as any).io();
  }
  return null;
}

