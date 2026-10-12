import express from 'express'
import { getEvent, listEvents } from '../controllers/events.controller'

const eventRoutes = express.Router()

eventRoutes.get('/', listEvents)
eventRoutes.get('/:id', getEvent)

export default eventRoutes
