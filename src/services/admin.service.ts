import {
  billingCollection,
  complaintCollection,
  consumerCollection,
} from "./initDb";
import { Complaint, User, UserApplicationStatus } from "../models";
import { ConsumerFetchDetails } from "custom";

export async function fetchComplaints(): Promise<Array<Complaint>> {
  const complaintSnapshot = await complaintCollection.get();
  const complaints: Array<Complaint> = [];
  console.log(`Total Complaints: ${complaintSnapshot.size}`);

  complaintSnapshot.forEach((cmptDoc) => {
    const complaintData = cmptDoc.data() as Complaint;
    complaints.push({
      description: complaintData.description,
      status: complaintData.status,
      billDocId: complaintData.billDocId,
      consumerDocId: complaintData.consumerDocId,
    });
  });
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
  meterNumber: number,
  phoneNumber: number,
  subsidyRate: number
) {
  console.log(consumerId);
  const updateConsumerDetails = await consumerCollection
    .doc(consumerId)
    .update({
      meterNumber,
      phoneNumber,
      subsidyRate,
    });

  return updateConsumerDetails;
}
