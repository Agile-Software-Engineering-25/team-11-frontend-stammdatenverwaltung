import { useMemo } from 'react';
import axios from 'axios';
import useUser from './useUser';
import { BACKEND_BASE_URL } from '@/config';

const useAxiosInstance = (baseUrl: string = BACKEND_BASE_URL) => {
  const user = useUser();
  const token = user.getAccessToken();

  return useMemo(() => {
    if (!token) {
      return null;
    }

    const instance = axios.create({ baseURL: baseUrl });

    // send cookies by default (needed when backend relies on session cookies)
    instance.defaults.withCredentials = true;

    instance.interceptors.request.use((config) => {
      config.headers = config.headers ?? {};
      // set Authorization header safely
      (config.headers as any).Authorization = `Bearer ${token}`;
      return config;
    });

    return instance;
  }, [baseUrl, token]);
};

export default useAxiosInstance;
