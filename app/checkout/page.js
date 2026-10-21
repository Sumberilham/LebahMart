import CheckoutForm from '@/components/CheckoutForm';
import { getCatalog } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const catalog = await getCatalog();
  return (
    <div className="container">
      <CheckoutForm
        services={catalog.shippingServices}
        methods={catalog.paymentMethods}
        vouchers={catalog.vouchers}
      />
    </div>
  );
}
