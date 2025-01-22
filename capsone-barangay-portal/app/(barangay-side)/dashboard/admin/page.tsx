"use client"
import React,{useState, useEffect} from "react";
import {db} from "../../../db/firebase";
import {collection, getDocs} from "firebase/firestore";

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
    userId: string;
    role:string;
}
const admin = () => {
    /* for the reside user table: there should be a button where you can press to accept button and the status should change to verified. 
    the buttons should tube disabled if the stas is already verified. and the reject button is pressed should be pressed, a reason be given and be sent to the email of the User    
    the valid id column should have a downloadable link for the pic to check if its valid? not sure yet on what to here.
    will continue later the creation for the barangay user account */
    const [users, setUsers] = useState<string>("");
    const [barangayUsers, setBarangayUsers] = useState<BarangayUser[]>([]);
    const [residentUsers, setResidentUsers] = useState<ResidentUser[]>([]);
    useEffect(()=>{
       
            const fetchUsers = async()=>{
                try{
                const barangayCollection = collection(db, "BarangayUsers");
                const BarangaySnapshot = await getDocs(barangayCollection);
                const barangayData: BarangayUser[] = BarangaySnapshot.docs.map((doc) => ({
                    userId: doc.id,
                    ...doc.data(),
                })) as BarangayUser[];
    
                const residentCollection = collection(db, "ResidentUsers");
                const ResidentSnapshot = await getDocs(residentCollection);
                const residentData: ResidentUser[] = ResidentSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as ResidentUser[];
    
                setBarangayUsers(barangayData);
                setResidentUsers(residentData);
                
            }
            catch(error:String|any){
                console.log(error.message);
                console.log(barangayUsers);
                console.log(residentUsers);
            }
        }
        console.log(barangayUsers);
        console.log(residentUsers);
        fetchUsers();
           
    },[])

    const GenerateID =(e:any)=>{
        e.preventDefault();
        // Generate 8 random integers that do not exist in Firestore
      const newIds = new Set<string>();
      while (newIds.size < 7) {
        const randomId = Math.floor(1000000 + Math.random() * 9000000).toString(); // 8-digit random ID
        newIds.add(randomId);
      }
      setUsers([...newIds][0]);
      console.log("Generated IDs:", [...newIds]);
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
                        <td className="border border-gray-300 p-2">{user.id}</td>
                        <td className="border border-gray-300 p-2">{user.first_name} {user.last_name}</td>
                        <td className="border border-gray-300 p-2">{user.address}</td>
                        <td className="border border-gray-300 p-2">{user.phone}</td>
                        <td className="border border-gray-300 p-2">{user.sex}</td>
                        <td className="border border-gray-300 p-2">{user.status}</td>
                        <td className="border border-gray-300 p-2">{user.validIdDoc}</td>
                        <td className="border border-gray-300 p-2">{user.role}</td>
                        <td className="border border-gray-300 p-2">{user.email}</td>
                        <td className="border border-gray-300 p-2">
                            <button className="bg-green-500 text-white px-4 py-2  rounded">Accept</button>
                            <button className="bg-red-500 text-white px-4 py-2 ml-1 rounded">Reject</button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                  
                </table>
            </div>
            <h2>Barangay Users Table</h2>
            <form className=" flex flex-col  justify-center">
                <label htmlFor="username">User ID: </label>
                <input type="text"  id="username"  className="border-2 border-black" value={users} disabled />
                <button    onClick={GenerateID} className="bg-blue-500 text-white">Generate User ID</button>
                <label htmlFor="password">Password: </label>
                <input type="password" id="password"  className="border-2 border-black"  placeholder=""/>
                <button type="submit" className="bg-blue-500 text-white">Create New Barangay User</button>
            </form>
        </div>

    );
}
 
export default admin;