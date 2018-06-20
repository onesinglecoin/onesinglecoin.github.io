var abi = [
    {
        "constant": false,
        "inputs": [
            {
                "name": "message",
                "type": "string"
            }
        ],
        "name": "buy",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "_buyerId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "_buyer",
                "type": "address"
            }
        ],
        "name": "Purchased",
        "type": "event"
    },
    {
        "inputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "constant": false,
        "inputs": [],
        "name": "withdraw",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "",
                "type": "address"
            }
        ],
        "name": "balance",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "currentHodler",
        "outputs": [
            {
                "name": "",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "currentHodlerId",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "messages",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "previousHodlers",
        "outputs": [
            {
                "name": "",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "price",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];
var contract_address = '0x6103281b7d1f7862d692fda42dc06ece61a40547';
var web3 = null;
var contract;
var lastHodlerId = -1;

$(document).ready(function() {
    web3 = new Web3(Web3.givenProvider || "ws://localhost:8546");
    if (web3) {
        checkMetamaskLogin(0);
    }
});

function checkMetamaskLogin(timeout) {
    setTimeout(function () {
        web3.eth.getAccounts(function(err, accounts) {
            console.log(accounts);
            var address = accounts[0];
            if (address) {
                startApp(web3);
            }
            else {
                checkMetamaskLogin(300);
            }
        });
    }, timeout)
}

function toggleMetamaskAlert(toggle) {
    $('.buy-section').toggleClass('d-none', toggle);
    $('.howtobuy-section').toggleClass('d-none', !toggle);
}

function updateMessage(i) {
    var $msg = $('#message' + i);
    if (!$msg.length || $msg.find('.lead').html().trim()) {
        return;
    }
    console.log('up message' + i);
    contract.methods.messages(i).call(function (error, res) {
        console.log('msg', i, res);
        if (!error) {
            $('#message' + i).find('.lead').html(res);
            $('#message' + i).removeClass('d-none');
        }
    });
}

function updateView() {
    web3.eth.getAccounts(function(err, accounts) {
        var address = accounts[0];
        if (!address) return;

        contract.methods.balance(address).call(function(error, res) {
            if (!error && parseInt(res)) {
                $('.balance-section').removeClass('d-none');
            }
            $('.balance-section').find('.balance-amount').text(res / Math.pow(10, 18));
        });
    });

    contract.methods.price().call(function(error, res) {
        if (!error) {
            var price = Math.floor(res / Math.pow(10, 15)) / 1000;
            $('.price-cont').html(price);
            $('.usd-cont').html('&asymp; $' + Math.floor(price * 522));
        }
    });

    contract.methods.currentHodlerId().call(function(error, currentHodlerId) {
        //todo: need to update lastHodler at the end only if all the placeholders are filled

        console.log('current hodler id', currentHodlerId, error);
        if (error) {
            return;
        }
        for (var i = lastHodlerId + 1; i <= currentHodlerId; i++) {
            updateMessage(i);
        }
    });
}

function startApp(web3) {
    console.log('toggle alert false');
    toggleMetamaskAlert(false);
    contract = new web3.eth.Contract(abi, contract_address);

    updateView();
    setInterval(updateView  , 10000);

    $('.withdraw-btn').on('click', function(e) {
        console.log('withdraw');
        e.preventDefault();
        web3.eth.getAccounts(function(err, accounts) {
            var address = accounts[0];
            if (address) {
                contract.methods.withdraw().send({ from: address })
                    .then(function (txHash) {
                        $('#withdrawal-done-alert').removeClass('d-none')
                            .find('.link-placeholder').html('<a href="https://etherscan.io/tx/' + txHash.transactionHash + '">' + txHash.transactionHash + '</a>');
                    });
            }
        });
    });

    //todo: withdrawal button (only if the user has some non-zero balance)
    $('.buy-btn').on('click', function(e) {
        e.preventDefault();
        web3.eth.getAccounts(function(err, accounts) {
            var address = accounts[0];
            console.log('address', address);
            if (!address) {
                console.log('toggle alert true');
                return toggleMetamaskAlert(true);
            }

            contract.methods.price().call(function(error, res) {
                if (error) {
                    return;
                }
                $('#transaction-sending-alert').removeClass('d-none');
                contract.methods.buy($('#message').val()).send({ from: address, value: res })
                    .then(function (txHash) {
                        console.log(txHash);
                        $('#transaction-sending-alert').addClass('d-none');
                        $('#transaction-sent-alert').removeClass('d-none')
                            .find('.link-placeholder').html('<a href="https://etherscan.io/tx/' + txHash.transactionHash + '">' + txHash.transactionHash + '</a>');
                    })
                    .catch(console.error)
            });
        });
    })
}