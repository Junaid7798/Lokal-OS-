import { useState, useEffect } from 'react';

export function useStaffTracker() {
  const [activeStaff, setActiveStaff] = useState<string>(() => {
    return localStorage.getItem('deskTracker_activeStaff') || 'Owner';
  });

  useEffect(() => {
    localStorage.setItem('deskTracker_activeStaff', activeStaff);
  }, [activeStaff]);

  return { activeStaff, setActiveStaff };
}
