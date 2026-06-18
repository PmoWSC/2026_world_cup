-- Migration: fill in confederation for non-WC nations that play
-- friendlies. Only the 48 World Cup qualifiers had it set (from
-- country_meta.json). The home-advantage model needs it for every
-- nation that may appear in a fixture.
--
-- Idempotent: only updates rows where confederation IS NULL.

UPDATE countries SET confederation = 'CONMEBOL'
WHERE confederation IS NULL AND name IN (
  'Chile','Peru','Bolivia','Venezuela'
);

UPDATE countries SET confederation = 'CONCACAF'
WHERE confederation IS NULL AND name IN (
  'Honduras','Guatemala','El Salvador','Costa Rica','Nicaragua',
  'Jamaica','Trinidad and Tobago','Haiti','Cuba','Puerto Rico',
  'Curaçao','Bermuda','Antigua and Barbuda','Saint Kitts and Nevis',
  'Saint Lucia','Barbados','Belize','Dominican Republic',
  'Saint Vincent and the Grenadines','Aruba'
);

UPDATE countries SET confederation = 'UEFA'
WHERE confederation IS NULL AND name IN (
  'Albania','Andorra','Armenia','Austria','Azerbaijan','Belarus','Belgium',
  'Bosnia and Herzegovina','Bosnia & Herzegovina','Bulgaria','Croatia',
  'Cyprus','Czech Republic','Czechia','Denmark','Estonia','Finland',
  'France','Georgia','Germany','Gibraltar','Greece','Hungary','Iceland',
  'Ireland','Rep. Of Ireland','Israel','Italy','Kazakhstan','Kosovo',
  'Latvia','Liechtenstein','Lithuania','Luxembourg','Malta','Moldova',
  'Montenegro','Netherlands','North Macedonia','Northern Ireland',
  'Norway','Poland','Romania','Russia','San Marino','Scotland',
  'Serbia','Slovakia','Slovenia','Spain','Sweden','Switzerland',
  'Türkiye','Turkey','Ukraine','Wales'
);

UPDATE countries SET confederation = 'AFC'
WHERE confederation IS NULL AND name IN (
  'Afghanistan','Australia','Bahrain','Bangladesh','Bhutan','Brunei',
  'Cambodia','China','Chinese Taipei','Guam','Hong Kong','India',
  'Indonesia','Iran','Iraq','Jordan','Kuwait','Kyrgyzstan','Laos',
  'Lebanon','Macau','Malaysia','Maldives','Mongolia','Myanmar','Nepal',
  'North Korea','Oman','Pakistan','Palestine','Philippines','Singapore',
  'South Korea','Sri Lanka','Syria','Tajikistan','Thailand','Timor-Leste',
  'Turkmenistan','United Arab Emirates','Uzbekistan','Vietnam','Yemen'
);

UPDATE countries SET confederation = 'CAF'
WHERE confederation IS NULL AND name IN (
  'Algeria','Angola','Benin','Botswana','Burkina Faso','Burundi','Cameroon',
  'Central African Republic','Chad','Comoros','Congo','Côte d''Ivoire',
  'Djibouti','Equatorial Guinea','Eritrea','Eswatini','Ethiopia','Gabon',
  'Gambia','Ghana','Guinea','Guinea-Bissau','Kenya','Lesotho','Liberia',
  'Libya','Madagascar','Malawi','Mali','Mauritania','Mauritius','Mozambique',
  'Namibia','Niger','Nigeria','Rwanda','São Tomé and Príncipe','Seychelles',
  'Sierra Leone','Somalia','South Africa','South Sudan','Sudan','Tanzania',
  'Togo','Uganda','Zambia','Zimbabwe'
);

UPDATE countries SET confederation = 'OFC'
WHERE confederation IS NULL AND name IN (
  'American Samoa','Cook Islands','Fiji','New Caledonia','Papua New Guinea',
  'Samoa','Solomon Islands','Tahiti','Tonga','Vanuatu'
);
