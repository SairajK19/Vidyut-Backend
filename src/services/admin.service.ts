import { consumerCollection } from "./initDb";
import { User } from "../models";

export type ConsumerFetchDetails= {
    meterNumber: Number,
    phoneNumber: Number,
    fullName: string,
    consumerType: string,
    consumerId: string
}

export async function fetchConsumer(): Promise<
    Array<ConsumerFetchDetails>
> {
    const usersSnapshot = await consumerCollection.get();
    const users: Array<ConsumerFetchDetails> = [];
    console.log(`Total Consumers: ${usersSnapshot.size}`)

    usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data() as User;
        users.push({
            meterNumber: userData.meterNumber,
            phoneNumber: userData.phoneNumber,
            fullName: userData.fullName,
            consumerType: userData.consumerType,
            consumerId: userDoc.id
        });
    });
    return users;
}
