import db from '../db/connect'

async function main() {
  const existing = await db.event.count()
  if (existing > 0) {
    console.log('Events already seeded, skipping.')
    return
  }

  // Placeholder hash: this account can't log in yet. Real hashing arrives in Phase 1.
  const organizer = await db.user.upsert({
    where: { email: 'organizer@ticketforge.dev' },
    update: {},
    create: {
      email: 'organizer@ticketforge.dev',
      name: 'Demo Organizer',
      passwordHash: 'not-a-real-hash',
      role: 'ORGANIZER',
    },
  })

  const day = 24 * 60 * 60 * 1000
  const events = [
    {
      title: 'Lagos Jazz Night',
      venue: 'Terra Kulture',
      days: 14,
      tiers: [
        ['Regular', 500000, 200],
        ['VIP', 1500000, 50],
      ],
    },
    {
      title: 'Afrobeats Open Air',
      venue: 'Eko Atlantic Arena',
      days: 30,
      tiers: [
        ['Regular', 1000000, 1000],
        ['VIP', 5000000, 100],
      ],
    },
    {
      title: 'Tech Founders Summit',
      venue: 'Landmark Centre',
      days: 45,
      tiers: [['Standard', 2500000, 300]],
    },
  ] as const

  for (const e of events) {
    await db.event.create({
      data: {
        organizerId: organizer.id,
        title: e.title,
        description: `${e.title}: a seeded demo event.`,
        venue: e.venue,
        startsAt: new Date(Date.now() + e.days * day),
        status: 'PUBLISHED',
        tiers: {
          create: e.tiers.map(([name, priceKobo, capacity]) => ({
            name,
            priceKobo,
            capacity,
          })),
        },
      },
    })
  }
  console.log('Seeded.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
