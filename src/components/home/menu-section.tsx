import { OrderingExperience } from "@/components/ordering/ordering-experience";
import type { MenuCategory } from "@/lib/types";

type MenuSectionProps = {
  categories: MenuCategory[];
  estimatedPickupMinutes: number;
};

export function MenuSection({ categories, estimatedPickupMinutes }: MenuSectionProps) {
  return (
    <section id="menu">
      <OrderingExperience
        categories={categories}
        estimatedPickupMinutes={estimatedPickupMinutes}
      />
    </section>
  );
}
