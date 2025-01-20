"use client";

import {createContext, useContext, useEffect, useState} from 'react';
import { onAuthStateChanged,User } from 'firebase/auth';
import { auth } from '../db/firebase';
/* This enable all the webpage to get the auth session from any webpages by using the useAuth*/
interface AuthContextType {
    user: User | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null, 
    loading: true
});

export const AuthProvider= ({children}: {children: React.ReactNode}) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        
        return unsubscribe;
    }, []);
    
    return (
        <AuthContext.Provider value={{user, loading}}>
            {children}
        </AuthContext.Provider>
    );
}
export const useAuth = () => useContext(AuthContext);