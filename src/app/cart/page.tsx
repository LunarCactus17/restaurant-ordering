import { CartPageExperience } from "@/components/ordering/cart-page-experience";
import { getStoreSettings } from "@/lib/store-settings";

export default async function CartPage() {
  const storeSettings = await getStoreSettings();

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <CartPageExperience estimatedPickupMinutes={storeSettings.estimatedPickupMinutes} />
      </div>
    </main>
  );
}
