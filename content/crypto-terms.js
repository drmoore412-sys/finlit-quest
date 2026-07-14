// Generated from content/crypto-terms.json. Do not edit by hand.
window.DEFI_TERMS = [
  {
    "id": "crypto.token",
    "word": "TOKEN",
    "normalizedWord": "token",
    "world": "crypto",
    "category": "digital_assets",
    "difficulty": "beginner",
    "definition": "A digital unit that represents value, access, ownership, or voting rights in a blockchain project.",
    "pronunciation": "TOH-kuhn",
    "realLifeExample": "A game might issue a token for buying items, while a DeFi service may issue one that lets holders vote on changes.",
    "didYouKnow": "Not every token is money. Some act like tickets, membership passes, receipts, or voting ballots.",
    "commonMistake": "Assuming every token has lasting value. Its price and usefulness depend on the project, demand, rules, and risks behind it.",
    "quickChallenge": {
      "id": "crypto.token.example",
      "type": "identify_best_example",
      "prompt": "Which is the clearest example of a token?",
      "options": [
        "A digital pass that grants access to a blockchain game",
        "The password to your email account",
        "A paper receipt from a grocery store"
      ],
      "correctAnswer": 0,
      "explanation": "A blockchain-based digital pass can be a token because it represents access recorded on a blockchain.",
      "difficulty": "beginner",
      "relatedTermId": "crypto.coin"
    },
    "relatedTermIds": [
      "crypto.coin",
      "crypto.mint",
      "crypto.burn"
    ],
    "xpValue": 10,
    "reviewWeight": 1
  },
  {
    "id": "crypto.node",
    "word": "NODE",
    "normalizedWord": "node",
    "world": "crypto",
    "category": "network_infrastructure",
    "difficulty": "beginner",
    "definition": "A computer connected to a blockchain network that stores, checks, or shares network data.",
    "pronunciation": "NOHD",
    "realLifeExample": "When you submit a crypto transaction, nodes relay it across the network and check that it follows the blockchain's rules.",
    "didYouKnow": "Many blockchains have thousands of independently operated nodes, reducing reliance on one central computer.",
    "commonMistake": "Thinking every node creates new coins. Many nodes only verify and share data; mining or validating is a separate role.",
    "quickChallenge": {
      "id": "crypto.node.role",
      "type": "scenario_choice",
      "prompt": "A computer checks transactions and shares valid blocks with peers. What role is it performing?",
      "options": [
        "Acting as a node",
        "Minting a collectible",
        "Setting the token's market price"
      ],
      "correctAnswer": 0,
      "explanation": "Checking and relaying blockchain data are core node functions.",
      "difficulty": "beginner",
      "relatedTermId": "crypto.peer"
    },
    "relatedTermIds": [
      "crypto.peer",
      "crypto.chain",
      "crypto.miner"
    ],
    "xpValue": 8,
    "reviewWeight": 1
  },
  {
    "id": "crypto.coin",
    "word": "COIN",
    "normalizedWord": "coin",
    "world": "crypto",
    "category": "digital_assets",
    "difficulty": "beginner",
    "definition": "A digital asset native to its own blockchain, often used to pay network fees or transfer value.",
    "pronunciation": "KOYN",
    "realLifeExample": "ETH is the native coin used to pay transaction fees on Ethereum, even when you are moving a different token.",
    "didYouKnow": "A coin runs on its own blockchain; a token is generally created on top of an existing blockchain.",
    "commonMistake": "Using coin and token as exact synonyms. The distinction matters when identifying which network secures the asset and charges its fees.",
    "quickChallenge": {
      "id": "crypto.coin.compare",
      "type": "compare_choices",
      "prompt": "Which statement best distinguishes a coin from a token?",
      "options": [
        "A coin is native to its blockchain; a token usually runs on another blockchain",
        "A coin always has a fixed price",
        "A token can never be transferred"
      ],
      "correctAnswer": 0,
      "explanation": "The native-blockchain relationship is the useful distinction; price and transfer rules vary by asset.",
      "difficulty": "beginner",
      "relatedTermId": "crypto.token"
    },
    "relatedTermIds": [
      "crypto.token",
      "crypto.gas",
      "crypto.chain"
    ],
    "xpValue": 8,
    "reviewWeight": 1
  },
  {
    "id": "crypto.mint",
    "word": "MINT",
    "normalizedWord": "mint",
    "world": "crypto",
    "category": "token_mechanics",
    "difficulty": "beginner",
    "definition": "To create new coins or tokens according to a blockchain or smart contract's rules.",
    "pronunciation": "MINT",
    "realLifeExample": "An artist may mint an NFT, causing a new token and its ownership record to be created on a blockchain.",
    "didYouKnow": "Minting can be automatic, scheduled, or restricted to approved addresses depending on the asset's code.",
    "commonMistake": "Believing minting creates value by itself. Increasing supply without matching demand can reduce the value of existing units.",
    "quickChallenge": {
      "id": "crypto.mint.supply",
      "type": "true_false",
      "prompt": "True or false: Minting always makes existing tokens more valuable.",
      "options": [
        "False",
        "True"
      ],
      "correctAnswer": 0,
      "explanation": "Minting increases supply; it does not guarantee demand or value and can dilute existing holders.",
      "difficulty": "beginner",
      "relatedTermId": "crypto.burn"
    },
    "relatedTermIds": [
      "crypto.burn",
      "crypto.token",
      "crypto.coin"
    ],
    "xpValue": 8,
    "reviewWeight": 1
  },
  {
    "id": "crypto.pool",
    "word": "POOL",
    "normalizedWord": "pool",
    "world": "crypto",
    "category": "defi",
    "difficulty": "beginner",
    "definition": "A shared collection of tokens that a DeFi protocol uses for trading, lending, or other services.",
    "pronunciation": "POOL",
    "realLifeExample": "A trader swaps ETH for another token using assets supplied by people who deposited both tokens into a liquidity pool.",
    "didYouKnow": "Pool depositors may earn fees, but the value of what they withdraw can differ from simply holding the tokens.",
    "commonMistake": "Treating pool returns as guaranteed interest. Smart-contract failure, token price changes, and impermanent loss can reduce returns.",
    "quickChallenge": {
      "id": "crypto.pool.risk",
      "type": "scenario_choice",
      "prompt": "Maya deposits two tokens into a trading pool. What should she understand first?",
      "options": [
        "Fees and token-price changes can affect her result",
        "Her return is guaranteed by the blockchain",
        "The tokens can no longer change price"
      ],
      "correctAnswer": 0,
      "explanation": "Pool returns depend on fees, market movement, contract safety, and the pool's design; they are not guaranteed.",
      "difficulty": "beginner",
      "relatedTermId": "crypto.swap"
    },
    "relatedTermIds": [
      "crypto.swap",
      "crypto.yield",
      "crypto.vault"
    ],
    "xpValue": 10,
    "reviewWeight": 1.1
  },
  {
    "id": "crypto.lock",
    "word": "LOCK",
    "normalizedWord": "lock",
    "world": "crypto",
    "category": "token_mechanics",
    "difficulty": "beginner",
    "definition": "To restrict tokens from being transferred or withdrawn for a set time or until conditions are met.",
    "pronunciation": "LOK",
    "realLifeExample": "A protocol may require users to lock governance tokens for three months before receiving voting power or rewards.",
    "didYouKnow": "Some locks are voluntary, while others are enforced automatically by smart-contract code.",
    "commonMistake": "Locking funds without checking the unlock date and exit rules. Market conditions can change while the assets remain inaccessible.",
    "quickChallenge": {
      "id": "crypto.lock.liquidity",
      "type": "identify_common_mistake",
      "prompt": "Which action is the biggest mistake before locking tokens for a year?",
      "options": [
        "Ignoring whether you may need the money sooner",
        "Reading the unlock rules",
        "Checking the protocol's risks"
      ],
      "correctAnswer": 0,
      "explanation": "Locked assets may be unavailable during emergencies, so liquidity needs must be considered first.",
      "difficulty": "beginner",
      "relatedTermId": "crypto.stake"
    },
    "relatedTermIds": [
      "crypto.stake",
      "crypto.vault",
      "crypto.token"
    ],
    "xpValue": 8,
    "reviewWeight": 1
  },
  {
    "id": "crypto.block",
    "word": "BLOCK",
    "normalizedWord": "block",
    "world": "crypto",
    "category": "network_infrastructure",
    "difficulty": "beginner",
    "definition": "A verified batch of transactions added as one new record in a blockchain's history.",
    "pronunciation": "BLOK",
    "realLifeExample": "Several transfers made around the same time may be grouped into one block before that block is linked to the chain.",
    "didYouKnow": "Block size and timing affect how many transactions a network can process and how quickly they are confirmed.",
    "commonMistake": "Thinking one block contains only one transaction. A block usually holds many transactions plus information linking it to earlier blocks.",
    "quickChallenge": {
      "id": "crypto.block.order",
      "type": "scenario_choice",
      "prompt": "Why are blocks linked in order?",
      "options": [
        "To make the transaction history difficult to alter unnoticed",
        "To guarantee every asset rises in price",
        "To hide all transactions from network participants"
      ],
      "correctAnswer": 0,
      "explanation": "Each block references earlier data, so changing old records would break the later links and become detectable.",
      "difficulty": "beginner",
      "relatedTermId": "crypto.chain"
    },
    "relatedTermIds": [
      "crypto.chain",
      "crypto.hash",
      "crypto.node"
    ],
    "xpValue": 10,
    "reviewWeight": 1
  },
  {
    "id": "crypto.fork",
    "word": "FORK",
    "normalizedWord": "fork",
    "world": "crypto",
    "category": "network_governance",
    "difficulty": "intermediate",
    "definition": "A change in blockchain rules that creates a new path for the network's software or transaction history.",
    "pronunciation": "FORK",
    "realLifeExample": "If network participants adopt incompatible rule changes, the blockchain can split into two networks with separate assets.",
    "didYouKnow": "Some forks are routine software upgrades and never create a lasting second blockchain.",
    "commonMistake": "Assuming every fork gives holders valuable free coins. New assets may have little demand, limited support, or security risks.",
    "quickChallenge": {
      "id": "crypto.fork.outcome",
      "type": "true_false",
      "prompt": "True or false: Every blockchain fork permanently creates two valuable networks.",
      "options": [
        "False",
        "True"
      ],
      "correctAnswer": 0,
      "explanation": "Many forks are compatible upgrades or fail to gain support; a valuable second network is not guaranteed.",
      "difficulty": "intermediate",
      "relatedTermId": "crypto.chain"
    },
    "relatedTermIds": [
      "crypto.chain",
      "crypto.node",
      "crypto.coin"
    ],
    "xpValue": 12,
    "reviewWeight": 1.2
  },
  {
    "id": "crypto.hash",
    "word": "HASH",
    "normalizedWord": "hash",
    "world": "crypto",
    "category": "network_infrastructure",
    "difficulty": "intermediate",
    "definition": "A fixed-length digital fingerprint produced from data, used to detect changes and link blockchain records.",
    "pronunciation": "HASH",
    "realLifeExample": "A block's hash changes if someone edits its transaction data, alerting the network that the record no longer matches.",
    "didYouKnow": "Even a tiny input change creates a very different hash, while the hash itself does not reveal the original data.",
    "commonMistake": "Confusing a hash with encryption. Encryption is designed to be reversed with a key; hashing is designed as a one-way fingerprint.",
    "quickChallenge": {
      "id": "crypto.hash.change",
      "type": "scenario_choice",
      "prompt": "A transaction record is altered after its hash was created. What happens?",
      "options": [
        "The new hash no longer matches the original",
        "The hash automatically restores the old transaction",
        "Nothing changes because hashes ignore transaction data"
      ],
      "correctAnswer": 0,
      "explanation": "Changing the input changes its hash, making the alteration detectable.",
      "difficulty": "intermediate",
      "relatedTermId": "crypto.block"
    },
    "relatedTermIds": [
      "crypto.block",
      "crypto.chain",
      "crypto.miner"
    ],
    "xpValue": 12,
    "reviewWeight": 1.2
  },
  {
    "id": "crypto.gas",
    "word": "GAS",
    "normalizedWord": "gas",
    "world": "crypto",
    "category": "transactions",
    "difficulty": "beginner",
    "definition": "The fee paid to process a transaction or run an application action on certain blockchains.",
    "pronunciation": "GAS",
    "realLifeExample": "Swapping tokens on Ethereum requires gas paid in ETH, even if neither token in the swap is ETH.",
    "didYouKnow": "Gas prices can rise when many users compete to have their transactions processed quickly.",
    "commonMistake": "Spending the entire native coin balance and leaving none for gas, which can prevent the next transaction.",
    "quickChallenge": {
      "id": "crypto.gas.balance",
      "type": "scenario_choice",
      "prompt": "Leo owns tokens on Ethereum but has no ETH. Why might his swap fail?",
      "options": [
        "He lacks the native coin needed for gas",
        "Tokens cannot be swapped on blockchains",
        "Every swap requires a bank transfer"
      ],
      "correctAnswer": 0,
      "explanation": "Ethereum transaction fees are paid in ETH, so token ownership alone may not cover gas.",
      "difficulty": "beginner",
      "relatedTermId": "crypto.coin"
    },
    "relatedTermIds": [
      "crypto.coin",
      "crypto.swap",
      "crypto.node"
    ],
    "xpValue": 8,
    "reviewWeight": 1
  },
  {
    "id": "crypto.chain",
    "word": "CHAIN",
    "normalizedWord": "chain",
    "world": "crypto",
    "category": "network_infrastructure",
    "difficulty": "beginner",
    "definition": "The ordered, linked history of transaction blocks maintained by a blockchain network.",
    "pronunciation": "CHAYN",
    "realLifeExample": "A wallet checks the chain's shared history to determine which transactions occurred and what balance an address controls.",
    "didYouKnow": "Different chains can use different rules, fees, assets, and security methods even when they support similar applications.",
    "commonMistake": "Sending an asset on the wrong chain. Similar-looking addresses do not guarantee that a receiving service supports that network.",
    "quickChallenge": {
      "id": "crypto.chain.transfer",
      "type": "identify_common_mistake",
      "prompt": "Before sending crypto to an exchange, what is most important to match?",
      "options": [
        "The sending and receiving network",
        "The color of the wallet app",
        "The current price chart interval"
      ],
      "correctAnswer": 0,
      "explanation": "Both sides must support the same chain or the funds may not arrive normally and recovery can be difficult.",
      "difficulty": "beginner",
      "relatedTermId": "crypto.wallet"
    },
    "relatedTermIds": [
      "crypto.block",
      "crypto.node",
      "crypto.wallet"
    ],
    "xpValue": 10,
    "reviewWeight": 1
  },
  {
    "id": "crypto.yield",
    "word": "YIELD",
    "normalizedWord": "yield",
    "world": "crypto",
    "category": "defi",
    "difficulty": "intermediate",
    "definition": "The return earned by putting digital assets into a DeFi strategy, usually expressed as a percentage.",
    "pronunciation": "YEELD",
    "realLifeExample": "A lending protocol may pay depositors variable yield funded by interest from borrowers.",
    "didYouKnow": "A high displayed annual yield can change quickly and may be paid in a token whose price is falling.",
    "commonMistake": "Comparing yield percentages without comparing risk, fees, reward tokens, lockups, and whether the rate is sustainable.",
    "quickChallenge": {
      "id": "crypto.yield.compare",
      "type": "compare_choices",
      "prompt": "Which offer deserves more caution?",
      "options": [
        "A 200% variable yield paid in a new, volatile token",
        "A clearly explained 4% variable yield from established borrowers",
        "Both have exactly the same risk"
      ],
      "correctAnswer": 0,
      "explanation": "Extremely high variable yields often rely on volatile rewards or incentives that may not last.",
      "difficulty": "intermediate",
      "relatedTermId": "crypto.vault"
    },
    "relatedTermIds": [
      "crypto.pool",
      "crypto.vault",
      "crypto.stake"
    ],
    "xpValue": 12,
    "reviewWeight": 1.3
  },
  {
    "id": "crypto.ledger",
    "word": "LEDGER",
    "normalizedWord": "ledger",
    "world": "crypto",
    "category": "network_infrastructure",
    "difficulty": "intermediate",
    "definition": "A record of transactions and balances that a blockchain network keeps synchronized across participants.",
    "pronunciation": "LEJ-er",
    "realLifeExample": "When coins move between addresses, the network updates its shared ledger so nodes agree on the new balances.",
    "didYouKnow": "A blockchain ledger records address activity, but an address does not automatically reveal the real person's identity.",
    "commonMistake": "Assuming a public ledger makes every user fully anonymous. Transaction patterns and outside information can sometimes connect addresses to people.",
    "quickChallenge": {
      "id": "crypto.ledger.public",
      "type": "true_false",
      "prompt": "True or false: A public blockchain ledger can show address activity without directly naming the owner.",
      "options": [
        "True",
        "False"
      ],
      "correctAnswer": 0,
      "explanation": "Public ledgers show addresses and transactions, while identity may require additional information to establish.",
      "difficulty": "intermediate",
      "relatedTermId": "crypto.wallet"
    },
    "relatedTermIds": [
      "crypto.chain",
      "crypto.wallet",
      "crypto.block"
    ],
    "xpValue": 12,
    "reviewWeight": 1.2
  },
  {
    "id": "crypto.peer",
    "word": "PEER",
    "normalizedWord": "peer",
    "world": "crypto",
    "category": "network_infrastructure",
    "difficulty": "beginner",
    "definition": "Another network participant that communicates directly with your node rather than through one central server.",
    "pronunciation": "PEER",
    "realLifeExample": "A node downloads recent blocks from several peers when it reconnects to the blockchain network.",
    "didYouKnow": "Peer-to-peer networks can keep operating even when individual computers disconnect or fail.",
    "commonMistake": "Assuming every peer is trustworthy. Nodes still verify received data against network rules instead of accepting it blindly.",
    "quickChallenge": {
      "id": "crypto.peer.trust",
      "type": "scenario_choice",
      "prompt": "A node receives a block from a peer. What should it do?",
      "options": [
        "Verify the block against network rules",
        "Trust it automatically because peers cannot lie",
        "Delete its existing blockchain history"
      ],
      "correctAnswer": 0,
      "explanation": "Peer-to-peer communication distributes data, but independent verification is what protects the network.",
      "difficulty": "beginner",
      "relatedTermId": "crypto.node"
    },
    "relatedTermIds": [
      "crypto.node",
      "crypto.block",
      "crypto.chain"
    ],
    "xpValue": 8,
    "reviewWeight": 1
  },
  {
    "id": "crypto.stake",
    "word": "STAKE",
    "normalizedWord": "stake",
    "world": "crypto",
    "category": "network_security",
    "difficulty": "intermediate",
    "definition": "To commit tokens to help secure a proof-of-stake network or participate in a protocol, often for rewards.",
    "pronunciation": "STAYK",
    "realLifeExample": "A validator stakes a network's native coin and may lose part of it for breaking important rules.",
    "didYouKnow": "Staking rewards compensate participants for work and risk; they are not the same as risk-free bank interest.",
    "commonMistake": "Choosing a staking offer only by its advertised rate without checking lockups, slashing risk, validator fees, and token-price risk.",
    "quickChallenge": {
      "id": "crypto.stake.risk",
      "type": "scenario_choice",
      "prompt": "Which risk is specific to some staking arrangements?",
      "options": [
        "Losing part of the stake for validator misconduct",
        "A guaranteed increase in purchasing power",
        "Elimination of all token-price changes"
      ],
      "correctAnswer": 0,
      "explanation": "Some networks use slashing to penalize serious validator errors or dishonest behavior.",
      "difficulty": "intermediate",
      "relatedTermId": "crypto.lock"
    },
    "relatedTermIds": [
      "crypto.lock",
      "crypto.node",
      "crypto.yield"
    ],
    "xpValue": 12,
    "reviewWeight": 1.3
  },
  {
    "id": "crypto.swap",
    "word": "SWAP",
    "normalizedWord": "swap",
    "world": "crypto",
    "category": "defi",
    "difficulty": "beginner",
    "definition": "To exchange one digital asset for another, often through a decentralized exchange or liquidity pool.",
    "pronunciation": "SWOP",
    "realLifeExample": "A user swaps a stablecoin for ETH through a decentralized exchange without placing a traditional order with a broker.",
    "didYouKnow": "The quoted swap rate can change before confirmation because pool balances and market prices move.",
    "commonMistake": "Approving a swap without reviewing price impact, slippage tolerance, gas fees, and whether the token contract is genuine.",
    "quickChallenge": {
      "id": "crypto.swap.review",
      "type": "identify_best_example",
      "prompt": "What should a user check before confirming a large token swap?",
      "options": [
        "Price impact, fees, slippage, and token address",
        "Only the button color",
        "Whether the wallet battery is above 50%"
      ],
      "correctAnswer": 0,
      "explanation": "Those transaction details directly affect what the user pays, receives, and risks.",
      "difficulty": "beginner",
      "relatedTermId": "crypto.pool"
    },
    "relatedTermIds": [
      "crypto.pool",
      "crypto.gas",
      "crypto.token"
    ],
    "xpValue": 10,
    "reviewWeight": 1.1
  },
  {
    "id": "crypto.burn",
    "word": "BURN",
    "normalizedWord": "burn",
    "world": "crypto",
    "category": "token_mechanics",
    "difficulty": "intermediate",
    "definition": "To permanently remove tokens from usable circulation, usually by sending them to an inaccessible address.",
    "pronunciation": "BURN",
    "realLifeExample": "A project may burn a portion of transaction fees so those tokens can never be spent again.",
    "didYouKnow": "Burning reduces supply but does not guarantee a price increase; demand can also fall.",
    "commonMistake": "Treating a burn announcement as proof an asset will rise. The amount burned, future minting, demand, and project health all matter.",
    "quickChallenge": {
      "id": "crypto.burn.price",
      "type": "true_false",
      "prompt": "True or false: Burning tokens guarantees that their market price will rise.",
      "options": [
        "False",
        "True"
      ],
      "correctAnswer": 0,
      "explanation": "Lower supply can matter, but price also depends on demand, future supply, liquidity, and market confidence.",
      "difficulty": "intermediate",
      "relatedTermId": "crypto.mint"
    },
    "relatedTermIds": [
      "crypto.mint",
      "crypto.token",
      "crypto.coin"
    ],
    "xpValue": 10,
    "reviewWeight": 1.2
  },
  {
    "id": "crypto.vault",
    "word": "VAULT",
    "normalizedWord": "vault",
    "world": "crypto",
    "category": "defi",
    "difficulty": "advanced",
    "definition": "A smart-contract strategy that manages deposited assets according to predefined rules to pursue a return.",
    "pronunciation": "VAWLT",
    "realLifeExample": "A yield vault may move deposits among lending markets and automatically reinvest earned rewards.",
    "didYouKnow": "A vault can simplify a strategy while adding dependency on its code, manager permissions, and connected protocols.",
    "commonMistake": "Assuming automation removes risk. A vault can amplify smart-contract, strategy, liquidity, and third-party protocol failures.",
    "quickChallenge": {
      "id": "crypto.vault.risk",
      "type": "scenario_choice",
      "prompt": "A vault advertises automatic yield optimization. What should a depositor still investigate?",
      "options": [
        "Its contracts, strategy, fees, permissions, and connected protocols",
        "Only its logo",
        "Whether deposits are guaranteed by every blockchain"
      ],
      "correctAnswer": 0,
      "explanation": "Automation changes who executes the strategy, not the need to understand its dependencies and risks.",
      "difficulty": "advanced",
      "relatedTermId": "crypto.yield"
    },
    "relatedTermIds": [
      "crypto.yield",
      "crypto.pool",
      "crypto.lock"
    ],
    "xpValue": 15,
    "reviewWeight": 1.5
  },
  {
    "id": "crypto.wallet",
    "word": "WALLET",
    "normalizedWord": "wallet",
    "world": "crypto",
    "category": "security",
    "difficulty": "beginner",
    "definition": "Software or hardware that manages the private keys used to control blockchain assets and sign transactions.",
    "pronunciation": "WOL-it",
    "realLifeExample": "A mobile wallet lets a user review and sign a token transfer while the assets remain recorded on the blockchain.",
    "didYouKnow": "A wallet does not physically store coins; it manages keys that authorize changes to blockchain records.",
    "commonMistake": "Sharing a seed phrase with someone claiming to provide support. Anyone with that phrase can usually control the wallet's assets.",
    "quickChallenge": {
      "id": "crypto.wallet.seed",
      "type": "scenario_choice",
      "prompt": "A support agent asks for your wallet seed phrase to fix a transaction. What should you do?",
      "options": [
        "Refuse and end the conversation",
        "Send it because support needs full access",
        "Post it publicly to confirm the words"
      ],
      "correctAnswer": 0,
      "explanation": "A legitimate helper does not need the seed phrase. Sharing it can surrender control of every associated asset.",
      "difficulty": "beginner",
      "relatedTermId": "crypto.ledger"
    },
    "relatedTermIds": [
      "crypto.ledger",
      "crypto.chain",
      "crypto.token"
    ],
    "xpValue": 10,
    "reviewWeight": 1.2
  },
  {
    "id": "crypto.miner",
    "word": "MINER",
    "normalizedWord": "miner",
    "world": "crypto",
    "category": "network_security",
    "difficulty": "intermediate",
    "definition": "A participant that uses computing work to compete to add blocks on a proof-of-work blockchain.",
    "pronunciation": "MY-ner",
    "realLifeExample": "Bitcoin miners combine pending transactions into candidate blocks and compete to solve a computational puzzle.",
    "didYouKnow": "Mining difficulty can adjust so blocks continue arriving near the network's target pace as computing power changes.",
    "commonMistake": "Assuming miners can freely rewrite balances. Other nodes reject blocks that break the network's rules.",
    "quickChallenge": {
      "id": "crypto.miner.rules",
      "type": "scenario_choice",
      "prompt": "A miner creates a block that invents extra coins beyond the rules. What should honest nodes do?",
      "options": [
        "Reject the invalid block",
        "Accept it because miners control all rules",
        "Double every wallet balance"
      ],
      "correctAnswer": 0,
      "explanation": "Miners propose blocks, but nodes independently enforce the shared rules and reject invalid proposals.",
      "difficulty": "intermediate",
      "relatedTermId": "crypto.node"
    },
    "relatedTermIds": [
      "crypto.node",
      "crypto.block",
      "crypto.hash"
    ],
    "xpValue": 12,
    "reviewWeight": 1.3
  }
];
