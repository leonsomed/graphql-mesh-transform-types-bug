import { Resolvers } from './.mesh';

export const resolvers: Resolvers = {
  Query: {
    async viewsInPastMonth() {
      return 10;
    },
  },
};
