import { complaintCollection, consumerCollection } from "./initDb";
import { Complaint, User, UserApplicationStatus } from "../models";

export type ConsumerFetchDetails= {
    meterNumber: Number,
    phoneNumber: Number,
    fullName: string,
    consumerType: string,
    consumerId: string,
    approved: boolean
    status: UserApplicationStatus
}

export async function fetchComplaints(): Promise<
    Array<Complaint>
> {
    const complaintSnapshot = await complaintCollection.get();
    const complaints: Array<Complaint> = [];
    console.log(`Total Complaints: ${complaintSnapshot.size}`)

    complaintSnapshot.forEach((cmptDoc) => {
        const complaintData = cmptDoc.data() as Complaint;
        complaints.push({
            description: complaintData.description,
            status: complaintData.status,
            billDocId: complaintData.billDocId,
            consumerDocId: complaintData.consumerDocId
        });
    });
    return complaints;
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
            consumerId: userDoc.id,
            approved: userData.approved,
            status: userData.status
        });
    });
    return users;
}
