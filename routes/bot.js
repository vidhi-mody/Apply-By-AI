const router = require('express').Router()
const _ = require('underscore')
const { analyzeTone, analyzePersonality } = require('../utils/ibm')
const { Application, Job } = require('../models')

router.post('/:jobId/:userId', async (req, res, next) => {
  // const personality = analyzePersonality(req.body.text)
  const responseText = _.without(req.body.text, '', 'proceed', 'end interview', 'yes')
  const tone = await analyzeTone(responseText.join(' '))
  const personality = await analyzePersonality(responseText.join(' '))

  const application = new Application({
    createdOn: Date.now(),
    for: req.params.jobId,
    by: req.session.user._id,
    personality: {
      wholeText: responseText,
      openness: personality.openness,
      conscientiousness: personality.conscientiousness,
      extraversion: personality.extraversion,
      agreeableness: personality.agreeableness,
      neuroticism: personality['emotional range']
    },
    tone: {
      name: tone.name,
      score: tone.score
    }
  })

  await application.save()

  const job = await Job.findById(req.params.jobId).exec()
  job.applications.push(application._id)

  await job.save()

  return res.status(200).send({
    message: 'Application received'
  })
})

module.exports = router
