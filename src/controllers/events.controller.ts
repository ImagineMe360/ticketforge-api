import { Request, Response } from 'express'
import * as eventsService from '../services/events.service'
import { eventIdParams, listEventsQuery } from '../schemas/events.schema'
import { StatusCodes } from 'http-status-codes'

export const listEvents = async (req: Request, res: Response) => {
  const { page, limit } = listEventsQuery.parse(req.query)
  const result = await eventsService.listPublishedEvents(page, limit)
  res.status(StatusCodes.OK).json(result)
}

export const getEvent = async (req: Request, res: Response) => {
  const { id } = eventIdParams.parse(req.params)
  const event = await eventsService.getPublishedEvent(id)
  res.status(StatusCodes.OK).json(event)
}
