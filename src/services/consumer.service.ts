import { ConsumerType } from "custom";
import { User } from "../models";
import { consumerCollection } from "./initDb";

export async function getCurrentUserCount(){
    const userCount= (await consumerCollection.get()).docs.length;
    // return Number(userCount.toString().padEnd(5,'0'))

    return userCount;
}
export async function createConsumer(user: User): Promise<string> {

    const addedConsumer = await consumerCollection.add(user);
    console.log(`ConsumerId: ${addedConsumer.id}`)
    if (addedConsumer) {
        return addedConsumer.id;
    } else {
        return null;
    }

}
