const client = require('../lib/client');
// import our seed data:
const books = require('./books.js');
const usersData = require('./users.js');
const { getEmoji } = require('../lib/emoji.js');

run();

async function run() {

  try {
    await client.connect();

    const users = await Promise.all(
      usersData.map(user => {
        return client.query(`
                      INSERT INTO users (name, email, hash)
                      VALUES ($1, $2, $3)
                      RETURNING *;
                  `,
        [user.name, user.email, user.hash]);
      })
    );
      
    const user = users[0].rows[0];

    await Promise.all(
      books.map(book => {
        return client.query(`
                    INSERT INTO books (title, author, cover, pages, owner_id)
                    VALUES ($1, $2, $3, $4, $5);
                `,
        [book.title, book.author, book.cover, book.pages, user.id]);
      })
    );
    

    console.log('seed data load complete', getEmoji(), getEmoji(), getEmoji());
  }
  catch(err) {
    console.log(err);
  }
  finally {
    client.end();
  }
    
}
