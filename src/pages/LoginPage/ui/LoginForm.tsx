import { useMemo, useState, type FormEvent } from 'react';
import { useLoginMutation } from '@/entities/session/api/authApi';
import { saveVertoCredentials } from '@/entities/call/model/vertoMiddleware';
import { useNavigate } from 'react-router-dom';

function extractErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const err = error as Record<string, unknown>;
  if (err.data && typeof err.data === 'object') {
    const data = err.data as Record<string, unknown>;
    if (typeof data.message === 'string' && data.message.trim()) return data.message;
    if (typeof data.error === 'number') return `Ошибка (${data.error})`;
  }
  if ('status' in err) return `Ошибка запроса (${String(err.status)})`;
  if ('message' in err && typeof err.message === 'string') return err.message;
  return 'Ошибка входа';
}

export function LoginForm() {
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [useVerto, setUseVerto] = useState(true);
  const navigate = useNavigate();
  const [login, { isLoading, error }] = useLoginMutation();
  const errorMessage = useMemo(() => extractErrorMessage(error as unknown), [error]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (useVerto) {
        saveVertoCredentials(loginValue, password);
      }
      await login({ login: loginValue, password, useVerto }).unwrap();
      navigate('/', { replace: true });
    } catch {

    }
  };

  return (
    <form onSubmit={onSubmit}>
      {errorMessage && <div className="error-alert">{errorMessage}</div>}
      <div className="form-field">
        <label>Логин</label>
        <input
          type="text"
          value={loginValue}
          onChange={(e) => setLoginValue(e.target.value)}
          autoComplete="username"
        />
      </div>
      <div className="form-field">
        <label>Пароль</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>
      <label className="form-field form-field--checkbox">
        <input
          type="checkbox"
          checked={!useVerto}
          onChange={(e) => setUseVerto(!e.target.checked)}
        />
        Использовать другое устройство
      </label>
      <button type="submit" disabled={isLoading || !loginValue || !password}>
        {isLoading ? 'Входим...' : 'Войти'}
      </button>
      {import.meta.env.DEV && (
        <button
          type="button"
          className="dev-btn"
          onClick={() => { setLoginValue('dev1'); setPassword('dev1_101'); }}
        >
          Подставить dev1
        </button>
      )}
    </form>
  );
}
