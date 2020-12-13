const { Application } = require('../models')
const { analyzePersonalityWithNeedsAndValues } = require('../utils/ibm')
const { promises: fs } = require('fs')
const path = require('path')

const generateData = async () => {
  try {
    const applications = await Application.find({}).populate('for').populate('by')
    const filepath = path.resolve(path.join(__dirname, 'data.json'))
    const data = []

    for (const application of applications) {
      const applicationData = {
        id: application._id
      }
      // const { openness, conscientiousness, extraversion, agreeableness, neuroticism } = application.personality
      const personalityOutput = await analyzePersonalityWithNeedsAndValues(application.personality.wholeText)
      applicationData.personality = personalityOutput
      applicationData.personality.tone = application.tone
      applicationData.jobData = {
        role: application.for.role,
        skills: application.for.skills.join(';'),
        pay: application.for.pay,
        hiring: application.for.hiring,
        description: application.for.description
      }

      applicationData.userData = {
        location: application.by.resume.location,
        work: application.by.resume.work,
        education: application.by.resume.education,
        awards: application.by.resume.awards,
        skills: application.by.resume.skills,
        references: application.by.resume.references,
        hirable: application.by.hirable
      }

      data.push(applicationData)
    }
    await fs.appendFile(filepath, JSON.stringify(data, null, 2), { encoding: 'utf8' })
  } catch (err) {
    console.log(err)
  }
}

generateData()
