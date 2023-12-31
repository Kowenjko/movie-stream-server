import { Router, Response, Request, NextFunction } from 'express'
import WebTorrent, { Torrent, TorrentFile } from 'webtorrent'

const router = Router()
const client = new WebTorrent()

let state = {
  progress: 0,
  downloadSpeed: 0,
  ratio: 0
}

let error

client.on('error', (err: Error) => {
  console.error('erer', err.message)
  error = err.message
})

client.on('torrent', () => {
  console.log('progress =>', client.progress)
  state = {
    progress: Math.round(client.progress * 100 * 100) / 100,
    downloadSpeed: client.downloadSpeed,
    ratio: client.ratio
  }
})

router.get('/add/:magnet', (req: Request, res: Response) => {
  const magnet = req.params.magnet
  // const magnet = '0d64a077007a2cdd9663ee715f8f756e1e3ca1fc'

  console.log('magnet', magnet)

  client.add(magnet, (torrent) => {
    const files = torrent.files.map((data) => ({
      name: data.name,
      length: data.length
    }))

    console.log('files=>', files)

    res.status(200).send(files)
  })
})

router.get('/stats', (req: Request, res: Response) => {
  state = {
    progress: Math.round(client.progress * 100 * 100) / 100,
    downloadSpeed: client.downloadSpeed,
    ratio: client.ratio
  }
  res.status(200).send(state)
})

// stream
interface StreamRequest extends Request {
  params: {
    magnet: string
    fileName: string
  }
  headers: {
    range: string
  }
}

interface ErrorWithStatus extends Error {
  status: number
}

router.get('/:magnet/:fileName', (req: StreamRequest, res: Response, next: NextFunction) => {
  const {
    params: { magnet, fileName },
    headers: { range }
  } = req

  if (!range) {
    const error = new Error('Range is not defined, please make request from HTML5 Player') as ErrorWithStatus
    error.status = 416
    return next(error)
  }

  const torrentFile = client.get(magnet) as Torrent

  let file = <TorrentFile>{}

  for (let i = 0; i < torrentFile.files.length; i++) {
    const currentTorrentPriece = torrentFile.files[i]
    if (currentTorrentPriece.name === fileName) {
      file = currentTorrentPriece
    }
  }
  const fileSize = file.length
  const [startParsed, endParsed] = range.replace(/bytes=/, '').split('-')

  const start = Number(startParsed)
  const end = endParsed ? Number(endParsed) : fileSize - 1

  const chunkSize = end - start + 1

  const headers = {
    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunkSize,
    'Content-Type': 'video/mp4'
  }

  res.writeHead(206, headers)

  const streamPositions = {
    start,
    end
  }

  const stream = file.createReadStream(streamPositions)

  stream.pipe(res)

  stream.on('error', (err) => {
    return next(err)
  })
})

export default router
