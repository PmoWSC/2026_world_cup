const search_players = require("./search_players");
const get_squad = require("./get_squad");
const predict_match = require("./predict_match");
const find_connections = require("./find_connections");
const get_head_to_head = require("./get_head_to_head");
const get_fixtures = require("./get_fixtures");
const get_tentacle_factors = require("./get_tentacle_factors");
const get_group_standings = require("./get_group_standings");
const semantic_search = require("./semantic_search");
const get_live_scores = require("./get_live_scores");
const get_league_standings = require("./get_league_standings");

module.exports = {
  search_players,
  get_squad,
  predict_match,
  find_connections,
  get_head_to_head,
  get_fixtures,
  get_tentacle_factors,
  get_group_standings,
  semantic_search,
  get_live_scores,
  get_league_standings,
};
