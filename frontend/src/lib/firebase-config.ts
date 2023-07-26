// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth, isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink, signOut } from "firebase/auth";
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, query, setDoc, where } from "firebase/firestore";
import { Election, ElectionStoreResult } from "./types";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];


export function sendOneTimeLink(email: string, redirectTo: string): Promise<[string, boolean]> {
    const actionCodeSettings = {
        url: redirectTo,
        handleCodeInApp: true,
    };
    console.log(redirectTo)
    const auth = getAuth();
    return new Promise((resolve, reject) => {
        sendSignInLinkToEmail(auth, email, actionCodeSettings)
            .then(() => {
                // The link was successfully sent. Inform the user.
                // Save the email locally so you don't need to ask the user for it again
                // if they open the link on the same device.
                window.localStorage.setItem('emailForSignIn', email);

                resolve(["Authentication link sent", true]);
            })
            .catch((error) => {
                reject([error.message, false]);
            });
    })
}

export async function completeSignIn(): Promise<boolean> {
    console.log("CHECK ONE TIME LINK")
    const auth = getAuth(firebaseApp);
    if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
            email = window.prompt('Please provide your email for confirmation');
        }
        try {
            if (!email) return false;
            const result = await signInWithEmailLink(auth, email, window.location.href)
            if (result) {
                window.localStorage.removeItem('emailForSignIn');
                console.log(result);
                return true;
            }
            return false;
        } catch (error) {
            console.error(error);
        }
    }
    return false;
}

export async function userSignOut(): Promise<void> {
    const auth = getAuth(firebaseApp);
    try {
        await signOut(auth);
    } catch (error) {
        console.error(error);
    }
}

const db = getFirestore(firebaseApp);
const votingRef = collection(db, "evoting");
const voterKeyRef = collection(db, "voterKey");

export async function saveElection(election: Election) {
    try {
        const docRef = doc(votingRef, election.id);
        await setDoc(docRef, election, { merge: true });
        console.log("Document written with ID: ", election.id);
    } catch (error) {
        console.error(error);
    }
}

export async function saveVoterKey(email: string, address: string, key: string) {
    try {
        const voterKeyDocRef = doc(voterKeyRef, email);
        await setDoc(voterKeyDocRef, { email, address, key }, { merge: true });
        console.log("Document upserted for email: ", email);
    } catch (error) {
        console.error(error);
    }
}

export async function getVoterKey(email: string): Promise<[string, boolean]> {
    const voterKeyDocRef = doc(voterKeyRef, email);
    const docSnap = await getDoc(voterKeyDocRef);
    if (docSnap.exists()) {
        return [docSnap.data().key, true];
    }
    return ["Email not found", false];
}

export async function getVoterAddress(email: string): Promise<[string, boolean]> {
    const voterAddressDocRef = doc(voterKeyRef, email);
    const docSnap = await getDoc(voterAddressDocRef);
    if (docSnap.exists()) {
        return [docSnap.data().address, true];
    }
    return ["Email not found", false];
}

export async function getElectionById(uuid: string): Promise<Election | null> {
    const q = query(votingRef, where("id", "==", uuid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;

    const election = querySnapshot.docs[0]?.data();
    console.log("Off-chain: ", election);
    const { id, title, electionIndex } = election;
    const totalVoters = election.voterEmails.length;
    return { id, title, electionIndex, totalVoters};
}

export async function getElectionsByEmail(email: string): Promise<ElectionStoreResult[]> {
    const q = query(votingRef, where("voterEmails", "array-contains", email));
    const querySnapshot = await getDocs(q);
    let result: ElectionStoreResult[] = [];
    querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        console.log(doc.id, " => ", doc.data());
        result.push({
            docId: doc.id,
            id: doc.data().id,
            title: doc.data().title,
            // voterEmails: doc.data().voterEmails,
            electionIndex: doc.data().electionIndex
        });
    });
    return result;
}

export default firebaseApp;