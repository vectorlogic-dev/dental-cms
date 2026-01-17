import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../utils/api';
import { toast } from 'react-toastify';
import axios from 'axios';
import { ApiItemResponse, UserSummary } from '../types/api';

interface UserPayload {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'receptionist',
    isActive: true,
  });

  // Fetch user data if editing
  const { data: user, isLoading: isLoadingUser } = useQuery<UserSummary>(
    ['user', id],
    async () => {
      const response = await api.get<ApiItemResponse<UserSummary>>(`/users/${id}`);
      return response.data.data;
    },
    { enabled: isEdit }
  );

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        password: '', // Don't populate password
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role || 'receptionist',
        isActive: user.isActive !== undefined ? user.isActive : true,
      });
    }
  }, [user]);

  const createMutation = useMutation(
    async (data: UserPayload) => {
      const response = await api.post<ApiItemResponse<UserSummary>>('/auth/register', data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('User created successfully!');
        queryClient.invalidateQueries('users');
        navigate('/users');
      },
      onError: (error: unknown) => {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Failed to create user';
        toast.error(message);
      },
    }
  );

  const updateMutation = useMutation(
    async (data: UserPayload) => {
      const response = await api.put<ApiItemResponse<UserSummary>>(`/users/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('User updated successfully!');
        queryClient.invalidateQueries(['user', id]);
        queryClient.invalidateQueries('users');
        navigate('/users');
      },
      onError: (error: unknown) => {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Failed to update user';
        toast.error(message);
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: UserPayload = {
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role,
      isActive: formData.isActive,
    };

    // Only include password if creating new user or if password is provided
    if (!isEdit || formData.password) {
      data.password = formData.password;
    }

    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEdit && isLoadingUser) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-8">
        {isEdit ? 'Edit User' : 'Add New User'}
      </h1>

      <form onSubmit={handleSubmit} className="card space-y-6" autoComplete="off">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">First Name *</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="input"
              autoComplete="off"
              required
            />
          </div>

          <div>
            <label className="label">Last Name *</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="input"
              autoComplete="off"
              required
            />
          </div>

          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              autoComplete="off"
              required
            />
          </div>

          <div>
            <label className="label">
              Password {isEdit ? '(leave blank to keep current)' : '*'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input"
              autoComplete={isEdit ? "new-password" : "new-password"}
              required={!isEdit}
              minLength={6}
            />
          </div>

          <div>
            <label className="label">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input"
              required
            >
              <option value="admin">Admin</option>
              <option value="dentist">Dentist</option>
              <option value="assistant">Assistant</option>
              <option value="receptionist">Receptionist</option>
            </select>
          </div>

          <div>
            <label className="label">Status *</label>
            <select
              value={formData.isActive ? 'true' : 'false'}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
              className="input"
              required
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={createMutation.isLoading || updateMutation.isLoading}
            className="btn btn-primary"
          >
            {createMutation.isLoading || updateMutation.isLoading
              ? 'Saving...'
              : isEdit
              ? 'Update User'
              : 'Create User'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
