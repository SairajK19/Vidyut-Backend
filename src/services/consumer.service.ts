import { ConsumerType } from "custom";
import { User } from "../models";
import { consumerCollection } from "./initDb";

export async function getCurrentUserCount() {
    const userCount = (await consumerCollection.get()).docs.length;
    // return Number(userCount.toString().padEnd(5,'0'))

    return userCount;
}

export async function userAlreadyExist(fullName:string,phoneNumber:Number) {
    const user = (await consumerCollection.where("fullName","==",fullName).where("phoneNumber","==",phoneNumber).get()).docs[0].data()
    if (user){
        return true;
    }else{
        return false;
    }
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
