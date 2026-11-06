import express from 'express'
import { getHealth, getReady } from '../controllers/health.controller'

const healthRoutes = express.Router()

healthRoutes.get('/', getHealth)
healthRoutes.get('/ready', getReady)

export default healthRoutes
