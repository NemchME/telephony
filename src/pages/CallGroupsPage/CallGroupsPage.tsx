import React, { useMemo, useState } from 'react';
import {
  Stack,
  Typography,
  Paper,
  Chip,
  IconButton,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tooltip,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

import { useUsersQuery } from '@/entities/user/api/userApi';
import { useGetCallGroupsQuery } from '@/entities/callGroup/api/callGroupApi';

type Row = {
  id: string;
  name: string;
  commonName: string;
  type: string;
  numbers: string[];
  agentsCount: number;
  agentNames: string[];
  rawAgents: { userID: string; status?: number; timeout?: number }[];
};

export function CallGroupsPage() {
  const { data: usersData, isLoading: usersLoading, isError: usersError } = useUsersQuery();
  const { data: groupsData, isLoading: groupsLoading, isError: groupsError } = useGetCallGroupsQuery();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const usersById = useMemo(() => {
    const map = new Map<string, { label: string; numbers: string[]; availStatus?: string; busyStatus?: string }>();
    (usersData?.elements ?? []).forEach((u) => {
      const label = (u.commonName?.trim() || u.name || u.userName || u.login || u.id) ?? u.id;
      map.set(u.id, { label, numbers: u.numbers ?? [], availStatus: u.availStatus, busyStatus: u.busyStatus });
    });
    return map;
  }, [usersData]);

  const rows: Row[] = useMemo(() => {
    const groups = groupsData?.elements ?? [];
    return groups.map((g) => {
      const rawAgents = g.agents ?? [];
      const agentNames = rawAgents
        .map((a) => usersById.get(a.userID)?.label ?? a.userID)
        .slice(0, 5);

      return {
        id: g.id,
        name: g.name,
        commonName: g.commonName?.trim() || '—',
        type: g.type ?? '—',
        numbers: g.numbers ?? [],
        agentsCount: rawAgents.length,
        agentNames,
        rawAgents,
      };
    });
  }, [groupsData, usersById]);

  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  const columns = useMemo<GridColDef<Row>[]>(() => {
    return [
      { field: 'commonName', headerName: 'Группа', flex: 1.2, minWidth: 220 },
      { field: 'name', headerName: 'Тех. имя', flex: 1, minWidth: 160 },
      { field: 'type', headerName: 'Тип', width: 140 },
      {
        field: 'numbers',
        headerName: 'Номера',
        flex: 1,
        minWidth: 180,
        renderCell: (p) => {
          const nums = p.row.numbers;
          if (!nums.length) return '—';
          return (
            <Stack direction="row" spacing={1} sx={{ overflow: 'hidden' }}>
              {nums.slice(0, 3).map((n) => (
                <Chip key={n} size="small" label={n} />
              ))}
              {nums.length > 3 ? <Chip size="small" label={`+${nums.length - 3}`} /> : null}
            </Stack>
          );
        },
      },
      {
        field: 'agentsCount',
        headerName: 'Агенты',
        width: 120,
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'agentNames',
        headerName: 'Кто внутри',
        flex: 1.2,
        minWidth: 240,
        sortable: false,
        renderCell: (p) => {
          const names = p.row.agentNames;
          if (!names.length) return '—';
          return (
            <Stack direction="row" spacing={1} sx={{ overflow: 'hidden' }}>
              {names.map((n) => (
                <Chip key={n} size="small" variant="outlined" label={n} />
              ))}
              {p.row.agentsCount > names.length ? <Chip size="small" label={`+${p.row.agentsCount - names.length}`} /> : null}
            </Stack>
          );
        },
      },
      {
        field: '__actions',
        headerName: '',
        width: 64,
        sortable: false,
        filterable: false,
        renderCell: (p) => (
          <Tooltip title="Детали">
            <IconButton size="small" onClick={() => setSelectedId(p.row.id)}>
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ];
  }, []);

  const isLoading = usersLoading || groupsLoading;
  const isError = usersError || groupsError;

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between">
        <Typography variant="h5">Группы звонков</Typography>
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          {isLoading ? 'Загрузка…' : isError ? 'Ошибка загрузки' : `Групп: ${rows.length}`}
        </Typography>
      </Stack>

      <Paper sx={{ height: 560 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          getRowHeight={() => 'auto'}
          initialState={{
            pagination: { paginationModel: { pageSize: 15, page: 0 } },
          }}
          pageSizeOptions={[15, 30, 50]}
          onRowDoubleClick={(p) => setSelectedId(String(p.id))}
        />
      </Paper>

      <Drawer anchor="right" open={Boolean(selected)} onClose={() => setSelectedId(null)}>
        <Stack sx={{ width: 420, p: 2 }} spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h6">{selected?.commonName ?? '—'}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              {selected ? `${selected.name} • ${selected.type}` : ''}
            </Typography>
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Typography variant="subtitle2">Номера</Typography>
            {selected?.numbers?.length ? (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {selected.numbers.map((n) => (
                  <Chip key={n} size="small" label={n} />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                —
              </Typography>
            )}
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Typography variant="subtitle2">Агенты</Typography>

            <List dense disablePadding>
              {(selected?.rawAgents ?? []).map((a) => {
                const u = usersById.get(a.userID);
                const label = u?.label ?? a.userID;
                const status = [
                  u?.availStatus ? `avail=${u.availStatus}` : null,
                  u?.busyStatus ? `busy=${u.busyStatus}` : null,
                  a.timeout != null ? `timeout=${a.timeout}` : null,
                ]
                  .filter(Boolean)
                  .join(' • ');

                return (
                  <ListItem key={a.userID} divider>
                    <ListItemText
                      primary={label}
                      secondary={status || undefined}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Stack>
        </Stack>
      </Drawer>
    </Stack>
  );
}