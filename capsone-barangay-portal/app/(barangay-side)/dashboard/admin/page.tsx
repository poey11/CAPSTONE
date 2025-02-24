"use client"
import React,{useState, useEffect, ChangeEvent} from "react";
import {db} from "../../../db/firebase";
import {collection, getDocs, onSnapshot, query, where} from "firebase/firestore";
import "@/CSS/User&Roles/User&Roles.css";
import { useRouter } from "next/navigation";
interface ResidentUser {
    id: string;
    first_name: string;
    last_name: string;
    address: string;
    phone: string;
    sex:string;
    status:string;
    validIdDoc:string;
    role: string;
    email: string;
  }
  
interface BarangayUser{
    id?: string;
    userId: string;
    position:string,
    password:string;
    role: string;
}

interface dbBarangayUser{
    id: string;
    userid: string;
    position:string,
    password:string;
    role: string;
    createdBy: string;
    createdAt: string;
    address: string;
    phone: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    sex: string;
}

const admin = () => {
    /*Kulang pa search and filter, downloadable/viewable ID pic column, and table actions are not yet working */
    const [users, setUsers] = useState<BarangayUser>({
        userId:"",
        position:"",
        password:"",
        role:"Barangay Official"
    });
    const [barangayUsers, setBarangayUsers] = useState<dbBarangayUser[]>([]);
    const [residentUsers, setResidentUsers] = useState<ResidentUser[]>([]);
    useEffect(()=>{
       
            const fetchUsers = async() => {
                try{
                const barangayCollection = collection(db, "BarangayUsers");
                const unsubscribeBarangay = onSnapshot(barangayCollection, (snapshot) => {
                    const barangayData: dbBarangayUser[] = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as dbBarangayUser[];
                    setBarangayUsers(barangayData);
                });
            


                const residentCollection = collection(db, "ResidentUsers");
                const unsubscribeResidents = onSnapshot(residentCollection, (snapshot) => {
                    const residentData: ResidentUser[] = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as ResidentUser[];
                    setResidentUsers(residentData);
                });
           
                
                 // Cleanup function to unsubscribe when component unmounts
                return () => {
                    unsubscribeBarangay();
                    unsubscribeResidents();
                };
                
            }
            catch(error:String|any){
                console.log(error.message);
            
            }
        }
        fetchUsers();           
    },[])

    const GenerateID = async (e: any) => {
        e.preventDefault();
        
        const generateNewID = async (): Promise<string> => {
            const year = new Date().getFullYear().toString(); // First 4 digits
            const randomNum = Math.floor(100 + Math.random() * 900).toString(); // Ensures 3-digit number (100-999)
            const randomId = year + randomNum; // Concatenates to make 7 digits
    
            // ✅ Check Firestore if the ID already exists
            const barangayUsersCollection = collection(db, "BarangayUsers");
            const querySnapshot = await getDocs(query(barangayUsersCollection, where("userId", "==", randomId)));
    
            if (!querySnapshot.empty) {
                console.log(`ID ${randomId} already exists, regenerating...`);
                return generateNewID(); // 🔄 Recursively call the function if ID exists
            }
    
            return randomId; // ✅ Unique ID found
        };
    
        const uniqueId = await generateNewID(); // Wait for a unique ID to be generated
    
        setUsers((prevUsers) => ({
            ...prevUsers,
            userId: uniqueId,
        }));
    
    };


    const handleChange = (  e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>)=>{
        e.preventDefault();
      
        const {name, value} = e.target;
        setUsers((prevUsers) => ({
            ...prevUsers,
            [name]: value
        }));
    }



    const handleSubmit = async(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if(!users.userId || !users.password || !users.position){
            alert("Please fill out all fields");
            return;
        }
        
        console.log(users);
        
        try{
            const respone = await fetch('/api/barangayRegister', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userid: users.userId,
                    password: users.password,
                    role: users.role,
                    position: users.position,
                    createdBy: "Assistant Secretary"
                })
            });
            const data = await respone.json();

            if(!respone.ok){
                console.log(data.message);
                return;
            }
            alert(data.message);

            setUsers({
                userId:"",
                position:"",
                password:"",
                role:"Barangay Official"
            })
        }
        catch(error: string | any){
            console.log(error.message);
        }
        
   }

   const router = useRouter();
   
   const handleEditBrgyAcc = () => {
    router.push("/dashboard/admin/modifyBarangayAcc");
  };


    return (  
        <main className="main-container">
            <div className="section-1">
                <h1>Admin Module</h1>
            </div>

            <div className="main-section">

                <div className="resident-users">
                    <h1>Resident Users Table</h1>

                    <div className="resident-users-main-section">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Address</th>
                                    <th>Phone</th>
                                    <th>Sex</th>
                                    <th>Status</th>
                                    <th>Valid ID Doc</th>
                                    <th>Role</th>
                                    <th>Email</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {residentUsers.map((user) => (
                                    <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.first_name} {user.last_name}</td>
                                    <td>{user.address}</td>
                                    <td>{user.phone}</td>
                                    <td>{user.sex}</td>
                                    <td>{user.status}</td>
                                    <td>{user.validIdDoc}</td>
                                    <td>{user.role}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <div className="actions">
                                            <button className="action-accept">Accept</button>
                                            <button className="action-reject">Reject</button>
                                        </div>
                                    </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="barangay-users">
                    <h1>Barangay Users Table</h1>

                    <div className="barangay-users-main-section">
                        <table>
                            <thead>
                                <tr>
                                    <th>User ID</th>
                                    <th>Official Name</th>
                                    <th>Sex</th>
                                    <th>Birth Date</th>
                                    <th>Address</th>
                                    <th>Phone</th>
                                    <th>Position</th>
                                    <th>Created By</th>
                                    <th>Created At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {barangayUsers.map((user) => (
                                    <tr key={user.id}>
                                    <td>{user.userid}</td>
                                    <td>{user.firstName} {user.lastName}</td>
                                    <td>{user.sex}</td>
                                    <td>{user.birthDate}</td>
                                    <td>{user.address}</td>
                                    <td>{user.phone}</td>
                                    <td>{user.position}</td>
                                    <td>{user.createdBy}</td>
                                    <td>{user.createdAt}</td>
                                    <td>
                                        <div className="actions">
                                            <button className="action-modify" onClick={handleEditBrgyAcc}>Modify</button>
                                            <button className="action-delete">Delete</button>
                                        </div>
                                    </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="create-new-barangay-user">
                    <form onSubmit={handleSubmit}>
                        <h1>Barangay Users Table</h1>
                        <div className="fields-container">
                            <div className="fields-section">
                                <label htmlFor="username">User ID: </label>
                                <input 
                                    type="text" 
                                    id="username"
                                    className="userID" 
                                    value={users.userId} 
                                    disabled  
                                    required
                                />
                            </div>
                        </div>
                        <div className="fields-container">
                            <div className="fields-section">
                                <label htmlFor="roles">Role:</label>
                                <select  value={users.position}  onChange={handleChange} id="roles" name="position" className="role" >
                                    <option value="" disabled>Select a Role</option>
                                    <option value="Punong Barangay">Punong Barangay</option>
                                    <option value="Secretary">Secretary</option>
                                    <option value="Assistant Secretary">Asst Secretary</option>
                                    <option value="Admin Staff">Admin Staff</option>
                                    <option value="LF Staff">LF Staff</option>
                                </select>
                            </div>
                        </div>
                        <div className="fields-container">
                            <div className="fields-section">
                                <label htmlFor="password">Password: </label>
                                <input 
                                    value={users.password} 
                                    onChange={handleChange} 
                                    id="password" 
                                    type="password" 
                                    name="password" 
                                    className="password" 
                                    required
                                />
                            </div>
                        </div>
                        <div className="actions-section">
                            <button onClick={GenerateID} className="generateUserID">Generate User ID</button>
                            <button className="createNewBarangayUser">Create New Barangay User</button>
                        </div>
                        
                    </form>
                </div>
            </div>
        </main>

    );
}
 
export default admin;