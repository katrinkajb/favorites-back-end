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
  });
});
