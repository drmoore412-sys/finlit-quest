// Governed Investing Basics v1.1 puzzle bank: nine approved clusters and no
// single-term puzzles. IB-C08 and IB-C09 are the only approved two-word
// exceptions.
window.INVESTING_BASICS_PUZZLES = [
  {
    id:"IB-C01",
    words:["STOCK","SELL","ASK"],
    letters:["A","C","E","K","L","L","O","S","T"]
  },
  {
    id:"IB-C02",
    words:["SHARE","ASSET","ISSUER"],
    letters:["A","E","H","I","R","S","S","T","U"]
  },
  {
    id:"IB-C03",
    words:["BOND","GAIN","LONG"],
    letters:["A","B","D","G","I","N","L","O"]
  },
  {
    id:"IB-C04",
    words:["BROKER","MARKET","BEAR"],
    letters:["A","B","E","K","M","O","R","R","T"]
  },
  {
    id:"IB-C05",
    words:["RETURN","TRADE","ORDER"],
    letters:["A","D","E","N","O","R","R","T","U"]
  },
  {
    id:"IB-C06",
    words:["EQUITY","BUY","BULL"],
    letters:["B","E","I","L","L","Q","T","U","Y"]
  },
  {
    id:"IB-C07",
    words:["GROWTH","OWNER","VOTE"],
    letters:["E","G","H","N","O","R","T","V","W"]
  },
  {
    id:"IB-C08",
    words:["DIVIDEND","INDEX"],
    letters:["D","D","D","E","I","I","N","V","X"],
    longWordException:true,
    longWordExceptionReason:"DIVIDEND and INDEX require all nine wheel tiles; no approved third Investing Basics answer fits."
  },
  {
    id:"IB-C09",
    words:["CAPITAL","BID"],
    letters:["A","A","B","C","D","I","L","P","T"],
    longWordException:true,
    longWordExceptionReason:"CAPITAL and BID require all nine wheel tiles; no approved third Investing Basics answer fits."
  }
];
