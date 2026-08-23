import { logout } from "@/lib/auth/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-ink-700 hover:border-brand-600 hover:text-brand-600"
      >
        ログアウト
      </button>
    </form>
  );
}
