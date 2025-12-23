import { Spinner } from "@/components/ui/spinner";

export default function ProjectLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFD]">
      <Spinner className="h-6 w-6 text-[#1D1D1F]" />
    </div>
  );
}
