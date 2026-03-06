import { LoginForm } from './ui/LoginForm';

export function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-box">
        <h2>Вход</h2>
        <LoginForm />
      </div>
    </div>
  );
}
