import { useMemo } from "react";
import { Card, CardContent, Skeleton, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { useUsersQuery, useUserStatesQuery } from '@/entities/user/api/userApi';
import { useGetCallGroupsQuery } from "@/entities/callGroup/api/callGroupApi";

function StatCard(props: { title: string; value: React.ReactNode; subtitle?: string }) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={0.5}>
          <Typography variant="overline" color="text.secondary">
            {props.title}
          </Typography>
          <Typography variant="h4">{props.value}</Typography>
          {props.subtitle ? (
            <Typography variant="body2" color="text.secondary">
              {props.subtitle}
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function SummaryCards() {
  const users = useUsersQuery();
  const states = useUserStatesQuery();
  const groups = useGetCallGroupsQuery();

  const stats = useMemo(() => {
    const usersList = users.data ?? [];
    const statesList = states.data ?? [];
    const groupsList = groups.data ?? [];

    const onlineCount = statesList?.elements?.filter((s: any) => s?.networkStatus === 1).length;
    const busyCount = statesList?.elements?.filter((s: any) => (s?.busyCount ?? 0) > 0).length;

    return {
      usersTotal: usersList.length,
      usersOnline: onlineCount,
      usersBusy: busyCount,
      groupsTotal: groupsList.length,
    };
  }, [users.data, states.data, groups.data]);

  const loading = users.isLoading || states.isLoading || groups.isLoading;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}>
        {loading ? (
          <Skeleton height={110} />
        ) : (
          <StatCard
            title="Пользователи"
            value={stats.usersTotal}
            subtitle={`online: ${stats.usersOnline}, busy: ${stats.usersBusy}`}
          />
        )}
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        {loading ? <Skeleton height={110} /> : <StatCard title="Группы дозвона" value={stats.groupsTotal} />}
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        {loading ? <Skeleton height={110} /> : <StatCard title="Активные вызовы" value={"—"} subtitle="подключим через WebSocket" />}
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        {loading ? <Skeleton height={110} /> : <StatCard title="Состояние" value={"OK"} subtitle="cookie session ok" />}
      </Grid>
    </Grid>
  );
}