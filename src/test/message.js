require('dotenv').config();
const app = require('../server.js');
const mongoose = require('mongoose');
const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;

const User = require('../models/user.js');
const Message = require('../models/message.js');

chai.config.includeStack = true;

const expect = chai.expect;
const should = chai.should();
chai.use(chaiHttp);

/**
 * root level hooks
 */
after((done) => {
    // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
    mongoose.models = {};
    mongoose.modelSchemas = {};
    mongoose.connection.close();
    done();
});

const USER_ID = 'XYZ';
const MSG_ID = 'ABC';
describe('Message API endpoints', () => {
    beforeEach((done) => {
        const user = new User({
            username: 'test',
            password: 'test123',
            _id: USER_ID,
        });
        user.save();

        const msg = new Message({
            title: 'Test',
            body: 'Test body',
            author: user,
            _id: MSG_ID,
        });
        msg.save();
        done();
    });

    afterEach((done) => {
        User.deleteOne({ _id: USER_ID });
        Message.deleteOne({ _id: MSG_ID });
        done();
    });

    it('should load all messages', (done) => {
        chai.request(app)
            .get('/messages')
            .end((err, res) => {
                if (err) done(err);
                expect(res).to.have.status(200);
                expect(res.body.msgs).to.be.an('array');
                done();
            });
    });

    it('should get one specific message', (done) => {
        chai.request(app)
            .get(`/messages/${MSG_ID}}`)
            .end((err, res) => {
                if (err) done(err);
                expect(res).to.have.status(200);
                expect(res.body).to.be.an('object');
                expect(res.body.title).to.equal('Test');
                expect(res.body.body).to.equal('Test body');
                done();
            });
    });

    it('should post a new message', (done) => {
        const user = new User({
            username: 'test',
            password: 'test123',
            _id: USER_ID,
        });
        user.save();

        chai.request(app)
            .post('/messages')
            .send({ title: 'Test', body: 'Test body', author: user })
            .end((err, res) => {
                if (err) done(err);
                expect(res).to.have.status(200);
                expect(res.body).to.be.an('object');
                expect(res.body.title).to.equal('Test');
                expect(res.body.body).to.equal('Test body');
                done();

                Message.findOne({ author: user }).then((msg) => {
                    expect(msg).to.be.an('object');
                    done();
                });
            });
    });

    it('should update a message', (done) => {
        chai.request(app)
            .put(`/messages/${MSG_ID}`)
            .send({ title: 'New title' })
            .end((err, res) => {
                if (err) done(err);
                expect(res).to.have.status(200);
                expect(res.body).to.be.an('object');
                expect(res.body.title).to.equal('New title');
                done();

                Message.findOne({ title: 'New title' }).then((msg) => {
                    expect(msg).to.be.an('object');
                    done();
                });
            });
    });

    it('should delete a message', (done) => {
        chai.request(app)
            .delete(`/messages/${MSG_ID}`)
            .end((err, res) => {
                if (err) done(err);
                expect(res.body.message).to.equal('Deleted message');
                done();

                Message.findOne({ title: 'Test' }).then((msg) => {
                    expect(msg).to.equal(null);
                    done();
                });
            });
    });
});
