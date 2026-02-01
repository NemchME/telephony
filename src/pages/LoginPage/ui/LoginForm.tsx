import { useMemo, useState, type FormEvent } from "react";
import { Alert, Button, Stack, TextField } from "@mui/material";
import { useLoginMutation } from "@/entities/session/api/authApi";
import { useNavigate } from "react-router-dom";

type RtkqErrorLike =
  | { status: number | string; data?: any }
  | { data?: any }
  | undefined;

function extractErrorMessage(error: RtkqErrorLike): string | null {
  if (!error) return null;

  const data = (error as any).data;

  if (data && typeof data === "object") {
    if (typeof data.message === "string" && data.message.trim()) return data.message;
    if (typeof data.error === "number") return `Ошибка (${data.error})`;
  }

  if ("status" in (error as any)) {
    return `Ошибка запроса (${String((error as any).status)})`;
  }

  return "Ошибка входа";
}

export function LoginForm() {
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate()
  const [login, { isLoading, error }] = useLoginMutation();

  const errorMessage = useMemo(() => extractErrorMessage(error as any), [error]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await login({ login: loginValue, password }).unwrap();
      navigate("/dashboard", { replace: true });
    } catch {
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <Stack spacing={2}>
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        <TextField
          label="Логин"
          value={loginValue}
          onChange={(e) => setLoginValue(e.target.value)}
          autoComplete="username"
          fullWidth
        />

        <TextField
          label="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          type="password"
          fullWidth
        />

        <Button type="submit" variant="contained" disabled={isLoading || !loginValue || !password}>
          {isLoading ? "Входим..." : "Войти"}
        </Button>

        <Button
          type="button"
          variant="text"
          onClick={() => {
            setLoginValue("dev1");
            setPassword("dev1_101");
          }}
        >
          Подставить dev1
        </Button>
      </Stack>
    </form>
  );
}