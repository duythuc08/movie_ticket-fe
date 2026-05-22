import { Construction } from "lucide-react";
import Link from "next/link";

export default function AdminDevelopingPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 text-center">
      <div className="rounded-full bg-amber-600/20 p-6">
        <Construction size={48} className="text-amber-400" />
      </div>
      <h1 className="text-3xl font-bold text-white">Đang phát triển</h1>
      <p className="text-gray-400 max-w-md">
        Tính năng này đang trong quá trình phát triển và sẽ sớm được ra mắt.
      </p>
      <Link
        href="/admin"
        className="mt-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
      >
        Quay về Dashboard
      </Link>
    </div>
  );
}
