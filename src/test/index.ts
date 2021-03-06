import { createTestClient } from "apollo-server-testing"
import { ApolloServer } from "apollo-server-express"
import { readFileSync } from "fs"
import resolvers from "resolvers"
import DB from "config/connectDB"
import { commentsLoader, usersLoader } from "lib"
const typeDefs = readFileSync("src/typeDefs.graphql", "utf-8")

const serverConfig = {
    typeDefs,
    resolvers,
    context: async () => {
        return {
            token: "test",
            db: await DB.get(),
            loaders: {
                commentsLoader: commentsLoader(),
                usersLoader: usersLoader()
            }
        }
    }
}

const testServer = new ApolloServer({
    ...serverConfig
})

const client = createTestClient(testServer)
export default client