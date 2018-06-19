import {isValidRequest, pathname} from '../index';
import sinon from 'sinon';
import twilio from 'twilio';
const MockRequest= require('mock-express-request');
const MockResponse = require('mock-express-response');
const sandbox = sinon.createSandbox();
let req;
let res;

beforeEach(() => {
  req = new MockRequest();
  res = new MockResponse();
  process.env.NODE_ENV = 'production';
});

afterEach(function () {
  sandbox.restore();
  delete process.env.NODE_ENV;
});

test('isValidRequest returns true when Twilio validates the request', () => {
  // arrange
  sandbox.replace(twilio, 'validateExpressRequest', sinon.fake.returns(true));

  // act
  const isValid = isValidRequest(req, res, pathname);

  // assert
  expect(isValid).toBe(true);
});

test('isValidRequest returns false when Twilio does not validate the request', () => {
  // arrange
  sandbox.replace(twilio, 'validateExpressRequest', sinon.fake.returns(false));

  // act
  const isValid = isValidRequest(req, res, pathname);

  // assert
  expect(isValid).toBe(false);
});

test('isValidRequest sets response when Twilio does not validate the request', () => {
  // arrange
  sandbox.replace(twilio, 'validateExpressRequest', sinon.fake.returns(false));

  // act
  const isValid = isValidRequest(req, res, pathname);

  // TODO check that send() was called with 'Twilio Request Validation Failed.'
  // assert
  expect(res.statusCode).toBe(403);
});
