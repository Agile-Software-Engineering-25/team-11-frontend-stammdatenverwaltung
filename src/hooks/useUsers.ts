import { useCallback, useEffect, useRef, useState } from 'react';
import useAxiosInstance from './useAxiosInstance';
import { registerCreateUserApi } from '@/utils/createuserfunction';
import { registerShowUserApi } from '@/utils/showuserdatafunctions';

type User = Record<string, any>;

export function useUsers(initialFetch = true) {
  const axiosInstance = useAxiosInstance('https://sau-portal.de/team-11-api');

  const [users, setUsers] = useState<User[]>([]);
  const isFetching = useRef(false);
  const lastFetchTs = useRef(0);
  const MIN_FETCH_INTERVAL_MS = 3000;

  // Implementierung der reinen API-Handler (werden registriert)
  const apiFetch = useCallback(async (): Promise<User[]> => {
    if (!axiosInstance) return [];
    if (isFetching.current) return [];
    const now = Date.now();
    if (now - lastFetchTs.current < MIN_FETCH_INTERVAL_MS) return [];
    isFetching.current = true;
    lastFetchTs.current = now;
    try {
      const res = await axiosInstance.get('/api/v1/users', { params: { flag: true } });
      if (res && Array.isArray(res.data)) {
        setUsers(res.data);
        return res.data;
      }
      setUsers([]);
      return [];
    } catch (err) {
      console.error('useUsers.apiFetch error', err);
      setUsers([]);
      return [];
    } finally {
      isFetching.current = false;
    }
  }, [axiosInstance]);

  const apiUpdate = useCallback(
    async (id: string, payload: Record<string, any>): Promise<boolean> => {
      if (!axiosInstance) return false;
      try {
        const res = await axiosInstance.put(`/api/v1/users/${encodeURIComponent(id)}`, payload);
        if (res && (res.status === 200 || res.status === 204)) {
          setUsers((prev) => prev.map((u) => (String(u.id) === String(id) ? { ...u, ...payload } : u)));
          return true;
        }
      } catch (err) {
        console.error('useUsers.apiUpdate error', err);
      }
      return false;
    },
    [axiosInstance]
  );

  const apiRemove = useCallback(
    async (id: string): Promise<boolean> => {
      if (!axiosInstance) return false;
      try {
        const res = await axiosInstance.post(`/api/v1/users/delete/${encodeURIComponent(id)}`);
        if (res && (res.status === 200 || res.status === 204)) {
          setUsers((prev) => prev.filter((u) => String(u.id) !== String(id)));
          // optional: fetch fresh list
          await apiFetch();
          return true;
        }
      } catch (err) {
        console.error('useUsers.apiRemove error', err);
      }
      return false;
    },
    [axiosInstance, apiFetch]
  );

  const apiCreate = useCallback(
    async (payload: Record<string, any>, role?: string) => {
      if (!axiosInstance) return null;
      const roleKey = String(role ?? '').toLowerCase();
      let endpoint = '/api/v1/users';
      if (roleKey === 'student' || roleKey === 'students') endpoint = '/api/v1/users/students';
      else if (roleKey === 'lecturer' || roleKey === 'dozent' || roleKey === 'lecturers') endpoint = '/api/v1/users/lecturer';
      else if (roleKey === 'employees' || roleKey === 'employee' || roleKey === 'mitarbeiter') endpoint = '/api/v1/users/employees';

      try {
        const res = await axiosInstance.post(endpoint, payload);
        if (res && (res.status === 200 || res.status === 201 || res.status === 204)) {
          // aktualisiere lokalen cache
          if (res.data && typeof res.data === 'object') {
            setUsers((prev) => [...prev, res.data]);
          } else {
            // fallback: lade aktuelle Liste
            await apiFetch();
          }
          return res.data ?? null;
        }
      } catch (err) {
        console.error('useUsers.apiCreate error', err);
      }
      return null;
    },
    [axiosInstance, apiFetch]
  );

  // Registrierung der Handler in den utils (nur wenn axiosInstance vorhanden)
  useEffect(() => {
    if (!axiosInstance) {
      registerShowUserApi({});
      registerCreateUserApi(null);
      return;
    }
    registerShowUserApi({
      fetch: apiFetch,
      update: apiUpdate,
      remove: apiRemove,
    });
    registerCreateUserApi(apiCreate);

    // cleanup: unregister on unmount
    return () => {
      registerShowUserApi({});
      registerCreateUserApi(null);
    };
  }, [axiosInstance, apiFetch, apiUpdate, apiRemove, apiCreate]);

  // exposed convenience wrappers (falls Komponenten den Hook verwenden)
  const fetchUsers = useCallback(async () => {
    await apiFetch();
  }, [apiFetch]);

  const refresh = useCallback(async () => {
    await apiFetch();
  }, [apiFetch]);

  useEffect(() => {
    if (initialFetch) void apiFetch();
  }, [apiFetch, initialFetch]);

  return { users, fetchUsers, refresh, createUser: apiCreate, updateUser: apiUpdate, deleteUser: apiRemove };
}