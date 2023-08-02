import { ConsumerType } from "custom";
import { User } from "../models";
import { consumerCollection } from "./initDb";

export async function getCurrentUserCount(){
    const userCount= (await consumerCollection.get()).docs.length;
    return Number(userCount.toString().padEnd(5,'0'))
}
export async function createConsumer(user: User) {

    const addedConsumer = await consumerCollection.add(user);
    if (addedConsumer) {
        return addedConsumer.id;
    } else {
        return null;
    }

}
