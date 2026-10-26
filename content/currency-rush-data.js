(function(root,factory){const data=factory();if(typeof module==="object"&&module.exports)module.exports=data;root.FINLIT_CURRENCY_RUSH_DATA=data})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  return Object.freeze({
  "schemaVersion": 1,
  "status": "practice-only",
  "source": {
    "name": "ISO 4217 List One",
    "maintainer": "SIX Financial Information AG — ISO 4217 Maintenance Agency",
    "published": "2026-09-17",
    "url": "https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml",
    "imported": "2026-10-26"
  },
  "scoring": {
    "code": 100,
    "streak": 50,
    "streakLength": 3,
    "completion": 250,
    "perSecond": 10,
    "durationSeconds": 60
  },
  "rounds": [
    {
      "id": "currency-rush-01",
      "number": 1,
      "wheel": "SKZRUEADC",
      "requiredCodes": [
        "AED",
        "ARS",
        "AUD",
        "CAD",
        "CZK",
        "EUR",
        "KES",
        "RSD",
        "SAR",
        "SCR",
        "SEK",
        "SRD",
        "USD",
        "UZS",
        "ZAR"
      ]
    },
    {
      "id": "currency-rush-02",
      "number": 2,
      "wheel": "NXIRDMYTC",
      "requiredCodes": [
        "CNY",
        "IDR",
        "INR",
        "MNT",
        "MXN",
        "MYR",
        "TND",
        "TRY",
        "XCD",
        "XDR"
      ]
    },
    {
      "id": "currency-rush-03",
      "number": 3,
      "wheel": "HFODPKNUC",
      "requiredCodes": [
        "CDF",
        "CHF",
        "COP",
        "COU",
        "CUP",
        "DOP",
        "FKP",
        "HKD",
        "HUF",
        "NOK"
      ]
    },
    {
      "id": "currency-rush-04",
      "number": 4,
      "wheel": "PBNLGERUT",
      "requiredCodes": [
        "BRL",
        "BTN",
        "EGP",
        "ERN",
        "ETB",
        "EUR",
        "GBP",
        "GEL",
        "LBP",
        "NPR",
        "PEN",
        "PLN",
        "RUB"
      ]
    },
    {
      "id": "currency-rush-05",
      "number": 5,
      "wheel": "ADMNGRVSE",
      "requiredCodes": [
        "AED",
        "AMD",
        "ARS",
        "ERN",
        "GMD",
        "MAD",
        "MGA",
        "MVR",
        "NAD",
        "RSD",
        "SAR",
        "SDG",
        "SGD",
        "SRD",
        "VED",
        "VES",
        "VND"
      ]
    },
    {
      "id": "currency-rush-06",
      "number": 6,
      "wheel": "LHRDWABTK",
      "requiredCodes": [
        "BDT",
        "BHD",
        "BRL",
        "HKD",
        "KHR",
        "KRW",
        "KWD",
        "LAK",
        "LKR",
        "LRD",
        "THB",
        "TWD"
      ]
    },
    {
      "id": "currency-rush-07",
      "number": 7,
      "wheel": "JPYUSDERA",
      "requiredCodes": [
        "AED",
        "ARS",
        "AUD",
        "EUR",
        "JPY",
        "RSD",
        "SAR",
        "SRD",
        "SYP",
        "USD",
        "YER"
      ]
    }
  ],
  "currencies": {
    "AED": {
      "code": "AED",
      "name": "UAE Dirham",
      "isFund": false,
      "countries": [
        "UNITED ARAB EMIRATES (THE)"
      ]
    },
    "AMD": {
      "code": "AMD",
      "name": "Armenian Dram",
      "isFund": false,
      "countries": [
        "ARMENIA"
      ]
    },
    "ARS": {
      "code": "ARS",
      "name": "Argentine Peso",
      "isFund": false,
      "countries": [
        "ARGENTINA"
      ]
    },
    "AUD": {
      "code": "AUD",
      "name": "Australian Dollar",
      "isFund": false,
      "countries": [
        "AUSTRALIA",
        "CHRISTMAS ISLAND",
        "COCOS (KEELING) ISLANDS (THE)",
        "HEARD ISLAND AND McDONALD ISLANDS",
        "KIRIBATI",
        "NAURU",
        "NORFOLK ISLAND",
        "TUVALU"
      ]
    },
    "BDT": {
      "code": "BDT",
      "name": "Taka",
      "isFund": false,
      "countries": [
        "BANGLADESH"
      ]
    },
    "BHD": {
      "code": "BHD",
      "name": "Bahraini Dinar",
      "isFund": false,
      "countries": [
        "BAHRAIN"
      ]
    },
    "BRL": {
      "code": "BRL",
      "name": "Brazilian Real",
      "isFund": false,
      "countries": [
        "BRAZIL"
      ]
    },
    "BTN": {
      "code": "BTN",
      "name": "Ngultrum",
      "isFund": false,
      "countries": [
        "BHUTAN"
      ]
    },
    "CAD": {
      "code": "CAD",
      "name": "Canadian Dollar",
      "isFund": false,
      "countries": [
        "CANADA"
      ]
    },
    "CDF": {
      "code": "CDF",
      "name": "Congolese Franc",
      "isFund": false,
      "countries": [
        "CONGO (THE DEMOCRATIC REPUBLIC OF THE)"
      ]
    },
    "CHF": {
      "code": "CHF",
      "name": "Swiss Franc",
      "isFund": false,
      "countries": [
        "LIECHTENSTEIN",
        "SWITZERLAND"
      ]
    },
    "CNY": {
      "code": "CNY",
      "name": "Yuan Renminbi",
      "isFund": false,
      "countries": [
        "CHINA"
      ]
    },
    "COP": {
      "code": "COP",
      "name": "Colombian Peso",
      "isFund": false,
      "countries": [
        "COLOMBIA"
      ]
    },
    "COU": {
      "code": "COU",
      "name": "Unidad de Valor Real",
      "isFund": true,
      "countries": [
        "COLOMBIA"
      ]
    },
    "CUP": {
      "code": "CUP",
      "name": "Cuban Peso",
      "isFund": false,
      "countries": [
        "CUBA"
      ]
    },
    "CZK": {
      "code": "CZK",
      "name": "Czech Koruna",
      "isFund": false,
      "countries": [
        "CZECHIA"
      ]
    },
    "DOP": {
      "code": "DOP",
      "name": "Dominican Peso",
      "isFund": false,
      "countries": [
        "DOMINICAN REPUBLIC (THE)"
      ]
    },
    "EGP": {
      "code": "EGP",
      "name": "Egyptian Pound",
      "isFund": false,
      "countries": [
        "EGYPT"
      ]
    },
    "ERN": {
      "code": "ERN",
      "name": "Nakfa",
      "isFund": false,
      "countries": [
        "ERITREA"
      ]
    },
    "ETB": {
      "code": "ETB",
      "name": "Ethiopian Birr",
      "isFund": false,
      "countries": [
        "ETHIOPIA"
      ]
    },
    "EUR": {
      "code": "EUR",
      "name": "Euro",
      "isFund": false,
      "countries": [
        "ÅLAND ISLANDS",
        "ANDORRA",
        "AUSTRIA",
        "BELGIUM",
        "BULGARIA",
        "CROATIA",
        "CYPRUS",
        "ESTONIA",
        "EUROPEAN UNION",
        "FINLAND",
        "FRANCE",
        "FRENCH GUIANA",
        "FRENCH SOUTHERN TERRITORIES (THE)",
        "GERMANY",
        "GREECE",
        "GUADELOUPE",
        "HOLY SEE (THE)",
        "IRELAND",
        "ITALY",
        "LATVIA",
        "LITHUANIA",
        "LUXEMBOURG",
        "MALTA",
        "MARTINIQUE",
        "MAYOTTE",
        "MONACO",
        "MONTENEGRO",
        "NETHERLANDS (THE)",
        "PORTUGAL",
        "RÉUNION",
        "SAINT BARTHÉLEMY",
        "SAINT MARTIN (FRENCH PART)",
        "SAINT PIERRE AND MIQUELON",
        "SAN MARINO",
        "SLOVAKIA",
        "SLOVENIA",
        "SPAIN"
      ]
    },
    "FKP": {
      "code": "FKP",
      "name": "Falkland Islands Pound",
      "isFund": false,
      "countries": [
        "FALKLAND ISLANDS (THE) [MALVINAS]"
      ]
    },
    "GBP": {
      "code": "GBP",
      "name": "Pound Sterling",
      "isFund": false,
      "countries": [
        "GUERNSEY",
        "ISLE OF MAN",
        "JERSEY",
        "UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND (THE)"
      ]
    },
    "GEL": {
      "code": "GEL",
      "name": "Lari",
      "isFund": false,
      "countries": [
        "GEORGIA"
      ]
    },
    "GMD": {
      "code": "GMD",
      "name": "Dalasi",
      "isFund": false,
      "countries": [
        "GAMBIA (THE)"
      ]
    },
    "HKD": {
      "code": "HKD",
      "name": "Hong Kong Dollar",
      "isFund": false,
      "countries": [
        "HONG KONG"
      ]
    },
    "HUF": {
      "code": "HUF",
      "name": "Forint",
      "isFund": false,
      "countries": [
        "HUNGARY"
      ]
    },
    "IDR": {
      "code": "IDR",
      "name": "Rupiah",
      "isFund": false,
      "countries": [
        "INDONESIA"
      ]
    },
    "INR": {
      "code": "INR",
      "name": "Indian Rupee",
      "isFund": false,
      "countries": [
        "BHUTAN",
        "INDIA"
      ]
    },
    "JPY": {
      "code": "JPY",
      "name": "Yen",
      "isFund": false,
      "countries": [
        "JAPAN"
      ]
    },
    "KES": {
      "code": "KES",
      "name": "Kenyan Shilling",
      "isFund": false,
      "countries": [
        "KENYA"
      ]
    },
    "KHR": {
      "code": "KHR",
      "name": "Riel",
      "isFund": false,
      "countries": [
        "CAMBODIA"
      ]
    },
    "KRW": {
      "code": "KRW",
      "name": "Won",
      "isFund": false,
      "countries": [
        "KOREA (THE REPUBLIC OF)"
      ]
    },
    "KWD": {
      "code": "KWD",
      "name": "Kuwaiti Dinar",
      "isFund": false,
      "countries": [
        "KUWAIT"
      ]
    },
    "LAK": {
      "code": "LAK",
      "name": "Lao Kip",
      "isFund": false,
      "countries": [
        "LAO PEOPLE’S DEMOCRATIC REPUBLIC (THE)"
      ]
    },
    "LBP": {
      "code": "LBP",
      "name": "Lebanese Pound",
      "isFund": false,
      "countries": [
        "LEBANON"
      ]
    },
    "LKR": {
      "code": "LKR",
      "name": "Sri Lanka Rupee",
      "isFund": false,
      "countries": [
        "SRI LANKA"
      ]
    },
    "LRD": {
      "code": "LRD",
      "name": "Liberian Dollar",
      "isFund": false,
      "countries": [
        "LIBERIA"
      ]
    },
    "MAD": {
      "code": "MAD",
      "name": "Moroccan Dirham",
      "isFund": false,
      "countries": [
        "MOROCCO",
        "WESTERN SAHARA"
      ]
    },
    "MGA": {
      "code": "MGA",
      "name": "Malagasy Ariary",
      "isFund": false,
      "countries": [
        "MADAGASCAR"
      ]
    },
    "MNT": {
      "code": "MNT",
      "name": "Tugrik",
      "isFund": false,
      "countries": [
        "MONGOLIA"
      ]
    },
    "MVR": {
      "code": "MVR",
      "name": "Rufiyaa",
      "isFund": false,
      "countries": [
        "MALDIVES"
      ]
    },
    "MXN": {
      "code": "MXN",
      "name": "Mexican Peso",
      "isFund": false,
      "countries": [
        "MEXICO"
      ]
    },
    "MYR": {
      "code": "MYR",
      "name": "Malaysian Ringgit",
      "isFund": false,
      "countries": [
        "MALAYSIA"
      ]
    },
    "NAD": {
      "code": "NAD",
      "name": "Namibia Dollar",
      "isFund": false,
      "countries": [
        "NAMIBIA"
      ]
    },
    "NOK": {
      "code": "NOK",
      "name": "Norwegian Krone",
      "isFund": false,
      "countries": [
        "BOUVET ISLAND",
        "NORWAY",
        "SVALBARD AND JAN MAYEN"
      ]
    },
    "NPR": {
      "code": "NPR",
      "name": "Nepalese Rupee",
      "isFund": false,
      "countries": [
        "NEPAL"
      ]
    },
    "PEN": {
      "code": "PEN",
      "name": "Sol",
      "isFund": false,
      "countries": [
        "PERU"
      ]
    },
    "PLN": {
      "code": "PLN",
      "name": "Zloty",
      "isFund": false,
      "countries": [
        "POLAND"
      ]
    },
    "RSD": {
      "code": "RSD",
      "name": "Serbian Dinar",
      "isFund": false,
      "countries": [
        "SERBIA"
      ]
    },
    "RUB": {
      "code": "RUB",
      "name": "Russian Ruble",
      "isFund": false,
      "countries": [
        "RUSSIAN FEDERATION (THE)"
      ]
    },
    "SAR": {
      "code": "SAR",
      "name": "Saudi Riyal",
      "isFund": false,
      "countries": [
        "SAUDI ARABIA"
      ]
    },
    "SCR": {
      "code": "SCR",
      "name": "Seychelles Rupee",
      "isFund": false,
      "countries": [
        "SEYCHELLES"
      ]
    },
    "SDG": {
      "code": "SDG",
      "name": "Sudanese Pound",
      "isFund": false,
      "countries": [
        "SUDAN (THE)"
      ]
    },
    "SEK": {
      "code": "SEK",
      "name": "Swedish Krona",
      "isFund": false,
      "countries": [
        "SWEDEN"
      ]
    },
    "SGD": {
      "code": "SGD",
      "name": "Singapore Dollar",
      "isFund": false,
      "countries": [
        "SINGAPORE"
      ]
    },
    "SRD": {
      "code": "SRD",
      "name": "Surinam Dollar",
      "isFund": false,
      "countries": [
        "SURINAME"
      ]
    },
    "SYP": {
      "code": "SYP",
      "name": "Syrian Pound",
      "isFund": false,
      "countries": [
        "SYRIAN ARAB REPUBLIC"
      ]
    },
    "THB": {
      "code": "THB",
      "name": "Baht",
      "isFund": false,
      "countries": [
        "THAILAND"
      ]
    },
    "TND": {
      "code": "TND",
      "name": "Tunisian Dinar",
      "isFund": false,
      "countries": [
        "TUNISIA"
      ]
    },
    "TRY": {
      "code": "TRY",
      "name": "Turkish Lira",
      "isFund": false,
      "countries": [
        "TÜRKİYE"
      ]
    },
    "TWD": {
      "code": "TWD",
      "name": "New Taiwan Dollar",
      "isFund": false,
      "countries": [
        "TAIWAN (PROVINCE OF CHINA)"
      ]
    },
    "USD": {
      "code": "USD",
      "name": "US Dollar",
      "isFund": false,
      "countries": [
        "AMERICAN SAMOA",
        "BONAIRE, SINT EUSTATIUS AND SABA",
        "BRITISH INDIAN OCEAN TERRITORY (THE)",
        "ECUADOR",
        "EL SALVADOR",
        "GUAM",
        "HAITI",
        "MARSHALL ISLANDS (THE)",
        "MICRONESIA (FEDERATED STATES OF)",
        "NORTHERN MARIANA ISLANDS (THE)",
        "PALAU",
        "PANAMA",
        "PUERTO RICO",
        "TIMOR-LESTE",
        "TURKS AND CAICOS ISLANDS (THE)",
        "UNITED STATES MINOR OUTLYING ISLANDS (THE)",
        "UNITED STATES OF AMERICA (THE)",
        "VIRGIN ISLANDS (BRITISH)",
        "VIRGIN ISLANDS (U.S.)"
      ]
    },
    "UZS": {
      "code": "UZS",
      "name": "Uzbekistan Sum",
      "isFund": false,
      "countries": [
        "UZBEKISTAN"
      ]
    },
    "VED": {
      "code": "VED",
      "name": "Bolívar Soberano",
      "isFund": false,
      "countries": [
        "VENEZUELA (BOLIVARIAN REPUBLIC OF)"
      ]
    },
    "VES": {
      "code": "VES",
      "name": "Bolívar Soberano",
      "isFund": false,
      "countries": [
        "VENEZUELA (BOLIVARIAN REPUBLIC OF)"
      ]
    },
    "VND": {
      "code": "VND",
      "name": "Dong",
      "isFund": false,
      "countries": [
        "VIET NAM"
      ]
    },
    "XCD": {
      "code": "XCD",
      "name": "East Caribbean Dollar",
      "isFund": false,
      "countries": [
        "ANGUILLA",
        "ANTIGUA AND BARBUDA",
        "DOMINICA",
        "GRENADA",
        "MONTSERRAT",
        "SAINT KITTS AND NEVIS",
        "SAINT LUCIA",
        "SAINT VINCENT AND THE GRENADINES"
      ]
    },
    "XDR": {
      "code": "XDR",
      "name": "SDR (Special Drawing Right)",
      "isFund": false,
      "countries": [
        "INTERNATIONAL MONETARY FUND (IMF)"
      ]
    },
    "YER": {
      "code": "YER",
      "name": "Yemeni Rial",
      "isFund": false,
      "countries": [
        "YEMEN"
      ]
    },
    "ZAR": {
      "code": "ZAR",
      "name": "Rand",
      "isFund": false,
      "countries": [
        "LESOTHO",
        "NAMIBIA",
        "SOUTH AFRICA"
      ]
    }
  }
});
});
