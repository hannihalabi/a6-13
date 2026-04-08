import Storefront from "../components/storefront";
import { groupedProducts, singleProducts } from "../data/products";

export default function HomePage() {
  return (
    <Storefront
      groupedProducts={groupedProducts}
      singleProducts={singleProducts}
    />
  );
}
