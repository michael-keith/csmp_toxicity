require('dotenv').config();
const fetch = require("node-fetch")

const util = require('util')

let mysql = require('mysql')
let pool  = mysql.createPool({
  connectionLimit : 100,
  host            : process.env.DB_HOST,
  user            : process.env.DB_USER,
  password        : process.env.DB_PASS,
  database        : process.env.DB_DATABASE,
})
pool.query = util.promisify(pool.query)

async function getJSON(url) {
  const response = await fetch(url)
  const json = response.json()
  return json
}

function getComments(data) {
  return data.payload.page.map( (d) => {
    return d.message
  })
}

function insert(comment, url) {
  let sql = "INSERT INTO comments(source, url, comment) VALUES(?,?,?)";
  let inserts = ["daily mail", url, comment]
  sql = mysql.format(sql, inserts)

  return pool.query(sql)
}

(async function() {
  let id = "6951599"
  let offset = 0
  let next_page = true

  while(next_page) {
  let url = "https://www.dailymail.co.uk/reader-comments/p/asset/readcomments/" + id + "?max=1000&order=desc&rcCache=shout&offset=" + offset
  let json = await getJSON(url)
  let comments = getComments(json)

  comments.forEach( async(comment)=> {
    await insert(comment, url)
    console.log("ADDED")
  })
  if(!json.payload.page) {next_page = false}
  else {offset += 1000}
  }

}())
