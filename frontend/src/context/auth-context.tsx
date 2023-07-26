import firebaseApp from "@/lib/firebase-config";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

const auth = getAuth(firebaseApp);

interface UserType {
    email: string | null;
    uid: string | null;
}

export const AuthContext = createContext({});

export const useAuthContext = () => useContext<any>(AuthContext);

export default function AuthContextProvider({ children }: { children: React.ReactNode }) {
    const [voter, setVoter] = useState<UserType>({ email: null, uid: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setVoter({
                    email: user.email,
                    uid: user.uid,
                });
                setLoading(false);
            } else {
                setVoter({ email: null, uid: null });
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ voter, loading }}>
            {children}
        </AuthContext.Provider>
    )
}