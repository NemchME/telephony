import { Container, Box, Typography, Paper } from "@mui/material";
import { LoginForm } from "./ui/LoginForm";

export function LoginPage() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Paper sx={{ p: 3, width: "100%" }} elevation={2}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Вход
          </Typography>
          <LoginForm />
        </Paper>
      </Box>
    </Container>
  );
}