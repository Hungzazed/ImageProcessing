/**
 * TypeScript module declarations for Module Federation remotes.
 * These tell TypeScript that `auth/AuthApp`, `auth/LoginPage`, etc. are valid imports.
 */

declare module 'auth/AuthApp' {
  import type { AuthAppPage } from '@/../src/pages/AuthApp';

  export type { AuthAppPage };

  export function AuthApp(props: { page?: AuthAppPage }): JSX.Element;
  export default function AuthApp(props: { page?: AuthAppPage }): JSX.Element;
}

declare module 'auth/LoginPage' {
  export function LoginPage(): JSX.Element;
  export default function LoginPage(): JSX.Element;
}

declare module 'auth/RegisterPage' {
  export function RegisterPage(): JSX.Element;
  export default function RegisterPage(): JSX.Element;
}

declare module 'auth/ForgotPasswordPage' {
  export function ForgotPasswordPage(): JSX.Element;
  export default function ForgotPasswordPage(): JSX.Element;
}

declare module 'auth/VerifyOtpPage' {
  export function VerifyOtpPage(): JSX.Element;
  export default function VerifyOtpPage(): JSX.Element;
}

declare module 'auth/ResetPasswordPage' {
  export function ResetPasswordPage(props: {
    searchParams: { email?: string; token?: string };
  }): JSX.Element;
  export default function ResetPasswordPage(props: {
    searchParams: { email?: string; token?: string };
  }): JSX.Element;
}
