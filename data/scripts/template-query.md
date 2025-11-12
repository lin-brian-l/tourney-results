query TriPointProjectPlusEvents($perPage: Int!, $page: Int!, $searchTerm: String!, $videogameId: ID!) {
    tournaments(query: {
      perPage: $perPage,
      page: $page,
      filter: {
        name: $searchTerm
      }
    }) {
      nodes {
        id
        name
        slug
        startAt
        endAt
        events(filter: {
          videogameId: [$videogameId]
        }) {
          id
          name
          slug
          startAt
          numEntrants
          state
          standings(query: { page: 1, perPage: 8 }) {
            nodes {
              placement
              entrant {
                name
              }
            }
          }
        }
      }
      pageInfo {
        totalPages
        page
        perPage
      }
    }
  }

# Variables

{
  "searchTerm":"Tripoint",
  "videogameId": 33602,
  "perPage": 25,
  "page":4
}