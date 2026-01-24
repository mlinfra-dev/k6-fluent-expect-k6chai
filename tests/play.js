import chai, { expect } from '../build/index.cjs';
const assert = chai.assert;

export default function () {
  expect(4, 'res1.uid').is.a('number').equal(4, 'uid1');
  expect(5).is.a('number').equal(5, 'uid2');
  expect(6, 'res3.uid').is.a('number').equal(6);

  assert.equal(5, 5, 'uid');

  chai.expect(7).is.a('number').equal(7);
  chai.expect(8).is.a('number').equal(8, 'uid8');


  let a = ["one", "two", "three"];
  expect(a, "res.a").to.contain("two", "two.label");
}
