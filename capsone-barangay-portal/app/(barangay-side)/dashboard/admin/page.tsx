"use client"
import React,{useState, useEffect, ChangeEvent} from "react";
import {db} from "../../../db/firebase";
import {collection, getDocs, query, where} from "firebase/firestore";

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
    /*add search and filter func */
    const [users, setUsers] = useState<BarangayUser>({
        userId:"",
        position:"",
        password:"",
        role:"barangay official"
    });
    const [barangayUsers, setBarangayUsers] = useState<dbBarangayUser[]>([]);
    const [residentUsers, setResidentUsers] = useState<ResidentUser[]>([]);
    useEffect(()=>{
       
            const fetchUsers = async() => {
                try{
                const barangayCollection = collection(db, "BarangayUsers");
                const BarangaySnapshot = await getDocs(barangayCollection);
                const barangayData: dbBarangayUser[] = BarangaySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as dbBarangayUser[];
    
                const residentCollection = collection(db, "ResidentUsers");
                const ResidentSnapshot = await getDocs(residentCollection);
                const residentData: ResidentUser[] = ResidentSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as ResidentUser[];
    
                setBarangayUsers(barangayData);
                setResidentUsers(residentData);
                BarangaySnapshot.docs.forEach((doc) => {
                    console.log("Raw Firestore Document:", doc.data());
                });
                
                
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
                    createdBy: "asst_sec"
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
                role:"barangay official"
            })
        }
        catch(error: string | any){
            console.log(error.message);
        }
    
    }



    return (  
        <div>
            <h1>Admin Module</h1>
            <h2>Resident Users Table</h2> 
            <div className="border border-black p-4 h-80 overflow-y-scroll">
                <table className="w-full border-collapse">
                    <thead>
                    <tr>
                        <th className="border border-gray-300 p-2">ID</th>
                        <th className="border border-gray-300 p-2">Name</th>
                        <th className="border border-gray-300 p-2">Address</th>
                        <th className="border border-gray-300 p-2">Phone</th>
                        <th className="border border-gray-300 p-2">Sex</th>
                        <th className="border border-gray-300 p-2">Status</th>
                        <th className="border border-gray-300 p-2">Valid ID Doc</th>
                        <th className="border border-gray-300 p-2">Role</th>
                        <th className="border border-gray-300 p-2">Email</th>
                        <th className="border border-gray-300 p-2">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {residentUsers.map((user) => (
                        <tr key={user.id}>
                        <td className="border border-gray-300 p-2 text-center">{user.id}</td>
                        <td className="border border-gray-300 p-2 text-center">{user.first_name} {user.last_name}</td>
                        <td className="border border-gray-300 p-2 text-center">{user.address}</td>
                        <td className="border border-gray-300 p-2 text-center">{user.phone}</td>
                        <td className="border border-gray-300 p-2 text-center">{user.sex}</td>
                        <td className="border border-gray-300 p-2 text-center">{user.status}</td>
                        <td className="border border-gray-300 p-2 text-center">{user.validIdDoc}</td>
                        <td className="border border-gray-300 p-2 text-center">{user.role}</td>
                        <td className="border border-gray-300 p-2 text-center">{user.email}</td>
                        <td className="border border-gray-300 p-2 text-center">
                            <button className="bg-green-500 text-white px-4 py-2  rounded">Accept</button>
                            <button className="bg-red-500 text-white px-4 py-2 ml-1 rounded">Reject</button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                  
                </table>
            </div>
            <h2>Barangay Users Table</h2>
            <div className="border border-black p-4 h-80 overflow-y-scroll">
                <table className="w-full border-collapse">
                    <thead>
                    <tr>
                        <th className="border border-gray-300 p-2">User ID</th>
                        <th className="border border-gray-300 p-2">Official Name</th>
                        <th className="border border-gray-300 p-2">Sex</th>
                        <th className="border border-gray-300 p-2">Birth Date</th>
                        <th className="border border-gray-300 p-2">Address</th>
                        <th className="border border-gray-300 p-2">Phone</th>
                        <th className="border border-gray-300 p-2">Position</th>
                        <th className="border border-gray-300 p-2">Created By</th>
                        <th className="border border-gray-300 p-2">Created At</th>
                        <th className="border border-gray-300 p-2 ">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {barangayUsers.map((user) => (
                        <tr key={user.id}>
                        <td className="border border-gray-300 p-2 text-center">{user.userid}</td>
                        <td className="border border-gray-300 p-2 text-center">{user.firstName} {user.lastName}</td>
                        <td className="border border-gray-300 p-2 text-center">{user.sex}</td>
                        <td className="border border-gray-300 p-2 text-center">{user.birthDate}</td>
                        <td className="border border-gray-300 p-2 text-center">{user.address}</td>
                        <td className="border border-gray-300 p-2 text-center">{user.phone}</td>
                        <td className="border border-gray-300 p-2 text-center">{user.position}</td>
                        <td className="border border-gray-300 p-2 text-center">{user.createdBy}</td>
                        <td className="border border-gray-300 p-2 text-center">{user.createdAt}</td>
                        <td className="border flex  border-gray-300 p-2 justify-center">
                            <button className="bg-red-500 text-white px-4 py-2  rounded">Delete</button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                  
                </table>
            </div>       
            <form onSubmit={handleSubmit} className=" flex flex-col  justify-center">
                <label htmlFor="username">User ID: </label>
                <input type="text"  id="username"  className="border-2 border-black" value={users.userId} disabled  required/>
                <label htmlFor="roles">Role:</label>
                <select  value={users.position}  onChange={handleChange} id="roles" name="position" className="border-2 border-black" >
                    <option value="" disabled>Select a Role</option>
                    <option value="punong_barangay">Punong Barangay</option>
                    <option value="secretary">Secretary</option>
                    <option value="asst_sec">Asst Secretary</option>
                    <option value="admin_staff">Admin Staff</option>
                    <option value="lf_staff">LF Staff</option>
                </select>
                <label htmlFor="password">Password: </label>
                <input value={users.password} onChange={handleChange} id="password" type="password" name="password" className="border-2 border-black" required/>
                <button   onClick={GenerateID} className="bg-blue-500 text-white  mb-3 mt-3">Generate User ID</button>
                <button   className="bg-blue-500 text-white">Create New Barangay User</button>
            </form>
        </div>

    );
}
 
export default admin;