import { Suspense } from "react";
import ConnectForm from "@/components/ConnectForm";

export default function ConnectPage() {
  return (
    <Suspense fallback={<p className="px-4 py-10">Loading...</p>}>
      <ConnectForm />
    </Suspense>
  );
}