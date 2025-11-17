import { User } from './showuserdatafunctions';
import { AxiosInstance } from 'axios';

export const updateUser = async (
  axios: AxiosInstance,
  id: number,
  updatedFields: Partial<User>
) => {
  const response = await axios.put(`/api/v1/users/${id}`, updatedFields);
  return response.data;
};

export const deleteUser = async (axios: AxiosInstance, id: number) => {
  const response = await axios.delete(`/api/v1/users/${id}`);
  return response.data;
};
