const { predictMatch } = require("../../prediction");

const predictionResolvers = {
  Query: {
    async predictMatch(_parent, { homeTeam, awayTeam }) {
      const result = await predictMatch(homeTeam, awayTeam);
      return {
        homeWin: result.homeWin,
        draw: result.draw,
        awayWin: result.awayWin,
        models: result.models,
      };
    },
  },
};

module.exports = predictionResolvers;
