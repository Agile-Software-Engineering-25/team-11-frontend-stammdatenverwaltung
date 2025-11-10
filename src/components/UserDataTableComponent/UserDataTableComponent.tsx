/* eslint-disable max-lines-per-function */
import {
  Box,
  Typography,
  Table,
  Chip,
  Select,
  Option,
  Checkbox,
} from '@mui/joy';
import { SearchBar } from '@agile-software/shared-components'; // <--- Import der Shared SearchBar
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import UserDataCardComponent from '../UserDataCardComponent/UserDataCardComponent';
import {
  getAllUsers,
  getAllRoles,
  inferRolesFromUser,
} from '../../utils/showuserdatafunctions';
import { formatDateForDisplay } from '../../utils/showuserdatafunctions';

const UserDataTableComponent = ({
  onSelectedUserIdsChange,
  selectedUserId,
  setSelectedUserId,
  onShowMessage,
}: {
  onSelectedUserIdsChange?: (ids: string[]) => void;
  selectedUserId?: string | null;
  setSelectedUserId?: (id: string | null) => void;
  onShowMessage?: (type: 'success' | 'error', text: string) => void;
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('alle');
  const [users, setUsers] = useState(getAllUsers());
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const allRoles = getAllRoles();

  // Filter-Logik
  const filteredUsers = users
    .filter((user) => {
      const searchString =
        `${user.firstname} ${user.lastname} ${user.address ?? ''}`.toLowerCase();
      const matchesSearch = searchString.includes(search.toLowerCase());
      const matchesRole =
        roleFilter === 'alle' ||
        (Array.isArray(user.roles)
          ? user.roles.includes(roleFilter)
          : user.roles === roleFilter);
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      const nameA = `${a.firstname} ${a.lastname}`.toLowerCase();
      const nameB = `${b.firstname} ${b.lastname}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

  // Callback für Detailansicht, um nach dem Speichern/Löschen die Userdaten neu zu laden
  const handleUserUpdate = () => {
    setUsers(getAllUsers());
  };

  // Card schließen
  const handleCloseDetail = () => {
    if (setSelectedUserId) setSelectedUserId(null);
    else internalSetSelectedUserId(null);
  };

  // Card nach erfolgreichem Speichern direkt wieder öffnen
  const handleSaveSuccess = (userId: string) => {
    if (setSelectedUserId) {
      // toggle to force re-render in parent if needed
      setSelectedUserId(null);
      setTimeout(() => setSelectedUserId(userId), 0);
    } else {
      internalSetSelectedUserId(null);
      setTimeout(() => internalSetSelectedUserId(userId), 0);
    }
  };

  // Checkbox-Handler
  const handleCheckboxChange =
    (userId: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedUserIds((prev) => {
        const newIds = event.target.checked
          ? Array.from(new Set([...prev, userId]))
          : prev.filter((id) => id !== userId);
        if (onSelectedUserIdsChange) onSelectedUserIdsChange(newIds);
        return newIds;
      });
    };

  // Alle auswählen
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    let newIds: string[];
    if (event.target.checked) {
      newIds = filteredUsers.map((user) => String(user.id));
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
    filteredUsers.every((user) => selectedUserIds.includes(String(user.id)));
  const someChecked =
    filteredUsers.some((user) => selectedUserIds.includes(String(user.id))) &&
    !allChecked;

  // Ersetze eigenen State durch Props, falls vorhanden
  const [internalSelectedUserId, internalSetSelectedUserId] = useState<
    string | null
  >(null);
  const activeUserId =
    selectedUserId !== undefined ? selectedUserId : internalSelectedUserId;
  const changeSelectedUserId = (id: string | null) => {
    if (setSelectedUserId) setSelectedUserId(id);
    else internalSetSelectedUserId(id);
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
        {/* Shared SearchBar statt Joy Input */}
        <SearchBar
          value={search}
          onChange={setSearch}
          onSearch={setSearch}
          placeholder={t('components.userDataTable.searchPlaceholder')}
          size="md"
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
            const freshUser =
              users.find((u) => String(u.id) === String(user.id)) ?? user;
            const rows = [
              <tr
                key={String(user.id)}
                style={{
                  cursor: 'pointer',
                  background: activeUserId === String(user.id) ? 50 : undefined,
                }}
                onClick={() =>
                  changeSelectedUserId(
                    activeUserId === String(user.id) ? null : String(user.id)
                  )
                }
              >
                <td
                  onClick={(e) => e.stopPropagation()}
                  style={{ textAlign: 'center', width: 36 }}
                >
                  <Checkbox
                    checked={selectedUserIds.includes(String(user.id))}
                    onChange={handleCheckboxChange(String(user.id))}
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
                      {inferRolesFromUser(freshUser).map((role) => (
                        <Chip
                          key={role}
                          size="sm"
                          variant="soft"
                          color="neutral"
                          sx={{
                            height: 20,
                            px: 1,
                            mb: 0.5,
                          }}
                        >
                          {role}
                        </Chip>
                      ))}
                    </Box>
                  </Box>
                </td>
                <td>{/* vorher: {freshUser.date_of_birth} */ formatDateForDisplay(freshUser.date_of_birth)}</td>
                <td>{`${freshUser.address ?? ''}`.trim()}</td>
                <td>{freshUser.phone_number}</td>
              </tr>,
            ];
            if (activeUserId === String(user.id)) {
              rows.push(
                <tr key={String(user.id) + '-details'}>
                  <td colSpan={5} style={{ padding: 0 }}>
                    <UserDataCardComponent
                      user={freshUser}
                      onUserUpdate={handleUserUpdate}
                      onClose={handleCloseDetail}
                      onSaveSuccess={handleSaveSuccess}
                      onShowMessage={onShowMessage}
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
