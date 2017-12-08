pragma solidity ^0.4.18;

//https://github.com/VoiceOfCoins/VOCTOP25


contract owned {
    
    address internal _owner;
    
    /**
     * Constrctor function
     *
     * Initializes contract with owner
     */
    function owned() public {
        
        _owner = msg.sender;
        
    }
    
    function owner() public view returns (address) {
        
        return _owner;
        
    }
    
    modifier onlyOwner {
        
        require(msg.sender == _owner);
        _;
        
    }
    
    function transferOwnership(address _newOwner) onlyOwner public {
        
        require(_newOwner != address(0));
        _owner = _newOwner;
        
    }
}


contract VOCTOP25 is owned {
    
    // Internal variables of the token
    string  internal _name;
    string  internal _symbol;
    uint8   internal _decimals;
    uint256 internal _totalSupply;
    
    // This creates an array with all balances
    mapping (address => uint256)  internal _balanceOf;
    mapping (address => mapping (address => uint256)) internal _allowance;
    mapping (address => bool) internal _frozenAccount;
    
    // This generates a public event on the blockchain that will notify clients
    event Transfer(address indexed _from, address indexed _to, uint _value);
    // This notifies clients about the amount burnt
    event Burn(address indexed _from, uint256 _value);
    // This notifies clients frozen accounts
    event FrozenFunds(address indexed _target, bool _frozen);
    // This notifies clients about approval for other address
    event Approval(address indexed _owner, address indexed _spender, uint _value);
       
    /**
     * Constrctor function
     *
     * Initializes contract with initial supply tokens to the creator of the contract
     */
    function VOCTOP25() public {
        
        //Set decimals
        _decimals = 18;
        
        // Update total supply with the decimal amount
        _totalSupply = 0 * 10 ** uint256(_decimals);
        
        // Give the creator all initial tokens
        _balanceOf[msg.sender] = _totalSupply;
        
        // Set the name for display purposes
        _name = "Voice Of Coins TOP 25 Index Fund";   
        
        // Set the symbol for display purposes
        _symbol = "VOC25";   
        
    }
    
    
    /**
     * Internal transfer, only can be called by this contract
     */
    function _transfer(address _from, address _to, uint256 _value) internal returns (bool success) {
        
        // Prevent transfer to 0x0 address. Use burn() instead
        require(_to != 0x0);
        
        //Check if FrozenFunds
        require(!_frozenAccount[_from]);
        
        // Check if the sender has enough
        require(_balanceOf[_from] >= _value);
        
        // Check for overflows
        require(_balanceOf[_to] + _value >= _balanceOf[_to]);
        
        // Subtract from the sender
        _balanceOf[_from] -= _value;
        
        // Add the same to the recipient
        _balanceOf[_to] += _value;
        
		//Notify Listeners
        Transfer(_from, _to, _value);    
		
        return true;
        
    }
    
    /**
     * Returns token's name
     *
     */
    function name() public view returns (string) {
        
        return _name;
        
    }
    
    /**
     * Returns token's symbol
     *
     */
    function symbol() public view returns (string) {
        
        return _symbol;
        
    }
    
    /**
     * Returns token's decimals
     *
     */
    function decimals() public view returns (uint8) {
        
        return _decimals;
        
    }
    
    /**
     * Returns token's total supply
     *
     */
    function totalSupply() public view returns (uint256) {
        
        return _totalSupply;
        
    }
    
    /**
     * Returns balance of the give address
     * @param _tokenHolder Tokens holder address
     */
    function balanceOf(address _tokenHolder) public view returns (uint256) {
        
        return _balanceOf[_tokenHolder];
        
    }
    
    
    /**
     * Transfer tokens
     *
     * Send `_value` tokens to `_to` from your account
     *
     * @param _to The address of the recipient
     * @param _value the amount to send
     */
    function transfer(address _to, uint256 _value) public returns (bool success) {
        
		// Do actual transfer
        _transfer(msg.sender, _to, _value);  
		
        return true;
        
    }
    
    /**
     * Transfer tokens from other address
     *
     * Send `_value` tokens to `_to` in behalf of `_from`
     *
     * @param _from The address of the sender
     * @param _to The address of the recipient
     * @param _value the amount to send
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        
        // Check allowance if transfer not from own
        if (msg.sender != _from) {
            require(_allowance[_from][msg.sender] >= _value);     
            _allowance[_from][msg.sender] -= _value;
        }
        
		// Do actual transfer
        _transfer(_from, _to, _value); 
		
        return true;
    }
    
    /**
     * Set allowance for other address
     *
     * Allows `_spender` to spend no more than `_value` tokens in your behalf
     *  
     * Beware that changing an allowance with this method brings the risk that someone may use both the old
     * and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this
     * race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * @param _spender The address authorized to spend
     * @param _value the max amount they can spend
     */
    function approve(address _spender, uint256 _value) public returns (bool success) {
        
		//set value 
        _allowance[msg.sender][_spender] = _value;
		
		//Notify Listeners
        Approval(msg.sender, _spender, _value);
		
        return true;
        
    }
    
    /**
     * Returns allowance for the given owner and spender
     * @param _tokenOwner Tokens owner address
     * @param _spender Spender address
     */
    function allowance(address _tokenOwner, address _spender) public view returns (uint256) {
        
        return _allowance[_tokenOwner][_spender];
        
    }
    
    /**
   * approve should be called when allowed[_spender] == 0. To increment
   * allowed value is better to use this function to avoid 2 calls (and wait until
   * the first transaction is mined)
   * From MonolithDAO Token.sol
   */
    function increaseApproval(address _spender, uint256 _addedValue) public returns (bool) {
      
		//check overflow
        require(_allowance[msg.sender][_spender] + _addedValue >= _allowance[msg.sender][_spender]);
		
		//upate value
        _allowance[msg.sender][_spender] += _addedValue;
		
		//Notify Listeners
        Approval(msg.sender, _spender, _allowance[msg.sender][_spender]);
		
        return true;
    }

    function decreaseApproval(address _spender, uint256 _subtractedValue) public returns (bool) {
    
		//check if subtractedValue greater than available, if so set to zero
		//otherwise decrease by subtractedValue
        if (_subtractedValue > _allowance[msg.sender][_spender]) {
			
            _allowance[msg.sender][_spender] = 0;
			
        } else {
			
            _allowance[msg.sender][_spender] -= _subtractedValue;
			
        }
		
		//Notify Listeners
        Approval(msg.sender, _spender, _allowance[msg.sender][_spender]);
		
        return true;
    }
    

    /**
     * @notice Destroy tokens from owener account, can be run only by owner
     *
     * Remove `_value` tokens from the system irreversibly
     *
     * @param _value the amount of money to burn
     */
    function burn(uint256 _value) onlyOwner public returns (bool success) {
        
        // Check if the targeted balance is enough
        require(_balanceOf[_owner] >= _value);
        
        // Subtract from the targeted balance and total supply
        _balanceOf[_owner] -= _value;
        _totalSupply -= _value;
        
		//Notify Listeners
        Burn(_owner, _value);
        
        return true;
        
    }
    
    /**
     * @notice Destroy tokens from other account, can be run only by owner
     *
     * Remove `_value` tokens from the system irreversibly on behalf of `_from`.
     *
     * @param _from the address of the sender
     * @param _value the amount of money to burn
     */
    function burnFrom(address _from, uint256 _value) onlyOwner public returns (bool success) {
        
        // Save frozen state
        bool bAccountFrozen = frozenAccount(_from);
        
        //Unfreeze account if was frozen
        if (bAccountFrozen) {
            //Allow transfers
            freezeAccount(_from,false);
        }
        
        // Transfer to owners account
        _transfer(_from, _owner, _value);
        
        //Freeze again if was frozen before
        if (bAccountFrozen) {
            freezeAccount(_from,bAccountFrozen);
        }
        
        // Burn from owners account
        burn(_value);
        
        return true;
        
    }
    
    /**
    * @notice Create `mintedAmount` tokens and send it to `owner`, can be run only by owner
    * @param mintedAmount the amount of tokens it will receive
    */
    function mintToken(uint256 mintedAmount) onlyOwner public {
        
        // Check for overflows
        require(_balanceOf[_owner] + mintedAmount >= _balanceOf[_owner]);
        
        // Check for overflows
        require(_totalSupply + mintedAmount >= _totalSupply);
        
        _balanceOf[_owner] += mintedAmount;
        _totalSupply += mintedAmount;
        
		//Notify Listeners
        Transfer(0, _owner, mintedAmount);
        
    }
    
    /**
    * @notice Freeze or unfreeze account, can be run only by owner
    * @param target Account
    * @param freeze True to freeze, False to unfreeze
    */
    function freezeAccount (address target, bool freeze) onlyOwner public {
        
		//set freeze value 
        _frozenAccount[target] = freeze;
		
		//Notify Listeners
        FrozenFunds(target, freeze);
        
    }
    
    /**
     * Check if the address is frozen
     * @param _account Address to be checked
     */
    function frozenAccount(address _account) public view returns (bool) {
        
        return _frozenAccount[_account];
        
    }
    
}

