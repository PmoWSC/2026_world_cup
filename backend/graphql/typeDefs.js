const gql = require("graphql-tag");

const typeDefs = gql`
  type Query {
    # Predictions
    predictMatch(homeTeam: String!, awayTeam: String!, competition: String): Prediction

    # Fixtures
    fixtures(
      competition: String
      team: String
      status: String
      dateFrom: String
      dateTo: String
      limit: Int
    ): [Fixture!]!
    liveScores(competition: String): [Fixture!]!

    # Players
    players(
      query: String
      position: String
      club: String
      nationality: String
      limit: Int
    ): [Player!]!
    squad(country: String!, competition: String): [Player!]!

    # Standings
    leagueStandings(competition: String!): [StandingsEntry!]!
    groupStandings(competition: String!, group: String): [StandingsEntry!]!

    # Head to Head
    headToHead(teamA: String!, teamB: String!, competition: String): HeadToHead

    # Connections
    connections(teamA: String!, teamB: String!): [Connection!]!

    # Polla
    myPollaGroups: [PollaGroup!]!
    pollaGroup(id: ID!): PollaGroup
    pollaLeaderboard(groupId: ID!): [LeaderboardEntry!]!
    betTypes: [BetType!]!
  }

  type Mutation {
    # Auth
    register(email: String!, password: String!, displayName: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    refreshToken(refreshToken: String!): AuthPayload!

    # Chat
    chat(message: String!, language: String, sessionId: String): ChatResponse!

    # Polla
    createPollaGroup(name: String!, competition: String!, description: String): PollaGroup!
    joinPollaGroup(inviteCode: String!): PollaGroup!
    placeBet(
      groupId: ID!
      betTypeSlug: String!
      fixtureId: ID
      prediction: JSON!
    ): PollaBet!
    updateBet(betId: ID!, prediction: JSON!): PollaBet!
    leavePollaGroup(groupId: ID!): Boolean!
  }

  # ============================================================
  # Auth Types
  # ============================================================

  type AuthPayload {
    token: String!
    refreshToken: String!
    user: User!
  }

  type User {
    id: ID!
    email: String!
    displayName: String
    avatarUrl: String
    languagePreference: String
    createdAt: String
  }

  # ============================================================
  # Chat Types
  # ============================================================

  type ChatResponse {
    message: String!
    visualization: Visualization
    remaining_messages: Int!
    reset_at: String
  }

  type Visualization {
    type: VisualizationType!
    data: JSON!
  }

  enum VisualizationType {
    PROBABILITY_BARS
    PODIUM_FORECAST
    GROUP_STANDINGS
    LEAGUE_TABLE
    COMPARISON
    FEATURED_MATCHUP
    TOP_PERFORMER
    NETWORK_GRAPH
    MATCH_TIMELINE
    CHRONICLE
    VULNERABILITY_ALERT
    DATA_TABLE
    TENTACLE_FACTORS
    LINE_CHART
  }

  # ============================================================
  # Football Data Types
  # ============================================================

  type Player {
    id: ID!
    name: String!
    fullName: String
    dateOfBirth: String
    nationality: Country
    currentClub: Club
    position: String
    marketValueEur: Float
    imageUrl: String
    shirtNumber: Int
    wcExperienceCount: Int
  }

  type Club {
    id: ID!
    name: String!
    shortName: String
    league: String
    country: Country
    marketValueEur: Float
    crestUrl: String
  }

  type Country {
    id: ID!
    name: String!
    fifaCode: String
    confederation: String
    eloRating: Int
    flagEmoji: String
    flagUrl: String
  }

  type Fixture {
    id: ID!
    competition: Competition
    matchday: Int
    groupName: String
    stage: String
    matchDate: String!
    venue: Venue
    homeTeam: FixtureTeam
    awayTeam: FixtureTeam
    homeScore: Int
    awayScore: Int
    halftimeHomeScore: Int
    halftimeAwayScore: Int
    status: String!
  }

  type FixtureTeam {
    id: ID!
    name: String!
    shortName: String
    crestUrl: String
  }

  type Competition {
    id: ID!
    name: String!
    slug: String!
    type: String!
    season: String
  }

  type Venue {
    id: ID!
    name: String!
    city: String
    country: String
    capacity: Int
  }

  # ============================================================
  # Prediction Types
  # ============================================================

  type Prediction {
    homeWin: Float!
    draw: Float!
    awayWin: Float!
    models: [ModelBreakdown!]!
  }

  type ModelBreakdown {
    name: String!
    homeWin: Float!
    draw: Float!
    awayWin: Float!
  }

  # ============================================================
  # Standings Types
  # ============================================================

  type StandingsEntry {
    position: Int!
    team: FixtureTeam!
    played: Int!
    won: Int!
    drawn: Int!
    lost: Int!
    goalsFor: Int!
    goalsAgainst: Int!
    goalDifference: Int!
    points: Int!
  }

  # ============================================================
  # Head to Head / Connections
  # ============================================================

  type HeadToHead {
    teamA: String!
    teamB: String!
    totalMatches: Int!
    teamAWins: Int!
    teamBWins: Int!
    draws: Int!
    matches: [HistoricalMatch!]!
  }

  type HistoricalMatch {
    date: String!
    competition: String
    homeTeam: String!
    awayTeam: String!
    homeScore: Int!
    awayScore: Int!
  }

  type Connection {
    type: String!
    description: String!
    playerA: String
    playerB: String
    club: String
    details: String
  }

  # ============================================================
  # Polla Types
  # ============================================================

  type PollaGroup {
    id: ID!
    name: String!
    description: String
    createdBy: User
    inviteCode: String!
    competition: String!
    isActive: Boolean!
    maxMembers: Int!
    memberCount: Int
    members: [PollaMember!]
    createdAt: String
  }

  type PollaMember {
    id: ID!
    user: User!
    role: String!
    joinedAt: String
  }

  type BetType {
    id: ID!
    slug: String!
    nameKey: String!
    descriptionKey: String
    category: String!
    pointsCorrect: Int!
    pointsPartial: Int!
    isActive: Boolean!
  }

  type PollaBet {
    id: ID!
    groupId: ID!
    userId: ID!
    betType: BetType!
    fixtureId: ID
    prediction: JSON!
    pointsEarned: Int!
    status: String!
    lockedAt: String
    createdAt: String
  }

  type LeaderboardEntry {
    userId: ID!
    displayName: String!
    avatarUrl: String
    totalPoints: Int!
    exactPredictions: Int!
    partialPredictions: Int!
    totalResolved: Int!
    rank: Int!
  }

  # ============================================================
  # Scalars
  # ============================================================

  scalar JSON
`;

module.exports = typeDefs;
