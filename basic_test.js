global.fetch = require('node-fetch')
const toxicity = require('@tensorflow-models/toxicity')

// The minimum prediction confidence.
const threshold = 0.9;

// Which toxicity labels to return.
const labelsToInclude = ['identity_attack', 'insult', 'obscene', 'severe_toxicity', 'sexual_explicit', 'threat', 'toxicity']

const sample = "You are an idiot and your comment is stupid."

toxicity.load(threshold, labelsToInclude).then(model => {
  model.classify(sample).then(predictions => {
    console.log("Sample: " + sample)
    predictions.forEach( (p) => {
      let label = p.label
      let match = p.results[0].match ? "\x1b[31m True" : "\x1b[32m False"
      let prediction = p.results[0].probabilities[1]
      console.log(label + ": " + match + " \x1b[0m(" + prediction + ")")
    })
  })
})
