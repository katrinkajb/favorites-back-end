require('dotenv').config();

const { execSync } = require('child_process');

const fakeRequest = require('supertest');
const app = require('../lib/app');
const client = require('../lib/client');

describe('app routes', () => {
  describe('routes', () => {
    let token;
  
    beforeAll(async done => {
      execSync('npm run setup-db');
  
      client.connect();
  
      const signInData = await fakeRequest(app)
        .post('/auth/signup')
        .send({
          name: 'Bob Loblaw',
          email: 'bob@loblawblog.com',
          password: '1234'
        });
      
      token = signInData.body.token; // eslint-disable-line
  
      return done();
    });
  
    afterAll(done => {
      return client.end(done);
    });

    test('returns books in search result for Snow Crash', async() => {
      jest.setTimeout(10000);

      const data = await fakeRequest(app)
        .get('/books?search=Snow+Crash')
        .expect('Content-Type', /json/)
        .expect(200);
        
      expect(data.body.docs[0].title).toEqual('Snow Crash');
    });

    test.skip('Adds a favorite for user 2', async() => {
      jest.setTimeout(10000);

      const newFave = {
        'title': 'Diamond Age',
        'author': 'Neal Stephenson',
        'setting': 'American future',
        'time_period': 'future',
        'key': 'HJ85F',
        'owner_id': 2
      };

      const dbFave = {
        ...newFave,
        'id': 1
      };

      const data = await fakeRequest(app)
        .post('/api/favorites')
        .send(newFave)
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(200);
        
      expect(data.body).toEqual(dbFave);
    });

    test.skip('returns favorites for a user', async() => {
      jest.setTimeout(10000);

      const userFave = {
        'id': 1,
        'title': 'Diamond Age',
        'author': 'Neal Stephenson',
        'setting': 'American future',
        'time_period': 'future',
        'key': 'HJ85F',
        'owner_id': 2
      };

      const data = await fakeRequest(app)
        .get('/api/favorites')
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(200);
        
      expect(data.body).toEqual(userFave);
    });

    test.skip('deletes a book from favorites', async() => {
      jest.setTimeout(10000);

      const deleteBook = {
        'id': 1,
        'title': 'Diamond Age',
        'author': 'Neal Stephenson',
        'setting': 'American future',
        'time_period': 'future',
        'key': 'HJ85F',
        'owner_id': 2
      };

      const data = await fakeRequest(app)
        .delete('/api/favorites/1')
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(200);
        
      expect(data.body).toEqual(deleteBook);
    });

  });
});
