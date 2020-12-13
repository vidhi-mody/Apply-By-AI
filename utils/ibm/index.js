require('dotenv').config()
const { IamAuthenticator } = require('ibm-watson/auth')
const PersonalityInsightsV3 = require('ibm-watson/personality-insights/v3')
const ToneAnalyzerV3 = require('ibm-watson/tone-analyzer/v3')
const _ = require('underscore')

const personalityInsights = new PersonalityInsightsV3({
  authenticator: new IamAuthenticator({
    apikey: process.env.WATSON_PERSONALITY_KEY
  }),
  version: process.env.WATSON_PERSONALITY_VERSION,
  url: process.env.WATSON_PERSONALITY_URL
})

const toneAnalyzer = new ToneAnalyzerV3({
  authenticator: new IamAuthenticator({
    apikey: process.env.WATSON_TONE_KEY
  }),
  version: process.env.WATSON_TONE_VERSION,
  url: process.env.WATSON_TONE_URL
})

// eslint-disable-next-line no-unused-vars
const countWords = (doc) => {
  doc = doc.replace(/(^\s*)|(\s*$)/gi, '')
  doc = doc.replace(/[ ]{2,}/gi, ' ')
  doc = doc.replace(/\n /, '\n')
  return doc.split(' ').length
}

module.exports = {
  async analyzePersonality (text) {
    const personalityAnalysis = await personalityInsights.profile({
      content: text,
      contentType: 'text/plain',
      consumptionPreferences: true
    })
    const traits = personalityAnalysis.result.personality
    const output = {}
    for (const { name, percentile } of traits) {
      output[name.toLowerCase()] = percentile
    }
    return output
  },
  async analyzeTone (text) {
    const toneAnalysis = await toneAnalyzer.tone({
      toneInput: {
        text
      },
      contentType: 'text/plain'
    })
    // eslint-disable-next-line camelcase
    const { score, tone_id } = _.max(toneAnalysis.result.document_tone.tones, tone => tone.score)
    return {
      score,
      name: tone_id
    }
  },
  async analyzePersonalityWithNeedsAndValues (text) {
    const personalityAnalysis = await personalityInsights.profile({
      content: text,
      contentType: 'text/plain',
      consumptionPreferences: true
    })
    const { needs, personality: traits, values } = personalityAnalysis.result
    const output = {}
    for (const { name, percentile, children } of traits) {
      output[name.toLowerCase()] = {
        percentile,
        facets: _.map(children, (child) => {
          return _.pick(child, 'name', 'percentile')
        })
      }
    }
    for (const { name, percentile } of needs) {
      output[name.toLowerCase()] = percentile
    }
    for (const { name, percentile } of values) {
      output[name.toLowerCase()] = percentile
    }
    return output
  }
}
