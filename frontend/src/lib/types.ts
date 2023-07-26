export interface Election {
    id: string;
    title: string;
    electionIndex?: number;
    candidates?: string[];
    startTime?: number;
    endTime?: number;
    voterEmails?: string[];
    totalVoters?: number;
}

export interface ElectionStoreResult extends Election {
    docId: string;
}

export interface Voter {
    email: string,
    secretPhrases: string,
}