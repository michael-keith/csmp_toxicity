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
  let comments_arr = []
  data.children.forEach( (comment) => {
    if(comment.data.body) {comments_arr.push(comment.data.body)}
    if(comment.data.replies) { comments_arr = comments_arr.concat(getComments(comment.data.replies.data)) }
  })
  return comments_arr
}

function insert(comment, url) {
  let sql = "INSERT INTO comments(source, url, comment) VALUES(?,?,?)";
  let inserts = ["reddit", url, comment]
  sql = mysql.format(sql, inserts)

  return pool.query(sql)
}

(async function() {
  let url = "https://www.reddit.com/r/AskReddit/comments/bfq3cs/would_you_eat_a_30lb_cheese_wheel_within_a_week/.json?limit=1000"
  let json = await getJSON(url)
  let comments = getComments(json[1].data)

  comments.forEach( async(comment)=> {
    await insert(comment, url)
    console.log("ADDED")
  })

}())
