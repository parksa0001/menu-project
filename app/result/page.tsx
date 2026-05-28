import { Suspense } from "react";
import VoteResult from "../components/VoteResult";

export default function ResultPage() {
  return (
    <Suspense>
      <VoteResult />
    </Suspense>
  );
}
