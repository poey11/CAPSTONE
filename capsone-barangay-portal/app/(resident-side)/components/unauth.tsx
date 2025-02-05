"use client"
import { redirect } from "next/navigation";
import {db} from '@/app/db/firebase'
import { collection, query, where, getDocs } from "firebase/firestore";

interface prop {
    cookies: string;
    problem: string;
}


const unauthPage: React.FC<prop> = ({cookies, problem}) => {
	return (
		<div>
			<h1>Unauth Page</h1>
            {cookies}
            {problem}

		</div>
	);
}

export default unauthPage;
