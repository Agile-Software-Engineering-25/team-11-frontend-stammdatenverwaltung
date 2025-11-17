import { useState, useEffect } from 'react';
import useAxiosInstance from './useAxiosInstance';
import { User } from '@/utils/showuserdatafunctions';

const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const axiosInstance = useAxiosInstance();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/v1/users?withDetails=true');
      // The API returns a different structure, I need to adapt it
      const adaptedUsers = response.data.map((user: any) => ({
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        roles: user.roles.map((r: any) => r.name),
        birthdate: user.details.date_of_birth,
        street: user.details.street,
        housenumber: user.details.housenumber,
        zipcode: user.details.zipcode,
        city: user.details.city,
        phone: user.details.phone_number,
        details: user.details,
      }));
      setUsers(adaptedUsers);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { users, loading, error, refetch: fetchUsers };
};

export default useUsers;

