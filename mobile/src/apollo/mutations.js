import { gql } from '@apollo/client';

export const CHAT_MUTATION = gql`
  mutation Chat($message: String!, $language: String, $sessionId: String) {
    chat(message: $message, language: $language, sessionId: $sessionId) {
      message
      visualization {
        type
        data
      }
      remaining_messages
      reset_at
    }
  }
`;

export const REGISTER = gql`
  mutation Register(
    $email: String!
    $password: String!
    $displayName: String!
  ) {
    register(email: $email, password: $password, displayName: $displayName) {
      token
      refreshToken
      user {
        id
        email
        displayName
      }
    }
  }
`;

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      refreshToken
      user {
        id
        email
        displayName
      }
    }
  }
`;

export const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      token
      refreshToken
      user {
        id
        email
      }
    }
  }
`;

export const CREATE_POLLA_GROUP = gql`
  mutation CreatePollaGroup(
    $name: String!
    $competition: String!
    $description: String
  ) {
    createPollaGroup(
      name: $name
      competition: $competition
      description: $description
    ) {
      id
      name
      competition
      description
      inviteCode
    }
  }
`;

export const JOIN_POLLA_GROUP = gql`
  mutation JoinPollaGroup($inviteCode: String!) {
    joinPollaGroup(inviteCode: $inviteCode) {
      id
      name
      competition
    }
  }
`;

export const PLACE_BET = gql`
  mutation PlaceBet(
    $groupId: ID!
    $betTypeSlug: String!
    $fixtureId: ID!
    $prediction: String!
  ) {
    placeBet(
      groupId: $groupId
      betTypeSlug: $betTypeSlug
      fixtureId: $fixtureId
      prediction: $prediction
    ) {
      id
      groupId
      betTypeSlug
      fixtureId
      prediction
      createdAt
    }
  }
`;
