"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import {
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/lib/actions/account";

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

type Address = {
  id: string;
  label: string | null;
  recipientName: string;
  phone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  district: string | null;
  city: string | null;
  isDefault: boolean;
};

type FormData = {
  label: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  district: string;
  city: string;
  isDefault: boolean;
};

const emptyForm: FormData = {
  label: "",
  recipientName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  district: "",
  city: "Macau",
  isDefault: false,
};

type Props = {
  locale: string;
  initialAddresses: Address[];
};

export default function AddressesClient({ locale, initialAddresses }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(addr: Address) {
    setEditingId(addr.id);
    setForm({
      label: addr.label || "",
      recipientName: addr.recipientName,
      phone: addr.phone || "",
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || "",
      district: addr.district || "",
      city: addr.city || "Macau",
      isDefault: addr.isDefault,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const result = editingId
      ? await updateAddress(editingId, form)
      : await addAddress(form);

    if (result.success) {
      closeForm();
      router.refresh();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await deleteAddress(id);
    router.refresh();
    setDeleting(null);
  }

  async function handleSetDefault(id: string) {
    await setDefaultAddress(id);
    router.refresh();
  }

  const districts = [
    { value: "", label: t(locale, "選擇地區", "Select district", "Selecione", "地区を選択") },
    { value: "澳門半島", label: t(locale, "澳門半島", "Macau Peninsula", "Pen. de Macau", "マカオ半島") },
    { value: "氹仔", label: t(locale, "氹仔", "Taipa", "Taipa", "タイパ") },
    { value: "路環", label: t(locale, "路環", "Coloane", "Coloane", "コロアン") },
    { value: "路氹城", label: t(locale, "路氹城", "Cotai", "Cotai", "コタイ") },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {t(locale, "送貨地址", "Addresses", "Endereços", "配送先")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t(locale, "管理您的送貨地址", "Manage your delivery addresses", "Gerencie seus endereços", "配送先を管理")}
          </p>
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <PlusIcon className="size-4" />
            {t(locale, "新增地址", "Add address", "Adicionar", "追加")}
          </button>
        )}
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <form onSubmit={handleSave} className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">
            {editingId
              ? t(locale, "編輯地址", "Edit address", "Editar endereço", "住所を編集")
              : t(locale, "新增地址", "Add address", "Adicionar endereço", "住所を追加")
            }
          </h3>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Label */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t(locale, "標籤", "Label", "Rótulo", "ラベル")}
              </label>
              <input
                type="text"
                placeholder={t(locale, "例: 住家、公司", "e.g. Home, Office", "Ex: Casa, Escritório", "例: 自宅、会社")}
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Recipient */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t(locale, "收件人", "Recipient", "Destinatário", "受取人")} *
              </label>
              <input
                type="text"
                required
                value={form.recipientName}
                onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t(locale, "電話", "Phone", "Telefone", "電話")}
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* District */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t(locale, "地區", "District", "Distrito", "地区")}
              </label>
              <select
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                {districts.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            {/* Address line 1 */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                {t(locale, "地址", "Address", "Endereço", "住所")} *
              </label>
              <input
                type="text"
                required
                value={form.addressLine1}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Address line 2 */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                {t(locale, "地址（第二行）", "Address line 2", "Complemento", "住所2")}
              </label>
              <input
                type="text"
                value={form.addressLine2}
                onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Default checkbox */}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-gray-700">
                  {t(locale, "設為預設地址", "Set as default address", "Definir como padrão", "デフォルトに設定")}
                </span>
              </label>
            </div>
          </div>

          {/* Form actions */}
          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving
                ? t(locale, "儲存中…", "Saving…", "Salvando…", "保存中…")
                : t(locale, "儲存", "Save", "Salvar", "保存")
              }
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              {t(locale, "取消", "Cancel", "Cancelar", "キャンセル")}
            </button>
          </div>
        </form>
      )}

      {/* Address list */}
      <div className="mt-8 space-y-4">
        {initialAddresses.length === 0 && !showForm && (
          <div className="text-center py-12">
            <MapPinIcon className="mx-auto size-12 text-gray-300" />
            <h3 className="mt-4 text-sm font-semibold text-gray-900">
              {t(locale, "尚無地址", "No addresses yet", "Nenhum endereço", "住所がありません")}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t(locale, "新增地址以加快結帳速度", "Add an address for faster checkout", "Adicione um endereço", "チェックアウトを速くするため住所を追加")}
            </p>
          </div>
        )}

        {initialAddresses.map((addr) => (
          <div
            key={addr.id}
            className={`rounded-lg border p-4 ${addr.isDefault ? "border-indigo-200 bg-indigo-50/50" : "border-gray-200 bg-white"}`}
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {addr.label && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      {addr.label}
                    </span>
                  )}
                  {addr.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                      <CheckCircleIcon className="size-3.5" />
                      {t(locale, "預設", "Default", "Padrão", "デフォルト")}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm font-medium text-gray-900">{addr.recipientName}</p>
                {addr.phone && <p className="text-sm text-gray-500">{addr.phone}</p>}
                <p className="mt-1 text-sm text-gray-600">
                  {addr.addressLine1}
                  {addr.addressLine2 && <>, {addr.addressLine2}</>}
                </p>
                <p className="text-sm text-gray-500">
                  {[addr.district, addr.city].filter(Boolean).join(", ")}
                </p>
              </div>

              {/* Actions */}
              <div className="ml-4 flex items-center gap-1 shrink-0">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title={t(locale, "設為預設", "Set as default", "Definir como padrão", "デフォルトに設定")}
                  >
                    <CheckCircleIcon className="size-4" />
                  </button>
                )}
                <button
                  onClick={() => openEdit(addr)}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  title={t(locale, "編輯", "Edit", "Editar", "編集")}
                >
                  <PencilIcon className="size-4" />
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  disabled={deleting === addr.id}
                  className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  title={t(locale, "刪除", "Delete", "Excluir", "削除")}
                >
                  <TrashIcon className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
