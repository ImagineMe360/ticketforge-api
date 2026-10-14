import db from '../db/connect'
import NotFoundError from '../errors/not-found-error'

const tierSelect = { id: true, name: true, priceKobo: true, capacity: true }

export const listPublishedEvents = async (page: number, limit: number) => {
  const where = { status: 'PUBLISHED' as const, startsAt: { gte: new Date() } }

  const [items, total] = await db.$transaction([
    db.event.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { tiers: { select: tierSelect } },
    }),
    db.event.count({ where }),
  ])

  return { items, page, limit, total, totalPages: Math.ceil(total / limit) }
}

export const getPublishedEvent = async (id: string) => {
  const event = await db.event.findFirst({
    where: { id, status: 'PUBLISHED' },
    include: { tiers: { select: tierSelect } },
  })
  if (!event) throw new NotFoundError('Event not found')
  return event
}
