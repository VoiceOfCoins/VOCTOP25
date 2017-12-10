const assertRevert = require('./helpers/assertRevert');

var VOCTOP25 = artifacts.require('../contracts/VOCTOP25.sol');
var OWNED = artifacts.require('../contracts/VOCTOP25.sol');

contract('OWNED', function (accounts) {
  let token;
  beforeEach(async function () {
    token = await OWNED.new(accounts[0]);
  });

  it('owner():should have an owner', async function () {
    let owner = await token.owner();
    assert.isTrue(owner !== 0);
  });

  it('transferOwnership(_newOwner):changes owner after transfer ownership', async function () {
    let other = accounts[1];
    await token.transferOwnership(other);
    let owner = await token.owner();

    assert.isTrue(owner === other);
  });

  it('transferOwnership(_newOwner):should prevent non-owners from transfering ownership', async function () {
    const other = accounts[2];
    const owner = await token.owner.call();
    assert.isTrue(owner !== other);
    try {
      await token.transferOwnership(other, { from: other });
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('transferOwnership(_newOwner):should guard ownership against stuck state', async function () {
    let originalOwner = await token.owner();
    try {
      await token.transferOwnership(null, { from: originalOwner });
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });
});

contract('VOCTOP25', function (accounts) {
  let token;
  beforeEach(async function () {
    token = await VOCTOP25.new(accounts[0]);
  });

  it('owner():should have an owner', async function () {
    let owner = await token.owner();
    assert.isTrue(owner !== 0);
  });

  it('transferOwnership(_newOwner):changes owner after transfer ownership', async function () {
    let other = accounts[1];
    await token.transferOwnership(other);
    let owner = await token.owner();

    assert.isTrue(owner === other);
  });

  it('transferOwnership(_newOwner):should prevent non-owners from transfering ownership', async function () {
    const other = accounts[2];
    const owner = await token.owner.call();
    assert.isTrue(owner !== other);
    try {
      await token.transferOwnership(other, { from: other });
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('transferOwnership(_newOwner):should guard ownership against stuck state', async function () {
    let originalOwner = await token.owner();
    try {
      await token.transferOwnership(null, { from: originalOwner });
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('name():has a name', async function () {
    const name = await token.name();
    assert.equal(name, 'Voice Of Coins TOP 25 Index Fund');
  });

  it('symbol():has a symbol', async function () {
    const symbol = await token.symbol();
    assert.equal(symbol, 'VOC25');
  });

  it('decimals(): has an amount of decimals', async function () {
    const decimals = await token.decimals();
    assert.equal(decimals, 18);
  });

  it('totalSupply():should return the totalSupply = 0 after construction', async function () {
    let totalSupply = await token.totalSupply();
    assert.equal(totalSupply, 0);
  });

  it('balanceOf(_tokenHolder):should return the correct values', async function () {
    let balanceOf1 = await token.balanceOf(accounts[0]);
    
    assert.equal(balanceOf1, 0);
    
    await token.mintToken(100);
    let balanceOf2 = await token.balanceOf(accounts[0]);
    
    assert.equal(balanceOf2, 100);
  });

  it('mintToken(_mintedAmount):only owner can mintToken', async function () {
    const other = accounts[2];
    try {
      await token.mintToken(100, { from: other });
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('mintToken(_mintedAmount):should return correct balances after Mint:totalSupply, balanceOf', async function () {
    const result = await token.mintToken(100);
    assert.equal(result.logs[0].event, 'Mint');
    assert.equal(result.logs[0].args._to.valueOf(), accounts[0]);
    assert.equal(result.logs[0].args._value.valueOf(), 100);
    assert.equal(result.logs[1].event, 'Transfer');
    assert.equal(result.logs[1].args._from.valueOf(), 0x0);

    let accountBalance = await token.balanceOf(accounts[0]);
    assert.equal(accountBalance, 100);

    let totalSupply = await token.totalSupply();
    assert.equal(totalSupply, 100);
  });

  it('mintToken(_mintedAmount):should not Mint if owner account is frozen', async function () {
    await token.freezeAccount(accounts[0], true);

    try {
      await token.mintToken(100);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('burn(_value):only owner can burn', async function () {
    const other = accounts[2];
    await token.mintToken(100);
    try {
      await token.burn(100, { from: other });
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('burn(_value):cannot burn more tokens than your balance', async function () {
    await token.mintToken(100);
    try {
      await token.burn(101, { from: accounts[0] });
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('burn(_value):should return correct balances after burn:totalSupply, balanceOf', async function () {
    await token.mintToken(100);
    const result = await token.burn(80);
    assert.equal(result.logs[0].event, 'Burn');
    assert.equal(result.logs[0].args._from.valueOf(), accounts[0]);
    assert.equal(result.logs[0].args._value.valueOf(), 80);

    let accountBalance = await token.balanceOf(accounts[0]);
    assert.equal(accountBalance, 20);

    let totalSupply = await token.totalSupply();
    assert.equal(totalSupply, 20);
  });

  it('burn(_value):should return correct balances after burn total amount:totalSupply, balanceOf', async function () {
    await token.mintToken(100);
    const result = await token.burn(100);
    assert.equal(result.logs[0].event, 'Burn');
    assert.equal(result.logs[0].args._from.valueOf(), accounts[0]);
    assert.equal(result.logs[0].args._value.valueOf(), 100);
    
    let accountBalance = await token.balanceOf(accounts[0]);
    assert.equal(accountBalance, 0);

    let totalSupply = await token.totalSupply();
    assert.equal(totalSupply, 0);
  });

  it('burn(_value):should not burn more than a balance of account', async function () {
    await token.mintToken(100);

    try {
      await token.burn(101);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('burn(_value):should not burn if owner account is frozen', async function () {
    await token.mintToken(100);
    await token.freezeAccount(accounts[0], true);

    try {
      await token.burn(80);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('burnFrom(_from, _value):only owner can burnFrom', async function () {
    const other = accounts[2];
    await token.mintToken(100);
    await token.transfer(accounts[1], 100);

    try {
      await token.burnFrom(accounts[1], 100, { from: other });
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('burnFrom(_from, _value):cannot burn more tokens than account balance', async function () {
    await token.mintToken(100);
    await token.transfer(accounts[1], 100);

    try {
      await token.burnFrom(accounts[1], 101);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('burnFrom(_from, _value):should return correct balances after burnFrom:totalSupply, balanceOf', async function () {
    await token.mintToken(100);
    await token.transfer(accounts[1], 100);

    const result = await token.burnFrom(accounts[1], 80);
    assert.equal(result.logs[0].event, 'Transfer');
    assert.equal(result.logs[0].args._from.valueOf(), accounts[1]);
    assert.equal(result.logs[0].args._to.valueOf(), accounts[0]);
    assert.equal(result.logs[0].args._value.valueOf(), 80);
    assert.equal(result.logs[1].event, 'Burn');
    assert.equal(result.logs[1].args._from.valueOf(), accounts[0]);
    assert.equal(result.logs[1].args._value.valueOf(), 80);

    let accountBalance = await token.balanceOf(accounts[1]);
    assert.equal(accountBalance, 20);

    let accountOwnerBalance = await token.balanceOf(accounts[0]);
    assert.equal(accountOwnerBalance, 0);

    let totalSupply = await token.totalSupply();
    assert.equal(totalSupply, 20);
  });

  it('burnFrom(_from, _value):should return correct balances after burnFrom total amount', async function () {
    await token.mintToken(100);
    await token.transfer(accounts[1], 100);

    const result = await token.burnFrom(accounts[1], 100);
    assert.equal(result.logs[0].event, 'Transfer');
    assert.equal(result.logs[0].args._from.valueOf(), accounts[1]);
    assert.equal(result.logs[0].args._to.valueOf(), accounts[0]);
    assert.equal(result.logs[0].args._value.valueOf(), 100);
    assert.equal(result.logs[1].event, 'Burn');
    assert.equal(result.logs[1].args._from.valueOf(), accounts[0]);
    assert.equal(result.logs[1].args._value.valueOf(), 100);

    let accountBalance = await token.balanceOf(accounts[1]);
    assert.equal(accountBalance, 0);

    let accountOwnerBalance = await token.balanceOf(accounts[0]);
    assert.equal(accountOwnerBalance, 0);

    let totalSupply = await token.totalSupply();
    assert.equal(totalSupply, 0);
  });

  it('burnFrom(_from, _value):should not burn more than a balance of account', async function () {
    await token.mintToken(100);
    await token.transfer(accounts[1], 100);

    try {
      await token.burnFrom(accounts[1], 101);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('burnFrom(_from, _value):should not burnFrom if owner account is frozen', async function () {
    await token.mintToken(100);
    await token.transfer(accounts[1], 100);
    await token.freezeAccount(accounts[0], true);

    try {
      await token.burnFrom(accounts[1], 80);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('burnFrom(_from, _value):should burn from account that is frozen:totalSupply, balanceOf', async function () {
    await token.mintToken(100);
    await token.transfer(accounts[1], 100);
    await token.freezeAccount(accounts[1], true);

    const result = await token.burnFrom(accounts[1], 80);
    assert.equal(result.logs[0].event, 'AccountFrozen');
    assert.equal(result.logs[0].args._account.valueOf(), accounts[1]);
    assert.equal(result.logs[0].args._value.valueOf(), false);
    assert.equal(result.logs[1].event, 'Transfer');
    assert.equal(result.logs[1].args._from.valueOf(), accounts[1]);
    assert.equal(result.logs[1].args._to.valueOf(), accounts[0]);
    assert.equal(result.logs[1].args._value.valueOf(), 80);
    assert.equal(result.logs[2].event, 'AccountFrozen');
    assert.equal(result.logs[2].args._account.valueOf(), accounts[1]);
    assert.equal(result.logs[2].args._value.valueOf(), true);
    assert.equal(result.logs[3].event, 'Burn');
    assert.equal(result.logs[3].args._from.valueOf(), accounts[0]);
    assert.equal(result.logs[3].args._value.valueOf(), 80);

    let accountBalance = await token.balanceOf(accounts[1]);
    assert.equal(accountBalance, 20);

    let accountOwnerBalance = await token.balanceOf(accounts[0]);
    assert.equal(accountOwnerBalance, 0);

    let totalSupply = await token.totalSupply();
    assert.equal(totalSupply, 20);
  });

  it('transfer( _to, _value):should return correct balances after transfer', async function () {
    await token.mintToken(100);

    const result = await token.transfer(accounts[1], 75);

    assert.equal(result.logs[0].event, 'Transfer');
    assert.equal(result.logs[0].args._from.valueOf(), accounts[0]);
    assert.equal(result.logs[0].args._to.valueOf(), accounts[1]);
    assert.equal(result.logs[0].args._value.valueOf(), 75);

    let firstAccountBalance = await token.balanceOf(accounts[0]);
    assert.equal(firstAccountBalance, 25);

    let secondAccountBalance = await token.balanceOf(accounts[1]);
    assert.equal(secondAccountBalance, 75);

    let totalSupply = await token.totalSupply();
    assert.equal(totalSupply, 100);
  });

  it('transfer( _to, _value):should return correct balances after transfer all', async function () {
    await token.mintToken(100);

    const result = await token.transfer(accounts[1], 100);

    assert.equal(result.logs[0].event, 'Transfer');
    assert.equal(result.logs[0].args._from.valueOf(), accounts[0]);
    assert.equal(result.logs[0].args._to.valueOf(), accounts[1]);
    assert.equal(result.logs[0].args._value.valueOf(), 100);

    let firstAccountBalance = await token.balanceOf(accounts[0]);
    assert.equal(firstAccountBalance, 0);

    let secondAccountBalance = await token.balanceOf(accounts[1]);
    assert.equal(secondAccountBalance, 100);

    let totalSupply = await token.totalSupply();
    assert.equal(totalSupply, 100);
  });

  it('transfer( _to, _value):should throw an error when trying to transfer more than balance', async function () {
    await token.mintToken(100);

    try {
      await token.transfer(accounts[1], 101);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('transfer( _to, _value):should throw an error when trying to transfer from frozen account', async function () {
    await token.mintToken(100);
    await token.freezeAccount(accounts[0], true);

    try {
      await token.transfer(accounts[1], 60);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('transfer( _to, _value):should throw an error when trying to transfer to frozen account', async function () {
    await token.mintToken(100);
    await token.freezeAccount(accounts[1], true);

    try {
      await token.transfer(accounts[1], 60);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('transfer( _to, _value):should throw an error when trying to transfer to 0x0', async function () {
    await token.mintToken(100);

    try {
      await token.transfer(0x0, 100);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('transferFrom(_from, _to, _value):should return correct balances after transfer', async function () {
    const other = accounts[1];

    await token.mintToken(100);
    await token.approve(accounts[1], 90);

    const result = await token.transferFrom(accounts[0], accounts[2], 75, { from: other });

    assert.equal(result.logs[0].event, 'Transfer');
    assert.equal(result.logs[0].args._from.valueOf(), accounts[0]);
    assert.equal(result.logs[0].args._to.valueOf(), accounts[2]);
    assert.equal(result.logs[0].args._value.valueOf(), 75);

    let firstAccountBalance = await token.balanceOf(accounts[0]);
    assert.equal(firstAccountBalance, 25);

    let secondAccountBalance = await token.balanceOf(accounts[2]);
    assert.equal(secondAccountBalance, 75);

    let totalSupply = await token.totalSupply();
    assert.equal(totalSupply, 100);

    let allowanceLeft = await token.allowance(accounts[0], accounts[1]);
    assert.equal(allowanceLeft, 15);
  });

  it('transferFrom(_from, _to, _value):should return correct balances after transfer all', async function () {
    const other = accounts[1];

    await token.mintToken(100);
    await token.approve(accounts[1], 100);

    const result = await token.transferFrom(accounts[0], accounts[2], 100, { from: other });
    assert.equal(result.logs[0].event, 'Transfer');
    assert.equal(result.logs[0].args._from.valueOf(), accounts[0]);
    assert.equal(result.logs[0].args._to.valueOf(), accounts[2]);
    assert.equal(result.logs[0].args._value.valueOf(), 100);

    let firstAccountBalance = await token.balanceOf(accounts[0]);
    assert.equal(firstAccountBalance, 0);

    let secondAccountBalance = await token.balanceOf(accounts[2]);
    assert.equal(secondAccountBalance, 100);

    let totalSupply = await token.totalSupply();
    assert.equal(totalSupply, 100);
  });

  it('transferFrom(_from, _to, _value):should throw when trying to transfer more than balance', async function () {
    const other = accounts[1];

    await token.mintToken(100);
    await token.approve(accounts[1], 100);

    try {
      await token.transferFrom(accounts[0], accounts[2], 101, { from: other });
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('transferFrom(_from, _to, _value):should throw when trying to transfer more than allowed', async function () {
    const other = accounts[1];

    await token.mintToken(100);
    await token.approve(accounts[1], 10);

    try {
      await token.transferFrom(accounts[0], accounts[2], 11, { from: other });
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('transferFrom(_from, _to, _value):should throw when trying to transfer without allowance', async function () {
    const other = accounts[1];

    await token.mintToken(100);

    try {
      await token.transferFrom(accounts[0], accounts[2], 11, { from: other });
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('transferFrom(_from, _to, _value):should throw when transfer from frozen account', async function () {
    const other = accounts[1];

    await token.mintToken(100);
    await token.approve(accounts[1], 100);
    await token.freezeAccount(accounts[0], true);

    try {
      await token.transferFrom(accounts[0], accounts[2], 60, { from: other });
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('transferFrom(_from, _to, _value):should throw when transfer to frozen account', async function () {
    const other = accounts[1];

    await token.mintToken(100);
    await token.approve(accounts[1], 100);
    await token.freezeAccount(accounts[2], true);

    try {
      await token.transferFrom(accounts[0], accounts[2], 60, { from: other });
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('transferFrom(_from, _to, _value):should throw an error when trying to transfer to 0x0', async function () {
    const other = accounts[1];

    await token.mintToken(100);
    await token.approve(accounts[1], 100);

    try {
      await token.transferFrom(accounts[0], 0x0, 50, { from: other });
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('allowance(_owner, _spender):should return correct allowance', async function () {
    let accountAllowanceBefore = await token.allowance(accounts[0], accounts[1]);
    assert.equal(accountAllowanceBefore, 0);

    await token.approve(accounts[1], 100);

    let accountAllowanceAfter = await token.allowance(accounts[0], accounts[1]);
    assert.equal(accountAllowanceAfter, 100);
  });

  it('increaseApproval(_spender, _addedValue):should return correctly change allowance', async function () {
    let accountAllowanceBefore = await token.allowance(accounts[0], accounts[1]);
    assert.equal(accountAllowanceBefore, 0);

    const result1 = await token.increaseApproval(accounts[1], 100);
    assert.equal(result1.logs[0].event, 'Approval');
    assert.equal(result1.logs[0].args._owner.valueOf(), accounts[0]);
    assert.equal(result1.logs[0].args._spender.valueOf(), accounts[1]);
    assert.equal(result1.logs[0].args._value.valueOf(), 100);

    let accountAllowanceAfter = await token.allowance(accounts[0], accounts[1]);
    assert.equal(accountAllowanceAfter, 100);
  });

  it('decreaseApproval(_spender, _subtractedValue):should return correctly change allowance', async function () {
    await token.approve(accounts[1], 100);

    let accountAllowanceBefore = await token.allowance(accounts[0], accounts[1]);
    assert.equal(accountAllowanceBefore, 100);

    const result1 = await token.decreaseApproval(accounts[1], 50);
    assert.equal(result1.logs[0].event, 'Approval');
    assert.equal(result1.logs[0].args._owner.valueOf(), accounts[0]);
    assert.equal(result1.logs[0].args._spender.valueOf(), accounts[1]);
    assert.equal(result1.logs[0].args._value.valueOf(), 50);

    let accountAllowanceAfter1 = await token.allowance(accounts[0], accounts[1]);
    assert.equal(accountAllowanceAfter1, 50);

    const result2 = await token.decreaseApproval(accounts[1], 40);
    assert.equal(result2.logs[0].event, 'Approval');
    assert.equal(result2.logs[0].args._owner.valueOf(), accounts[0]);
    assert.equal(result2.logs[0].args._spender.valueOf(), accounts[1]);
    assert.equal(result2.logs[0].args._value.valueOf(), 10);

    let accountAllowanceAfter2 = await token.allowance(accounts[0], accounts[1]);
    assert.equal(accountAllowanceAfter2, 10);

    const result3 = await token.decreaseApproval(accounts[1], 30);
    assert.equal(result3.logs[0].event, 'Approval');
    assert.equal(result3.logs[0].args._owner.valueOf(), accounts[0]);
    assert.equal(result3.logs[0].args._spender.valueOf(), accounts[1]);
    assert.equal(result3.logs[0].args._value.valueOf(), 0);

    let accountAllowanceAfter3 = await token.allowance(accounts[0], accounts[1]);
    assert.equal(accountAllowanceAfter3, 0);
  });

  it('approve(_spender, _value):should return correct values', async function () {
    let accountAllowanceBefore = await token.allowance(accounts[0], accounts[1]);
    assert.equal(accountAllowanceBefore, 0);

    const result1 = await token.approve(accounts[1], 100);
    assert.equal(result1.logs[0].event, 'Approval');
    assert.equal(result1.logs[0].args._owner.valueOf(), accounts[0]);
    assert.equal(result1.logs[0].args._spender.valueOf(), accounts[1]);
    assert.equal(result1.logs[0].args._value.valueOf(), 100);

    let accountAllowanceAfter1 = await token.allowance(accounts[0], accounts[1]);
    assert.equal(accountAllowanceAfter1, 100);

    const result2 = await token.approve(accounts[1], 40);
    assert.equal(result2.logs[0].event, 'Approval');
    assert.equal(result2.logs[0].args._owner.valueOf(), accounts[0]);
    assert.equal(result2.logs[0].args._spender.valueOf(), accounts[1]);
    assert.equal(result2.logs[0].args._value.valueOf(), 40);

    let accountAllowanceAfter2 = await token.allowance(accounts[0], accounts[1]);
    assert.equal(accountAllowanceAfter2, 40);

    const result3 = await token.approve(accounts[1], 0);
    assert.equal(result3.logs[0].event, 'Approval');
    assert.equal(result3.logs[0].args._owner.valueOf(), accounts[0]);
    assert.equal(result3.logs[0].args._spender.valueOf(), accounts[1]);
    assert.equal(result3.logs[0].args._value.valueOf(), 0);

    let accountAllowanceAfter3 = await token.allowance(accounts[0], accounts[1]);
    assert.equal(accountAllowanceAfter3, 0);
  });

  it('freezeAccount(_target, _freeze):should freeze account correctly', async function () {
    let isAccountFrozen1 = await token.frozenAccount(accounts[1]);
    assert.equal(isAccountFrozen1, false);

    const result2 = await token.freezeAccount(accounts[1], true);
    assert.equal(result2.logs[0].event, 'AccountFrozen');
    assert.equal(result2.logs[0].args._account.valueOf(), accounts[1]);
    assert.equal(result2.logs[0].args._value.valueOf(), true);
    let isAccountFrozen2 = await token.frozenAccount(accounts[1]);
    assert.equal(isAccountFrozen2, true);

    const result3 = await token.freezeAccount(accounts[0], false);
    assert.equal(result3.logs[0].event, 'AccountFrozen');
    assert.equal(result3.logs[0].args._account.valueOf(), accounts[0]);
    assert.equal(result3.logs[0].args._value.valueOf(), false);
    let isAccountFrozen3 = await token.frozenAccount(accounts[1]);
    assert.equal(isAccountFrozen3, true);

    const result4 = await token.freezeAccount(accounts[1], false);
    assert.equal(result4.logs[0].event, 'AccountFrozen');
    assert.equal(result4.logs[0].args._account.valueOf(), accounts[1]);
    assert.equal(result4.logs[0].args._value.valueOf(), false);
    let isAccountFrozen4 = await token.frozenAccount(accounts[1]);
    assert.equal(isAccountFrozen4, false);
  });

  it('freezeAccount(_target, _freeze):only owner can freeze', async function () {
    const other = accounts[1];

    try {
      await token.freezeAccount(accounts[2], true, { from: other });
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });
});
