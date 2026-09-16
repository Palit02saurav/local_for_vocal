import { Suspense } from "react";
import Login from "./login";

export const metadata = {
  title: "Login | Geoinformaticx",
  description: "Sign in or create an account.",
};

export default function LoginPage() {
  return (
    <main>
      <Suspense fallback={null}>
        <Login />
      </Suspense>
    </main>
  );
}