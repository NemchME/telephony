import { List, ListItemButton, ListItemText, Paper } from "@mui/material";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Dashboard" },
  { to: "/users", label: "Users" },
  { to: "/call-groups", label: "Call Groups" },
  { to: "/cdr", label: "CDR" },
  { to: "/reports", label: "Reports" },
];

export function Sidebar() {
  return (
    <Paper square sx={{ borderRight: "1px solid", borderColor: "divider" }}>
      <List>
        {items.map((it) => (
          <ListItemButton
            key={it.to}
            component={NavLink}
            to={it.to}
            sx={{
              fontWeight: 400,
              "&.active": { fontWeight: 700 },
            }}
          >
            <ListItemText primary={it.label} />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
}