"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/lib/actions/account";
import { logout } from "@/lib/actions/auth";

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

type Props = {
  locale: string;
  initialData: {
    name: string;
    email: string;
    phone: string;
    locale: string;
  };
};

export default function ProfileForm({ locale, initialData }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialData.name);
  const [email, setEmail] = useState(initialData.email);
  const [phone, setPhone] = useState(initialData.phone);
  const [preferredLocale, setPreferredLocale] = useState(initialData.locale);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const result = await updateProfile({ name, email, phone, locale: preferredLocale });

    if (result.success) {
      setMessage({
        type: "success",
        text: t(locale, "已儲存", "Saved successfully", "Salvo com sucesso", "保存しました"),
      });
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error || "Error" });
    }

    setSaving(false);
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900">
        {t(locale, "個人資料", "Profile", "Perfil", "プロフィール")}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {t(locale, "管理您的帳號資訊", "Manage your account information", "Gerencie suas informações de conta", "アカウント情報を管理")}
      </p>

      <form onSubmit={handleSave} className="mt-8 space-y-6 max-w-lg">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            {t(locale, "姓名", "Name", "Nome", "名前")}
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            {t(locale, "電郵", "Email", "E-mail", "メール")}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            {t(locale, "電話", "Phone", "Telefone", "電話番号")}
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Preferred language */}
        <div>
          <label htmlFor="locale" className="block text-sm font-medium text-gray-700">
            {t(locale, "偏好語言", "Preferred language", "Idioma preferido", "言語設定")}
          </label>
          <select
            id="locale"
            value={preferredLocale}
            onChange={(e) => setPreferredLocale(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="tc">繁體中文</option>
            <option value="sc">简体中文</option>
            <option value="en">English</option>
            <option value="pt">Português</option>
            <option value="ja">日本語</option>
          </select>
        </div>

        {/* Message */}
        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {message.text}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {saving
              ? t(locale, "儲存中…", "Saving…", "Salvando…", "保存中…")
              : t(locale, "儲存", "Save", "Salvar", "保存")
            }
          </button>
        </div>
      </form>

      {/* Logout section */}
      <div className="mt-12 border-t border-gray-200 pt-8">
        <h3 className="text-sm font-medium text-gray-900">
          {t(locale, "登出", "Sign out", "Sair", "ログアウト")}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {t(locale, "登出您的帳號", "Sign out of your account", "Saia da sua conta", "アカウントからログアウト")}
        </p>
        <button
          type="button"
          onClick={() => logout(locale)}
          className="mt-4 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          {t(locale, "登出", "Sign out", "Sair", "ログアウト")}
        </button>
      </div>
    </div>
  );
}
