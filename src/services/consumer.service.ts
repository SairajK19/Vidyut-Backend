import { User } from "../models";
import { Complaint } from "../models";
import { complaintCollection, consumerCollection } from "./initDb";

export async function getCurrentUserCount() {
  const userCount = (await consumerCollection.get()).docs.length;
  // return Number(userCount.toString().padEnd(5,'0'))

  return userCount;
}

export async function userAlreadyExist(email: string, phoneNumber: Number) {
  try {
    var user = (
      await consumerCollection.where("phoneNumber", "==", phoneNumber).get()
    ).docs;

    if (user.length > 0) {
      return true;
    }

    var user = (await consumerCollection.where("email", "==", email).get())
      .docs;

    if (user.length > 0) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
}

export async function createConsumer(user: User): Promise<string> {
  const addedConsumer = await consumerCollection.add(user);
  console.log(`ConsumerId: ${addedConsumer.id}`);
  if (addedConsumer) {
    return addedConsumer.id;
  } else {
    return null;
  }
}

export async function createComplaint(user: Complaint): Promise<string> {
  const createdComplaint = await complaintCollection.add(user);
  if (createdComplaint) {
    return createdComplaint.id;
  } else {
    return null;
  }
}
