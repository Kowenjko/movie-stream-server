import { Router } from 'express'
import WebTorrent from 'webtorrent'

const router = Router()
const client = new WebTorrent()

router.get('/', (_, res) => {
  res.sendFile('src/views/index.html', { root: '.' })
})

export default router
