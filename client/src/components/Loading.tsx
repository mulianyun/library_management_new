import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-gray-400" size={32} />
      <span className="ml-3 text-gray-400">加载中...</span>
    </div>
  );
}
