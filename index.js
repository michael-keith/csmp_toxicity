require('dotenv').config()
global.fetch = require('node-fetch')

const toxicity = require('@tensorflow-models/toxicity')
const util = require('util')

const mysql = require('mysql');
const pool  = mysql.createPool({
  connectionLimit : 100,
  host            : process.env.DB_HOST,
  user            : process.env.DB_USER,
  password        : process.env.DB_PASS,
  database        : process.env.DB_DATABASE,
})
pool.query = util.promisify(pool.query)

const threshold = 0.9;
const labelsToInclude = ['identity_attack', 'insult', 'obscene', 'severe_toxicity', 'sexual_explicit', 'threat', 'toxicity']

async function getComments() {
  return await pool.query("SELECT id, comment FROM comments")
}

async function updateComment(comment, results) {
    let sql = "UPDATE comments SET identity_attack = ?, insult = ?, obscene = ?, severe_toxicity = ?, sexual_explicit = ?, threat = ?, toxicity =? WHERE id = ?"
    let inserts = [
      results.identity_attack,
      results.insult,
      results.obscene,
      results.severe_toxicity,
      results.sexual_explicit,
      results.threat,
      results.toxicity,
      comment.id
    ]
    sql = mysql.format(sql, inserts)
    return pool.query(sql)
}

async function classify(model, inputs) {
  return await model.classify(inputs)
}

async function predict(model, comment) {
  const predictions = await classify(model, [comment.comment])

  const obj = {}
  predictions.forEach( (p) => {
    obj[p.label] = Number(p.results[0].probabilities[1]).toFixed(20)
  })
  return obj
}

(async function() {
  const model = await toxicity.load(threshold, labelsToInclude)
  let comments = await getComments()
  for(comment of comments) {
    console.log(comment.comment)
    results = await predict(model, comment)
    await updateComment(comment, results)
  }
}())
