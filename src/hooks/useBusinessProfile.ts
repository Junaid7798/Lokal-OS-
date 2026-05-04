import { useEffect, useState } from 'react';
import type { BusinessProfile } from '../types';
import { localDb } from '@/lib/localDb';

/**
 * Hook to retrieve and manage the current business profile.
 * Fetches profile from local storage on mount and provides update functionality.
 * 
 * @returns {Object} { profile, loading, setProfile }
 * - profile: Business profile data or null if not found
 * - loading: Boolean indicating if profile is still loading
 * - setProfile: Function to update profile data
 * 
 * @example
 * const { profile, loading, setProfile } = useBusinessProfile();
 * if (loading) return <Spinner />;
 * console.log(profile?.business_name);
 */
export function useBusinessProfile() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const user = localDb.getAuth();
      if (!user) {
        setLoading(false);
        return;
      }

      const data = await localDb.getProfile(user.id);

      if (data) {
        const isPro = ['Pro', 'Enterprise'].includes(data.plan || 'Free');
        setProfile({
          ...data,
          plan: data.plan || 'Free',
          plan_status: data.plan_status || 'active',
          customer_limit: data.customer_limit || 50,
          monthly_whatsapp_action_limit:
            data.monthly_whatsapp_action_limit || 30,
          is_pro: isPro,
        });
      } else {
        // Not found, user might need to create it
        // Partial profile for new users - only id and isNew are required
        setProfile({ id: user.id, isNew: true } as BusinessProfile);
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  return { profile, loading, setProfile };
}
