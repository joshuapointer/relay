import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const carriers = [
  { id: 'carrier_usps', name: 'usps', displayName: 'USPS', code: 'usps' },
  { id: 'carrier_ups', name: 'ups', displayName: 'UPS', code: 'ups' },
  { id: 'carrier_fedex', name: 'fedex', displayName: 'FedEx', code: 'fedex' },
  { id: 'carrier_dhl', name: 'dhl', displayName: 'DHL', code: 'dhl' },
];

async function main() {
  for (const carrier of carriers) {
    await prisma.carrier.upsert({
      where: { code: carrier.code },
      update: { name: carrier.name, displayName: carrier.displayName },
      create: carrier,
    });
    console.log(`Seeded carrier: ${carrier.displayName}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
