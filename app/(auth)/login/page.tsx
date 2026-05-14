import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
