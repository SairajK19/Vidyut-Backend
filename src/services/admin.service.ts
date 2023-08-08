import {
  billingCollection,
  complaintCollection,
  consumerCollection,
} from "./initDb";
import { Complaint, User, UserApplicationStatus } from "../models";
import { ConsumerFetchDetails } from "custom";

export async function fetchComplaints(): Promise<Array<Complaint>> {
  const complaintSnapshot = (await complaintCollection.get()).docs;
  const complaints: Array<
    Complaint & { complaintId: string; consumerName: string }
  > = [];
  console.log(`Total Complaints: ${complaintSnapshot.length}`);

  await Promise.all(
    complaintSnapshot.map(async (cmptDoc) => {
      const complaintData = cmptDoc.data() as Complaint;
      const consumer = (
        await consumerCollection.doc(complaintData.consumerDocId).get()
      ).data() as User;
      complaints.push({
        description: complaintData.description,
        status: complaintData.status,
        billDocId: complaintData.billDocId,
        consumerDocId: complaintData.consumerDocId,
        complaintType: complaintData.complaintType,
        complaintId: cmptDoc.id,
        consumerName: consumer.fullName,
      });
    })
  );
  return complaints;
}

export async function fetchConsumer(): Promise<Array<ConsumerFetchDetails>> {
  const usersSnapshot = await consumerCollection.get();
  const users: Array<ConsumerFetchDetails> = [];
  console.log(`Total Consumers: ${usersSnapshot.size}`);

  usersSnapshot.forEach((userDoc) => {
    const userData = userDoc.data() as User;
    users.push({
      meterNumber: userData.meterNumber,
      phoneNumber: userData.phoneNumber,
      fullName: userData.fullName,
      consumerType: userData.consumerType,
      consumerId: userDoc.id,
      approved: userData.approved,
      status: userData.status,
    });
  });
  return users;
}

export async function updateConsumerDetails(
  consumerId: string,
  address: string,
  phoneNumber: number,
  subsidyRate: number,
  sanctionedLoad: number
) {
  console.log(consumerId);
  const updateConsumerDetails = await consumerCollection
    .doc(consumerId)
    .update({
      address,
      phoneNumber,
      subsidyRate,
      sanctionedLoad,
    });

  return updateConsumerDetails;
}
