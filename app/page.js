import Storefront from "../components/storefront";
import { groupedProducts, singleProducts, bottomProducts } from "../data/products";

export default function HomePage() {
  return (
    <Storefront
      groupedProducts={groupedProducts}
      singleProducts={singleProducts}
      bottomProducts={bottomProducts}
    />
  );
}
