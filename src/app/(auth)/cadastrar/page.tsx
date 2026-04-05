import { Suspense } from "react";
import { CadastrarForm } from "./CadastrarForm";

export default function CadastrarPage() {
  return (
    <Suspense>
      <CadastrarForm />
    </Suspense>
  );
}
