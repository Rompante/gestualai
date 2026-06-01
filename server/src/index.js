import { createApp } from './app.js'
import { config } from './config.js'

const app = createApp()

app.listen(config.port, () => {
  console.log(`[GestualAI API] a ouvir em http://localhost:${config.port}`)
})
