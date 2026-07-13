import { useLocalSearchParams } from "expo-router";
import CatalogView from "../catalog";

export default function CategoryPage() {
  const { kategoria_id } = useLocalSearchParams<{kategoria_id : string}>();

;

  return <CatalogView kategoriaId={kategoria_id} />;
}