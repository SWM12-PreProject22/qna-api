import { ApolloError } from "apollo-server-errors"
import { ObjectId, Db } from "mongodb"
import env from "config/env"

export default {
    addTopic: async (
        parent: void, {
            title,
            mentor,
            description,
            creator,
            count
        }: {
            title: string,
            mentor: string,
            description: string,
            creator: string,
            count: number
        }, {
            db,
            token
        }: {
            db: Db,
            token: string
        }
    ) => {
        if (token !== env.token) {
            throw new ApolloError("API KEY가 유효하지 않습니다.")
        }
        const result = await db.collection("topic").insertOne({
            title,
            description,
            mentor,
            creator,
            count
        }).then(({ ops }) => ops[0])

        return await db.collection("user").insertOne({
            id: creator,
            topicId: result._id
        }).then(({ result }) => result.n === 1 ? true : false)
    },

    closeTopic: async (parent: void, { id }: { id: string }, { db, token }: { db: Db, token: string }) => {
        if (token !== env.token) {
            throw new ApolloError("API KEY가 유효하지 않습니다.")
        }
        try {
            const _id = new ObjectId(id)
            await Promise.all([
                db.collection("topic").deleteMany({ _id }),
                db.collection("user").deleteMany({ topicId: _id })
            ])
            return true
        } catch {
            throw new ApolloError("id가 ObjectId가 아닙니다.")
        }
    },

    signTopic: async (
        parent: void, {
            topicId,
            applicant
        }: {
            topicId: string,
            applicant: string
        }, {
            db,
            token
        }: {
            db: Db,
            token: string
        }
    ) => {
        if (token !== env.token) {
            throw new ApolloError("API KEY가 유효하지 않습니다.")
        }
        try {
            const postId = new ObjectId(topicId)
            const qna = await db.collection("topic").findOne({ _id: postId })
            if (qna === null) {
                throw new ApolloError("", "null")
            }
            const result = await db.collection("user").find({
                topicId: postId
            }).toArray()
            result.forEach((user) => {
                if (user.id === applicant) {
                    throw new ApolloError("")
                }
            })
            if (result.length >= qna.count) {
                throw new ApolloError("", "max")
            }
            await db.collection("user").insertOne({
                topicId: postId,
                id: applicant
            })
            return qna
        } catch (err) {
            if ("extensions" in err) {
                if (err.extensions.code === "null") {
                    throw new ApolloError("해당 게시글이 존재하지 않습니다.")
                }
                else if (err.extensions.code === "max") {
                    throw new ApolloError("해당 멘토링 모집의 인원이 마감되었습니다.")
                }
                else {
                    throw new ApolloError("이미 신청한 유저입니다.")
                }
            }
            throw new ApolloError("topicId가 ObjectId가 아닙니다.")
        }
    },

    cancelTopic: async (
        parent: void, {
            topicId,
            applicant
        }: {
            topicId: string,
            applicant: string
        }, {
            db,
            token
        }: {
            db: Db,
            token: string
        }) => {
        if (token !== env.token) {
            throw new ApolloError("API KEY가 유효하지 않습니다.")
        }
        try {
            return await db.collection("user").deleteOne({
                topicId: new ObjectId(topicId),
                id: applicant
            }).then(({ result }) => result.n === 1 ? true : false)
        } catch {
            throw new ApolloError("topicId가 ObjectId가 아닙니다.")
        }
    }
}