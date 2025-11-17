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
  getAllRoles,
  inferRolesFromUser,
} from '../../utils/showuserdatafunctions';
import { useUsers } from '../../hooks/useUsers';
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
  const { users, refresh } = useUsers();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    refresh();
  }, []);

  const allRoles = getAllRoles();

  // robust: ermittelt die "richtige" id aus möglichen Feldern / nested Strukturen
  const resolveUserId = (u: any): string => {
    if (!u || typeof u !== 'object') return '';
    const tryKeys = ['id', '_id', 'userId', 'user_id', 'uid', 'uuid'];
    for (const k of tryKeys) {
      if (u[k] !== undefined && u[k] !== null && String(u[k]).trim() !== '') {
        return String(u[k]);
      }
    }
    if (u.user && (u.user.id || u.user._id || u.user.userId)) {
      return String(u.user.id ?? u.user._id ?? u.user.userId);
    }
    if (u.details && (u.details.id || u.details.userId)) {
      return String(u.details.id ?? u.details.userId);
    }
    return '';
  };

  // Hilfsfunktion: normalisiere Vor-/Nachname für konsistente Sortierung
  const normalizeName = (u: any) =>
    `${String(u.firstName ?? u.firstname ?? '').trim()} ${String(u.lastName ?? u.lastname ?? '').trim()}`
      .trim()
      .toLowerCase();

  // Filter-Logik + alphabetische Sortierung nur nach Name (Name-Spalte)
  const filteredUsers = users
    .filter((user) => {
      const searchString =
        `${user.firstName ?? user.firstname ?? ''} ${user.lastName ?? user.lastname ?? ''} ${user.address ?? ''}`.toLowerCase();
      const matchesSearch = searchString.includes(search.toLowerCase());
      const userRoles = inferRolesFromUser(user);
      const matchesRole = roleFilter === 'alle' || userRoles.includes(roleFilter);
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      const nameA = normalizeName(a);
      const nameB = normalizeName(b);
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base', numeric: true });
    });

  // Callback für Detailansicht, um nach dem Speichern/Löschen die Userdaten neu zu laden
  const handleUserUpdate = () => {
    refresh();
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

  // Checkbox-Handler (erhält bereits aufgelöste id)
  const handleCheckboxChange =
    (resolvedId: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedUserIds((prev) => {
        const newIds = event.target.checked
          ? Array.from(new Set([...prev, resolvedId]))
          : prev.filter((id) => id !== resolvedId);
        // Wichtig: neues Array zurückgeben, sonst ändert sich der State nicht
        return newIds;
      });
    };

  // Alle auswählen
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    let newIds: string[] = [];
    if (event.target.checked) {
      newIds = filteredUsers
        .map((user) => resolveUserId(user))
        .filter((id) => id !== '');
    }
    setSelectedUserIds(newIds);
  };

  // Informiere Parent bei jeder Änderung der Auswahl
  useEffect(() => {
    if (onSelectedUserIdsChange) onSelectedUserIdsChange(selectedUserIds);
  }, [selectedUserIds, onSelectedUserIdsChange]);

  const allChecked =
    filteredUsers.length > 0 &&
    filteredUsers.every((user) => selectedUserIds.includes(resolveUserId(user)));
  const someChecked =
    filteredUsers.some((user) => selectedUserIds.includes(resolveUserId(user))) &&
    !allChecked;

  // Ersetze eigenen State durch Props, falls vorhanden
  const [internalSelectedUserId, internalSetSelectedUserId] = useState<
    string | null
  >(null);
  const activeUserId =
    selectedUserId !== undefined && selectedUserId !== null ? selectedUserId : internalSelectedUserId;
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
              users.find((u) => String((u as any).id) === String((user as any).id)) ?? user;
            const fu = freshUser as any;
            const resolvedId = resolveUserId(freshUser);
            const displayName = `${String(fu.firstName ?? fu.firstname ?? '')} ${String(
              fu.lastName ?? fu.lastname ?? ''
            )}`.trim();
            const displayDate =
              fu.dateOfBirth ?? fu.date_of_birth ?? fu.date ?? undefined;
            const displayPhone = String(fu.phoneNumber ?? fu.phone_number ?? '');

            const rows = [
              <tr
                key={resolvedId || String((user as any).id)}
                style={{
                  cursor: 'pointer',
                  background: activeUserId === resolvedId ? 50 : undefined,
                }}
                onClick={() =>
                  changeSelectedUserId(activeUserId === resolvedId ? null : resolvedId)
                }
              >
                <td
                  onClick={(e) => e.stopPropagation()}
                  style={{ textAlign: 'center', width: 36 }}
                >
                  <Checkbox
                    checked={resolvedId !== '' && selectedUserIds.includes(resolvedId)}
                    onChange={handleCheckboxChange(resolvedId)}
                    aria-label={`User ${displayName} auswählen`}
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
                      {displayName}
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
                      {inferRolesFromUser(fu as any).map((role: string) => (
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
                <td>{formatDateForDisplay(displayDate)}</td>
                <td>{`${String(fu.address ?? '')}`.trim()}</td>
                <td>{displayPhone}</td>
              </tr>,
            ];
            if (activeUserId === resolvedId) {
              rows.push(
                <tr key={String(resolvedId) + '-details'}>
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
