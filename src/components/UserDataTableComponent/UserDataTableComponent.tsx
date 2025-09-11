/* eslint-disable max-lines-per-function */
import {
  Box,
  Typography,
  Table,
  Input as JoyInput,
  Chip,
  Select,
  Option,
} from '@mui/joy';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import UserDataCardComponent from '../UserDataCardComponent/UserDataCardComponent';
import { getAllUsers, getAllRoles } from '../../utils/showuserdatafunctions';

const UserDataTableComponent = () => {
  const { t } = useTranslation();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('alle');
  const [users, setUsers] = useState(getAllUsers());

  const allRoles = getAllRoles();

  // Filter-Logik
  const filteredUsers = users.filter((user) => {
    const searchString =
      `${user.firstname} ${user.lastname} ${user.address} ${user.phone}`.toLowerCase();
    const matchesSearch = searchString.includes(search.toLowerCase());
    const matchesRole =
      roleFilter === 'alle' || user.roles.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  // Callback für Detailansicht, um nach dem Speichern/Löschen die Userdaten neu zu laden
  const handleUserUpdate = () => {
    setUsers(getAllUsers());
  };

  // Card schließen
  const handleCloseDetail = () => {
    setSelectedUserId(null);
  };

  // Card nach erfolgreichem Speichern direkt wieder öffnen
  const handleSaveSuccess = (userId: number) => {
    setSelectedUserId(null);
    setSelectedUserId(userId);
    //setTimeout(() => setSelectedUserId(userId), 0);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography level="h4" sx={{ mb: 2 }}>
        {t('components.userDataTable.header')}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <JoyInput
          placeholder={t('components.userDataTable.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ maxWidth: 300 }}
        />
        <Select
          value={roleFilter}
          onChange={(_, value) => setRoleFilter(value ?? 'alle')}
          sx={{ minWidth: 180 }}
        >
          <Option value="alle">{t('components.userDataTable.allroles')}</Option>
          {allRoles.map((role) => (
            <Option key={role} value={role}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Option>
          ))}
        </Select>
      </Box>
      <Table hoverRow>
        <thead>
          <tr>
            <th>{t('components.userDataTable.name')}</th>
            <th>{t('components.userDataTable.birthdate')}</th>
            <th>{t('components.userDataTable.address')}</th>
            <th>{t('components.userDataTable.phone')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.flatMap((user) => {
            const freshUser = users.find((u) => u.id === user.id) ?? user;
            const rows = [
              <tr
                key={user.id}
                style={{
                  cursor: 'pointer',
                  background:
                    selectedUserId === user.id ? '#f0f4ff' : undefined,
                }}
                onClick={() =>
                  setSelectedUserId(selectedUserId === user.id ? null : user.id)
                }
              >
                <td
                  style={{
                    verticalAlign: 'top',
                    minWidth: 160,
                    paddingTop: 8,
                    paddingBottom: 8,
                  }}
                >
                  <Box>
                    <span style={{ display: 'block', fontWeight: 500 }}>
                      {freshUser.firstname} {freshUser.lastname}
                    </span>
                    <Box
                      sx={{
                        mt: 0.5,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.5,
                        maxWidth: 160,
                      }}
                    >
                      {freshUser.roles.map((role) => (
                        <Chip
                          key={role}
                          size="sm"
                          variant="soft"
                          color="neutral"
                          sx={{
                            fontSize: 12,
                            height: 20,
                            px: 1,
                            background: '#e0e0e0',
                            color: '#333',
                            fontWeight: 500,
                            mb: 0.5,
                          }}
                        >
                          {role}
                        </Chip>
                      ))}
                    </Box>
                  </Box>
                </td>
                <td>{freshUser.birthdate}</td>
                <td>{freshUser.address}</td>
                <td>{freshUser.phone}</td>
              </tr>,
            ];
            if (selectedUserId === user.id) {
              rows.push(
                <tr key={user.id + '-details'}>
                  <td colSpan={4} style={{ background: '#f9f9f9', padding: 0 }}>
                    <UserDataCardComponent
                      user={freshUser}
                      onUserUpdate={handleUserUpdate}
                      onClose={handleCloseDetail}
                      onSaveSuccess={handleSaveSuccess}
                    />
                  </td>
                </tr>
              );
            }
            return rows;
          })}
        </tbody>
      </Table>
    </Box>
  );
};

export default UserDataTableComponent;