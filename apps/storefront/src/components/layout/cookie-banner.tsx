"use client";

import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const STORAGE_KEY = "sf_cookie_consent";

type Props = { locale: string; themeId?: string };
type Status = "pending" | "rejected" | "accepted";

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function CookieBanner({ locale, themeId }: Props) {
  const [status, setStatus] = useState<Status>("accepted");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setStatus("pending");
        setOpen(true);
        return;
      }
      const parsed = JSON.parse(raw) as { value?: string };
      if (parsed?.value === "accepted") setStatus("accepted");
      else setStatus("rejected");
    } catch {
      setStatus("pending");
      setOpen(true);
    }
  }, []);

  const persist = (value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ value, ts: Date.now() }));
    } catch {}
    setStatus(value);
    setOpen(false);
  };

  const isHumanMade = themeId === "humanmade";
  const rounded = isHumanMade ? "rounded-none" : "rounded-2xl";
  const roundedTop = isHumanMade ? "rounded-none" : "rounded-t-2xl sm:rounded-2xl";
  const btnRadius = isHumanMade ? "rounded-none" : "rounded-lg";
  const headingFont = isHumanMade
    ? "text-[13px] font-normal tracking-[0.12em] uppercase text-[#121212]"
    : "text-base font-semibold text-gray-900";
  const subheadingFont = isHumanMade
    ? "text-[12px] font-normal tracking-[0.1em] uppercase text-[#121212]"
    : "text-sm font-semibold text-gray-900";
  const bodyFont = isHumanMade
    ? "text-[12px] leading-[1.8] tracking-[0.03em] text-[#121212]/80"
    : "text-sm leading-relaxed text-gray-600";
  const rejectBtn = isHumanMade
    ? "flex-1 border border-[#121212] bg-white px-4 py-3 text-[11px] font-normal uppercase tracking-[0.1em] text-[#121212] hover:bg-[#f5f5f5]"
    : "flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50";
  const acceptBtn = isHumanMade
    ? "flex-1 border border-[#121212] bg-[#121212] px-4 py-3 text-[11px] font-normal uppercase tracking-[0.1em] text-white hover:bg-[#333]"
    : "flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90";
  const acceptStyle = isHumanMade ? undefined : { backgroundColor: "var(--tenant-accent, #111)" };

  const labels = {
    title: t(locale, "Cookie 政策", "Cookie Policy", "Política de Cookies", "Cookie ポリシー"),
    reject: t(locale, "拒絕", "Reject", "Rejeitar", "拒絶"),
    accept: t(locale, "接受", "Accept", "Aceitar", "接受"),
    review: t(locale, "查看 Cookie 政策", "Review cookie policy", "Rever política de cookies", "Cookie ポリシーを確認"),
    notice: t(
      locale,
      "您尚未接受 Cookie 政策。",
      "You haven't accepted our cookie policy yet.",
      "Ainda não aceitou a nossa política de cookies.",
      "Cookie ポリシーに同意していません。"
    ),
    close: t(locale, "關閉", "Close", "Fechar", "閉じる"),
  };

  const Modal = (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-banner-title"
    >
      <div className="fixed inset-0 bg-black/60 transition-opacity" onClick={() => setOpen(false)} />

      <div className={`relative w-full sm:max-w-xl transform overflow-hidden ${roundedTop} bg-white shadow-2xl transition-all`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 id="cookie-banner-title" className={headingFont}>{labels.title}</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label={labels.close}
          >
            <XMarkIcon className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className={`max-h-[55vh] overflow-y-auto px-6 py-5 ${bodyFont}`}>
          <h3 className={`mb-3 ${subheadingFont}`}>{labels.title}</h3>

          <p className="mb-3">
            {t(
              locale,
              "本網站使用 Cookie 以達到本 Cookie 政策所訂定的各種目的。我們將儲存在您終端裝置上的小型檔案稱為「第一方 Cookie」。同樣地，那些並非由本網站運營者所設置、用於廣告及行銷活動的 Cookie，以及由您訪問的網站以外的域名所提供的第三方 Cookie，則稱為「第三方 Cookie」。我們將利用這些 Cookie 來判斷您的終端裝置與本網站之間是否有過往的連接紀錄。",
              "This website uses cookies for the various purposes set out in this Cookie Policy. We refer to the small files stored on your device as first-party cookies. Cookies used for advertising and marketing activities that are set by parties other than the website operator, or third-party cookies served from domains other than the one you are visiting, are referred to as third-party cookies. We use these cookies to determine whether your device has previously connected to this website.",
              "Este site usa cookies para as várias finalidades definidas nesta Política de Cookies. Chamamos de cookies de primeira parte os pequenos arquivos armazenados no seu dispositivo. Os cookies usados para atividades de publicidade e marketing definidos por partes diferentes do operador do site, ou cookies de terceiros servidos de domínios diferentes daquele que você está visitando, são chamados de cookies de terceiros. Usamos esses cookies para determinar se o seu dispositivo já se conectou anteriormente a este site.",
              "当サイトは、Cookie を本 Cookie ポリシーに定めた様々な目的で使用します。当社が設定する Cookie のことをファーストパーティ Cookie といいます。当社は、当社の広告及びマーケティング活動のために、お客様が閲覧するウェブサイトのドメインとは異なるドメインが発行する Cookie であるサードパーティ Cookie も使用します。お客様のエンドデバイスと当サイトの間に過去何らかの接続があったかどうかについて、これらの Cookie を使用して判定します。"
            )}
          </p>

          <p className="mb-3">
            {t(
              locale,
              "您可以透過瀏覽器設定阻止 Cookie 的儲存，也可以隨時變更設定以拒絕接受或刪除已儲存的 Cookie。有關 Cookie 的詳細資訊，以及如何管理或刪除 Cookie，請參閱 www.aboutcookies.org 或 www.allaboutcookies.org。",
              "You can block cookies from being saved through your browser settings, and you can also change the settings at any time to refuse cookies or delete cookies that have already been saved. For more detailed information about cookies and how to manage or delete them, please see www.aboutcookies.org or www.allaboutcookies.org.",
              "Você pode bloquear o armazenamento de cookies através das configurações do seu navegador, e também pode alterar as configurações a qualquer momento para recusar cookies ou excluir cookies já armazenados. Para informações mais detalhadas sobre cookies e como gerenciá-los ou excluí-los, consulte www.aboutcookies.org ou www.allaboutcookies.org.",
              "ブラウザの設定で Cookie の保存を防ぐことができます。また、設定をいつでも変更して Cookie の受け入れを拒否したり、既に保存されている Cookie を削除することもできます。Cookie の詳細及び管理・削除方法については www.aboutcookies.org 又は www.allaboutcookies.org をご覧ください。"
            )}
          </p>

          <p>
            {t(
              locale,
              "Cookie 依據其功能與設定目的，大致可分為以下三類：必要 Cookie、效能 Cookie 及目標 Cookie。",
              "Cookies can be broadly categorized into three types according to their purpose and function: strictly necessary cookies, performance cookies, and targeting cookies.",
              "Os cookies podem ser amplamente categorizados em três tipos de acordo com sua finalidade e função: cookies estritamente necessários, cookies de desempenho e cookies de direcionamento.",
              "Cookie は、それらの機能と意図された目的に応じて、次の 3 つのカテゴリーに振り分けられます。すなわち、必須 Cookie、パフォーマンス Cookie 及びターゲティング Cookie です。"
            )}
          </p>
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={() => persist("rejected")} className={rejectBtn}>
            {labels.reject}
          </button>
          <button type="button" onClick={() => persist("accepted")} className={acceptBtn} style={acceptStyle}>
            {labels.accept}
          </button>
        </div>
      </div>
    </div>
  );

  const StickyBar = (
    <div className={`fixed inset-x-0 top-0 z-[55] border-b ${isHumanMade ? "border-[#121212] bg-[#121212] text-white" : "border-gray-800 bg-gray-900 text-white"}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <p className={isHumanMade ? "text-[11px] tracking-[0.1em] uppercase" : "text-xs sm:text-sm"}>
          {labels.notice}
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={
              isHumanMade
                ? "border border-white/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] text-white hover:bg-white/10"
                : `${btnRadius} border border-white/30 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10`
            }
          >
            {labels.review}
          </button>
          <button
            type="button"
            onClick={() => persist("accepted")}
            className={
              isHumanMade
                ? "border border-white bg-white px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] text-[#121212] hover:bg-white/90"
                : `${btnRadius} px-3 py-1.5 text-xs font-semibold text-gray-900 hover:opacity-90`
            }
            style={isHumanMade ? undefined : { backgroundColor: "#fff" }}
          >
            {labels.accept}
          </button>
        </div>
      </div>
    </div>
  );

  if (status === "accepted") return null;

  return (
    <>
      {status === "rejected" && !open && StickyBar}
      {open && Modal}
    </>
  );
}
