"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    setIsLoading(false);

    if (result?.ok) {
      router.push("/collections");
      return;
    }

    setError("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-16">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-indigo-100 via-white to-sky-100" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-indigo-200/40 to-transparent blur-3xl" />
      <div className="w-full max-w-lg rounded-3xl border border-white/70 bg-white/80 p-10 shadow-2xl backdrop-blur-md md:p-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
            <span className="text-lg font-semibold">K</span>
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Koleksiyon Yönetim Platformu
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Maestro hesabınızla giriş yaparak koleksiyonlarınızı yönetin.
          </p>
        </div>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <Input
            label="Kullanıcı Adı"
            name="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="kullanici.adı"
            autoComplete="username"
            required
          />
          <Input
            label="Şifre"
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          {error ? (
            <p className="rounded-md border border-rose-200 bg-rose-50/70 px-3 py-2 text-sm text-rose-700" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>
        </form>
      </div>
    </div>
  );
}

