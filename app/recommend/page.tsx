import { Suspense } from "react";
import RestaurantRecommendations from "../components/RestaurantRecommendations";

export default function RecommendPage() {
  return (
    <Suspense>
      <RestaurantRecommendations />
    </Suspense>
  );
}
