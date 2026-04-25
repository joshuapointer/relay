'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useSdk } from '@/hooks/useSdk';

const CARRIERS = [
  { code: 'USPS', label: 'USPS' },
  { code: 'UPS', label: 'UPS' },
  { code: 'FEDEX', label: 'FedEx' },
  { code: 'DHL', label: 'DHL' },
  { code: 'DHLEXPRESS', label: 'DHL Express' },
  { code: 'ONTRAC', label: 'OnTrac' },
  { code: 'LASERSHIP', label: 'LaserShip' },
  { code: 'AMAZON', label: 'Amazon Logistics' },
] as const;

const schema = z.object({
  trackingNumber: z
    .string()
    .min(6, 'Tracking number must be at least 6 characters.')
    .max(40, 'Tracking number must be at most 40 characters.'),
  carrierCode: z.string().optional(),
  nickname: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewShipmentPage() {
  const router = useRouter();
  const sdk = useSdk();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    try {
      const shipment = await sdk.shipments.create({
        trackingNumber: values.trackingNumber,
        carrierCode: values.carrierCode ?? undefined,
        nickname: values.nickname ?? undefined,
      });
      router.push(`/shipments/${shipment.id}`);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 409) {
        setError('trackingNumber', {
          message: 'This tracking number is already in your account.',
        });
      } else if (status === 400) {
        setError('trackingNumber', {
          message: 'Invalid tracking number or carrier.',
        });
      } else {
        setError('root', {
          message: 'Something went wrong. Please try again.',
        });
      }
    }
  }

  return (
    <div id="main-content" className="mx-auto max-w-lg px-4 py-8">
      <h1 className="font-heading mb-6 text-2xl font-semibold text-ink">
        Add tracking
      </h1>

      {/* handleSubmit returns a void-returning function; wrap to silence promise rule */}
      <form
        onSubmit={(e) => { void handleSubmit(onSubmit)(e); }}
        noValidate
        className="flex flex-col gap-5"
      >
        {/* Tracking number */}
        <div>
          <label
            htmlFor="trackingNumber"
            className="font-body mb-1 block text-sm font-medium text-ink"
          >
            Tracking number <span aria-hidden="true" className="text-exception">*</span>
          </label>
          <input
            id="trackingNumber"
            type="text"
            autoComplete="off"
            placeholder="e.g. 1Z999AA10123456784"
            aria-required="true"
            aria-describedby={errors.trackingNumber ? 'trackingNumber-error' : undefined}
            {...register('trackingNumber')}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-ink placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          />
          {errors.trackingNumber && (
            <p id="trackingNumber-error" role="alert" className="mt-1 font-body text-xs text-exception">
              {errors.trackingNumber.message}
            </p>
          )}
          <p className="mt-1 font-body text-xs text-textMuted">
            💡 Testing? Use EasyPost test numbers: EZ1000000001–EZ7000000007
          </p>
        </div>

        {/* Carrier */}
        <div>
          <label
            htmlFor="carrierCode"
            className="font-body mb-1 block text-sm font-medium text-ink"
          >
            Carrier <span className="font-body text-xs text-textMuted">(optional — auto-detected)</span>
          </label>
          <select
            id="carrierCode"
            {...register('carrierCode')}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            <option value="">Auto-detect</option>
            {CARRIERS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Nickname */}
        <div>
          <label
            htmlFor="nickname"
            className="font-body mb-1 block text-sm font-medium text-ink"
          >
            Nickname <span className="font-body text-xs text-textMuted">(optional)</span>
          </label>
          <input
            id="nickname"
            type="text"
            placeholder={`e.g. "Mom's birthday gift"`}
            {...register('nickname')}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-ink placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          />
        </div>

        {/* Root error */}
        {errors.root && (
          <p role="alert" className="font-body text-sm text-exception">
            {errors.root.message}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => { router.push('/dashboard'); }}
            className="flex-1 rounded-md border border-border px-4 py-2.5 font-body text-sm font-medium text-ink transition-colors hover:bg-neutral focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-md bg-primary px-4 py-2.5 font-body text-sm font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Adding…' : 'Add shipment'}
          </button>
        </div>
      </form>
    </div>
  );
}
