import { Router } from 'express'
// Fonte única do vocabulário — partilhada com o frontend.
import { GESTURE_LABELS, CATEGORY_LABELS, NUM_CLASSES } from '../../../src/ml/labels.js'

const router = Router()

router.get('/', (req, res) => {
  res.json({
    count: NUM_CLASSES,
    categories: CATEGORY_LABELS,
    gestures: GESTURE_LABELS,
  })
})

export default router
