import { gql } from '@apollo/client';

export const PREDICT_MATCH = gql`
  query PredictMatch($homeTeam: String!, $awayTeam: String!) {
    predictMatch(homeTeam: $homeTeam, awayTeam: $awayTeam) {
      homeWin
      draw
      awayWin
      models {
        name
        homeWin
        draw
        awayWin
      }
    }
  }
`;

export const GET_FIXTURES = gql`
  query GetFixtures(
    $competition: String
    $team: String
    $status: String
    $limit: Int
  ) {
    fixtures(
      competition: $competition
      team: $team
      status: $status
      limit: $limit
    ) {
      id
      homeTeam
      awayTeam
      homeScore
      awayScore
      status
      matchDate
      competition
      matchday
    }
  }
`;

export const GET_PLAYERS = gql`
  query GetPlayers(
    $query: String
    $position: String
    $club: String
    $limit: Int
  ) {
    players(query: $query, position: $position, club: $club, limit: $limit) {
      id
      name
      position
      club
      nationality
      age
      rating
    }
  }
`;

export const GET_LEAGUE_STANDINGS = gql`
  query GetLeagueStandings($competition: String!) {
    leagueStandings(competition: $competition) {
      position
      team
      played
      won
      drawn
      lost
      goalsFor
      goalsAgainst
      goalDifference
      points
    }
  }
`;

export const GET_POLLA_GROUPS = gql`
  query MyPollaGroups {
    myPollaGroups {
      id
      name
      competition
      description
      inviteCode
      memberCount
      createdAt
    }
  }
`;

export const GET_LEADERBOARD = gql`
  query GetLeaderboard($groupId: ID!) {
    pollaLeaderboard(groupId: $groupId) {
      userId
      displayName
      points
      rank
      correctPredictions
      totalPredictions
    }
  }
`;

export const GET_BET_TYPES = gql`
  query BetTypes {
    betTypes {
      slug
      name
      description
      options
    }
  }
`;
