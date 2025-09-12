/* eslint-disable max-lines-per-function */
import {
  Box,
  Typography,
  Table,
  Input as JoyInput,
  Chip,
  Select,
  Option,
  Checkbox,
} from '@mui/joy';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import UserDataCardComponent from '../UserDataCardComponent/UserDataCardComponent';
import { getAllUsers, getAllRoles } from '../../utils/showuserdatafunctions';

const UserDataTableComponent = ({
  onSelectedUserIdsChange,
}: {
  onSelectedUserIdsChange?: (ids: number[]) => void;
}) => {
  const { t } = useTranslation();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('alle');
  const [users, setUsers] = useState(getAllUsers());
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  const allRoles = getAllRoles();

  // Filter-Logik
  const filteredUsers = users.filter((user) => {
    const searchString =
      `${user.firstname} ${user.lastname} ${user.street ?? ''} ${user.housenumber ?? ''} ${user.zipcode ?? ''} ${user.city ?? ''} ${user.phone ?? ''}`.toLowerCase();
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
    //setSelectedUserId(userId);
    //setTimeout(() => setSelectedUserId(userId), 0);
  };

  // Checkbox-Handler
  const handleCheckboxChange =
    (userId: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedUserIds((prev) => {
        const newIds = event.target.checked
          ? [...prev, userId]
          : prev.filter((id) => id !== userId);
        if (onSelectedUserIdsChange) onSelectedUserIdsChange(newIds);
        return newIds;
      });
    };

  // Alle auswählen
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    let newIds: number[];
    if (event.target.checked) {
      newIds = filteredUsers.map((user) => user.id);
    } else {
      newIds = [];
    }
    setSelectedUserIds(newIds);
    if (onSelectedUserIdsChange) onSelectedUserIdsChange(newIds);
  };

  useEffect(() => {
    if (onSelectedUserIdsChange) onSelectedUserIdsChange(selectedUserIds);
    // eslint-disable-next-line
  }, []);

  const allChecked =
    filteredUsers.length > 0 &&
    filteredUsers.every((user) => selectedUserIds.includes(user.id));
  const someChecked =
    filteredUsers.some((user) => selectedUserIds.includes(user.id)) &&
    !allChecked;

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
            <th
              style={{
                width: 24,
                padding: 0,
                textAlign: 'center',
                verticalAlign: 'middle',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  minHeight: 40,
                }}
              >
                <Checkbox
                  checked={allChecked}
                  indeterminate={someChecked}
                  onChange={handleSelectAll}
                  sx={{ verticalAlign: 'middle', m: 0, p: 0, mt: 2.5 }}
                  size="sm"
                  aria-label="Alle auswählen"
                />
              </Box>
            </th>
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
                  onClick={(e) => e.stopPropagation()}
                  style={{ textAlign: 'center', width: 36 }}
                >
                  <Checkbox
                    checked={selectedUserIds.includes(user.id)}
                    onChange={handleCheckboxChange(user.id)}
                    aria-label={`User ${freshUser.firstname} ${freshUser.lastname} auswählen`}
                  />
                </td>
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
                <td>
                  {`${freshUser.street ?? ''} ${freshUser.housenumber ?? ''}, ${freshUser.zipcode ?? ''} ${freshUser.city ?? ''}`.trim()}
                </td>
                <td>{freshUser.phone}</td>
              </tr>,
            ];
            if (selectedUserId === user.id) {
              rows.push(
                <tr key={user.id + '-details'}>
                  <td colSpan={5} style={{ background: '#f9f9f9', padding: 0 }}>
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