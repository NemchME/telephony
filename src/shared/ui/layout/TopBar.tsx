import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { useAppSelector } from "@/app/store/hooks";
import { useTerminateMutation } from "@/entities/session/api/authApi";

export function TopBar() {
  const userName = useAppSelector((s) => s.session.userName);
  const sessionID = useAppSelector((s) => s.session.sessionID);
  const [terminate, { isLoading }] = useTerminateMutation();

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Virta Front
        </Typography>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Typography variant="body2">{userName ?? "—"}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            {sessionID ? sessionID.slice(0, 8) + "…" : ""}
          </Typography>
          <Button color="inherit" disabled={!sessionID || isLoading} onClick={() => terminate()}>
            Выйти
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}